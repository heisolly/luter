import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiFolderOpenFill as Folder, RiAddLine as Plus, RiDeleteBin6Fill as Trash2,
  RiPlayFill as Play, RiArrowLeftLine as ArrowLeft, RiFileTextFill as FileText,
  RiVideoFill as Video, RiMusicFill as Music, RiImageFill as ImageIcon, RiSearchLine as Search,
  RiMore2Fill as More, RiCloseLine as X, RiUploadLine as Upload, RiDragDropLine,
  RiTimeLine as Clock, RiBook2Fill as Book, RiSparklingFill as Sparkle
} from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { useSessionStore } from '../../store/useSessionStore'
import { uploadMaterial } from '../../services/materialsService'
import Header from '../shared/Header'

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

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 16, color: '#64748b' }}>Loading session...</div>
      </div>
    )
  }

  return (
    <div 
      style={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%)',
        fontFamily: "'Outfit', 'Varela Round', sans-serif"
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Header 
        showSearch={false}
        pageTitle={session?.session_name || "Study Session"}
        showCreateButton={true}
        createButtonPath="/dashboard/upload"
      />
      {/* Drag Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(122, 18, 204, 0.1)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px dashed #7a12cc'
            }}
          >
            <div style={{ textAlign: 'center', color: '#7a12cc' }}>
              <RiDragDropLine size={64} style={{ margin: '0 auto 16px' }} />
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
                Drop files here to add to session
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: isMobile ? '20px' : '40px'
      }}>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 40 }}
        >
          <button 
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'white',
              border: '2px solid #e9d5ff',
              borderRadius: 16,
              color: '#7a12cc',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 32,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 12px rgba(122, 18, 204, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#7a12cc'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(122, 18, 204, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.color = '#7a12cc'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(122, 18, 204, 0.1)'
            }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: 24, 
            marginBottom: 32,
            flexWrap: 'wrap'
          }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #7a12cc, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 32,
                flexShrink: 0,
                boxShadow: '0 12px 32px rgba(122, 18, 204, 0.4)',
                position: 'relative'
              }}
            >
              <Folder size={40} />
              <div style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white'
              }}>
                <Sparkle size={12} />
              </div>
            </motion.div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    style={{
                      fontSize: 36,
                      fontWeight: 900,
                      padding: '12px 24px',
                      borderRadius: 16,
                      border: '3px solid #e9d5ff',
                      background: 'white',
                      fontFamily: "'Outfit', sans-serif",
                      outline: 'none',
                      boxShadow: '0 8px 24px rgba(122, 18, 204, 0.1)',
                      minWidth: 300
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
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveName}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #7a12cc, #a855f7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 16,
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(122, 18, 204, 0.3)'
                    }}
                  >
                    Save
                  </motion.button>
                </motion.div>
              ) : (
                <motion.h1 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ 
                    fontSize: 36, 
                    fontWeight: 900, 
                    margin: 0,
                    color: '#111',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2
                  }}
                >
                  {session?.session_name || 'Study Session'}
                </motion.h1>
              )}
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 20, 
                marginTop: 16,
                flexWrap: 'wrap'
              }}>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    padding: '8px 16px',
                    background: 'white',
                    borderRadius: 12,
                    border: '1px solid #e9d5ff'
                  }}
                >
                  <Book size={16} style={{ color: '#7a12cc' }} />
                  <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                    {session?.items?.length || 0} materials
                  </span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    padding: '8px 16px',
                    background: 'white',
                    borderRadius: 12,
                    border: '1px solid #e9d5ff'
                  }}
                >
                  <Clock size={16} style={{ color: '#7a12cc' }} />
                  <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>
                    {new Date(session?.created_at).toLocaleDateString()}
                  </span>
                </motion.div>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  border: '2px solid #e9d5ff',
                  borderRadius: 16,
                  color: '#7a12cc',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(122, 18, 204, 0.1)'
                }}
              >
                {isEditing ? 'Cancel' : 'Rename'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDeleteSession}
                style={{
                  padding: '12px 20px',
                  background: 'white',
                  border: '2px solid #fecaca',
                  borderRadius: 16,
                  color: '#dc2626',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)'
                }}
              >
                Delete
              </motion.button>
            </motion.div>
          </div>

          {/* Search and Actions Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ 
              display: 'flex', 
              gap: 16, 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 300 }}>
              <Search 
                size={20} 
                style={{ 
                  position: 'absolute', 
                  left: 20, 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#a855f7' 
                }} 
              />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search materials..." 
                style={{ 
                  width: '100%', 
                  padding: '16px 24px 16px 56px', 
                  borderRadius: 20, 
                  border: '2px solid #e9d5ff',
                  background: 'white',
                  fontSize: 16,
                  fontWeight: 500,
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(122, 18, 204, 0.1)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7a12cc'
                  e.target.style.boxShadow = '0 8px 24px rgba(122, 18, 204, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e9d5ff'
                  e.target.style.boxShadow = '0 4px 12px rgba(122, 18, 204, 0.1)'
                }}
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '16px 20px',
                borderRadius: 20,
                border: '2px solid #e9d5ff',
                background: 'white',
                fontSize: 14,
                fontWeight: 600,
                color: '#64748b',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(122, 18, 204, 0.1)'
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date</option>
              <option value="type">Sort by Type</option>
            </select>
            
            <motion.label 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #7a12cc, #a855f7)',
                color: 'white',
                border: 'none',
                borderRadius: 20,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(122, 18, 204, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(122, 18, 204, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(122, 18, 204, 0.3)'
              }}
            >
              <Upload size={20} />
              Add Materials
              <input type="file" multiple onChange={handleFileSelect} hidden />
            </motion.label>

            {(session?.items?.length || 0) > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartStudying}
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 20,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)'
                }}
              >
                <Play size={20} />
                Start Studying
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Materials Grid/List */}
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ 
                textAlign: 'center', 
                padding: 80, 
                color: '#64748b',
                background: 'white',
                borderRadius: 32,
                border: '3px dashed #e9d5ff',
                boxShadow: '0 8px 32px rgba(122, 18, 204, 0.1)'
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Folder size={64} style={{ 
                  opacity: 0.4, 
                  marginBottom: 24,
                  color: '#a855f7'
                }} />
              </motion.div>
              <h3 style={{ 
                fontSize: 24, 
                fontWeight: 800, 
                marginBottom: 16, 
                color: '#111',
                letterSpacing: '-0.02em'
              }}>
                {searchQuery ? 'No materials found' : 'Your session is empty'}
              </h3>
              <p style={{ 
                fontSize: 16, 
                marginBottom: 32, 
                maxWidth: 500, 
                margin: '0 auto 32px',
                lineHeight: 1.6
              }}>
                {searchQuery 
                  ? 'Try adjusting your search terms to find what you\'re looking for' 
                  : 'Add your first materials to this session to start your learning journey'}
              </p>
              {!searchQuery && (
                <motion.label
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '20px 40px',
                    background: 'linear-gradient(135deg, #7a12cc, #a855f7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 20,
                    fontSize: 18,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 12,
                    boxShadow: '0 12px 32px rgba(122, 18, 204, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 16px 40px rgba(122, 18, 204, 0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(122, 18, 204, 0.4)'
                  }}
                >
                  <Upload size={24} />
                  Add Your First Material
                  <input type="file" multiple onChange={handleFileSelect} hidden />
                </motion.label>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="materials"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : '1fr',
                gap: 20
              }}
            >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                  whileHover={{ 
                    y: -4,
                    boxShadow: '0 16px 40px rgba(122, 18, 204, 0.2)'
                  }}
                  style={{
                    background: 'white',
                    borderRadius: 24,
                    padding: 24,
                    border: '2px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => navigate(`/dashboard/workstation?materialId=${item.id}`)}
                >
                  {/* Gradient overlay on hover */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #7a12cc, #a855f7, #ec4899)',
                    opacity: 0,
                    transition: 'opacity 0.3s'
                  }} />
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 16,
                    marginBottom: 16
                  }}>
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: item.type === 'youtube' 
                          ? 'linear-gradient(135deg, #ef4444, #f87171)' 
                          : 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {getFileIcon(item.type)}
                    </motion.div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ 
                        fontSize: 18, 
                        fontWeight: 700, 
                        color: '#111', 
                        margin: '0 0 8px',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.title}
                      </h3>
                      <div style={{ 
                        fontSize: 13, 
                        color: '#64748b', 
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {item.type || 'DOCUMENT'}
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveItem(item.id)
                      }}
                      style={{
                        padding: '10px',
                        background: 'white',
                        border: '2px solid #fecaca',
                        borderRadius: 12,
                        color: '#dc2626',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626'
                        e.currentTarget.style.color = 'white'
                        e.currentTarget.style.borderColor = '#dc2626'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white'
                        e.currentTarget.style.color = '#dc2626'
                        e.currentTarget.style.borderColor = '#fecaca'
                      }}
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    color: '#94a3b8',
                    fontWeight: 500
                  }}>
                    <Clock size={14} />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Progress Modal */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: 'white',
                padding: '40px',
                borderRadius: 32,
                textAlign: 'center',
                minWidth: 400,
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)'
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7a12cc, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: 'white'
                }}
              >
                <Upload size={32} />
              </motion.div>
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#111' }}>
                Uploading materials...
              </h3>
              <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
                {uploadProgress}% complete
              </div>
              
              {/* Progress Bar */}
              <div style={{
                width: '100%',
                height: 8,
                background: '#f1f5f9',
                borderRadius: 4,
                overflow: 'hidden',
                marginBottom: 16
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #7a12cc, #a855f7)',
                    borderRadius: 4
                  }}
                />
              </div>
              
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Please wait while we process your files
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
