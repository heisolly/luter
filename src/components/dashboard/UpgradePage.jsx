import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { TIER_LIMITS } from '../../services/creditService'
import PaystackPop from '@paystack/inline-js'
import { 
  Check, 
  Crown, 
  Sparkle, 
  Lock, 
  ShieldCheck, 
  Info, 
  CreditCard, 
  ToggleRight,
  ToggleLeft,
  MapPin,
  ArrowRight,
  X
} from '@phosphor-icons/react'

const CYCLE_LABELS = {
  'weekly': 'Weekly Plan',
  'monthly': 'Monthly',
  'yearly': 'Yearly (18% Off)',
}

export default function UpgradePage() {
  const { user, profile } = useOutletContext() || {}
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(null)
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('ok')
  const [paymentMode, setPaymentMode] = useState('demo')
  const [loadingSettings, setLoadingSettings] = useState(true)
  
  // Geopricing States
  const [currency, setCurrency] = useState('USD') // 'NGN' or 'USD'
  const [detectedLocation, setDetectedLocation] = useState(null)
  const [billingCycle, setBillingCycle] = useState('monthly') // 'weekly', 'monthly', 'yearly'
  const [weeklyAutoRenew, setWeeklyAutoRenew] = useState(true)

  const [selectedPlanId, setSelectedPlanId] = useState('pro')
  const currentTier = (profile?.subscription_tier || 'free').toLowerCase()
  const isPremium = profile?.is_premium || false
  const isAdmin = profile?.role === 'teacher' || profile?.role === 'admin'

  const paymentSuccess = searchParams.get('payment') === 'success'
  const upgradedTier = searchParams.get('tier')

  // Auto-detect location on load
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        if (data && data.country_code === 'NG') {
          setCurrency('NGN')
          setBillingCycle('monthly')
          setDetectedLocation('Nigeria')
        } else {
          setCurrency('USD')
          setBillingCycle('monthly')
          setDetectedLocation(data.country_name || 'International')
        }
      })
      .catch(() => {
        // Fallback using timezone detection
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (tz && tz.includes('Lagos')) {
          setCurrency('NGN')
          setDetectedLocation('Nigeria')
        } else {
          setCurrency('USD')
          setDetectedLocation('International')
        }
      })
  }, [])

  useEffect(() => {
    supabase
      .from('payment_settings')
      .select('paystack_enabled, paystack_mode')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPaymentMode(data.paystack_enabled ? 'live' : 'demo')
        setLoadingSettings(false)
      })
      .catch(() => setLoadingSettings(false))
  }, [])

  useEffect(() => {
    if (message) { 
      const t = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(t) 
    }
  }, [message])

  useEffect(() => {
    if (paymentSuccess && upgradedTier) {
      const name = upgradedTier.charAt(0).toUpperCase() + upgradedTier.slice(1)
      setMessageType('ok')
      setMessage(`Payment confirmed! You're now on the ${name} plan.`)
    }
  }, [paymentSuccess, upgradedTier])

  async function togglePaymentMode() {
    if (!isAdmin) return
    const newMode = paymentMode === 'demo' ? 'live' : 'demo'
    setPaymentMode(newMode)
    const { data } = await supabase.from('payment_settings').select('id').maybeSingle()
    if (data?.id) {
      await supabase.from('payment_settings').update({ paystack_enabled: newMode === 'live' }).eq('id', data.id)
    }
  }

  // Compile Dynamic pricing tiers
  const getDynamicPlans = () => {
    if (currency === 'NGN') {
      return [
        {
          id: 'free',
          name: 'Free',
          badge: null,
          credits: TIER_LIMITS.free,
          label: '200 credits/day',
          monthlyCredits: 200,
          description: 'Basic study tools for single-device learning.',
          tags: ['Flashcards', 'Quizzes', 'OCR'],
          colors: { 
            base: 'var(--color-slate-600)', 
            soft: 'var(--color-slate-100)', 
            border: 'var(--color-slate-200)', 
            text: 'var(--color-slate-700)', 
            bg: 'var(--color-slate-50)' 
          },
          cycles: {
            weekly: { price: '₦0', sub: '', naira: '₦0', amount: 0 },
            monthly: { price: '₦0', sub: '', naira: '₦0', amount: 0 },
            yearly: { price: '₦0', sub: '', naira: '₦0', amount: 0 },
          },
          features: [
            '200 AI credits daily',
            'AI chat (~10 messages/day)',
            'AI Notes (~2 sets/day)',
            'Flashcards & quizzes',
            'Explain text & Image OCR',
          ],
          limits: ['Audio & video upload', 'Group study sessions', 'Mock exams'],
        },
        {
          id: 'pro',
          name: 'Pro',
          badge: 'Most Popular',
          credits: TIER_LIMITS.pro,
          label: '2,000 credits/day',
          monthlyCredits: 2000,
          description: 'Advanced features for dedicated students.',
          tags: ['Audio Study', 'Mock Exams', 'Group Play'],
          colors: { 
            base: 'var(--color-purple-600)', 
            soft: 'var(--color-purple-100)', 
            border: 'var(--color-purple-200)', 
            text: 'var(--color-purple-700)', 
            bg: 'var(--color-purple-50)' 
          },
          cycles: {
            weekly: { 
              price: '₦750', 
              sub: '/week', 
              naira: weeklyAutoRenew ? '₦750/week · Recurring' : '₦750 · One-off week', 
              amount: 750, 
              paystackPlanId: weeklyAutoRenew ? 'pro_weekly' : 'pro_weekly_oneoff' 
            },
            monthly: { 
              price: '₦1,500', 
              sub: '/1st month', 
              naira: 'Introductory Promo · then ₦4,999/mo', 
              amount: 1500, 
              discount: 'Promo price', 
              paystackPlanId: 'pro_promo' 
            },
            yearly: { 
              price: '₦49,190', 
              sub: '/year', 
              naira: '₦4,099/mo equivalent · save 18%', 
              amount: 49190, 
              discount: 'Save 18%', 
              paystackPlanId: 'pro_yearly' 
            },
          },
          features: [
            '2,000 AI credits daily',
            'AI chat (~100 messages/day)',
            'AI Notes (~25 sets/day)',
            'Audio upload (5 files/day)',
            'Group study & Mock exams',
          ],
          limits: ['Unlimited credits'],
        },
        {
          id: 'beast',
          name: 'Beast',
          badge: 'Unlimited Power',
          credits: 'Unlimited',
          label: 'Unlimited credits',
          monthlyCredits: 999999,
          description: 'Unlimited power for high-achieving learners.',
          tags: ['Voice Chat', 'Unlimited AI', 'Priority Queue'],
          colors: { 
            base: 'var(--color-green-600)', 
            soft: 'var(--color-green-100)', 
            border: 'var(--color-green-200)', 
            text: 'var(--color-green-700)', 
            bg: 'var(--color-green-50)' 
          },
          cycles: {
            weekly: { 
              price: '₦1,500', 
              sub: '/week', 
              naira: weeklyAutoRenew ? '₦1,500/week · Recurring' : '₦1,500 · One-off week', 
              amount: 1500, 
              paystackPlanId: weeklyAutoRenew ? 'beast_weekly' : 'beast_weekly_oneoff' 
            },
            monthly: { 
              price: '₦3,300', 
              sub: '/1st month', 
              naira: 'Introductory Promo · then ₦8,999/mo', 
              amount: 3300, 
              discount: 'Promo price', 
              paystackPlanId: 'beast_promo' 
            },
            yearly: { 
              price: '₦88,550', 
              sub: '/year', 
              naira: '₦7,379/mo equivalent · save 18%', 
              amount: 88550, 
              discount: 'Save 18%', 
              paystackPlanId: 'beast_yearly' 
            },
          },
          features: [
            'Unlimited AI credits',
            'Unlimited AI chat & Notes',
            'Unlimited audio upload',
            'Unlimited group study',
            'Unlimited mock exams',
          ],
          limits: [],
        },
      ]
    } else {
      // USD Pricing - processed via Paystack alone
      return [
        {
          id: 'free',
          name: 'Free',
          badge: null,
          credits: TIER_LIMITS.free,
          label: '200 credits/day',
          monthlyCredits: 200,
          description: 'Basic study tools for single-device learning.',
          tags: ['Flashcards', 'Quizzes', 'OCR'],
          colors: { 
            base: 'var(--color-slate-600)', 
            soft: 'var(--color-slate-100)', 
            border: 'var(--color-slate-200)', 
            text: 'var(--color-slate-700)', 
            bg: 'var(--color-slate-50)' 
          },
          cycles: {
            monthly: { price: '$0', sub: '', naira: '$0', amount: 0 },
            yearly: { price: '$0', sub: '', naira: '$0', amount: 0 },
          },
          features: [
            '200 AI credits daily',
            'AI chat (~10 messages/day)',
            'AI Notes (~25 sets/day)',
            'Flashcards & quizzes',
            'Explain text & Image OCR',
          ],
          limits: ['Audio & video upload', 'Group study sessions', 'Mock exams'],
        },
        {
          id: 'pro',
          name: 'Pro',
          badge: 'Most Popular',
          credits: TIER_LIMITS.pro,
          label: '2,000 credits/day',
          monthlyCredits: 2000,
          description: 'Advanced features for dedicated students.',
          tags: ['Audio Study', 'Mock Exams', 'Group Play'],
          colors: { 
            base: 'var(--color-purple-600)', 
            soft: 'var(--color-purple-100)', 
            border: 'var(--color-purple-200)', 
            text: 'var(--color-purple-700)', 
            bg: 'var(--color-purple-50)' 
          },
          cycles: {
            monthly: { price: '$9.99', sub: '/mo', naira: '$9.99/mo · recurring', amount: 9.99, paystackPlanId: 'pro_monthly_usd' },
            yearly: { price: '$98.30', sub: '/yr', naira: '$8.19/mo equivalent · save 18%', amount: 98.30, discount: 'Save 18%', paystackPlanId: 'pro_yearly_usd' },
          },
          features: [
            '2,000 AI credits daily',
            'AI chat (~100 messages/day)',
            'AI Notes (~25 sets/day)',
            'Audio upload (5 files/day)',
            'Group study & Mock exams',
          ],
          limits: ['Unlimited credits'],
        },
        {
          id: 'beast',
          name: 'Beast',
          badge: 'Unlimited Power',
          credits: 'Unlimited',
          label: 'Unlimited credits',
          monthlyCredits: 999999,
          description: 'Unlimited power for high-achieving learners.',
          tags: ['Voice Chat', 'Unlimited AI', 'Priority Queue'],
          colors: { 
            base: 'var(--color-green-600)', 
            soft: 'var(--color-green-100)', 
            border: 'var(--color-green-200)', 
            text: 'var(--color-green-700)', 
            bg: 'var(--color-green-50)' 
          },
          cycles: {
            monthly: { price: '$18.99', sub: '/mo', naira: '$18.99/mo · recurring', amount: 18.99, paystackPlanId: 'beast_monthly_usd' },
            yearly: { price: '$186.80', sub: '/yr', naira: '$15.56/mo equivalent · save 18%', amount: 186.80, discount: 'Save 18%', paystackPlanId: 'beast_yearly_usd' },
          },
          features: [
            'Unlimited AI credits',
            'Unlimited AI chat & Notes',
            'Unlimited audio upload',
            'Unlimited group study',
            'Unlimited mock exams',
          ],
          limits: [],
        },
      ]
    }
  }

  const currentPlansList = getDynamicPlans()

  async function handleUpgrade(planId) {
    if (!user?.id) {
      navigate('/signin?redirect=' + encodeURIComponent('/upgrade'))
      return
    }

    const plan = currentPlansList.find(p => p.id === planId)
    if (!plan) return
    const cycle = plan.cycles[billingCycle] || plan.cycles['monthly']

    // Demo Sandbox Mode - direct DB upgrade
    if (paymentMode === 'demo') {
      setSubmitting(planId)
      setMessage(null)
      try {
        await Promise.all([
          supabase.from('profiles').update({ is_premium: planId !== 'free', subscription_tier: planId }).eq('id', user.id),
          supabase.from('user_stats').upsert(
            { user_id: user.id, ai_credits_monthly: plan.monthlyCredits, ai_credits_used: 0 },
            { onConflict: 'user_id' }
          ),
        ])
        setMessageType('ok')
        setMessage(
          planId === currentTier
            ? `You're already on the ${plan.name} plan.`
            : planId === 'free'
              ? 'Downgraded to Free. Credits reset.'
              : `Upgraded to ${plan.name}! Your new credits are active.`
        )
      } catch (err) {
        setMessageType('err')
        setMessage(err.message || 'Upgrade failed. Try again.')
      } finally {
        setSubmitting(null)
      }
      return
    }

    // Live Mode: Paystack Checkout (for both NGN and USD)
    setSubmitting(planId)
    setMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        navigate('/signin?redirect=' + encodeURIComponent('/upgrade'))
        return
      }

      // Determine proper Paystack Plan Code
      let paystackPlanId = cycle.paystackPlanId
      const isUsd = currency === 'USD'
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paystack-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            planId: paystackPlanId, // Detailed plan ID
            planCode: (billingCycle === 'weekly' && !weeklyAutoRenew) || billingCycle === 'monthly' && currency === 'NGN' && planId !== 'pro_monthly' && planId !== 'beast_monthly' ? 'oneoff' : paystackPlanId, // send 'oneoff' for one-off / promos
            amount: cycle.amount,
            email: user.email,
            currency: currency, // 'NGN' or 'USD'
            callback_url: `${window.location.origin}/payment/success`,
          }),
        }
      )

      if (!response.ok) { 
        const err = await response.json()
        throw new Error(err.error || 'Paystack payment initialization failed') 
      }

      const data = await response.json()

      const publicKey = data.publicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      if (!publicKey) {
        throw new Error('Paystack public key is not configured.')
      }

      const paystack = new PaystackPop()

      paystack.resumeTransaction(data.access_code, {
        onSuccess: () => {
          setSubmitting(null)
          navigate(`/payment/success?reference=${data.reference}`)
        },
        onCancel: () => {
          setSubmitting(null)
          setMessageType('err')
          setMessage('Payment was cancelled.')
        },
        onError: (err) => {
          setSubmitting(null)
          setMessageType('err')
          setMessage(err.message || 'Payment failed. Please try again.')
        },
      })
    } catch (err) {
      setMessageType('err')
      setMessage(err.message || 'Checkout failed. Please try again.')
      setSubmitting(null)
    }
  }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 9999, overflowY: 'auto',
      backgroundColor: 'var(--color-bg, #ffffff)', color: 'var(--color-text, #111827)',
      fontFamily: 'Inter, sans-serif', transition: 'background-color 0.3s'
    }} className="dark:bg-[#111111] dark:text-white">
      
      {/* Header Close Button */}
      <div style={{ position: 'absolute', top: 0, right: 0, padding: '16px', zIndex: 50 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ padding: '8px', borderRadius: '8px', border: 'none', background: 'rgba(128,128,128,0.1)', cursor: 'pointer' }}
          className="hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-gray-600 dark:text-gray-300"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      <div style={{ padding: '40px 24px', margin: '0 auto', maxWidth: '1100px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
        
        {/* Header Content */}
        <div style={{ margin: '0 auto', maxWidth: '800px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#111827', display: 'inline-block', background: '#98FF98', padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pricing</h2>
          <p style={{ marginTop: '12px', fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Unlock the full Luter experience
          </p>
          <p style={{ margin: '12px auto 0', maxWidth: '600px', fontSize: '14px', lineHeight: 1.5, color: '#4b5563' }} className="dark:text-gray-400">
            Choose the perfect plan. Premium gives you unlimited tutoring, mock exams, and audio study.
          </p>
        </div>

        {/* Billing Toggle */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px', borderRadius: '8px',
            background: 'rgba(128,128,128,0.05)', border: '1px solid rgba(128,128,128,0.2)'
          }}>
            {currency === 'NGN' && (
              <button
                onClick={() => setBillingCycle('weekly')}
                style={{
                  padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
                  background: billingCycle === 'weekly' ? '#98FF98' : 'transparent',
                  color: billingCycle === 'weekly' ? '#111827' : 'inherit'
                }}
                className="transition-all"
              >
                Weekly
              </button>
            )}
            <button
              onClick={() => setBillingCycle('monthly')}
              style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
                background: billingCycle === 'monthly' ? '#98FF98' : 'transparent',
                color: billingCycle === 'monthly' ? '#111827' : 'inherit'
              }}
              className="transition-all"
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', border: 'none',
                display: 'flex', alignItems: 'center', gap: '6px',
                background: billingCycle === 'yearly' ? '#98FF98' : 'transparent',
                color: billingCycle === 'yearly' ? '#111827' : 'inherit'
              }}
              className="transition-all"
            >
              Yearly 
              <span style={{
                fontSize: '9px', padding: '2px 6px', borderRadius: '4px',
                background: billingCycle === 'yearly' ? 'rgba(0,0,0,0.1)' : 'rgba(128,128,128,0.1)',
                color: billingCycle === 'yearly' ? '#111827' : 'inherit'
              }} className="dark:bg-white/10 dark:text-white">Save 18%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div style={{
          marginTop: '24px', display: 'grid', gap: '20px', width: '100%',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
        }}>
          {currentPlansList.map(plan => {
            const isSelected = selectedPlanId === plan.id;
            const cycle = plan.cycles[billingCycle] || plan.cycles['monthly'];
            const isCurrentTier = plan.id === currentTier;

            return (
              <div
                key={plan.id}
                onClick={() => !isCurrentTier && setSelectedPlanId(plan.id)}
                style={{
                  position: 'relative', borderRadius: '12px', padding: '20px', cursor: 'pointer',
                  border: isSelected ? '2px solid #98FF98' : '1px solid rgba(128,128,128,0.2)',
                  background: isSelected ? 'rgba(152,255,152,0.03)' : 'transparent',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? '0 10px 25px rgba(152,255,152,0.05)' : '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  display: 'flex', flexDirection: 'column'
                }}
                className="dark:bg-[#1a1a1a]"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'inherit', margin: 0 }}>
                    {plan.name}
                  </h3>
                  {plan.badge && (
                    <p style={{
                      borderRadius: '4px', background: '#98FF98', padding: '2px 8px',
                      fontSize: '11px', fontWeight: 700, color: '#111827', margin: 0
                    }}>
                      {plan.badge}
                    </p>
                  )}
                </div>
                
                <p style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.5, color: '#6b7280', minHeight: '40px', marginBottom: 0 }} className="dark:text-gray-400">
                  {plan.description}
                </p>

                <p style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: 0 }}>
                  <span style={{ fontSize: '28px', fontWeight: 800 }}>{cycle.price}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280' }} className="dark:text-gray-400">{cycle.sub}</span>
                </p>
                <div style={{ minHeight: '20px' }}>
                  {cycle.naira && cycle.naira !== cycle.price && cycle.naira !== '$0' && cycle.naira !== '₦0' && (
                    <p style={{ fontSize: '11px', fontWeight: 600, color: '#111827', margin: '2px 0 0 0' }} className="dark:text-white">{cycle.naira}</p>
                  )}
                </div>

                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{
                     width: '20px', height: '20px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                     border: isSelected ? '2px solid #98FF98' : '2px solid #d1d5db',
                     background: isSelected ? '#98FF98' : 'transparent',
                     transition: 'all 0.2s ease'
                   }} className="dark:border-gray-600">
                     {isSelected && <Check size={12} weight="bold" color="#111827" />}
                   </div>
                </div>

                {isCurrentTier && (
                  <div style={{
                    marginTop: '16px', borderRadius: '6px', background: 'rgba(128,128,128,0.1)', padding: '6px 10px',
                    textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#4b5563'
                  }} className="dark:text-gray-400">
                    Your Current Plan
                  </div>
                )}

                <ul style={{ marginTop: '20px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 0 }}>
                  {plan.features.map((feature, i) => (
                    <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.4 }}>
                      <Check size={16} weight="bold" color={isSelected ? '#111827' : '#98FF98'} className={isSelected ? "dark:text-white" : ""} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ color: '#4b5563' }} className="dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                  {plan.limits?.map((limit, i) => (
                    <li key={'lim'+i} style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: 1.4, textDecoration: 'line-through', opacity: 0.5 }}>
                      <X size={16} weight="bold" color="#9ca3af" style={{ flexShrink: 0, marginTop: '2px' }} className="dark:text-gray-600" />
                      <span style={{ color: '#9ca3af' }} className="dark:text-gray-500">{limit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Flow Checkout Button (Not Fixed) */}
        <div style={{
          marginTop: 'auto', paddingTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          <button
            disabled={submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free'}
            onClick={() => handleUpgrade(selectedPlanId)}
            style={{
              width: '100%', maxWidth: '400px', borderRadius: '8px', background: '#98FF98', padding: '14px 24px',
              textAlign: 'center', fontSize: '15px', fontWeight: 800, color: '#111827', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              opacity: (submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') ? 0.5 : 1
            }}
            className="hover:opacity-90 transition-all"
          >
            {submitting !== null ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                Continue to Checkout <ArrowRight size={16} weight="bold" />
              </>
            )}
          </button>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b7280', marginTop: '12px' }} className="dark:text-gray-400">
            Billed as one payment. Renews {billingCycle}. Cancel anytime.
          </p>
        </div>

      </div>

      {/* Admin Debug Toggle */}
      {isAdmin && !loadingSettings && (
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 110 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '6px 12px',
            borderRadius: '8px', border: '1px solid rgba(128,128,128,0.2)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }} className="dark:bg-[#1a1a1a]">
            <span style={{ fontSize: '11px', fontWeight: 700 }}>Admin: [{paymentMode}]</span>
            <button onClick={togglePaymentMode} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
              {paymentMode === 'live' ? <ToggleRight size={16} weight="fill" color="#10b981" /> : <ToggleLeft size={16} weight="fill" color="#9ca3af" />}
            </button>
          </div>
        </div>
      )}
      
      {/* Messages */}
      {message && (
        <div style={{
          position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999,
          padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(128,128,128,0.2)',
          background: '#fff', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
        }} className="dark:bg-[#1a1a1a]">
          {messageType === 'err' ? <X size={18} color="#ef4444" /> : <ShieldCheck size={18} color="#98FF98" />}
          <span>{message}</span>
        </div>
      )}
      
    </div>,
    document.body
  )
}
