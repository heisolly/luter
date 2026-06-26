import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cards,
  MagnifyingGlass,
  Plus,
  Question,
  Lightning,
  Star,
  Coins,
  Bell,
  Sun,
  Moon,
  SidebarSimple,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ArrowRight,
  BookOpen,
  Play,
  Clock,
} from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { getCreditBalance } from '../../services/creditService'
import './dhd.css'
import './DecksPage.css'
import './luterPages.css'

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('luter-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('luter-theme', isDark ? 'dark' : 'light')
  }, [isDark])
  return [isDark, setIsDark]
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now - date
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const BRAND_COLORS = ['#98FF98', '#FFD2A6', '#C4B5FD']
const BRAND_TEXT = ['#16a34a', '#c2410c', '#5b21b6']
const BRAND_BG = ['rgba(152,255,152,0.12)', 'rgba(255,210,166,0.12)', 'rgba(196,181,253,0.12)']

export default function DecksPage() {
  const { user, setNotificationsOpen, sidebarCollapsed, setSidebarCollapsed } = useOutletContext() || {}
  const navigate = useNavigate()
  const { bundle } = useDashboardPrefetch()
  const [isDark, setIsDark] = useDarkMode()
  const [creditsBalance, setCreditsBalance] = useState(Infinity)

  useEffect(() => {
    if (!user?.id) return
    getCreditBalance(user.id).then(b => {
      if (typeof b === 'number') setCreditsBalance(b)
    }).catch(() => {})
  }, [user?.id])

  const stats = bundle?.stats?.data || {}
  const profile = bundle?.profile?.data || bundle?.profile
  const xp = stats?.total_xp ?? 0
  const level = Math.floor(xp / 500) + 1
  const credits = typeof creditsBalance === 'number' ? creditsBalance : profile?.credits ?? 20000

  const [flashcards, setFlashcards] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('flashcards')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.id) return
    const load = async () => {
      setLoading(true)
      try {
        const { data: fcData } = await supabase
          .from('flashcard_bundles')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const { data: maData } = await supabase
          .from('material_analysis')
          .select('id, material_id, analysis, quiz, created_at, updated_at')
          .eq('user_id', user.id)

        let materialsMap = {}
        if (maData && maData.length > 0) {
          const materialIds = maData.map(r => r.material_id).filter(Boolean)
          if (materialIds.length > 0) {
            const { data: matData } = await supabase
              .from('materials')
              .select('id, title, name')
              .in('id', materialIds)
            if (matData) {
              materialsMap = matData.reduce((acc, m) => {
                acc[m.id] = m
                return acc
              }, {})
            }
          }
        }

        const formattedFlashcards = []
        if (fcData) {
          fcData.forEach(bundle => {
            formattedFlashcards.push({
              id: bundle.id,
              material_id: bundle.material_id,
              title: bundle.title || bundle.name || 'Flashcard Deck',
              cards: bundle.cards || [],
              card_count: bundle.cards?.length || bundle.card_count || 0,
              created_at: bundle.created_at,
              source_title: 'Manual Deck',
              is_generated: false,
            })
          })
        }
        if (maData) {
          maData.forEach(row => {
            const cards = row.analysis?.flashcards || row.flashcards || []
            if (cards.length > 0) {
              const material = materialsMap[row.material_id]
              const title = material?.title || material?.name || 'Generated Deck'
              formattedFlashcards.push({
                id: row.id,
                material_id: row.material_id,
                title: `Flashcards: ${title}`,
                cards,
                card_count: cards.length,
                created_at: row.created_at,
                source_title: title,
                is_generated: true,
              })
            }
          })
        }
        formattedFlashcards.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setFlashcards(formattedFlashcards)

        const formattedQuizzes = []
        if (maData) {
          maData.forEach(row => {
            let questions = []
            if (row.quiz) {
              if (Array.isArray(row.quiz)) questions = row.quiz
              else if (row.quiz.questions && Array.isArray(row.quiz.questions)) questions = row.quiz.questions
              else if (typeof row.quiz === 'object') questions = row.quiz.questions || []
            }
            if (questions.length > 0) {
              const material = materialsMap[row.material_id]
              const title = material?.title || material?.name || 'Generated Quiz'
              formattedQuizzes.push({
                id: row.id,
                material_id: row.material_id,
                title: row.quiz?.title || `Quiz: ${title}`,
                questions,
                question_count: questions.length,
                created_at: row.created_at,
                source_title: title,
                is_generated: true,
                _raw: row,
              })
            }
          })
        }
        formattedQuizzes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        setQuizzes(formattedQuizzes)
      } catch (err) {
        console.warn('DecksPage load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const pool = tab === 'flashcards' ? flashcards : quizzes
    if (!q) return pool
    return pool.filter(item =>
      (item.title || '').toLowerCase().includes(q) ||
      (item.source_title || '').toLowerCase().includes(q)
    )
  }, [flashcards, quizzes, tab, search])

  const handleOpen = (item) => {
    if (tab === 'flashcards') {
      navigate(`/workstation/${item.material_id}?view=flashcards`);
    } else {
      navigate(`/workstation/${item.material_id}?view=quizzes`);
    }
  }

  // Summary stats
  const totalDecks = flashcards.length
  const totalQuizzes = quizzes.length
  const totalCards = flashcards.reduce((sum, d) => sum + (d.card_count || 0), 0)
  const totalQs = quizzes.reduce((sum, q) => sum + (q.question_count || 0), 0)

  return (
    <div className="dhd-root">
      {/* ─── Top Header (same as Home / FolderView) ─── */}
      <header className="dhd-header">
        <div className="dhd-header-left">
          {sidebarCollapsed && (
            <button className="dhd-sidebar-toggle" onClick={() => setSidebarCollapsed(false)} title="Toggle Sidebar">
              <SidebarSimple size={14} weight="regular" />
            </button>
          )}
          <div className="dhd-page-title">
            <Cards size={16} weight="regular" />
            <span>My Decks</span>
          </div>
        </div>

        <div className="dhd-header-right">
          <Link to="/profile" className="dhd-badge dhd-badge-level" title="Your Level">
            <Star size={16} weight="fill" />
            <span>Lvl {level}</span>
          </Link>
          <Link to="/profile" className="dhd-badge dhd-badge-xp" title="Your XP">
            <Lightning size={16} weight="fill" />
            <span>{xp} XP</span>
          </Link>
          <Link to="/store" className="dhd-badge dhd-badge-coin" title="Your Coins">
            <Coins size={16} weight="fill" />
            <span>{credits >= 1000 ? `${Math.floor(credits / 1000)}k` : credits}</span>
          </Link>
          <button className="dhd-icon-btn" onClick={() => setNotificationsOpen?.(true)} title="Notifications">
            <Bell size={20} weight="regular" />
            <span className="dhd-notif-dot" />
          </button>
          <button className="dhd-icon-btn" onClick={() => setIsDark(!isDark)} title="Toggle Dark Mode">
            {isDark ? <Sun size={20} weight="regular" /> : <Moon size={20} weight="regular" />}
          </button>
        </div>
      </header>

      <div className="dk2-shell">



        {/* ─── Stats Summary Row ─── */}
        <div className="dk2-stats-row">
          <div className="dk2-stat-chip" style={{ '--chip-color': '#98FF98', '--chip-text': '#16a34a' }}>
            <Cards size={18} weight="fill" />
            <div>
              <span className="dk2-stat-val">{totalDecks}</span>
              <span className="dk2-stat-lbl">Decks</span>
            </div>
          </div>
          <div className="dk2-stat-chip" style={{ '--chip-color': '#C4B5FD', '--chip-text': '#5b21b6' }}>
            <BookOpen size={18} weight="fill" />
            <div>
              <span className="dk2-stat-val">{totalCards}</span>
              <span className="dk2-stat-lbl">Total Cards</span>
            </div>
          </div>
          <div className="dk2-stat-chip" style={{ '--chip-color': '#FFD2A6', '--chip-text': '#c2410c' }}>
            <Question size={18} weight="fill" />
            <div>
              <span className="dk2-stat-val">{totalQuizzes}</span>
              <span className="dk2-stat-lbl">Quizzes</span>
            </div>
          </div>
          <div className="dk2-stat-chip" style={{ '--chip-color': '#98FF98', '--chip-text': '#16a34a' }}>
            <Play size={18} weight="fill" />
            <div>
              <span className="dk2-stat-val">{totalQs}</span>
              <span className="dk2-stat-lbl">Total Questions</span>
            </div>
          </div>
        </div>

        {/* ─── Tab + Search Toolbar ─── */}
        <div className="dk2-toolbar">
          <div className="dk2-tabs">
            <button
              className={`dk2-tab ${tab === 'flashcards' ? 'active' : ''}`}
              onClick={() => setTab('flashcards')}
            >
              <Cards size={16} weight={tab === 'flashcards' ? 'fill' : 'regular'} />
              Flashcard Decks
              <span className="dk2-tab-count">{flashcards.length}</span>
            </button>
            <button
              className={`dk2-tab ${tab === 'quizzes' ? 'active' : ''}`}
              onClick={() => setTab('quizzes')}
            >
              <Question size={16} weight={tab === 'quizzes' ? 'fill' : 'regular'} />
              Quizzes
              <span className="dk2-tab-count">{quizzes.length}</span>
            </button>
          </div>

          <div className="dk2-search">
            <MagnifyingGlass size={15} weight="bold" />
            <input
              type="text"
              placeholder={`Search ${tab}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ─── Content ─── */}
        {loading ? (
          <div className="lp-file-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="lp-file-card skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="dk2-empty">
            <div className="dk2-empty-icon">
              {tab === 'flashcards' ? <Cards size={36} /> : <Question size={36} />}
            </div>
            <h3>{search ? 'No results found' : tab === 'flashcards' ? 'No flashcard decks yet' : 'No quizzes yet'}</h3>
            <p>
              {search
                ? 'Try a different search term.'
                : 'Open any study material in the Workstation to generate your custom study set.'}
            </p>
            <button className="dk2-empty-btn" onClick={() => navigate('/workstation')}>
              Go to Workstation <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              className="lp-file-grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filtered.map((item, i) => {
                const colorIdx = i % 3
                const isFlashcard = tab === 'flashcards'
                const count = isFlashcard ? item.card_count : item.question_count
                const countLabel = isFlashcard ? 'cards' : 'questions'

                // Map brand colors
                const colors = [
                  { bg: 'rgba(152, 255, 152, 0.15)', text: '#16a34a', border: '#98FF98' }, // Mint
                  { bg: 'rgba(255, 210, 166, 0.15)', text: '#c2410c', border: '#FFD2A6' }, // Peach
                  { bg: 'rgba(196, 181, 253, 0.15)', text: '#5b21b6', border: '#C4B5FD' }  // Lavender
                ]
                const theme = colors[colorIdx]

                return (
                  <motion.div
                    key={item.id}
                    className="lp-file-card"
                    style={{
                      border: `1.5px solid ${theme.border}`,
                    }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onClick={() => handleOpen(item)}
                  >
                    <div className="lp-file-card-top">
                      <span 
                        className="lp-file-badge"
                        style={{ background: theme.bg, color: theme.text }}
                      >
                        {isFlashcard ? 'FLASHCARD' : 'QUIZ'}
                      </span>
                    </div>

                    <div className="lp-file-icon-center">
                      <div 
                        className="lp-file-icon-bg"
                        style={{ background: theme.bg, color: theme.text }}
                      >
                        {isFlashcard
                          ? <Cards size={24} weight="fill" />
                          : <Question size={24} weight="fill" />}
                      </div>
                    </div>

                    <div className="lp-file-info">
                      <h3 className="lp-file-title" title={item.title}>
                        {item.title}
                      </h3>
                      <span className="lp-file-date">
                        {count} {countLabel} · {formatDate(item.created_at)}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
