import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Lightbulb, Bug, ArrowRight, Check, PaperPlaneTilt,
  MagnifyingGlass, CaretLeft, ArrowUp, Star, Sparkle,
  ChatTeardropDots, Question, Megaphone
} from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'

/* ─── Mock Data ──────────────────────────────────────────────────── */
const ROADMAP = {
  requests: [
    { id: 1, title: 'AI-powered study schedule generator',   tags: ['Feature Request', 'AI'],          votes: 229 },
    { id: 2, title: 'Mind maps from lecture notes',          tags: ['Feature Request'],                 votes: 108 },
    { id: 3, title: 'Highlight text without flashcards',     tags: ['Feature Request', 'New Feature'],  votes: 54  },
    { id: 4, title: 'Share decks via WhatsApp & Telegram',   tags: ['Feature Request', 'Improvement'], votes: 31  },
  ],
  bugs: [
    { id: 5, title: 'AI assistance fails on long PDFs',      tags: ['Bug'], votes: 20 },
    { id: 6, title: 'Quiz buttons elongated on mobile',      tags: ['Bug'], votes: 6  },
    { id: 7, title: 'Equal cloze cards not generating',      tags: ['Bug'], votes: 4  },
  ],
  approved: [
    { id: 8,  title: 'Merge Two Decks Together',             tags: ['New Feature'], votes: 12 },
    { id: 9,  title: 'Upload Several Document Types',        tags: ['New Feature'], votes: 6  },
    { id: 10, title: 'Offline Mode',                         tags: ['Approved'],    votes: 3  },
  ],
}

const FAQ = [
  { q: 'How do I generate flashcards?',    a: 'Go to Backpack → open any course → tap "Generate" on a material. AI will create a deck in seconds.' },
  { q: 'What is the Arcade?',              a: 'The Arcade is your game zone — quiz battles, timed challenges and leaderboards with friends.' },
  { q: 'How do AI Credits work?',          a: 'Credits are spent when generating AI content. You start with 20,000 and they reset daily.' },
  { q: 'How do I invite friends to a session?', a: 'Go to Sessions, create a room, then share the 6-digit code or invite link.' },
  { q: 'Can I study offline?',             a: 'Offline mode is on our roadmap — vote for it in the Roadmap tab to help prioritise it!' },
]

/* ─── Tag chip colours ───────────────────────────────────────────── */
const TAG_COLORS = {
  Bug:            { bg: '#FEE2E2', color: '#B91C1C' },
  'New Feature':  { bg: '#D1FAE5', color: '#065F46' },
  Approved:       { bg: '#D1FAE5', color: '#065F46' },
  AI:             { bg: '#EDE9FE', color: '#5B21B6' },
  Improvement:    { bg: '#FEF3C7', color: '#92400E' },
  'Feature Request': { bg: 'rgba(196,181,253,0.22)', color: '#7a12cc' },
}
const tagStyle = (tag) => TAG_COLORS[tag] || { bg: '#F3F4F6', color: '#6B7280' }

