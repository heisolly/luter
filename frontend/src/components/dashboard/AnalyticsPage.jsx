import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Target, Zap, Clock, BookOpen, Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { motion } from 'framer-motion'

const PALETTE = ['#7a12cc','#9718fb','#b04dfc','#6d28d9','#7c3aed','#8b5cf6','#a78bfa','#6366f1']

export default function AnalyticsPage({ user }) {
  const [courses, setCourses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchAnalytics = async () => {
      // Fetch user's enrolled courses with progress
      const { data: ucData } = await supabase
        .from('user_courses')
        .select('progress, target_score, course:courses(name, code)')
        .eq('user_id', user.id)

      // Fetch global stats
      const { data: stData } = await supabase
        .from('user_stats')
        .select('total_xp, streak_days, lives')
        .eq('user_id', user.id)
        .maybeSingle()

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
    fetchAnalytics()
  }, [user])

  if (loading) {
    return (
      <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', minHeight:'50vh' }}>
        <Loader2 className="animate-spin" size={28} color="var(--primary)" />
      </div>
    )
  }

  // Derived Analytics
  const hasData = courses.length > 0
  const avgProgress = hasData ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0
  const strongest = hasData ? courses.reduce((a, b) => a.progress > b.progress ? a : b) : null
  const weakest = hasData ? courses.reduce((a, b) => a.progress < b.progress ? a : b) : null
  const totalXP = stats?.total_xp || 0
  const studyDays = stats?.streak_days || 0

  return (
    <div className="dh-root" style={{ background: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="dh-topbar" style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="dh-topbar-left">
          <h1 className="dh-page-title">Analytics Engine</h1>
          <p className="dh-page-sub">Track your academic trajectory and AI metrics</p>
        </div>
      </div>

      <div style={{ padding: '40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        
        {/* Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
          <StatCard 
            title="Total XP Gained" 
            value={`${totalXP.toLocaleString()} XP`} 
            subtitle="Current Rank: Freshman" 
            icon={Zap} color="#7a12cc" delay={0.1}
          />
          <StatCard 
            title="Current Streak" 
            value={`${studyDays} Days`} 
            subtitle={studyDays > 0 ? "You're on fire!" : "Start a session today"} 
            icon={Target} color="#9718fb" delay={0.2}
          />
          <StatCard 
            title="Average Coverage" 
            value={`${avgProgress}%`} 
            subtitle="Across all courses" 
            icon={BarChart3} color="#b04dfc" delay={0.3}
          />
          <StatCard 
            title="Active Courses" 
            value={courses.length} 
            subtitle="Enrolled this semester" 
            icon={BookOpen} color="#6d28d9" delay={0.4}
          />
        </div>

        {/* Detailed Chart Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, paddingBottom: 60 }}>
          
          {/* Progress Bars */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ background: 'white', padding: 32, borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: 0 }}>Course Coverage</h3>
              <div style={{ fontSize: 13, fontWeight: 700, background: '#f5f5f5', padding: '6px 12px', borderRadius: 99, color: '#666' }}>
                Sorted by Progress
              </div>
            </div>

            {!hasData ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
                <Clock size={32} style={{ opacity: 0.5, marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 500 }}>No courses to analyze yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {[...courses].sort((a,b) => b.progress - a.progress).map((c, i) => (
                  <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 80, fontSize: 13, fontWeight: 700, color: '#333' }}>{c.code}</div>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <div style={{ height: 10, background: '#f0f0f0', borderRadius: 99, overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${c.progress}%` }} 
                          transition={{ duration: 1, delay: 0.6 + i * 0.1, ease: 'easeOut' }}
                          style={{ background: c.color, height: '100%' }} 
                        />
                      </div>
                      {/* Target Indicator logic */}
                      {c.target && (
                        <div style={{ position: 'absolute', top: -4, bottom: -4, width: 2, background: '#111', left: `${c.target === 'A' ? 70 : c.target === 'B' ? 60 : 50}%`, opacity: 0.2 }} title={`Target: ${c.target}`} />
                      )}
                    </div>
                    <div style={{ width: 44, textAlign: 'right', fontSize: 13, fontWeight: 800, color: c.color }}>{c.progress}%</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Strength / Weakness Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
              style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.04)', display: 'flex', alignItems: 'center', gap: 20 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#d1fae5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Strongest Area</p>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111' }}>{strongest?.code || 'None'}</h4>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
              style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.04)', display: 'flex', alignItems: 'center', gap: 20 }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingDown strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Needs Attention</p>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#111' }}>{weakest?.code || 'None'}</h4>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
              style={{ background: 'linear-gradient(135deg, var(--primary), #b04dfc)', padding: 32, borderRadius: 24, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', flex: 1 }}
            >
              <Target size={28} color="rgba(255,255,255,0.8)" style={{ marginBottom: 16 }} />
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.3 }}>Luter Insight</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                {hasData 
                  ? `You are spending the most time on ${strongest?.code}. Consider generating a mock exam for ${weakest?.code} to balance your loadout.`
                  : "Start a session to unlock personalized AI deep-dive analytics and progress predictions."}
              </p>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon: Icon, color, delay }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#111', lineHeight: 1, marginBottom: 8, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>{subtitle}</div>
    </motion.div>
  )
}
