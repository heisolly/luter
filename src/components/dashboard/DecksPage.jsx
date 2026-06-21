import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cards,
  MagnifyingGlass,
  Plus,
  Question,
  StackSimple,
  Trophy,
  Clock,
  BookOpen,
  ArrowRight,
  SortAscending,
  Sparkle,
  Brain,
  Fire,
} from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import './DecksPage.css'

// ── Helpers ────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return 'No date'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const diff = (Date.now() - date) / 1000
  if (diff < 3600)   return 'Just now'
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function masteryPct(deck) {
  const total    = deck.cards?.length || deck.card_count || 0
  const mastered = deck.mastered_count || 0
  if (!total) return 0
  return Math.round((mastered / total) * 100)
}

// Stripe colour based on index so each card feels distinct
const STRIPE_COLORS = [
  '#7C3AED', // purple
  '#10B981', // mint-green
  '#F59E0B', // amber
  '#3B82F6', // blue
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#14B8A6', // teal
  '#F97316', // orange
]

const ICON_STYLES = [
  { bg: '#F3E8FF', color: '#7C3AED' },
  { bg: '#DCFCE7', color: '#16A34A' },
  { bg: '#FFF7ED', color: '#EA580C' },
  { bg: '#DBEAFE', color: '#2563EB' },
  { bg: '#FCE7F3', color: '#EC4899' },
  { bg: '#EDE9FE', color: '#7C3AED' },
]

const getStyle = (id = '') =>
  ICON_STYLES[String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % ICON_STYLES.length]

const getStripe = (id = '') =>
  STRIPE_COLORS[String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0) % STRIPE_COLORS.length]

// ── Skeleton loader ────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="dk-skeleton">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="dk-skel-card" />
      ))}
    </div>
  )
}

