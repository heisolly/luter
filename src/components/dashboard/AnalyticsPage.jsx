import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { BarChart3, TrendingUp, TrendingDown, Target, Zap, Clock, BookOpen, Loader2, Award, History, ChevronRight, FlaskConical, AlertTriangle } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { motion } from 'framer-motion'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

export default function AnalyticsPage() {
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  const navigate = useNavigate()
  
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    if (!ready) return

    const apply = (ucData, stData, sessionData) => {
      if (ucData) {
        setCourses(ucData.filter(row => row && row.course).map((row, i) => ({
          code: row.course?.code || 'N/A',
          name: row.course?.name || 'Unknown',
          progress: row.progress || 0,
          target: row.target_score,
          color: PALETTE[i % PALETTE.length]
        })))
      }
      if (stData) setStats(stData)
      if (sessionData) setSessions(sessionData)
      setLoading(false)
    }

    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        // If prefetch bundle exists, use it first to reduce flicker
        if (bundle?.uc && !bundle.uc.error && Array.isArray(bundle.uc.data)) {
          const ucData = bundle.uc.data.filter(r => r).map((row) => ({
            course: row.courses || row.course,
            progress: row.progress,
            target_score: row.target_score,
          }))
          const stData = bundle.stats?.data || null
          
          // Still need to fetch sessions as they are not in the bundle
          const { data: sessionData } = await supabase
            .from('exam_sessions')
            .select('id, course_code, course_name, score, total_questions, accuracy, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          apply(ucData, stData, sessionData)
          return
        }

        const { data: ucData } = await supabase
          .from('user_courses')
          .select('progress, target_score, course:courses(name, code)')
          .eq('user_id', user.id)

        const { data: stData } = await supabase
          .from('user_stats')
          .select('total_xp, streak_days, lives')
          .eq('user_id', user.id)
          .maybeSingle()

        const { data: sessionData } = await supabase
          .from('exam_sessions')
          .select('id, course_code, course_name, score, total_questions, accuracy, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        apply(ucData, stData, sessionData)
      } catch (err) {
        console.error('Error fetching analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, ready])

  if (loading && !ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <Loader2 className="animate-spin" size={32} color="#7a12cc" />
      </div>
    )
  }

  const hasData = courses.length > 0
  const avgProgress = hasData ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0
  const strongest = hasData ? courses.reduce((a, b) => a.progress > b.progress ? a : b) : null
  const weakest = hasData ? courses.reduce((a, b) => a.progress < b.progress ? a : b) : null
  const totalXP = stats?.total_xp || 0
  const studyDays = stats?.streak_days || 0

  // Derived Session Stats
  const totalExams = sessions.length
  const avgAccuracy = totalExams > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / totalExams) : 0
  const bestSession = totalExams > 0 ? sessions.reduce((a, b) => (a.accuracy || 0) > (b.accuracy || 0) ? a : b) : null
  
  // Calculate Weakness Breakdown by course
  const coursePerformance = sessions.reduce((acc, s) => {
    if (!acc[s.course_code]) acc[s.course_code] = { sum: 0, count: 0, name: s.course_name }
    acc[s.course_code].sum += (s.accuracy || 0)
    acc[s.course_code].count += 1
    return acc
  }, {})

  const sortedPerformance = Object.entries(coursePerformance)
    .map(([code, data]) => ({ code, name: data.name, avg: Math.round(data.sum / data.count) }))
    .sort((a, b) => a.avg - b.avg)

  const criticalLacking = sortedPerformance[0]

  return (
    <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', 'Varela Round', sans-serif" }}>
      <div className="dh-topbar" style={{ background: isMobile ? 'transparent' : '#fff', borderBottom: isMobile ? 'none' : '1px solid #eee', padding: isMobile ? '20px 20px 0' : '20px 40px' }}>
        <div className="dh-topbar-left">
          <h1 className="dh-page-title" style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, textTransform: 'lowercase' }}>Analytics Engine</h1>
          <p className="dh-page-sub" style={{ fontSize: isMobile ? 12 : 14, opacity: 0.6, fontWeight: 500, textTransform: 'lowercase' }}>Track your academic trajectory and AI metrics</p>
        </div>
      </div>

      <div style={{ padding: isMobile ? '20px' : '40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        
        {/* Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: isMobile ? 12 : 20, marginBottom: isMobile ? 24 : 40 }}>
          <StatCard 
            title="total xp" 
            value={`${totalXP.toLocaleString()}`} 
            subtitle="Current Rank: Luteran" 
            icon={Zap} color="#7a12cc" delay={0.1} isMobile={isMobile}
          />
          <StatCard 
            title="avg accuracy" 
            value={`${avgAccuracy}%`} 
            subtitle={totalExams > 0 ? `Across ${totalExams} sessions` : 'No sessions yet'} 
            icon={Award} color="#10b981" delay={0.2} isMobile={isMobile}
          />
          <StatCard 
            title="coverage" 
            value={`${avgProgress}%`} 
            subtitle="Average course completion" 
            icon={BarChart3} color="#b04dfc" delay={0.3} isMobile={isMobile}
          />
          <StatCard 
            title="streak" 
            value={`${studyDays} days`} 
            subtitle="Study consistency" 
            icon={Target} color="#ef4444" delay={0.4} isMobile={isMobile}
          />
        </div>

        {/* Analytics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 24, paddingBottom: 60 }}>
          
          {/* Main Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Course Progress Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              style={{ background: 'white', padding: isMobile ? '24px 20px' : '32px', borderRadius: 24, border: '1.5px solid #e2e8f0', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FlaskConical size={20} color="#7a12cc" />
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, textTransform: 'lowercase' }}>Course Coverage</h3>
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, background: '#f8fafc', padding: '4px 12px', borderRadius: 99, color: '#64748b', border: '1px solid #e2e8f0', textTransform: 'uppercase' }}>LIVE FEED</div>
              </div>

              {!hasData ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <Clock size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'lowercase' }}>enroll in courses to start tracking coverage.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[...courses].sort((a,b) => b.progress - a.progress).map((c, i) => (
                    <div key={c.code || i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 60, fontSize: 12, fontWeight: 900, color: '#111' }}>{c.code}</div>
                      <div style={{ flex: 1, position: 'relative' }}>
                        <div style={{ height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <motion.div 
                            initial={{ width: 0 }} animate={{ width: `${c.progress}%` }} 
                            transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                            style={{ background: c.color, height: '100%', borderRadius: 99 }} 
                          />
                        </div>
                      </div>
                      <div style={{ width: 36, textAlign: 'right', fontSize: 12, fontWeight: 900, color: '#111' }}>{c.progress}%</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Recent Sessions History */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              style={{ background: 'white', padding: isMobile ? '24px 20px' : '32px', borderRadius: 24, border: '1.5px solid #e2e8f0', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <History size={20} color="#7a12cc" />
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, textTransform: 'lowercase' }}>Recent Sessions</h3>
                </div>
                {sessions.length > 5 && (
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#7a12cc', cursor: 'pointer', opacity: 0.8 }} onClick={() => alert('Full session history coming soon!')}>view all</div>
                )}
              </div>

              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <Clock size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'lowercase' }}>take your first mock exam to build history.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sessions.slice(0, 5).map((session) => (
                    <motion.div 
                      key={session.id}
                      whileHover={{ x: 4, background: '#f8fafc' }}
                      onClick={() => navigate(`/exam-session/${session.id}`)}
                      style={{ 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                        padding: '16px 20px', borderRadius: 16, background: '#fff', 
                        border: '1.5px solid #e2e8f0', cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: session.accuracy >= 50 ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: session.accuracy >= 50 ? '#10b981' : '#ef4444' }}>
                          <Award size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#111', textTransform: 'lowercase' }}>{session.course_code} Session</div>
                          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{new Date(session.created_at).toLocaleDateString()} • {session.accuracy}% accuracy</div>
                        </div>
                      </div>
                      <ChevronRight size={18} color="#94a3b8" />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Lacking / Weakness Analysis */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
              style={{ background: '#fef2f2', padding: 24, borderRadius: 24, border: '1.5px solid #fee2e2', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <AlertTriangle size={20} color="#ef4444" />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#991b1b', margin: 0, textTransform: 'lowercase' }}>Critical Weakness</h3>
              </div>
              
              {criticalLacking ? (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111', marginBottom: 4, textTransform: 'lowercase' }}>{criticalLacking.code}</div>
                  <div style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600, marginBottom: 16, textTransform: 'lowercase' }}>average accuracy: {criticalLacking.avg}%</div>
                  <p style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.6, fontWeight: 600, margin: 0 }}>
                    Your performance in {criticalLacking.name} is currently your primary bottleneck. We recommend focused sessions on this course.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#b91c1c', fontWeight: 600, margin: 0 }}>
                  Take more exams to allow Luter to pinpoint your academic bottlenecks.
                </p>
              )}
            </motion.div>

            {/* Performance Peaks */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
              style={{ background: '#f0fdf4', padding: 24, borderRadius: 24, border: '1.5px solid #dcfce7', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingUp size={20} color="#10b981" />
                <h3 style={{ fontSize: 15, fontWeight: 900, color: '#166534', margin: 0, textTransform: 'lowercase' }}>Strongest Point</h3>
              </div>
              
              {strongest ? (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#111', marginBottom: 4, textTransform: 'lowercase' }}>{strongest.code}</div>
                  <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginBottom: 16, textTransform: 'lowercase' }}>coverage: {strongest.progress}%</div>
                  <p style={{ fontSize: 12, color: '#14532d', lineHeight: 1.6, fontWeight: 600, margin: 0 }}>
                    You're excelling in {strongest.name}. Keep maintaining this momentum!
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: '#166534', fontWeight: 600, margin: 0 }}>
                  Course data will appear here once you begin your journey.
                </p>
              )}
            </motion.div>

            {/* Luter Insight (AI) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.9 }}
              style={{ background: '#7a12cc', padding: 24, borderRadius: 24, color: 'white', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px -10px rgba(122,18,204,0.4)' }}
            >
              <Zap size={24} color="white" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 8px', textTransform: 'lowercase' }}>Luter Insight</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                {totalExams > 0 
                  ? `Based on your ${totalExams} sessions, you're most likely to pass exams with MCQ focus. Your speed is improving!`
                  : "Complete a mock exam to unlock AI-driven performance insights and passing probability."}
              </p>
            </motion.div>

          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color, delay, isMobile }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ 
        background: 'white', 
        padding: isMobile ? '16px' : '24px', 
        borderRadius: 20, 
        border: '1.5px solid #e2e8f0', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 12, background: 'white', border: '1px solid #e2e8f0', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 900, color: '#111', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#64748b', marginBottom: 2, textTransform: 'lowercase' }}>{title}</div>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'lowercase' }}>{subtitle}</div>
    </motion.div>
  )
}

