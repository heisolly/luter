import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Star, Calendar, Zap, ChevronRight, Award, ShieldCheck } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function StreakPage({ user }) {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user) return
    const getStreak = async () => {
      const { data } = await supabase.from('user_stats').select('streak_days').eq('user_id', user.id).maybeSingle()
      if (data) setStreak(data.streak_days || 0)
    }
    getStreak()
  }, [user])

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const today = new Date().getDay()

  return (
    <div style={{ padding: '40px', maxWidth: 1000, margin: '0 auto', fontFamily: 'inherit' }}>
      
      {/* ── Purple Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ background: '#f5eeff', padding: '10px', borderRadius: 16, border: '1px solid #e9d5ff' }}>
          <Flame size={24} color="#7a12cc" strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 1000, color: '#111', margin: 0, letterSpacing: '-0.03em' }}>Study Streak</h1>
          <p style={{ fontSize: 14, color: '#7a12cc99', margin: 0, fontWeight: 600 }}>Consistent students learn 3x faster with AI.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        
        {/* Left Column: The Streak Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ 
            background: 'white', borderRadius: 32, padding: '48px 32px', 
            border: '1.5px solid #7a12cc', textAlign: 'center', 
            boxShadow: '10px 10px 0px rgba(122, 18, 204, 0.04)' 
          }}>
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ display: 'inline-block', marginBottom: 24 }}
            >
              <div style={{ 
                width: 120, height: 120, borderRadius: '50%', background: streak > 0 ? '#f5eeff' : '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${streak > 0 ? '#7a12cc' : '#e2e8f0'}`,
              }}>
                <Flame size={64} fill={streak > 0 ? '#7a12cc' : '#cbd5e1'} color={streak > 0 ? '#7a12cc' : '#cbd5e1'} />
              </div>
            </motion.div>

            <h2 style={{ fontSize: 48, fontWeight: 1000, color: '#111', margin: '0 0 8px', letterSpacing: '-0.04em' }}>{streak} Day Streak</h2>
            <p style={{ fontSize: 16, color: '#7a12cc', fontWeight: 800, maxWidth: 320, margin: '0 auto 32px' }}>
              {streak === 0 ? "Unlock your potential by starting a session today!" : "Locking in every single day. Absolute legend."}
            </p>

            {/* Weekly Tracker */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, background: '#fdfbff', padding: '24px', borderRadius: 24, border: '1px solid #f5eeff' }}>
              {DAYS.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: i === today ? '#7a12cc' : '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</span>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: '50%', 
                    background: i < today ? '#f5eeff' : i === today ? 'white' : 'white',
                    border: `1.5px solid ${i === today ? '#7a12cc' : (i < today ? '#e9d5ff' : '#eee')}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {i < today ? <Zap size={18} color="#7a12cc" fill="#7a12cc" /> : i === today && streak > 0 ? <Flame size={18} fill="#7a12cc" color="#7a12cc" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#fdfbff', borderRadius: 24, padding: '24px', border: '1.5px solid #f5eeff', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#7a12cc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={28} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Streak Freeze Armed</h3>
              <p style={{ fontSize: 13, color: '#7a12cc', fontWeight: 600, margin: 0 }}>Progress is secured for the next 48 hours.</p>
            </div>
            <button style={{ padding: '10px 20px', borderRadius: 12, background: 'white', border: '1.5px solid #7a12cc', color: '#7a12cc', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
               Active
            </button>
          </div>

        </div>

        {/* Right Column: Why Streaks? & Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          <div style={{ background: 'white', borderRadius: 32, padding: '32px', border: '1.5px solid #7a12cc', boxShadow: '0 10px 40px rgba(122, 18, 204, 0.04)' }}>
            <div style={{ display: 'inline-flex', padding: '10px', background: '#f5eeff', borderRadius: 12, marginBottom: 20 }}>
               <Award size={24} color="#7a12cc" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 1000, margin: '0 0 12px', color: '#111' }}>Consistency Wins</h3>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, margin: '0 0 24px' }}>
              Research shows that studying for 15 minutes every day is 3x more effective than one 4-hour cramming session. Keep the flame alive!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fdfbff', padding: '12px 16px', borderRadius: 14, border: '1px solid #f5eeff' }}>
                <Star size={16} color="#7a12cc" fill="#7a12cc" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#7a12cc' }}>Unlock exclusive badges</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fdfbff', padding: '12px 16px', borderRadius: 14, border: '1px solid #f5eeff' }}>
                <Zap size={16} color="#7a12cc" fill="#7a12cc" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#7a12cc' }}>Earn 1.5x XP multipliers</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 32, padding: '32px', border: '1px solid #eee' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111', margin: '0 0 20px' }}>Lock In Guides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { t: "Study smarter with AI", d: "5 min read" },
                { t: "How to beat forgetting", d: "8 min read" },
                { t: "Exam energy hacks", d: "4 min read" }
              ].map((tip, i) => (
                <button key={i} style={{ 
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 20, 
                  background: 'white', border: '1px solid #f1f5f9', width: '100%', textAlign: 'left', cursor: 'pointer',
                  transition: 'all 0.1s'
                }}
                onMouseDown={e => e.currentTarget.style.borderColor = '#7a12cc'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#f1f5f9'}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f5eeff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}>
                    <Calendar size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{tip.t}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{tip.d}</div>
                  </div>
                  <ChevronRight size={18} color="#cbd5e1" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
