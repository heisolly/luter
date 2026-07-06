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

import { useTheme } from '../../contexts/ThemeContext'

function useDarkMode() {
  const { isDark, setTheme } = useTheme();
  return [isDark, (d) => setTheme(d ? 'dark' : 'light')];
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

export default function DecksPage() {
  const { user, setNotificationsOpen, sidebarCollapsed, setSidebarCollapsed } = useOutletContext() || {}
  const navigate = useNavigate()
  const { bundle } = useDashboardPrefetch()
  const [isDark, setIsDark] = useDarkMode()
  const [creditsBalance, setCreditsBalance] = useState(Infinity)

  const bgCard = isDark ? "#1F2937" : "#FFFFFF";
  const bgCardHover = isDark ? "#374151" : "#F9FAFB";
  const borderCard = isDark ? "#374151" : "#E5E7EB";
  const borderCardHover = isDark ? "#4B5563" : "#D1D5DB";
  const textTitle = isDark ? "#F9FAFB" : "#111827";
  const textBody = isDark ? "#9CA3AF" : "#4B5563";
  const bgPill = isDark ? "#111827" : "#F3F4F6";

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
  const [isXpOpen, setIsXpOpen] = useState(false)
  const [isCoinsOpen, setIsCoinsOpen] = useState(false)
  const [isPremiumOpen, setIsPremiumOpen] = useState(false)

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
          {/* Get Premium UI for Free Users */}
          {(!profile?.subscription_tier || profile?.subscription_tier === 'free') && credits < 2000 && (
            <button className="premium-btn" onClick={() => navigate('/store')} style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              border: '2px solid transparent',
              background: `linear-gradient(${isDark ? '#1F2937' : '#fff'}, ${isDark ? '#1F2937' : '#fff'}) padding-box, linear-gradient(86deg, #7491FF 0%, #FF90E0 50%, #F9D25C 100%) border-box`,
              color: isDark ? '#fff' : '#142563',
              fontWeight: 600,
              fontSize: '15px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
              transition: 'all 0.05s ease'
            }}>
              Go Premium
            </button>
          )}

          {/* XP Pill */}
          <div style={{ position: 'relative' }}>
            <button className="dhd-pill-btn" onClick={() => { setIsXpOpen(!isXpOpen); setIsCoinsOpen(false); }} style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: `2px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                background: isDark ? '#1F2937' : '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textDecoration: 'none',
                outline: 'none'
            }}>
              <span id="header-xp-display" style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#000' }}>{xp}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 19 25" fill="none">
                <path d="M1.27498 12.516L10.1761 1.31828C10.7098 0.646883 11.7966 1.11739 11.6606 1.96094L10.3758 9.92921H15.8888C16.9368 9.92921 17.5236 11.1248 16.8757 11.94L7.97457 23.1377C7.44087 23.8091 6.35401 23.3386 6.49003 22.495L7.7748 14.5268H2.26186C1.21381 14.5268 0.62701 13.3312 1.27498 12.516Z" fill="transparent" stroke="#10B981" strokeWidth="2.5"></path>
              </svg>
            </button>
            {isXpOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '12px',
                background: isDark ? '#1F2937' : '#fff',
                borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                width: '320px', padding: '24px', display: 'flex', flexDirection: 'column',
                gap: '16px', zIndex: 50, cursor: 'default'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#000', lineHeight: 1 }}>{xp}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 19 25" fill="none">
                      <path d="M1.27498 12.516L10.1761 1.31828C10.7098 0.646883 11.7966 1.11739 11.6606 1.96094L10.3758 9.92921H15.8888C16.9368 9.92921 17.5236 11.1248 16.8757 11.94L7.97457 23.1377C7.44087 23.8091 6.35401 23.3386 6.49003 22.495L7.7748 14.5268H2.26186C1.21381 14.5268 0.62701 13.3312 1.27498 12.516Z" fill="transparent" stroke="#10B981" strokeWidth="2"></path>
                    </svg>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="4.8" y="2.4" width="14.4" height="19.2" rx="1.08" stroke={isDark ? '#374151' : '#E2E8F0'} strokeWidth="3.76"></rect>
                      <path d="M9.08 0.94L14.92 0.94C15 0.94 15.06 1 15.06 1.08L15.06 1.46L8.94 1.46L8.94 1.08C8.94 1 9 0.94 9.08 0.94Z" stroke={isDark ? '#374151' : '#E2E8F0'} strokeWidth="1.88"></path>
                      <path d="M9.08 23.06L14.92 23.06C15 23.06 15.06 23 15.06 22.92L15.06 22.54L8.94 22.54L8.94 22.92C8.94 23 9 23.06 9.08 23.06Z" stroke={isDark ? '#374151' : '#E2E8F0'} strokeWidth="1.88"></path>
                    </svg>
                  </div>
                </div>
                <span style={{ fontSize: '15px', color: isDark ? '#9CA3AF' : '#475569', margin: 0, fontWeight: 500 }}>
                  Solve <strong style={{ color: isDark ? '#F9FAFB' : '#000', fontWeight: 800 }}>2</strong> more problems to start a streak.
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px' }}>
                  {[ { label: 'T', active: true }, { label: 'W', active: false }, { label: 'Th', active: false }, { label: 'F', active: false }, { label: 'S', active: false } ].map((day, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M10.2903 16.2252L16.5654 8.24794C16.9417 7.76964 17.7079 8.10483 17.612 8.70578L16.7061 14.3834H20.5934C21.3322 14.3834 21.7459 15.2351 21.2891 15.8159L15.014 23.7931C14.6378 24.2714 13.8716 23.9362 13.9674 23.3353L14.8734 17.6577H10.9861C10.2472 17.6577 9.83354 16.8059 10.2903 16.2252Z" fill={isDark ? '#374151' : '#F1F5F9'}></path>
                        <rect x="1" y="1" width="30" height="30" rx="15" stroke={isDark ? '#F9FAFB' : '#000'} strokeOpacity={day.active ? 0.2 : 0.05} strokeWidth="1.5"></rect>
                      </svg>
                      <span style={{ fontSize: '15px', color: day.active ? (isDark ? '#F9FAFB' : '#000') : (isDark ? '#6B7280' : '#64748B'), fontWeight: day.active ? 700 : 500 }}>
                        {day.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? '#111827' : '#F8FAFC', borderRadius: '16px', padding: '16px 0', gap: '24px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#000' }}>0</span>
                    <span style={{ fontSize: '14px', color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 500 }}>Max streak</span>
                  </div>
                  <div style={{ width: '1px', height: '32px', background: isDark ? '#374151' : '#E2E8F0' }}></div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#000' }}>0</span>
                    <span style={{ fontSize: '14px', color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 500 }}>Lessons complete</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coins Pill */}
          <div style={{ position: 'relative' }}>
            <button className="dhd-pill-btn" onClick={() => { setIsCoinsOpen(!isCoinsOpen); setIsXpOpen(false); }} style={{
                padding: '8px 20px',
                borderRadius: '9999px',
                border: `2px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                background: isDark ? '#1F2937' : '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textDecoration: 'none',
                outline: 'none'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#000' }}>{credits >= 1000 ? `${Math.floor(credits / 1000)}k` : credits}</span>
              <Coins size={22} weight="fill" color="#F59E0B" />
            </button>
            {isCoinsOpen && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: '12px',
                background: isDark ? '#1F2937' : '#fff',
                borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
                width: '320px', padding: '24px 20px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '24px', zIndex: 50, cursor: 'default'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#000', lineHeight: 1 }}>{credits}</span>
                    <Coins size={51} weight="fill" color="#F59E0B" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#F9FAFB' : '#000', margin: 0, textAlign: 'center' }}>You have {credits} coins</h4>
                    
                    <div style={{ background: isDark ? '#374151' : '#F1F5F9', borderRadius: '12px', padding: '12px', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 700 }}>How to earn coins:</span>
                      <span style={{ fontSize: '14px', color: isDark ? '#D1D5DB' : '#334155', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} color="#10B981" /> Explore Luter materials</span>
                      <span style={{ fontSize: '14px', color: isDark ? '#D1D5DB' : '#334155', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} color="#10B981" /> Complete Quizzes &amp; Flashcards</span>
                    </div>

                    <span style={{ fontSize: '14px', color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 500, margin: 0, textAlign: 'center', marginTop: '4px' }}>Use coins to unlock premium tools and exclusive store items!</span>
                  </div>
                </div>
                <Link to="/store" style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center', textDecoration: 'none',
                  width: '100%', padding: '16px 24px', borderRadius: '16px',
                  background: 'linear-gradient(86deg, #7491FF -7.44%, #FF90E0 44.8%, #F7C325 102.54%)',
                  color: '#fff', fontWeight: 700, fontSize: '16px', border: 'none', cursor: 'pointer',
                  position: 'relative', overflow: 'hidden', outline: 'none', boxShadow: '0 4px 15px rgba(255, 144, 224, 0.4)'
                }}>
                  Visit the store
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
                    <svg viewBox="0 0 150 56" focusable="false" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                      <g clipPath="url(#:r7l:)">
                        <rect opacity="0.4" x="75" y="-58.6328" width="51" height="150" transform="rotate(30 75 -58.6328)" fill="url(#:r7j:)"></rect>
                        <rect opacity="0.4" x="127.826" y="-28.1328" width="26" height="150" transform="rotate(30 127.826 -28.1328)" fill="url(#:r7k:)"></rect>
                      </g>
                      <defs>
                        <linearGradient id=":r7j:" x1="100.5" y1="-58.6328" x2="100.5" y2="91.3672" gradientUnits="userSpaceOnUse"><stop offset="0.27" stopColor="#F5EFFF"></stop><stop offset="0.71" stopColor="white" stopOpacity="0"></stop></linearGradient>
                        <linearGradient id=":r7k:" x1="140.826" y1="-28.1328" x2="140.826" y2="121.867" gradientUnits="userSpaceOnUse"><stop offset="0.081302" stopColor="#F5EFFF"></stop><stop offset="0.570844" stopColor="white" stopOpacity="0"></stop></linearGradient>
                        <clipPath id=":r7l:"><rect width="150" height="56" fill="white"></rect></clipPath>
                      </defs>
                    </svg>
                  </div>
                </Link>
              </div>
            )}
          </div>

          <button 
            className="dhd-icon-btn" 
            onClick={() => setNotificationsOpen?.(true)}
            title="Notifications"
          >
            <Bell size={24} weight="regular" />
            <span className="dhd-notif-dot" />
          </button>

          <button 
            className="dhd-icon-btn" 
            onClick={() => setIsDark(!isDark)}
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={24} weight="regular" /> : <Moon size={24} weight="regular" />}
          </button>
        </div>
      </header>

      <div className="dk2-shell">
        {/* ─── Stats Summary Row ─── */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {[
            { label: 'Decks', val: totalDecks, icon: Cards },
            { label: 'Total Cards', val: totalCards, icon: BookOpen },
            { label: 'Quizzes', val: totalQuizzes, icon: Question },
            { label: 'Total Questions', val: totalQs, icon: Play }
          ].map((stat, idx) => (
            <div key={idx} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 24px',
              backgroundColor: bgCard, border: `1px solid ${borderCard}`, borderRadius: '20px',
              flex: '1', minWidth: '160px'
            }}>
              <div style={{ color: textTitle }}>
                <stat.icon size={24} weight="fill" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '20px', fontWeight: '800', color: textTitle, lineHeight: '1.2' }}>{stat.val}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: textBody, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Tab + Search Toolbar ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: bgCard, borderRadius: '12px', border: `1px solid ${borderCard}` }}>
            <button
              onClick={() => setTab('flashcards')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
                backgroundColor: tab === 'flashcards' ? (isDark ? '#374151' : '#F3F4F6') : 'transparent',
                color: tab === 'flashcards' ? textTitle : textBody,
                transition: 'all 0.2s'
              }}
            >
              <Cards size={16} weight={tab === 'flashcards' ? 'fill' : 'regular'} />
              Flashcard Decks
            </button>
            <button
              onClick={() => setTab('quizzes')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontSize: '14px', fontWeight: '600', fontFamily: 'inherit',
                backgroundColor: tab === 'quizzes' ? (isDark ? '#374151' : '#F3F4F6') : 'transparent',
                color: tab === 'quizzes' ? textTitle : textBody,
                transition: 'all 0.2s'
              }}
            >
              <Question size={16} weight={tab === 'quizzes' ? 'fill' : 'regular'} />
              Quizzes
            </button>
          </div>

          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', height: '40px',
            backgroundColor: bgCard, border: `1px solid ${borderCard}`, borderRadius: '12px',
            minWidth: '240px'
          }}>
            <MagnifyingGlass size={16} color={textBody} weight="bold" />
            <input
              type="text"
              placeholder={`Search ${tab}…`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none', background: 'transparent', color: textTitle, fontSize: '14px', width: '100%', outline: 'none', fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* ─── Content ─── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: '160px', borderRadius: '24px', backgroundColor: borderCard, animation: 'pulse 2s infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 20px', textAlign: 'center', color: textBody }}>
            <div style={{ marginBottom: '16px', color: borderCardHover }}>
              {tab === 'flashcards' ? <Cards size={48} weight="thin" /> : <Question size={48} weight="thin" />}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: textTitle, marginBottom: '8px', fontFamily: 'Quicksand, sans-serif' }}>
              {search ? 'No results found' : tab === 'flashcards' ? 'No flashcard decks yet' : 'No quizzes yet'}
            </h3>
            <p style={{ fontSize: '14px', maxWidth: '300px', marginBottom: '24px' }}>
              {search
                ? 'Try a different search term.'
                : 'Open any study material in the Workstation to generate your custom study set.'}
            </p>
            {!search && (
              <button 
                onClick={() => navigate('/workstation')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: textTitle, color: bgCard,
                  border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Go to Workstation <ArrowRight size={16} weight="bold" />
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filtered.map((item, i) => {
                const isFlashcard = tab === 'flashcards'
                const count = isFlashcard ? item.card_count : item.question_count
                const countLabel = isFlashcard ? 'cards' : 'questions'

                return (
                  <motion.div
                    key={item.id}
                    style={{
                      backgroundColor: bgCard,
                      border: `1px solid ${borderCard}`,
                      borderRadius: '24px',
                      padding: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.backgroundColor = bgCardHover; 
                      e.currentTarget.style.borderColor = borderCardHover;
                      e.currentTarget.style.outline = '2px solid #FFD2A6';
                      e.currentTarget.style.outlineOffset = '2px';
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.backgroundColor = bgCard; 
                      e.currentTarget.style.borderColor = borderCard;
                      e.currentTarget.style.outline = 'none';
                      e.currentTarget.style.outlineOffset = '0px';
                    }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    onClick={() => handleOpen(item)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '40px', height: '40px', borderRadius: '12px',
                        backgroundColor: bgPill, color: textTitle
                      }}>
                        {isFlashcard ? <Cards size={20} weight="fill" /> : <Question size={20} weight="fill" />}
                      </div>
                      <div style={{
                        padding: '4px 10px', borderRadius: '8px', backgroundColor: bgPill,
                        fontSize: '12px', fontWeight: '700', color: textBody, letterSpacing: '0.05em', textTransform: 'uppercase'
                      }}>
                        {count} {countLabel}
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: textTitle, marginBottom: '6px', fontFamily: 'Quicksand, sans-serif', lineHeight: '1.3' }}>
                        {item.title}
                      </h3>
                      {item.source_title && (
                        <div style={{ fontSize: '13px', fontWeight: '500', color: textBody, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <BookOpen size={14} weight="regular" />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.source_title}</span>
                        </div>
                      )}
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
