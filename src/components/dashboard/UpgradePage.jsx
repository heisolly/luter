import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Sparkles, Zap } from 'lucide-react'

const plans = [
  {
    name: 'Basic', trial: 'Free forever',
    priceMonthly: 0, priceSemester: 0,
    isPopular: false,
    bg: 'white', color: '#111', border: 'var(--border)',
    buttonStyle: { background: 'white', color: '#111', border: '1px solid var(--border)' },
    buttonText: 'Current Plan',
    features: ['5 uploads per month', 'AI Notes (Basic)', 'AI Summary', 'Flashcard generation', 'Community support']
  },
  {
    name: 'University Pro', trial: 'Most popular for students',
    priceMonthly: 4000, priceSemester: 9000,
    isPopular: true,
    bg: 'linear-gradient(160deg, #7a12cc, #b04dfc 60%, #7180FE)', color: 'white', border: 'transparent',
    buttonStyle: { background: 'white', color: 'var(--primary)', border: 'none' },
    buttonText: 'Upgrade to Pro',
    features: ['Unlimited uploads', 'Advanced AI Notes', 'AI Summary + Quizzes', 'Spaced-rep Flashcards', 'AI Math Expert', 'Live Lecture Recording', 'Priority support']
  },
  {
    name: 'Premium', trial: 'For power users',
    priceMonthly: 7000, priceSemester: 16000,
    isPopular: false,
    bg: 'white', color: '#111', border: 'var(--border)',
    buttonStyle: { background: 'linear-gradient(135deg, var(--primary), #b04dfc)', color: 'white', border: 'none' },
    buttonText: 'Get Premium',
    features: ['Everything in University Pro', 'Analyze Images with AI', 'Multi-file Sessions', 'Team collaboration', 'Dedicated support', 'Early feature access']
  }
]

