import { useState, useEffect } from 'react'
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
  ToggleLeft, 
  ToggleRight,
  MapPin,
  ArrowRight
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

  return (
    <div className="flex flex-col min-h-screen w-full m-0 p-0 font-sans text-gray-900 dark:text-gray-100 dark:bg-gray-950">
      <div className="flex flex-col min-h-screen mx-auto pt-16 pb-8 w-full relative">
        {/* Iridescent Background Overlay */}
        <div className="fixed inset-0 w-screen h-screen -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-50 via-white to-purple-50 dark:from-purple-900/40 dark:via-gray-950 dark:to-purple-900/20" />

        {message && (
          <div className="flex justify-center mb-6 z-10">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border-[1.5px] border-gray-900 dark:border-gray-100 text-sm font-bold bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
              <ShieldCheck size={16} weight="fill" />
              <span>{message}</span>
            </div>
          </div>
        )}

        {/* Content Wrapper */}
        <div className="flex flex-col items-center w-full z-10 px-6">
          {/* Header Illustration */}
          <div className="flex flex-col items-center mb-8">
            <img src="/mascot.png" width="96" height="96" className="block mx-auto drop-shadow-md" alt="Mascot" />
          </div>

          <h1 className="font-serif text-[32px] text-gray-900 dark:text-white font-normal text-center mb-4 leading-tight">
            Unlock the full Luter experience
          </h1>
          
          <p className="text-center text-base text-gray-800 dark:text-gray-300 mb-8">
            Premium gives you unlimited learning, personalized tutoring, and more.
          </p>

          {/* Billing Cycle Selector */}
          <div className="flex justify-center mb-12">
            <div className="flex bg-black/5 dark:bg-white/10 rounded-full p-1">
              {currency === 'NGN' && (
                <button
                  onClick={() => setBillingCycle('weekly')}
                  className={`px-6 py-2 rounded-full font-bold text-sm cursor-pointer transition-all duration-200 ${billingCycle === 'weekly' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-transparent text-gray-900 dark:text-white'}`}
                >
                  Weekly
                </button>
              )}
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full font-bold text-sm cursor-pointer transition-all duration-200 ${billingCycle === 'monthly' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-transparent text-gray-900 dark:text-white'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full font-bold text-sm cursor-pointer transition-all duration-200 ${billingCycle === 'yearly' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-transparent text-gray-900 dark:text-white'}`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="flex flex-row justify-center items-end flex-wrap gap-5 w-full max-w-[1000px] pb-8">
            
            {currentPlansList.map(plan => {
              const isSelected = selectedPlanId === plan.id;
              const cycle = plan.cycles[billingCycle] || plan.cycles['monthly'];
              const isCurrentTier = plan.id === currentTier;

              return (
                <div key={plan.id} 
                  className={`relative flex-[1_1_280px] max-w-[320px] rounded-[20px] transition-all duration-200 cursor-${isCurrentTier ? 'default' : 'pointer'} ${isSelected ? 'p-[28px_4px_4px_4px] bg-[linear-gradient(86deg,#7491FF_-7.44%,#FF90E0_44.8%,#F7C325_102.54%)] -translate-y-1 shadow-[0_12px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_24px_rgba(0,0,0,0.5)]' : 'p-1 bg-black/5 dark:bg-white/10'}`}
                  onClick={() => !isCurrentTier && setSelectedPlanId(plan.id)}
                >
                  {isSelected && (
                    <div className="absolute -top-8 left-0 right-0 flex justify-center pointer-events-none">
                      <img src="/mascot.png" width="46" className="block drop-shadow-md" alt="Selected Mascot" />
                    </div>
                  )}
                  
                  {isSelected && (
                    <p className="absolute top-1 left-0 right-0 text-center text-[13px] font-extrabold text-gray-900 uppercase m-0">
                      {plan.badge ? plan.badge : 'SELECTED'}
                    </p>
                  )}
                  
                  <div className={`bg-white dark:bg-gray-900 rounded-[16px] flex flex-col items-center justify-center min-h-[120px] p-4 sm:p-5 shadow-[0_4px_10px_rgba(0,0,0,0.02)] ${isSelected ? 'border-none' : 'border border-black/10 dark:border-white/10'}`}>
                    <p className="text-[22px] font-bold m-0 text-gray-900 dark:text-white">{plan.name}</p>
                    <div className="flex items-center gap-1 mt-2 mb-2">
                      <span className="font-extrabold text-[18px] text-gray-900 dark:text-white">{cycle.price}</span>
                      <span className="text-[16px] text-gray-600 dark:text-gray-400">{cycle.sub}</span>
                    </div>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 m-0 text-center">{cycle.naira}</p>
                    {isCurrentTier && (
                       <div className="mt-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-3 py-1 rounded-full font-bold">Current Plan</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-4 max-w-[600px]">
            *Billed as one payment. Renews {billingCycle}. Cancel anytime. You can turn off auto-renew from your settings.
          </p>

        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 left-0 w-full p-6 flex justify-center items-center z-10 bg-gradient-to-t from-white via-white to-transparent dark:from-gray-950 dark:via-gray-950">
          <button 
            disabled={submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free'}
            onClick={() => handleUpgrade(selectedPlanId)}
            onMouseDown={(e) => {
               if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
               e.currentTarget.querySelector('span[data-face]').style.transform = 'translateY(0)';
               e.currentTarget.querySelector('span[data-face]').style.boxShadow = 'none';
            }}
            onMouseUp={(e) => {
               if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
               e.currentTarget.querySelector('span[data-face]').style.transform = 'translateY(-4px)';
               e.currentTarget.querySelector('span[data-face]').style.boxShadow = '0 4px 0 0 #A78BFA';
            }}
            onMouseLeave={(e) => {
               if(submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') return;
               e.currentTarget.querySelector('span[data-face]').style.transform = 'translateY(-4px)';
               e.currentTarget.querySelector('span[data-face]').style.boxShadow = '0 4px 0 0 #A78BFA';
            }}
            style={{
              padding: 0,
              border: 'none',
              background: 'transparent',
              position: 'relative',
              width: '100%',
              maxWidth: '358px',
              borderRadius: '56px',
              cursor: (submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') ? 'not-allowed' : 'pointer',
              opacity: (submitting !== null || selectedPlanId === currentTier || selectedPlanId === 'free') ? 0.6 : 1
            }}
          >
            <span data-face="true" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '14px 24px',
              borderRadius: '60px',
              background: '#C4B5FD',
              color: '#1a1a1a',
              fontSize: '16px',
              fontWeight: 700,
              border: '1.5px solid #1a1a1a',
              transform: 'translateY(-4px)',
              boxShadow: '0 4px 0 0 #A78BFA',
              transition: 'transform 0.1s cubic-bezier(0,0,0.2,1), box-shadow 0.1s cubic-bezier(0,0,0.2,1)'
            }}>
              {submitting !== null ? 'Processing...' : 'Subscribe now'}
            </span>
          </button>
        </div>

        {/* Admin Debug Toggle */}
        {isAdmin && !loadingSettings && (
          <div className="mt-auto p-6 flex justify-center">
            <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-6 py-3 rounded-2xl">
              <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">Admin: Mode [{paymentMode}]</span>
              <button onClick={togglePaymentMode} className="bg-transparent border-none cursor-pointer text-gray-900 dark:text-gray-100">
                {paymentMode === 'live' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
