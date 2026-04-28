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
import PremiumModal from '../shared/PremiumModal';

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
    priceMonthly: 4000,
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
    priceMonthly: 7000,
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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUser(session.user);
      setLoading(false);
    });
  }, []);

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowPremiumModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || selectedPlan.id === 'free') return;
    
    setLoadingCheckout(true);
    try {
      const priceId = isSemester ? selectedPlan.priceIdSemester : selectedPlan.priceIdMonthly;
      
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Error starting checkout:', err);
      alert('Network issue or checkout failed. Please refresh and try again.');
    } finally {
      setLoadingCheckout(false);
      setShowPremiumModal(false);
    }
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
            <div style={badgeStyles}><Crown size={14} /> PREMIUM ACADEMICS</div>
            <h1 style={titleStyles}>Elevate your <span style={highlightText}>Learning</span></h1>
            <p style={subtitleStyles}>Join 10,000+ students using AI to master their curriculum in half the time.</p>
          </motion.div>

          <div style={toggleContainerStyles}>
            <div style={togglePillStyles}>
              <button 
                onClick={() => setIsSemester(false)}
                style={{ ...toggleBtnStyles, background: !isSemester ? 'white' : 'transparent', color: !isSemester ? '#111' : '#fff' }}
              >
                Monthly
              </button>
              <button 
                onClick={() => setIsSemester(true)}
                style={{ ...toggleBtnStyles, background: isSemester ? 'white' : 'transparent', color: isSemester ? '#111' : '#fff' }}
              >
                Semester <span style={discountBadgeStyles}>-40%</span>
              </button>
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
                  <div style={iconBoxStyles(plan.accentColor)}>
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
                  <div style={pricePeriodStyles}>/ {isSemester ? 'semester' : 'month'}</div>
                </div>

                <button
                  disabled={current || loadingCheckout}
                  onClick={() => plan.id !== 'free' && handleUpgrade(plan)}
                  onMouseEnter={() => setHoveredButton(plan.id)}
                  onMouseLeave={() => setHoveredButton(null)}
                  style={ctaStyles(plan.isPrimary, current, hoveredButton === plan.id)}
                >
                  {loadingCheckout && <Loader className="animate-spin" size={18} />}
                  {!loadingCheckout && (current ? 'Active Plan' : plan.cta)}
                </button>

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

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handlePurchase}
        onStartTrial={() => navigate('/dashboard')}
      />

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
  background: '#050505',
  color: '#fff',
  fontFamily: "'Outfit', sans-serif",
  position: 'relative',
  overflowX: 'hidden',
};

const bgOverlayStyles = {
  position: 'absolute',
  inset: 0,
  backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  opacity: 0.2,
  filter: 'grayscale(100%) contrast(150%)',
  zIndex: 0,
};

const contentWrapperStyles = {
  position: 'relative',
  zIndex: 1,
  padding: '80px 24px',
  maxWidth: 1200,
  margin: '0 auto',
};

const headerStyles = {
  textAlign: 'center',
  marginBottom: 80,
};

const headerContentStyles = {
  maxWidth: 700,
  margin: '0 auto 40px',
};

const badgeStyles = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  background: 'rgba(122, 18, 204, 0.2)',
  border: '1px solid rgba(122, 18, 204, 0.3)',
  borderRadius: 99,
  fontSize: 12,
  fontWeight: 800,
  color: '#a78bfa',
  letterSpacing: '0.1em',
  marginBottom: 24,
};

const titleStyles = {
  fontSize: 'clamp(40px, 8vw, 64px)',
  fontWeight: 900,
  letterSpacing: '-0.05em',
  lineHeight: 1,
  marginBottom: 24,
};

const highlightText = {
  background: 'linear-gradient(to right, #a78bfa, #818cf8)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const subtitleStyles = {
  fontSize: 18,
  color: '#94a3b8',
  maxWidth: 500,
  margin: '0 auto',
  lineHeight: 1.6,
};

