import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiCheckLine as Check, 
  RiMagicFill as Sparkles, 
  RiLoader4Line as Loader, 
  RiArrowRightLine as ArrowRight,
  RiBankCard2Line as CreditCard,
  RiShieldCheckLine as Shield,
  RiLock2Line as Lock,
  RiSecurePaymentLine as SecurePayment
} from 'react-icons/ri'
import { supabase } from '../../supabaseClient'
import { PremiumButton } from '../PageShared'

const plans = [
  {
    name: 'Basic', trial: 'Free forever',
    priceMonthly: 0, priceSemester: 0,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonStyle: { 
      background: 'white', 
      color: '#4B0082', 
      border: '2px solid #C7B9FF' 
    },
    buttonText: 'CURRENT TIER',
    features: ['5 uploads per month', 'AI Notes (Basic)', 'AI Summary', 'Flashcard generation', 'Community support']
  },
  {
    name: 'University Pro', trial: 'Most popular for students',
    priceMonthly: 4000, priceSemester: 9000,
    isPopular: true,
    priceIdMonthly: 'price_1TQBBYHPD8pnlRZIniqKwUo0',
    priceIdSemester: 'price_1TQBBcHPD8pnlRZImYqlm80o',
    bg: 'linear-gradient(160deg, #6d28d9, #9718fb 60%, #7180FE)', color: 'white', border: 'transparent',
    buttonStyle: { 
      background: 'white', 
      color: '#FB923C', 
      border: '2px solid #FB923C',
      borderRadius: '16px'
    },
    buttonText: 'UPGRADE TO PRO',
    features: ['Unlimited uploads', 'Advanced AI Notes', 'AI Summary + Quizzes', 'Spaced-rep Flashcards', 'AI Math Expert', 'Live Lecture Recording', 'Priority support']
  },
  {
    name: 'Premium', trial: 'For power users',
    priceMonthly: 7000, priceSemester: 16000,
    isPopular: false,
    priceIdMonthly: 'price_1TQBBdHPD8pnlRZIp7HSWNQj',
    priceIdSemester: 'price_1TQBBeHPD8pnlRZIeg7YvWbb',
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonStyle: { 
      background: '#C7B9FF', 
      color: '#4B0082', 
      border: 'none',
      boxShadow: '0 10px 15px -3px rgba(75, 0, 130, 0.15)'
    },
    buttonText: 'GO PREMIUM',
    features: ['Everything in University Pro', 'Analyze Images with AI', 'Multi-file Sessions', 'Team collaboration', 'Dedicated support', 'Early feature access']
  }
]

