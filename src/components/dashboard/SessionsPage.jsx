import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Loader } from 'lucide-react'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { 
    sessions, 
    loadSessions, 
    deleteSession,
    leaveSession,
    setActiveSession,
    updateLastAccessed
  } = useSessionStore()
  
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [activeTab, setActiveTab] = useState('active')
  const [sortBy, setSortBy] = useState('lastUpdated')

  // Shared session joining states
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joiningUrlCode, setJoiningUrlCode] = useState(false)
  const [activeDropdownId, setActiveDropdownId] = useState(null)

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveDropdownId(null)
    }
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [])

  const { startTour, hasCompletedTour, completedTours, currentUserId, isLoadingTours } = useTourStore()

  useEffect(() => {
    if (user?.id) {
      loadSessions()
    }
    setLoading(false)
  }, [user?.id])

  // Handle URL share code join
  useEffect(() => {
    const code = searchParams.get('join')
    if (code && user?.id) {
      handleAutoJoin(code)
    }
  }, [searchParams, user?.id])

  const handleAutoJoin = async (code) => {
    setJoiningUrlCode(true)
    setJoinError('')
    try {
      const result = await useSessionStore.getState().joinSharedSession(code)
      if (result.success && result.session) {
        // Clear the join param from URL
        setSearchParams({}, { replace: true })
        navigate(`/dashboard/session/${result.session.id}`)
      } else {
        setJoinError(result.error || 'Failed to join shared session. Please verify the code.')
        setJoiningUrlCode(false)
        setShowJoinModal(true)
        setJoinCode(code) // fill code so they see it
      }
    } catch (err) {
      console.error('[SessionsPage] Error during auto-join:', err)
      setJoinError('An error occurred while joining.')
      setJoiningUrlCode(false)
    }
  }

  const handleManualJoin = async () => {
    if (!joinCode.trim()) return
    setIsJoining(true)
    setJoinError('')
    try {
      const result = await useSessionStore.getState().joinSharedSession(joinCode)
      if (result.success && result.session) {
        setShowJoinModal(false)
        setJoinCode('')
        navigate(`/dashboard/session/${result.session.id}`)
      } else {
        setJoinError(result.error || 'Invalid session code or session sharing is disabled.')
      }
    } catch (err) {
      console.error('[SessionsPage] Error during manual join:', err)
      setJoinError('An error occurred while joining.')
    } finally {
      setIsJoining(false)
    }
  }

  useEffect(() => {
    if (user?.id && currentUserId === user.id && !loading && !isLoadingTours && !hasCompletedTour('sessions')) {
      const timer = setTimeout(() => startTour('sessions'), 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, currentUserId, completedTours, loading, hasCompletedTour, startTour, isLoadingTours])

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

  const handleLeaveSession = async (sessionId, e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to leave this shared session?')) {
      await leaveSession(sessionId)
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

          {/* Right: Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowJoinModal(true)}
              style={{
                padding: '12px 20px',
                background: '#ffffff',
                color: '#7C3AED',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                borderRadius: '24px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.05)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.2)'
              }}
            >
              <Users size={18} />
              Join Session
            </motion.button>

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
          </div>
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
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDropdownId(activeDropdownId === session.id ? null : session.id)
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

                      {/* More Options Dropdown */}
                      <AnimatePresence>
                        {activeDropdownId === session.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              position: 'absolute',
                              top: '32px',
                              right: '0px',
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(10px)',
                              border: '1px solid rgba(226, 232, 240, 0.8)',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                              padding: '6px',
                              zIndex: 100,
                              minWidth: '150px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setActiveDropdownId(null)
                                handleOpenSession(session)
                              }}
                              style={{
                                padding: '10px 12px',
                                background: 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: '#0f172a',
                                fontSize: '13px',
                                fontWeight: 500,
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s',
                                width: '100%'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                              Open Session
                            </button>
                            
                            {session.user_id === user.id ? (
                              <button
                                onClick={(e) => {
                                  setActiveDropdownId(null)
                                  handleDeleteSession(session.id, e)
                                }}
                                style={{
                                  padding: '10px 12px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'all 0.2s',
                                  width: '100%'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <Trash2 size={14} />
                                Delete Session
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  setActiveDropdownId(null)
                                  handleLeaveSession(session.id, e)
                                }}
                                style={{
                                  padding: '10px 12px',
                                  background: 'transparent',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  color: '#ef4444',
                                  fontSize: '13px',
                                  fontWeight: 500,
                                  textAlign: 'left',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  transition: 'all 0.2s',
                                  width: '100%'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                                Leave Session
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
                      <Users size={14} />
                      {session.member_count?.[0]?.count || 1} members
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

      {/* Join Session Modal */}
      {showJoinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 20
        }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              border: '1px solid rgba(109, 40, 217, 0.15)',
              boxShadow: '0 20px 50px rgba(109, 40, 217, 0.12), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
              padding: isMobile ? '24px' : '32px',
              width: '100%',
              maxWidth: '420px',
              position: 'relative',
              fontFamily: 'var(--font-outfit, system-ui, sans-serif)',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                setShowJoinModal(false)
                setJoinCode('')
                setJoinError('')
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                padding: '6px',
                background: 'rgba(243, 244, 246, 0.6)',
                border: '1px solid rgba(229, 231, 235, 0.8)',
                borderRadius: '12px',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#FEE2E2'
                e.currentTarget.style.color = '#EF4444'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(243, 244, 246, 0.6)'
                e.currentTarget.style.color = '#64748b'
              }}
            >
              <X size={18} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #C084FC 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)'
              }}>
                <Users size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.02em' }}>
                  Join Shared Session
                </h2>
                <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 500 }}>
                  Enter code to join a collaborative study session
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '12px', 
                fontWeight: 700, 
                color: '#475569',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Session Invite Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter 10-digit code (e.g. a1b2c3d4e5)"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1E293B',
                  outline: 'none',
                  background: '#FFFFFF',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.05em'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7C3AED'
                  e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.15)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0'
                  e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02)'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualJoin()
                  if (e.key === 'Escape') {
                    setShowJoinModal(false)
                    setJoinCode('')
                    setJoinError('')
                  }
                }}
              />
              {joinError && (
                <div style={{ 
                  marginTop: '10px', 
                  color: '#EF4444', 
                  fontSize: '13px', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>⚠️</span> {joinError}
                </div>
              )}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: 12, 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinCode('')
                  setJoinError('')
                }}
                style={{
                  padding: '10px 20px',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  color: '#64748B',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#E2E8F0'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F1F5F9'
                }}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleManualJoin}
                disabled={isJoining || !joinCode.trim()}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  border: 'none',
                  borderRadius: 12,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: (isJoining || !joinCode.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isJoining || !joinCode.trim()) ? 0.6 : 1,
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isJoining && <Loader size={16} className="animate-spin" />}
                {isJoining ? 'Joining...' : 'Join Session'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Auto-join Loading Overlay */}
      {joiningUrlCode && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          color: 'white',
          fontFamily: 'var(--font-outfit, system-ui, sans-serif)',
          gap: '16px'
        }}>
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #C084FC 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4)',
            }}
          >
            <Users size={32} />
          </motion.div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Joining Shared Study Session
          </h2>
          <p style={{ fontSize: '14px', color: '#CBD5E1', margin: 0, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader size={16} className="animate-spin text-purple-400" />
            Resolving invitation and setting up collaboration...
          </p>
        </div>
      )}
    </div>
  )
}