// ── Single deck card ───────────────────────────────────────────────
function DeckCard({ item, type, index, onOpen }) {
  const style   = getStyle(item.id)
  const stripe  = getStripe(item.id)
  const cardCount = item.cards?.length || item.card_count || item.question_count || 0
  const pct     = masteryPct(item)
  const score   = item.latest_score

  return (
    <motion.div
      className="dk-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.24, ease: 'easeOut' }}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
    >
      {/* Top colour stripe */}
      <div className="dk-card-stripe" style={{ background: stripe }} />

      <div className="dk-card-body">
        <div className="dk-card-header">
          {/* Icon */}
          <div className="dk-card-icon" style={{ background: style.bg }}>
            {type === 'flashcards'
              ? <Cards size={20} color={style.color} weight="duotone" />
              : <Question size={20} color={style.color} weight="duotone" />}
          </div>
          {/* Badge */}
          <span className={`dk-card-badge ${type === 'flashcards' ? 'flash' : 'quiz'}`}>
            {type === 'flashcards' ? '⚡ Flashcards' : '🧠 Quiz'}
          </span>
        </div>

        {/* Title + source */}
        <div>
          <h3 className="dk-card-title">
            {item.title || item.name || 'Untitled deck'}
          </h3>
          <p className="dk-card-source">
            {item.subject || item.source_title || item.material_title || 'Study material'}
          </p>
        </div>

        {/* Mastery progress — only for flashcards with card counts */}
        {type === 'flashcards' && cardCount > 0 && (
          <div className="dk-card-progress">
            <div className="dk-progress-row">
              <span>Mastery</span>
              <span style={{ color: pct >= 80 ? '#16A34A' : '#7C3AED' }}>{pct}%</span>
            </div>
            <div className="dk-progress-track">
              <div className="dk-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="dk-card-footer">
        <div className="dk-card-meta">
          <span className="dk-meta-chip">
            <StackSimple size={13} />
            {cardCount} {type === 'flashcards' ? 'cards' : 'questions'}
          </span>
          {score !== undefined && score !== null && (
            <span className="dk-meta-chip" style={{ color: score >= 80 ? '#16A34A' : '#F59E0B' }}>
              <Trophy size={13} />
              {score}%
            </span>
          )}
          <span className="dk-meta-chip">
            <Clock size={13} />
            {formatDate(item.created_at)}
          </span>
        </div>
        <button
          className="dk-card-action"
          onClick={(e) => { e.stopPropagation(); onOpen(item) }}
          title="Study now"
        >
          <ArrowRight size={15} />
        </button>
      </div>

      {/* Hover study button */}
      <button
        className="dk-study-now"
        onClick={(e) => { e.stopPropagation(); onOpen(item) }}
      >
        <Sparkle size={13} weight="fill" />
        Study now
      </button>
    </motion.div>
  )
}

// ── Empty state ────────────────────────────────────────────────────
function EmptyState({ tab, search, onGenerate }) {
  const isSearch = search.trim().length > 0
  return (
    <div className="dk-empty">
      <div className="dk-empty-icon" style={{ background: tab === 'flashcards' ? '#F3E8FF' : '#DCFCE7' }}>
        {tab === 'flashcards'
          ? <Cards size={32} color="#7C3AED" weight="duotone" />
          : <Question size={32} color="#16A34A" weight="duotone" />}
      </div>
      <h3>
        {isSearch
          ? 'No matching decks'
          : tab === 'flashcards'
            ? 'No flashcard decks yet'
            : 'No quizzes yet'}
      </h3>
      <p>
        {isSearch
          ? 'Try a different search term or clear the filter.'
          : tab === 'flashcards'
            ? 'Open a study material in the Workstation, generate flashcards, and they will appear here automatically.'
            : 'Take a quiz inside the Workstation and your results will be saved here for review.'}
      </p>
      {!isSearch && (
        <button className="dk-cta-btn" onClick={onGenerate}>
          <Plus size={16} weight="bold" />
          Open Workstation
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
export default function DecksPage() {
  const { user } = useOutletContext()
  const navigate = useNavigate()

  const [flashcards, setFlashcards] = useState([])
  const [quizzes,    setQuizzes]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [tab,        setTab]        = useState('flashcards')
  const [search,     setSearch]     = useState('')
  const [sort,       setSort]       = useState('newest')

  // ── Fetch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        // Flashcard bundles
        const { data: fcData } = await supabase
          .from('flashcard_bundles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fcData) setFlashcards(fcData)

        // Quiz results — from material_analysis where quiz exists
        const { data: qaData } = await supabase
          .from('material_analysis')
          .select('id, material_id, quiz, created_at, updated_at')
          .eq('user_id', user.id)
          .not('quiz', 'is', null)
          .order('updated_at', { ascending: false })

        if (qaData) {
          // Shape into the same card format
          setQuizzes(qaData.map(r => ({
            id:            r.id,
            material_id:   r.material_id,
            title:         `Quiz — ${r.material_id?.slice(0, 8) || 'Material'}`,
            question_count: Array.isArray(r.quiz) ? r.quiz.length : 0,
            created_at:    r.updated_at || r.created_at,
            _raw:          r,
          })))
        }
      } catch (err) {
        console.warn('DecksPage load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  // ── Filter + sort ──────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q     = search.trim().toLowerCase()
    const pool  = tab === 'flashcards' ? flashcards : quizzes
    const items = q
      ? pool.filter(i => (i.title || i.name || i.subject || '').toLowerCase().includes(q))
      : pool
    if (sort === 'name')    return [...items].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    if (sort === 'mastery') return [...items].sort((a, b) => masteryPct(b) - masteryPct(a))
    return items // newest (default — already ordered by DB)
  }, [flashcards, quizzes, tab, search, sort])

  // ── Stats ──────────────────────────────────────────────────────
  const totalCards   = flashcards.reduce((s, d) => s + (d.cards?.length || d.card_count || 0), 0)
  const totalMastered = flashcards.reduce((s, d) => s + (d.mastered_count || 0), 0)

  // ── Navigation ─────────────────────────────────────────────────
  const openDeck = (item) => {
    // Navigate to workstation — the correct existing route
    navigate('/workstation', {
      state: { openFlashcard: item.id, materialId: item.material_id },
    })
  }

  const openQuiz = (item) => {
    navigate('/workstation', {
      state: { openQuiz: item.id, materialId: item.material_id },
    })
  }

  const sortLabel = sort === 'newest' ? 'Newest' : sort === 'name' ? 'A → Z' : 'Mastery'

  return (
    <div className="dk-root">
      {/* ── Topbar ─────────────────────────────────────────────── */}
      <header className="dk-topbar">
        <div className="dk-topbar-left">
          <div className="dk-topbar-icon">
            <Cards size={22} color="#fff" weight="duotone" />
          </div>
          <div className="dk-topbar-titles">
            <span className="dk-topbar-title">My Decks</span>
            <span className="dk-topbar-sub">Flashcards, quizzes &amp; generated study sets</span>
          </div>
        </div>

        <div className="dk-topbar-right">
          <div className="dk-search">
            <MagnifyingGlass size={16} weight="bold" color="#9CA3AF" />
            <input
              type="text"
              placeholder="Search decks…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="dk-cta-btn" onClick={() => navigate('/workstation')}>
            <Plus size={15} weight="bold" />
            Generate
          </button>
        </div>
      </header>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="dk-stats">
        <div className="dk-stat">
          <div className="dk-stat-icon purple"><Cards size={20} weight="duotone" /></div>
          <div className="dk-stat-body">
            <span className="dk-stat-value">{flashcards.length}</span>
            <span className="dk-stat-label">Flashcard decks</span>
          </div>
        </div>
        <div className="dk-stat">
          <div className="dk-stat-icon mint"><Brain size={20} weight="duotone" /></div>
          <div className="dk-stat-body">
            <span className="dk-stat-value">{quizzes.length}</span>
            <span className="dk-stat-label">Saved quizzes</span>
          </div>
        </div>
        <div className="dk-stat">
          <div className="dk-stat-icon blue"><StackSimple size={20} weight="duotone" /></div>
          <div className="dk-stat-body">
            <span className="dk-stat-value">{totalCards}</span>
            <span className="dk-stat-label">Total cards</span>
          </div>
        </div>
        <div className="dk-stat">
          <div className="dk-stat-icon peach"><Fire size={20} weight="duotone" /></div>
          <div className="dk-stat-body">
            <span className="dk-stat-value">{totalMastered}</span>
            <span className="dk-stat-label">Mastered</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className="dk-toolbar">
        <div className="dk-tabs">
          <button
            className={`dk-tab${tab === 'flashcards' ? ' active' : ''}`}
            onClick={() => setTab('flashcards')}
          >
            <Cards size={15} weight={tab === 'flashcards' ? 'fill' : 'regular'} />
            Flashcards
            <span className="dk-tab-count">{flashcards.length}</span>
          </button>
          <button
            className={`dk-tab${tab === 'quizzes' ? ' active' : ''}`}
            onClick={() => setTab('quizzes')}
          >
            <Question size={15} weight={tab === 'quizzes' ? 'fill' : 'regular'} />
            Quizzes
            <span className="dk-tab-count">{quizzes.length}</span>
          </button>
        </div>

        {/* Sort */}
        <button
          className="dk-sort-btn"
          onClick={() => setSort(s => s === 'newest' ? 'name' : s === 'name' ? 'mastery' : 'newest')}
          title="Cycle sort order"
        >
          <SortAscending size={14} />
          {sortLabel}
        </button>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="dk-content">
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <div className="dk-grid">
            <EmptyState
              tab={tab}
              search={search}
              onGenerate={() => navigate('/workstation')}
            />
          </div>
        ) : (
          <div className="dk-grid">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => (
                <DeckCard
                  key={item.id}
                  item={item}
                  type={tab}
                  index={i}
                  onOpen={tab === 'flashcards' ? openDeck : openQuiz}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