export default function UpgradePage() {
  const { isMobile, userProfile } = useOutletContext()
  const navigate = useNavigate()
  const [isSemester, setIsSemester] = useState(true)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('paystack') // 'paystack' or 'stripe'

  const handleUpgrade = async (plan) => {
    if (plan.priceMonthly === 0) return
    
    setLoadingPlan(plan.name)
    try {
      const priceId = isSemester ? plan.priceIdSemester : plan.priceIdMonthly
      const amount = isSemester ? plan.priceSemester : plan.priceMonthly
      
      const { data, error } = await supabase.functions.invoke('create-paystack-checkout', {
        body: { 
          planId,
          amount: amount / 100, // Convert from kobo to naira
          email: userProfile?.email,
          callback_url: `${window.location.origin}/dashboard/payment/success`
        }
      })

      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error('Error starting checkout:', err)
      alert('Payment initialization failed. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const isCurrentPlan = (planName) => {
    const currentTier = userProfile?.subscription_tier?.toLowerCase() || 'basic'
    return currentTier === planName.toLowerCase()
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Header */}
      <div style={{ 
        padding: '60px 40px 40px',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 style={{ 
            fontSize: 'clamp(32px, 5vw, 48px)', 
            fontWeight: 800, 
            margin: '0 0 16px 0', 
            color: '#1e293b',
            letterSpacing: '-0.02em'
          }}>
            Upgrade Your Academic Journey
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: '#64748b', 
            maxWidth: 600, 
            margin: '0 auto',
            lineHeight: 1.6
          }}>
            Choose the perfect plan for your learning goals and unlock premium AI features.
          </p>
        </motion.div>

        {/* Payment Method Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: 48
        }}>
          <div style={{ 
            display: 'inline-flex', 
            background: '#ffffff', 
            borderRadius: 12, 
            padding: 8, 
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setPaymentMethod('paystack')}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                background: paymentMethod === 'paystack' ? '#10b981' : 'transparent',
                color: paymentMethod === 'paystack' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              <CreditCard size={18} style={{ marginRight: 8 }} />
              Paystack
            </button>
            <div style={{ 
              width: '1px', 
              height: 24, 
              background: '#e2e8f0' 
            }} />
            <button
              onClick={() => setPaymentMethod('stripe')}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                background: paymentMethod === 'stripe' ? '#6366f1' : 'transparent',
                color: paymentMethod === 'stripe' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              <SecurePayment size={18} style={{ marginRight: 8 }} />
              Stripe
            </button>
          </div>
        </div>

        {/* Billing Toggle */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 48
        }}>
          <div style={{ 
            display: 'inline-flex', 
            background: '#ffffff', 
            borderRadius: 12, 
            padding: 6, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0'
          }}>
            <button
              onClick={() => setIsSemester(false)}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: !isSemester ? '#7a12cc' : 'transparent',
                color: !isSemester ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: 14,
                fontWeight: 600
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsSemester(true)}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: isSemester ? '#7a12cc' : 'transparent',
                color: isSemester ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              Semester
              <span style={{ 
                fontSize: 10, 
                background: '#10b981', 
                color: '#ffffff', 
                padding: '2px 6px', 
                borderRadius: 6, 
                fontWeight: 700 
              }}>
                -40%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{ 
          padding: '0 40px',
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', 
            gap: 24,
            alignItems: 'stretch'
          }}>
            {plans.map((plan, idx) => {
              const current = isCurrentPlan(plan.name)
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    background: '#ffffff',
                    borderRadius: 16,
                    padding: '32px',
                    border: current ? `2px solid ${plan.isPopular ? '#7a12cc' : '#10b981'}` : '1px solid #e2e8f0',
                    position: 'relative',
                    transition: 'all 0.3s ease'
                  }}
                  whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                >
                  {plan.isPopular && (
                    <div style={{ 
                      position: 'absolute', 
                      top: -12, 
                      right: 24, 
                      background: 'linear-gradient(135deg, #7a12cc, #8b5cf6)', 
                      padding: '6px 12px', 
                      borderRadius: 6, 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: '#ffffff', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Most Popular
                    </div>
                  )}

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ 
                        width: 56, 
                        height: 56, 
                        borderRadius: 12, 
                        background: plan.isPopular ? '#7a12cc15' : '#f8fafc', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: plan.isPopular ? `1px solid ${plan.isPopular ? '#7a12cc' : '#10b981'}` : '1px solid #e2e8f0'
                      }}>
                        <Shield size={24} color={plan.isPopular ? '#7a12cc' : '#64748b'} />
                      </div>
                      <div>
                        <h3 style={{ 
                          fontSize: 20, 
                          fontWeight: 700, 
                          margin: 0, 
                          color: '#1e293b' 
                        }}>
                          {plan.name}
                        </h3>
                        <p style={{ 
                          fontSize: 13, 
                          color: '#64748b', 
                          margin: '4px 0 0 0', 
                          fontWeight: 400 
                        }}>
                          {plan.trial}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: 16
                    }}>
                      <div>
                        <span style={{ 
                          fontSize: 14, 
                          color: '#64748b', 
                          fontWeight: 400 
                        }}>
                          {isSemester ? 'Per Semester' : 'Per Month'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ 
                          fontSize: 36, 
                          fontWeight: 800, 
                          color: '#1e293b', 
                          lineHeight: 1 
                        }}>
                          ₦{plan.priceMonthly === 0 ? '0' : (isSemester ? plan.priceSemester : plan.priceMonthly).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={current || loadingPlan === plan.name}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 8,
                      border: current ? '1px solid #e2e8f0' : (plan.isPopular ? '2px solid #7a12cc' : '1px solid #e2e8f0'),
                      background: current ? '#f8fafc' : (plan.isPopular ? '#7a12cc' : '#ffffff'),
                      color: current ? '#94a3b8' : (plan.isPopular ? '#ffffff' : '#1e293b'),
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: current ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    {loadingPlan === plan.name ? (
                      <>
                        <div style={{
                          width: 16,
                          height: 16,
                          border: '2px solid #e2e8f0',
                          borderTop: '2px solid transparent',
                          borderRight: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} />
                        <span style={{ marginLeft: 8, fontSize: 14, color: '#64748b' }}>Processing...</span>
                      </>
                    ) : current ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Lock size={16} />
                        Current Plan
                      </span>
                    ) : (
                      <>
                        <span>{plan.buttonText}</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ 
                          width: 20, 
                          height: 20, 
                          borderRadius: 6, 
                          background: '#dcfce7', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexShrink: 0 
                        }}>
                          <Check size={12} color="#16a34a" strokeWidth={3} />
                        </div>
                        <span style={{ 
                          fontSize: 14, 
                          fontWeight: 400, 
                          color: '#475569', 
                          lineHeight: 1.5 
                        }}>
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