export default function UpgradePage({ isMobile }) {
  const [isSemester, setIsSemester] = useState(true)

  return (
    <div className="dh-root" style={{ 
      overflowY: 'auto',
      background: '#fafafa',
      paddingBottom: isMobile ? 40 : 80 
    }}>
      
      {/* ── Topbar ── */}
      <div className="dh-topbar" style={{ 
        padding: isMobile ? '20px 20px 10px' : '28px 32px',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 8 : 20,
        background: '#fff',
        borderBottom: '1px solid var(--border)'
      }}>
        <div className="dh-topbar-left">
          <h1 className="dh-page-title" style={{ fontSize: isMobile ? 22 : 24 }}>Upgrade Plan</h1>
          <p className="dh-page-sub" style={{ fontSize: isMobile ? 12 : 13 }}>Level up your study speed with Luter Pro</p>
        </div>
      </div>

      <div style={{ 
        padding: isMobile ? '24px 16px' : '40px', 
        maxWidth: 1100, 
        margin: '0 auto', 
        width: '100%' 
      }}>
        
        {/* Header content */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 50 }}>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 6, 
              fontSize: isMobile ? 10 : 11, fontWeight: 800, 
              color: 'var(--primary)', letterSpacing: '0.12em', 
              textTransform: 'uppercase', marginBottom: 16, 
              background: 'rgba(122, 18, 204, 0.08)', 
              padding: '6px 14px', borderRadius: 99, 
              border: '1.5px solid rgba(122, 18, 204, 0.15)' 
            }}
          >
            <Zap size={12} fill="currentColor" /> Turbocharge your grades
          </motion.div>
          
          <h2 style={{ 
            fontSize: isMobile ? 28 : 'clamp(2rem, 4vw, 2.6rem)', 
            fontWeight: 1000, color: '#111', 
            margin: '0 0 16px', letterSpacing: '-0.04em', 
            lineHeight: 1.1 
          }}>
            Unlock Your <span style={{ color: 'var(--primary)' }}>Academic Edge.</span>
          </h2>
          
          <p style={{ 
            fontSize: isMobile ? 14 : 16, 
            color: 'var(--muted)', 
            maxWidth: 500, margin: '0 auto 32px', 
            fontWeight: 500, lineHeight: 1.6 
          }}>
            Premium tools starting from ₦{plans[1].priceMonthly.toLocaleString()} to help you dominate your exams.
          </p>

          <div style={{ 
            display: 'inline-flex', background: 'white', 
            border: '1.5px solid #eee', borderRadius: 20, 
            padding: 5, gap: 4, 
            boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
            width: isMobile ? '100%' : 'auto'
          }}>
            <button 
              onClick={() => setIsSemester(false)} 
              style={{ 
                flex: isMobile ? 1 : 'initial',
                padding: isMobile ? '12px 0' : '9px 28px', 
                borderRadius: 16, 
                background: !isSemester ? 'var(--primary)' : 'transparent', 
                color: !isSemester ? 'white' : '#666', 
                fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.25s' 
              }}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsSemester(true)} 
              style={{ 
                flex: isMobile ? 1.4 : 'initial',
                padding: isMobile ? '12px 0' : '9px 28px', 
                borderRadius: 16, 
                background: isSemester ? 'var(--primary)' : 'transparent', 
                color: isSemester ? 'white' : '#666', 
                fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.25s', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 
              }}
            >
              Per Semester
              <span style={{ 
                fontSize: 9, 
                background: isSemester ? 'rgba(255,255,255,0.2)' : '#ecfdf5', 
                color: isSemester ? 'white' : '#059669', 
                padding: '2px 6px', borderRadius: 6, fontWeight: 900 
              }}>SAVINGS</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: isMobile ? 20 : 24, 
          paddingBottom: isMobile ? 40 : 60,
          alignItems: 'center'
        }}>
          {plans.map((plan, idx) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5, type: 'spring' }}
              style={{
                background: plan.bg, 
                color: plan.color,
                borderRadius: 32, 
                padding: isMobile ? '32px 24px' : '40px 36px',
                border: plan.isPopular ? 'none' : `1.5px solid ${plan.border}`,
                boxShadow: plan.isPopular ? '0 40px 80px -12px rgba(122,18,204,0.3)' : '0 10px 30px rgba(0,0,0,0.03)',
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column',
                width: '100%',
                maxWidth: isMobile ? '400px' : '900px',
                zIndex: plan.isPopular ? 10 : 1
              }}
            >
              {plan.isPopular && (
                <div style={{ 
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', 
                  display: 'inline-flex', alignItems: 'center', gap: 6, 
                  background: '#111', color: 'white', padding: '6px 16px', 
                  borderRadius: 99, fontSize: 10, fontWeight: 900, 
                  border: '3px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' 
                }}>
                  <Sparkles size={11} fill="white" /> MOST POPULAR
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'space-between',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: 20,
                marginBottom: 32
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 1000, margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>{plan.name}</h3>
                  <div style={{ fontSize: 13, fontWeight: 600, color: plan.isPopular ? 'rgba(255,255,255,0.85)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
                    {plan.trial}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                  <span style={{ fontSize: isMobile ? 36 : 48, fontWeight: 1000, lineHeight: 1, letterSpacing: '-0.05em' }}>
                    {plan.priceMonthly === 0 ? 'Free' : `₦${isSemester ? plan.priceSemester.toLocaleString() : plan.priceMonthly.toLocaleString()}`}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 800, color: plan.isPopular ? 'rgba(255,255,255,0.7)' : 'var(--muted)', marginBottom: isMobile ? 4 : 8 }}>
                      /{isSemester ? 'semester' : 'month'}
                    </span>
                  )}
                </div>
              </div>
              
              <button style={{ 
                width: '100%', padding: '16px', borderRadius: 16, 
                fontSize: 15, fontWeight: 900, cursor: 'pointer', marginBottom: 32, 
                ...plan.buttonStyle, transition: 'all 0.2s',
                boxShadow: plan.isPopular ? '0 12px 28px rgba(0,0,0,0.15)' : 'none',
                opacity: plan.priceMonthly === 0 ? 0.7 : 1,
                pointerEvents: plan.priceMonthly === 0 ? 'none' : 'auto'
              }}>
                {plan.buttonText}
              </button>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 16
              }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: 20, height: 20, borderRadius: '50%', 
                      background: plan.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(122,18,204,0.08)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 
                    }}>
                      <Check size={11} color={plan.isPopular ? 'white' : 'var(--primary)'} strokeWidth={4} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: plan.isPopular ? 'white' : '#444' }}>{f}</span>
                  </div>
                ))}
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
