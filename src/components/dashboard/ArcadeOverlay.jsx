/**
 * ArcadeOverlay — Luter brand redesign
 * Visual language: Sidebar (sb-*) + Sessions (sr-*) CSS vars
 * Colors: #7C3AED purple · #C4B5FD lavender · #98FF98 mint · #FFD2A6 peach
 * Font: Outfit
 */
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ArrowLeft, CaretRight, MagnifyingGlass,
  Sparkle, Hash, Folder,
} from '@phosphor-icons/react'
import { RiGamepadFill as Gamepad } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { playgroundService } from '../../services/playgroundService'
import { callGroqAPI, GROQ_MODELS } from '../../groqClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService'

/* ────────────────────────────────────────────────────────────────── */
/*  AI question generation using Groq directly (bypasses broken      */
/*  playgroundService path for clut-live)                            */
/* ────────────────────────────────────────────────────────────────── */
async function generateClutDeck(subject, extractedText = '') {
  const context = extractedText
    ? `Study material context:\n${extractedText.slice(0, 4000)}\n\nSubject: ${subject}`
    : `Subject: ${subject}`

  const prompt = `You are a study quiz generator. Generate exactly 8 diverse quiz flashcards for a live quiz game on: ${context}

Make the cards varied — some should be definitions, some should be facts, some cause-and-effect, some "which of the following" style concepts.
Use natural, academic language. Each "term" should be a short concept, keyword, or question stem. Each "definition" should be the correct answer (under 130 characters).

CRITICAL: Output ONLY valid JSON. No markdown, no extra text.

{"questions":[
  {"term":"Short concept or question stem","definition":"The correct answer or explanation"},
  ...
]}`

  try {
    const response = await callGroqAPI(
      [{ role: 'user', content: prompt }],
      GROQ_MODELS.SPEEDSTER,
      { responseFormat: { type: 'json_object' } }
    )
    let raw = response.choices[0].message.content.trim()
    const start = raw.indexOf('{')
    const end   = raw.lastIndexOf('}')
    if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1)
    const parsed = JSON.parse(raw)
    const qs = parsed.questions || parsed.items || (Array.isArray(parsed) ? parsed : [])
    return qs.map((q, i) => ({
      id:         `clut_${i}`,
      term:       (q.term       || q.question || `Question ${i+1}`).replace(/\*\*/g,'').trim(),
      definition: (q.definition || q.answer   || '').replace(/\*\*/g,'').trim(),
    })).filter(q => q.term && q.definition)
  } catch (err) {
    console.error('[ArcadeOverlay] generateClutDeck error:', err)
    return []
  }
}

/* ────────────────────────────────────────────────────────────────── */
/*  Sub-components                                                    */
/* ────────────────────────────────────────────────────────────────── */

