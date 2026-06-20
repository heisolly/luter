import { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { TIER_LIMITS } from '../../services/creditService'
import PaystackPop from '@paystack/inline-js'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    colors: { base: '#8B5CF6', soft: '#F3E8FF', border: '#C4B5FD', text: '#5B21B6', bg: '#F8F6FF' },
    badge: null,
    credits: TIER_LIMITS.free,
    label: '200 credits/day',
    monthlyCredits: 200,
    cycles: [
      { key: '2weeks', price: '$0', sub: '', naira: '₦0', amount: 0, discount: null },
    ],
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
    colors: { base: '#F97316', soft: '#FFF7ED', border: '#FFD2A6', text: '#9A3412', bg: '#FFFAF5' },
    badge: 'Most popular',
    credits: TIER_LIMITS.pro,
    label: '1,500 credits/day',
    monthlyCredits: 1500,
    cycles: [
      { key: '2weeks', price: '$3.50', sub: '/2 weeks', naira: '₦4,795', amount: 4795, discount: null, paystackPlanId: 'pro_2weeks' },
      { key: 'monthly', price: '$7', sub: '/mo', naira: '₦9,590/mo · save 0%', amount: 9590, discount: null, paystackPlanId: 'pro' },
      { key: 'yearly', price: '$65', sub: '/yr', naira: '₦89,050/yr · save 23%', amount: 89050, discount: 'Save $19', paystackPlanId: 'pro_yearly' },
    ],
    features: [
      '1,500 AI credits daily',
      'AI chat (~75 messages/day)',
      'AI Notes (~18 sets/day)',
      'Audio upload (5 files/day)',
      'Group study & Mock exams',
    ],
    limits: ['Unlimited credits'],
  },
  {
    id: 'beast',
    name: 'Beast',
    colors: { base: '#059669', soft: '#ECFDF5', border: '#98FF98', text: '#065F46', bg: '#F2FEF2' },
    badge: 'Unlimited',
    credits: 'Unlimited',
    label: 'Unlimited credits',
    monthlyCredits: 999999,
    cycles: [
      { key: '2weeks', price: '$7.50', sub: '/2 weeks', naira: '₦10,275', amount: 10275, discount: null, paystackPlanId: 'beast_2weeks' },
      { key: 'monthly', price: '$15', sub: '/mo', naira: '₦20,550/mo · save 0%', amount: 20550, discount: null, paystackPlanId: 'beast_monthly' },
      { key: 'yearly', price: '$140', sub: '/yr', naira: '₦191,800/yr · save 22%', amount: 191800, discount: 'Save $40', paystackPlanId: 'beast_yearly' },
    ],
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

const CYCLE_LABELS = {
  '2weeks': 'Pay Per 2 Weeks',
  'monthly': 'Monthly',
  'yearly': 'Yearly',
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
  const [billingCycle, setBillingCycle] = useState('monthly')

  const currentTier = (profile?.subscription_tier || 'free').toLowerCase()
  const isPremium = profile?.is_premium || false
  const isAdmin = profile?.role === 'teacher'

  const paymentSuccess = searchParams.get('payment') === 'success'
  const upgradedTier = searchParams.get('tier')

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
    if (message) { const t = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(t) }
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

  const getCycle = (plan) => plan.cycles.find(c => c.key === billingCycle) || plan.cycles[0]

  async function handleUpgrade(planId) {
    if (!user?.id) {
      navigate('/signin?redirect=' + encodeURIComponent('/upgrade'))
      return
    }

    const plan = PLANS.find(p => p.id === planId)
    if (!plan) return
    const cycle = getCycle(plan)

    // Demo mode — direct DB upgrade
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

    // Live mode — Paystack checkout
    setSubmitting(planId)
    setMessage(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        navigate('/signin?redirect=' + encodeURIComponent('/upgrade'))
        return
      }

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
            planId: cycle.paystackPlanId || planId,
            amount: cycle.amount,
            email: user.email,
            currency: 'NGN',
            callback_url: `${window.location.origin}/dashboard/payment/success`,
          }),
        }
      )

      if (!response.ok) { const err = await response.json(); throw new Error(err.error || 'Payment initialization failed') }

      const data = await response.json()

      const publicKey = data.publicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
      if (!publicKey) {
        throw new Error('Paystack public key is not configured. Check VITE_PAYSTACK_PUBLIC_KEY in .env or Edge Function secrets.')
      }

      const paystack = new PaystackPop()

      paystack.newTransaction({
        key: publicKey,
        email: user.email,
        amount: Number(cycle.amount) * 100,
        currency: 'NGN',
        ref: data.reference,
        metadata: { plan_id: cycle.paystackPlanId || planId, user_id: user.id, source: 'upgrade_page' },
        onSuccess: () => {
          setSubmitting(null)
          navigate(`/dashboard/payment/success?reference=${data.reference}`)
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

  return (
    <div style={wrapper}>
      {/* HEADER */}
      <div style={headerSection}>
        <div>
          <h1 style={heading}>Upgrade your plan</h1>
          <p style={subheading}>
            {isPremium
              ? `You're on the <strong>${currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}</strong> plan.`
              : 'Free tier: <strong>200 credits/day</strong>. Unlock more with Pro or Beast.'}
          </p>
        </div>
      </div>

      {/* BILLING CYCLE TOGGLE */}
      <div style={cycleToggleRow}>
        {['2weeks', 'monthly', 'yearly'].map(key => (
          <button
            key={key}
            onClick={() => setBillingCycle(key)}
            style={{
              ...cycleBtn,
              background: billingCycle === key ? '#7C3AED' : 'var(--sb-bg, #fff)',
              color: billingCycle === key ? '#fff' : 'var(--sb-text-muted, #475569)',
              borderColor: billingCycle === key ? '#7C3AED' : 'var(--sb-border, #E5E7EB)',
            }}
          >
            {CYCLE_LABELS[key]}
          </button>
        ))}
      </div>

      {/* BANNER */}
      {message && (
        <div style={{
          ...banner,
          background: messageType === 'ok' ? '#ECFDF5' : '#FEF2F2',
          color: messageType === 'ok' ? '#065F46' : '#991B1B',
          borderColor: messageType === 'ok' ? '#A7F3D0' : '#FECACA',
        }}>
          <span style={{ fontSize: 16 }}>{messageType === 'ok' ? '✓' : '✕'}</span>
          <span>{message}</span>
        </div>
      )}

      {/* PLANS GRID */}
      <div style={grid}>
        {PLANS.map(plan => {
          const active = plan.id === currentTier
          const cycle = getCycle(plan)

          return (
            <div key={plan.id} style={{
              ...card,
              borderColor: active ? plan.colors.base : 'var(--sb-border, #E5E7EB)',
              boxShadow: active
                ? `0 0 0 2px ${plan.colors.base}, 0 8px 28px rgba(0,0,0,0.07)`
                : '0 4px 16px rgba(0,0,0,0.04)',
              transform: active ? 'scale(1.02)' : 'scale(1)',
            }}>
              {/* BADGE */}
              {plan.badge && <div style={{ ...pill, background: plan.colors.soft, color: plan.colors.text }}>{plan.badge}</div>}

              {/* HEADER */}
              <div style={{ ...cardTop, background: plan.colors.bg, borderBottom: `1px solid ${plan.colors.border}` }}>
                <div style={tierName}>{plan.name}</div>
                <div style={priceRow}>
                  <span style={price}>{cycle.price}</span>
                  <span style={priceSub}>{cycle.sub}</span>
                </div>
                <div style={nairaText}>{cycle.naira}</div>
                {cycle.discount && (
                  <div style={{ ...discountBadge, background: plan.colors.soft, color: plan.colors.text }}>
                    {cycle.discount}
                  </div>
                )}
                <div style={creditLine}>
                  {plan.credits === 'Unlimited'
                    ? <span style={{ fontWeight: 600, color: plan.colors.base }}>♾ Unlimited</span>
                    : <span style={{ fontWeight: 600 }}>{plan.credits.toLocaleString()}</span>
                  }
                  <span style={{ color: '#6B7280' }}> credits/day</span>
                </div>
              </div>

              {/* INCLUDED FEATURES */}
              <div style={featuresSection}>
                <div style={sectionLabel}>Includes</div>
                {plan.features.map((f, i) => (
                  <div key={i} style={featureRow}>
                    <span style={{ ...checkIcon, color: plan.colors.base, background: `${plan.colors.base}15` }}>✓</span>
                    <span style={{ fontSize: 13.5, color: 'var(--sb-text, #0F172A)' }}>{f}</span>
                  </div>
                ))}
                {plan.limits.length > 0 && (
                  <>
                    <div style={{ ...sectionLabel, marginTop: 12 }}>Limits</div>
                    {plan.limits.map((f, i) => (
                      <div key={i} style={featureRow}>
                        <span style={{ ...checkIcon, color: '#9CA3AF', background: '#F3F4F6' }}>—</span>
                        <span style={{ fontSize: 13.5, color: '#9CA3AF' }}>{f}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* ACTION */}
              <div style={actionArea}>
                {active ? (
                  <div style={{ ...actionBtn, background: plan.colors.bg, color: plan.colors.base, border: `1.5px solid ${plan.colors.border}`, cursor: 'default' }}>
                    ✓ Current plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={submitting !== null}
                    style={{
                      ...actionBtn,
                      border: 'none',
                      background: plan.colors.base,
                      color: '#fff',
                      cursor: submitting === plan.id ? 'wait' : 'pointer',
                      opacity: submitting === plan.id ? 0.7 : 1,
                      fontSize: 15,
                      padding: '14px 0',
                      boxShadow: `0 4px 12px ${plan.colors.base}40`,
                    }}
                  >
                    {submitting === plan.id
                      ? 'Processing...'
                      : plan.id === 'free'
                        ? 'Downgrade to Free'
                        : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ADMIN: PAYMENT MODE TOGGLE */}
      {isAdmin && !loadingSettings && (
        <div style={adminPanel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sb-text, #0F172A)' }}>⚡ Payment Mode</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '3px 10px', borderRadius: 999, background: '#F3E8FF', color: '#7C3AED' }}>Admin only</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--sb-text, #0F172A)' }}>
                {paymentMode === 'demo' ? 'Demo mode' : 'Live payments'}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {paymentMode === 'demo'
                  ? 'Upgrades happen instantly — no real payment required.'
                  : 'Users pay via Paystack. Real charges apply.'}
              </div>
            </div>
            <button
              onClick={togglePaymentMode}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 18px', borderRadius: 999, border: 'none',
                background: paymentMode === 'live' ? '#7C3AED' : '#E5E7EB',
                color: paymentMode === 'live' ? '#fff' : '#374151',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: paymentMode === 'live' ? '#98FF98' : '#9CA3AF', display: 'inline-block' }} />
              {paymentMode === 'live' ? 'Live' : 'Demo'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #DDD6FE', fontSize: 12, color: '#6B7280' }}>
            <span>Paystack pricing:</span>
            {['pro', 'beast'].flatMap(p => PLANS.find(x => x.id === p).cycles.map(c =>
              <span key={`${p}-${c.key}`} style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#EDE9FE', color: '#5B21B6' }}>
                {PLANS.find(x => x.id === p).name} {c.key}: ₦{c.amount.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={footer}>
        <p style={{ fontSize: 13.5, color: '#6B7280', margin: 0 }}>
          All plans include AI study tools. Credits reset daily. Cancel anytime.
        </p>
      </div>
    </div>
  )
}

// ── STYLES ──
const wrapper = {
  padding: '2.5rem 2rem',
  maxWidth: 1100,
  margin: '0 auto',
  fontFamily: 'var(--font-display, DM Sans, Inter, sans-serif)',
}
const headerSection = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem',
}
const heading = {
  fontSize: 26, fontWeight: 700, margin: '0 0 4px',
  color: 'var(--sb-text, #0F172A)', letterSpacing: '-0.01em',
}
const subheading = {
  fontSize: 14.5, color: '#6B7280', margin: 0,
}
const cycleToggleRow = {
  display: 'flex', gap: 6,
  background: 'var(--sb-border-subtle, #F3F4F6)',
  borderRadius: 10, padding: 4, marginBottom: '1.75rem',
  width: 'fit-content',
}
const cycleBtn = {
  padding: '8px 20px', borderRadius: 8, border: '1px solid transparent',
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  transition: 'all 0.15s',
}
const banner = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '12px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 500,
  marginBottom: '1.75rem', border: '1px solid',
}
const grid = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
}
const card = {
  borderRadius: 18, border: '1px solid', overflow: 'hidden',
  background: 'var(--sb-bg, #fff)', display: 'flex', flexDirection: 'column',
  position: 'relative', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
}
const pill = {
  position: 'absolute', top: 14, right: 14, zIndex: 2,
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
  padding: '4px 10px', borderRadius: 999,
}
const cardTop = {
  padding: '1.6rem 1.25rem 1.2rem', textAlign: 'center',
}
const tierName = {
  fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.08em', color: '#6B7280', marginBottom: 6,
}
const priceRow = {
  marginBottom: 2, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2,
}
const price = {
  fontSize: 32, fontWeight: 700, color: 'var(--sb-text, #0F172A)', letterSpacing: '-0.02em',
}
const priceSub = {
  fontSize: 14, color: '#6B7280',
}
const nairaText = {
  fontSize: 12, color: '#6B7280', marginBottom: 4,
}
const discountBadge = {
  display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.04em', padding: '2px 8px', borderRadius: 999, marginBottom: 6,
}
const creditLine = {
  fontSize: 13.5, color: 'var(--sb-text, #0F172A)',
}
const featuresSection = {
  padding: '1.1rem 1.25rem', flex: 1,
}
const sectionLabel = {
  fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
  letterSpacing: '0.06em', color: '#9CA3AF', marginBottom: 4,
}
const featureRow = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0',
}
const checkIcon = {
  width: 20, height: 20, borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 11, fontWeight: 700, flexShrink: 0,
}
const actionArea = {
  padding: '0 1.25rem 1.25rem',
}
const actionBtn = {
  width: '100%', padding: '12px 0', borderRadius: 10,
  fontSize: 14, fontWeight: 600, textAlign: 'center',
  transition: 'opacity 0.15s',
}
const adminPanel = {
  marginTop: '2.5rem', padding: '1.25rem 1.5rem', borderRadius: 14,
  border: '1px solid #DDD6FE', background: '#FAF5FF',
}
const footer = {
  marginTop: '2rem', textAlign: 'center',
}
