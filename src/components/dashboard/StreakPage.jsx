import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Star, Calendar, Zap, ChevronRight, Award, ShieldCheck } from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function StreakPage({ user, isMobile }) {
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
    <div className="dh-root" style={{ 
      padding: isMobile ? '12px 16px 80px' : '40px', 
      maxWidth: 1000, 
      margin: '0 auto', 
      fontFamily: 'inherit',
    }}>
      
      {/* ── Topbar / Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isMobile ? 24 : 32 }}>
        <div style={{ 
          background: 'var(--primary-bg)', 
          padding: isMobile ? '8px' : '10px', 
          borderRadius: 14, 
          border: '1.5px solid var(--primary)' 
        }}>
          <Flame size={isMobile ? 18 : 24} color="var(--primary)" strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 1000, color: '#111', margin: 0, letterSpacing: '-0.02em' }}>Study Streak</h1>
          <p style={{ fontSize: isMobile ? 12 : 14, color: '#7a12cc99', margin: 0, fontWeight: 600 }}>Consistent students learn 3x faster.</p>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', 
        gap: isMobile ? 16 : 32 
      }}>
        
        {/* Left Column: The Streak Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
          
          <div style={{ 
            background: 'white', 
            borderRadius: isMobile ? 24 : 32, 
            padding: isMobile ? '32px 20px' : '48px 32px', 
            border: isMobile ? '1.5px solid #111' : '2px solid #111', 
            textAlign: 'center', 
            boxShadow: isMobile ? '4px 4px 0px #111' : '10px 10px 0px rgba(122, 18, 204, 0.04)' 
          }}>
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ display: 'inline-block', marginBottom: isMobile ? 16 : 24 }}
            >
              <div style={{ 
                width: isMobile ? 80 : 120, height: isMobile ? 80 : 120, 
                borderRadius: '50%', background: streak > 0 ? 'var(--primary-bg)' : '#f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                border: `3px solid ${streak > 0 ? 'var(--primary)' : '#e2e8f0'}`,
              }}>
                <Flame size={isMobile ? 40 : 64} fill={streak > 0 ? 'var(--primary)' : '#cbd5e1'} color={streak > 0 ? 'var(--primary)' : '#cbd5e1'} />
              </div>
            </motion.div>

            <h2 style={{ fontSize: isMobile ? 32 : 48, fontWeight: 1000, color: '#111', margin: '0 0 4px', letterSpacing: '-0.04em', lineHeight: 1 }}>
              {streak} Day Streak
            </h2>
            <p style={{ fontSize: isMobile ? 13 : 16, color: 'var(--primary)', fontWeight: 800, maxWidth: 320, margin: '0 auto 28px' }}>
              {streak === 0 ? "Unlock your potential today!" : "Absolute legend. Lock in."}
            </p>

            {/* Weekly Tracker */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', gap: isMobile ? 4 : 8, 
              background: '#fafafa', padding: isMobile ? '12px 10px' : '24px', 
              borderRadius: 16, border: isMobile ? '1.2px solid #111' : '1.5px solid #111' 
            }}>
              {DAYS.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: i === today ? 'var(--primary)' : '#cbd5e1', textTransform: 'uppercase' }}>{day[0]}</span>
                  <div style={{ 
                    width: isMobile ? 28 : 40, height: isMobile ? 28 : 40, borderRadius: '50%', 
                    background: i < today ? 'var(--primary-bg)' : 'white',
                    border: `1.5px solid ${i === today ? 'var(--primary)' : (i < today ? 'var(--primary)' : '#eee')}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {i < today ? <Zap size={isMobile ? 12 : 18} color="var(--primary)" fill="var(--primary)" /> : i === today && streak > 0 ? <Flame size={isMobile ? 12 : 18} fill="var(--primary)" color="var(--primary)" /> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ 
            background: 'var(--primary-bg)', 
            borderRadius: 20, padding: isMobile ? '14px 16px' : '20px', 
            border: isMobile ? '1.5px solid #111' : '2px solid #111', 
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: isMobile ? '3px 3px 0px #111' : 'none'
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 900, color: '#111', margin: 0 }}>Streak Freeze Armed</h3>
              <p style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 700, margin: 0 }}>Secured for the next 48h.</p>
            </div>
          </div>

        </div>

        {/* Column 2: Stats & Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 24 }}>
          
          <div style={{ 
            background: 'white', 
            borderRadius: 24, padding: isMobile ? '20px' : '32px', 
            border: isMobile ? '1.5px solid #111' : '2px solid #111',
            boxShadow: isMobile ? '4px 4px 0px #111' : 'none'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 1000, margin: '0 0 16px', color: '#111', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} color="var(--primary)" /> Advantage
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa', padding: '10px', borderRadius: 12, border: '1px solid #eee' }}>
                <Star size={14} color="var(--primary)" fill="var(--primary)" />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>Unlock exclusive badges</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa', padding: '10px', borderRadius: 12, border: '1px solid #eee' }}>
                <Zap size={14} color="var(--primary)" fill="var(--primary)" />
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--primary)' }}>Earn 1.5x XP multipliers</span>
              </div>
            </div>
          </div>

          <div style={{ 
            background: '#f8fafc', 
            borderRadius: 24, padding: isMobile ? '20px' : '32px', 
            border: '1.5px solid #eee' 
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 1000, color: '#111', margin: '0 0 12px' }}>Lock In Guides</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { t: "Study smarter with AI", d: "5 min" },
                { t: "Beat the curve", d: "8 min" },
                { t: "Exam hacks", d: "4 min" }
              ].map((tip, i) => (
                <button key={i} style={{ 
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px', borderRadius: 14, 
                  background: 'white', border: '1.5px solid #eee', width: '100%', textAlign: 'left', cursor: 'pointer',
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <Calendar size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#111' }}>{tip.t}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700 }}>{tip.d}</div>
                  </div>
                  <ChevronRight size={14} color="#cbd5e1" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
