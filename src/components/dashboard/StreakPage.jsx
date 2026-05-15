import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { RiArrowLeftSLine as ChevronLeft, RiArrowRightSLine as ChevronRight } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import useTourStore from '../../store/useTourStore'

export default function StreakPage() {
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user) return
    if (!ready) return
    if (bundle?.stats?.data && !bundle.stats.error) {
      setStreak(bundle.stats.data.streak_days || 0)
      return
    }
    const getStreak = async () => {
      const { data } = await supabase.from('user_stats').select('streak_days').eq('user_id', user.id).maybeSingle()
      if (data) setStreak(data.streak_days || 0)
    }
    getStreak()
  }, [user, ready, bundle])

  const { startTour, hasCompletedTour, isLoadingTours } = useTourStore()

  useEffect(() => {
    if (user?.id && ready && !isLoadingTours && !hasCompletedTour('streak')) {
      const timer = setTimeout(() => startTour('streak'), 2000)
      return () => clearTimeout(timer)
    }
  }, [user?.id, ready, isLoadingTours])

  const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
  
  // Real stats could be fetched here, using hardcoded for demo layout
  const daysStudied = 2
  const questionsAnswered = 25
  const currentMonth = "march 2026"
  
  // Create a grid for March 2026 starting on a Sunday
  const calendarDays = [
    { day: null }, { day: null }, { day: null }, { day: null }, { day: null }, { day: null }, { day: 1 },
    { day: 2 }, { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }, { day: 8 },
    { day: 9 }, { day: 10 }, { day: 11 }, { day: 12 }, { day: 13 }, { day: 14 }, { day: 15 },
    { day: 16 }, { day: 17 }, { day: 18 }, { day: 19 }, { day: 20 }, { day: 21 }, { day: 22 },
    { day: 23 }, { day: 24 }, { day: 25 }, { day: 26 }, { day: 27 }, { day: 28 }, { day: 29, active: true },
    { day: 30 }, { day: 31 }
  ]

  return (
    <div className="dh-root" style={{ 
      padding: isMobile ? '24px 16px 80px' : '48px 40px', 
      maxWidth: 760, 
      margin: '0 auto', 
      fontFamily: "'Varela Round', 'Inter', sans-serif",
      boxSizing: 'border-box',
      color: '#333'
    }}>
      
      {/* Top Section */}
      <div id="tour-streak-reward" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 40, padding: '0 8px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 64 : 80, fontWeight: 800, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>{streak || 1}</h1>
          <p style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: 'var(--primary)', margin: '4px 0 0' }}>day streak</p>
        </div>
        <div style={{ fontSize: isMobile ? 80 : 120, lineHeight: 1 }}>
          <span role="img" aria-label="campfire">🏕️</span>
        </div>
      </div>

      {/* Month Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '0 8px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{currentMonth}</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft color="#666" size={24} strokeWidth={2.5} /></button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight color="#666" size={24} strokeWidth={2.5} /></button>
        </div>
      </div>

      {/* Stats Cards container changed from grid to div to fix grid layout issue when there are separate parents */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 32 }}>
        <div style={{ 
          background: 'white', borderRadius: 20, padding: isMobile ? '20px' : '28px', 
          border: '2px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, marginBottom: 8, color: '#111' }}>{daysStudied}</div>
          <div style={{ fontSize: 15, color: '#64748b' }}>days studied</div>
        </div>
        <div style={{ 
          background: 'white', borderRadius: 20, padding: isMobile ? '20px' : '28px', 
          border: '2px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, marginBottom: 8, color: '#111' }}>{questionsAnswered}</div>
          <div style={{ fontSize: 15, color: '#64748b' }}>questions answered</div>
        </div>
      </div>

      {/* Streak Calendar */}
      <div id="tour-streak-calendar" style={{ 
        background: 'white', borderRadius: 20, padding: isMobile ? '24px 16px' : '32px 40px', 
        border: '2px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', marginBottom: 32
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 28px 0', color: '#111' }}>streak calendar</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px 8px', textAlign: 'center' }}>
          {DAYS.map(d => (
            <div key={d} style={{ fontSize: 15, color: '#64748b', fontWeight: 600, marginBottom: 12 }}>{d}</div>
          ))}
          {calendarDays.map((item, i) => (
            <div key={i} style={{ 
              height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: item.day ? 700 : 400, color: item.day ? (item.active ? 'var(--primary)' : '#334155') : 'transparent',
              background: item.active ? 'rgba(151,24,251,0.1)' : 'transparent',
              borderRadius: item.active ? 12 : 0,
            }}>
              {item.day || ''}
            </div>
          ))}
        </div>
      </div>

      {/* Graph Area */}
      <div style={{ 
        background: 'white', borderRadius: 20, padding: isMobile ? '24px 16px' : '32px 40px', 
        border: '2px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 40px 0', color: '#111' }}>weekly number of questions answered</h3>
        
        <div style={{ position: 'relative', height: 180, display: 'flex', alignItems: 'flex-end', marginLeft: 24 }}>
          {/* Y Axis labels */}
          <div style={{ position: 'absolute', left: -24, top: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
            <span style={{ transform: 'translateY(-50%)' }}>24 -</span>
            <span style={{ transform: 'translateY(-50%)' }}>18 -</span>
            <span style={{ transform: 'translateY(50%)' }}>12 -</span>
          </div>

          {/* Grid lines */}
          <div style={{ position: 'absolute', left: 4, top: 0, right: 0, bottom: 0, borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}>
            <div style={{ borderTop: '1px dashed #f1f5f9', position: 'absolute', top: 0, width: '100%' }}></div>
            <div style={{ borderTop: '1px dashed #f1f5f9', position: 'absolute', top: '50%', width: '100%' }}></div>
            
            {/* Vertical grid lines */}
            <div style={{ position: 'absolute', left: '20%', height: '100%', borderLeft: '1px dashed #f1f5f9' }}></div>
            <div style={{ position: 'absolute', left: '40%', height: '100%', borderLeft: '1px dashed #f1f5f9' }}></div>
            <div style={{ position: 'absolute', left: '60%', height: '100%', borderLeft: '1px dashed #f1f5f9' }}></div>
            <div style={{ position: 'absolute', left: '80%', height: '100%', borderLeft: '1px dashed #f1f5f9' }}></div>
          </div>

          {/* SVG Line Graph */}
          <svg style={{ position: 'absolute', left: 4, top: 0, width: 'calc(100% - 4px)', height: '100%', overflow: 'visible' }} preserveAspectRatio="none">
             {/* The green line peaking at 60% */}
             <path d="M 0 180 Q 40% 180, 50% 90 T 60% 0 T 70% 90 T 80% 180 T 100% 180" fill="none" stroke="var(--primary)" strokeWidth="4" strokeLinecap="round" />
             {/* Dot at the peak */}
             <circle cx="60%" cy="0" r="7" fill="var(--primary)" />
          </svg>
        </div>
      </div>

    </div>
  )
}
