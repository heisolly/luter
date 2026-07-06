import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Trash, ArrowRight } from 'lucide-react'
import { Bell } from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationsOverlay({ isOpen, onClose, userId }) {
  const [items, setItems]   = useState([])
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'))
  const [loading, setLoading] = useState(true)
  const cardRef             = useRef(null)
  
  const navigate = useNavigate()
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.body.classList.contains('dark-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!isOpen || !userId) return
    let mounted = true

    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(6)
      
      if (mounted && data) setItems(data)
      if (mounted) setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [isOpen, userId])

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  useEffect(() => {
    const h = (e) => { if (cardRef.current && !cardRef.current.contains(e.target)) onClose() }
    if (isOpen) setTimeout(() => document.addEventListener('mousedown', h), 80)
    return () => document.removeEventListener('mousedown', h)
  }, [isOpen, onClose])

  const unread = items.filter(n => !n.is_read).length
  
  const markAll = async () => {
    setItems(p => p.map(n => ({ ...n, is_read: true })))
    if (userId) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    }
  }

  const markRead = async (id) => {
    setItems(p => p.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const dismiss = async (id) => {
    setItems(p => p.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }

  const clearAll = async () => {
    setItems([])
    if (userId) {
      await supabase.from('notifications').delete().eq('user_id', userId)
    }
  }

  const cardBg = isDark ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.9)'
  const bd     = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
  const txt    = isDark ? '#F9FAFB' : '#111827'
  const muted  = isDark ? '#9CA3AF' : '#6B7280'
  const isEmpty = items.length === 0 && !loading

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="nb-bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 9000 }}
          />

          <motion.div
            key="nb-card"
            ref={cardRef}
            initial={{ opacity: 0, y: -16, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0,  scale: 1, filter: 'blur(0px)' }}
            exit={{    opacity: 0, y: -16, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.3 }}
            style={{
              position: 'fixed',
              right: '24px',
              top: '74px',
              width: '380px',
              background: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '32px',
              boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.06)',
              zIndex: 9001,
              fontFamily: "'Outfit', sans-serif",
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: txt, letterSpacing: '-0.02em' }}>Notifications</h3>
                {unread > 0 && (
                  <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 500, color: muted }}>You have {unread} new updates</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {unread > 0 && (
                  <button onClick={markAll} title="Mark all as read"
                    style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: isDark ? '#374151' : '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: txt, transition: 'all 0.2s' }}>
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                )}
                <button onClick={onClose}
                  style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = isDark ? '#374151' : '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 24, height: 24, border: `3px solid ${isDark ? '#F9FAFB' : '#111827'}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : isEmpty ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Bell size={28} color={muted} strokeWidth={1.5} />
                  </div>
                  <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: txt }}>No notifications</h4>
                  <p style={{ margin: 0, fontSize: 14, color: muted, fontWeight: 500 }}>We'll let you know when something happens.</p>
                </div>
              ) : (
                <div style={{ padding: '8px' }}>
                  <AnimatePresence initial={false}>
                    {items.map((n, i) => {
                      const meta = n.metadata || {}
                      const emoji = meta.emoji || (n.type === 'popup_modal' ? '🚨' : '💬')
                      
                      return (
                        <motion.div
                          key={n.id}
                          layout
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                          onClick={() => {
                            if (!n.is_read) markRead(n.id)
                            if (meta.action_url) {
                              onClose()
                              navigate(meta.action_url)
                            }
                          }}
                          style={{
                            position: 'relative',
                            display: 'flex',
                            gap: 16,
                            padding: '16px',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            background: 'transparent',
                            marginBottom: '4px',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? '#374151' : '#F9FAFB'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <div style={{ width: 48, height: 48, borderRadius: '16px', background: isDark ? '#374151' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                            {emoji}
                          </div>

                          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <h4 style={{ margin: 0, fontSize: 15, fontWeight: !n.is_read ? 800 : 600, color: txt }}>
                                {n.title}
                              </h4>
                              {!n.is_read && (
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFD2A6', flexShrink: 0 }} />
                              )}
                            </div>
                            <p style={{ margin: 0, fontSize: 14, color: !n.is_read ? txt : muted, lineHeight: 1.5, opacity: !n.is_read ? 0.9 : 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {n.message}
                            </p>
                            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: muted, marginTop: 8 }}>
                              {formatDistanceToNow(new Date(n.created_at))} ago
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '8px 24px 24px', display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => { onClose(); navigate('/notifications') }}
                style={{ padding: '8px 16px', borderRadius: '100px', border: 'none', background: 'transparent', fontSize: 14, fontWeight: 700, color: muted, cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = txt}
                onMouseLeave={e => e.currentTarget.style.color = muted}
              >
                View all notifications
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
