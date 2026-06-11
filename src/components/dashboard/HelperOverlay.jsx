import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChatTeardropDots, Megaphone, Question } from '@phosphor-icons/react'
import FeedbackPage from './FeedbackPage'
import ChangelogPage from './ChangelogPage'
import HelpPage from './HelpPage'

const CONFIG = {
  feedback: {
    label: 'Send Feedback',
    icon: ChatTeardropDots,
    accent: '#7a12cc',
    accentBg: 'rgba(196,181,253,0.15)',
  },
  changelog: {
    label: "What's New",
    icon: Megaphone,
    accent: '#16a34a',
    accentBg: 'rgba(152,255,152,0.15)',
  },
  help: {
    label: 'Help & Support',
    icon: Question,
    accent: '#c2410c',
    accentBg: 'rgba(255,210,166,0.25)',
  },
}

export default function HelperOverlay({ type, onClose }) {
  const isOpen = !!type
  const cfg = CONFIG[type] || {}
  const Icon = cfg.icon

  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'))

  /* track dark mode changes */
  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-mode'))
    })
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  /* close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* lock body scroll when open */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const panelBg     = isDark ? '#111827' : '#F9FAFB'
  const borderClr   = isDark ? '#374151' : '#E5E7EB'
  const barBg       = isDark ? 'rgba(17,24,39,0.92)'  : 'rgba(249,250,251,0.92)'
  const closeBg     = isDark ? '#1F2937' : '#ffffff'
  const titleColor  = isDark ? '#F9FAFB' : '#333333'

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="helper-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.28)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 10000,
            }}
          />

          {/* ── Slide-in Panel ── */}
          <motion.div
            key={`helper-panel-${type}`}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(560px, 100vw)',
              background: panelBg,
              borderLeft: `1px solid ${borderClr}`,
              zIndex: 10001,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Outfit', 'Inter', sans-serif",
              overflowY: 'auto',
              boxShadow: '-8px 0 48px rgba(0,0,0,0.14)',
            }}
          >
            {/* ── Sticky close bar ── */}
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 20px',
                background: barBg,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: `1px solid ${borderClr}`,
                flexShrink: 0,
              }}
            >
              {/* Left: icon + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34,
                  borderRadius: 10,
                  background: cfg.accentBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {Icon && <Icon size={18} color={cfg.accent} weight="fill" />}
                </div>
                <span style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: titleColor,
                  letterSpacing: '-0.01em',
                }}>
                  {cfg.label}
                </span>
              </div>

              {/* Right: close X */}
              <button
                onClick={onClose}
                title="Close  (Esc)"
                style={{
                  width: 34, height: 34,
                  borderRadius: 10,
                  border: `1px solid ${borderClr}`,
                  background: closeBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = titleColor }}
                onMouseLeave={e => { e.currentTarget.style.color = '#9CA3AF' }}
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* ── Page Content ── */}
            <div style={{ flex: 1 }}>
              {type === 'feedback'  && <FeedbackPage />}
              {type === 'changelog' && <ChangelogPage />}
              {type === 'help'      && <HelpPage />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
