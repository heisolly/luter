import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PaystackPop from '@paystack/inline-js';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkle, ShieldCheck, Check, ShieldWarning
} from '@phosphor-icons/react';
import GlareHover from './ui/GlareHover';

export default function StandalonePricingPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(null); // 'starter' or 'beast' depending on active checkout
  const [errorMsg, setErrorMsg] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'

  // Check auth session and fetch user profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
          .then(({ data }) => {
            if (data) setUserProfile(data);
          });
      }
    });
  }, []);

  const isCurrentPlanActive = userProfile?.subscription_tier === 'premium';

  // Dynamic pricing settings for Beast Plan
  const getBeastPlanDetails = () => {
    switch (billingCycle) {
      case 'quarterly':
        return {
          id: 'beast_quarterly',
          priceText: '9,599.9',
          periodText: '/4 months',
          billingText: 'Billed quarterly at ₦9,599.9 (save 20%)',
          amount: 9599.9,
          badge: 'Save 20%'
        };
      case 'yearly':
        return {
          id: 'beast_yearly',
          priceText: '28,800',
          periodText: '/year',
          billingText: 'Billed yearly at ₦28,800 (equivalent to ₦2,400/mo)',
          amount: 28800,
          badge: 'Save 20%'
        };
      case 'monthly':
      default:
        return {
          id: 'beast_monthly',
          priceText: '2,999.9',
          periodText: '/month',
          billingText: 'Billed monthly at ₦2,999.9/mo',
          amount: 2999.9,
          badge: null
        };
    }
  };

  const beastPlan = getBeastPlanDetails();

  const starterPlan = {
    id: 'starter',
    priceText: '999.9',
    periodText: '/first 2 Weeks',
    billingText: '₦2,999.9 auto-renewal subsequent months',
    amount: 999.9,
    badge: 'Save 70%'
  };

  const handleCheckout = async (plan, planTypeKey) => {
    if (!user) {
      navigate('/signin?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setLoadingCheckout(planTypeKey);
    setErrorMsg('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        navigate('/signin?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }
      
      const amount = plan.amount;
      const currency = 'NGN';
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-paystack-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          planId: plan.id,
          amount: amount,
          email: user.email,
          currency: currency,
          callback_url: `${window.location.origin}/dashboard/payment/success`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }

      const data = await response.json();
      const paystack = new PaystackPop();
      
      paystack.newTransaction({
        key: data.publicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: Number(amount) * 100,
        currency: currency,
        ref: data.reference,
        metadata: {
          plan_id: plan.id,
          user_id: user.id,
          source: 'upgrade_page',
          timestamp: new Date().toISOString(),
        },
        onSuccess: (transaction) => {
          setLoadingCheckout(null);
          navigate(`/dashboard/payment/success?reference=${transaction.reference}`);
        },
        onCancel: () => {
          setLoadingCheckout(null);
        },
        onError: (error) => {
          setLoadingCheckout(null);
          setErrorMsg(error.message || 'Payment processing failed.');
        },
      });

    } catch (err) {
      setErrorMsg(err.message || 'Checkout failed. Please try again.');
      setLoadingCheckout(null);
    }
  };

  const planFeatures = [
    "Unlimited manual creation",
    "Unlimited AI quiz maker",
    "Unlimited AI flashcards maker",
    "Unlimited study game auto generation",
    "Unlimited AI Lesson auto generation",
    "Unlimited AI quiz generator",
    "Unlimited quiz participation",
    "Unlimited study sets sharing",
    "Study streak tracking",
    "Study Group collaboration",
    "Live Boards"
  ];

  return (
    <div className="pricing-page-container">
      {/* PUBLIC NAVBAR HEADER */}
      <motion.header 
        className="upg-navbar"
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="upg-navbar-inner">
          <div className="upg-logo-box" onClick={() => navigate('/')}>
            <div className="upg-logo-icon">L</div>
            <span className="upg-logo-text">luter<span style={{ color: '#ef4444' }}>.</span></span>
          </div>
          
          <nav className="upg-nav-links">
            <span onClick={() => navigate('/features')}>Features</span>
            <span onClick={() => navigate('/how-it-works')}>How it works</span>
            <span onClick={() => navigate('/about')}>About</span>
          </nav>

          <div className="upg-nav-actions">
            {user ? (
              <button className="upg-nav-dash-btn" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </button>
            ) : (
              <>
                <button className="upg-nav-sign-btn" onClick={() => navigate('/signin')}>
                  Sign In
                </button>
                <button className="upg-nav-up-btn" onClick={() => navigate('/signup')}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      <motion.div 
        className="luter-pricing-root"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
      >
        
        {/* HEADER SECTION */}
        <div className="pricing-title-wrap text-center">
          <h1>Select Your Plan</h1>
          <p>Get instant access to AI quiz creation, study guides, and shared workspaces.</p>
        </div>

        {/* BILLING CYCLES SELECTOR */}
        <div className="billing-cycle-selector-container">
          <div className="billing-cycle-selector">
            <button 
              className={`cycle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`cycle-btn ${billingCycle === 'quarterly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('quarterly')}
            >
              Quarterly
              <span className="save-mini">Save 20%</span>
            </button>
            <button 
              className={`cycle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly
              <span className="save-mini">Save 20%</span>
            </button>
          </div>
          <div className="cancel-policy-note">
            <span>✓ Cancel Anytime</span>
            <span>✓ Credit Rollover Enabled</span>
          </div>
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              className="checkout-error-banner"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ShieldWarning size={16} weight="fill" />
              <span>{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CARDS CONTAINER */}
        <div className="pricing-cards-grid">
          
          {/* STARTER PLAN - Electric Border & Glare Hover Animation */}
          <div className="starter-card-outer">
            <div className="starter-card-glow-line"></div>
            <GlareHover
              width="100%"
              height="100%"
              background="#ffffff"
              borderRadius="16px"
              borderColor="transparent"
              glareColor="#ffffff"
              glareOpacity={0.25}
              glareAngle={-30}
              glareSize={250}
              className="pricing-card-panel starter-card"
            >
              <div className="card-top-badge starter-badge">
                {starterPlan.badge}
              </div>

              <div className="card-header-info">
                <h3>Starter Plan</h3>
                <div className="price-tag-wrap">
                  <span className="currency">₦</span>
                  <span className="amount">{starterPlan.priceText}</span>
                  <span className="period">{starterPlan.periodText}</span>
                </div>
                <p className="renewal-subtext">{starterPlan.billingText}</p>
              </div>

              <div className="card-cta-section">
                <motion.button 
                  className="pricing-action-btn starter-btn"
                  onClick={() => handleCheckout(starterPlan, 'starter')}
                  disabled={loadingCheckout !== null || isCurrentPlanActive}
                  whileHover={{ scale: (loadingCheckout || isCurrentPlanActive) ? 1 : 1.01 }}
                  whileTap={{ scale: (loadingCheckout || isCurrentPlanActive) ? 1 : 0.99 }}
                >
                  {loadingCheckout === 'starter' ? (
                    <div className="spinner-loader"></div>
                  ) : isCurrentPlanActive ? (
                    <span>Current Plan Active</span>
                  ) : (
                    <div className="btn-inner-flex">
                      <span>Activate</span>
                      <span className="slots-left">Only 163 Slots left</span>
                    </div>
                  )}
                </motion.button>
              </div>

              <div className="card-features-section">
                <h4>WHAT'S INCLUDED:</h4>
                <ul className="features-checklist">
                  {planFeatures.map((feature, i) => (
                    <li key={i}>
                      <Check size={14} weight="bold" className="chk-icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </GlareHover>
          </div>

          {/* BEAST PLAN - Clean dynamic color accents & Lavender Pill button */}
          <div className="beast-card-outer">
            <motion.div 
              className="pricing-card-panel beast-card premium-recommended"
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
            >
              <div className="card-top-badge beast-badge-glow">
                ★ Recommended
              </div>

              <div className="card-header-info">
                <div className="beast-icon-badge">
                  <Sparkle size={14} weight="fill" />
                  <span>BEAST MODE</span>
                </div>
                <h3>Beast Plan</h3>
                <div className="price-tag-wrap">
                  <span className="currency">₦</span>
                  <span className="amount">{beastPlan.priceText}</span>
                  <span className="period">{beastPlan.periodText}</span>
                </div>
                <p className="renewal-subtext">{beastPlan.billingText}</p>
              </div>

              <div className="card-cta-section">
                <motion.button 
                  className="pricing-action-btn beast-btn"
                  onClick={() => handleCheckout(beastPlan, 'beast')}
                  disabled={loadingCheckout !== null || isCurrentPlanActive}
                  whileHover={{ scale: (loadingCheckout || isCurrentPlanActive) ? 1 : 1.01 }}
                  whileTap={{ scale: (loadingCheckout || isCurrentPlanActive) ? 1 : 0.99 }}
                >
                  {loadingCheckout === 'beast' ? (
                    <div className="spinner-loader"></div>
                  ) : isCurrentPlanActive ? (
                    <span>Current Plan Active</span>
                  ) : (
                    <span>Go Premium</span>
                  )}
                </motion.button>
              </div>

              <div className="card-features-section">
                <h4>WHAT'S INCLUDED:</h4>
                <ul className="features-checklist">
                  {planFeatures.map((feature, i) => (
                    <li key={i}>
                      <Check size={14} weight="bold" className="chk-icon" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>

        </div>

        <div className="secured-payment-footer">
          <ShieldCheck size={14} weight="bold" />
          <span>Payments secured via Paystack. Subscription credits preserve and roll over automatically upon renewals.</span>
        </div>
      </motion.div>

      <style>{`
        .pricing-page-container {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 100px 24px 40px; /* clear fixed header */
          background: #fcfbfe;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        /* PUBLIC NAVBAR HEADER */
        .upg-navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 72px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #f1f5f9;
          z-index: 1000;
          display: flex;
          align-items: center;
        }

        .upg-navbar-inner {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .upg-logo-box {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .upg-logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #ef4444, #4f46e5); /* Red/Lavender gradient */
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
        }

        .upg-logo-text {
          font-size: 20px;
          font-weight: 800;
          color: #0b0416;
          letter-spacing: -0.02em;
        }

        .upg-nav-links {
          display: flex;
          gap: 32px;
        }

        .upg-nav-links span {
          font-size: 14.5px;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: color 0.2s;
        }

        .upg-nav-links span:hover {
          color: #4f46e5; /* Lavender hover */
        }

        .upg-nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .upg-nav-dash-btn {
          padding: 10px 22px;
          border-radius: 99px;
          border: none;
          background: #0b0416;
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upg-nav-dash-btn:hover {
          background: #1e1131;
          transform: translateY(-1px);
        }

        .upg-nav-sign-btn {
          font-size: 14.5px;
          font-weight: 700;
          color: #475569;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 10px 16px;
        }

        .upg-nav-sign-btn:hover {
          color: #4f46e5;
        }

        .upg-nav-up-btn {
          padding: 10px 22px;
          border-radius: 99px;
          border: none;
          background: #4f46e5; /* Lavender/Indigo */
          color: #ffffff;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upg-nav-up-btn:hover {
          background: #3730a3;
          transform: translateY(-1px);
        }

        .luter-pricing-root {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        /* HEADER */
        .pricing-title-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .pricing-title-wrap h1 {
          font-size: 32px;
          font-weight: 800;
          color: #1e1b4b;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .pricing-title-wrap p {
          font-size: 14px;
          color: #64748b;
          max-width: 580px;
          line-height: 1.45;
          margin: 0;
          text-align: center;
        }

        /* TOGGLE SELECTOR */
        .billing-cycle-selector-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .billing-cycle-selector {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px; /* Not too round! */
          padding: 4px;
          display: flex;
          gap: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .cycle-btn {
          padding: 8px 18px;
          border-radius: 8px; /* Not too round! */
          border: none;
          background: transparent;
          font-size: 13.5px;
          font-weight: 700;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cycle-btn.active {
          background: #1e1b4b; /* Lavender dark */
          color: #ffffff;
        }

        .save-mini {
          font-size: 9px;
          padding: 1px 5px;
          border-radius: 4px;
          background: #dcfce7;
          color: #15803d;
          font-weight: 800;
        }

        .cycle-btn.active .save-mini {
          background: #15803d;
          color: #ffffff;
        }

        .cancel-policy-note {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #475569;
          font-weight: 600;
        }

        /* GRID CARDS */
        .pricing-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          width: 100%;
          max-width: 860px;
        }

        .pricing-card-panel {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px; /* Not too round! */
          padding: 28px 24px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100%;
          background-clip: padding-box;
        }

        /* Override GlareHover layout inside panel */
        .glare-hover.pricing-card-panel {
          display: flex !important;
          place-items: unset !important;
          text-align: left;
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }

        /* ELECTRIC BORDER - Conic Rotating Gradient */
        .starter-card-outer {
          position: relative;
          padding: 2px;
          border-radius: 16px; /* Not too round! */
          overflow: hidden;
          background: #e2e8f0;
        }

        .starter-card-outer::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(
            from 0deg,
            transparent 15%,
            #22c55e 35%, /* Beautiful Green */
            #ef4444 55%, /* Bright Red */
            #a5b4fc 75%, /* Lavender */
            transparent 100%
          );
          animation: rotateElectric 4s linear infinite;
          z-index: 0;
        }

        .starter-card-outer .pricing-card-panel {
          position: relative;
          z-index: 1;
          border: none;
          background: #ffffff;
        }

        @keyframes rotateElectric {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* BEAST CARD - Sleek gradient outline */
        .beast-card-outer {
          position: relative;
          padding: 2px;
          border-radius: 16px; /* Not too round! */
          overflow: hidden;
          background: linear-gradient(135deg, #a5b4fc, #ef4444, #22c55e); /* Lavender, Red, Green */
        }

        .beast-card-outer .pricing-card-panel {
          position: relative;
          z-index: 1;
          border: none;
          background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
        }

        /* CARD LABELS & BADGES */
        .card-top-badge {
          position: absolute;
          top: 18px;
          right: 20px;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 6px; /* Not too round! */
          z-index: 10;
        }

        .starter-badge {
          background: #dcfce7;
          color: #15803d;
        }

        .beast-badge-glow {
          top: -12px;
          left: 50%;
          right: auto;
          transform: translateX(-50%);
          background: #ef4444; /* Premium red recommendation badge */
          color: #ffffff;
          font-size: 11.5px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
          letter-spacing: 0.02em;
        }

        .beast-icon-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          color: #4f46e5; /* Lavender icon theme */
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }

        .card-header-info h3 {
          font-size: 22px;
          font-weight: 800;
          color: #1e1b4b;
          margin: 0 0 4px 0;
        }

        .price-tag-wrap {
          display: flex;
          align-items: baseline;
        }

        .price-tag-wrap .currency {
          font-size: 18px;
          font-weight: 800;
          color: #1e1b4b;
          margin-right: 1px;
        }

        .price-tag-wrap .amount {
          font-size: 38px;
          font-weight: 900;
          color: #1e1b4b;
          letter-spacing: -0.02em;
          line-height: 1;
        }

        .price-tag-wrap .period {
          font-size: 13.5px;
          font-weight: 600;
          color: #64748b;
          margin-left: 2px;
        }

        .renewal-subtext {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin: 5px 0 0 0;
          line-height: 1.35;
        }

        /* BUTTONS */
        .pricing-action-btn {
          width: 100%;
          height: 46px;
          border-radius: 8px; /* Not too round! */
          border: none;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .starter-btn {
          background: #1e1b4b;
          color: #ffffff;
        }

        .starter-btn:hover {
          background: #2e2a72;
          box-shadow: 0 4px 12px rgba(30, 27, 75, 0.2);
        }

        /* Go Premium pill effect lavender button */
        .beast-btn {
          background: linear-gradient(90deg, #a78bfa, #6366f1); /* Exquisite Lavender/Indigo gradient */
          color: #ffffff;
          border-radius: 99px; /* Pill effect! */
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
        }

        .beast-btn:hover {
          background: linear-gradient(90deg, #8b5cf6, #4f46e5);
          box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35);
        }

        .pricing-action-btn:disabled {
          background: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-inner-flex {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .slots-left {
          font-size: 10px;
          background: rgba(255, 255, 255, 0.15);
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
        }

        /* FEATURES SECTION */
        .card-features-section {
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
        }

        .card-features-section h4 {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: #64748b;
          margin: 0 0 10px 0;
        }

        .features-checklist {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .features-checklist li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 12.5px;
          font-weight: 500;
          color: #334155;
          line-height: 1.35;
        }

        .chk-icon {
          color: #22c55e; /* Green checkmarks */
          margin-top: 1px;
          flex-shrink: 0;
        }

        /* FOOTER INFO */
        .secured-payment-footer {
          max-width: 600px;
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 11px;
          color: #64748b;
          text-align: center;
          line-height: 1.4;
          font-weight: 500;
        }

        .secured-payment-footer svg {
          color: #22c55e; /* Green lock icon */
          flex-shrink: 0;
        }

        .checkout-error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #fef2f2;
          border: 1px solid #fee2e2;
          color: #ef4444;
          border-radius: 8px;
          font-size: 12.5px;
          font-weight: 500;
          width: 100%;
          max-width: 860px;
        }

        .spinner-loader {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #ffffff;
          animation: spin 0.8s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .pricing-cards-grid {
            grid-template-columns: 1fr;
            max-width: 420px;
          }
          .pricing-page-container {
            min-height: auto;
            padding: 100px 16px 40px;
          }
          .pricing-title-wrap h1 {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}