/* ─── Shared close-bar header ─────────────────────────────────────── */
function WHeader({ icon: Icon, iconBg, iconColor, title, onBack, onClose, isDark }) {
  const bd = isDark ? '#374151' : '#F3F4F6'
  const btnBg = isDark ? '#111827' : '#F3F4F6'
  const muted = isDark ? '#9CA3AF' : '#6B7280'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 13px', borderBottom: `1px solid ${bd}`, flexShrink: 0 }}>
      {onBack
        ? <button onClick={onBack} style={iconBtn(btnBg, muted)}><CaretLeft size={14} weight="bold" /></button>
        : Icon && <div style={{ width: 30, height: 30, borderRadius: 9, background: iconBg || 'rgba(196,181,253,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={15} color={iconColor || '#7a12cc'} weight="fill" />
          </div>
      }
      <span style={{ flex: 1, fontSize: 14, fontWeight: 800, color: isDark ? '#F9FAFB' : '#111', letterSpacing: '-0.015em' }}>{title}</span>
      <button onClick={onClose} style={iconBtn(btnBg, muted)}><X size={13} weight="bold" /></button>
    </div>
  )
}
const iconBtn = (bg, color) => ({
  width: 28, height: 28, borderRadius: 8, border: 'none',
  background: bg, cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
  transition: 'opacity 0.15s',
})

/* ─── Powered-by footer ──────────────────────────────────────────── */
const PoweredBy = ({ isDark }) => (
  <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${isDark ? '#374151' : '#F3F4F6'}` }}>
    <p style={{ margin: 0, fontSize: 11, color: isDark ? '#4B5563' : '#C0C0C0', textAlign: 'center', fontWeight: 500 }}>
      Powered by Luter
    </p>
  </div>
)

/* ─── FEEDBACK MENU ──────────────────────────────────────────────── */
function FeedbackMenu({ onSelect, onClose, isDark }) {
  const bd = isDark ? '#374151' : '#F3F4F6'
  const TYPES = [
    { type: 'feature', Icon: Lightbulb, label: 'Feature Request', desc: 'Suggest an improvement or new idea', accent: '#7a12cc', bg: 'rgba(196,181,253,0.18)' },
    { type: 'bug',     Icon: Bug,       label: 'Bug Report',       desc: 'Something not working as expected?',  accent: '#ef4444', bg: 'rgba(239,68,68,0.1)'    },
  ]
  return (
    <>
      <WHeader icon={Sparkle} title="Give us feedback" onClose={onClose} isDark={isDark} />
      <p style={{ margin: '14px 16px 8px', fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 1.5 }}>
        Tell us how we could make Luter more useful for you.
      </p>
      <div style={{ padding: '0 8px 4px' }}>
        {TYPES.map(({ type, Icon, label, desc, accent, bg }) => (
          <button key={type} onClick={() => onSelect(type)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 10px', borderRadius: 12, border: `1px solid ${bd}`, background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', marginBottom: 6, transition: 'background 0.14s' }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.025)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={accent} weight="fill" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isDark ? '#F9FAFB' : '#111' }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280' }}>{desc}</p>
            </div>
            <ArrowRight size={15} color={isDark ? '#6B7280' : '#C0C0C0'} />
          </button>
        ))}
      </div>
      <PoweredBy isDark={isDark} />
    </>
  )
}

/* ─── FEEDBACK FORM ──────────────────────────────────────────────── */
function FeedbackForm({ fbType, onBack, onClose, onDone, isDark }) {
  const [title, setTitle]   = useState('')
  const [desc, setDesc]     = useState('')
  const [loading, setLoading] = useState(false)

  const isFeature = fbType === 'feature'
  const accent = isFeature ? '#7a12cc' : '#ef4444'
  const bd = isDark ? '#374151' : '#E5E7EB'
  const inputBg = isDark ? '#111827' : '#fff'
  const inputColor = isDark ? '#F9FAFB' : '#111'
  const inputStyle = (focused) => ({
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${focused ? accent : bd}`,
    borderRadius: 11, fontSize: 14, fontFamily: 'inherit',
    color: inputColor, background: inputBg, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.18s',
  })

  const [focusTitle, setFocusTitle] = useState(false)
  const [focusDesc,  setFocusDesc]  = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    try {
      await supabase.from('feedback').insert({
        type: fbType, subject: title.trim(),
        message: desc.trim(), created_at: new Date().toISOString(),
      })
    } catch (_) {}
    setLoading(false)
    onDone()
  }

  return (
    <>
      <WHeader
        icon={isFeature ? Lightbulb : Bug}
        iconColor={accent}
        iconBg={isFeature ? 'rgba(196,181,253,0.18)' : 'rgba(239,68,68,0.1)'}
        title={isFeature ? 'Feature Request' : 'Bug Report'}
        onBack={onBack} onClose={onClose} isDark={isDark}
      />
      <form onSubmit={submit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={isFeature ? 'What feature would you like?' : 'What bug did you encounter?'}
          required
          style={inputStyle(focusTitle)}
          onFocus={() => setFocusTitle(true)}
          onBlur={() => setFocusTitle(false)}
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Describe it in more detail (optional)..."
          rows={4}
          style={{ ...inputStyle(focusDesc), resize: 'vertical', minHeight: 100 }}
          onFocus={() => setFocusDesc(true)}
          onBlur={() => setFocusDesc(false)}
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          style={{
            padding: '12px', background: accent, color: 'white',
            border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700,
            cursor: loading || !title.trim() ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8,
            opacity: loading || !title.trim() ? 0.55 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          <PaperPlaneTilt size={16} weight="fill" />
          {loading ? 'Submitting…' : 'Create New Post'}
        </button>
      </form>
    </>
  )
}

/* ─── FEEDBACK SUCCESS ───────────────────────────────────────────── */
function FeedbackSuccess({ onClose, isDark }) {
  return (
    <div style={{ padding: '44px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, delay: 0.08 }}
        style={{ width: 66, height: 66, borderRadius: '50%', background: 'linear-gradient(135deg,#98FF98,#4ade80)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, boxShadow: '0 10px 28px rgba(74,222,128,0.35)' }}
      >
        <Check size={32} color="white" weight="bold" />
      </motion.div>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: isDark ? '#F9FAFB' : '#111', letterSpacing: '-0.02em' }}>
        Thanks! 🎉
      </h3>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 1.6, maxWidth: 260 }}>
        Your feedback helps us build a better Luter for everyone.
      </p>
      <button onClick={onClose} style={{ padding: '10px 28px', background: '#7a12cc', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        Done
      </button>
    </div>
  )
}

/* ─── CHANGELOG / ROADMAP ────────────────────────────────────────── */
function ChangelogView({ onClose, isDark }) {
  const [tab, setTab] = useState('requests')
  const bd = isDark ? '#374151' : '#F3F4F6'

  const TABS = [
    { id: 'requests', label: 'Feature Requests', items: ROADMAP.requests },
    { id: 'bugs',     label: 'Bugs',             items: ROADMAP.bugs     },
    { id: 'approved', label: 'Approved',          items: ROADMAP.approved },
  ]
  const current = TABS.find(t => t.id === tab)

  return (
    <>
      <WHeader icon={Star} iconBg="rgba(152,255,152,0.2)" iconColor="#16a34a" title="Feature Roadmap" onClose={onClose} isDark={isDark} />

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${bd}`, flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '9px 4px', border: 'none', background: 'transparent',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
              fontWeight: tab === t.id ? 800 : 500,
              color: tab === t.id ? '#7a12cc' : isDark ? '#6B7280' : '#9CA3AF',
              borderBottom: `2px solid ${tab === t.id ? '#7a12cc' : 'transparent'}`,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {t.label}
            <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, background: tab === t.id ? 'rgba(196,181,253,0.25)' : 'transparent', color: tab === t.id ? '#7a12cc' : 'inherit', borderRadius: 99, padding: '1px 5px' }}>
              {t.items.length}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
        {current.items.map(item => (
          <div key={item.id} style={{ padding: '12px 12px', borderRadius: 12, marginBottom: 6, background: isDark ? 'rgba(255,255,255,0.025)' : '#FAFAFA', border: `1px solid ${bd}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#C4B5FD'}
            onMouseLeave={e => e.currentTarget.style.borderColor = bd}
          >
            <p style={{ margin: '0 0 9px', fontSize: 13, fontWeight: 700, color: isDark ? '#F9FAFB' : '#111', lineHeight: 1.45 }}>{item.title}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              {item.tags.map(tag => {
                const tc = tagStyle(tag)
                return <span key={tag} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: tc.bg, color: tc.color }}>{tag}</span>
              })}
              <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#7a12cc', display: 'flex', alignItems: 'center', gap: 3 }}>
                <ArrowUp size={11} weight="bold" /> {item.votes}
              </span>
            </div>
          </div>
        ))}
      </div>
      <PoweredBy isDark={isDark} />
    </>
  )
}

