import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UploadSimple, FolderOpen, Sparkle, Plus, Fire, Trophy, Play,
  BookOpen, GameController, ArrowRight, Flame, Star, Target
} from '@phosphor-icons/react'
import { DotmCircular7 } from '../ui/dotm-circular-7'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { useSessionStore } from '../../store/useSessionStore'
import Header from '../shared/Header'
import './dhd.css'

export default function DashboardHome() {
  const navigate = useNavigate()
  const { user } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  const { createSession, setActiveSession, sessions } = useSessionStore()
  const [showNewUserPrompt, setShowNewUserPrompt] = useState(false)
  const [isStreakAnimating, setIsStreakAnimating] = useState(false)
  
  const profile = bundle?.profile?.data || bundle?.profile 
  const isSoloLearner = profile?.is_university_user === false || profile?.role === 'solo_learner'
  const username = profile?.username;
  const displayName = username || profile?.full_name?.split(' ')[0] || 'Scholar';
  const displayHandle = username ? `${username}` : displayName;
  
  const [courses, setCourses] = useState([])   
  const [soloMaterials, setSoloMaterials] = useState([])
  const [stats, setStats] = useState(null)  
  const [loading, setLoading] = useState(true)
  const [pendingMaterials, setPendingMaterials] = useState([])

  const mapCourses = useCallback((uc) => {
    if (!Array.isArray(uc)) return []
    return uc
      .filter(row => {
        const hasJoined = row && (row.courses || row.course)
        if (!hasJoined && row) {
          console.warn('User course row missing joined course data:', row)
        }
        return hasJoined
      })
      .map((row) => {
        // Handle both aliased 'course' and direct 'courses' joins
        // Also handle cases where PostgREST returns an array for joins
        let c = row.courses || row.course
        if (Array.isArray(c)) c = c[0]
        
        const hash = c?.code?.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0) || 0
        const color = `hsl(${Math.abs(hash) % 360}, 75%, 65%)`
        return {
          id: row.id,
          code: c?.code || 'COURSE',
          name: c?.name || 'Enrolled Course',
          progress: row.progress ?? 0,
          faculty: c?.faculty || 'General',
          color
        }
      })
  }, [])

  const loadRemote = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    const offline = typeof navigator !== 'undefined' && !navigator.onLine
    const cachedKey = `luter:dash-home:${user.id}`

    // Serve from cache immediately if offline
    if (offline) {
      try {
        const raw = localStorage.getItem(cachedKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.courses) setCourses(parsed.courses)
          if (parsed.pendingMaterials) setPendingMaterials(parsed.pendingMaterials)
          if (parsed.soloMaterials) setSoloMaterials(parsed.soloMaterials)
          if (parsed.stats) setStats(parsed.stats)
          setLoading(false)
          return
        }
      } catch {}
    }

    try {
      const { data: uc } = await supabase
        .from('user_courses')
        .select('id, progress, courses(id, code, name, faculty)')
        .eq('user_id', user.id)

      if (uc) {
        setCourses(mapCourses(uc))
      }

      // Fetch pending materials
      const { data: pm } = await supabase
        .from('materials')
        .select('id, title, type, processing_status, created_at, course_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
      
      if (pm) {
        setPendingMaterials(pm.filter((item) => item.processing_status === 'pending'))
        setSoloMaterials(pm.filter((item) => !item.course_id))
      }

      const { data: st } = await supabase
        .from('user_stats')
        .select('total_xp, streak_days')
        .eq('user_id', user.id)
        .maybeSingle()
      if (st) setStats(st)

      // Cache successful fetch
      try {
        localStorage.setItem(cachedKey, JSON.stringify({
          courses: mapCourses(uc || []),
          pendingMaterials: (pm || []).filter((item) => item.processing_status === 'pending'),
          soloMaterials: (pm || []).filter((item) => !item.course_id),
          stats: st || null
        }))
      } catch {}
    } catch (e) {
      console.error('Loader error:', e)
      // On error, try cache fallback
      try {
        const raw = localStorage.getItem(cachedKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (parsed.courses) setCourses(parsed.courses)
          if (parsed.pendingMaterials) setPendingMaterials(parsed.pendingMaterials)
          if (parsed.soloMaterials) setSoloMaterials(parsed.soloMaterials)
          if (parsed.stats) setStats(parsed.stats)
        }
      } catch {}
    } finally {
      setLoading(false)
    }
  }, [user?.id, mapCourses])

  useEffect(() => {
    if (!ready) return

    // 1. Check prefetch bundle first
    if ((bundle?.uc?.data && bundle.uc.data.length > 0) || bundle?.materials?.data || bundle?.stats?.data) {
      if (bundle?.uc?.data) {
        setCourses(mapCourses(bundle.uc.data))
      }
      if (bundle?.materials?.data) {
        setPendingMaterials(bundle.materials.data.filter((item) => item.processing_status === 'pending'))
        setSoloMaterials(bundle.materials.data.filter((item) => !item.course_id))
      }
      if (bundle.stats?.data) setStats(bundle.stats.data)
      setLoading(false)
    } 
    // 2. Fallback to direct fetch if bundle is empty or processing
    else if (user?.id) {
      loadRemote()
    } else {
      setLoading(false)
    }
  }, [ready, bundle, user, loadRemote, mapCourses])

  // Check if user should see new user prompt
  useEffect(() => {
    const shouldShowPrompt = courses.length === 0 && soloMaterials.length === 0
    setShowNewUserPrompt(shouldShowPrompt)
  }, [courses.length, soloMaterials.length])

  const handleCreateFirstSession = async () => {
    const { success, session } = await createSession('My First Study Session', [])
    if (success && session) {
      setActiveSession(session)
      navigate(`/dashboard/session/${session.id}`)
    }
  }

  const handleStreakClick = () => {
    setIsStreakAnimating(true)
    setTimeout(() => setIsStreakAnimating(false), 1000)
  }

  const handleJumpBackIn = () => {
    if (sessions.length > 0) {
      navigate(`/dashboard/session/${sessions[0].id}`)
    } else {
      navigate('/dashboard/sessions')
    }
  }

  const xp    = stats?.total_xp   ?? 0
  const streak= stats?.streak_days ?? 0
  const level = Math.floor(xp / 500) + 1
  const latestSoloMaterial = soloMaterials[0]

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight: '80vh' }}>
      <DotmCircular7 size={80} dotSize={6} color="#000000" />
    </div>
  )

  return (
    <div className="dhd-root">
      {/* ===== LARGE ENGAGING GREETING ===== */}
      <section className="dhd-hero-large">
        <motion.div 
          className="dhd-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Profile Avatar */}
          {profile?.avatar_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, duration: 0.4 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: 16,
                border: '3px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </motion.div>
          )}
          
          <motion.h1 
            id="tour-welcome"
            className="dhd-hero-title"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Hi, {displayName}! 👋
          </motion.h1>
          <motion.p 
            className="dhd-hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            Ready to continue learning?
          </motion.p>
        </motion.div>
        
        <motion.div 
          className="dhd-hero-mascot-large"
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.6, duration: 0.8, type: "spring" }}
        >
          <img src="/mascot.png" alt="Luter mascot" />
        </motion.div>
      </section>

      {/* Pending banner */}
      {pendingMaterials.length > 0 && (
        <motion.div className="dhd-pending-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Sparkle size={18} weight="fill" />
          <span>Luter is preparing {pendingMaterials.length} {pendingMaterials.length === 1 ? 'material' : 'materials'}</span>
        </motion.div>
      )}

      {/* New User Session Creation Prompt */}
      {showNewUserPrompt && (
        <motion.div 
          className="dhd-new-user-prompt"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="dhd-prompt-content">
            <div className="dhd-prompt-icon">
              <FolderOpen weight="fill" size={32} />
            </div>
            <div className="dhd-prompt-text">
              <h3>Welcome to Luter!</h3>
              <p>Start by uploading your first materials to begin your learning journey</p>
            </div>
            <div className="dhd-prompt-actions">
              <motion.button 
                className="dhd-prompt-btn dhd-prompt-btn--primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateFirstSession}
              >
                <UploadSimple weight="bold" size={18} />
                Upload Materials
              </motion.button>
            </div>
            <button 
              className="dhd-prompt-dismiss"
              onClick={() => setShowNewUserPrompt(false)}
            >
              <Sparkle weight="fill" size={14} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ===== NICE STREAK TAB ===== */}
      <section className="dhd-streak-section">
        <motion.div
          id="tour-streak"
          className={`dhd-streak-card ${isStreakAnimating ? 'animate' : ''}`}
          onClick={handleStreakClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="dhd-streak-left">
            <motion.div
              className="dhd-streak-icon"
              animate={isStreakAnimating ? {
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              } : {}}
              transition={{ duration: 0.8 }}
            >
              <Flame size={32} weight="fill" />
            </motion.div>
            <div className="dhd-streak-text">
              <motion.div 
                className="dhd-streak-number"
                animate={isStreakAnimating ? {
                  scale: [1, 1.3, 1],
                  color: ['#ff9b38', '#ff6b35', '#ff9b38']
                } : {}}
                transition={{ duration: 0.6 }}
              >
                {streak}
              </motion.div>
              <div className="dhd-streak-label">Day Streak 🔥</div>
            </div>
          </div>
          <div className="dhd-streak-right">
            <motion.div
              className="dhd-streak-progress"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((streak % 7) * 14.28, 100)}%` }}
              transition={{ delay: 0.8, duration: 1 }}
            />
            <span className="dhd-streak-goal">Keep it going!</span>
          </div>
        </motion.div>
      </section>

      {/* ===== JUMP BACK IN / NEW USER PROMPT ===== */}
      <section className="dhd-jump-section">
        <AnimatePresence mode="wait">
          {showNewUserPrompt ? (
            <motion.div
              key="new-user"
              className="dhd-new-user-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <div className="dhd-new-user-content">
                <motion.div
                  className="dhd-new-user-icon"
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Star size={40} weight="fill" />
                </motion.div>
                <div className="dhd-new-user-text">
                  <h3>Start Your Learning Journey! 🚀</h3>
                  <p>Create your first study session to begin studying with AI-powered tools</p>
                </div>
                <motion.button
                  className="dhd-new-user-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateFirstSession}
                >
                  <Play weight="bold" size={20} />
                  Create Study Session
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="jump-back"
              className="dhd-jump-card"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="dhd-jump-content">
                <motion.div
                  className="dhd-jump-icon"
                  animate={{ 
                    y: [0, -5, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Target size={32} weight="fill" />
                </motion.div>
                <div className="dhd-jump-text">
                  <h3>Jump Back In! 🎯</h3>
                  <p>Continue where you left off in your recent study session</p>
                </div>
                <motion.button
                  className="dhd-jump-btn"
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleJumpBackIn}
                >
                  Continue Learning
                  <ArrowRight weight="bold" size={18} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ===== SCROLLING COURSES TAB ===== */}
      {!isSoloLearner && courses.length > 0 && (
        <section className="dhd-courses-section">
          <div className="dhd-section-header">
            <h2 className="dhd-section-title">My Courses 📚</h2>
            <button 
              className="dhd-see-all-btn"
              onClick={() => navigate('/dashboard/courses')}
            >
              See All <ArrowRight size={14} weight="bold" />
            </button>
          </div>
          <div className="dhd-courses-scroll">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                className="dhd-course-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -5, scale: 1.02 }}
                onClick={() => navigate(`/dashboard/courses/${course.id}`)}
              >
                <div className="dhd-course-color" style={{ background: course.color }} />
                <div className="dhd-course-content">
                  <span className="dhd-course-code">{course.code}</span>
                  <span className="dhd-course-name">{course.name}</span>
                  <span className="dhd-course-count">{course.materials_count} materials</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ===== MINIMAL MATERIALS TAB ===== */}
      <section className="dhd-materials-section">
        <div className="dhd-section-header">
          <h2 className="dhd-section-title">Materials 📁</h2>
          <button 
            className="dhd-see-all-btn"
            onClick={() => navigate('/dashboard/courses')}
          >
            Manage <ArrowRight size={14} weight="bold" />
          </button>
        </div>
        <motion.div
          className="dhd-materials-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/dashboard/upload')}
        >
          <div className="dhd-materials-left">
            <motion.div
              className="dhd-materials-icon"
              animate={{ 
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <UploadSimple size={28} weight="bold" />
            </motion.div>
            <div className="dhd-materials-text">
              <h3>Upload New Materials</h3>
              <p>Add PDFs, documents, images, and more</p>
            </div>
          </div>
          <div className="dhd-materials-right">
            <div className="dhd-materials-count">
              {soloMaterials.length} files
            </div>
            <Plus size={20} weight="bold" />
          </div>
        </motion.div>
      </section>

      {/* ===== HAVE FUN SECTION ===== */}
      <section className="dhd-fun-section">
        <motion.div
          className="dhd-fun-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          whileHover={{ scale: 1.02, rotate: 1 }}
          onClick={() => navigate('/dashboard/playground')}
        >
          <div className="dhd-fun-content">
            <motion.div
              className="dhd-fun-icon"
              animate={{ 
                rotate: [0, 360],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <GameController size={32} weight="fill" />
            </motion.div>
            <div className="dhd-fun-text">
              <h3>Have Fun! 🎮</h3>
              <p>Take a break and explore the playground</p>
            </div>
            <motion.div
              className="dhd-fun-sparkles"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ===== QUICK STATS ===== */}
      {!showNewUserPrompt && (
        <section className="dhd-stats-minimal">
          <div className="dhd-stats-item">
            <Trophy size={20} weight="fill" />
            <span>Level {level}</span>
          </div>
          <div className="dhd-stats-item">
            <Star size={20} weight="fill" />
            <span>{xp.toLocaleString()} XP</span>
          </div>
          <div className="dhd-stats-item">
            <Fire size={20} weight="fill" />
            <span>{streak} day streak</span>
          </div>
        </section>
      )}
    </div>
  )
}
