import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { 
  Folder, Plus, Trash2, Play, ArrowLeft, FileText, Video, Music, Image as ImageIcon, Search,
  Upload, Clock, Edit2
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useSessionStore } from '../../store/useSessionStore'
import { uploadMaterial } from '../../services/materialsService'
import Header from '../shared/Header'

export default function StudySessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { user, isMobile, sidebarCollapsed } = useOutletContext()
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [sortBy, setSortBy] = useState('name') // name, date, type

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
    const cacheKey = `luter:session:${sessionId}`
    const offline = typeof navigator !== 'undefined' && !navigator.onLine

    if (offline) {
      // Try localStorage cache first
      try {
        const raw = localStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw)
          setSession(cached)
          setActiveSession(cached)
          setLoading(false)
          return
        }
      } catch {}
      // Fallback to persisted sessions list from store
      const fromStore = sessions.find(s => s.id === sessionId)
      if (fromStore) {
        setSession(fromStore)
        setActiveSession(fromStore)
        setLoading(false)
        return
      }
    }

    try {
      const { data, error } = await supabase
        .from('deck_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      setSession(data)
      setActiveSession(data)
      try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch {}
    } catch (error) {
      console.error('Error loading session:', error)
      // Fallback to cache on any error
      try {
        const raw = localStorage.getItem(cacheKey)
        if (raw) {
          const cached = JSON.parse(raw)
          setSession(cached)
          setActiveSession(cached)
        }
      } catch {}
      const fromStore = sessions.find(s => s.id === sessionId)
      if (!session) {
        setSession(fromStore || null)
        setActiveSession(fromStore || null)
      }
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

  const handleAddMaterial = async (files) => {
    if (!files || !files.length || !user) return

    setIsUploading(true)
    setUploadProgress(0)
    setShowAddModal(false)

    const uploadedItems = []
    const totalFiles = files.length

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i]
      try {
        setUploadProgress(Math.round((i / totalFiles) * 100))
        
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

    setUploadProgress(100)

    // Add uploaded items to session
    for (const item of uploadedItems) {
      await addItemToSession(sessionId, item)
    }

    setTimeout(() => {
      setIsUploading(false)
      setUploadProgress(0)
      loadSession()
    }, 500)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    handleAddMaterial(files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    handleAddMaterial(files)
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

  const filteredItems = (session?.items || [])
    .filter(item =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title?.localeCompare(b.title)
        case 'date':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'type':
          return a.type?.localeCompare(b.type)
        default:
          return 0
      }
    })

  const formatMaterialDate = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Recently'
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: '#64748b' }}>Loading session...</div>
      </div>
    )
  }

  return (
    <div 
      className="dhd-root"
      style={{ 
        minHeight: '100vh',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header 
        showSearch={false}
        pageTitle={session?.session_name || "Study Session"}
        showCreateButton={false}
      />

      {/* Drag Overlay */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(139, 92, 246, 0.1)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #8b5cf6'
          }}
        >
          <div style={{ textAlign: 'center', color: '#8b5cf6' }}>
            <Upload size={48} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 18, fontWeight: 500, margin: 0 }}>
              Drop files here
            </p>
          </div>
        </div>
      )}

      <div>
        {/* Back Button */}
        <button 
          onClick={() => navigate('/dashboard/sessions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: 14,
            cursor: 'pointer',
            marginBottom: 24,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#111'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
        >
          <ArrowLeft size={18} />
          Back to Sessions
        </button>

        {/* Session Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            marginBottom: 24
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#7a12cc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0
            }}>
              <Folder size={24} />
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      outline: 'none',
                      flex: 1
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
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h1 style={{ 
                    fontSize: 24, 
                    fontWeight: 600, 
                    margin: 0,
                    color: '#111'
                  }}>
                    {session?.session_name || 'Study Session'}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: '#64748b',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16, 
                marginTop: 4
              }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  {session?.items?.length || 0} materials
                </span>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>
                  Created {new Date(session?.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDeleteSession}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  color: '#64748b',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Search and Actions Bar */}
          <div style={{ 
            display: 'flex', 
            gap: 12, 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search 
                size={18} 
                style={{ 
                  position: 'absolute', 
                  left: 12, 
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
                  padding: '10px 12px 10px 40px', 
                  borderRadius: 8, 
                  border: '1px solid #e2e8f0',
                  background: 'white',
                  fontSize: 14,
                  outline: 'none'
                }}
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: 'white',
                fontSize: 14,
                color: '#64748b',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="name">Name</option>
              <option value="date">Date</option>
              <option value="type">Type</option>
            </select>
            
            <label 
              style={{
                padding: '10px 16px',
                background: '#7a12cc',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Plus size={18} />
              Add
              <input type="file" multiple onChange={handleFileSelect} hidden />
            </label>

            {(session?.items?.length || 0) > 0 && (
              <button
                onClick={handleStartStudying}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Play size={18} />
                Study
              </button>
            )}
          </div>
        </div>

        {/* Materials Grid/List */}
        {filteredItems.length === 0 ? (
          <div
            style={{ 
              textAlign: 'center', 
              padding: 60, 
              color: '#64748b',
              background: 'white',
              borderRadius: 16,
              border: '2px dashed #e2e8f0'
            }}
          >
            <Folder size={48} style={{ 
              opacity: 0.3, 
              marginBottom: 16,
              color: '#7a12cc'
            }} />
            <h3 style={{ 
              fontSize: 18, 
              fontWeight: 600, 
              marginBottom: 8, 
              color: '#111'
            }}>
              {searchQuery ? 'No materials found' : 'Your session is empty'}
            </h3>
            <p style={{ 
              fontSize: 14, 
              marginBottom: 24,
              color: '#64748b'
            }}>
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Add materials to start studying'}
            </p>
            {!searchQuery && (
              <label
                style={{
                  padding: '12px 24px',
                  background: '#7a12cc',
                  color: 'white',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Plus size={18} />
                Add Material
                <input type="file" multiple onChange={handleFileSelect} hidden />
              </label>
            )}
          </div>
        ) : (
          <div
            style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '24px',
              width: '100%'
            }}
          >
            {filteredItems.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: 12,
                  padding: 16,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                  maxWidth: isMobile ? '100%' : '340px'
                }}
                onClick={() => navigate(`/dashboard/workstation?materialId=${item.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  marginBottom: 12
                }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      flexShrink: 0
                    }}
                  >
                    {getFileIcon(item.type)}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ 
                      fontSize: 14, 
                      fontWeight: 600, 
                      color: '#111', 
                      margin: '0 0 4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
                      <span>{item.type || 'Document'}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span>{formatMaterialDate(item.created_at)}</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveItem(item.id)
                    }}
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      borderRadius: 4
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#dc2626'
                      e.currentTarget.style.background = '#fee2e2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#94a3b8'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#94a3b8'
                }}>
                  <Clock size={12} />
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Just now'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Progress Modal */}
      {isUploading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '32px',
              borderRadius: 16,
              textAlign: 'center',
              minWidth: 320
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'white'
              }}
            >
              <Upload size={24} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: '#111' }}>
              Uploading...
            </h3>
            <div style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              {uploadProgress}%
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: 6,
              background: '#e2e8f0',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div
                style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: '#8b5cf6',
                  borderRadius: 3,
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
