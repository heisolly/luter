import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RiCheckLine as Check,
  RiCloseLine as X,
  RiMagicFill as Sparkles,
  RiFireFill as Flame,
  RiNotification3Fill as Bell,
  RiBookOpenFill as BookOpen,
  RiTrophyFill as Trophy,
  RiTeamFill as Users,
  RiArrowRightLine as ArrowRight,
  RiSettings4Fill as Settings,
  RiCheckboxCircleFill as CheckCircle,
} from 'react-icons/ri'

const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Keep Your Streak Alive!',
    description: "You're on a 5-day streak! Just 2 minutes of study today to make it 6 days.",
    time: '2h ago',
    unread: true,
    type: 'streak',
    icon: Flame,
    iconBg: 'linear-gradient(135deg, #ff7043, #ff5722)',
    action: { label: 'Continue Streak', path: '/dashboard/workstation' },
  },
  {
    id: 2,
    title: 'AI Summary Complete',
    description: '"Modern Physics" notes are ready. Smart summary & flashcards generated.',
    time: '4h ago',
    unread: true,
    type: 'ai',
    icon: Sparkles,
    iconBg: 'linear-gradient(135deg, #7a12cc, #9718fb)',
    action: { label: 'View Summary', path: '/dashboard/courses/physics' },
  },
  {
    id: 3,
    title: 'Study Group Invitation',
    description: 'Sarah invited you to "CS101 Study Squad" for exam prep.',
    time: 'Yesterday',
    unread: true,
    type: 'social',
    icon: Users,
    iconBg: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    action: { label: 'Join Group', path: '/dashboard/study-groups/123' },
  },
  {
    id: 4,
    title: 'Weekly Achievement Unlocked',
    description: 'You earned 1,250 XP this week! Top 5% at your university.',
    time: '2 days ago',
    unread: false,
    type: 'achievement',
    icon: Trophy,
    iconBg: 'linear-gradient(135deg, #d97706, #f59e0b)',
  },
  {
    id: 5,
    title: 'New Course Material',
    description: 'Week 8 materials for "Data Structures" are now available.',
    time: '3 days ago',
    unread: false,
    type: 'course',
    icon: BookOpen,
    iconBg: 'linear-gradient(135deg, #059669, #10b981)',
    action: { label: 'View Materials', path: '/dashboard/courses/ds' },
  },
]

