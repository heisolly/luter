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
export default function DashboardHome({ setActivePage, user, onOpenCourse }) {
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
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#fafafa' }}>
      <Loader2 size={28} className="animate-spin" color="var(--primary)" />
    </div>
  )

  return (
    <div className="dhd-root">

      {/* ── Hero ── */}
      <div className="dhd-hero">
        <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}>
          <h1 className="dhd-hero-title">
            {greeting()}, <span className="dhd-hero-name">{name}.</span>
          </h1>
          <p className="dhd-hero-sub">
            {courses.length === 0
              ? 'Your command center is ready. Start studying!'
              : `${courses.length} course${courses.length>1?'s':''} loaded — let's get that GPA up.`}
          </p>
        </motion.div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <div style={{ display:'flex', gap:8 }}>
            <div className="dhd-pill dhd-pill--fire"><Flame size={13} fill="#d97706" color="#d97706" /> {streak}-day streak</div>
            <div className="dhd-pill dhd-pill--xp"><Zap size={13} /> {xp} XP</div>
          </div>
          {/* XP progress */}
          <div className="dhd-xp-bar-wrap">
            <div className="dhd-xp-rank">Lv.{Math.floor(xp/1000)+1} {xp<1000?'Freshman':xp<3000?'Scholar':'Veteran'}</div>
            <span style={{ fontSize:11, color:'#999' }}>{xp % 1000} / 1000 XP</span>
            <div style={{ flex:1, height:6, background:'#f0e8ff', borderRadius:999, overflow:'hidden' }}>
              <motion.div style={{ height:'100%', background:'linear-gradient(90deg,#7a12cc,#b04dfc)', borderRadius:999 }}
                initial={{ width:0 }} animate={{ width:`${xpPct}%` }} transition={{ duration:1.2, ease:[0.23,1,0.32,1] }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bento Grid ── */}
      <div className="dhd-bento-grid">

        {/* A: Active Mission */}
        <div style={{ gridArea:'mission' }}>
          {active ? (
            <motion.div className="dhd-bento-card dhd-bento-mission"
              style={{ background:`linear-gradient(135deg,${active.color}18 0%,white 60%)`, borderColor:`${active.color}25` }}
              whileHover={{ scale:1.01 }} transition={{ type:'spring', stiffness:200, damping:24 }}>
              <div className="dhd-bento-label" style={{ color:active.color }}><Flame size={13} /> Active Mission</div>
              <div className="dhd-mission-code" style={{ color:active.color }}>{active.code}</div>
              <h3 className="dhd-mission-name">{active.name}</h3>
              <p className="dhd-mission-topic">
                {active.progress === 0
                  ? 'No sessions yet — start your first one now!'
                  : `Progress: ${active.progress}% complete`}
              </p>
              <div className="dhd-mission-prog">
                <div className="dhd-mission-prog-track">
                  <motion.div className="dhd-mission-prog-fill" style={{ background:active.color }}
                    initial={{ width:0 }} animate={{ width:`${active.progress}%` }} transition={{ duration:1, ease:[0.23,1,0.32,1] }} />
                </div>
                <span style={{ color:active.color, fontSize:13, fontWeight:800 }}>{active.progress}%</span>
              </div>
              <div className="dhd-mission-foot">
                <span className="dhd-mission-last"><Clock size={11} /> {active.lastStudied}</span>
                <button className="dhd-mission-resume" style={{ background:active.color }} onClick={() => onOpenCourse?.(active)}>
                  <Play size={12} fill="white" /> {active.progress === 0 ? 'Start Now' : 'Resume'}
                </button>
              </div>
            </motion.div>
          ) : (
            /* Empty state for no courses */
            <div className="dhd-bento-card dhd-bento-mission" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, textAlign:'center' }}>
              <div style={{ fontSize:36 }}>📚</div>
              <p style={{ fontSize:14, fontWeight:700, color:'var(--text)', margin:0 }}>No courses yet</p>
              <p style={{ fontSize:12, color:'var(--muted)', margin:0 }}>Something went wrong during enrollment. Contact support or re-run onboarding.</p>
            </div>
          )}
        </div>

        {/* B: Solution Vault */}
        <div style={{ gridArea:'vault' }}>
          <div className="dhd-bento-card dhd-bento-vault">
            <div className="dhd-bento-label"><Zap size={13} color="var(--primary)" /> Solution Vault</div>
            <div className="dhd-vault-empty">
              <div style={{ position:'relative' }}>
                <motion.div
                  animate={{ boxShadow:['0 0 0 0px rgba(122,18,204,0.3)','0 0 0 12px rgba(122,18,204,0)','0 0 0 0px rgba(122,18,204,0)'] }}
                  transition={{ duration:1.8, repeat:Infinity }}
                  className="dhd-vault-upload-btn">
                  <Camera size={22} strokeWidth={1.8} />
                </motion.div>
                <AnimatePresence>
                  {showGhost && <GhostBubble onDismiss={() => setShowGhost(false)} />}
                </AnimatePresence>
              </div>
              <p className="dhd-vault-empty-text">
                Your personal tutor is standing by. Upload your first problem to start the 30-minute clock.
              </p>
            </div>
          </div>
        </div>

        {/* Course Strip */}
        <div style={{ gridArea:'courses' }}>
          <div className="dhd-bento-card dhd-bento-courses">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div className="dhd-bento-label"><BookOpen size={13} color="var(--primary)" /> My Courses</div>
            </div>
            {courses.length === 0 ? (
              <p style={{ fontSize:13, color:'var(--muted)', fontWeight:500 }}>No courses enrolled yet.</p>
            ) : (
              <div className="dhd-strip-scroll">
                {courses.map((c, i) => (
                  <motion.div key={c.id} className="dhd-strip-card"
                    initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.07 }}
                    whileHover={{ y:-3 }} onClick={() => onOpenCourse?.(c)}>
                    <div className="dhd-strip-stripe" style={{ background:c.color }} />
                    <div style={{ padding:'10px 12px' }}>
                      <div style={{ fontSize:10, fontWeight:800, color:c.color, letterSpacing:'0.04em' }}>{c.code}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#111', marginTop:2 }}>{c.name}</div>
                      <div style={{ height:4, background:'#f0e8ff', borderRadius:999, overflow:'hidden', marginTop:8 }}>
                        <motion.div style={{ height:'100%', background:c.color, borderRadius:999 }}
                          initial={{ width:0 }} animate={{ width:`${c.progress}%` }} transition={{ duration:0.8, delay:i*0.1 }} />
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, alignItems:'center' }}>
                        <span style={{ fontSize:10, color:'#888' }}>{c.progress}%</span>
                        <span className="dhd-strip-due">{c.lastStudied}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* C: Class Feed */}
        <div style={{ gridArea:'feed' }}>
          <div className="dhd-bento-card dhd-bento-feed">
            <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
              <span className="dhd-bento-label"><Bell size={13} color="var(--primary)" /> Class Feed</span>
              <div className="dhd-live-dot" style={{ marginLeft:'auto' }} />
            </div>
            {feed.length === 0 ? (
              <p style={{ fontSize:13, color:'var(--muted)', fontWeight:500 }}>Enroll in courses to see your class feed.</p>
            ) : (
              <div className="dhd-proxy-feed-list">
                {feed.map((p, i) => (
                  <motion.div key={i} className="dhd-proxy-feed-row"
                    initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2+i*0.07 }}>
                    <div className="dhd-proxy-feed-icon" style={{ background:`${p.color}12`, color:p.color }}>
                      <Bell size={11} />
                    </div>
                    <div style={{ flex:1, overflow:'hidden' }}>
                      <span style={{ fontSize:10, fontWeight:800, color:p.color, letterSpacing:'0.04em', display:'block', marginBottom:2 }}>{p.course}</span>
                      <p style={{ fontSize:12, fontWeight:500, color:'#444', margin:0, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.msg}</p>
                    </div>
                    <span style={{ fontSize:10, color:'#ccc', flexShrink:0 }}>{p.time}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quiz Empty State */}
        <div style={{ gridArea:'quiz' }}>
          <div className="dhd-bento-card dhd-bento-quiz">
            <div className="dhd-bento-label"><Trophy size={13} color="var(--primary)" /> Quiz Battle</div>
            <div className="dhd-quiz-empty-icon">🏆</div>
            <p className="dhd-quiz-empty-text">
              {streak === 0
                ? <>Your streak starts at <strong>0</strong>. Take a 2-min blitz to warm up.</>
                : <><strong>{streak}-day</strong> streak! Keep it going.</>}
            </p>
            <button className="dhd-quiz-start-btn" onClick={() => setActivePage('courses')}>
              <Zap size={13} /> Start Quick Battle
            </button>
          </div>
        </div>

        {/* D: Subtle Referral Card */}
        <div style={{ gridArea:'refer' }}>
          <motion.div 
            className="dhd-bento-card dhd-bento-refer"
            whileHover={{ y: -4 }}
            style={{ 
              background: 'linear-gradient(135deg, #f5eeff 0%, #ffffff 100%)',
              border: '1.5px solid #7a12cc15',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              padding: '24px'
            }}
            onClick={() => setActivePage('refer')}
          >
            <div style={{ 
              width: 48, height: 48, borderRadius: 14, background: 'white', 
              border: '1.5px solid #f5eeff', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', color: '#7a12cc', marginBottom: 12,
              boxShadow: '0 4px 12px rgba(122, 18, 204, 0.1)'
            }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: 13, fontWeight: 900, color: '#111', margin: '0 0 4px' }}>Invite a Classmate</h3>
            <p style={{ fontSize: 11, color: '#7a12cc99', fontWeight: 600, margin: 0 }}>Gift a free trial & earn 500 XP.</p>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
