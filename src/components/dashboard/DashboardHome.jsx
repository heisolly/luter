import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowRight, Loader2, Plus, Zap, Trophy, Flame, 
  Clock, Gamepad2, BookOpen, Target, ChevronRight
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
            <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', opacity: 0.8, fontSize: 13, fontWeight: 800 }}>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 12 }}>{profile.level ? `${profile.level} LEVEL` : 'SCHOLAR'}</span>
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

      <div className="dhd-main-grid">
        {/* LEFT COLUMN: COURSES + ACTIVITY */}
        <div className="dhd-left-col">
          
          {/* Recent Activity */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={20} color="var(--primary)" /> Continue Research
            </h2>
            <div className="dhd-activity-card" onClick={() => navigate('/dashboard/workstation')}>
              <div style={{ padding: 10, background: 'var(--primary-bg)', borderRadius: 12 }}>
                <BookOpen size={20} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Modern Physics - Quantum Notes</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Last viewed 45m ago • Document Workplace</div>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
            </div>
          </section>

          {/* Course Grid */}
          <section>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Active Courses</h2>
              <button 
                onClick={() => navigate('/dashboard/courses')}
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', background: 'transparent', border:'none', cursor:'pointer' }}
              >
                View Library
              </button>
            </div>

            <div className="dhd-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {courses.map((c, i) => (
                <motion.div 
                  key={c.id}
                  className="dhd-course-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(`/dashboard/courses/${c.id}`)}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: c.color }} />
                  <div>
                    <div className="dhd-course-tag">{c.code}</div>
                    <h3 className="dhd-course-name" style={{ fontSize: 18 }}>{c.name}</h3>
                    <div className="dhd-course-progress-text">Level {Math.floor(c.progress / 20) + 1} Mastery</div>
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#94a3b8' }}>
                      <span>Mastery</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="dhd-prog-bar" style={{ height: 6, marginTop: 8 }}>
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
                style={{ border: '2px dashed #e2e8f0', background: 'transparent', boxShadow: 'none', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}
                onClick={() => navigate('/dashboard/courses')}
              >
                <Plus size={28} color="#94a3b8" />
                <div style={{ marginTop: 8, fontWeight: 700, color: '#94a3b8', fontSize: 14 }}>Add Course</div>
              </motion.div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS + STATS */}
        <aside className="dhd-right-col">
          
          <div className="dhd-quick-action" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 900, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }}>Quick Session</h2>
            
            <button className="dhd-action-btn" onClick={() => navigate('/dashboard/matches')} style={{ background: '#fef2f2', borderColor: '#fee2e2' }}>
              <Target size={18} color="#ef4444" />
              <span style={{ color: '#ef4444' }}>Mock Exam Session</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </button>

            <button className="dhd-action-btn" onClick={() => navigate('/dashboard/workstation')} style={{ marginTop: 12 }}>
              <Zap size={18} fill="#f59e0b" color="#f59e0b" />
              <span>Full Workstation</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </button>

            <button className="dhd-action-btn" onClick={() => navigate('/dashboard/playground')} style={{ marginTop: 12 }}>
              <Gamepad2 size={18} color="var(--primary)" />
              <span>Arena Practice</span>
              <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </button>
          </div>

          <div className="dhd-quick-action" style={{ background: 'white', color: '#111', border: '1.5px solid var(--accent-gold)', boxShadow: 'none' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, opacity: 0.6, margin:0, letterSpacing: '0.05em', color: '#78350f' }}>WEEKLY PULSE</h2>
              <Trophy size={18} fill="var(--accent-gold)" color="var(--accent-gold)" />
            </div>
            
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em' }}>{xp.toLocaleString()}</div>
              <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700 }}>Active Student XP</div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
                <span style={{ color: '#111' }}>Level 4 Mastery</span>
                <span style={{ color: 'var(--accent-gold)' }}>75%</span>
              </div>
              <div style={{ height: 8, background: '#f8fafc', borderRadius: 4, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ height: '100%', background: 'var(--accent-gold)', borderRadius: 4 }} 
                />
              </div>
            </div>
          </div>

        </aside>
      </div>

    </div>
  )
}
