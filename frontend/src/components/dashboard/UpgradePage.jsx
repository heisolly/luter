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

export default function UpgradePage() {
  const [isSemester, setIsSemester] = useState(true)

  return (
    <div className="dh-root" style={{ overflowY: 'auto' }}>
      
      {/* ── Topbar ── */}
      <div className="dh-topbar">
        <div className="dh-topbar-left">
          <h1 className="dh-page-title">Upgrade Plan</h1>
          <p className="dh-page-sub">Level up your study speed with Luter Pro</p>
        </div>
      </div>

      <div style={{ padding: '40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        
        {/* Header content */}
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20, background: 'rgba(122, 18, 204, 0.08)', padding: '6px 16px', borderRadius: 99, border: '1px solid rgba(122, 18, 204, 0.15)' }}>
            <Zap size={13} fill="currentColor" /> Turbocharge your grades
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 800, color: '#111', margin: '0 0 16px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Choose the right plan for your semester
          </h2>
          <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 500, margin: '0 auto 36px', fontWeight: 500, lineHeight: 1.6 }}>
            Upgrade, downgrade, or cancel anytime. No hidden fees.
          </p>

          <div style={{ display: 'inline-flex', background: 'white', border: '1px solid var(--border)', borderRadius: 99, padding: 4, gap: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <button 
              onClick={() => setIsSemester(false)} 
              style={{ padding: '9px 28px', borderRadius: 99, background: !isSemester ? 'var(--primary)' : 'transparent', color: !isSemester ? 'white' : '#555', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.25s' }}
            >
              Monthly
            </button>
            <button 
              onClick={() => setIsSemester(true)} 
              style={{ padding: '9px 28px', borderRadius: 99, background: isSemester ? 'var(--primary)' : 'transparent', color: isSemester ? 'white' : '#555', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              Per Semester <span style={{ fontSize: 10, background: isSemester ? 'rgba(255,255,255,0.2)' : '#d1fae5', color: isSemester ? 'white' : '#059669', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>Best Value</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, paddingBottom: 60 }}>
          {plans.map((plan, idx) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5, type: 'spring' }}
              style={{
                background: plan.bg, color: plan.color,
                borderRadius: 24, padding: '36px 32px',
                border: plan.isPopular ? 'none' : `1px solid ${plan.border}`,
                boxShadow: plan.isPopular ? '0 32px 64px rgba(122,18,204,0.2)' : '0 4px 20px rgba(0,0,0,0.02)',
                position: 'relative', 
                display: 'flex', flexDirection: 'column',
                transform: plan.isPopular ? 'scale(1.02)' : 'none',
                zIndex: plan.isPopular ? 10 : 1
              }}
            >
              {plan.isPopular && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', alignItems: 'center', gap: 6, background: '#111', color: 'white', padding: '6px 16px', borderRadius: 99, fontSize: 11, fontWeight: 800, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <Sparkles size={11} fill="white" /> MOST POPULAR
                </div>
              )}
              
              <div style={{ marginBottom: 24, marginTop: plan.isPopular ? 10 : 0 }}>
                <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.02em' }}>{plan.name}</h3>
                <span style={{ fontSize: 13, fontWeight: 500, color: plan.isPopular ? 'rgba(255,255,255,0.9)' : 'var(--muted)' }}>{plan.trial}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 32 }}>
                <span style={{ fontSize: 42, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em' }}>
                  {plan.priceMonthly === 0 ? '₦0' : `₦${isSemester ? plan.priceSemester.toLocaleString() : plan.priceMonthly.toLocaleString()}`}
                </span>
                {plan.priceMonthly > 0 && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: plan.isPopular ? 'rgba(255,255,255,0.8)' : 'var(--muted)', marginBottom: 6 }}>
                    /{isSemester ? 'sem' : 'mo'}
                  </span>
                )}
              </div>
              
              <button style={{ 
                width: '100%', padding: '14px', borderRadius: 14, 
                fontSize: 14, fontWeight: 800, cursor: 'pointer', marginBottom: 36, 
                ...plan.buttonStyle, transition: 'all 0.2s',
                opacity: plan.priceMonthly === 0 ? 0.6 : 1,
                pointerEvents: plan.priceMonthly === 0 ? 'none' : 'auto'
              }}>
                {plan.buttonText}
              </button>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: plan.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(122,18,204,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Check size={10} color={plan.isPopular ? 'white' : 'var(--primary)'} strokeWidth={4} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, color: plan.isPopular ? 'white' : '#333' }}>{f}</span>
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
