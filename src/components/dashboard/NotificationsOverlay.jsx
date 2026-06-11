import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bell, Check, Trash } from 'lucide-react'

/* ─── Mock data (swap with real Supabase fetch) ──────────────────── */
const INITIAL_NOTIFS = [
  {
    id: 1, read: false,
    emoji: '🔥', emojiBg: 'rgba(255,107,53,0.12)',
    title: 'Streak at risk!',
    body: "You haven't studied today — your 7-day streak ends in 2 hours.",
    time: '2m ago', action: 'Study now',
  },
  {
    id: 2, read: false,
    emoji: '👥', emojiBg: 'rgba(196,181,253,0.2)',
    title: 'Session invite',
    body: 'Alex invited you to join the "Physics Finals" study room.',
    time: '18m ago', action: 'Join',
  },
  {
    id: 3, read: true,
    emoji: '🃏', emojiBg: 'rgba(152,255,152,0.22)',
    title: 'Deck ready',
    body: 'Your Calculus II flashcard deck is ready — 42 cards generated.',
    time: '1h ago', action: 'Study',
  },
]

export default function NotificationsOverlay({ isOpen, onClose }) {
  const [items, setItems]   = useState(INITIAL_NOTIFS)
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'))
  const [hoveredId, setHov] = useState(null)
  const cardRef             = useRef(null)

  /* dark mode observer */
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.body.classList.contains('dark-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  /* Escape key */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  /* click outside */
  useEffect(() => {
    const h = (e) => { if (cardRef.current && !cardRef.current.contains(e.target)) onClose() }
    if (isOpen) setTimeout(() => document.addEventListener('mousedown', h), 80)
    return () => document.removeEventListener('mousedown', h)
  }, [isOpen, onClose])

  const unread   = items.filter(n => !n.read).length
  const markAll  = () => setItems(p => p.map(n => ({ ...n, read: true })))
  const dismiss  = (id) => { setItems(p => p.filter(n => n.id !== id)); setHov(null) }
  const markRead = (id) => setItems(p => p.map(n => n.id === id ? { ...n, read: true } : n))
  const clearAll = () => setItems([])

  /* theme */
  const cardBg = isDark ? '#1F2937' : '#ffffff'
  const bd     = isDark ? '#374151' : '#E5E7EB'
  const subtle = isDark ? '#374151' : '#F3F4F6'
  const txt    = isDark ? '#F9FAFB' : '#333333'
  const muted  = isDark ? '#9CA3AF' : '#6B7280'
  const isEmpty = items.length === 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* transparent backdrop — click to close */}
          <motion.div
            key="nb-bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9000 }}
          />

          {/* ── Floating card — bottom-left, right of sidebar ── */}
          <motion.div
            key="nb-card"
            ref={cardRef}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position:      'fixed',
              left:          '270px',
              bottom:        '76px',
              width:         '340px',
              maxHeight:     '440px',
              background:    cardBg,
              border:        `1px solid ${bd}`,
              borderRadius:  16,
              boxShadow:     isDark
                ? '0 20px 52px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 20px 52px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.04)',
              zIndex:        9001,
              fontFamily:    "'Outfit','Inter',sans-serif",
              display:       'flex',
              flexDirection: 'column',
              overflow:      'hidden',
            }}
          >

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px 11px', borderBottom: `1px solid ${bd}`, flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(196,181,253,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bell size={15} color="#7a12cc" weight="fill" />
              </div>

              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: txt, letterSpacing: '-0.01em' }}>
                  Notifications
                </span>
                {unread > 0 && (
                  <span style={{ marginLeft: 7, fontSize: 10, fontWeight: 800, background: '#C4B5FD', color: '#333', borderRadius: 99, padding: '1px 6px' }}>
                    {unread} unread
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 5 }}>
                {unread > 0 && (
                  <button onClick={markAll} title="Mark all read"
                    style={{ width: 27, height: 27, borderRadius: 8, border: 'none', background: subtle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}>
                    <Check size={13} weight="bold" />
                  </button>
                )}
                <button onClick={onClose}
                  style={{ width: 27, height: 27, borderRadius: 8, border: 'none', background: subtle, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted }}>
                  <X size={13} weight="bold" />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {isEmpty ? (
                /* empty state */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '38px 24px', gap: 12, textAlign: 'center' }}>
                  <div style={{ width: 54, height: 54, borderRadius: '50%', background: subtle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={24} color={muted} weight="regular" />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: txt }}>No notifications yet</p>
                    <p style={{ margin: 0, fontSize: 12, color: muted }}>You're all caught up for now</p>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '6px 8px' }}>
                  <AnimatePresence initial={false}>
                    {items.map(n => {
                      const isHov = hoveredId === n.id
                      const rowBg = isHov
                        ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                        : n.read
                          ? 'transparent'
                          : (isDark ? 'rgba(196,181,253,0.06)' : 'rgba(196,181,253,0.07)')

                      return (
                        <motion.div
                          key={n.id}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 26, transition: { duration: 0.17 } }}
                          onMouseEnter={() => setHov(n.id)}
                          onMouseLeave={() => setHov(null)}
                          onClick={() => markRead(n.id)}
                          style={{
                            display: 'flex', gap: 10,
                            padding: '10px 10px 10px 12px',
                            borderRadius: 12, marginBottom: 4,
                            cursor: 'pointer',
                            background: rowBg,
                            borderLeft: n.read ? '3px solid transparent' : '3px solid #C4B5FD',
                            transition: 'background 0.14s',
                          }}
                        >
                          {/* Emoji bubble */}
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: n.emojiBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, alignSelf: 'flex-start', marginTop: 1 }}>
                            {n.emoji}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: n.read ? 600 : 800, color: txt, lineHeight: 1.35 }}>
                              {n.title}
                            </p>
                            <p style={{ margin: '3px 0 0', fontSize: 12, color: muted, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {n.body}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
                              <span style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: 500 }}>{n.time}</span>
                              {n.action && (
                                <button
                                  onClick={e => { e.stopPropagation(); markRead(n.id) }}
                                  style={{ fontSize: 11, fontWeight: 800, color: '#7a12cc', background: 'rgba(196,181,253,0.2)', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                                >
                                  {n.action}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Dismiss X — fades in on row hover */}
                          <button
                            onClick={e => { e.stopPropagation(); dismiss(n.id) }}
                            title="Dismiss"
                            style={{
                              width: 22, height: 22, borderRadius: 6, border: 'none',
                              background: 'transparent', color: muted,
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', flexShrink: 0,
                              alignSelf: 'flex-start', marginTop: 2,
                              opacity: isHov ? 0.65 : 0,
                              transition: 'opacity 0.15s',
                            }}
                          >
                            <X size={11} weight="bold" />
                          </button>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            {!isEmpty && (
              <div style={{ padding: '9px 10px', borderTop: `1px solid ${bd}`, flexShrink: 0 }}>
                <button onClick={clearAll}
                  style={{ width: '100%', padding: '8px', borderRadius: 9, border: `1px solid ${bd}`, background: 'transparent', fontSize: 12, fontWeight: 600, color: muted, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.14s' }}
                  onMouseEnter={e => e.currentTarget.style.background = subtle}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Trash size={13} />
                  Clear all notifications
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
