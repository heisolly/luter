import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCheckLine as Check, RiMagicFill as Sparkles, RiStarFill as Star,
  RiFlashlightFill as Zap, RiShieldFill as Shield, RiRocketFill as Rocket,
  RiArrowRightLine as ArrowRight, RiCloseLine as X,
  RiLoader4Line as Loader, RiVipCrownFill as Crown
} from 'react-icons/ri';
import { supabase } from '../../supabaseClient';

const plans = [
  {
    id: 'free',
    name: 'Scholar Basic',
    tagline: 'Essential tools for every student',
    priceMonthly: 0,
    priceSemester: 0,
    icon: Shield,
    accentColor: '#94a3b8',
    features: [
      '5 uploads per month',
      'AI Notes (Standard)',
      'Basic Summaries',
      'Flashcard generation',
      'Community access',
    ],
    cta: 'Current Tier',
    isPrimary: false,
  },
  {
    id: 'ultimate',
    name: 'University Pro',
    tagline: 'The ultimate academic advantage',
    priceMonthly: 3000,
    priceSemester: 9000,
    priceIdMonthly: 'price_1TQBBYHPD8pnlRZIniqKwUo0',
    priceIdSemester: 'price_1TQBBcHPD8pnlRZImYqlm80o',
    icon: Sparkles,
    accentColor: '#7a12cc',
    features: [
      'Unlimited uploads',
      'Advanced AI Insights',
      'Smart Quizzes',
      'Spaced-repetition engine',
      'AI Math & Logic Expert',
      'Priority processing',
    ],
    cta: 'Upgrade to Pro',
    isPrimary: true,
    badge: 'MOST CHOSEN',
  },
  {
    id: 'premium',
    name: 'Luter Executive',
    tagline: 'For elite researchers & power users',
    priceMonthly: 9000,
    priceSemester: 16000,
    priceIdMonthly: 'price_1TQBBdHPD8pnlRZIp7HSWNQj',
    priceIdSemester: 'price_1TQBBeHPD8pnlRZIeg7YvWbb',
    icon: Rocket,
    accentColor: '#0ea5e9',
    features: [
      'Everything in Pro',
      'Vision AI (Analyze Images)',
      'Multi-document Synthesis',
      'Custom AI Personas',
      'Early access to Luter Lab',
      'Dedicated Academic Concierge',
    ],
    cta: 'Go Executive',
    isPrimary: false,
  },
];

