import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiFolderOpenFill as Folder, RiAddLine as Plus, RiDeleteBin6Fill as Trash2,
  RiPlayFill as Play, RiArrowLeftLine as ArrowLeft, RiFileTextFill as FileText,
  RiVideoFill as Video, RiMusicFill as Music, RiImageFill as ImageIcon, RiSearchLine as Search,
  RiMore2Fill as More, RiCloseLine as X, RiUploadLine as Upload
} from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { useSessionStore } from '../../store/useSessionStore'
import { uploadMaterial } from '../../services/materialsService'

export default function StudySessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const { 
    sessions, 
    loadSessions, 
    addItemToSession, 
    removeItemFromSession,
    deleteSession,
    updateSession,
    setActiveSession
  } = useSessionStore()
  
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (sessionId) {
      loadSession()
    }
  }, [sessionId])

  useEffect(() => {
    if (session) {
      setSessionName(session.session_name)
    }
  }, [session])

  const loadSession = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('deck_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      setSession(data)
      setActiveSession(data)
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async () => {
    if (!sessionName.trim()) return
    await updateSession(sessionId, { session_name: sessionName })
    setIsEditing(false)
    loadSession()
  }

  const handleDeleteSession = async () => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      await deleteSession(sessionId)
      navigate('/dashboard')
    }
  }

  const handleAddMaterial = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length || !user) return

    setIsUploading(true)
    setShowAddModal(false)

    const uploadedItems = []
    for (const file of files) {
      try {
        const ext = file.name.split('.').pop().toLowerCase()
        let type = 'pdf'
        if (['docx', 'doc'].includes(ext)) type = 'docx'
        else if (['pptx', 'ppt'].includes(ext)) type = 'pptx'
        else if (['mp4', 'webm', 'mov'].includes(ext)) type = 'video'
        else if (['mp3', 'wav', 'm4a'].includes(ext)) type = 'audio'
        else if (['jpg', 'png', 'jpeg', 'webp'].includes(ext)) type = 'image'

        const result = await uploadMaterial({
          file,
          courseId: null,
          userId: user.id,
          title: file.name,
          type,
          week: 1
        })

        if (result?.id) {
          uploadedItems.push({
            id: result.id,
            title: result.title || file.name,
            type,
            url: result.source_url
          })
        }
      } catch (err) {
        console.error('[Session] Upload failed:', err)
      }
    }

    // Add uploaded items to session
    for (const item of uploadedItems) {
      await addItemToSession(sessionId, item)
    }

    setIsUploading(false)
    loadSession()
  }

  const handleRemoveItem = async (itemId) => {
    await removeItemFromSession(sessionId, itemId)
    loadSession()
  }

  const handleStartStudying = () => {
    const items = session?.items || []
    if (items.length === 0) return
    
    // Navigate to workstation with the first material
    if (items[0].id) {
      navigate(`/dashboard/workstation?materialId=${items[0].id}`)
    }
  }

  const getFileIcon = (type) => {
    if (type?.includes('pdf')) return <FileText size={20} />
    if (type?.includes('image')) return <ImageIcon size={20} />
    if (type?.includes('video')) return <Video size={20} />
    if (type?.includes('audio')) return <Music size={20} />
    return <FileText size={20} />
  }

  const filteredItems = (session?.items || []).filter(item =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#64748b' }}>Loading session...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      maxWidth: 1000, 
      margin: '0 auto', 
      padding: isMobile ? '20px' : '40px',
      fontFamily: "'Outfit', 'Varela Round', sans-serif"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            color: '#64748b',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: 24,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#7a12cc'
            e.target.style.color = '#7a12cc'
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#e2e8f0'
            e.target.style.color = '#64748b'
          }}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 28,
            flexShrink: 0,
            boxShadow: '0 8px 24px rgba(122, 18, 204, 0.3)'
          }}>
            <Folder size={32} />
          </div>
          
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    padding: '8px 16px',
                    borderRadius: 12,
                    border: '2px solid #e2e8f0',
                    fontFamily: "'Outfit', sans-serif",
                    outline: 'none'
                  }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') {
                      setIsEditing(false)
                      setSessionName(session.session_name)
                    }
                  }}
                />
                <button
                  onClick={handleSaveName}
                  style={{
                    padding: '8px 16px',
                    background: '#7a12cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
              </div>
            ) : (
              <h1 style={{ 
                fontSize: 32, 
                fontWeight: 900, 
                margin: 0,
                color: '#111',
                letterSpacing: '-0.02em'
              }}>
                {session?.session_name || 'Study Session'}
              </h1>
            )}
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                {session?.items?.length || 0} materials
              </span>
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                •
              </span>
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                {new Date(session?.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: '10px 16px',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: 10,
                color: '#64748b',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#e2e8f0'}
              onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}
            >
              {isEditing ? 'Cancel' : 'Rename'}
            </button>
            <button
              onClick={handleDeleteSession}
              style={{
                padding: '10px 16px',
                background: '#fef2f2',
                border: 'none',
                borderRadius: 10,
                color: '#dc2626',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#fee2e2'}
              onMouseLeave={(e) => e.target.style.background = '#fef2f2'}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Search and Actions */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search 
              size={18} 
              style={{ 
                position: 'absolute', 
                left: 16, 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: '#94a3b8' 
              }} 
            />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..." 
              style={{ 
                width: '100%', 
                padding: '12px 20px 12px 48px', 
                borderRadius: 12, 
                border: '2px solid #e2e8f0',
                background: '#f8fafc',
                fontSize: 15,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#7a12cc'
                e.target.style.background = 'white'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0'
                e.target.style.background = '#f8fafc'
              }}
            />
          </div>
          
          <label 
            style={{
              padding: '12px 20px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#6a0fb8'}
            onMouseLeave={(e) => e.target.style.background = '#7a12cc'}
          >
            <Upload size={18} />
            Add Materials
            <input type="file" multiple onChange={handleAddMaterial} hidden />
          </label>

          {(session?.items?.length || 0) > 0 && (
            <button
              onClick={handleStartStudying}
              style={{
                padding: '12px 24px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10b981'}
            >
              <Play size={18} />
              Start Studying
            </button>
          )}
        </div>
      </div>

      {/* Materials List */}
      {filteredItems.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 100, 
          color: '#94a3b8',
          background: '#f8fafc',
          borderRadius: 24,
          border: '2px dashed #e2e8f0'
        }}>
          <Folder size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, color: '#111' }}>
            {searchQuery ? 'No materials found' : 'No materials yet'}
          </h3>
          <p style={{ fontSize: 16, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
            {searchQuery 
              ? 'Try a different search term' 
              : 'Add materials to this session to start studying'}
          </p>
          {!searchQuery && (
            <label 
              style={{
                padding: '16px 32px',
                background: '#7a12cc',
                color: 'white',
                border: 'none',
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10
              }}
            >
              <Upload size={20} />
              Add Your First Material
              <input type="file" multiple onChange={handleAddMaterial} hidden />
            </label>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 20,
                border: '1.5px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/dashboard/workstation?materialId=${item.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#e9d5ff'
                e.currentTarget.style.transform = 'translateX(4px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#f1f5f9'
                e.currentTarget.style.transform = 'translateX(0)'
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: item.type === 'youtube' ? '#fef2f2' : '#f0f9ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7a12cc',
                flexShrink: 0
              }}>
                {getFileIcon(item.type)}
              </div>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                  fontSize: 16, 
                  fontWeight: 700, 
                  color: '#111', 
                  margin: '0 0 4px',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {item.title}
                </h3>
                <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                  {item.type?.toUpperCase() || 'DOCUMENT'}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveItem(item.id)
                }}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  borderRadius: 8,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#fee2e2'
                  e.target.style.color = '#dc2626'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.color = '#94a3b8'
                }}
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 32px,
            borderRadius: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              Uploading materials...
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              Please wait
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