/* ─── HELP HUB HOME ──────────────────────────────────────────────── */
function HelpHome({ onClose, onGoMessage, onGoFaq, isDark }) {
  const bd = isDark ? '#374151' : '#E5E7EB'
  const cardBg = isDark ? '#1F2937' : '#fff'
  const ACTIONS = [
    { Icon: ChatTeardropDots, label: 'Send us a message', sub: 'We reply as soon as possible', accent: '#7a12cc', accentBg: 'rgba(196,181,253,0.18)', onClick: onGoMessage },
    { Icon: MagnifyingGlass,  label: 'Search for help',   sub: 'Browse FAQs and guides',       accent: '#c2410c', accentBg: 'rgba(255,210,166,0.25)', onClick: onGoFaq   },
  ]
  return (
    <>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(155deg,#7a12cc 0%,#a855f7 55%,#C4B5FD 100%)', padding: '26px 20px 46px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -24, right: -24, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -16, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(152,255,152,0.08)' }} />
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <X size={13} weight="bold" />
        </button>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Sparkle size={20} color="white" weight="fill" />
        </div>
        <h2 style={{ margin: '0 0 5px', fontSize: 24, fontWeight: 900, color: 'white', letterSpacing: '-0.025em' }}>Hi there 👋</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>How can we help you today?</p>
      </div>

      {/* Action cards — float over the hero */}
      <div style={{ padding: '14px 12px', marginTop: -22, position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ACTIONS.map(({ Icon, label, sub, accent, accentBg, onClick }) => (
          <button key={label} onClick={onClick}
            style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 14px', borderRadius: 14, border: `1px solid ${bd}`, background: cardBg, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.07)', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0,0,0,0.35)' : '0 8px 22px rgba(0,0,0,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.07)' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: 11, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} color={accent} weight="fill" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isDark ? '#F9FAFB' : '#111' }}>{label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280' }}>{sub}</p>
            </div>
            <ArrowRight size={15} color={isDark ? '#6B7280' : '#C0C0C0'} />
          </button>
        ))}
      </div>
    </>
  )
}

/* ─── HELP FAQ ───────────────────────────────────────────────────── */
function HelpFaq({ onBack, onClose, isDark }) {
  const [open, setOpen] = useState(null)
  const bd = isDark ? '#374151' : '#F3F4F6'
  return (
    <>
      <WHeader title="Help & FAQ" onBack={onBack} onClose={onClose} isDark={isDark} />
      <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
        {FAQ.map((item, i) => (
          <div key={i} style={{ borderRadius: 12, marginBottom: 5, border: `1px solid ${bd}`, overflow: 'hidden' }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', gap: 10 }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#F9FAFB' : '#111', flex: 1, lineHeight: 1.4 }}>{item.q}</span>
              <span style={{ fontSize: 18, color: open === i ? '#7a12cc' : '#9CA3AF', transition: 'transform 0.22s', display: 'block', transform: open === i ? 'rotate(45deg)' : 'none', flexShrink: 0, lineHeight: 1 }}>+</span>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  key="faq-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ overflow: 'hidden' }}
                >
                  <p style={{ margin: 0, padding: '0 14px 14px', fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', lineHeight: 1.65 }}>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </>
  )
}

/* ─── HELP MESSAGE FORM ──────────────────────────────────────────── */
function HelpMessage({ onBack, onClose, onDone, isDark }) {
  const [name, setName]   = useState('')
  const [msg, setMsg]     = useState('')
  const [loading, setLoading] = useState(false)
  const [fn, setFn]       = useState(false)
  const [fm, setFm]       = useState(false)

  const bd = isDark ? '#374151' : '#E5E7EB'
  const inputBg = isDark ? '#111827' : '#fff'
  const inputColor = isDark ? '#F9FAFB' : '#111'
  const field = (focused) => ({
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${focused ? '#C4B5FD' : bd}`,
    borderRadius: 11, fontSize: 14, fontFamily: 'inherit',
    color: inputColor, background: inputBg, outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.18s',
  })

  const submit = async (e) => {
    e.preventDefault()
    if (!msg.trim()) return
    setLoading(true)
    try { await supabase.from('feedback').insert({ type: 'message', subject: name.trim() || 'Anonymous', message: msg.trim(), created_at: new Date().toISOString() }) } catch (_) {}
    setLoading(false)
    onDone()
  }

  return (
    <>
      <WHeader title="Send a message" onBack={onBack} onClose={onClose} isDark={isDark} />
      <form onSubmit={submit} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name (optional)"
          style={field(fn)} onFocus={() => setFn(true)} onBlur={() => setFn(false)} />
        <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="How can we help? Describe your issue or question…"
          rows={5} required style={{ ...field(fm), resize: 'vertical', minHeight: 110 }}
          onFocus={() => setFm(true)} onBlur={() => setFm(false)} />
        <button type="submit" disabled={loading || !msg.trim()}
          style={{ padding: '12px', background: '#7a12cc', color: 'white', border: 'none', borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: loading || !msg.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading || !msg.trim() ? 0.55 : 1, transition: 'opacity 0.2s' }}
        >
          <PaperPlaneTilt size={16} weight="fill" />
          {loading ? 'Sending…' : 'Send Message'}
        </button>
      </form>
    </>
  )
}

/* ─── MAIN WIDGET ────────────────────────────────────────────────── */
export default function HelperWidget({ type, onClose }) {
  const isOpen = !!type
  const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'))
  const [view, setView]     = useState(null)
  const [fbType, setFbType] = useState(null)

  /* Dark mode observer */
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(document.body.classList.contains('dark-mode')))
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  /* Sync view with type prop */
  useEffect(() => {
    if (type === 'feedback')  { setView('fb-menu');    setFbType(null) }
    if (type === 'changelog')   setView('changelog')
    if (type === 'help')        setView('help-home')
    if (!type)                  setView(null)
  }, [type])

  /* Escape key */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  const cardBg     = isDark ? '#1F2937' : '#ffffff'
  const cardBorder = isDark ? '#374151' : '#E5E7EB'

  /* Internal view renderer */
  const renderView = () => {
    switch (view) {
      case 'fb-menu':    return <FeedbackMenu onSelect={(t) => { setFbType(t); setView('fb-form') }} onClose={onClose} isDark={isDark} />
      case 'fb-form':    return <FeedbackForm fbType={fbType} onBack={() => setView('fb-menu')} onClose={onClose} onDone={() => setView('fb-success')} isDark={isDark} />
      case 'fb-success': return <FeedbackSuccess onClose={onClose} isDark={isDark} />
      case 'changelog':  return <ChangelogView onClose={onClose} isDark={isDark} />
      case 'help-home':  return <HelpHome onClose={onClose} isDark={isDark} onGoMessage={() => setView('help-msg')} onGoFaq={() => setView('help-faq')} />
      case 'help-faq':   return <HelpFaq onBack={() => setView('help-home')} onClose={onClose} isDark={isDark} />
      case 'help-msg':   return <HelpMessage onBack={() => setView('help-home')} onClose={onClose} onDone={() => setView('fb-success')} isDark={isDark} />
      default:           return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible backdrop */}
          <motion.div key="hw-bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
          />

          {/* Floating card */}
          <motion.div
            key={`hw-${type}`}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position:    'fixed',
              left:        '270px',
              bottom:      '58px',
              width:       '388px',
              maxHeight:   '560px',
              background:  cardBg,
              border:      `1px solid ${cardBorder}`,
              borderRadius: 24,
              boxShadow:   isDark
                ? '0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.05)'
                : '0 24px 60px rgba(0,0,0,0.16), 0 0 0 1px rgba(0,0,0,0.03)',
              zIndex:      10001,
              fontFamily:  "var(--font-outfit),sans-serif",
              display:     'flex',
              flexDirection: 'column',
              overflow:    'hidden',
              transformOrigin: 'left bottom',
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={view}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{    opacity: 0, x: -8 }}
                transition={{ duration: 0.16 }}
                style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