export default function PricingPage() {
  const { isMobile, userProfile } = useOutletContext();
  const navigate = useNavigate();
  const [isSemester, setIsSemester] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
    const [hoveredPlan, setHoveredPlan] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  // Load Paystack script
  useEffect(() => {
    const loadPaystackScript = () => {
      return new Promise((resolve, reject) => {
        if (window.PaystackPop) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };
    
    loadPaystackScript().catch(console.error);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
      setLoading(false);
    });
  }, []);

  // Navigate to custom checkout page
  const handleCheckout = (plan) => {
    navigate(`/checkout?plan=${plan.id}&period=${isSemester ? 'semester' : 'monthly'}`);
  };

  const isCurrentPlan = (planName) => {
    const currentTier = userProfile?.subscription_tier?.toLowerCase() || 'free';
    const planNormalized = planName.toLowerCase();
    
    if (planNormalized.includes('basic') && currentTier === 'free') return true;
    if (planNormalized.includes('pro') && currentTier === 'pro') return true;
    if (planNormalized.includes('executive') && currentTier === 'premium') return true;
    return currentTier === planNormalized;
  };

  if (loading) return (
    <div style={fullLoaderStyles}>
      <div style={spinnerStyles} />
    </div>
  );

  return (
    <div style={pageStyles}>
      {/* Background Layer */}
      <div style={bgOverlayStyles} />
      
      {/* Content */}
      <div style={contentWrapperStyles}>
        
        {/* Header Section */}
        <header style={headerStyles}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={headerContentStyles}
          >
            <div style={badgeStyles}>
              <Crown size={16} />
              <span>PREMIUM ACADEMICS</span>
            </div>
            <h1 style={titleStyles}>
              Elevate your <span style={highlightText}>Learning</span>
            </h1>
            <p style={subtitleStyles}>
              Join 10,000+ students using AI to master their curriculum in half the time.
            </p>
          </motion.div>

          <div style={toggleContainerStyles}>
            <div style={togglePillStyles}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSemester(false)}
                style={{ ...toggleBtnStyles, background: !isSemester ? '#ffffff' : 'transparent', color: !isSemester ? '#1e293b' : '#94a3b8', border: !isSemester ? '1px solid #e2e8f0' : '1px solid transparent' }}
              >
                Monthly
              </motion.button>
                  <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSemester(true)}
                style={{ ...toggleBtnStyles, background: isSemester ? '#ffffff' : 'transparent', color: isSemester ? '#1e293b' : '#94a3b8', border: isSemester ? '1px solid #e2e8f0' : '1px solid transparent' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Long Term
                  <span style={discountBadgeStyles}>SAVINGS</span>
                </span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* Plans Grid */}
        <div style={gridStyles(isMobile)}>
          {plans.map((plan, idx) => {
            const current = isCurrentPlan(plan.name);
            const price = isSemester ? plan.priceSemester : plan.priceMonthly;
            const PlanIcon = plan.icon;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={cardStyles(plan.isPrimary, hoveredPlan === plan.id)}
              >
                {plan.badge && <div style={planBadgeStyles}>{plan.badge}</div>}
                
                <div style={cardHeaderStyles}>
                  <div style={iconBoxStyles(plan.accentColor, plan.isPrimary)}>
                    <PlanIcon size={24} />
                  </div>
                  <div>
                    <h3 style={planTitleStyles}>{plan.name}</h3>
                    <p style={planTaglineStyles}>{plan.tagline}</p>
                  </div>
                </div>

                <div style={priceContainerStyles}>
                  <div style={priceValueStyles}>
                    <span style={currencyStyles}>₦</span>
                    <span style={amountStyles}>{price.toLocaleString()}</span>
                  </div>
                  <div style={pricePeriodStyles}>
                    / {isSemester ? (plan.id === 'premium' ? 'year' : '4 months') : 'month'}
                  </div>
                </div>

                {plan.id === 'free' ? (
                  <button
                    disabled={true}
                    style={ctaStyles(plan.isPrimary, true, false)}
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => !current && handleCheckout(plan)}
                    disabled={current}
                    style={ctaStyles(plan.isPrimary, current, hoveredButton === plan.id)}
                  >
                    {current ? 'Active Plan' : plan.cta}
                    {!current && <ArrowRight size={16} />}
                  </button>
                )}

                <div style={dividerStyles} />

                <ul style={featureListStyles}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={featureItemStyles}>
                      <div style={checkIconStyles}><Check size={12} strokeWidth={3} /></div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Footer Trust Section */}
        <footer style={footerStyles}>
          <div style={trustItemStyles}><Shield size={18} /> Bank-grade Security</div>
          <div style={trustItemStyles}><Star size={18} /> Cancel Anytime</div>
          <div style={trustItemStyles}><Zap size={18} /> Instant Activation</div>
        </footer>
      </div>


      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

// ── STYLES (Vanilla CSS in JS) ──

const pageStyles = {
  minHeight: '100vh',
  background: '#f8fafc',
  color: '#1e293b',
  fontFamily: "'Outfit', sans-serif",
  position: 'relative',
  overflowX: 'hidden',
};

const bgOverlayStyles = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  zIndex: 0,
};

const contentWrapperStyles = {
  position: 'relative',
  zIndex: 1,
  padding: '60px 24px',
  maxWidth: 1200,
  margin: '0 auto',
};

const headerStyles = {
  textAlign: 'center',
  marginBottom: 60,
};

const headerContentStyles = {
  maxWidth: 700,
  margin: '0 auto 40px',
};

const badgeStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  background: '#f1f5f9',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 11,
  fontWeight: 700,
  color: '#7a12cc',
  letterSpacing: '0.05em',
  marginBottom: 24,
  textTransform: 'uppercase',
};

const titleStyles = {
  fontSize: 'clamp(36px, 6vw, 56px)',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  lineHeight: 1.1,
  marginBottom: 20,
  color: '#1e293b',
};

const highlightText = {
  background: 'linear-gradient(135deg, #7a12cc 0%, #8b5cf6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: 'transparent',
};

