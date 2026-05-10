import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiCheckLine as Check, RiMagicFill as Sparkles, RiStarFill as Star,
  RiFlashlightFill as Zap, RiShieldFill as Shield, RiRocketFill as Rocket,
  RiArrowRightLine as ArrowRight, RiCloseLine as X,
  RiLoader4Line as Loader, RiVipCrownFill as Crown,
  RiBankCard2Line as CreditCard, RiExternalLinkLine as ExternalLink,
  RiLockFill as Lock, RiErrorWarningFill as AlertCircle,
  RiArrowLeftLine as ArrowLeft
} from 'react-icons/ri';
import PaystackButton from './PaystackButton';
import { supabase } from '../supabaseClient';

const plansData = {
  ultimate: {
    name: 'University Pro',
    tagline: 'The ultimate academic advantage',
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
    isPrimary: true,
  },
  premium: {
    name: 'Luter Executive',
    tagline: 'For elite researchers & power users',
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
    isPrimary: false,
  }
};

export default function PaystackCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState('ultimate');
  const [billingPeriod, setBillingPeriod] = useState('semester');
  const [paymentMode, setPaymentMode] = useState('inline'); // 'inline' or 'redirect'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  // Prices (must match PricingPage)
  const prices = {
    ultimate: { monthly: 3000, semester: 9000 },
    premium: { monthly: 9000, semester: 16000 }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planParam = params.get('plan');
    const periodParam = params.get('period');
    
    if (planParam && plansData[planParam]) {
      setSelectedPlanId(planParam);
    }
    if (periodParam === 'monthly' || periodParam === 'semester') {
      setBillingPeriod(periodParam);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate('/signin?redirect=' + encodeURIComponent(location.pathname + location.search));
      }
      setLoading(false);
    });
  }, [location, navigate]);

  const plan = plansData[selectedPlanId] || plansData.ultimate;
  const PlanIcon = plan.icon;
  const amount = prices[selectedPlanId]?.[billingPeriod] || 0;
  const isSemester = billingPeriod === 'semester';

  const handleSuccess = (transaction) => {
    navigate('/dashboard/payment/success?reference=' + transaction.reference);
  };

  const handleError = (err) => {
    setError(err.message || 'Payment failed');
  };

  if (loading) return (
    <div style={fullLoaderStyles}>
      <div style={spinnerStyles} />
    </div>
  );

  return (
    <div style={pageStyles}>
      <div style={bgOverlayStyles} />
      
      <div style={contentWrapperStyles}>
        {/* Header */}
        <header style={{ ...headerStyles, marginBottom: 40 }}>
          <button
            onClick={() => navigate(-1)}
            style={backBtnStyles}
          >
            <ArrowLeft size={18} />
            <span>Back to Plans</span>
          </button>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 20 }}
          >
            <div style={badgeStyles}>
              <Lock size={14} />
              <span>SECURE CHECKOUT</span>
            </div>
            <h1 style={{ ...titleStyles, fontSize: 'clamp(28px, 5vw, 40px)', marginBottom: 10 }}>
              Complete your <span style={highlightText}>Upgrade</span>
            </h1>
          </motion.div>
        </header>

        <div style={gridContainerStyles}>
          {/* Left Side: Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={cardStyles(plan.isPrimary, false)}
          >
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
                <span style={amountStyles}>{amount.toLocaleString()}</span>
              </div>
              <div style={pricePeriodStyles}>/ {isSemester ? 'semester' : 'month'}</div>
            </div>

            <div style={dividerStyles} />

            <div style={{ marginBottom: 20 }}>
              <h4 style={summaryHeadingStyles}>Order Summary</h4>
              <div style={summaryRowStyles}>
                <span style={summaryLabelStyles}>Plan</span>
                <span style={summaryValueStyles}>{plan.name}</span>
              </div>
              <div style={summaryRowStyles}>
                <span style={summaryLabelStyles}>Billing Cycle</span>
                <span style={summaryValueStyles}>
                  {isSemester ? (selectedPlanId === 'premium' ? 'Yearly (12 months)' : 'Semester (4 months)') : 'Monthly'}
                </span>
              </div>
              <div style={{ ...summaryRowStyles, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <span style={{ ...summaryLabelStyles, fontWeight: 700, color: '#1e293b' }}>Total Due</span>
                <span style={{ ...summaryValueStyles, fontWeight: 800, color: '#7a12cc', fontSize: 20 }}>₦{amount.toLocaleString()}</span>
              </div>
            </div>

            <div style={dividerStyles} />

            <ul style={featureListStyles}>
              {plan.features.slice(0, 5).map((f, i) => (
                <li key={i} style={featureItemStyles}>
                  <div style={checkIconStyles}><Check size={12} strokeWidth={3} /></div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right Side: Payment Methods */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ ...cardStyles(false, false), display: 'flex', flexDirection: 'column' }}
          >
            <h3 style={{ ...planTitleStyles, marginBottom: 24 }}>Payment Method</h3>
            
            <div style={methodListStyles}>
              <button
                onClick={() => setPaymentMode('inline')}
                style={methodBtnStyles(paymentMode === 'inline')}
              >
                <div style={radioStyles(paymentMode === 'inline')}>
                  {paymentMode === 'inline' && <div style={radioInnerStyles} />}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={methodLabelStyles}>Quick Pay</span>
                    <span style={recBadgeStyles}>FAST</span>
                  </div>
                  <p style={methodSubLabelStyles}>Pay securely with inline popup</p>
                </div>
                <CreditCard size={20} color={paymentMode === 'inline' ? '#7a12cc' : '#94a3b8'} />
              </button>

              <button
                onClick={() => setPaymentMode('redirect')}
                style={methodBtnStyles(paymentMode === 'redirect')}
              >
                <div style={radioStyles(paymentMode === 'redirect')}>
                  {paymentMode === 'redirect' && <div style={radioInnerStyles} />}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <span style={methodLabelStyles}>Secure Redirect</span>
                  <p style={methodSubLabelStyles}>Checkout on Paystack's official site</p>
                </div>
                <ExternalLink size={20} color={paymentMode === 'redirect' ? '#7a12cc' : '#94a3b8'} />
              </button>
            </div>

            <div style={infoBoxStyles}>
              <Sparkles size={16} color="#7a12cc" />
              <p style={infoTextStyles}>
                Account: <span style={{ fontWeight: 600 }}>{user?.email}</span>
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={errorBoxStyles}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginTop: 32 }}>
              <PaystackButton
                email={user?.email}
                amount={amount}
                metadata={{
                  plan_id: selectedPlanId,
                  plan_name: plan.name,
                  billing_period: billingPeriod,
                  user_id: user?.id,
                }}
                onSuccess={handleSuccess}
                onError={handleError}
                mode={paymentMode}
                className="paystack-checkout-btn"
                buttonProps={{
                  onMouseEnter: () => setHoveredButton('pay'),
                  onMouseLeave: () => setHoveredButton(null),
                  style: ctaStyles(true, false, hoveredButton === 'pay')
                }}
              >
                {paymentMode === 'redirect' ? 'Proceed to Paystack' : `Complete Payment • ₦${amount.toLocaleString()}`}
              </PaystackButton>
            </div>

            <div style={trustFooterStyles}>
              <Shield size={14} />
              <span>PCI DSS COMPLIANT • SSL SECURED</span>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <footer style={footerStyles}>
          <div style={trustItemStyles}><Shield size={18} /> Bank-grade Security</div>
          <div style={trustItemStyles}><Star size={18} /> Cancel Anytime</div>
          <div style={trustItemStyles}><Zap size={18} /> Instant Activation</div>
        </footer>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .paystack-checkout-btn {
          width: 100% !important;
        }
      `}</style>
    </div>
  );
}

// ── STYLES (Matching PricingPage) ──

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
  padding: '40px 24px',
  maxWidth: 1000,
  margin: '0 auto',
};

const headerStyles = {
  textAlign: 'center',
  marginBottom: 60,
};

const backBtnStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: '#64748b',
  padding: '8px 16px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  cursor: 'pointer',
  margin: '0 auto',
  transition: 'all 0.2s ease',
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
  marginBottom: 16,
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

const gridContainerStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 24,
  marginBottom: 40,
};

const cardStyles = (isPrimary, isHovered) => ({
  background: '#ffffff',
  borderRadius: 16,
  padding: 32,
  border: isPrimary ? '2px solid #7a12cc' : '1px solid #e2e8f0',
  position: 'relative',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
});

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
  fontSize: 40,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#1e293b',
};

const pricePeriodStyles = {
  fontSize: 14,
  color: '#64748b',
  fontWeight: 600,
};

const dividerStyles = {
  height: 1,
  background: '#f1f5f9',
  margin: '20px 0',
};

const summaryHeadingStyles = {
  fontSize: 12,
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 12,
};

const summaryRowStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 8,
};

const summaryLabelStyles = {
  fontSize: 14,
  color: '#64748b',
};

const summaryValueStyles = {
  fontSize: 14,
  fontWeight: 600,
  color: '#1e293b',
};

const methodListStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginBottom: 24,
};

const methodBtnStyles = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '16px 20px',
  borderRadius: 12,
  border: active ? '2px solid #7a12cc' : '1px solid #e2e8f0',
  background: active ? '#7a12cc05' : '#ffffff',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
});

const radioStyles = (active) => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: active ? '6px solid #7a12cc' : '2px solid #e2e8f0',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const radioInnerStyles = {
  width: 0,
  height: 0,
};

const methodLabelStyles = {
  fontSize: 15,
  fontWeight: 700,
  color: '#1e293b',
};

const methodSubLabelStyles = {
  fontSize: 12,
  color: '#64748b',
};

const recBadgeStyles = {
  fontSize: 9,
  fontWeight: 800,
  background: '#10b981',
  color: '#ffffff',
  padding: '2px 6px',
  borderRadius: 4,
  letterSpacing: '0.05em',
};

const infoBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  background: '#f8fafc',
  borderRadius: 10,
  border: '1px solid #e2e8f0',
};

const infoTextStyles = {
  fontSize: 13,
  color: '#64748b',
  margin: 0,
};

const errorBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  background: '#fef2f2',
  color: '#ef4444',
  borderRadius: 10,
  border: '1px solid #fee2e2',
  fontSize: 13,
  marginTop: 16,
};

const trustFooterStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontSize: 10,
  fontWeight: 700,
  color: '#cbd5e1',
  letterSpacing: '0.05em',
  marginTop: 20,
};

const ctaStyles = (isPrimary, current, isHovered) => ({
  width: '100%',
  height: '54px',
  borderRadius: 10,
  fontSize: '15px',
  fontWeight: 700,
  fontFamily: 'inherit',
  cursor: 'pointer',
  border: 'none',
  background: isHovered ? '#6d10b8' : '#7a12cc',
  color: '#ffffff',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  boxShadow: '0 4px 12px rgba(122, 18, 204, 0.25)',
});

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
  color: '#475569',
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
  background: '#f8fafc',
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

