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

      paystack.newTransaction({
        key: publicKey,
        email: user.email,
        amount: Number(cycle.amount) * 100, // Paystack expects amount in cents / kobo
        currency: currency,
        ref: data.reference,
        metadata: { plan_id: paystackPlanId, user_id: user.id, source: 'upgrade_page' },
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
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fff',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Overlay background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 100%), #F3F4F6',
        zIndex: -1,
      }} />

      {/* Scrollable Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100dvh',
        overflowY: 'auto',
        paddingTop: '48px',
        margin: '0 auto',
        maxWidth: '1142px',
        alignItems: 'center',
        position: 'relative'
      }}>
        
        {/* Close Button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            zIndex: 50
          }}
        >
          <X size={24} weight="bold" />
        </button>

        {message && (
          <div className="flex justify-center mb-6 z-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border-[1.5px] border-gray-900 dark:border-gray-100 text-sm font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm">
              <ShieldCheck size={16} weight="fill" />
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Content Wrapper */}
        <div className="flex flex-col items-center w-full z-10 px-6" style={{ paddingBottom: '100px', paddingTop: '24px' }}>
          {/* Header Illustration */}
          <div className="flex flex-col items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="194" height="140" viewBox="0 0 194 140" fill="none" style={{ flexShrink: 0, height: 'auto', width: '211px', marginBottom: '16px' }}>
              <g clipPath="url(#clip0_1078_116898)">
                <g opacity="0.8">
                  <mask id="mask0_1078_116898" maskUnits="userSpaceOnUse" x="90" y="9" width="99" height="127" style={{ maskType: 'alpha' }}>
                    <path d="M90.166 135.855L90.166 9.59658L173.6 29.9331L172.945 81.1709L187.538 107.273C189.05 109.976 187.544 113.374 184.527 114.071L90.166 135.855Z" fill="url(#paint0_linear_1078_116898)"></path>
                  </mask>
                  <g mask="url(#mask0_1078_116898)">
                    <path opacity="0.5" d="M90.166 135.855L90.166 9.59658L173.6 29.946L172.945 81.1709L186.253 107.301C187.621 109.987 186.111 113.244 183.177 113.936L90.166 135.855Z" fill="url(#paint1_linear_1078_116898)"></path>
                  </g>
                </g>
                <path fillRule="evenodd" clipRule="evenodd" d="M187.365 60.5552C188.238 59.2183 188.283 57.5033 187.482 56.1224L175.209 34.9836C174.453 33.681 173.06 32.8794 171.554 32.8794L148.873 32.8794C147.311 32.8794 145.876 33.7409 145.143 35.1197L133.659 56.6943C132.947 58.0304 133.005 59.6448 133.81 60.9268L144.436 77.8534C145.236 79.1278 145.298 80.7316 144.599 82.064L132.853 104.445C131.376 107.259 133.417 110.635 136.595 110.635H183.72C186.898 110.635 188.939 107.259 187.462 104.445L175.8 82.2231C175.088 80.8665 175.166 79.231 176.004 77.9483L187.365 60.5552Z" fill="url(#paint2_linear_1078_116898)"></path>
                <path fillRule="evenodd" clipRule="evenodd" d="M148.653 110.631C145.621 110.518 143.673 107.309 145.022 104.552L156.281 81.5324C156.909 80.249 156.845 78.7353 156.113 77.5087L146.173 60.8676C145.414 59.5962 145.375 58.02 146.072 56.713L157.583 35.1144C158.317 33.7368 159.751 32.8761 161.312 32.876L148.862 32.876C147.307 32.876 145.877 33.73 145.14 35.0994L133.658 56.4376C132.948 57.7576 132.99 59.3551 133.769 60.6359L143.915 77.3199C144.668 78.5573 144.734 80.0938 144.091 81.3916L132.63 104.53C131.239 107.338 133.282 110.631 136.417 110.631H148.653Z" fill="#E05FBC"></path>
                <mask id="mask1_1078_116898" maskUnits="userSpaceOnUse" x="132" y="32" width="30" height="79" style={{ maskType: 'alpha' }}>
                  <path fillRule="evenodd" clipRule="evenodd" d="M161.306 32.876C159.748 32.8761 158.317 33.7326 157.582 35.1049L146.085 56.5453C145.382 57.8574 145.42 59.4429 146.187 60.719L156.866 78.4885C157.603 79.7157 157.669 81.233 157.041 82.5196L146.283 104.551C144.912 107.359 146.956 110.632 150.08 110.632H136.593C133.415 110.632 131.374 107.256 132.851 104.442L144.404 82.4278C145.087 81.1251 145.044 79.5608 144.29 78.2977L133.737 60.6226C132.975 59.3459 132.94 57.7627 133.645 56.4534L145.138 35.0991C145.875 33.7299 147.304 32.876 148.859 32.876L161.306 32.876Z" fill="#B78900"></path>
                </mask>
                <g mask="url(#mask1_1078_116898)">
                  <rect x="127.053" y="30.6768" width="39.802" height="11.4608" fill="url(#paint3_linear_1078_116898)"></rect>
                  <rect x="127.053" y="56.9751" width="39.802" height="25.184" fill="#FF6BD5"></rect>
                  <rect x="127.053" y="81.1445" width="39.802" height="31.6041" fill="url(#paint4_linear_1078_116898)"></rect>
                  <rect x="127.053" y="81.1445" width="39.802" height="12.7707" fill="#BF51A0"></rect>
                </g>
                <mask id="mask3_1078_116898" maskUnits="userSpaceOnUse" x="14" y="29" width="174" height="82" style={{ maskType: 'alpha' }}>
                  <path d="M174.822 83.279L180.309 94.511L113.445 110.532H14.6875V30.01L157.813 29.6465L179.387 43.5496L184.031 51.6602L186.732 56.6077C187.421 57.8685 187.37 59.4035 186.601 60.6164L175.072 78.7903C174.214 80.1416 174.12 81.8411 174.822 83.279Z" fill="#D9D9D9"></path>
                </mask>
                <g mask="url(#mask3_1078_116898)">
                  <g clipPath="url(#clip1_1078_116898)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M87.3489 85.3906H69.8538L61.1067 70.2402L69.8538 55.0889H87.3489L94.0139 66.6336H131.675L136.182 80.4922L138.537 87.7358H138.538L138.541 87.7446L138.557 87.7358H159.512L155.11 74.0871L152.789 66.6336H159.425L160.14 68.8494L166.23 87.7358H177.104C181.994 87.7358 185.537 83.0735 184.227 78.362L178.405 57.412C177.636 54.6449 175.116 52.73 172.244 52.73H111.416L103.755 39.4609C101.542 35.628 97.5111 33.2201 93.1077 33.0732L92.68 33.0664L64.5227 33.0664C59.9541 33.0666 55.7329 35.5044 53.4485 39.4609L39.3694 63.8457C37.0853 67.8024 37.0851 72.6772 39.3694 76.6338L53.4485 101.019C55.7329 104.975 59.9542 107.412 64.5228 107.412L92.68 107.412L93.1077 107.405C97.511 107.258 101.542 104.851 103.755 101.019L111.424 87.7358H131.687L126.906 73.0282H94.4864L87.3489 85.3906Z" fill="#456DFF"></path>
                    <mask id="mask4_1078_116898" maskUnits="userSpaceOnUse" x="37" y="33" width="148" height="75" style={{ maskType: 'alpha' }}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M87.3489 85.3901H69.8538L61.1067 70.2397L69.8538 55.0884H87.3489L94.0139 66.6331H131.675L136.182 80.4917L138.537 87.7353H138.538L138.541 87.7441L138.557 87.7353H159.512L155.11 74.0866L152.789 66.6331H159.425L160.14 68.849L166.23 87.7353H177.104C181.994 87.7353 185.537 83.0731 184.227 78.3615L178.405 57.4115C177.636 54.6444 175.116 52.7295 172.244 52.7295H111.416L103.755 39.4604C101.542 35.6275 97.5111 33.2196 93.1077 33.0728L92.68 33.0659L64.5227 33.0659C59.9541 33.0661 55.7329 35.5039 53.4485 39.4605L39.3694 63.8452C37.0853 67.8019 37.0851 72.6767 39.3694 76.6333L53.4485 101.018C55.7329 104.974 59.9542 107.411 64.5228 107.412L92.68 107.412L93.1077 107.405C97.511 107.258 101.542 104.851 103.755 101.018L111.424 87.7353H131.687L126.906 73.0277H94.4864L87.3489 85.3901Z" fill="#F7C325"></path>
                    </mask>
                    <g mask="url(#mask4_1078_116898)">
                      <rect x="41.8672" y="24.311" width="45.9659" height="17.5447" fill="#7491FF"></rect>
                      <rect x="33.959" y="70.2891" width="45.9659" height="10.7454" fill="#FF90E0"></rect>
                    </g>
                    <path fillRule="evenodd" clipRule="evenodd" d="M97.4798 85.3901H79.9847L71.2376 70.2397L79.9847 55.0884H97.4798L104.145 66.6334H141.802L148.669 87.7441L148.684 87.7353H169.643L165.154 73.8169L162.917 66.6334H169.556L170.27 68.8492L176.361 87.7353H187.234C192.125 87.7353 195.668 83.0731 194.358 78.3615L188.536 57.4115C187.767 54.6444 185.247 52.7295 182.375 52.7295H121.547L113.886 39.4604C111.673 35.6275 107.642 33.2196 103.239 33.0728L102.811 33.0659L74.6536 33.0659C70.0849 33.0661 65.8637 35.5039 63.5794 39.4605L49.5003 63.8452C47.2161 67.8019 47.216 72.6767 49.5003 76.6333L63.5794 101.018C65.8638 104.974 70.0851 107.411 74.6536 107.412L102.811 107.412L103.239 107.405C107.642 107.258 111.673 104.851 113.886 101.018L121.555 87.7353H141.818L137.037 73.028H104.617L97.4798 85.3901Z" fill="url(#paint11_linear_1078_116898)"></path>
                  </g>
                  <path d="M78.5449 34.6914H106.492C110.385 34.6914 113.974 36.7939 115.877 40.1893L123.78 54.2843H169.065" stroke="#DAE2FF" strokeWidth="3.0742"></path>
                  <path d="M151.334 54.2843H123.774L115.804 40.0681C113.942 36.7475 110.432 34.6914 106.625 34.6914V34.6914H94.1875" stroke="#FEF9E9" strokeWidth="3.0742"></path>
                </g>
                <path d="M71.5253 6.6167L72.9447 12.2655L78.5936 13.685L72.9447 15.1044L71.5253 20.7532L70.1059 15.1044L64.457 13.685L70.1059 12.2655L71.5253 6.6167Z" fill="url(#paint16_linear_1078_116898)"></path>
                <defs>
                  <linearGradient id="paint0_linear_1078_116898" x1="94.9248" y1="72.7258" x2="145.192" y2="72.7258" gradientUnits="userSpaceOnUse"><stop stopOpacity="0"></stop><stop offset="1"></stop></linearGradient>
                  <linearGradient id="paint1_linear_1078_116898" x1="90.166" y1="72.7258" x2="182.802" y2="72.7258" gradientUnits="userSpaceOnUse"><stop stopColor="#9D62FF" stopOpacity="0"></stop><stop offset="0.68" stopColor="#9D62FF"></stop><stop offset="1" stopColor="#9D62FF"></stop></linearGradient>
                  <linearGradient id="paint2_linear_1078_116898" x1="161.623" y1="71.7572" x2="182.343" y2="78.2731" gradientUnits="userSpaceOnUse"><stop stopColor="#381D66"></stop><stop offset="1" stopColor="#170B29"></stop></linearGradient>
                  <linearGradient id="paint3_linear_1078_116898" x1="149.251" y1="39.283" x2="149.251" y2="32.418" gradientUnits="userSpaceOnUse"><stop stopColor="#9E2E9E"></stop><stop offset="1" stopColor="#5A2EA3"></stop></linearGradient>
                  <linearGradient id="paint4_linear_1078_116898" x1="155.169" y1="96.9466" x2="155.406" y2="110.774" gradientUnits="userSpaceOnUse"><stop stopColor="#9E2E9E"></stop><stop offset="1" stopColor="#5A2EA3"></stop></linearGradient>
                  <linearGradient id="paint11_linear_1078_116898" x1="117.929" y1="36.2272" x2="40.8792" y2="162.783" gradientUnits="userSpaceOnUse"><stop stopColor="#ABBDFF"></stop><stop offset="0.33" stopColor="#F7C325"></stop><stop offset="0.670599" stopColor="#E350E3"></stop></linearGradient>
                  <linearGradient id="paint16_linear_1078_116898" x1="78.055" y1="6.16179" x2="63.9876" y2="10.2501" gradientUnits="userSpaceOnUse"><stop stopColor="white"></stop><stop offset="0.206264" stopColor="#456DFF"></stop><stop offset="0.525" stopColor="#D2B7FF"></stop><stop offset="0.725502" stopColor="#F7C325"></stop><stop offset="1" stopColor="white"></stop></linearGradient>
                  <clipPath id="clip0_1078_116898"><rect width="99.3098" height="127.201" fill="white" transform="translate(93.8457 9.02637)"></rect></clipPath>
                  <clipPath id="clip1_1078_116898"><rect width="156.973" height="156.973" fill="white" transform="translate(37.6562 -8.23096)"></rect></clipPath>
                </defs>
              </g>
            </svg>
          </div>

          <h1 style={{
              fontSize: '50px',
              fontWeight: 500,
              letterSpacing: '-0.5px',
              lineHeight: '110%',
              textAlign: 'center',
              marginBottom: '16px',
              maxWidth: '784px',
              color: '#1a1a1a',
              fontFamily: 'coFoRobertFont, Georgia, serif',
            }}>
            Unlock the full Luter experience
          </h1>
          
          <p style={{
              textAlign: 'center',
              fontSize: '18px',
              color: '#1a1a1a',
              marginBottom: '32px'
            }}>
            Premium gives you unlimited learning, personalized tutoring, and more.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
            <div className="flex gap-8">
              {currency === 'NGN' && (
                <button
                  onClick={() => setBillingCycle('weekly')}
                  className={`font-bold text-sm cursor-pointer transition-all duration-200 ${billingCycle === 'weekly' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}
                  style={{ background: 'transparent', border: 'none' }}
                >
                  Weekly
                </button>
              )}
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`font-bold text-sm cursor-pointer transition-all duration-200 ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}
                style={{ background: 'transparent', border: 'none' }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`font-bold text-sm cursor-pointer transition-all duration-200 ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}
                style={{ background: 'transparent', border: 'none' }}
              >
                Yearly
              </button>
            </div>
          </div>

          <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '20px',
              width: '100%',
              maxWidth: '990px',
              padding: '0 24px',
              paddingBottom: '32px'
            }}>
            
            {currentPlansList.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              const cycle = plan.cycles[billingCycle] || plan.cycles['monthly'];
              const isCurrentTier = plan.id === currentTier;

              return (
                <div key={plan.id} style={{ position: 'relative', flex: 1, width: '100%' }}>
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '-25px',
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      zIndex: 10
                    }}>
                      <img src="/mascot.png" alt="Lumii" width="50" height="50" style={{ transform: 'translateY(-6px)' }} />
                    </div>
                  )}
                  <div 
                    style={{
                      position: 'relative',
                      width: '100%',
                      padding: isSelected ? '24px 4px 4px 4px' : '4px',
                      borderRadius: '20px',
                      background: isSelected ? 'linear-gradient(86deg, #7491FF -7.44%, #FF90E0 44.8%, #F7C325 102.54%)' : 'rgba(0,0,0,0.06)',
                      cursor: 'pointer',
                      zIndex: 11
                    }}
                    onClick={() => !isCurrentTier && setSelectedPlanId(plan.id)}
                  >
                    {isSelected && (
                      <p style={{
                        position: 'absolute',
                        top: '4px',
                        left: '0',
                        right: '0',
                        textAlign: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#1a1a1a',
                        margin: 0
                      }}>
                        {plan.badge || 'MOST POPULAR'}
                      </p>
                    )}
                    <div style={{
                      background: '#fff',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '120px',
                      padding: '12px 16px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
                    }}>
                      <p style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1a1a1a' }}>{plan.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#1a1a1a' }}>{cycle.price}</span>
                        <span style={{ fontSize: '16px', color: '#666' }}>{cycle.sub}</span>
                      </div>
                      {cycle.naira && cycle.naira !== cycle.price && cycle.naira !== '$0' && cycle.naira !== '₦0' && (
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '4px', margin: '4px 0 0 0' }}>{cycle.naira}</p>
                      )}
                      {isCurrentTier && (
                        <div className="mt-2 bg-slate-200 text-slate-700 text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                          Current Plan
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{
            textAlign: 'center',
            fontSize: '13px',
            color: '#666',
            maxWidth: '690px',
            padding: '16px',
            marginBottom: '100px'
          }}>
            *Billed as one payment. Renews {billingCycle}. Cancel anytime. You can turn off auto-renew from your settings.
          </p>
        </div>

        {/* Footer */}
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 30%)',
            padding: '40px 20px 20px',
            display: 'flex',
            justifyContent: 'center',
            zIndex: 100
          }}>
            <button
              className="btn3d"
              disabled={submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free'}
              onClick={() => handleUpgrade(selectedPlanId)}
              style={{
                display: 'inline-flex',
                position: 'relative',
                borderRadius: '9999px',
                border: 'none',
                background: 'transparent',
                cursor: (submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') ? 'not-allowed' : 'pointer',
                outline: 'none',
                padding: 0,
                width: '100%',
                maxWidth: '358px',
                WebkitTapHighlightColor: 'transparent',
                opacity: (submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') ? 0.6 : 1
              }}
              onMouseDown={e => {
                if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
                const face = e.currentTarget.querySelector('[data-face]');
                face.style.transform = 'none';
                face.style.boxShadow = 'none';
              }}
              onMouseUp={e => {
                if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
                const face = e.currentTarget.querySelector('[data-face]');
                face.style.transform = 'translateY(-4px)';
                face.style.boxShadow = '0 4px 0 0 #A78BFA';
              }}
              onMouseLeave={e => {
                if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
                const face = e.currentTarget.querySelector('[data-face]');
                face.style.transform = 'translateY(-4px)';
                face.style.boxShadow = '0 4px 0 0 #A78BFA';
              }}
            >
              <span
                data-face="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '14px 32px',
                  borderRadius: '9999px',
                  background: '#C4B5FD',
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '16px',
                  fontFamily: 'Outfit, sans-serif',
                  position: 'relative',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 4px 0 0 #A78BFA',
                  transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
                }}
              >
                {submitting !== null ? 'Processing...' : 'Subscribe now'}
              </span>
            </button>
        </div>

        {/* Admin Debug Toggle */}
        {isAdmin && !loadingSettings && (
          <div className="mt-auto p-6 flex justify-center z-[110] relative">
            <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-6 py-3 rounded-2xl">
              <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Admin: Mode [{paymentMode}]</span>
              <button onClick={togglePaymentMode} className="bg-transparent border-none cursor-pointer text-gray-900 dark:text-gray-100">
                {paymentMode === 'live' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
