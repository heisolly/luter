import { useState, useEffect }  from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Zap, Clock, Bell, FileText,
  FlaskConical, CheckCircle, Flame,
  Brain, Play, X, Camera, Trophy, Loader2, Users
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import './dhd.css'

/* ── colour palette (cycles by index) ── */
const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/* ── Ghost Tutorial Bubble ── */
function GhostBubble({ onDismiss }) {
  return (
    <motion.div initial={{ opacity:0, y:6, scale:0.94 }} animate={{ opacity:1, y:0, scale:1 }}
      exit={{ opacity:0, y:6, scale:0.94 }} className="dhd-ghost-bubble">
      <button className="dhd-ghost-close" onClick={onDismiss}><X size={11} /></button>
      <div className="dhd-ghost-avatar"><Brain size={13} /></div>
      <p className="dhd-ghost-text">
        Got a tough assignment? <strong>Snap a photo now.</strong> I'll have the step-by-step solution ready in 30 minutes. Try it free!
      </p>
      <div className="dhd-ghost-arrow" />
    </motion.div>
  )
}

/* ══ MAIN ══ */
export default function DashboardHome({ setActivePage, user, onOpenCourse, isMobile }) {
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Student'

  const [courses,   setCourses]   = useState([])   // user's enrolled courses
  const [stats,     setStats]     = useState(null)  // user_stats row
  const [loading,   setLoading]   = useState(true)
  const [showGhost, setShowGhost] = useState(false)

  /* ── Fetch enrolled courses + stats ── */
  useEffect(() => {
    if (!user) return

    const load = async () => {
      // Enrolled courses joined with course info
      const { data: uc } = await supabase
        .from('user_courses')
        .select('id, progress, last_studied_at, target_score, course:courses(id, code, name, faculty)')
        .eq('user_id', user.id)
        .order('created_at')

      if (uc) {
        setCourses(uc.map((row, i) => ({
          id:          row.course.id,
          ucId:        row.id,
          code:        row.course.code,
          name:        row.course.name,
          faculty:     row.course.faculty,
          color:       PALETTE[i % PALETTE.length],
          progress:    row.progress ?? 0,
          lastStudied: row.last_studied_at
            ? new Date(row.last_studied_at).toLocaleDateString('en-US', { month:'short', day:'numeric' })
            : 'Not started',
        })))
      }

      // User stats
      const { data: st } = await supabase
        .from('user_stats')
        .select('total_xp, streak_days, lives')
        .eq('user_id', user.id)
        .maybeSingle()
      if (st) setStats(st)

      setLoading(false)
    }

    load()

    // Ghost tutorial after 2s if no courses touched yet
    const t = setTimeout(() => setShowGhost(true), 2000)
    return () => clearTimeout(t)
  }, [user])

  const xp    = stats?.total_xp   ?? 0
  const streak= stats?.streak_days ?? 0
  const xpPct = Math.min(100, Math.round((xp % 1000) / 10))

  /* ── Active mission: first course ── */
  const active = courses[0] ?? null

  /* ── Fake class feed (future: pull from materials/updates table) ── */
  const feed = courses.slice(0, 4).map(c => ({
    course: c.code, color: c.color,
    msg: c.progress === 0 ? `${c.name} is ready — start your first study session!` : `Continue where you left off in ${c.name}`,
    time: c.lastStudied,
  }))

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa', minHeight: '60vh' }}>
      <Loader2 size={28} className="animate-spin" color="var(--primary)" />
    </div>
  )

  return (
    <div className="dhd-root" style={{ 
      padding: isMobile ? '0' : '0',
      background: isMobile ? '#fafafa' : '#fafafa'
    }}>

      {/* ── Hero ── */}
      <div className="dhd-hero" style={{ 
        flexDirection: isMobile ? 'column' : 'row',
        padding: isMobile ? '20px 20px 16px' : '28px 28px 20px',
        borderBottom: '1px solid var(--border)',
        gap: isMobile ? 12 : 20,
        alignItems: isMobile ? 'flex-start' : 'center',
        background: '#fff'
      }}>
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} style={{ width: isMobile ? '100%' : 'auto' }}>
          <h1 className="dhd-hero-title" style={{ fontSize: isMobile ? 22 : 28 }}>
            {greeting()}, <span className="dhd-hero-name" style={{ display: isMobile ? 'block' : 'inline' }}>{name}.</span>
          </h1>
          <p className="dhd-hero-sub" style={{ fontSize: isMobile ? 12 : 14 }}>
            {courses.length === 0
              ? 'Your command center is ready.'
              : `${courses.length} courses loaded.`}
          </p>
        </motion.div>
        
        <div style={{ 
          display:'flex', 
          flexDirection: 'row', 
          alignItems: 'center', 
          gap: 12,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          padding: isMobile ? '12px 14px' : '0',
          borderRadius: isMobile ? '16px' : '0',
          background: isMobile ? '#fdf8ff' : 'transparent',
          border: isMobile ? '1.5px solid #f5eeff' : 'none'
        }}>
          <div style={{ display:'flex', gap:8 }}>
            <div className="dhd-pill dhd-pill--fire" style={{ padding: isMobile ? '4px 10px' : '6px 14px' }}>
              <Flame size={12} fill="#d97706" color="#d97706" /> {streak}
            </div>
            <div className="dhd-pill dhd-pill--xp" style={{ padding: isMobile ? '4px 10px' : '6px 14px' }}>
              <Zap size={12} /> {xp}
            </div>
          </div>
          <div className="dhd-xp-bar-wrap" style={{ flex: isMobile ? 1 : 'initial', minWidth: isMobile ? 0 : 220 }}>
            <div style={{ flex:1, height:6, background:'#f0e8ff', borderRadius:999, overflow:'hidden', position:'relative' }}>
              <motion.div style={{ height:'100%', background:'linear-gradient(90deg,#7a12cc,#b04dfc)', borderRadius:999 }}
                initial={{ width:0 }} animate={{ width:`${xpPct}%` }} transition={{ duration:1.2 }} />
            </div>
          </div>
        </div>
      </div>

      <div className={isMobile ? "mobile-home-stack" : "dhd-bento-grid"} style={{ 
        padding: isMobile ? '16px' : '18px 20px 32px',
        display: isMobile ? 'flex' : 'grid',
        flexDirection: 'column',
        gap: 16
      }}>

        {/* ACTIVE MISSION */}
        {active && (
          <motion.div 
            className="dhd-bento-card"
            style={{ 
              background:`linear-gradient(135deg,${active.color}08 0%,white 100%)`, 
              borderColor:`${active.color}20`,
              padding: isMobile ? '16px' : '20px',
              minHeight: isMobile ? 'auto' : 200
            }}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          >
            <div className="dhd-bento-label" style={{ color:active.color, marginBottom: isMobile ? 10 : 14 }}>
              <Flame size={12} fill={active.color} /> ACTIVE MISSION
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: active.color, letterSpacing: '0.05em', marginBottom: 2 }}>{active.code}</div>
                <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{active.name}</h3>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: active.color, background: `${active.color}10`, padding: '4px 10px', borderRadius: 8 }}>
                {active.progress}%
              </div>
            </div>
            
            <div className="dhd-mission-prog-track" style={{ marginBottom: 16, height: 6 }}>
              <motion.div className="dhd-mission-prog-fill" style={{ background:active.color }}
                initial={{ width:0 }} animate={{ width:`${active.progress}%` }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} /> {active.lastStudied}
              </span>
              <button 
                onClick={() => onOpenCourse?.(active)}
                style={{ 
                  background: active.color, borderRadius: 12, border: 'none', padding: '10px 18px',
                  color: 'white', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6,
                  boxShadow: `0 4px 12px ${active.color}40`, cursor: 'pointer'
                }}
              >
                <Play size={12} fill="white" /> {active.progress === 0 ? 'START' : 'RESUME'}
              </button>
            </div>
          </motion.div>
        )}

        {/* SOLUTION VAULT (Compact on mobile) */}
        <div 
          className="dhd-bento-card" 
          style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'row' : 'column',
            alignItems: 'center',
            gap: 16,
            padding: isMobile ? '16px' : '20px'
          }}
        >
          <div style={{ 
            width: isMobile ? 48 : 64, height: isMobile ? 48 : 64, borderRadius: 16,
            background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', border: '1.5px dashed rgba(122,18,204,0.3)', flexShrink: 0
          }}>
            <Camera size={isMobile ? 20 : 24} />
          </div>
          <div>
            <div className="dhd-bento-label" style={{ marginBottom: 4 }}><Zap size={11} fill="var(--primary)" /> SOLUTION VAULT</div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#666', margin: 0 }}>Scan your homework for step-by-step help.</p>
          </div>
        </div>

        {/* CLASSES & FEED ROW */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
          {/* My Courses Mini Strip */}
          <div className="dhd-bento-card" style={{ flex: 1.5, padding: '16px' }}>
            <div className="dhd-bento-label" style={{ marginBottom: 12 }}><BookOpen size={11} fill="var(--primary)" /> MY COURSES</div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {courses.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => onOpenCourse?.(c)}
                  style={{ 
                    flexShrink: 0, width: 130, padding: 12, borderRadius: 16, border: '1.5px solid #eee',
                    background: '#fff', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 9, fontWeight: 900, color: c.color, marginBottom: 2 }}>{c.code}</div>
                  <div style={{ fontSize: 13, fontWeight: 1000, color: '#111', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ height: 4, width: '100%', background: '#f5f5f5', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.progress}%`, background: c.color }} />
                  </div>
                </div>
              ))}
              <div 
                style={{ flexShrink: 0, width: 130, padding: 12, borderRadius: 16, border: '1.5px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 11, fontWeight: 800 }}
                onClick={() => setActivePage('courses')}
              >
                + ADD MORE
              </div>
            </div>
          </div>

          {/* Quick Feed */}
          <div className="dhd-bento-card" style={{ flex: 1, padding: '16px' }}>
            <div className="dhd-bento-label" style={{ marginBottom: 12 }}><Bell size={11} fill="var(--primary)" /> UPDATES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {feed.slice(0, 3).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: f.color }} />
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BATTLE & REFER */}
        <div style={{ display: 'flex', gap: 16 }}>
           <motion.div 
            className="dhd-bento-card" 
            style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20,
              background: '#f8f4ff', borderColor: '#7a12cc20'
            }}
            onClick={() => setActivePage('compete')}
          >
            <Trophy size={20} color="#7a12cc" />
            <div style={{ fontSize: 12, fontWeight: 900, color: '#111' }}>ARENA</div>
          </motion.div>

          <motion.div 
            className="dhd-bento-card" 
            style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20,
              background: '#fff'
            }}
            onClick={() => setActivePage('refer')}
          >
            <Users size={20} color="#111" />
            <div style={{ fontSize: 12, fontWeight: 900, color: '#111' }}>REFER</div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