const toggleContainerStyles = {
  display: 'flex',
  justifyContent: 'center',
};

const togglePillStyles = {
  display: 'flex',
  background: 'rgba(255,255,255,0.05)',
  padding: 4,
  borderRadius: 99,
  border: '1px solid rgba(255,255,255,0.1)',
  gap: 4,
};

const toggleBtnStyles = {
  padding: '10px 24px',
  borderRadius: 99,
  fontSize: 14,
  fontWeight: 700,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const discountBadgeStyles = {
  fontSize: 10,
  padding: '2px 8px',
  background: '#10b981',
  color: '#fff',
  borderRadius: 99,
};

const gridStyles = (isMobile) => ({
  display: 'grid',
  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
  gap: 24,
  alignItems: 'stretch',
});

const cardStyles = (isPrimary, isHovered) => ({
  background: isPrimary ? 'rgba(15,15,15,0.8)' : 'rgba(20,20,20,0.6)',
  backdropFilter: 'blur(20px)',
  borderRadius: 32,
  padding: 40,
  border: isPrimary ? '2px solid #7a12cc' : '1px solid rgba(255,255,255,0.1)',
  position: 'relative',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: isHovered ? 'translateY(-12px)' : 'translateY(0)',
  boxShadow: isHovered ? '0 30px 60px rgba(0,0,0,0.5)' : 'none',
});

const planBadgeStyles = {
  position: 'absolute',
  top: 20,
  right: 24,
  background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
  padding: '4px 12px',
  borderRadius: 99,
  fontSize: 10,
  fontWeight: 900,
  color: '#fff',
};

const cardHeaderStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  marginBottom: 32,
};

const iconBoxStyles = (color) => ({
  width: 52,
  height: 52,
  borderRadius: 16,
  background: `${color}15`,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const planTitleStyles = {
  fontSize: 22,
  fontWeight: 800,
  margin: 0,
};

const planTaglineStyles = {
  fontSize: 13,
  color: '#64748b',
  margin: 0,
};

const priceContainerStyles = {
  marginBottom: 32,
};

const priceValueStyles = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 4,
};

const currencyStyles = {
  fontSize: 24,
  fontWeight: 700,
  color: '#64748b',
  marginTop: 8,
};

const amountStyles = {
  fontSize: 56,
  fontWeight: 900,
  letterSpacing: '-0.04em',
};

const pricePeriodStyles = {
  fontSize: 14,
  color: '#64748b',
  fontWeight: 600,
};

const ctaStyles = (isPrimary, current, isHovered) => ({
  width: '100%',
  height: '56px',
  borderRadius: '16px',
  fontSize: '15px',
  fontWeight: 700,
  fontFamily: 'var(--font-outfit)',
  textTransform: 'none',
  letterSpacing: 'normal',
  cursor: current ? 'default' : 'pointer',
  border: isPrimary && !current ? '2px solid #FB923C' : 'none',
  background: current ? 'rgba(255,255,255,0.05)' : (isPrimary && !current && isHovered ? '#FB923C' : (isPrimary && !current ? 'white' : 'rgba(255,255,255,0.1)')),
  color: current ? '#64748b' : (isPrimary && !current && isHovered ? 'white' : (isPrimary && !current ? '#FB923C' : '#FFFFFF')),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
  marginBottom: 32,
  boxShadow: 'none',
});

const dividerStyles = {
  height: 1,
  background: 'rgba(255,255,255,0.05)',
  marginBottom: 32,
};

const featureListStyles = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const featureItemStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  fontSize: 14,
  fontWeight: 500,
  color: '#cbd5e1',
};

const checkIconStyles = {
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: 'rgba(16, 185, 129, 0.1)',
  color: '#10b981',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const footerStyles = {
  marginTop: 80,
  display: 'flex',
  justifyContent: 'center',
  gap: 40,
  flexWrap: 'wrap',
};

const trustItemStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontSize: 14,
  color: '#64748b',
  fontWeight: 600,
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
