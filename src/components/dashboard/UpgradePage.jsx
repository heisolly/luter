import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'

const plans = [
  {
    name: 'Basic', trial: 'Free forever',
    priceMonthly: 0, priceSemester: 0,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonStyle: { background: 'white', color: '#111', border: '1px solid #e5e7eb' },
    buttonText: 'Current Plan',
    features: ['5 uploads per month', 'AI Notes (Basic)', 'AI Summary', 'Flashcard generation', 'Community support']
  },
  {
    name: 'University Pro', trial: 'Most popular for students',
    priceMonthly: 4000, priceSemester: 9000,
    isPopular: true,
    bg: 'linear-gradient(160deg, #6d28d9, #9718fb 60%, #7180FE)', color: 'white', border: 'transparent',
    buttonStyle: { background: 'white', color: 'var(--primary)', border: 'none' },
    buttonText: 'Upgrade to Pro',
    features: ['Unlimited uploads', 'Advanced AI Notes', 'AI Summary + Quizzes', 'Spaced-rep Flashcards', 'AI Math Expert', 'Live Lecture Recording', 'Priority support']
  },
  {
    name: 'Premium', trial: 'For power users',
    priceMonthly: 7000, priceSemester: 16000,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonStyle: { background: 'linear-gradient(135deg, var(--primary), #7180fe)', color: 'white', border: 'none' },
    buttonText: 'Get Premium',
    features: ['Everything in University Pro', 'Analyze Images with AI', 'Multi-file Sessions', 'Team collaboration', 'Dedicated support', 'Early feature access']
  }
]

export default function UpgradePage() {
  const { isMobile } = useOutletContext()
  const [isSemester, setIsSemester] = useState(true)

  return (
    <div className="dh-root" style={{ 
      overflowY: 'auto',
      background: '#fafafa',
      paddingBottom: isMobile ? 100 : 80 
    }}>
      
      {/* ── Topbar ── */}
      <div style={{ 
        padding: isMobile ? '24px 20px 16px' : '40px 48px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb'
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
        maxWidth: 1100, 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* Toggle */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60 }}>
          <div style={{ display: 'inline-flex', background: 'white', border: '1px solid #e5e7eb', borderRadius: 99, padding: 4, gap: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <button onClick={() => setIsSemester(false)} style={{ padding: '9px 28px', borderRadius: 99, background: !isSemester ? 'var(--primary)' : 'transparent', color: !isSemester ? 'white' : '#555', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.25s' }}>Monthly</button>
            <button onClick={() => setIsSemester(true)} style={{ padding: '9px 28px', borderRadius: 99, background: isSemester ? 'var(--primary)' : 'transparent', color: isSemester ? 'white' : '#555', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 8 }}>
              Per Semester <span style={{ fontSize: 10, background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>Best Value</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          flexWrap: isMobile ? 'nowrap' : 'wrap', 
          justifyContent: 'center', 
          gap: isMobile ? 32 : 0, 
          maxWidth: 1050, 
          margin: '0 auto' 
        }}>
          {plans.map((plan, idx) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              style={{
                flex: isMobile ? 'initial' : '1 1 300px', 
                maxWidth: isMobile ? '100%' : 360,
                background: plan.bg, 
                color: plan.color,
                borderRadius: 24, 
                padding: plan.isPopular ? (isMobile ? '36px 24px' : '44px 32px') : (isMobile ? '32px 24px' : '36px 28px'),
                border: plan.isPopular ? 'none' : `1px solid ${plan.border}`,
                boxShadow: plan.isPopular ? '0 32px 64px rgba(113,128,254,0.25)' : '0 4px 20px rgba(0,0,0,0.03)',
                transform: plan.isPopular && !isMobile ? 'scaleY(1.04)' : 'scaleY(1)',
                position: 'relative', 
                zIndex: plan.isPopular ? 10 : 1,
                display: 'flex', 
                flexDirection: 'column',
                margin: plan.isPopular && !isMobile ? '-8px 0' : '8px 0',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {plan.isPopular && (
                <div style={{ display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '5px 14px', borderRadius: 99, fontSize: 10, fontWeight: 800, marginBottom: 20, border: '1px solid rgba(255,255,255,0.3)' }}>
                  <Sparkles size={11} /> MOST POPULAR
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px 0' }}>{plan.name}</h3>
                <span style={{ fontSize: 12, fontWeight: 600, color: plan.isPopular ? 'rgba(255,255,255,0.8)' : '#888' }}>{plan.trial}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 28 }}>
                <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{plan.priceMonthly === 0 ? '₦0' : `₦${(isSemester ? plan.priceSemester : plan.priceMonthly).toLocaleString()}`}</span>
                {plan.priceMonthly > 0 && <span style={{ fontSize: 14, fontWeight: 600, color: plan.isPopular ? 'rgba(255,255,255,0.7)' : '#aaa', marginBottom: 8 }}>/{isSemester ? 'sem' : 'mo'}</span>}
              </div>
              <button style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginBottom: 32, ...plan.buttonStyle, transition: 'all 0.2s' }}>{plan.buttonText}</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', background: plan.isPopular ? 'rgba(255,255,255,0.25)' : 'rgba(151,24,251,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Check size={9} color={plan.isPopular ? 'white' : 'var(--primary)'} strokeWidth={3.5} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, color: plan.isPopular ? 'rgba(255,255,255,0.92)' : '#444' }}>{f}</span>
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
