import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Eye, Download, UserPlus, ArrowLeft, FileText, 
  Calendar, Clock, ShareNetwork, CheckCircle 
} from '@phosphor-icons/react'
import { 
  getMaterialByShareToken, 
  recordShareAccess, 
  canAccessShare 
} from '../../../services/sharingService'

const SharedMaterialPreview = () => {
  const { shareToken } = useParams()
  const navigate = useNavigate()
  
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [shareId, setShareId] = useState(null)
  const [accessRecorded, setAccessRecorded] = useState(false)

  useEffect(() => {
    if (shareToken) {
      loadSharedMaterial()
    }
  }, [shareToken])

  const loadSharedMaterial = async () => {
    try {
      setLoading(true)
      
      // Check if share is accessible
      const accessCheck = await canAccessShare(shareToken)
      if (!accessCheck.canAccess) {
        setError(accessCheck.reason || 'This share is not accessible')
        return
      }

      // Get material details
      const materialData = await getMaterialByShareToken(shareToken)
      if (!materialData) {
        setError('Material not found')
        return
      }

      setMaterial(materialData)
      setShareId(materialData.share_id)

      // Record view access
      if (!accessRecorded) {
        await recordShareAccess(materialData.share_id, 'view', null, null, navigator.userAgent)
        setAccessRecorded(true)
      }
    } catch (err) {
      console.error('Error loading shared material:', err)
      setError('Failed to load material')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!material || !shareId) return

    try {
      // Record download access
      await recordShareAccess(shareId, 'download', null, null, navigator.userAgent)
      
      // Trigger download (this would need to be implemented based on your file storage)
      alert('Download functionality would be implemented here')
    } catch (err) {
      console.error('Error downloading material:', err)
    }
  }

  const handleAddToCollection = () => {
    setShowSignupModal(true)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMaterialTypeStyle = (type) => {
    const styles = {
      pdf: { bg: '#FEF3C7', color: '#D97706', label: 'PDF' },
      docx: { bg: '#DBEAFE', color: '#2563EB', label: 'DOCX' },
      image: { bg: '#FEE2E2', color: '#DC2626', label: 'IMAGE' },
      video: { bg: '#FFEDD5', color: '#EA580C', label: 'VIDEO' },
      flashcard: { bg: '#F3E8FF', color: '#7C3AED', label: 'FLASHCARD' },
      podcast: { bg: '#D1FAE5', color: '#059669', label: 'PODCAST' },
      youtube: { bg: '#FEE2E2', color: '#DC2626', label: 'YOUTUBE' }
    }
    return styles[type] || { bg: '#F3F4F6', color: '#6B7280', label: type?.toUpperCase() }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: 40,
            height: 40,
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#6b7280', margin: 0 }}>Loading material...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: '#fef2f2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <ShareNetwork size={32} color="#ef4444" />
          </div>
          <h2 style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#111',
            marginBottom: '0.5rem'
          }}>
            Share Not Available
          </h2>
          <p style={{
            fontSize: 14,
            color: '#6b7280',
            marginBottom: '1.5rem',
            lineHeight: 1.5
          }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              background: '#8b5cf6',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Go to Luter
          </button>
        </div>
      </div>
    )
  }

  const typeStyle = getMaterialTypeStyle(material.file_type)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: 8,
                padding: '0.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <ArrowLeft size={20} color="white" />
            </button>
            <div>
              <h1 style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'white',
                margin: 0
              }}>
                Shared Material
              </h1>
              <p style={{
                fontSize: 12,
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0
              }}>
                Shared by {material.shared_by_name}
              </p>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              padding: '0.25rem 0.75rem',
              fontSize: 12,
              color: 'white',
              fontWeight: 500
            }}>
              Public Share
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {/* Material Header */}
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem'
              }}>
                {/* Material Icon */}
                <div style={{
                  width: 80,
                  height: 80,
                  background: typeStyle.bg,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={32} color={typeStyle.color} />
                </div>

                {/* Material Info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    <h2 style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#111',
                      margin: 0
                    }}>
                      {material.title}
                    </h2>
                    <div style={{
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      padding: '0.25rem 0.75rem',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {typeStyle.label}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    fontSize: 14,
                    color: '#6b7280'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <Calendar size={16} />
                      {formatDate(material.created_at)}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <FileText size={16} />
                      {formatFileSize(material.file_size)}
                    </div>
                  </div>

                  {material.description && (
                    <p style={{
                      fontSize: 14,
                      color: '#6b7280',
                      marginTop: '1rem',
                      lineHeight: 1.5
                    }}>
                      {material.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#111',
                marginBottom: '1rem'
              }}>
                Preview
              </h3>
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                padding: '2rem',
                textAlign: 'center',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div>
                  <FileText size={48} color="#9ca3af" />
                  <p style={{
                    fontSize: 14,
                    color: '#6b7280',
                    marginTop: '1rem'
                  }}>
                    Material preview would be displayed here
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <button
                onClick={handleDownload}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <Download size={16} />
                Download
              </button>

              <button
                onClick={handleAddToCollection}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
              >
                <UserPlus size={16} />
                Add to My Collection
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sign-up Modal */}
      {showSignupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowSignupModal(false)
          }
        }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              background: 'white',
              borderRadius: 16,
              maxWidth: '400px',
              width: '90%',
              padding: '2rem',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: 64,
              height: 64,
              background: '#d1fae5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <UserPlus size={32} color="#10b981" />
            </div>
            
            <h2 style={{
              fontSize: 20,
              fontWeight: 700,
              color: '#111',
              marginBottom: '0.5rem'
            }}>
              Add to Your Collection
            </h2>
            
            <p style={{
              fontSize: 14,
              color: '#6b7280',
              marginBottom: '1.5rem',
              lineHeight: 1.5
            }}>
              Sign up for a free Luter account to add "{material.title}" to your personal materials collection.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => navigate('/signup', { 
                  state: { 
                    shareToken,
                    materialId: material.material_id 
                  } 
                })}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Sign Up Free
              </button>
              
              <button
                onClick={() => navigate('/login', { 
                  state: { 
                    shareToken,
                    materialId: material.material_id 
                  } 
                })}
                style={{
                  background: 'white',
                  color: '#8b5cf6',
                  border: '1px solid #8b5cf6',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                I Already Have an Account
              </button>
            </div>

            <button
              onClick={() => setShowSignupModal(false)}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: 'none',
                padding: '0.5rem',
                fontSize: 12,
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Maybe Later
            </button>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default SharedMaterialPreview
