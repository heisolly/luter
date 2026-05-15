import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiFolderOpenFill as Folder, RiAddLine as Plus, RiDeleteBin6Fill as Trash2,
  RiPlayFill as Play, RiSearchLine as Search, RiTimeLine as Clock,
  RiBook2Fill as Book, RiArchiveLine as Archive, RiArrowDownLine as ArrowDown,
  RiMoreFill as MoreHorizontal, RiCloseLine as X, RiEditLine as Edit
} from 'react-icons/ri'
import { useSessionStore } from '../../store/useSessionStore'
import Header from '../shared/Header'
import useTourStore from '../../store/useTourStore'

// Chalkboard/Class illustration component
const ChalkboardIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="60" fill="#dcfce7"/>
    <rect x="25" y="35" width="70" height="50" rx="4" fill="#22c55e"/>
    <rect x="30" y="40" width="60" height="35" rx="2" fill="#f0fdf4"/>
    <rect x="35" y="48" width="20" height="3" rx="1.5" fill="#22c55e" opacity="0.6"/>
    <rect x="35" y="55" width="15" height="3" rx="1.5" fill="#22c55e" opacity="0.4"/>
    <rect x="35" y="62" width="25" height="3" rx="1.5" fill="#22c55e" opacity="0.5"/>
    <rect x="65" y="48" width="20" height="3" rx="1.5" fill="#22c55e" opacity="0.5"/>
    <rect x="65" y="55" width="18" height="3" rx="1.5" fill="#22c55e" opacity="0.6"/>
    <path d="M25 85 L40 85 L35 95 L30 95 Z" fill="#16a34a"/>
    <path d="M80 85 L95 85 L90 95 L85 95 Z" fill="#16a34a"/>
    <rect x="20" y="82" width="80" height="4" rx="2" fill="#16a34a"/>
  </svg>
)

