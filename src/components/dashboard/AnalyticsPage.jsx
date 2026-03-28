import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { BarChart3, TrendingUp, TrendingDown, Target, Zap, Clock, BookOpen, Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { motion } from 'framer-motion'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

export default function AnalyticsPage() {
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    if (!ready) return

    const apply = (ucData, stData) => {
      if (ucData) {
        setCourses(ucData.map((row, i) => ({
          code: row.course.code,
          name: row.course.name,
          progress: row.progress || 0,
          target: row.target_score,
          color: PALETTE[i % PALETTE.length]
        })))
      }
      if (stData) setStats(stData)
      setLoading(false)
    }

    const fetchAnalytics = async () => {
      const { data: ucData } = await supabase
        .from('user_courses')
        .select('progress, target_score, course:courses(name, code)')
        .eq('user_id', user.id)

      const { data: stData } = await supabase
        .from('user_stats')
        .select('total_xp, streak_days, lives')
        .eq('user_id', user.id)
        .maybeSingle()

      apply(ucData, stData)
    }

    if (bundle?.uc && !bundle.uc.error && Array.isArray(bundle.uc.data)) {
      const ucData = bundle.uc.data.map((row) => ({
        course: row.course,
        progress: row.progress,
        target_score: row.target_score,
      }))
      apply(ucData, bundle.stats?.data || null)
      return
    }
    fetchAnalytics()
  }, [user, ready, bundle])

  // if (loading) {
  //   return (
  //     <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
  //       <Loader2 className="spin-animate" size={28} color="#7a12cc" />
  //     </div>
  //   )
  // }

  const hasData = courses.length > 0
  const avgProgress = hasData ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0
  const strongest = hasData ? courses.reduce((a, b) => a.progress > b.progress ? a : b) : null
  const weakest = hasData ? courses.reduce((a, b) => a.progress < b.progress ? a : b) : null
  const totalXP = stats?.total_xp || 0
  const studyDays = stats?.streak_days || 0

  return (
    <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="dh-topbar" style={{ background: isMobile ? 'transparent' : '#fff', borderBottom: isMobile ? 'none' : '1px solid #eee', padding: isMobile ? '20px 20px 0' : '20px 40px' }}>
        <div className="dh-topbar-left">
          <h1 className="dh-page-title" style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800 }}>Analytics Engine</h1>
          <p className="dh-page-sub" style={{ fontSize: isMobile ? 12 : 14, opacity: 0.6 }}>Track your academic trajectory and AI metrics</p>
        </div>
      </div>

      <div style={{ padding: isMobile ? '20px' : '40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        
        {/* Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 12 : 20, marginBottom: isMobile ? 24 : 40 }}>
          <StatCard 
            title="Total XP" 
            value={`${totalXP.toLocaleString()}`} 
            subtitle="Rank: Freshman" 
            icon={Zap} color="#7a12cc" delay={0.1} isMobile={isMobile}
          />
          <StatCard 
            title="Streak" 
            value={`${studyDays} Days`} 
            subtitle="Current" 
            icon={Target} color="#9718fb" delay={0.2} isMobile={isMobile}
          />
          <StatCard 
            title="Coverage" 
            value={`${avgProgress}%`} 
            subtitle="Average" 
            icon={BarChart3} color="#b04dfc" delay={0.3} isMobile={isMobile}
          />
          <StatCard 
            title="Courses" 
            value={courses.length} 
            subtitle="Enrolled" 
            icon={BookOpen} color="#6d28d9" delay={0.4} isMobile={isMobile}
          />
        </div>

        {/* Detailed Chart Layout */}
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 24, paddingBottom: 100 }}>
          
          {/* Progress Bars */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ 
              flex: 2,
              background: 'white', 
              padding: isMobile ? '24px 20px' : '32px', 
              borderRadius: 24, 
              border: '1.5px solid #e5e7eb', 
              boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>Course Coverage</h3>
              <div style={{ fontSize: 11, fontWeight: 700, background: '#f5f5f5', padding: '4px 10px', borderRadius: 99, color: '#666' }}>
                LIVE
              </div>
            </div>

            {!hasData ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                <Clock size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 600 }}>Collect data points to unlock.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[...courses].sort((a,b) => b.progress - a.progress).map((c, i) => (
                  <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 60, fontSize: 12, fontWeight: 800, color: '#111' }}>{c.code}</div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <div style={{ height: 12, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${c.progress}%` }} 
                          transition={{ duration: 1, delay: 0.6 + i * 0.1 }}
                          style={{ background: c.color, height: '100%', borderRight: '1.5px solid var(--border)' }} 
                        />
                      </div>
                    </div>
                    <div style={{ width: 36, textAlign: 'right', fontSize: 12, fontWeight: 800, color: '#111' }}>{c.progress}%</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Strength / Weakness Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr', gap: 16 }}>
                <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                style={{ background: '#f0fdf4', padding: isMobile ? '16px' : '24px', borderRadius: 20, border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'white', border:'1px solid #e5e7eb', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingUp size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', margin: '0 0 2px' }}>Peak</p>
                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#111' }}>{strongest?.code || 'None'}</h4>
                </div>
                </motion.div>

                <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                style={{ background: '#fef2f2', padding: isMobile ? '16px' : '24px', borderRadius: 20, border: '1.5px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
                >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'white', border:'1px solid #e5e7eb', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <TrendingDown size={20} strokeWidth={2.5} />
                </div>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', margin: '0 0 2px' }}>Lag</p>
                    <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#111' }}>{weakest?.code || 'None'}</h4>
                </div>
                </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
              style={{ background: '#7a12cc', padding: 24, borderRadius: 24, color: 'white', border: '1.5px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px -10px rgba(122,18,204,0.4)' }}
            >
              <Target size={24} color="white" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>Luter Insight</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5, fontWeight: 600 }}>
                {hasData 
                  ? `Focus on ${weakest?.code}. Use the CBT simulator to bridge the 25% gap.`
                  : "Start a study session to unlock AI predictions."}
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
        border: '1.5px solid #e5e7eb', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'white', border: '1px solid #e5e7eb', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: isMobile ? 20 : 32, fontWeight: 800, color: '#111', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color: '#555', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>{subtitle}</div>
    </motion.div>
  )
}