const subtitleStyles = {
  fontSize: 18,
  color: '#64748b',
  maxWidth: 500,
  margin: '0 auto',
  lineHeight: 1.6,
  fontWeight: 400,
};

const toggleContainerStyles = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 40,
};

const togglePillStyles = {
  display: 'inline-flex',
  background: '#ffffff',
  padding: 4,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  gap: 2,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};

const toggleBtnStyles = {
  padding: '12px 24px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'inherit',
};

const discountBadgeStyles = {
  fontSize: 10,
  padding: '2px 6px',
  background: '#10b981',
  color: '#fff',
  borderRadius: 6,
  fontWeight: 700,
};

const gridStyles = (isMobile) => ({
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
  gap: 24,
  alignItems: 'stretch',
});

const cardStyles = (isPrimary, isHovered) => ({
  background: '#ffffff',
  borderRadius: 16,
  padding: 32,
  border: isPrimary ? '2px solid #7a12cc' : (isHovered ? '1px solid #cbd5e1' : '1px solid #e2e8f0'),
  position: 'relative',
  transition: 'all 0.3s ease',
  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
  boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
});

const planBadgeStyles = {
  position: 'absolute',
  top: -8,
  right: 20,
  background: 'linear-gradient(135deg, #7a12cc, #8b5cf6)',
  padding: '4px 12px',
  borderRadius: 6,
  fontSize: 10,
  fontWeight: 700,
  color: '#fff',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const cardHeaderStyles = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 24,
};

const iconBoxStyles = (color, isPrimary) => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  background: isPrimary ? `${color}15` : '#f8fafc',
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: isPrimary ? `1px solid ${color}30` : '1px solid #e2e8f0',
});

const planTitleStyles = {
  fontSize: 20,
  fontWeight: 700,
  margin: 0,
  color: '#1e293b',
  lineHeight: 1.2,
};

const planTaglineStyles = {
  fontSize: 13,
  color: '#64748b',
  margin: 0,
  fontWeight: 400,
  marginTop: 4,
};

const priceContainerStyles = {
  marginBottom: 24,
};

const priceValueStyles = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 4,
};

const currencyStyles = {
  fontSize: 20,
  fontWeight: 600,
  color: '#64748b',
  marginTop: 4,
};

const amountStyles = {
  fontSize: 48,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#1e293b',
};

const pricePeriodStyles = {
  fontSize: 14,
  color: '#64748b',
  fontWeight: 600,
};

const ctaStyles = (isPrimary, current, isHovered) => ({
  width: '100%',
  height: '48px',
  borderRadius: 8,
  fontSize: '14px',
  fontWeight: 600,
  fontFamily: 'inherit',
  textTransform: 'none',
  letterSpacing: 'normal',
  cursor: current ? 'default' : 'pointer',
  border: isPrimary && !current ? '1px solid #7a12cc' : '1px solid #e2e8f0',
  background: current ? '#f8fafc' : (isPrimary && !current && isHovered ? '#7a12cc' : (isPrimary && !current ? '#ffffff' : '#ffffff')),
  color: current ? '#94a3b8' : (isPrimary && !current && isHovered ? '#ffffff' : (isPrimary && !current ? '#7a12cc' : '#1e293b')),
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: 24,
});

const dividerStyles = {
  height: 1,
  background: '#f1f5f9',
  marginBottom: 24,
};

const featureListStyles = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const featureItemStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: 14,
  fontWeight: 400,
  color: '#475569',
  lineHeight: 1.4,
};

const checkIconStyles = {
  width: 20,
  height: 20,
  borderRadius: 6,
  background: '#dcfce7',
  color: '#16a34a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  border: '1px solid #bbf7d0',
};

const footerStyles = {
  marginTop: 60,
  display: 'flex',
  justifyContent: 'center',
  gap: 32,
  flexWrap: 'wrap',
};

const trustItemStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 13,
  color: '#64748b',
  fontWeight: 500,
  padding: '12px 16px',
  background: '#ffffff',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
};

const fullLoaderStyles = {
  minHeight: '100vh',
  background: '#050505',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const spinnerStyles = {
  width: 40,
  height: 40,
  border: '3px solid rgba(122,18,204,0.1)',
  borderTopColor: '#7a12cc',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};
