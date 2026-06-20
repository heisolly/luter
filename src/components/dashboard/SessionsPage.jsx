import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Archive,
  Clock,
  MagnifyingGlass,
  Plus,
  ShareNetwork,
  UsersThree,
  X,
} from '@phosphor-icons/react'
import { useSessionStore } from '../../store/useSessionStore'
import useTourStore from '../../store/useTourStore'
import './SessionsRedesign.css'
import './StudySession.css'

function formatDate(dateString) {
  if (!dateString) return 'Never opened'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const delta = Date.now() - date.getTime()
  const minutes = Math.floor(delta / 60000)
  const hours = Math.floor(delta / 3600000)
  const days = Math.floor(delta / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function SessionsPage() {
  const navigate = useNavigate()
  const { user } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    sessions,
    loadSessions,
    deleteSession,
    leaveSession,
    setActiveSession,
    updateLastAccessed,
  } = useSessionStore()
  const { startTour, hasCompletedTour, completedTours, currentUserId, isLoadingTours } = useTourStore()

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState('active')
  const [sort, setSort] = useState('recent')
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    Promise.resolve(loadSessions(false, user.id)).finally(() => setLoading(false))
  }, [user?.id, loadSessions])

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true)
      setSearchParams(params => {
        params.delete('new')
        return params
      }, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    const code = searchParams.get('join')
    const materialId = searchParams.get('materialId')
    if (!code || !user?.id) return

    const joinFromUrl = async () => {
      setJoining(true)
      const result = await useSessionStore.getState().joinSharedSession(code)
      setJoining(false)
      if (result.success && result.session) {
        setSearchParams({}, { replace: true })
        navigate(materialId
          ? `/workstation?sessionId=${result.session.id}&materialId=${materialId}&sessionType=group`
          : `/session/${result.session.id}`)
      } else {
        setJoinCode(code)
        setJoinError(result.error || 'That invite could not be opened.')
        setShowJoin(true)
      }
    }

    joinFromUrl()
  }, [searchParams, setSearchParams, user?.id, navigate])

  useEffect(() => {
    if (user?.id && currentUserId === user.id && !loading && !isLoadingTours && !hasCompletedTour('sessions')) {
      const timer = setTimeout(() => startTour('sessions'), 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, currentUserId, completedTours, loading, hasCompletedTour, startTour, isLoadingTours])

  const visibleSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sessions
      .filter((session) => (tab === 'archived' ? session.is_archived : !session.is_archived))
      .filter((session) => !q || session.session_name?.toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'name') return (a.session_name || '').localeCompare(b.session_name || '')
        return new Date(b.last_accessed_at || b.updated_at || b.created_at || 0) - new Date(a.last_accessed_at || a.updated_at || a.created_at || 0)
      })
  }, [sessions, search, tab, sort])

  const createSession = async () => {
    if (!name.trim()) return
    const { success, session } = await useSessionStore.getState().createSession(name.trim(), [])
    if (success && session) {
      setActiveSession(session)
      setName('')
      setShowCreate(false)
      navigate(`/session/${session.id}`)
    }
  }

  const joinSession = async () => {
    if (!joinCode.trim()) return
    setJoining(true)
    setJoinError('')
    const result = await useSessionStore.getState().joinSharedSession(joinCode.trim())
    setJoining(false)
    if (result.success && result.session) {
      setShowJoin(false)
      setJoinCode('')
      navigate(`/session/${result.session.id}`)
    } else {
      setJoinError(result.error || 'Invalid invite code.')
    }
  }

  const openSession = (session) => {
    updateLastAccessed(session.id)
    setActiveSession(session)
    navigate(`/session/${session.id}`)
  }

  return (
    <div className="sr-container">
      <div className="sr-content">
        <section className="sr-hero" id="tour-sessions-header">
          <div className="sr-hero-text">
            <h1>Sessions</h1>
            <p>Shared rooms for turning loose study material into actual momentum. Collaborate and build ideas.</p>
          </div>
          <div className="sr-hero-actions" style={{ display: 'flex', gap: '12px' }}>
            <button className="ss-premium-btn outline" onClick={() => setShowJoin(true)}>
              <ShareNetwork size={18} weight="bold" />
              Join
            </button>
            <button className="ss-premium-btn" onClick={() => setShowCreate(true)}>
              <Plus size={18} weight="bold" />
              New Session
            </button>
          </div>
        </section>

        <section className="sr-toolbar">
          <div className="sr-search">
            <MagnifyingGlass size={18} weight="bold" />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search sessions..." 
            />
          </div>
          <div className="sr-filters">
            <button className={`sr-tab${tab === 'active' ? ' active' : ''}`} onClick={() => setTab('active')}>Active</button>
            <button className={`sr-tab${tab === 'archived' ? ' active' : ''}`} onClick={() => setTab('archived')}>Archived</button>
            <button className="sr-btn" style={{ marginLeft: 8 }} onClick={() => setSort(sort === 'recent' ? 'name' : 'recent')}>
              {sort === 'recent' ? <Clock size={16} weight="bold" /> : <Archive size={16} weight="bold" />}
              {sort === 'recent' ? 'Recent' : 'Name'}
            </button>
          </div>
        </section>

        <section className="sr-grid">
          {loading || joining ? (
            <div className="sr-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="sr-empty-icon"><UsersThree size={32} weight="duotone" /></div>
              <div>
                <h3>Loading sessions</h3>
                <p>Finding your rooms and invites.</p>
              </div>
            </div>
          ) : visibleSessions.length === 0 ? (
            <div className="sr-empty" style={{ gridColumn: '1 / -1' }}>
              <div className="sr-empty-icon"><UsersThree size={32} weight="duotone" /></div>
              <div>
                <h3>{search ? 'No matching sessions' : 'No sessions yet'}</h3>
                <p>{search ? 'Clear the search to see every room.' : 'Start a room for a course, a revision sprint, or a live study group.'}</p>
                {!search && (
                  <button className="sr-btn sr-btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
                    <Plus size={16} weight="bold" /> Create session
                  </button>
                )}
              </div>
            </div>
          ) : visibleSessions.map((session, index) => {
            const colorMap = ['purple', 'mint', 'peach']
            const color = colorMap[index % colorMap.length]
            
            return (
              <motion.div
                key={session.id}
                id={index === 0 ? 'tour-session-list' : undefined}
                className="sr-card"
                data-color={color}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => openSession(session)}
              >
                <div className="sr-card-header">
                  <div className="sr-card-icon">
                    <UsersThree size={24} weight="duotone" />
                  </div>
                  <div className="sr-card-badges">
                    <span className={`sr-badge ${session.is_shared || session.owner_id !== user?.id ? 'shared' : 'private'}`}>
                      {session.is_shared || session.owner_id !== user?.id ? 'Shared' : 'Private'}
                    </span>
                  </div>
                </div>
                
                <div className="sr-card-body">
                  <h3>{session.session_name || 'Untitled session'}</h3>
                  <p>{session.description || 'A focused workspace for notes, files, and collaboration.'}</p>
                </div>

                <div className="sr-card-footer">
                  <div className="sr-meta">
                    <Clock size={14} weight="bold" />
                    <span>{formatDate(session.last_accessed_at || session.updated_at || session.created_at)}</span>
                  </div>
                  <div className="sr-actions" onClick={e => e.stopPropagation()}>
                    {session.owner_id === user?.id ? (
                      <button className="sr-action-btn" onClick={() => {
                        if (window.confirm('Delete this session?')) deleteSession(session.id)
                      }}>Delete</button>
                    ) : (
                      <button className="sr-action-btn" onClick={() => {
                        if (window.confirm('Leave this shared session?')) leaveSession(session.id)
                      }}>Leave</button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </section>
      </div>

      <AnimatePresence>
        {showCreate && (
          <Modal title="New Session" description="Give this room a name your future self will recognize." onClose={() => setShowCreate(false)}>
            <input className="sr-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PHY 101 exam sprint" autoFocus />
            <div className="sr-modal-actions">
              <button className="sr-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="sr-btn sr-btn-primary" disabled={!name.trim()} onClick={createSession}>Create</button>
            </div>
          </Modal>
        )}
        {showJoin && (
          <Modal title="Join Session" description="Paste the invite code or shared session token." onClose={() => setShowJoin(false)}>
            <input className="sr-input" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Invite code" autoFocus />
            {joinError && <p style={{ color: '#EF4444', fontSize: 13, marginTop: -12, marginBottom: 16 }}>{joinError}</p>}
            <div className="sr-modal-actions">
              <button className="sr-btn" onClick={() => setShowJoin(false)}>Cancel</button>
              <button className="sr-btn sr-btn-primary" disabled={!joinCode.trim() || joining} onClick={joinSession}>
                {joining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function Modal({ title, description, onClose, children }) {
  return (
    <motion.div className="sr-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="sr-modal" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }} onClick={e => e.stopPropagation()}>
        <button className="sr-modal-close" onClick={onClose}>
          <X size={20} weight="bold" />
        </button>
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </motion.div>
    </motion.div>
  )
}
