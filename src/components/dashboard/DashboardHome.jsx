import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Books, BookOpenText, GameController, Target, FileText,
  UsersThree, Lightning, ChartBar, GraduationCap, UploadSimple,
  Flask, Crown, ArrowRight, Sparkle, Plus, CaretRight, FolderOpen
} from '@phosphor-icons/react'
import { DotmCircular7 } from '../ui/dotm-circular-7'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { useSessionStore } from '../../store/useSessionStore'
import './dhd.css'

export default function DashboardHome() {
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  const { createSession, setActiveSession } = useSessionStore()
  const [showNewUserPrompt, setShowNewUserPrompt] = useState(false)
  
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
    } catch (e) {
      console.error('Loader error:', e)
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

  const handleUploadMaterials = () => {
    navigate('/dashboard/upload')
  }

  const xp    = stats?.total_xp   ?? 0
  const streak= stats?.streak_days ?? 0
  const latestSoloMaterial = soloMaterials[0]

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight: '80vh' }}>
      <DotmCircular7 size={80} dotSize={6} color="#000000" />
    </div>
  )

  return (
    <div className="dhd-root">
      {/* ===== HERO ===== */}
      <section className="dhd-hero">
        <div className="dhd-hero-text">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Hi, {displayName}!
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="dhd-hero-sub">
            What are we doing today?
          </motion.p>
          <motion.div className="dhd-hero-orbs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="dhd-orb dhd-orb--fire"><Lightning weight="fill" size={16} /> <span>{streak}</span></div>
            <div className="dhd-orb dhd-orb--xp"><Crown weight="fill" size={16} /> <span>{xp.toLocaleString()}</span></div>
            <div className="dhd-orb dhd-orb--lvl"><Sparkle weight="fill" size={16} /> <span>LVL {Math.floor(xp / 500) + 1}</span></div>
          </motion.div>
        </div>
        <motion.div className="dhd-hero-mascot" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
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
              <h3>Create Your First Study Session</h3>
              <p>Upload materials from your device or use semester notes to start learning</p>
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
              {!isSoloLearner && (
                <motion.button 
                  className="dhd-prompt-btn dhd-prompt-btn--secondary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard/courses')}
                >
                  <BookOpenText weight="bold" size={18} />
                  Use Semester Notes
                </motion.button>
              )}
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

      {/* ===== FEATURE GRID (the main focus) ===== */}
      <section className="dhd-features">
        <h2 className="dhd-section-label">Quick Start</h2>
        <div className="dhd-feature-grid">
          <motion.button className="dhd-ftile dhd-ftile--exam" whileHover={{ y: -4 }} onClick={() => navigate('/dashboard/mock-exam')}>
            <div className="dhd-ftile-icon"><Flask weight="fill" size={28} /></div>
            <span className="dhd-ftile-title">Mock Exam</span>
            <span className="dhd-ftile-desc">Test your readiness</span>
          </motion.button>
          <motion.button className="dhd-ftile dhd-ftile--work" whileHover={{ y: -4 }} onClick={() => navigate('/dashboard/workstation')}>
            <div className="dhd-ftile-icon"><BookOpenText weight="fill" size={28} /></div>
            <span className="dhd-ftile-title">Workstation</span>
            <span className="dhd-ftile-desc">Deep study mode</span>
          </motion.button>
          <motion.button className="dhd-ftile dhd-ftile--arena" whileHover={{ y: -4 }} onClick={() => navigate('/dashboard/compete')}>
            <div className="dhd-ftile-icon"><GameController weight="fill" size={28} /></div>
            <span className="dhd-ftile-title">Arena</span>
            <span className="dhd-ftile-desc">Compete & practice</span>
          </motion.button>
          <motion.button className="dhd-ftile dhd-ftile--groups" whileHover={{ y: -4 }} onClick={() => navigate('/dashboard/study-groups')}>
            <div className="dhd-ftile-icon"><UsersThree weight="fill" size={28} /></div>
            <span className="dhd-ftile-title">Study Groups</span>
            <span className="dhd-ftile-desc">Learn together</span>
          </motion.button>
          <motion.button className="dhd-ftile dhd-ftile--lib" whileHover={{ y: -4 }} onClick={() => navigate('/dashboard/library')}>
            <div className="dhd-ftile-icon"><Books weight="fill" size={28} /></div>
            <span className="dhd-ftile-title">Library</span>
            <span className="dhd-ftile-desc">All your materials</span>
          </motion.button>
          <motion.button className="dhd-ftile dhd-ftile--more" whileHover={{ y: -4 }} onClick={() => navigate('/dashboard/courses')}>
            <div className="dhd-ftile-icon"><ArrowRight weight="bold" size={28} /></div>
            <span className="dhd-ftile-title">See all</span>
            <span className="dhd-ftile-desc">Courses & more</span>
          </motion.button>
        </div>
      </section>

      {/* ===== COMPACT COURSES / PROJECTS ===== */}
      <section className="dhd-condensed">
        <div className="dhd-condensed-head">
          <h2 className="dhd-section-label">{isSoloLearner ? 'My Projects' : 'My Courses'}</h2>
          <button className="dhd-text-btn" onClick={() => navigate(isSoloLearner ? '/dashboard/vault' : '/dashboard/courses')}>
            See all <ArrowRight size={14} weight="bold" />
          </button>
        </div>
        <div className="dhd-condensed-row">
          {(isSoloLearner ? soloMaterials : courses).slice(0, 5).map((c, i) => (
            <motion.div
              key={c.id}
              className="dhd-chip"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(isSoloLearner ? `/dashboard/workstation?materialId=${c.id}` : `/dashboard/courses/${c.id}`)}
            >
              <div className="dhd-chip-dot" style={{ background: isSoloLearner ? '#7a12cc' : c.color }} />
              <div className="dhd-chip-body">
                <span className="dhd-chip-code">{isSoloLearner ? (c.type || 'DOC').toUpperCase() : c.code}</span>
                <span className="dhd-chip-name">{isSoloLearner ? (c.title || 'Untitled') : c.name}</span>
              </div>
              <CaretRight size={14} weight="bold" className="dhd-chip-arrow" />
            </motion.div>
          ))}
          <motion.button
            className="dhd-chip dhd-chip--add"
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(isSoloLearner ? '/dashboard/upload' : '/dashboard/courses')}
          >
            <Plus size={18} weight="bold" />
            <span>{isSoloLearner ? 'Upload' : 'Add course'}</span>
          </motion.button>
        </div>
      </section>

      {/* ===== GAMIFIED STAT BAR ===== */}
      <section className="dhd-statbar">
        <div className="dhd-statbar-item">
          <ChartBar size={22} weight="fill" />
          <div>
            <span className="dhd-statbar-val">{xp.toLocaleString()}</span>
            <span className="dhd-statbar-lbl">Total XP</span>
          </div>
        </div>
        <div className="dhd-statbar-div" />
        <div className="dhd-statbar-item">
          <Lightning size={22} weight="fill" />
          <div>
            <span className="dhd-statbar-val">{streak}</span>
            <span className="dhd-statbar-lbl">Day Streak</span>
          </div>
        </div>
        <div className="dhd-statbar-div" />
        <div className="dhd-statbar-item dhd-statbar--level">
          <div className="dhd-statbar-leveltrack">
            <motion.div className="dhd-statbar-levelfill" initial={{ width: 0 }} animate={{ width: `${(xp % 500) / 5}%` }} />
          </div>
          <span className="dhd-statbar-lvl">Level {Math.floor(xp / 500) + 1}</span>
        </div>
      </section>
    </div>
  )
}
