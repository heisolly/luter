import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Basic', trial: 'Free forever',
    priceMonthly: 0, priceSemester: 0,
    isPopular: false,
    bg: 'white', color: '#111', border: '#111', shadow: '6px 6px 0px #111',
    buttonStyle: { background: 'white', color: '#111', border: '2.5px solid #111' },
    buttonText: 'Current Plan',
    features: ['5 uploads per month', 'AI Notes (Basic)', 'AI Summary', 'Flashcard generation', 'Community support']
  },
  {
    name: 'Luter Pro', trial: 'Most popular for students',
    priceMonthly: 4000, priceSemester: 9000,
    isPopular: true,
    bg: 'var(--primary)', color: 'white', border: '#111', shadow: '8px 8px 0px #111',
    buttonStyle: { background: 'white', color: 'var(--primary)', border: '2.5px solid #111' },
    buttonText: 'Upgrade to Pro',
    features: ['Unlimited uploads', 'Advanced AI Notes', 'AI Summary + Quizzes', 'Spaced-rep Flashcards', 'AI Math Expert', 'Live Lecture Recording', 'Priority support']
  },
  {
    name: 'Academic Premium', trial: 'For power users',
    priceMonthly: 7000, priceSemester: 16000,
    isPopular: false,
    bg: '#111', color: 'white', border: '#111', shadow: '6px 6px 0px var(--primary)',
    buttonStyle: { background: 'var(--primary)', color: 'white', border: '2.5px solid #111' },
    buttonText: 'Get Premium',
    features: ['Everything in Pro', 'Analyze Images with AI', 'Multi-file Sessions', 'Team collaboration', 'Dedicated support', 'Early feature access']
  }
]

export default function UpgradePage({ isMobile }) {
  const [isSemester, setIsSemester] = useState(true)

  return (
    <div className="dh-root" style={{ 
      overflowY: 'auto',
      background: '#ffffff',
      paddingBottom: isMobile ? 100 : 80 
    }}>
      
      {/* ── Topbar ── */}
      <div style={{ 
        padding: isMobile ? '24px 20px 16px' : '40px 48px',
        background: '#fff',
        borderBottom: '2.5px solid #111'
      }}>
        <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 1000, margin: 0, color: '#111', letterSpacing: '-0.04em' }}>
          {isMobile ? 'Scholar Plans' : 'Upgrade Station'}
        </h1>
        <p style={{ fontSize: isMobile ? 12 : 14, color: '#666', fontWeight: 700, margin: '4px 0 0' }}>
          Choose your academic level of support.
        </p>
      </div>

      <div style={{ 
        padding: isMobile ? '32px 16px' : '60px 40px', 
        maxWidth: 1000, 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* Toggle */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
          <div style={{ 
            display: 'inline-flex', background: '#f5f5f5', 
            border: '2.5px solid #111', borderRadius: 20, 
            padding: 6, gap: 6, 
            boxShadow: '4px 4px 0px #111',
            width: isMobile ? '100%' : 'auto'
          }}>
            <button 
              onClick={() => setIsSemester(false)} 
              style={{ 
                flex: isMobile ? 1 : 'initial',
                padding: isMobile ? '14px 0' : '10px 32px', 
                borderRadius: 16, 
                background: !isSemester ? '#111' : 'transparent', 
                color: !isSemester ? 'white' : '#111', 
                fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.2s' 
              }}
            >
              MONTHLY
            </button>
            <button 
              onClick={() => setIsSemester(true)} 
              style={{ 
                flex: isMobile ? 1.4 : 'initial',
                padding: isMobile ? '14px 0' : '10px 32px', 
                borderRadius: 16, 
                background: isSemester ? '#111' : 'transparent', 
                color: isSemester ? 'white' : '#111', 
                fontWeight: 900, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.2s', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 
              }}
            >
              SEMESTER
              <span style={{ 
                fontSize: 9, 
                background: isSemester ? 'var(--primary)' : '#fff', 
                color: isSemester ? 'white' : 'var(--primary)', 
                padding: '2px 8px', borderRadius: 6, fontWeight: 1000, border: '1.5px solid #111'
              }}>-30%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: 32, 
          alignItems: 'center'
        }}>
          {plans.map((plan, idx) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              style={{
                background: plan.bg, 
                color: plan.color,
                borderRadius: 32, 
                padding: isMobile ? '32px 24px' : '48px',
                border: '2.5px solid #111',
                boxShadow: plan.shadow,
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%',
                maxWidth: 800,
                boxSizing: 'border-box'
              }}
            >
              {plan.isPopular && (
                <div style={{ 
                  position: 'absolute', top: -18, left: 32, 
                  display: 'inline-flex', alignItems: 'center', gap: 6, 
                  background: '#111', color: 'white', padding: '8px 20px', 
                  borderRadius: 12, fontSize: 10, fontWeight: 1000, 
                  border: '2.5px solid #fff', boxShadow: '4px 4px 0px var(--primary)',
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  <Sparkles size={12} fill="white" /> Best Choice
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: 24,
                marginBottom: 32
              }}>
                <div>
                  <h3 style={{ fontSize: isMobile ? 24 : 32, fontWeight: 1000, margin: 0, letterSpacing: '-0.04em' }}>{plan.name}</h3>
                  <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, margin: '6px 0 0' }}>{plan.trial}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontSize: isMobile ? 38 : 56, fontWeight: 1000, lineHeight: 1, letterSpacing: '-0.06em' }}>
                    {plan.priceMonthly === 0 ? 'Free' : `₦${(isSemester ? plan.priceSemester : plan.priceMonthly).toLocaleString()}`}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.7, marginBottom: isMobile ? 4 : 8 }}>
                      /{isSemester ? 'sem' : 'mo'}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 24,
                marginBottom: 40
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {plan.features.slice(0, Math.ceil(plan.features.length / 2)).map(f => (
                    <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ 
                        width: 24, height: 24, borderRadius: 8, 
                        background: plan.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        border: '1.5px solid #111'
                      }}>
                        <Check size={14} color={plan.color} strokeWidth={4} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {plan.features.slice(Math.ceil(plan.features.length / 2)).map(f => (
                    <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ 
                        width: 24, height: 24, borderRadius: 8, 
                        background: plan.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        border: '1.5px solid #111'
                      }}>
                        <Check size={14} color={plan.color} strokeWidth={4} />
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button style={{ 
                width: '100%', padding: '20px', borderRadius: 20, 
                fontSize: 15, fontWeight: 1000, cursor: 'pointer',
                ...plan.buttonStyle, transition: 'all 0.15s',
                boxShadow: plan.isPopular ? 'none' : '4px 4px 0px #111',
                textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                {plan.buttonText}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
