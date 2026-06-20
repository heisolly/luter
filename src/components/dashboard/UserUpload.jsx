import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import { uploadMaterial, addYoutubeMaterial } from '../../services/materialsService'
import { preloadingService } from '../../services/preloadingService'
import { MaterialAnalysisService } from '../../services/materialAnalysisService'
import { clearPageCache } from '../../lib/offlineCache'
import { supabase } from '../../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeckStore } from '../../store/useDeckStore'
import { checkNetworkConnectivity, getNetworkInfo } from '../../utils/networkUtils'
import { 
  RiFileTextFill as FileText, RiLink as Link2, RiYoutubeFill as Youtube,
  RiLoader4Line as Loader2, RiCheckboxCircleFill as CheckCircle2, RiAlertFill as AlertCircle, 
  RiUploadCloudFill as UploadCloud, RiArrowLeftSLine as ChevronLeft, RiArrowRightLine as ArrowRight
} from 'react-icons/ri'

export default function UserUpload() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToDeck } = useDeckStore()
  
  const queryParams = new URLSearchParams(location.search)
  const preSelectedCourse = queryParams.get('course_id') || ''

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse)
  const [file, setFile] = useState(null)
  const [linkInput, setLinkInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [autoAddToDeck, setAutoAddToDeck] = useState(true)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('idle')
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user) return
    fetchUserCourses()
  }, [user])

  async function fetchUserCourses() {
    const { data } = await supabase
      .from('user_courses')
      .select('course_id, course:courses(id, name, code)')
      .eq('user_id', user.id)
    
    if (data) {
      const validCourses = data.filter(d => d.course).map(d => d.course)
      setCourses(validCourses)
    }
  }

  const handleUploadSubmit = async () => {
    setUploading(true)
    setStatus(null)
    setUploadProgress(0)
    setUploadStage('analyzing')

    try {
      let result = null
      let itemType = ''

      // Simulate progress stages
      const simulateProgress = async (stage, duration) => {
        setUploadStage(stage)
        for (let i = 0; i <= 100; i += 10) {
          setUploadProgress(i)
          await new Promise(resolve => setTimeout(resolve, duration / 10))
        }
      }

      if (file) {
        const ext = file.name.split('.').pop().toLowerCase()
        let type = 'pdf'
        if (['docx', 'doc'].includes(ext)) type = 'docx'
        else if (['pptx', 'ppt'].includes(ext)) type = 'pptx'
        else if (ext === 'apkg') type = 'anki'
        else if (['mp4', 'webm', 'mov'].includes(ext)) type = 'video'
        else if (['mp3', 'wav', 'm4a'].includes(ext)) type = 'audio'
        else if (['jpg', 'png', 'jpeg', 'webp'].includes(ext)) type = 'image'

        itemType = type
        
        // Check network connectivity before upload
        const networkInfo = getNetworkInfo()
        if (!networkInfo.online) {
          throw new Error('No internet connection. Please check your network and try again.')
        }
        
        // Check if we have a stable connection
        const isConnected = await checkNetworkConnectivity()
        if (!isConnected) {
          throw new Error('Network connection is unstable. Please check your internet connection and try again.')
        }
        
        console.log('Starting file upload with network info:', networkInfo)
        
        // Simulate gamified stages
        await simulateProgress('analyzing', 800)
        setUploadStage('processing')
        await simulateProgress('processing', 1200)
        setUploadStage('completing')
        await simulateProgress('completing', 500)
        
        result = await uploadMaterial({
          file, courseId: selectedCourse || null, userId: user.id,
          title: file.name, type: type
        })
      } else if (linkInput) {
        const isYoutube = linkInput.includes('youtube.com') || linkInput.includes('youtu.be')
        itemType = isYoutube ? 'youtube' : (linkInput.includes('docs.google.com') ? 'google_doc' : 'link')
        
        // Simulate gamified stages for links
        await simulateProgress('analyzing', 600)
        setUploadStage('processing')
        await simulateProgress('processing', 1000)
        setUploadStage('completing')
        await simulateProgress('completing', 400)
        
        if (isYoutube) {
          result = await addYoutubeMaterial({ 
            url: linkInput, courseId: selectedCourse || null, userId: user.id
          })
        } else {
          const { data, error } = await supabase.from('materials').insert({
             course_id: selectedCourse || null, user_id: user.id,
             title: linkInput, type: itemType,
             source_url: linkInput, owner_role: 'user', processing_status: 'ready'
          }).select().single()
          if (error) throw error
          result = data
        }
      }

      if (result) {
        // Automatically add to deck for immediate visibility in Workstation
        if (autoAddToDeck) {
          addToDeck({
            content_id: result.id,
            content_type: 'material',
            title: result.title,
            metadata: { type: itemType, course_id: selectedCourse || null }
          })
        }

        // Clear caches so the new material appears in lists immediately
        clearPageCache(user.id, 'materials')
        preloadingService.clearCache()
        
        // --- VIBRANT FLASHCARDS BACKGROUND GENERATION ---
        // Fire-and-forget: Start generating 20 flashcards instantly on successful upload!
        setTimeout(async () => {
          try {
            console.log(`[Auto-Gen] Starting background analysis for ${result.id}`);
            const initAnalysis = await MaterialAnalysisService.getOrCreateAnalysis(result.id, result, user.id);
            if (initAnalysis && initAnalysis.analysis) {
               console.log(`[Auto-Gen] Analysis ready, generating 20 flashcards...`);
               const fRes = await MaterialAnalysisService.generateFlashcards(initAnalysis.analysis, 20, result);
               if (fRes.success && fRes.flashcards) {
                  const newAnalysis = { ...initAnalysis.analysis, flashcards: fRes.flashcards };
                  await MaterialAnalysisService.saveAnalysisToSupabase(result.id, newAnalysis, user.id);
                  console.log(`[Auto-Gen] Successfully generated and saved 20 flashcards!`);
               }
            }
          } catch (bgError) {
            console.error("[Auto-Gen] Background flashcard generation failed:", bgError);
          }
        }, 1000); // 1s delay to let upload complete smoothly

        setStatus({ 
          type: 'success', 
          message: '🎉 Great! Your material has been added.',
          materialId: result.id 
        })
      }
    } catch (err) {
      console.error('Upload error:', err)
      
      let errorMessage = 'Upload failed. Please try again.'
      
      // Provide more specific error messages based on the error type
      if (err.message.includes('No internet connection')) {
        errorMessage = 'No internet connection. Please check your network and try again.'
      } else if (err.message.includes('unstable')) {
        errorMessage = 'Network connection is unstable. Please check your connection and try again.'
      } else if (err.message.includes('Failed to upload file')) {
        errorMessage = 'File upload failed. Please check the file and try again.'
      } else if (err.message.includes('Failed to save material')) {
        errorMessage = 'Database error. Please try again in a moment.'
      } else if (err.message.includes('mime type') || err.message.includes('MIME type')) {
        errorMessage = 'File type not supported. Please try a different file format.'
      } else if (err.message.includes('timeout') || err.message.includes('Timeout')) {
        errorMessage = 'Upload timed out. Please check your connection and try again.'
      } else if (err.message.includes('ERR_NAME_NOT_RESOLVED')) {
        errorMessage = 'Cannot connect to server. Please check your internet connection.'
      } else if (err.message.includes('ERR_NETWORK_CHANGED')) {
        errorMessage = 'Network connection changed. Please try again.'
      } else if (err.message.includes('ERR_CERT_COMMON_NAME_INVALID')) {
        errorMessage = 'Security certificate error. Please try again or contact support.'
      }
      
      setStatus({ type: 'error', message: errorMessage })
    } finally {
      setUploading(false)
      setUploadStage('idle')
      setUploadProgress(0)
    }
  }

  const hasContent = file || linkInput.length > 0

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: 'white',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: 0,
            color: '#111'
          }}>
            Add Study Materials
          </h1>
        </div>

        {/* Upload Options */}
        <div style={{
          display: 'grid',
          gap: '1.5rem'
        }}>
          {/* Files Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111'
            }}>
              📁 Upload Files
            </h2>
            
            <div style={{
              border: '2px dashed #d1d5db',
              borderRadius: '12px',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]) }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#8b5cf6'
              e.currentTarget.style.background = '#faf5ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.background = 'white'
            }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                hidden 
                onChange={e => e.target.files[0] && setFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.apkg,.mp4,.webm,.mov,.mp3,.wav,.m4a,.jpg,.png,.jpeg,.webp"
              />
              
              {file ? (
                <div>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    background: '#8b5cf6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <FileText size={32} color="white" />
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem',
                    color: '#111'
                  }}>
                    {file.name}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: '0 0 1rem'
                  }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <UploadCloud size={24} color="#6b7280" />
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    margin: '0 0 0.5rem',
                    color: '#111'
                  }}>
                    Drop files here or click to browse
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    margin: '0 0 1.5rem',
                    lineHeight: 1.5
                  }}>
                    PDF • PowerPoint • Word documents • Anki decks<br/>
                    Audio files • Video files • Images
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Links Section */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111'
            }}>
              🔗 Paste any link here
            </h2>
            
            <input
              type="text"
              placeholder="https://youtube.com/watch?v=... or https://docs.google.com/..."
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8b5cf6'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            
            <p style={{
              fontSize: '0.875rem',
              color: '#64748b',
              margin: '0.5rem 0 0 0'
            }}>
              YouTube videos • Websites • Google Docs • Any webpage
            </p>
          </div>

          {/* Course Selection */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              margin: '0 0 1rem 0',
              color: '#111'
            }}>
              📂 Choose Folder (Optional)
            </h2>
            
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '1rem',
                background: 'white',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">No folder - Save to Backpack root</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
            
            <p style={{
              fontSize: '0.875rem',
              color: '#64748b',
              margin: '0.5rem 0 0 0'
            }}>
              Leave blank to keep materials in your Backpack root
            </p>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUploadSubmit}
            disabled={uploading || !hasContent}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              background: uploading ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: (uploading || !hasContent) ? 0.6 : 1
            }}
          >
            {uploading ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud size={20} />
                Add Material
              </>
            )}
          </button>

          {/* Progress */}
          {uploading && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="#8b5cf6" />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#111',
                    marginBottom: '0.25rem'
                  }}>
                    {uploadStage === 'analyzing' && 'Reading your file...'}
                    {uploadStage === 'processing' && 'Creating study materials...'}
                    {uploadStage === 'completing' && 'Almost done...'}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}>
                    {uploadProgress}% complete
                  </div>
                </div>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: '#f1f5f9',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  style={{
                    height: '100%',
                    background: '#8b5cf6',
                    borderRadius: '3px'
                  }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          <AnimatePresence>
            {status && status.type === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start'
                }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#166534',
                      marginBottom: '0.5rem'
                    }}>
                      🎉 Great! Your material has been added.
                    </div>
                    {status.materialId && (
                      <button
                        onClick={() => navigate(`/dashboard/workstation?materialId=${status.materialId}`)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#8b5cf6',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        Start studying <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {status && status.type === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start'
                }}>
                  <AlertCircle size={20} color="#dc2626" />
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#991b1b'
                  }}>
                    {status.message}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

