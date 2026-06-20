import { useState, useEffect } from 'react'
import { Bell, Coins, Moon, Sun, Star, Lightning, House, SidebarSimple, Compass, CheckCircle, Circle, CaretRight, CaretDown, Fire, CaretLeft, Target, X, FilePdf, YoutubeLogo, FileText, BookOpen, ClockCounterClockwise, FolderOpen, Clock } from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { useOutletContext, Link, useNavigate } from 'react-router-dom'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { getCreditBalance } from '../../services/creditService'
import './dhd.css'

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

function ExploreLuter({ bundle }) {
  const profile = bundle?.profile?.data || bundle?.profile || {}
  const stats = bundle?.stats?.data || {}
  const materials = bundle?.materials?.data || []
  
  // Seed from DB (bundle stats) — this is the source of truth after a refresh
  const dbClaimed = stats?.claimed_tasks || []
  const [claimedTasks, setClaimedTasks] = useState(() => {
    // Merge DB claims with any local ones for optimistic UI
    try {
      const local = JSON.parse(localStorage.getItem('luter_claimed_tasks') || '[]')
      const merged = Array.from(new Set([...dbClaimed, ...local]))
      return merged
    } catch { return dbClaimed }
  })
  // Keep in sync when bundle updates (e.g. after a refetch)
  useEffect(() => {
    if (dbClaimed.length > 0) {
      setClaimedTasks(prev => Array.from(new Set([...dbClaimed, ...prev])))
    }
  }, [stats?.claimed_tasks])

  const [bonusXp, setBonusXp] = useState(0)
  
  const hasDeck = materials.some(m => m.type?.toLowerCase().includes('deck') || m.type?.toLowerCase().includes('flashcard'))
  const hasPdf = materials.some(m => m.type?.toLowerCase().includes('pdf') || m.type?.toLowerCase().includes('doc'))
  const hasNote = materials.some(m => m.type?.toLowerCase().includes('note'))

  const { setSidebarCollapsed, sidebarCollapsed } = useOutletContext() || {}
  const navigate = useNavigate()

  const tasks = [
    { id: 1, label: 'Complete your profile', done: !!profile.username, xp: 5, path: '/profile' },
    { id: 2, label: 'Set a Daily Study Goal', done: !!stats.daily_goal_minutes, xp: 10, path: null, isGoal: true },
    { id: 3, label: 'Create your first Deck', done: hasDeck, xp: 10, path: '/decks?new=1' },
    { id: 4, label: 'Upload a PDF to Backpack', done: hasPdf, xp: 15, path: '/upload' },
    { id: 5, label: 'Write your first Note', done: hasNote, xp: 12, path: '/notes?new=1' },
    { id: 6, label: 'Earn your first XP', done: (stats.total_xp || 0) > 0, xp: 3, path: '/playground' },
    { id: 7, label: 'Reach a 3-day streak', done: (stats.streak_days || 0) >= 3, xp: 20, path: '/home' },
    { id: 8, label: 'Reach Level 2', done: (stats.total_xp || 0) >= 500, xp: 25, path: '/playground' },
  ]
  const completed = tasks.filter(t => t.done).length
  const progress = Math.round((completed / tasks.length) * 100) || 0

  const handleTaskClick = async (task) => {
    if (task.isGoal && !task.done) {
      // Trigger the daily goal modal by removing the skip flag
      localStorage.removeItem('luter_skip_goal')
      window.dispatchEvent(new Event('show-daily-goal'))
      return
    }

    if (task.done) {
      if (!claimedTasks.includes(task.id)) {
        // Optimistic UI Update
        const newClaimed = [...claimedTasks, task.id]
        setClaimedTasks(newClaimed)
        localStorage.setItem('luter_claimed_tasks', JSON.stringify(newClaimed))
        setBonusXp(prev => prev + task.xp)
        
        // Update Supabase permanently using the RPC
        try {
          await supabase.rpc('claim_explore_task', { 
            p_task_id: task.id, 
            p_xp_amount: task.xp 
          })
        } catch (e) {
          console.error("Failed to claim XP via RPC:", e)
        }
      }
    } else if (task.path && navigate) {
      navigate(task.path)
    }
  }

  // Effect to sync bonus XP to parent if needed, or just let it live locally for demo
  useEffect(() => {
    if (bonusXp > 0) {
      // Simulate real XP update visually
      const xpEl = document.getElementById('header-xp-display')
      if (xpEl) xpEl.innerText = `${(stats.total_xp || 0) + bonusXp} XP`
    }
  }, [bonusXp, stats.total_xp])

  return (
    <div className="dhd-explore-card">
      <div className="dhd-explore-header">
        <div className="dhd-explore-title">
          <Compass size={20} weight="regular" />
          <span>Explore Luter</span>
        </div>
        <div className="dhd-explore-progress-circle">
          <span>{progress}%</span>
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="circle" strokeDasharray={`${progress}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
        </div>
      </div>
      
      <div className="dhd-explore-tasks scrollable">
        {tasks.map(task => {
          const isClaimed = claimedTasks.includes(task.id)
          const canClaim = task.done && !isClaimed

          return (
            <div 
              key={task.id} 
              className={`dhd-explore-task ${isClaimed ? 'done' : ''} ${canClaim ? 'claimable' : ''}`}
              onClick={() => handleTaskClick(task)}
            >
              <div className="task-left">
                {isClaimed ? (
                  <CheckCircle size={22} weight="fill" className="task-icon done" />
                ) : (
                  <Circle size={22} weight={canClaim ? "fill" : "regular"} className={`task-icon ${canClaim ? 'text-peach' : ''}`} />
                )}
                <span className="task-label">{task.label}</span>
              </div>
              
              <div className="task-right">
                {task.xp > 0 && !isClaimed && (
                  <div className={`task-reward-xp ${canClaim ? 'claim-btn' : ''}`}>
                    <Lightning size={14} weight="fill" />
                    <span>{canClaim ? `Claim ${task.xp}` : task.xp}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StreakHeatmap() {
  const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']

  const [heatmapData, setHeatmapData] = useState([]) // array of { study_date, minutes_spent, goal_minutes, goal_met }
  const [loading, setLoading] = useState(true)
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  useEffect(() => {
    let mounted = true
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false)
      return () => { mounted = false }
    }

    supabase.rpc('get_user_heatmap_data')
      .then(({ data, error }) => {
        if (!mounted) return
        if (!error && data) setHeatmapData(data)
        setLoading(false)
      })

    return () => { mounted = false }
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthLabel = `${MONTH_NAMES[month]} ${year}`

  // Build a date→status lookup
  const dataMap = {}
  heatmapData.forEach(row => {
    dataMap[row.study_date] = row
  })

  // Get the first day of the month (0=Sun…6=Sat) — convert to Mon-first (0=Mon…6=Sun)
  const firstDayOfMonth = new Date(year, month, 1)
  const rawFirstDow = firstDayOfMonth.getDay() // 0=Sun
  const firstDow = rawFirstDow === 0 ? 6 : rawFirstDow - 1 // Mon-first offset

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7

  // Build grid: null = padding, number = day of month
  const cells = []
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - firstDow + 1
    if (dayNum < 1 || dayNum > daysInMonth) cells.push(null)
    else cells.push(dayNum)
  }

  // Get status for each cell
  const cellStatuses = cells.map(day => {
    if (!day) return 'pad'
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    const row = dataMap[dateStr]
    if (!row) return 'empty'
    if (row.goal_met) return 'streak'
    if (row.minutes_spent > 0) return 'done'
    return 'empty'
  })

  // Compute stats
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const goalDays = heatmapData.filter(r => r.goal_met).length
  const totalMinutes = heatmapData.reduce((sum, r) => sum + (r.minutes_spent || 0), 0)
  const totalHours = Math.floor(totalMinutes / 60)

  // Calculate current streak
  const sortedGoalDates = heatmapData
    .filter(r => r.goal_met)
    .map(r => r.study_date)
    .sort()
    .reverse()

  let currentStreak = 0
  const checkDate = new Date()
  for (const dateStr of sortedGoalDates) {
    const d = new Date(dateStr)
    const diffDays = Math.round((checkDate - d) / (1000 * 60 * 60 * 24))
    if (diffDays <= 1) {
      currentStreak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else break
  }

  const goToPrev = () => setViewDate(new Date(year, month - 1, 1))
  const goToNext = () => {
    const next = new Date(year, month + 1, 1)
    if (next <= new Date()) setViewDate(next)
  }
  const canGoNext = new Date(year, month + 1, 1) <= new Date()

  return (
    <div className="dhd-heatmap-card">
      {/* Header */}
      <div className="dhd-heatmap-top">
        <div className="dhd-heatmap-streak-badge">
          <Fire size={18} weight="fill" className="dhd-streak-fire-icon" />
          <span>{currentStreak}</span>
          <small>day streak</small>
        </div>
        <div className="dhd-heatmap-stats">
          <div className="dhd-heatmap-stat">
            <span className="stat-value">{goalDays}</span>
            <span className="stat-label">goals met</span>
          </div>
          <div className="dhd-heatmap-stat-divider" />
          <div className="dhd-heatmap-stat">
            <span className="stat-value">{totalHours}h</span>
            <span className="stat-label">total time</span>
          </div>
        </div>
      </div>

      <div className="dhd-heatmap-divider" />

      {/* Month Nav */}
      <div className="dhd-heatmap-header">
        <button className="dhd-heatmap-nav" onClick={goToPrev}><CaretLeft size={14} weight="bold" /></button>
        <span className="dhd-heatmap-month">{monthLabel}</span>
        <button className="dhd-heatmap-nav" onClick={goToNext} disabled={!canGoNext} style={{ opacity: canGoNext ? 1 : 0.3 }}>
          <CaretRight size={14} weight="bold" />
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="dhd-heatmap-loading">
          <div className="dhd-heatmap-loading-spinner" />
        </div>
      ) : (
        <div className="dhd-heatmap-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_LABELS.map(day => (
            <div key={day} className="dhd-heatmap-dayname">{day}</div>
          ))}

          {cellStatuses.map((status, idx) => {
            if (status === 'pad') return <div key={idx} className="dhd-heatmap-cell pad" />

            const isStreakStart = status === 'streak' && (idx % 7 === 0 || cellStatuses[idx - 1] !== 'streak')
            const isStreakEnd = status === 'streak' && (idx % 7 === 6 || cellStatuses[idx + 1] !== 'streak')
            const day = cells[idx]
            const isToday = isCurrentMonth && day === today.getDate()

            return (
              <div
                key={idx}
                className={[
                  'dhd-heatmap-cell',
                  status,
                  isStreakStart ? 'streak-start' : '',
                  isStreakEnd ? 'streak-end' : '',
                  isToday ? 'is-today' : '',
                ].join(' ')}
                title={day ? `Day ${day}` : ''}
              >
                {status === 'streak' ? (
                  <div className="dhd-heatmap-fire">
                    <Fire size={14} weight="fill" />
                  </div>
                ) : status === 'done' ? (
                  <div className="dhd-heatmap-done-dot" />
                ) : (
                  <div className={`dhd-heatmap-empty-dot${isToday ? ' today-dot' : ''}`} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="dhd-heatmap-legend">
        <div className="legend-item"><div className="legend-dot empty-dot" /><span>No activity</span></div>
        <div className="legend-item"><div className="legend-dot done-dot" /><span>Studied</span></div>
        <div className="legend-item"><div className="legend-dot streak-dot"><Fire size={8} weight="fill" /></div><span>Goal met! 🔥</span></div>
      </div>
    </div>
  )
}


function DailyGoalModal({ stats, setStats }) {
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    const checkModal = () => {
      const hasGoal = !!stats?.daily_goal_minutes
      const isSkipped = !!localStorage.getItem('luter_skip_goal')
      if (!hasGoal && !isSkipped) setIsOpen(true)
      else setIsOpen(false)
    }
    checkModal()
    
    // Listen for custom event to show modal again
    const handleShow = () => setIsOpen(true)
    window.addEventListener('show-daily-goal', handleShow)
    return () => window.removeEventListener('show-daily-goal', handleShow)
  }, [stats?.daily_goal_minutes])

  if (!isOpen) return null

  const handleSelectGoal = async (minutes) => {
    // Optimistic UI close
    setIsOpen(false)
    if (setStats) setStats(prev => ({ ...prev, daily_goal_minutes: minutes }))
    
    // Call RPC
    try {
      await supabase.rpc('set_daily_goal', { p_minutes: minutes })
    } catch (e) {
      console.error("Failed to set daily goal:", e)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('luter_skip_goal', '1')
    setIsOpen(false)
  }

  return (
    <div className="dhd-modal-overlay">
      <div className="dhd-goal-modal bounce-in">
        <button className="dhd-goal-close" onClick={handleSkip}><X size={20} /></button>
        <div className="dhd-goal-icon-wrapper">
          <Target size={32} weight="fill" className="text-peach" />
        </div>
        <h2 className="dhd-goal-title">Set Your Daily Goal</h2>
        <p className="dhd-goal-desc">How much time do you want to spend reading and studying in the Workstation every day? Committing to a goal builds powerful streaks!</p>
        
        <div className="dhd-goal-options">
          <button onClick={() => handleSelectGoal(15)} className="dhd-goal-option">
            <span>15 min</span>
            <small>Casual</small>
          </button>
          <button onClick={() => handleSelectGoal(30)} className="dhd-goal-option">
            <span>30 min</span>
            <small>Regular</small>
          </button>
          <button onClick={() => handleSelectGoal(60)} className="dhd-goal-option recommended">
            <span>1 hour</span>
            <small>Serious</small>
            <div className="dhd-goal-badge">Recommended</div>
          </button>
          <button onClick={() => handleSelectGoal(120)} className="dhd-goal-option">
            <span>2 hours</span>
            <small>Intense</small>
          </button>
        </div>
        
        <button onClick={handleSkip} className="dhd-goal-skip">Skip for now</button>
      </div>
    </div>
  )
}

const LUTER_COLORS = ['#C4B5FD', '#FFD2A6', '#98FF98']

function CombinedMaterials({ bundle }) {
  const [isOpen, setIsOpen] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  const materials = bundle?.materials?.data || []
  const studySessions = bundle?.studySessions?.data || []
  const materialAnalysis = bundle?.materialAnalysis?.data || []

  // Deduplicate by id
  const seen = new Set()
  const uniqueMaterials = materials.filter(m => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  const sessionMap = new Map()
  studySessions.forEach(s => sessionMap.set(s.material_id, s))

  const analysisMap = new Map()
  materialAnalysis.forEach(a => analysisMap.set(a.material_id, a))

  // Sort: recently studied first, then by created_at
  const sorted = [...uniqueMaterials].sort((a, b) => {
    const sa = sessionMap.get(a.id)?.updated_at || a.created_at
    const sb = sessionMap.get(b.id)?.updated_at || b.created_at
    return new Date(sb) - new Date(sa)
  })

  if (sorted.length === 0) return null

  const currentMaterial = sorted[currentIndex] || sorted[0]
  const total = sorted.length

  const getProgress = (m) => {
    const session = sessionMap.get(m.id)
    const analysis = analysisMap.get(m.id)
    const hasRead = !!(session && session.scroll_position && Object.keys(session.scroll_position).length > 0)
    const hasFlashcards = !!(analysis && analysis.flashcards && analysis.flashcards.length > 0)
    const hasQuiz = !!(analysis && analysis.quiz && analysis.quiz.questions && analysis.quiz.questions.length > 0)
    const hasNotes = !!(analysis && analysis.summary)
    return { hasRead, hasFlashcards, hasQuiz, hasNotes }
  }

  const getIcon = (m) => {
    if (m.type === 'pdf') return FilePdf
    if (m.type === 'youtube') return YoutubeLogo
    if (m.type === 'note') return FileText
    return BookOpen
  }

  // For the current progress card
  const cur = currentMaterial
  const { hasRead, hasFlashcards, hasQuiz, hasNotes } = getProgress(cur)
  const tasks = [
    { label: 'Read Material',       done: hasRead },
    { label: 'Generate Flashcards', done: hasFlashcards },
    { label: 'Take a Quiz',         done: hasQuiz },
    { label: 'Generate Notes',      done: hasNotes },
  ]
  const doneTasks = tasks.filter(t => t.done).length
  const progressPct = Math.round((doneTasks / tasks.length) * 100)
  const CurIcon = getIcon(cur)

  return (
    <div className="dhd-combined-section">
      {/* Section Header */}
      <div className="dhd-combined-header">
        <button className="dhd-combined-toggle" onClick={() => setIsOpen(o => !o)}>
          {isOpen ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
          <BookOpen size={18} weight="regular" />
          <span>Your Materials</span>
        </button>
      </div>

      {isOpen && (
        <div className="dhd-combined-body-single">
          <div className="dhd-prog-task-card" style={{ borderColor: LUTER_COLORS[currentIndex % LUTER_COLORS.length] }}>
            <div className="dhd-ptc-header">
              <div className="dhd-ptc-icon" style={{ background: LUTER_COLORS[currentIndex % LUTER_COLORS.length] }}>
                <CurIcon size={20} weight="regular" color="rgba(30,41,59,0.7)" />
              </div>
              <span className="dhd-ptc-name">{cur.title}</span>
            </div>

            <div className="dhd-ptc-progress-row">
              <span className="dhd-ptc-fraction">{doneTasks} of {tasks.length}</span>
              <div className="dhd-ptc-bar">
                <div className="dhd-ptc-bar-fill" style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${LUTER_COLORS[currentIndex % LUTER_COLORS.length]}, #10B981)` }} />
              </div>
              <span className="dhd-ptc-pct">{progressPct}%</span>
            </div>

            <div className="dhd-comb-task-checklist">
              {tasks.map(task => (
                <div key={task.label} className={`dhd-ptc-item ${task.done ? 'done' : ''}`}>
                  <div className="dhd-ptc-check">
                    {task.done
                      ? <CheckCircle size={16} weight="fill" color="#10B981" />
                      : <Circle size={16} weight="regular" color="#CBD5E1" />}
                  </div>
                  <span>{task.label}</span>
                </div>
              ))}
            </div>

            <div className="dhd-ptc-footer">
              <button
                className="dhd-ptc-nav"
                onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <CaretLeft size={14} weight="bold" /> Prev
              </button>
              <span className="dhd-ptc-dots">
                {sorted.map((_, i) => (
                  <span
                    key={i}
                    className={`dhd-ptc-dot ${i === currentIndex ? 'active' : ''}`}
                    style={i === currentIndex ? { background: LUTER_COLORS[i % LUTER_COLORS.length] } : {}}
                    onClick={() => setCurrentIndex(i)}
                  />
                ))}
              </span>
              <button
                className="dhd-ptc-nav"
                onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
                disabled={currentIndex === total - 1}
              >
                Next <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


function LibraryDashboard({ bundle }) {
  const materials = bundle?.materials?.data || []
  const studySessions = bundle?.studySessions?.data || []

  const sessionMap = new Map()
  studySessions.forEach(s => {
    if (!sessionMap.has(s.material_id)) sessionMap.set(s.material_id, s)
  })

  // Deduplicate by id first
  const seen = new Set()
  const uniqueMaterials = materials.filter(m => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  let recent = uniqueMaterials.filter(m => sessionMap.has(m.id)).map(m => ({
    ...m,
    last_studied: new Date(sessionMap.get(m.id).updated_at)
  })).sort((a, b) => b.last_studied - a.last_studied)

  if (recent.length < 3) {
    const studiedIds = new Set(recent.map(m => m.id))
    const untouched = uniqueMaterials.filter(m => !studiedIds.has(m.id)).map(m => ({
      ...m,
      last_studied: new Date(m.created_at)
    }))
    recent = [...recent, ...untouched]
  }

  recent = recent.slice(0, 6)

  if (recent.length === 0) return null

  return (
    <div className="dhd-library-container">
      <h3 className="dhd-section-title">For your next study session</h3>
      <div className="dhd-lib-scroll-wrapper">
        <div className="dhd-lib-grid">
          {recent.map(item => <LibraryCard key={item.id} item={item} />)}
        </div>
      </div>
    </div>
  )
}



function YourProgress({ bundle }) {
  const materials = bundle?.materials?.data || []
  const studySessions = bundle?.studySessions?.data || []
  const materialAnalysis = bundle?.materialAnalysis?.data || []
  const [currentIndex, setCurrentIndex] = useState(0)

  // Deduplicate materials
  const seen = new Set()
  const uniqueMaterials = materials.filter(m => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  const sessionMap = new Map()
  studySessions.forEach(s => sessionMap.set(s.material_id, s))

  const analysisMap = new Map()
  materialAnalysis.forEach(a => analysisMap.set(a.material_id, a))

  if (uniqueMaterials.length === 0) return null

  const total = uniqueMaterials.length
  const m = uniqueMaterials[currentIndex] || uniqueMaterials[0]
  const session = sessionMap.get(m.id)
  const analysis = analysisMap.get(m.id)

  const hasRead = !!(session && session.scroll_position && Object.keys(session.scroll_position).length > 0)
  const hasFlashcards = !!(analysis && analysis.flashcards && analysis.flashcards.length > 0)
  const hasQuiz = !!(analysis && analysis.quiz && analysis.quiz.questions && analysis.quiz.questions.length > 0)
  const hasNotes = !!(analysis && analysis.summary)

  const tasks = [
    { label: 'Read Material',     done: hasRead },
    { label: 'Generate Flashcards', done: hasFlashcards },
    { label: 'Take a Quiz',        done: hasQuiz },
    { label: 'Generate Notes',    done: hasNotes },
  ]

  const doneTasks = tasks.filter(t => t.done).length
  const progressPercent = Math.round((doneTasks / tasks.length) * 100)

  const isPdf = m.type === 'pdf'
  const isYoutube = m.type === 'youtube'
  const isNote = m.type === 'note'
  const Icon = isPdf ? FilePdf : isYoutube ? YoutubeLogo : isNote ? FileText : BookOpen

  return (
    <div className="dhd-prog-card-wrap">
      <h3 className="dhd-section-title">Your Progress</h3>
      <div className="dhd-prog-task-card">
        {/* Header */}
        <div className="dhd-ptc-header">
          <div className="dhd-ptc-icon">
            <Icon size={18} weight="regular" color="#475569" />
          </div>
          <span className="dhd-ptc-name">{m.title}</span>
        </div>

        {/* Progress bar */}
        <div className="dhd-ptc-progress-row">
          <span className="dhd-ptc-fraction">{doneTasks} of {tasks.length}</span>
          <div className="dhd-ptc-bar">
            <div className="dhd-ptc-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="dhd-ptc-pct">{progressPercent}%</span>
        </div>

        {/* Checklist */}
        <div className="dhd-ptc-checklist">
          {tasks.map(task => (
            <div key={task.label} className={`dhd-ptc-item ${task.done ? 'done' : ''}`}>
              <div className="dhd-ptc-check">
                {task.done && <CheckCircle size={16} weight="fill" color="#10B981" />}
                {!task.done && <Circle size={16} weight="regular" color="#CBD5E1" />}
              </div>
              <span>{task.label}</span>
            </div>
          ))}
        </div>

        {/* Footer nav */}
        <div className="dhd-ptc-footer">
          <button 
            className="dhd-ptc-nav" 
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
          >
            <CaretLeft size={14} weight="bold" />
            Prev
          </button>
          <span className="dhd-ptc-dots">
            {uniqueMaterials.map((_, i) => (
              <span key={i} className={`dhd-ptc-dot ${i === currentIndex ? 'active' : ''}`} onClick={() => setCurrentIndex(i)} />
            ))}
          </span>
          <button 
            className="dhd-ptc-nav" 
            onClick={() => setCurrentIndex(i => Math.min(total - 1, i + 1))}
            disabled={currentIndex === total - 1}
          >
            Next
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  )
}

function RecentFolders({ bundle }) {
  const [isOpen, setIsOpen] = useState(true)
  const courses = bundle?.uc?.data || []

  if (courses.length === 0) return null

  // Sort by last_studied_at or created_at descending
  const sortedCourses = [...courses].sort((a, b) => {
    const da = new Date(a.last_studied_at || a.created_at)
    const db = new Date(b.last_studied_at || b.created_at)
    return db - da
  }).slice(0, 4)

  const timeAgo = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)
    if (diffInSeconds < 60) return 'Just now'
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 30) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="dhd-combined-section dhd-sessions-section">
      <div className="dhd-combined-header">
        <button className="dhd-combined-toggle" onClick={() => setIsOpen(o => !o)}>
          {isOpen ? <CaretDown size={14} weight="bold" /> : <CaretRight size={14} weight="bold" />}
          <FolderOpen size={18} weight="regular" />
          <span>Recent Folders</span>
        </button>
      </div>

      {isOpen && (
        <div className="dhd-sessions-grid">
          {sortedCourses.map((uc, i) => {
            const course = uc.courses || {}
            const title = uc.custom_name || course.name || 'Untitled Folder'
            const courseId = course.id || uc.course_id
            const color = LUTER_COLORS[i % LUTER_COLORS.length]

            return (
              <Link 
                to={`/backpack/${courseId}`} 
                key={uc.id} 
                className="dhd-session-card"
                style={{ '--hover-color': color }}
              >
                <div className="dhd-sc-icon" style={{ background: `${color}33`, color: color === '#98FF98' ? '#22C55E' : color === '#C4B5FD' ? '#7C3AED' : '#F97316' }}>
                  <FolderOpen size={20} weight="fill" />
                </div>
                <div className="dhd-sc-info">
                  <h4 className="dhd-sc-title">{title}</h4>
                  <span className="dhd-sc-time">
                    <Clock size={12} /> {timeAgo(uc.last_studied_at || uc.created_at)}
                  </span>
                </div>
                <div className="dhd-sc-arrow">
                  <CaretRight size={14} weight="bold" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DashboardHome() {
  const { user, setNotificationsOpen, sidebarCollapsed, setSidebarCollapsed } = useOutletContext() || {}
  const { bundle } = useDashboardPrefetch()
  const [isDark, setIsDark] = useDarkMode()
  const [creditsBalance, setCreditsBalance] = useState(Infinity)
  
  useEffect(() => {
    if (!user?.id) return
    getCreditBalance(user.id).then(b => {
      if (typeof b === 'number') setCreditsBalance(b)
    }).catch(() => {})
  }, [user?.id])
  
  const profile = bundle?.profile?.data || bundle?.profile
  const username = profile?.username
  const displayName = username || profile?.full_name?.split(' ')[0] || 'Scholar'
  const credits = typeof creditsBalance === 'number' ? creditsBalance : profile?.credits ?? 20000
  
  const stats = bundle?.stats?.data || {}
  const xp = stats?.total_xp ?? 0
  const level = Math.floor(xp / 500) + 1

  return (
    <div className="dhd-root">
      <header className="dhd-header">
        <div className="dhd-header-left">
          {sidebarCollapsed && (
            <button 
              className="dhd-sidebar-toggle"
              onClick={() => setSidebarCollapsed(false)}
              title="Toggle Sidebar"
            >
              <SidebarSimple size={14} weight="regular" />
            </button>
          )}
          <div className="dhd-page-title">
            <House size={16} weight="regular" />
            <span>Home</span>
          </div>
        </div>

        <div className="dhd-header-right">
          <Link to="/profile" className="dhd-badge dhd-badge-level" title="Your Level">
            <Star size={16} weight="fill" />
            <span>Lvl {level}</span>
          </Link>

          <Link to="/profile" className="dhd-badge dhd-badge-xp" title="Your XP">
            <Lightning size={16} weight="fill" />
            <span id="header-xp-display">{xp} XP</span>
          </Link>

          <Link to="/store" className="dhd-badge dhd-badge-coin" title="Your Coins">
            <Coins size={16} weight="fill" />
            <span>{credits >= 1000 ? `${Math.floor(credits / 1000)}k` : credits}</span>
          </Link>

          <button 
            className="dhd-icon-btn" 
            onClick={() => setNotificationsOpen?.(true)}
            title="Notifications"
          >
            <Bell size={20} weight="regular" />
            <span className="dhd-notif-dot" />
          </button>

          <button 
            className="dhd-icon-btn" 
            onClick={() => setIsDark(!isDark)}
            title="Toggle Dark Mode"
          >
            {isDark ? <Sun size={20} weight="regular" /> : <Moon size={20} weight="regular" />}
          </button>
        </div>
      </header>

      <section className="dhd-welcome">
        <h2 className="dhd-welcome-title">
          <img src="/homecutie.png" alt="Mascot" className="dhd-welcome-avatar" />
          <span>Welcome @{username || 'scholar'}! 👋</span>
        </h2>
      </section>

      <section className="dhd-main-dashboard">
        <div className="dhd-col-left">
          <ExploreLuter bundle={bundle} />
        </div>
        <div className="dhd-col-right">
          <StreakHeatmap />
        </div>
      </section>

      <section className="dhd-secondary-dashboard">
        <div className="dhd-col-left">
          <CombinedMaterials bundle={bundle} />
        </div>
        <div className="dhd-col-right">
          <RecentFolders bundle={bundle} />
        </div>
      </section>

      <DailyGoalModal stats={stats} />
    </div>
  )
}