/** Large hub card — mascot emoji, brand accent border */
function HubCard({ emoji, title, desc, accentColor, badge, selected, onClick }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      style={{
        flex: 1, minWidth: 0,
        background: selected ? `${accentColor}12` : 'var(--sb-surface,#fff)',
        border: `2.5px solid ${selected ? accentColor : 'var(--sb-border,#E5E7EB)'}`,
        borderRadius: 22,
        cursor: 'pointer',
        padding: '26px 14px 22px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10,
        textAlign: 'center',
        boxShadow: selected ? `0 0 0 4px ${accentColor}20` : 'none',
        transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
        position: 'relative',
        fontFamily: "'Outfit','Inter',system-ui,sans-serif",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = accentColor }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--sb-border,#E5E7EB)' }}
    >
      {badge && (
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: accentColor, color: '#fff',
          fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '2px 7px', borderRadius: 9999,
        }}>
          {badge}
        </span>
      )}
      <span style={{ fontSize: 52, lineHeight: 1, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}>
        {emoji}
      </span>
      <strong style={{ color: 'var(--sb-text,#0F172A)', fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em' }}>
        {title}
      </strong>
      <span style={{ color: 'var(--sb-text-muted,#475569)', fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>
        {desc}
      </span>
    </motion.button>
  )
}

/** Row inside a sub-menu (Sessions-style) */
function MenuRow({ emoji, iconBg, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '15px 18px', border: 'none',
        background: 'transparent',
        borderBottom: '1px solid var(--sb-border-subtle,#F3F4F6)',
        cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.13s',
        fontFamily: "'Outfit','Inter',system-ui,sans-serif",
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--sb-border-subtle,#F9FAFB)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: iconBg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, fontSize: 20,
      }}>
        {emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sb-text,#0F172A)' }}>{title}</div>
        <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--sb-text-muted,#475569)' }}>{desc}</div>
      </div>
      <CaretRight size={16} color="#C4B5FD" weight="bold" />
    </button>
  )
}

/** Material picker list */
function MaterialList({ materials, search, onSearch, onSelect }) {
  const filtered = materials.filter(m => {
    const q = search.trim().toLowerCase()
    return !q || `${m.title || ''} ${m.file_name || ''}`.toLowerCase().includes(q)
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <MagnifyingGlass size={15} color="#9CA3AF"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search} onChange={e => onSearch(e.target.value)}
          placeholder="Search materials…" autoFocus
          style={{
            width: '100%', height: 40, padding: '0 12px 0 34px',
            border: '1.5px solid var(--sb-border,#E5E7EB)', borderRadius: 12,
            fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box',
            fontFamily: "'Outfit','Inter',sans-serif", color: 'var(--sb-text,#0F172A)',
            background: 'var(--sb-surface,#fff)',
          }}
          onFocus={e => e.target.style.borderColor = '#C4B5FD'}
          onBlur={e => e.target.style.borderColor = 'var(--sb-border,#E5E7EB)'}
        />
      </div>
      <div style={{ border: '1px solid var(--sb-border,#E5E7EB)', borderRadius: 14, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
            No materials — upload one in Backpack
          </div>
        ) : filtered.map(m => (
          <button key={m.id} onClick={() => onSelect(m)}
            style={{
              width: '100%', padding: '12px 16px', border: 'none',
              borderBottom: '1px solid #F3F4F6', background: 'transparent',
              textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              color: 'var(--sb-text,#0F172A)', transition: 'background 0.12s',
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: "'Outfit','Inter',sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F5F3FF'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.title || m.file_name || 'Untitled'}
            </span>
            <CaretRight size={14} color="#C4B5FD" weight="bold" />
          </button>
        ))}
      </div>
    </div>
  )
}

/** Single-line text input + CTA */
function TextAction({ value, onChange, placeholder, onSubmit, loading, btnLabel = 'Start →', btnColor = '#7C3AED' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input
        value={value} onChange={e => onChange(e.target.value)} autoFocus
        onKeyDown={e => e.key === 'Enter' && value.trim() && !loading && onSubmit()}
        placeholder={placeholder}
        style={{
          height: 48, border: '2px solid var(--sb-border,#E5E7EB)', borderRadius: 14,
          padding: '0 16px', fontSize: 15, fontWeight: 600, outline: 'none',
          fontFamily: "'Outfit','Inter',sans-serif", color: 'var(--sb-text,#0F172A)',
          background: 'var(--sb-surface,#fff)', transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = '#C4B5FD'}
        onBlur={e => e.target.style.borderColor = 'var(--sb-border,#E5E7EB)'}
      />
      <button
        onClick={onSubmit} disabled={!value.trim() || loading}
        style={{
          height: 50, background: !value.trim() || loading ? '#E5E7EB' : btnColor,
          color: !value.trim() || loading ? '#9CA3AF' : '#fff',
          border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 15,
          cursor: !value.trim() || loading ? 'not-allowed' : 'pointer',
          fontFamily: "'Outfit','Inter',sans-serif", transition: 'background 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading
          ? <><span style={{ width: 16, height: 16, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'ao-spin 0.7s linear infinite', display: 'inline-block' }} /> Preparing room…</>
          : btnLabel
        }
      </button>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────── */
/*  Main                                                              */
/* ────────────────────────────────────────────────────────────────── */
const HUB = [
  { id: 'memorize', emoji: '🧠', title: 'Memorize', desc: 'Active recall quizzes', accent: '#22C55E', badge: null    },
  { id: 'clut',     emoji: '⚡', title: 'Clut Live', desc: 'Play with your friends', accent: '#F59E0B', badge: 'LIVE' },
  { id: 'heist',    emoji: '🕵️', title: 'Knowledge Heist', desc: 'Social deduction game', accent: '#EF4444', badge: 'NEW' },
  { id: 'games',    emoji: '🎮', title: 'Other games', desc: 'Matching, Stacker, Blitz', accent: '#7C3AED', badge: null },
]

export default function ArcadeOverlay({ onClose, user }) {
  const navigate = useNavigate()

  const [selected, setSelected]   = useState('memorize')
  const [step, setStep]           = useState('hub')
  const [materials, setMaterials] = useState([])
  const [matSearch, setMatSearch] = useState('')
  const [topicVal, setTopicVal]   = useState('')
  const [codeVal, setCodeVal]     = useState('')
  const [loading, setLoading]     = useState(false)
  const [toast, setToast]         = useState(null)

  // Esc close
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  // Fetch user's materials
  useEffect(() => {
    if (!user?.id) return
    supabase
      .from('materials')
      .select('id, title, file_name, type, extracted_text, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(40)
      .then(({ data }) => { if (data) setMaterials(data) })
  }, [user?.id])

  const flash = (msg, type = 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  /* ── Hub CTA ── */
  const handleStart = () => {
    if (selected === 'memorize') { setStep('memorize'); return }
    if (selected === 'clut')     { setStep('clut-menu'); return }
    if (selected === 'heist')    { navigate('/dashboard/heist'); onClose(); return }
    if (selected === 'games')    { navigate('/dashboard/compete?step=content'); onClose(); return }
  }

  /* ── Memorize ── */
  const openMemorize = m => {
    navigate(`/dashboard/workstation?materialId=${encodeURIComponent(m.id)}&tool=quiz`)
    onClose()
  }

  /* ── Clut Live — create room with proper AI deck ── */
  const openClutLive = async ({ material, topic, code } = {}) => {
    if (code) {
      navigate(`/clut/live/${encodeURIComponent(code.trim())}`)
      onClose()
      return
    }
    if (!user?.id) { flash('Sign in to create a Clut room.'); return }

    setLoading(true)
    const roomCode  = String(Math.floor(100000000 + Math.random() * 900000000))
    const title     = material?.title || material?.file_name || topic || 'Clut Live'
    const extracted = material?.extracted_text || ''

    try {
      const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.BATTLE_QUESTIONS, false)
      if (!ok) { flash("You've used up your AI credits for today. They reset daily."); setLoading(false); return }

      flash('⏳ Generating questions with AI…', 'info')
      const deck = await generateClutDeck(title, extracted)

      if (deck.length === 0) {
        // Minimal fallback so the room still works
        deck.push(
          { id: 'f1', term: title,    definition: `A key concept related to ${title}` },
          { id: 'f2', term: 'Recall', definition: 'Retrieving information from memory' },
          { id: 'f3', term: 'Mastery', definition: 'Knowing a topic deeply enough to use it' },
        )
      }

      await playgroundService.createRoom('clut-live', user.id, { mode: 'multiplayer' }, {
        clut_code:   roomCode,
        source_type: material ? 'material' : 'topic',
        source_id:   material?.id    || null,
        title,
        topic:       topic           || null,
        deck,
      })

      const params = new URLSearchParams()
      if (material?.id) params.set('materialId', material.id)
      params.set('title', title)
      navigate(`/clut/live/${roomCode}?${params.toString()}`)
      onClose()
    } catch (err) {
      console.error('[ArcadeOverlay] openClutLive error:', err)
      flash('Could not create room — check your connection and try again.')
    } finally {
      setLoading(false)
      setToast(null)
    }
  }

  /* ── Back ── */
  const back = () => {
    const map = { 'memorize': 'hub', 'clut-menu': 'hub', 'clut-material': 'clut-menu', 'clut-topic': 'clut-menu', 'clut-code': 'clut-menu' }
    setStep(map[step] || 'hub')
  }

  const isHub = step === 'hub'
  const accentColor = HUB.find(h => h.id === selected)?.accent || '#7C3AED'

  /* ── Content per step ── */
  const renderContent = () => {
    /* ── HUB ── */
    if (step === 'hub') return (
      <motion.div key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
        {/* Mascot + heading */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <img
            src="/mascot.png" alt="Luter mascot"
            style={{ width: 72, height: 72, marginBottom: 8, filter: 'drop-shadow(0 4px 12px rgba(124,58,237,0.2))', animation: 'ao-float 4s ease-in-out infinite' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--sb-text,#0F172A)', letterSpacing: '-0.025em' }}>
            How do you want to study?
          </h2>
        </div>

        {/* Cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          {HUB.map(c => (
            <HubCard
              key={c.id}
              emoji={c.emoji}
              title={c.title}
              desc={c.desc}
              accentColor={c.accent}
              badge={c.badge}
              selected={selected === c.id}
              onClick={() => setSelected(c.id)}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleStart}
          style={{
            width: '100%', height: 54,
            background: accentColor === '#22C55E'
              ? 'linear-gradient(135deg, #22C55E, #16A34A)'
              : accentColor === '#F59E0B'
                ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            color: '#fff', border: 'none', borderRadius: 16,
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
            fontFamily: "'Outfit','Inter',sans-serif",
            letterSpacing: '-0.01em',
            boxShadow: `0 8px 24px ${accentColor}40`,
            transition: 'box-shadow 0.2s',
          }}
        >
          Start learning →
        </motion.button>
      </motion.div>
    )

    /* ── MEMORIZE ── */
    if (step === 'memorize') return (
      <motion.div key="memorize" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--sb-text-muted,#475569)', fontWeight: 600, lineHeight: 1.5 }}>
          Pick a material — Luter opens the quiz workspace for it.
        </p>
        <MaterialList materials={materials} search={matSearch} onSearch={setMatSearch} onSelect={openMemorize} />
      </motion.div>
    )

    /* ── CLUT MENU ── */
    if (step === 'clut-menu') return (
      <motion.div key="clut-menu" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 22px', borderRadius: 999,
            border: '2.5px solid #F59E0B',
            color: '#0F172A', fontWeight: 800, fontSize: 15,
            fontFamily: "'Outfit','Inter',sans-serif",
          }}>
            ⚡ Clut Live
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--sb-text-muted,#475569)', fontWeight: 600 }}>
            AI generates questions live — friends join with a code
          </p>
        </div>
        <div style={{ border: '1px solid var(--sb-border,#E5E7EB)', borderRadius: 16, overflow: 'hidden' }}>
          <MenuRow emoji="📂" iconBg="#F3F4F6"  title="From a material" desc="Quiz on an uploaded file" onClick={() => setStep('clut-material')} />
          <MenuRow emoji="✨" iconBg="#FEF9C3"  title="Any topic"       desc="Quiz on any subject"      onClick={() => setStep('clut-topic')}    />
          <MenuRow emoji="🔑" iconBg="#EDE9FE"  title="Have a code?"   desc="Join a friend's room"    onClick={() => setStep('clut-code')}     />
        </div>
      </motion.div>
    )

    /* ── CLUT — from material ── */
    if (step === 'clut-material') return (
      <motion.div key="clut-material" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--sb-text-muted,#475569)', fontWeight: 600, lineHeight: 1.5 }}>
          AI will read the material and generate quiz questions live.
        </p>
        <MaterialList
          materials={materials} search={matSearch}
          onSearch={setMatSearch}
          onSelect={m => openClutLive({ material: m })}
        />
        {loading && (
          <div style={{ marginTop: 14, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#F59E0B' }}>
            ⏳ Generating questions…
          </div>
        )}
      </motion.div>
    )

    /* ── CLUT — topic ── */
    if (step === 'clut-topic') return (
      <motion.div key="clut-topic" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--sb-text-muted,#475569)', fontWeight: 600, lineHeight: 1.5 }}>
          Enter any topic — Luter generates questions with AI.
        </p>
        <TextAction
          value={topicVal} onChange={setTopicVal}
          placeholder="e.g. Cell biology, Nigerian history…"
          onSubmit={() => topicVal.trim() && openClutLive({ topic: topicVal.trim() })}
          loading={loading} btnLabel="Create room →" btnColor="#F59E0B"
        />
      </motion.div>
    )

    /* ── CLUT — code ── */
    if (step === 'clut-code') return (
      <motion.div key="clut-code" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--sb-text-muted,#475569)', fontWeight: 600, lineHeight: 1.5 }}>
          Enter the game code your friend shared with you.
        </p>
        <TextAction
          value={codeVal} onChange={v => setCodeVal(v.toUpperCase())}
          placeholder="e.g. 209576910"
          onSubmit={() => codeVal.trim() && openClutLive({ code: codeVal.trim() })}
          loading={loading} btnLabel="Join game →" btnColor="#7C3AED"
        />
      </motion.div>
    )

    return null
  }

  return createPortal(
    <>
      {/* Global keyframe styles */}
      <style>{`
        @keyframes ao-spin  { to { transform: rotate(360deg); } }
        @keyframes ao-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15,23,42,0.52)',
          backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
      >
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              style={{
                position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)',
                background: toast.type === 'error' ? '#EF4444' : toast.type === 'info' ? '#7C3AED' : '#16A34A',
                color: '#fff', padding: '10px 22px', borderRadius: 20,
                fontWeight: 800, fontSize: 13, zIndex: 1, whiteSpace: 'nowrap', pointerEvents: 'none',
                fontFamily: "'Outfit','Inter',sans-serif",
              }}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.91, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.91, y: 24 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--sb-surface,#fff)',
            border: '1px solid var(--sb-border,#E5E7EB)',
            borderRadius: 28,
            padding: '24px 24px 22px',
            width: '100%', maxWidth: isHub ? 580 : 480,
            boxShadow: '0 32px 80px rgba(15,23,42,0.22)',
            fontFamily: "'Outfit','Inter',system-ui,sans-serif",
            transition: 'max-width 0.25s ease',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {!isHub && (
                <button onClick={back} style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--sb-border,#E5E7EB)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sb-text-muted,#475569)', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--sb-border-subtle,#F9FAFB)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <ArrowLeft size={16} weight="bold" />
                </button>
              )}
              {isHub && (
                <div style={{ width: 40, height: 40, borderRadius: 13, background: 'linear-gradient(135deg,#7C3AED,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(124,58,237,0.28)', flexShrink: 0 }}>
                  <Gamepad size={20} color="#fff" />
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 18, color: 'var(--sb-text,#0F172A)', letterSpacing: '-0.02em' }}>
                  {isHub ? 'Arcade' : { 'memorize': '🧠 Memorize', 'clut-menu': '⚡ Clut Live', 'clut-material': 'Pick material', 'clut-topic': 'Any topic', 'clut-code': 'Join room' }[step] || 'Arcade'}
                </p>
                {isHub && (
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: 'var(--sb-text-muted,#475569)' }}>
                    Study smarter. Play harder.
                  </p>
                )}
              </div>
            </div>
            <button onClick={onClose}
              style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid var(--sb-border,#E5E7EB)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sb-text-muted,#475569)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FECACA' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--sb-text-muted,#475569)'; e.currentTarget.style.borderColor = 'var(--sb-border,#E5E7EB)' }}
            >
              <X size={17} weight="bold" />
            </button>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>

          {/* Footer */}
          {isHub && (
            <p style={{ margin: '14px 0 0', textAlign: 'center', fontSize: 11, color: 'var(--sb-text-muted,#94A3B8)', fontWeight: 500, fontFamily: "'Outfit','Inter',sans-serif" }}>
              Press <kbd style={{ padding: '1px 5px', border: '1px solid var(--sb-border,#E5E7EB)', borderRadius: 5, fontSize: 10, fontWeight: 700, background: 'var(--sb-bg,#F9FAFB)' }}>Esc</kbd> to close
            </p>
          )}
        </motion.div>
      </div>
    </>,
    document.body
  )
}
