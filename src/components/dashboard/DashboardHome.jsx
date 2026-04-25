import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  RiArrowRightLine as ArrowRight, RiLoader4Line as CircleNotch, RiAddLine as Plus, RiFlashlightFill as Zap, RiTrophyFill as Trophy, RiFireFill as Flame, 
  RiTimeFill as Clock, RiGamepadFill as GameController, RiBookOpenFill as BookOpen, RiFocusFill as Target, RiArrowRightSLine as CaretRight, RiMagicFill as Sparkle, RiCheckboxCircleFill as CheckCircle
} from "react-icons/ri"
import { useNavigate, useOutletContext } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import './dhd.css'

export default function DashboardHome() {
  const navigate = useNavigate()
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  
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

  const xp    = stats?.total_xp   ?? 0
  const streak= stats?.streak_days ?? 0
  const latestSoloMaterial = soloMaterials[0]

  if (loading) return (
    <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', minHeight: '80vh' }}>
      <CircleNotch size={48} weight="bold" className="animate-spin" color="#4B0082" />
    </div>
  )

  return (
    <div className="dhd-root">
      
      {/* ── HEADER ── */}
      <header className="dhd-header">
        <div className="dhd-stat-pill" style={{ fontFamily: 'var(--font-outfit)', fontWeight: 800 }}>
          <Flame size={18} weight="bold" color="#F59E0B" /> {streak} DAYS
          <span style={{ margin: '0 12px', color: '#E2E8F0', fontWeight: 400 }}>|</span>
          <Trophy size={18} weight="bold" color="#4B0082" /> {xp.toLocaleString()} XP
        </div>
        
        <div className="dhd-user-pill" style={{ border: '1.5px solid #F1F5F9', borderRadius: '16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1A102D', fontFamily: 'var(--font-outfit)', textTransform: 'uppercase' }}>{displayHandle}</div>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #A855F7, #C7B9FF)', borderRadius: '12px', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 12, fontWeight: 900 }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <motion.section 
        className="dhd-hero-mini"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ 
          background: '#1A102D',
          padding: '64px',
          borderRadius: '32px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div className="dhd-hero-content">
          <h1 style={{ letterSpacing: '-0.04em', fontFamily: 'var(--font-outfit)', fontSize: '48px', fontWeight: 800 }}>
            {isSoloLearner ? `Your Personal Vault, ${displayName}.` : `Welcome back, ${displayName}.`}
          </h1>
          <p style={{ opacity: 0.8, marginTop: 16, fontSize: 18, fontWeight: 500, lineHeight: 1.6, fontFamily: 'var(--font-varela)', maxWidth: '600px' }}>
            {isSoloLearner 
              ? soloMaterials.length > 0
                ? `You have ${soloMaterials.length} personal ${soloMaterials.length === 1 ? 'material' : 'materials'} ready for study.`
                : "Everything is set. Upload a document to start your personal study workspace."
              : `Luter is configured for your session. You have ${courses.length} active courses today.`
            }
          </p>
          
          <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            {!isSoloLearner ? (
              <>
                <span style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-outfit)', letterSpacing: '0.04em' }}>{profile.level ? `${profile.level} LEVEL` : 'SCHOLAR'}</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }} />
                <span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-outfit)' }}>{profile.faculty || 'Undergraduate'}</span>
              </>
            ) : (
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-outfit)', letterSpacing: '0.04em' }}>SOLO LEARNER</span>
            )}
          </div>
        </div>
        
        <motion.img 
          src="/mascot.png" 
          alt="Luter" 
          className="dhd-hero-mascot"
          style={{ height: '160px' }}
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.section>

      {/* ── PENDING PROCESSING BANNER ── */}
      {pendingMaterials.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ 
            marginTop: '24px', 
            background: 'linear-gradient(135deg, #F3E8FF, #FFFFFF)', 
            border: '1.5px solid #C7B9FF',
            borderRadius: '20px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 10px 30px rgba(168, 85, 247, 0.08)'
          }}
        >
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '16px', 
            background: '#4B0082', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(75, 0, 130, 0.2)'
          }}>
            <Sparkle size={24} weight="bold" color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#4B0082', fontFamily: 'var(--font-outfit)', marginBottom: '2px' }}>
              LUTER IS OPTIMIZING {pendingMaterials.length} {pendingMaterials.length === 1 ? 'MATERIAL' : 'MATERIALS'}
            </h4>
            <p style={{ fontSize: '13px', color: '#64748B', fontFamily: 'var(--font-varela)', fontWeight: 500 }}>
              Preparing your study guide, flashcards, and AI-powered insights. This will be ready in a moment.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4B0082', fontSize: '13px', fontWeight: 800, fontFamily: 'var(--font-outfit)' }}>
            <CircleNotch size={18} weight="bold" className="animate-spin" />
            <span>PROCESSING...</span>
          </div>
        </motion.div>
      )}

      <div className="dhd-main-grid">
        {/* LEFT COLUMN: COURSES + ACTIVITY */}
        <div className="dhd-left-col">
          
          {/* Recent Activity */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-outfit)', color: '#1A102D' }}>
              <Clock size={24} weight="bold" color="#4B0082" /> CONTINUE RESEARCH
            </h2>
            <div className="dhd-activity-card" onClick={() => navigate(isSoloLearner ? (latestSoloMaterial ? `/dashboard/workstation?materialId=${latestSoloMaterial.id}` : '/dashboard/upload') : '/dashboard/workstation')} style={{ padding: '24px', borderRadius: '20px', border: '1.5px solid #F1F5F9' }}>
              <div style={{ padding: '12px', background: '#F3E8FF', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={24} weight="bold" color="#4B0082" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A102D', fontFamily: 'var(--font-outfit)' }}>
                  {isSoloLearner
                    ? (latestSoloMaterial?.title || 'Upload your first document')
                    : 'MODERN PHYSICS - QUANTUM NOTES'}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, fontFamily: 'var(--font-varela)', fontWeight: 500 }}>
                  {isSoloLearner
                    ? latestSoloMaterial
                      ? `${(latestSoloMaterial.type || 'document').toUpperCase()} • Open your latest material`
                      : 'No material yet • Start by uploading a document'
                    : 'Last viewed 45m ago • Document Workplace'}
                </div>
              </div>
              <CaretRight size={20} weight="bold" color="#94A3B8" />
            </div>
          </section>

          {/* Course Grid */}
          <section>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-outfit)', color: '#1A102D' }}>
                {isSoloLearner ? "PERSONAL STUDY PROJECTS" : "ACTIVE COURSES"}
              </h2>
              <button 
                onClick={() => navigate(isSoloLearner ? '/dashboard/vault' : '/dashboard/courses')}
                style={{ fontSize: 12, fontWeight: 700, color: '#4B0082', background: 'transparent', border:'none', cursor:'pointer', fontFamily: 'var(--font-outfit)', letterSpacing: '0.04em' }}
              >
                {isSoloLearner ? "OPEN VAULT" : "VIEW LIBRARY"}
              </button>
            </div>

            <div className="dhd-course-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {(isSoloLearner ? soloMaterials : courses).map((c, i) => (
                <motion.div 
                  key={c.id}
                  className="dhd-course-card"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => navigate(isSoloLearner ? `/dashboard/workstation?materialId=${c.id}` : `/dashboard/courses/${c.id}`)}
                  style={{ position: 'relative', overflow: 'hidden', padding: '32px', borderRadius: '24px', border: '1.5px solid #F1F5F9' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: isSoloLearner ? '#A855F7' : c.color }} />
                  <div>
                    <div className="dhd-course-tag" style={{ fontFamily: 'var(--font-outfit)', fontWeight: 700, letterSpacing: '0.08em', color: '#94A3B8' }}>
                      {isSoloLearner ? (c.type || 'document').toUpperCase() : c.code}
                    </div>
                    <h3 className="dhd-course-name" style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-outfit)', color: '#1A102D' }}>
                      {isSoloLearner ? (c.title || 'Untitled material') : c.name}
                    </h3>
                    <div className="dhd-course-progress-text" style={{ fontFamily: 'var(--font-varela)', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>
                      {isSoloLearner
                        ? (c.processing_status === 'pending' ? 'Processing in workspace' : 'Ready for study')
                        : `Level ${Math.floor(c.progress / 20) + 1} Mastery`}
                    </div>
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#1A102D', fontFamily: 'var(--font-outfit)', letterSpacing: '0.05em' }}>
                      <span>{isSoloLearner ? 'Status' : 'MASTERY'}</span>
                      <span>{isSoloLearner ? (c.processing_status === 'pending' ? 'Pending' : 'Ready') : `${c.progress}%`}</span>
                    </div>
                    <div className="dhd-prog-bar" style={{ height: 8, marginTop: 10, background: '#F1F5F9' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: isSoloLearner ? (c.processing_status === 'pending' ? '55%' : '100%') : `${c.progress}%` }}
                        className="dhd-prog-fill" 
                        style={{ background: isSoloLearner ? (c.processing_status === 'pending' ? '#F59E0B' : '#10B981') : c.color }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              
              <motion.div 
                className="dhd-course-card"
                style={{ border: '2.5px dashed #E2E8F0', background: 'transparent', boxShadow: 'none', justifyContent: 'center', alignItems: 'center', minHeight: 200, borderRadius: '24px' }}
                onClick={() => navigate(isSoloLearner ? '/dashboard/upload' : '/dashboard/courses')}
                whileHover={{ borderColor: '#4B0082', background: 'rgba(75, 0, 130, 0.02)' }}
              >
                <Plus size={32} weight="bold" color="#94A3B8" />
                <div style={{ marginTop: 12, fontWeight: 700, color: '#94A3B8', fontSize: 14, fontFamily: 'var(--font-outfit)', letterSpacing: '0.04em' }}>
                  {isSoloLearner ? 'UPLOAD MATERIAL' : 'ADD COURSE'}
                </div>
              </motion.div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS + STATS */}
        <aside className="dhd-right-col">
          
          <div className="dhd-quick-action" style={{ marginBottom: 32, padding: '32px', borderRadius: '24px' }}>
            <h2 style={{ fontSize: 12, fontWeight: 700, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', fontFamily: 'var(--font-outfit)' }}>QUICK SESSION</h2>
            
            <button className="dhd-action-btn" onClick={() => navigate('/dashboard/matches')} style={{ background: '#FFF1F2', borderColor: '#FFE4E6', padding: '16px', borderRadius: '16px' }}>
              <Target size={22} weight="bold" color="#EF4444" />
              <span style={{ color: '#E11D48', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>MOCK EXAM SESSION</span>
              <CaretRight size={16} weight="bold" style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </button>

            <button className="dhd-action-btn" onClick={() => navigate('/dashboard/workstation')} style={{ marginTop: 12, background: '#F3E8FF', borderColor: '#E9D5FF', padding: '16px', borderRadius: '16px' }}>
              <Zap size={22} weight="fill" color="#7C3AED" />
              <span style={{ color: '#6D28D9', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>FULL WORKSTATION</span>
              <CaretRight size={16} weight="bold" style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </button>

            <button className="dhd-action-btn" onClick={() => navigate('/dashboard/playground')} style={{ marginTop: 12, background: '#ECFDF5', borderColor: '#D1FAE5', padding: '16px', borderRadius: '16px' }}>
              <GameController size={22} weight="bold" color="#10B981" />
              <span style={{ color: '#059669', fontWeight: 700, fontFamily: 'var(--font-outfit)' }}>ARENA PRACTICE</span>
              <CaretRight size={16} weight="bold" style={{ marginLeft: 'auto', opacity: 0.5 }} />
            </button>
          </div>

          <div className="dhd-quick-action" style={{ background: '#1A102D', color: 'white', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '24px', padding: '32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h2 style={{ fontSize: 12, fontWeight: 900, opacity: 0.6, margin:0, letterSpacing: '0.1em', color: 'white', fontFamily: 'var(--font-outfit)' }}>WEEKLY PULSE</h2>
              <Trophy size={22} weight="bold" color="#FBBF24" />
            </div>
            
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-0.03em', fontFamily: 'var(--font-outfit)' }}>{xp.toLocaleString()}</div>
              <div style={{ fontSize: 13, opacity: 0.6, fontWeight: 700, fontFamily: 'var(--font-varela)' }}>ACTIVE SCHOLAR XP</div>
            </div>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize: 12, fontWeight: 900, marginBottom: 12, fontFamily: 'var(--font-outfit)' }}>
                <span style={{ color: 'white' }}>LEVEL 4 MASTERY</span>
                <span style={{ color: '#FBBF24' }}>75%</span>
              </div>
              <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '75%' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #FBBF24, #F59E0B)', borderRadius: 6 }} 
                />
              </div>
            </div>
          </div>

        </aside>
      </div>

    </div>
  )
}
