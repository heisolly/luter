import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import { uploadMaterial, addYoutubeMaterial } from '../../services/materialsService'
import { supabase } from '../../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { useDeckStore } from '../../store/useDeckStore'
import { checkNetworkConnectivity, getNetworkInfo } from '../../utils/networkUtils'
import { 
  RiFileTextFill as FileText, RiLink as Link2, RiYoutubeFill as Youtube,
  RiLoader4Line as Loader2, RiCheckboxCircleFill as CheckCircle2, RiAlertFill as AlertCircle, 
  RiUploadCloudFill as UploadCloud, RiArrowLeftSLine as ChevronLeft, RiMagicFill as Sparkles,
  RiStackFill as Stack, RiArrowRightLine as ArrowRight, RiInformationFill as Info
} from 'react-icons/ri'

export default function UserUpload() {
  const { user } = useOutletContext()
  const navigate = useNavigate()
  const location = useLocation()
  const { addToDeck } = useDeckStore()
  
  const queryParams = new URLSearchParams(location.search)
  const preSelectedCourse = queryParams.get('course_id') || ''
  const preSelectedWeek = queryParams.get('week') ? parseInt(queryParams.get('week')) : null

  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(preSelectedCourse)
  const [file, setFile] = useState(null)
  const [linkInput, setLinkInput] = useState('')
  const [textNote, setTextNote] = useState('')
  const [activeInputTab, setActiveInputTab] = useState('files')
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(null)
  const [autoAddToDeck, setAutoAddToDeck] = useState(true)
  
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

    try {
      let result = null
      let itemType = ''

      if (activeInputTab === 'files' && file) {
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
        result = await uploadMaterial({
          file, courseId: selectedCourse || null, userId: user.id,
          title: file.name, type: type, week: preSelectedWeek || 1
        })
      } else if (activeInputTab === 'links' && linkInput) {
        const isYoutube = linkInput.includes('youtube.com') || linkInput.includes('youtu.be')
        itemType = isYoutube ? 'youtube' : (linkInput.includes('docs.google.com') ? 'google_doc' : 'link')
        
        if (isYoutube) {
          result = await addYoutubeMaterial({ 
            url: linkInput, courseId: selectedCourse || null, userId: user.id, week: preSelectedWeek || 1
          })
        } else {
          const { data, error } = await supabase.from('materials').insert({
             course_id: selectedCourse || null, user_id: user.id,
             title: linkInput, type: itemType,
             source_url: linkInput, owner_role: 'user', processing_status: 'ready', week_number: preSelectedWeek || 1
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

        setStatus({ 
          type: 'success', 
          message: 'Resource synced to your vault.',
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
    }
  }

  const hasContent = (activeInputTab === 'files' && file) || 
                    (activeInputTab === 'links' && linkInput.length > 0)

  return (
    <div className="ingest-studio" style={studioStyles}>
      
      {/* ── HEADER ── */}
      <header style={headerStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button 
            onClick={() => navigate(-1)}
            style={backBtnStyles}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={titleStyles}>Ingestion Studio</h1>
            <p style={subtitleStyles}>Nebula Resource Management // Protocol 2.4</p>
          </div>
        </div>

        <div style={badgeStyles}>
          <Sparkles size={14} /> ACTIVE ENCRYPTION
        </div>
      </header>

      <div style={gridStyles}>
        
        {/* ── MAIN AREA ── */}
        <div style={mainAreaStyles}>
          
          {/* Tabs */}
          <div style={tabContainerStyles}>
            {[
              { id: 'files', label: 'Local Files', icon: FileText, desc: 'PDF, DOCX, PPTX' },
              { id: 'links', label: 'Web Resources', icon: Link2, desc: 'URL, YouTube, Docs' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveInputTab(tab.id)}
                style={{
                  ...tabBtnStyles,
                  background: activeInputTab === tab.id ? 'white' : 'transparent',
                  boxShadow: activeInputTab === tab.id ? '0 10px 25px rgba(0,0,0,0.05)' : 'none',
                  border: activeInputTab === tab.id ? '1px solid #eee' : '1px solid transparent',
                }}
              >
                <div style={{
                  ...tabIconStyles,
                  background: activeInputTab === tab.id ? '#7a12cc' : '#f8f9fa',
                  color: activeInputTab === tab.id ? 'white' : '#64748b',
                }}>
                  <tab.icon size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ ...tabLabelStyles, color: activeInputTab === tab.id ? '#111' : '#64748b' }}>{tab.label}</div>
                  <div style={tabDescStyles}>{tab.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Dropzone / Input */}
          <div style={contentCardStyles}>
            <AnimatePresence mode="wait">
              {activeInputTab === 'files' ? (
                <motion.div 
                  key="files"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{ height: '100%' }}
                >
                  <div 
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]) }}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      ...dropzoneStyles,
                      borderColor: file ? '#7a12cc' : '#e5e7eb',
                      background: file ? 'rgba(122, 18, 204, 0.02)' : 'transparent'
                    }}
                  >
                    <input type="file" ref={fileInputRef} hidden onChange={e => e.target.files[0] && setFile(e.target.files[0])} />
                    {file ? (
                      <div style={fileInfoStyles}>
                        <div style={fileIconContainer}>
                          <FileText size={40} />
                          <div style={fileCheckBadge}><CheckCircle2 size={16} /></div>
                        </div>
                        <h3 style={fileNameStyles}>{file.name}</h3>
                        <p style={fileSizeStyles}>{(file.size / 1024 / 1024).toFixed(2)} MB • READY FOR COMMIT</p>
                        <button onClick={e => { e.stopPropagation(); setFile(null) }} style={discardBtnStyles}>Discard and replace</button>
                      </div>
                    ) : (
                      <div style={emptyStateStyles}>
                        <div style={uploadIconStyles}>
                          <UploadCloud size={32} />
                        </div>
                        <h3 style={uploadTitleStyles}>Drop material here</h3>
                        <p style={uploadDescStyles}>or click to browse your workstation</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="links"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={linkInputAreaStyles}
                >
                  <div style={linkIconBox}>
                    <Youtube size={24} color="#ff0000" />
                    <Stack size={20} color="#7a12cc" />
                  </div>
                  <h3 style={inputTitleStyles}>Resource URL</h3>
                  <p style={inputDescStyles}>Paste a link to a YouTube video, Google Doc, or any web resource.</p>
                  
                  <div style={inputWrapperStyles}>
                    <input 
                      type="text" 
                      placeholder="https://..."
                      value={linkInput} 
                      onChange={e => setLinkInput(e.target.value)}
                      style={inputStyles}
                    />
                    <div style={inputGlow}></div>
                  </div>

                  <div style={tipBoxStyles}>
                    <Info size={16} color="#7a12cc" />
                    <span>Luter AI will automatically crawl and index the content.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <aside style={sidebarStyles}>
          <div style={configCardStyles}>
            <h4 style={configTitleStyles}>CONFIGURATION</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={controlGroupStyles}>
                <label style={controlLabelStyles}>CONTEXTUAL ARCHIVE</label>
                <div style={selectWrapperStyles}>
                  <select 
                    value={selectedCourse} 
                    onChange={e => setSelectedCourse(e.target.value)}
                    style={selectStyles}
                  >
                    <option value="">Personal Vault (Standalone)</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCourse && (
                <div style={controlGroupStyles}>
                  <label style={controlLabelStyles}>SYLLABUS WEEK</label>
                  <div style={weekGridStyles}>
                    {[1,2,3,4,5,6,7,8].map(w => (
                      <button 
                        key={w}
                        className={preSelectedWeek === w ? 'active' : ''}
                        style={{
                          ...weekBtnStyles,
                          background: preSelectedWeek === w ? '#7a12cc' : 'white',
                          color: preSelectedWeek === w ? 'white' : '#64748b',
                          borderColor: preSelectedWeek === w ? '#7a12cc' : '#eee',
                        }}
                      >
                        W{w}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={toggleRowStyles}>
                <div style={{ flex: 1 }}>
                  <div style={toggleLabelStyles}>Auto-add to Deck</div>
                  <div style={toggleDescStyles}>Immediate workstation access</div>
                </div>
                <button 
                  onClick={() => setAutoAddToDeck(!autoAddToDeck)}
                  style={{
                    ...toggleSwitchStyles,
                    background: autoAddToDeck ? '#7a12cc' : '#e2e8f0'
                  }}
                >
                  <motion.div 
                    animate={{ x: autoAddToDeck ? 20 : 2 }}
                    style={toggleThumbStyles} 
                  />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleUploadSubmit}
            disabled={uploading || !hasContent}
            style={{
              ...commitBtnStyles,
              opacity: (uploading || !hasContent) ? 0.6 : 1,
              transform: uploading ? 'scale(0.98)' : 'none'
            }}
          >
            {uploading ? <Loader2 style={spinAnim} size={20} /> : <Stack size={20} />}
            {uploading ? 'INGESTING...' : 'COMMIT TO VAULT'}
          </button>

          <AnimatePresence>
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  ...statusBoxStyles,
                  background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                  borderColor: status.type === 'success' ? '#bbf7d0' : '#fecaca',
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  {status.type === 'success' ? <CheckCircle2 color="#16a34a" size={18} /> : <AlertCircle color="#dc2626" size={18} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ ...statusTextStyles, color: status.type === 'success' ? '#166534' : '#991b1b' }}>{status.message}</div>
                    {status.type === 'success' && (
                      <button 
                        onClick={() => navigate(`/dashboard/workstation?materialId=${status.materialId}`)}
                        style={successActionBtn}
                      >
                        Open in Workstation <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .ingest-studio select { -webkit-appearance: none; -moz-appearance: none; appearance: none; }
      `}</style>
    </div>
  )
}

// ── STYLES ──

const studioStyles = {
  maxWidth: '1100px',
  margin: '0 auto',
  padding: '60px 40px',
  minHeight: '100%',
  fontFamily: "'Outfit', sans-serif"
}

const headerStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '60px'
}

const backBtnStyles = {
  width: '48px',
  height: '48px',
  borderRadius: '16px',
  border: '1px solid #eee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#64748b',
  background: 'white',
  cursor: 'pointer',
  transition: 'all 0.2s',
}

const titleStyles = {
  fontSize: '32px',
  fontWeight: 900,
  margin: 0,
  letterSpacing: '-0.04em',
  color: '#0f172a'
}

const subtitleStyles = {
  fontSize: '11px',
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  marginTop: '4px'
}

const badgeStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  background: '#f8fafc',
  border: '1px solid #f1f5f9',
  borderRadius: '99px',
  fontSize: '10px',
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.05em'
}

const gridStyles = {
  display: 'grid',
  gridTemplateColumns: '1fr 380px',
  gap: '40px',
  alignItems: 'start'
}

const mainAreaStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '32px'
}

const tabContainerStyles = {
  display: 'flex',
  gap: '12px',
  padding: '8px',
  background: '#f1f5f9',
  borderRadius: '24px',
  border: '1px solid #e2e8f0'
}

const tabBtnStyles = {
  flex: 1,
  padding: '12px 20px',
  borderRadius: '18px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}

const tabIconStyles = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s'
}

const tabLabelStyles = {
  fontSize: '14px',
  fontWeight: 800,
}

const tabDescStyles = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#94a3b8',
  marginTop: '2px'
}

const contentCardStyles = {
  background: 'white',
  border: '1px solid #f1f5f9',
  borderRadius: '32px',
  height: '480px',
  overflow: 'hidden',
  boxShadow: '0 20px 50px rgba(0,0,0,0.03)',
  position: 'relative'
}

const dropzoneStyles = {
  height: '100%',
  border: '2px dashed #e5e7eb',
  borderRadius: '32px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s',
  padding: '40px'
}

const emptyStateStyles = {
  textAlign: 'center'
}

const uploadIconStyles = {
  width: '80px',
  height: '80px',
  background: '#f8fafc',
  borderRadius: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#cbd5e1',
  margin: '0 auto 24px',
  transition: 'all 0.3s'
}

const uploadTitleStyles = {
  fontSize: '20px',
  fontWeight: 800,
  color: '#1e293b',
  margin: '0 0 8px 0'
}

const uploadDescStyles = {
  fontSize: '14px',
  color: '#94a3b8',
  fontWeight: 500
}

const fileInfoStyles = {
  textAlign: 'center'
}

const fileIconContainer = {
  width: '100px',
  height: '100px',
  background: 'rgba(122, 18, 204, 0.1)',
  color: '#7a12cc',
  borderRadius: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
  position: 'relative'
}

const fileCheckBadge = {
  position: 'absolute',
  bottom: '-5px',
  right: '-5px',
  width: '32px',
  height: '32px',
  background: '#16a34a',
  color: 'white',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px rgba(22, 163, 74, 0.3)'
}

const fileNameStyles = {
  fontSize: '20px',
  fontWeight: 900,
  color: '#0f172a',
  margin: '0 0 8px 0',
  maxWidth: '400px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}

const fileSizeStyles = {
  fontSize: '12px',
  fontWeight: 800,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.1em'
}

const discardBtnStyles = {
  marginTop: '32px',
  padding: '8px 20px',
  background: 'white',
  border: '1px solid #fee2e2',
  color: '#ef4444',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const linkInputAreaStyles = {
  padding: '60px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center'
}

const linkIconBox = {
  display: 'flex',
  gap: '12px',
  marginBottom: '24px'
}

const inputTitleStyles = {
  fontSize: '22px',
  fontWeight: 900,
  color: '#0f172a',
  margin: '0 0 8px 0'
}

const inputDescStyles = {
  fontSize: '14px',
  color: '#64748b',
  fontWeight: 500,
  lineHeight: 1.6,
  marginBottom: '40px'
}

const inputWrapperStyles = {
  position: 'relative',
}

const inputStyles = {
  width: '100%',
  padding: '24px 32px',
  borderRadius: '24px',
  border: '2px solid #f1f5f9',
  fontSize: '16px',
  fontWeight: 700,
  color: '#1e293b',
  background: '#f8fafc',
  outline: 'none',
  transition: 'all 0.3s',
  position: 'relative',
  zIndex: 1
}

const inputGlow = {
  position: 'absolute',
  inset: '-2px',
  borderRadius: '26px',
  background: 'linear-gradient(135deg, #7a12cc, #7180FE)',
  opacity: 0,
  transition: 'opacity 0.3s',
  zIndex: 0
}

const tipBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginTop: '32px',
  padding: '16px 20px',
  background: 'rgba(122, 18, 204, 0.03)',
  borderRadius: '16px',
  fontSize: '13px',
  color: '#7a12cc',
  fontWeight: 600
}

const sidebarStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
}

const configCardStyles = {
  background: 'white',
  border: '1px solid #f1f5f9',
  borderRadius: '32px',
  padding: '32px',
  boxShadow: '0 20px 50px rgba(0,0,0,0.03)'
}

const configTitleStyles = {
  fontSize: '11px',
  fontWeight: 900,
  color: '#94a3b8',
  letterSpacing: '0.2em',
  margin: '0 0 32px 0'
}

const controlGroupStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px'
}

const controlLabelStyles = {
  fontSize: '11px',
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.05em'
}

const selectWrapperStyles = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
}

const selectStyles = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: '16px',
  border: '1px solid #eee',
  background: '#f8fafc',
  fontSize: '14px',
  fontWeight: 700,
  color: '#1e293b',
  outline: 'none',
  cursor: 'pointer'
}

const weekGridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '8px'
}

const weekBtnStyles = {
  height: '40px',
  borderRadius: '10px',
  border: '1px solid #eee',
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s'
}

const toggleRowStyles = {
  display: 'flex',
  alignItems: 'center',
  paddingTop: '24px',
  borderTop: '1px solid #f1f5f9'
}

const toggleLabelStyles = {
  fontSize: '14px',
  fontWeight: 800,
  color: '#1e293b'
}

const toggleDescStyles = {
  fontSize: '11px',
  fontWeight: 500,
  color: '#94a3b8'
}

const toggleSwitchStyles = {
  width: '44px',
  height: '24px',
  borderRadius: '20px',
  padding: '2px',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.3s',
  display: 'flex',
  alignItems: 'center'
}

const toggleThumbStyles = {
  width: '20px',
  height: '20px',
  background: 'white',
  borderRadius: '50%',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
}

const commitBtnStyles = {
  width: '100%',
  padding: '24px',
  borderRadius: '24px',
  background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
  color: 'white',
  border: 'none',
  fontSize: '15px',
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  cursor: 'pointer',
  boxShadow: '0 20px 40px rgba(122, 18, 204, 0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  letterSpacing: '0.05em'
}

const statusBoxStyles = {
  padding: '20px',
  borderRadius: '24px',
  border: '1px solid',
  marginTop: '8px'
}

const statusTextStyles = {
  fontSize: '13px',
  fontWeight: 800,
}

const successActionBtn = {
  marginTop: '12px',
  background: 'white',
  border: '1px solid rgba(0,0,0,0.05)',
  padding: '10px 16px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 800,
  color: '#7a12cc',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
}

const spinAnim = {
  animation: 'spin 1s linear infinite'
}

