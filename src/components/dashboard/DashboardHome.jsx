import { useState, useEffect } from 'react'
import { Bell, Coins, Moon, Sun, Star, Lightning, House, SidebarSimple, Compass, CheckCircle, Circle, CaretRight, CaretDown, Fire, CaretLeft, Target, X, FilePdf, YoutubeLogo, FileText, BookOpen, ClockCounterClockwise, FolderOpen, Clock } from '@phosphor-icons/react'
import { supabase } from '../../supabaseClient'
import { useOutletContext, Link, useNavigate } from 'react-router-dom'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { getCreditBalance } from '../../services/creditService'
import { useStreakSync } from '../../hooks/useStreakSync'
import { MdHome, MdViewSidebar } from 'react-icons/md'
import ExploreTasksWidget from './ExploreTasksWidget'
import CalendarHeatmap from './CalendarHeatmap'
import StackedStartCard from './StackedStartCard'
import DashboardWidgetsLayout from './DashboardWidgetsLayout'
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

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="24" height="24" rx="12" fill="#C4B5FD"></rect>
    <rect x="2" y="2" width="24" height="24" rx="12" stroke="url(#ck-grad)" strokeWidth="4"></rect>
    <path d="M21.0718 10.1095L19.6576 8.69531L11.8794 16.4735L8.3439 12.938L6.92969 14.3522L11.8794 19.302L21.0718 10.1095Z" fill="#312E81"></path>
    <defs>
      <linearGradient id="ck-grad" x1="1.91667" y1="4" x2="19.4167" y2="21.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#C4B5FD" stopOpacity="0"></stop>
        <stop offset="1" stopColor="#C4B5FD" stopOpacity="0.2"></stop>
      </linearGradient>
    </defs>
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: '#B3B3B3' }}>
    <path fillRule="evenodd" clipRule="evenodd" d="M10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0ZM5.66872 4.4317L9.99979 8.76277L14.3308 4.43178L15.5682 5.66922L11.2372 10.0002L15.5682 14.3312L14.3308 15.5686L9.99979 11.2376L5.66871 15.5687L4.43127 14.3313L8.76235 10.0002L4.43129 5.66914L5.66872 4.4317Z" fill="currentColor"></path>
  </svg>
);

