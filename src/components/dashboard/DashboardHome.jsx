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
      <div style={{ 
        padding: isMobile ? '24px 20px' : '48px 48px 32px',
        background: '#fff',
        borderBottom: '2.5px solid #111',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle background decoration */}
        <div style={{ position: 'absolute', top: -10, right: -10, width: 150, height: 150, background: 'var(--primary-bg)', opacity: 0.5, borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }} />
        
        <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: isMobile ? 24 : 36, fontWeight: 1000, color: '#111', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {greeting()}, <span style={{ color: 'var(--primary)' }}>{name}.</span>
          </h1>
          <p style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color: '#666', marginTop: 8 }}>
            {courses.length === 0
              ? 'Ready to start your scholarly journey?'
              : `You have ${courses.length} active courses to master today.`}
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity:0, scale: 0.95 }} animate={{ opacity:1, scale: 1 }}
          style={{ 
            display:'flex', 
            flexDirection: 'column', 
            gap: 12,
            width: isMobile ? '100%' : 300,
            padding: '20px',
            borderRadius: 24,
            background: '#fff',
            border: '2.5px solid #111',
            boxShadow: isMobile ? '4px 4px 0px #111' : '8px 8px 0px #111',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ display:'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef3c7', padding: '4px 10px', borderRadius: 12, border: '1.5px solid #111', fontSize: 12, fontWeight: 900 }}>
                <Flame size={14} fill="#d97706" color="#d97706" /> {streak}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--primary-bg)', padding: '4px 10px', borderRadius: 12, border: '1.5px solid #111', fontSize: 12, fontWeight: 900 }}>
                <Zap size={14} fill="var(--primary)" color="var(--primary)" /> {xp}
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 1000, color: '#999' }}>LVL {Math.floor(xp/1000) + 1}</span>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ height: 10, background: '#f5f5f5', borderRadius: 99, border: '1.5px solid #111', overflow: 'hidden' }}>
              <motion.div style={{ height: '100%', background: 'var(--primary)', borderRadius: 99 }}
                initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1.5, ease: "easeOut" }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#999' }}>PROGRESS TO NEXT TIER</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#111' }}>{xpPct}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ 
        padding: isMobile ? '20px' : '40px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        maxWidth: 1400,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* ROW 1: MISSION & QUICK SCAN */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: 24 }}>
          {active ? (
            <motion.div 
              whileHover={{ y: -4 }}
              style={{ 
                background: `linear-gradient(135deg, ${active.color}08 0%, #fff 100%)`,
                borderRadius: isMobile ? 28 : 32,
                border: '2.5px solid #111',
                padding: isMobile ? '24px' : '32px',
                boxShadow: isMobile ? '6px 6px 0px #111' : '12px 12px 0px #111',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => onOpenCourse?.(active)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${active.color}15`, padding: '6px 12px', borderRadius: 12, border: `1.5px solid ${active.color}` }}>
                  <Play size={12} fill={active.color} color={active.color} />
                  <span style={{ fontSize: 10, fontWeight: 900, color: active.color, letterSpacing: '0.1em' }}>ACTIVE MISSION</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 1000, color: '#111' }}>{active.progress}%</div>
              </div>

              <div>
                <h3 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 1000, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{active.name}</h3>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#666', margin: 0 }}>Code: {active.code} • Last seen {active.lastStudied}</p>
              </div>

              <div style={{ marginTop: 24, height: 12, background: '#f5f5f5', borderRadius: 99, border: '2px solid #111', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', background: active.color }}
                  initial={{ width: 0 }} animate={{ width: `${active.progress}%` }} />
              </div>
              
              <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', WebkitMaskImage: 'linear-gradient(to right, black 50%, transparent 100%)' }}>
                  {[0, 1, 2].map((i) => (
                    <div 
                      key={i} 
                      style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '50%', 
                        border: '2px solid #111', 
                        background: '#ddd', 
                        marginLeft: i === 0 ? 0 : -10,
                        zIndex: 3 - i
                      }} 
                    />
                  ))}
                  <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, color: '#888', display: 'flex', alignItems: 'center' }}>+12 scholars studying</span>
                </div>
                <button style={{ background: '#111', color: '#fff', borderRadius: 16, border: 'none', padding: '12px 24px', fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '4px 4px 0px #eee' }}>RESUME</button>
              </div>
            </motion.div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 32, border: '2.5px solid #111', padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                <BookOpen size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 1000, margin: 0 }}>No Active Courses</h3>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#888', margin: '4px 0 0' }}>Initialize your scholarship to begin.</p>
              </div>
              <button 
                onClick={() => setActivePage('courses')}
                style={{ background: 'var(--primary)', color: '#fff', borderRadius: 16, border: '2.5px solid #111', padding: '14px 28px', fontSize: 14, fontWeight: 900, boxShadow: '4px 4px 0px #111', cursor: 'pointer' }}
              >
                BROWSE COURSES
              </button>
            </div>
          )}

          {/* QUICK SCAN / SOLUTION VAULT */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            style={{ 
              background: '#f5f3ff',
              borderRadius: isMobile ? 28 : 32,
              border: '2.5px solid #111',
              padding: isMobile ? '24px' : '32px',
              boxShadow: isMobile ? '6px 6px 0px #111' : '10px 10px 0px #111',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setActivePage('vault')}
          >
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--primary)', border: '2px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginBottom: 20, boxShadow: '4px 4px 0px #111' }}>
              <Camera size={24} strokeWidth={3} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 1000, margin: '0 0 8px', color: '#111' }}>Solution Vault</h3>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#666', margin: 0, lineHeight: 1.5 }}>Snap a photo of any tough problem. Get instant, step-by-step AI guidance.</p>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontWeight: 1000, fontSize: 12 }}>
              OPEN CAMERA <Zap size={14} fill="var(--primary)" />
            </div>
          </motion.div>
        </div>

        {/* ROW 2: COURSES STRIP */}
        <div style={{ 
          background: '#fff', 
          borderRadius: 32, 
          border: '2.5px solid #111', 
          padding: isMobile ? '20px' : '24px 32px',
          boxShadow: isMobile ? '4px 4px 0px #111' : '8px 8px 0px #111'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h4 style={{ fontSize: 11, fontWeight: 1000, color: '#111', letterSpacing: '0.15em', textTransform: 'uppercase', margin: 0 }}>Current Enrollment</h4>
            <button onClick={() => setActivePage('courses')} style={{ fontSize: 11, fontWeight: 1000, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>VIEW ALL ({courses.length})</button>
          </div>
          
          <div className="no-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 10 }}>
            {courses.map(c => (
              <motion.div 
                key={c.id} 
                whileTap={{ scale: 0.96 }}
                onClick={() => onOpenCourse?.(c)}
                style={{ 
                  flexShrink: 0, 
                  width: isMobile ? 180 : 220, 
                  padding: '20px', 
                  borderRadius: 20, 
                  border: '2.5px solid #111',
                  background: '#fff', 
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, border: '1.5px solid #111', marginBottom: 12 }} />
                <div style={{ fontSize: 16, fontWeight: 1000, color: '#111', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#999', marginBottom: 16 }}>{c.code}</div>
                
                <div style={{ height: 6, width: '100%', background: '#f0f0f0', borderRadius: 99, border: '1.5px solid #111', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.progress}%`, background: c.color }} />
                </div>
              </motion.div>
            ))}
            <div 
              style={{ flexShrink: 0, width: isMobile ? 140 : 160, borderRadius: 20, border: '2.5px dashed #ccc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', cursor: 'pointer' }}
              onClick={() => setActivePage('courses')}
            >
              <Zap size={20} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 11, fontWeight: 1000 }}>ENROLL</div>
            </div>
          </div>
        </div>

        {/* ROW 3: ARENA & UPDATES */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.5fr', gap: 24 }}>
          {/* ARENA */}
          <motion.div 
            whileHover={{ x: 4 }}
            style={{ 
              background: '#111', 
              borderRadius: 32, 
              padding: 32, 
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={() => setActivePage('compete')}
          >
            <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
              <Trophy size={120} />
            </div>
            <div style={{ zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)', fontSize: 11, fontWeight: 1000, letterSpacing: '0.1em', marginBottom: 12 }}>
                <FlaskConical size={14} /> STUDY ARENA
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 1000, margin: 0, letterSpacing: '-0.02em' }}>Challenge a Peer.</h3>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#999', marginTop: 8 }}>Stake your XP and win the study duel.</p>
            </div>
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 1000, color: 'var(--primary)' }}>
              ENTER ARENA <Play size={14} fill="var(--primary)" />
            </div>
          </motion.div>

          {/* UPDATES FEED */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 32, 
            border: '2.5px solid #111', 
            padding: isMobile ? '24px' : '32px',
            boxShadow: isMobile ? '4px 4px 0px #111' : '8px 8px 0px #111'
          }}>
            <h4 style={{ fontSize: 11, fontWeight: 1000, color: '#111', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Workstation Intel</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {feed.slice(0, 3).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px', borderRadius: 16, border: '1.5px solid #f5f5f5', background: '#fafafa' }}>
                   <div style={{ width: 12, height: 12, borderRadius: 4, background: f.color, border: '1.5px solid #111' }} />
                   <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{f.msg}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#888' }}>{f.course} • {f.time}</div>
                   </div>
                   <Bell size={14} color="#ccc" />
                </div>
              ))}
              {feed.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: 13, fontWeight: 700 }}>
                  No new updates in your feed. Lock in!
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