// Simple session card icon
const SessionIcon = ({ color = '#22c55e' }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M7 8h10M7 12h7M7 16h5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export default function SessionsPage() {
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const { 
    sessions, 
    loadSessions, 
    deleteSession,
    setActiveSession,
    updateLastAccessed
  } = useSessionStore()
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [sortBy, setSortBy] = useState('lastUpdated')

  const { startTour, hasCompletedTour, completedTours, currentUserId } = useTourStore()

  useEffect(() => {
    if (user?.id) {
      loadSessions()
    }
    setLoading(false)
  }, [user?.id, loadSessions])

  useEffect(() => {
    if (user?.id && currentUserId === user.id && !loading && !hasCompletedTour('sessions')) {
      const timer = setTimeout(() => startTour('sessions'), 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, currentUserId, completedTours, loading, hasCompletedTour, startTour])

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return
    
    const { success, session } = await useSessionStore.getState().createSession(newSessionName, [])
    if (success && session) {
      setActiveSession(session)
      navigate(`/dashboard/session/${session.id}`)
      setShowCreateModal(false)
      setNewSessionName('')
    }
  }

  const handleDeleteSession = async (sessionId, e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this session?')) {
      await deleteSession(sessionId)
    }
  }

  const handleOpenSession = (session) => {
    updateLastAccessed(session.id)
    setActiveSession(session)
    navigate(`/dashboard/session/${session.id}`)
  }

  const formatSessionDate = (dateString) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Recently'
    
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredSessions = sessions.filter(session =>
    session.session_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatMaterialDate = (dateString) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Recently'
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ fontSize: 16, color: '#64748b' }}>Loading sessions...</div>
      </div>
    )
  }

  return (
    <div className="dhd-root" style={{ 
      minHeight: '100vh'
    }}>
        
        {/* Classes-style Header Card */}
        <motion.div
          id="tour-sessions-header"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: isMobile ? '24px' : '32px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '20px' : '0'
          }}
        >
          {/* Left: Title & Description */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: isMobile ? '22px' : '26px',
              fontWeight: 700,
              margin: 0,
              color: '#0f172a',
              marginBottom: '8px'
            }}>
              Study Sessions
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: 0,
              lineHeight: 1.5,
              maxWidth: '400px'
            }}>
              Create and manage your study sessions. Organize materials and track your learning progress.
            </p>
          </div>

          {/* Right: New Session Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '12px 20px',
              background: '#14b8a6',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(20, 184, 166, 0.25)',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={18} />
            New Session
          </motion.button>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          {/* Archived Filter */}
          <button
            onClick={() => setActiveTab(activeTab === 'archived' ? 'active' : 'archived')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: activeTab === 'archived' ? '#f1f5f9' : 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Archive size={16} />
            Archived
          </button>

          {/* Sort Dropdown */}
          <button
            onClick={() => setSortBy(sortBy === 'lastUpdated' ? 'name' : 'lastUpdated')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <ArrowDown size={16} />
            {sortBy === 'lastUpdated' ? 'Last Updated' : 'Name'}
          </button>
        </motion.div>

        {/* Sessions Content */}
        <AnimatePresence mode="wait">
          {filteredSessions.length === 0 ? (
            /* Empty State - Classes Style */
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center'
              }}
            >
              {/* Illustration */}
              <div style={{ marginBottom: '24px' }}>
                <ChalkboardIllustration />
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#0f172a',
                margin: '0 0 8px'
              }}>
                {searchQuery ? 'No sessions found' : 'Create a session to get started'}
              </h3>

              {/* Description */}
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                margin: '0 0 24px',
                maxWidth: '360px',
                lineHeight: 1.5
              }}>
                {searchQuery 
                  ? 'Try adjusting your search terms to find what you\'re looking for.' 
                  : 'Start organizing your study materials by creating your first study session.'}
              </p>

              {/* Create Button */}
              {!searchQuery && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '12px 24px',
                    background: '#facc15',
                    color: '#1e293b',
                    border: 'none',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(250, 204, 21, 0.3)'
                  }}
                >
                  <Plus size={18} />
                  Create Your First Session
                </motion.button>
              )}
            </motion.div>
          ) : (
            /* Sessions Grid */
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px',
                  width: '100%'
                }}
              >
              {filteredSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  id={index === 0 ? "tour-session-list" : undefined}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    maxWidth: isMobile ? '100%' : '380px'
                  }}
                  onClick={() => handleOpenSession(session)}
                >
                  {/* Card Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      {/* Icon */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(122, 18, 204, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <SessionIcon color="#7a12cc" />
                      </div>

                      {/* Title */}
                      <div>
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          color: '#0f172a',
                          margin: 0,
                          lineHeight: 1.3,
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {session.session_name}
                        </h4>
                        <span style={{
                          fontSize: '12px',
                          color: '#94a3b8',
                          fontWeight: 500
                        }}>
                          {formatSessionDate(session.last_accessed)}
                        </span>
                      </div>
                    </div>

                    {/* More Options */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Toggle dropdown
                      }}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#94a3b8',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9'
                        e.currentTarget.style.color = '#64748b'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#94a3b8'
                      }}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    color: '#64748b',
                    fontWeight: 500
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Book size={14} />
                      {session.items?.length || 0} materials
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} />
                      {formatSessionDate(session.last_accessed)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 20
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: isMobile ? '24px' : '32px',
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowCreateModal(false)
                setNewSessionName('')
              }}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                padding: '8px',
                background: 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#94a3b8',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f1f5f9'
                e.currentTarget.style.color = '#64748b'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#94a3b8'
              }}
            >
              <X size={20} />
            </button>
            
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ 
                fontSize: isMobile ? 22 : 24, 
                fontWeight: 700, 
                margin: '0 0 8px',
                color: '#0f172a'
              }}>
                Create New Session
              </h2>
              <p style={{
                fontSize: 14,
                color: '#64748b',
                margin: 0,
                lineHeight: 1.5
              }}>
                Give your study session a name to start organizing your materials
              </p>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 13, 
                fontWeight: 600, 
                color: '#374151',
                marginBottom: 8
              }}>
                Session Name
              </label>
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="e.g., Biology Exam Prep"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  outline: 'none',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#14b8a6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(20, 184, 166, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0'
                  e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSession()
                  if (e.key === 'Escape') {
                    setShowCreateModal(false)
                    setNewSessionName('')
                  }
                }}
              />
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 12, 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewSessionName('')
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  color: '#64748b',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e2e8f0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f1f5f9'
                }}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateSession}
                disabled={!newSessionName.trim()}
                style={{
                  padding: '10px 20px',
                  background: '#14b8a6',
                  border: 'none',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: newSessionName.trim() ? 'pointer' : 'not-allowed',
                  opacity: newSessionName.trim() ? 1 : 0.5,
                  boxShadow: '0 2px 8px rgba(20, 184, 166, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                Create Session
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