function ExploreLuter({ bundle, isPremiumOpen, setIsPremiumOpen }) {
  const { user } = useOutletContext() || {}
  const { triggerStreakUpdate } = useStreakSync(user?.id)
  const profile = bundle?.profile?.data || bundle?.profile || {}
  const stats = bundle?.stats?.data || {}
  const materials = bundle?.materials?.data || []
  
  const dbClaimed = stats?.claimed_tasks || []
  const [claimedTasks, setClaimedTasks] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem('luter_claimed_tasks') || '[]')
      return Array.from(new Set([...dbClaimed, ...local]))
    } catch { return dbClaimed }
  })
  useEffect(() => {
    if (dbClaimed.length > 0) {
      setClaimedTasks(prev => Array.from(new Set([...dbClaimed, ...prev])))
    }
  }, [stats?.claimed_tasks])

  const [dynamicTasks, setDynamicTasks] = useState([])
  const [dbUserProgress, setDbUserProgress] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(true)

  useEffect(() => {
    async function loadDynamicTasks() {
      const { data: tasksData, error: tasksError } = await supabase
        .from('explore_tasks')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (!tasksError && tasksData) {
        setDynamicTasks(tasksData)
      }

      if (profile?.id) {
        const { data: progressData } = await supabase
          .from('user_task_progress')
          .select('*')
          .eq('user_id', profile.id)
        if (progressData) {
          setDbUserProgress(progressData.map(p => p.task_id))
        }
      }
      setLoadingTasks(false)
    }
    loadDynamicTasks()
  }, [profile?.id])

  const [bonusXp, setBonusXp] = useState(0)
  
  const hasDeck = materials.some(m => m.type?.toLowerCase().includes('deck') || m.type?.toLowerCase().includes('flashcard'))
  const hasPdf = materials.some(m => m.type?.toLowerCase().includes('pdf') || m.type?.toLowerCase().includes('doc'))
  const hasNote = materials.some(m => m.type?.toLowerCase().includes('note'))

  const { setSidebarCollapsed, sidebarCollapsed } = useOutletContext() || {}
  const navigate = useNavigate()
  const baseTasks = [
    { id: 1, label: 'Complete your profile', done: !!profile.username, xp: 5, path: '/profile' },
    { id: 2, label: 'Set a Daily Study Goal', done: !!stats.daily_goal_minutes, xp: 10, path: null, isGoal: true },
    { id: 3, label: 'Create your first Deck', done: hasDeck, xp: 10, path: '/decks?new=1' },
    { id: 4, label: 'Upload a PDF to Backpack', done: hasPdf, xp: 15, path: '/upload' },
    { id: 5, label: 'Write your first Note', done: hasNote, xp: 12, path: '/notes?new=1' },
    { id: 6, label: 'Earn your first XP', done: (stats.total_xp || 0) > 0, xp: 3, path: '/playground' },
    { id: 7, label: 'Reach a 3-day streak', done: (stats.streak_days || 0) >= 3, xp: 20, path: '/home' },
    { id: 8, label: 'Reach Level 2', done: (stats.total_xp || 0) >= 500, xp: 25, path: '/playground' },
  ]

  let tasks = []
  
  if (dynamicTasks.length > 0) {
    tasks = dynamicTasks.map(t => ({
      id: t.id,
      label: t.title,
      xp: t.xp_reward,
      coins: t.coins_reward,
      path: t.action_url,
      done: dbUserProgress.includes(t.id) || claimedTasks.includes(t.id),
      isDynamic: true
    }))
  } else {
    tasks = baseTasks
  }

  const uncompleted = tasks.filter(t => !t.done)
  const completedList = tasks.filter(t => t.done)
  const visibleTasks = [...completedList, ...uncompleted].slice(0, Math.max(5, completedList.length + 2))
  const completed = tasks.filter(t => t.done).length
  const progress = Math.round((completed / tasks.length) * 100) || 0

  const handleTaskClick = async (task) => {
    if (task.isGoal && !task.done) {
      localStorage.removeItem('luter_skip_goal')
      window.dispatchEvent(new Event('show-daily-goal'))
      return
    }
    if (task.done) {
      if (!claimedTasks.includes(task.id)) {
        const newClaimed = [...claimedTasks, task.id]
        setClaimedTasks(newClaimed)
        localStorage.setItem('luter_claimed_tasks', JSON.stringify(newClaimed))
        setBonusXp(prev => prev + task.xp)
        
        try {
          if (task.isDynamic) {
            await supabase.from('user_task_progress').insert([{
              user_id: profile.id,
              task_id: task.id,
              status: 'claimed'
            }])
          } else {
            await supabase.rpc('claim_explore_task', { 
              p_task_id: task.id, 
              p_xp_amount: task.xp 
            })
          }
          triggerStreakUpdate()
        } catch (e) {
          console.error("Failed to claim task:", e)
        }
      }
    } else if (task.path && navigate) {
      navigate(task.path)
    }
  }

  useEffect(() => {
    if (bonusXp > 0) {
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
        {loadingTasks ? (
          <div className="p-4 text-center text-gray-500 text-sm">Loading tasks...</div>
        ) : (
          visibleTasks.map(task => {
            const isClaimed = claimedTasks.includes(task.id) || (task.isDynamic && dbUserProgress.includes(task.id))
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
                  <span className="task-label" dangerouslySetInnerHTML={{ __html: task.label }}></span>
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
          })
        )}
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
  const [isXpOpen, setIsXpOpen] = useState(false)
  const [isCoinsOpen, setIsCoinsOpen] = useState(false)
  const [isPremiumOpen, setIsPremiumOpen] = useState(false)
  
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
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#F9FAFB' : '#000' }}
            >
              <SidebarSimple size={24} weight="regular" />
            </button>
          )}
          <div className="dhd-page-title">
            <House size={24} weight="regular" />
            <span style={{ fontSize: '18px' }}>Home</span>
          </div>
        </div>

        <div className="dhd-header-right">
          {/* Get Premium UI for Free Users */}
          {(!profile?.subscription_tier || profile?.subscription_tier === 'free') && credits < 2000 && (
            <button className="premium-btn" onClick={() => setIsPremiumOpen(true)} style={{
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
                      <span style={{ fontSize: '14px', color: isDark ? '#D1D5DB' : '#334155', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={16} color="#10B981" /> Complete Quizzes & Flashcards</span>
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

      {/* Welcome message restored */}
      <section className="dhd-welcome" style={{ padding: '32px 24px 16px' }}>
        <h2 className="dhd-welcome-title" style={{ fontSize: '28px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/homecutie.png" alt="Mascot" className="dhd-welcome-avatar" style={{ width: '36px', height: '36px' }} />
          <span>Welcome @{username || 'scholar'}! 👋</span>
        </h2>
      </section>

      <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '0 24px' }}>
        
        <DashboardWidgetsLayout isDark={isDark} />
      </div>

      <DailyGoalModal stats={stats} />
      {/* Premium Overlay */}
      {isPremiumOpen && (
        <div
          onClick={() => setIsPremiumOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(0deg, #FFF 49.19%, rgba(255,255,255,0) 100%), linear-gradient(0deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.75) 100%), linear-gradient(66deg, #7491FF 14.55%, #FF90E0 42.56%, #F7C325 73.53%)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '590px',
              height: '100dvh',
              display: 'flex',
              flexDirection: 'column',
              padding: '64px 20px 0',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsPremiumOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '9999px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                zIndex: 10,
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>

            {/* Scrollable Content */}
            <div style={{ overflowY: 'auto', flexGrow: 1, paddingBottom: '120px' }}>
              {/* Heading */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{
                  fontSize: '36px',
                  fontWeight: 400,
                  lineHeight: '110%',
                  letterSpacing: '-0.36px',
                  color: '#000',
                  margin: 0,
                }}>
                  Level up your learning with{' '}
                  <span style={{
                    background: 'linear-gradient(30deg, #7491FF 21.95%, #FF90E0 67.27%, #F7C325 94%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>Premium</span>
                </h1>
              </div>

              {/* Benefits Table */}
              <div style={{ display: 'flex', width: '100%', minWidth: '100%', gap: 0, marginTop: '12px' }}>
                {/* Benefits Column */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: 1.4, padding: '20px 0 24px', textAlign: 'left', color: '#000' }}>Benefits</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>Daily lesson</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>Unlimited learning</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>Tutoring by Lumii</span>
                    <img src="/mascot.png" alt="Lumii" width="24" height="24" style={{ marginLeft: '6px', flexShrink: 0, objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>No ads</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '60px', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '15px', lineHeight: 1.5, color: '#000' }}>Jump ahead and personalized practice</span>
                  </div>
                </div>

                {/* Free Column */}
                <div style={{
                  width: '108px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(90, 46, 163, 0.06)',
                  borderRadius: '16px 0 0 16px',
                  position: 'relative'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', lineHeight: 1.4, color: '#666', padding: '20px 0 24px' }}>Free</div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CheckIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CrossIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CrossIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CrossIcon />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                    <CrossIcon />
                  </div>
                </div>

                {/* Premium Column */}
                <div style={{
                  width: '128px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  background: 'linear-gradient(86deg, #7491FF -7.44%, #FF90E0 44.8%, #F7C325 102.54%)',
                  borderRadius: '16px',
                  padding: '4px',
                  zIndex: 2,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontWeight: 700,
                    fontSize: '16px',
                    lineHeight: 1.4,
                    padding: '24px 0 24px',
                    textAlign: 'center',
                    background: 'linear-gradient(30deg, #7491FF 21.95%, #FF90E0 67.27%, #F7C325 94%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'brightness(0) invert(1)',
                  }}>Premium</div>
                  
                  <div style={{ background: '#fff', borderRadius: '12px', width: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                      <CheckIcon />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60px', width: '100%', borderTop: '2px solid rgba(0,0,0,0.06)' }}>
                      <CheckIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer CTA */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#fff',
              padding: '20px 20px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 5,
            }}>
              {/* button3d — outer shell has no bg, inner face is the visible surface */}
              <Link
                to="/premium"
                className="btn3d"
                style={{
                  width: '100%',
                  maxWidth: '358px',
                  display: 'inline-flex',
                  position: 'relative',
                  borderRadius: '9999px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  outline: 'none',
                  padding: 0,
                  WebkitTapHighlightColor: 'transparent',
                  textDecoration: 'none'
                }}
                onMouseDown={e => {
                  const face = e.currentTarget.querySelector('[data-face]');
                  face.style.transform = 'none';
                  face.style.boxShadow = 'none';
                }}
                onMouseUp={e => {
                  const face = e.currentTarget.querySelector('[data-face]');
                  face.style.transform = 'translateY(-4px)';
                  face.style.boxShadow = '0 4px 0 0 #A78BFA';
                }}
                onMouseLeave={e => {
                  const face = e.currentTarget.querySelector('[data-face]');
                  face.style.transform = 'translateY(-4px)';
                  face.style.boxShadow = '0 4px 0 0 #A78BFA';
                }}
              >
                <span
                  data-face
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    padding: '14px 24px',
                    borderRadius: '9999px',
                    background: '#C4B5FD',
                    color: '#170B29',
                    fontWeight: 700,
                    fontSize: '16px',
                    fontFamily: 'Outfit, sans-serif',
                    position: 'relative',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 0 0 #A78BFA',
                    transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
                  }}
                >
                  Subscribe now
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}



    </div>
  )
}