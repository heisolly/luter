import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, Loader2, Plus, Zap, Trophy, Flame
} from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import './dhd.css'

export default function DashboardHome() {
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  
  const profile = bundle?.profile?.data || bundle?.profile 
  const username = profile?.username;
  const displayName = username || profile?.full_name?.split(' ')[0] || 'Scholar';
  const displayHandle = username ? `${username}` : displayName;

  const [courses, setCourses] = useState([])   
  const [stats, setStats] = useState(null)  
  const [loading, setLoading] = useState(true)

  const mapCourses = useCallback((uc) => {
    if (!Array.isArray(uc)) return []
    return uc
      .filter(row => row && (row.courses || row.course))
      .map((row) => {
        // Handle both aliased 'course' and direct 'courses' joins
        const c = row.courses || row.course
        return {
          id: row.id,
          code: c?.code || 'COURSE',
          name: c?.name || 'Enrolled Course',
          progress: row.progress ?? 0,
          faculty: c?.faculty || 'General'
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

      if (uc) setCourses(mapCourses(uc))

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
    if (bundle?.uc?.data && bundle.uc.data.length > 0) {
      setCourses(mapCourses(bundle.uc.data))
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

  const xp    = stats?.total_xp   ?? 0
  const streak= stats?.streak_days ?? 0

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight: '80vh' }}>
      <Loader2 size={32} className="animate-spin" color="var(--n-primary)" />
    </div>
  )

  return (
    <div className="dhd-root">
      
      {/* ── HEADER ── */}
      <header className="dhd-header">
        <div className="dhd-stat-pill">
          <Flame size={16} fill="#f59e0b" color="#f59e0b" /> {streak} DAYS
          <span style={{ margin: '0 8px', color: '#e2e8f0' }}>|</span>
          <Trophy size={16} fill="var(--n-primary)" color="var(--n-primary)" /> {xp.toLocaleString()} XP
        </div>
        
        <div className="dhd-user-pill">
          <div style={{ fontSize: 13, fontWeight: 700 }}>{displayHandle}</div>
          <div style={{ width: 32, height: 32, background: 'var(--n-primary)', borderRadius: '50%', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 11, fontWeight: 900 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <motion.section 
        className="dhd-hero-mini"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="dhd-hero-content">
          <h1 style={{ letterSpacing: '-0.04em' }}>Welcome back, {username || displayName}.</h1>
          <p style={{ opacity: 0.8, marginTop: 12, fontSize: 16, fontWeight: 500, lineHeight: 1.4 }}>
            Luter is configured for your session. You have {courses.length} active courses today.
          </p>
          {(profile?.level || profile?.university || profile?.faculty) && (
            <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', opacity: 0.6, fontSize: 13, fontWeight: 800 }}>
              <span style={{ background: 'rgba(0,0,0,0.05)', padding: '4px 10px', borderRadius: 8 }}>{profile.level ? `${profile.level} LEVEL` : 'SCHOLAR'}</span>
              <span>•</span>
              <span style={{ textTransform: 'uppercase' }}>{profile.faculty || 'Undergraduate'}</span>
              <span>•</span>
              <span style={{ textTransform: 'uppercase' }}>{profile.university || 'Academic Studio'}</span>
            </div>
          )}
        </div>
        
        <motion.img 
          src="/mascot.png" 
          alt="Luter" 
          className="dhd-hero-mascot"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.section>

      {/* ── COURSE FOCUS ── */}
      <section>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin:0 }}>Current Courses</h2>
          <button 
            onClick={() => navigate('/dashboard/workstation')}
            style={{ background: 'var(--n-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 16, fontWeight: 700, fontSize: 13, cursor:'pointer' }}
          >
            Open Workstation
          </button>
        </div>

        <div className="dhd-course-grid">
          {courses.map((c, i) => (
            <motion.div 
              key={c.id}
              className="dhd-course-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/dashboard/courses/${c.id}`)}
            >
              <div>
                <div className="dhd-course-tag">{c.code}</div>
                <h3 className="dhd-course-name">{c.name}</h3>
                <div className="dhd-course-progress-text">Level {Math.floor(c.progress / 20) + 1} Mastery</div>
              </div>

              <div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, fontWeight: 800 }}>
                  <span>Progress</span>
                  <span>{c.progress}%</span>
                </div>
                <div className="dhd-prog-bar">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${c.progress}%` }}
                    className="dhd-prog-fill" 
                  />
                </div>
              </div>
            </motion.div>
          ))}
          
          <motion.div 
            className="dhd-course-card"
            style={{ border: '2px dashed #e2e8f0', background: 'transparent', boxShadow: 'none', justifyContent: 'center', alignItems: 'center' }}
            onClick={() => navigate('/dashboard/courses')}
          >
            <Plus size={32} color="#94a3b8" />
            <div style={{ marginTop: 12, fontWeight: 700, color: '#94a3b8' }}>Enroll Course</div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