export default function NotificationsOverlay({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [activeFilter, setActiveFilter] = useState('all')

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  const dismiss = (id) => setNotifications(prev => prev.filter(n => n.id !== id))
  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))

  const unreadCount = notifications.filter(n => n.unread).length

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'ai', label: 'AI' },
    { id: 'streak', label: 'Streaks' },
    { id: 'social', label: 'Social' },
    { id: 'achievement', label: 'Awards' },
  ]

  const filtered = activeFilter === 'all' ? notifications : notifications.filter(n => n.type === activeFilter)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={backdropStyles}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={panelStyles}
          >
            {/* Decorative glow */}
            <div style={panelGlowStyles} />

            {/* ── Header ── */}
            <div style={panelHeaderStyles}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={headerIconStyles}>
                  <Bell size={18} color="#7a12cc" />
                  {unreadCount > 0 && <div style={unreadDotStyles}>{unreadCount}</div>}
                </div>
                <div>
                  <h2 style={headerTitleStyles}>Notifications</h2>
                  <p style={headerSubtitleStyles}>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={markAllBtnStyles}>
                    <CheckCircle size={14} /> Mark all read
                  </button>
                )}
                <button onClick={onClose} style={closeBtnStyles}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── Filters ── */}
            <div style={filterRowStyles}>
              {filters.map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  style={{
                    ...filterBtnStyles,
                    background: activeFilter === f.id ? '#7a12cc' : 'transparent',
                    color: activeFilter === f.id ? 'white' : '#64748b',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* ── List ── */}
            <div style={listStyles}>
              <AnimatePresence initial={false}>
                {filtered.length > 0 ? filtered.map((notif, idx) => {
                  const NotifIcon = notif.icon
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                      style={{
                        ...notifItemStyles,
                        background: notif.unread ? 'rgba(122,18,204,0.02)' : 'white',
                        borderColor: notif.unread ? 'rgba(122,18,204,0.08)' : '#f1f5f9',
                      }}
                      onClick={() => markRead(notif.id)}
                    >
                      {/* Unread indicator */}
                      {notif.unread && <div style={unreadBarStyles} />}

                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                        {/* Icon */}
                        <div style={{ ...notifIconStyles, background: notif.iconBg }}>
                          <NotifIcon size={18} color="white" />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                            <h4 style={{ ...notifTitleStyles, fontWeight: notif.unread ? 800 : 700 }}>{notif.title}</h4>
                            <button
                              onClick={(e) => { e.stopPropagation(); dismiss(notif.id) }}
                              style={dismissBtnStyles}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p style={notifDescStyles}>{notif.description}</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
                            <span style={notifTimeStyles}>{notif.time}</span>
                            {notif.action && (
                              <button style={notifActionBtnStyles}>
                                {notif.action.label} <ArrowRight size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                }) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={emptyStateStyles}
                  >
                    <div style={emptyIconStyles}>
                      <Bell size={28} color="#cbd5e1" />
                    </div>
                    <h3 style={emptyTitleStyles}>All caught up!</h3>
                    <p style={emptyDescStyles}>No notifications in this category.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            <div style={footerStyles}>
              <button style={footerBtnStyles}>
                <Settings size={15} /> Notification Settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── STYLES ──

const backdropStyles = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.25)',
  backdropFilter: 'blur(4px)',
  zIndex: 50,
}

const panelStyles = {
  position: 'fixed',
  top: 16,
  right: 16,
  bottom: 16,
  width: 420,
  background: 'white',
  borderRadius: 28,
  boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 40px 80px rgba(0,0,0,0.12)',
  zIndex: 51,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  fontFamily: "'Outfit', sans-serif",
}

const panelGlowStyles = {
  position: 'absolute',
  top: -60,
  right: -60,
  width: 200,
  height: 200,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(122,18,204,0.08) 0%, transparent 70%)',
  pointerEvents: 'none',
}

const panelHeaderStyles = {
  padding: '24px 24px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: '1px solid #f1f5f9',
}

const headerIconStyles = {
  width: 44,
  height: 44,
  borderRadius: 16,
  background: 'rgba(122,18,204,0.07)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
}

const unreadDotStyles = {
  position: 'absolute',
  top: -4,
  right: -4,
  width: 18,
  height: 18,
  background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
  color: 'white',
  borderRadius: 99,
  fontSize: 10,
  fontWeight: 900,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid white',
}

const headerTitleStyles = {
  fontSize: 18,
  fontWeight: 900,
  color: '#0f172a',
  margin: 0,
  letterSpacing: '-0.02em',
}

const headerSubtitleStyles = {
  fontSize: 12,
  fontWeight: 600,
  color: '#94a3b8',
  margin: '2px 0 0',
}

const markAllBtnStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  background: 'rgba(122,18,204,0.06)',
  border: 'none',
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 800,
  color: '#7a12cc',
  cursor: 'pointer',
}

const closeBtnStyles = {
  width: 36,
  height: 36,
  borderRadius: 12,
  background: '#f8fafc',
  border: '1px solid #f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#94a3b8',
  cursor: 'pointer',
}

const filterRowStyles = {
  display: 'flex',
  gap: 4,
  padding: '16px 20px',
  overflowX: 'auto',
}

const filterBtnStyles = {
  padding: '7px 14px',
  borderRadius: 99,
  border: 'none',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s',
}

const listStyles = {
  flex: 1,
  overflowY: 'auto',
  padding: '0 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
}

const notifItemStyles = {
  padding: '16px 18px',
  borderRadius: 20,
  border: '1px solid',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.2s',
}

const unreadBarStyles = {
  position: 'absolute',
  left: 0,
  top: '20%',
  bottom: '20%',
  width: 3,
  background: 'linear-gradient(180deg, #7a12cc, #9718fb)',
  borderRadius: 99,
}

const notifIconStyles = {
  width: 44,
  height: 44,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

const notifTitleStyles = {
  fontSize: 14,
  color: '#0f172a',
  margin: 0,
  letterSpacing: '-0.01em',
  lineHeight: 1.3,
}

const notifDescStyles = {
  fontSize: 13,
  color: '#64748b',
  fontWeight: 500,
  lineHeight: 1.5,
  margin: '6px 0 0',
}

const notifTimeStyles = {
  fontSize: 11,
  fontWeight: 700,
  color: '#cbd5e1',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const notifActionBtnStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 12px',
  background: 'rgba(122,18,204,0.06)',
  border: 'none',
  borderRadius: 99,
  fontSize: 12,
  fontWeight: 800,
  color: '#7a12cc',
  cursor: 'pointer',
}

const dismissBtnStyles = {
  width: 28,
  height: 28,
  borderRadius: 10,
  background: 'transparent',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#cbd5e1',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.15s',
}

const emptyStateStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '80px 40px',
  textAlign: 'center',
}

const emptyIconStyles = {
  width: 80,
  height: 80,
  background: '#f8fafc',
  borderRadius: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 24,
}

const emptyTitleStyles = {
  fontSize: 18,
  fontWeight: 800,
  color: '#1e293b',
  margin: '0 0 8px',
}

const emptyDescStyles = {
  fontSize: 14,
  fontWeight: 500,
  color: '#94a3b8',
  margin: 0,
}

const footerStyles = {
  padding: '16px 20px',
  borderTop: '1px solid #f1f5f9',
}

const footerBtnStyles = {
  width: '100%',
  padding: '14px',
  borderRadius: 16,
  background: '#f8fafc',
  border: '1px solid #f1f5f9',
  fontSize: 13,
  fontWeight: 800,
  color: '#475569',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  cursor: 'pointer',
  transition: 'all 0.2s',
}
