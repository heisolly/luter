import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, Star, Calendar, Zap, ChevronRight, Award, ShieldCheck, Target, Sparkles } from 'lucide-react'
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
      padding: isMobile ? '12px 12px 80px' : '40px', 
      maxWidth: isMobile ? '100%' : 1100, 
      margin: '0 auto', 
      fontFamily: "'Outfit', 'Inter', sans-serif",
      boxSizing: 'border-box'
    }}>
      
      {/* ── Topbar / Header ── */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: isMobile ? 24 : 40 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary), #a855f7)', 
            padding: isMobile ? '8px' : '12px', 
            borderRadius: 16, 
            border: '2px solid #111',
            boxShadow: '3px 3px 0px #111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Flame size={isMobile ? 20 : 28} color="white" fill="white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 1000, color: '#111', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>Study Streak</h1>
            <p style={{ fontSize: isMobile ? 12 : 14, color: '#666', margin: '4px 0 0', fontWeight: 700 }}>Level up your focus daily.</p>
          </div>
        </div>

        {!isMobile && (
          <div style={{ 
            background: '#fff', 
            border: '2px solid #111', 
            padding: '8px 20px', 
            borderRadius: 16, 
            boxShadow: '4px 4px 0px #111',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
             <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: 10, fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Rank</div>
               <div style={{ fontSize: 14, fontWeight: 1000, color: 'var(--primary)' }}>Academic Titan</div>
             </div>
             <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--primary)' }}>
               <Award size={20} color="var(--primary)" />
             </div>
          </div>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.7fr 1fr', 
        gap: isMobile ? 16 : 32 
      }}>
        
        {/* Left Column: Hero Streak Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 32 }}>
          
          <div style={{ 
            background: 'white', 
            borderRadius: isMobile ? 24 : 40, 
            padding: isMobile ? '32px 20px' : '64px 40px', 
            border: '2.5px solid #111', 
            textAlign: 'center', 
            boxShadow: isMobile ? '4px 4px 0px #111' : '12px 12px 0px #111',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Background Accent */}
            <div style={{ 
              position: 'absolute', top: -100, right: -100, width: 300, height: 300, 
              background: 'radial-gradient(circle, var(--primary-bg) 0%, transparent 70%)', 
              opacity: 0.6, zIndex: 0 
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                style={{ display: 'inline-block', marginBottom: isMobile ? 20 : 32 }}
              >
                <div style={{ 
                  width: isMobile ? 100 : 160, height: isMobile ? 100 : 160, 
                  borderRadius: '35%', background: streak > 0 ? 'var(--primary)' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  border: '3px solid #111',
                  boxShadow: '6px 6px 0px #111',
                  transform: 'rotate(-3deg)'
                }}>
                  <Flame size={isMobile ? 50 : 80} fill="white" color="white" />
                </div>
              </motion.div>

              <h2 style={{ fontSize: isMobile ? 40 : 72, fontWeight: 1000, color: '#111', margin: '0 0 8px', letterSpacing: '-0.05em', lineHeight: 0.9 }}>
                {streak} Days
              </h2>
              <p style={{ fontSize: isMobile ? 14 : 20, color: 'var(--primary)', fontWeight: 900, marginBottom: isMobile ? 24 : 40 }}>
                {streak === 0 ? "START YOUR LEGACY TODAY" : "ELITE CONSISTENCY ACHIEVED"}
              </p>

              {/* Progress Bar */}
              <div style={{ maxWidth: 400, margin: '0 auto 40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#666' }}>
                  <span>Daily Goal</span>
                  <span>75%</span>
                </div>
                <div style={{ width: '100%', height: 16, background: '#f1f5f9', borderRadius: 8, border: '2px solid #111', overflow: 'hidden' }}>
                   <motion.div initial={{ width: 0 }} animate={{ width: '75%' }} style={{ height: '100%', background: 'linear-gradient(90deg, var(--primary), #a855f7)', borderRight: '2px solid #111' }} />
                </div>
              </div>

              {/* Weekly Tracker (Heatmap Style) */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 6 : 12, 
                background: '#fafafa', padding: isMobile ? '16px 12px' : '32px', 
                borderRadius: 20, border: '2px solid #111',
                boxShadow: isMobile ? 'inset 2px 2px 0px rgba(0,0,0,0.05)' : 'inset 4px 4px 0px rgba(0,0,0,0.05)'
              }}>
                {DAYS.map((day, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 1000, color: i === today ? 'var(--primary)' : '#999', textTransform: 'uppercase' }}>{day.slice(0, 3)}</span>
                    <div style={{ 
                      width: '100%', 
                      aspectRatio: '1/1',
                      borderRadius: isMobile ? 8 : 12, 
                      background: i < today ? 'var(--primary)' : 'white',
                      border: `2px solid #111`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: i < today ? 'none' : '2px 2px 0px #111',
                      transition: 'all 0.2s'
                    }}>
                      {i < today && <Zap size={isMobile ? 12 : 20} color="white" fill="white" />}
                      {i === today && streak > 0 && <Flame size={isMobile ? 12 : 20} fill="var(--primary)" color="var(--primary)" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 24 }}>
             <div style={{ 
               background: '#fff', padding: isMobile ? '20px' : '24px', borderRadius: 24, border: '2.5px solid #111',
               boxShadow: isMobile ? '4px 4px 0px #111' : '6px 6px 0px #111',
               display: 'flex', alignItems: 'center', gap: 16
             }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--primary)', flexShrink: 0 }}>
                 <ShieldCheck size={24} color="var(--primary)" />
               </div>
               <div>
                 <h3 style={{ fontSize: 13, fontWeight: 1000, margin: 0 }}>Streak Freeze</h3>
                 <p style={{ fontSize: 11, color: '#666', fontWeight: 600, margin: '2px 0 0' }}>48h Protection Active</p>
               </div>
             </div>

             <div style={{ 
               background: 'var(--primary)', padding: isMobile ? '20px' : '24px', borderRadius: 24, border: '2.5px solid #111',
               boxShadow: isMobile ? '4px 4px 0px #111' : '6px 6px 0px #111',
               display: 'flex', alignItems: 'center', gap: 16, color: 'white'
             }}>
               <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', flexShrink: 0 }}>
                 <Zap size={24} color="white" fill="white" />
               </div>
               <div>
                 <h3 style={{ fontSize: 13, fontWeight: 1000, margin: 0 }}>XP Multiplier</h3>
                 <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700, margin: '2px 0 0' }}>2.5x Reward Rate Active</p>
               </div>
             </div>
          </div>

        </div>

        {/* Right Column: Challenges & Social */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 32 }}>
          
          <div style={{ 
            background: '#fff', 
            borderRadius: 32, padding: isMobile ? '24px' : '32px', 
            border: '2.5px solid #111',
            boxShadow: isMobile ? '6px 6px 0px #111' : '8px 8px 0px #111'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 1000, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={18} color="var(--primary)" /> Seasonal Quests
              </h3>
              <div style={{ fontSize: 10, fontWeight: 1000, color: 'var(--primary)', background: 'var(--primary-bg)', padding: '4px 10px', borderRadius: 8, border: '1.5px solid var(--primary)' }}>LEVEL 14</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { t: "Study for 2 Hours", p: "100%", g: "+250 XP" },
                { t: "Solve 50 CBT Qs", p: "40%", g: "+500 XP" },
                { t: "Share with a peer", p: "0%", g: "+100 XP" }
              ].map((quest, i) => (
                <div key={i} style={{ 
                  padding: '16px', borderRadius: 16, 
                  background: '#f8fafc', border: '1.5px solid #111',
                  boxShadow: '2px 2px 0px #111'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 1000, color: '#111' }}>{quest.t}</div>
                    <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary)' }}>{quest.g}</div>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: quest.p, height: '100%', background: 'var(--primary)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)', 
            borderRadius: 32, padding: isMobile ? '24px' : '32px', 
            border: '2.5px solid #111',
            boxShadow: isMobile ? '6px 6px 0px #111' : '8px 8px 0px #111',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
             <Sparkles size={100} style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1, transform: 'rotate(15deg)' }} />
             <h3 style={{ fontSize: 15, fontWeight: 1000, margin: '0 0 12px', zIndex: 1, position: 'relative' }}>Power Up</h3>
             <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 20, zIndex: 1, position: 'relative' }}>
               Unlock the Pro Workstation to double your streak multipliers and get AI study support.
             </p>
             <button style={{ 
               width: '100%', padding: '16px', borderRadius: 16, background: 'var(--primary)', 
               border: '2px solid white', color: 'white', fontWeight: 1000, fontSize: 13, 
               cursor: 'pointer', zIndex: 1, position: 'relative', boxShadow: '4px 4px 0px white',
               transition: 'all 0.1s'
             }}>
               UPGRADE TO SCHOLAR+
             </button>
          </div>

        </div>

      </div>
    </div>
  )
}
