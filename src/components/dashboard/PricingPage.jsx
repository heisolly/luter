import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiCheckLine as Check, RiMagicFill as Sparkles, RiStarFill as Star, RiFlashlightFill as Zap } from 'react-icons/ri';
import { supabase } from '../../supabaseClient';
import PremiumModal from '../shared/PremiumModal';

const plans = [
  {
    id: 'free',
    name: 'Basic', trial: 'Free forever',
    priceMonthly: 0, priceSemester: 0,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonStyle: { background: 'white', color: '#111', border: '1px solid #e5e7eb' },
    buttonText: 'Current Plan',
    features: ['5 uploads per month', 'AI Notes (Basic)', 'AI Summary', 'Flashcard generation', 'Community support']
  },
  {
    id: 'ultimate',
    name: 'University Pro', trial: 'Most popular for students',
    priceMonthly: 4000, priceSemester: 9000,
    isPopular: true,
    bg: 'linear-gradient(160deg, #6d28d9, #9718fb 60%, #7180FE)', color: 'white', border: 'transparent',
    buttonStyle: { background: 'white', color: 'var(--primary)', border: 'none' },
    buttonText: 'Upgrade to Pro',
    features: ['Unlimited uploads', 'Advanced AI Notes', 'AI Summary + Quizzes', 'Spaced-rep Flashcards', 'AI Math Expert', 'Live Lecture Recording', 'Priority support']
  },
  {
    id: 'premium',
    name: 'Premium', trial: 'For power users',
    priceMonthly: 7000, priceSemester: 16000,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonStyle: { background: 'linear-gradient(135deg, var(--primary), #7180fe)', color: 'white', border: 'none' },
    buttonText: 'Get Premium',
    features: ['Everything in University Pro', 'Analyze Images with AI', 'Multi-file Sessions', 'Team collaboration', 'Dedicated support', 'Early feature access']
  }
];

export default function PricingPage() {
  const { isMobile } = useOutletContext();
  const navigate = useNavigate();
  const [isSemester, setIsSemester] = useState(true);
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleUpgrade = (plan) => {
    setSelectedPlan(plan);
    setShowPremiumModal(true);
  };

  const handleStartTrial = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }
    try {
      const { data, error } = await supabase.rpc('start_free_trial', {
        p_user_id: user.id
      });
      if (error) throw error;
      if (data) {
        navigate('/dashboard');
      } else {
        alert('You have already used your free trial. Please upgrade to Premium.');
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      alert('Failed to start trial. Please try again.');
    }
  };

  const handlePurchase = async () => {
    alert('Payment integration coming soon! For now, enjoy the free trial.');
  };

  if (loading) {
    return (
      <div className="dh-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <div style={{ width: 48, height: 48, border: '3px solid #f3f4f6', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="dh-root" style={{ 
      overflowY: 'auto',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      paddingBottom: isMobile ? 100 : 80,
      position: 'relative',
      minHeight: '100vh'
    }}>
      {/* Background overlay pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px',
        backgroundRepeat: 'repeat',
        pointerEvents: 'none'
      }} />
      
      {/* ── Topbar ── */}
      <div style={{ 
        padding: isMobile ? '24px 20px 16px' : '40px 48px',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 26 : 32, fontWeight: 1000, margin: 0, color: '#111', letterSpacing: '-0.04em' }}>
            {isMobile ? 'Scholar Plans' : 'Subscription'}
          </h1>
          <p style={{ fontSize: isMobile ? 12 : 14, color: '#666', fontWeight: 700, margin: '4px 0 0' }}>
            Manage your academic support plan.
          </p>
        </div>
        
        {/* Trial Button */}
        {!isMobile && (
          <button 
            onClick={handleStartTrial}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, var(--primary), #7180fe)', color: 'white', padding: '10px 20px', borderRadius: 99, fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none', boxShadow: '0 4px 14px rgba(113,128,254,0.3)', transition: 'transform 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <Star size={16} /> 7-Day Free Trial
          </button>
        )}
      </div>

      <div style={{ 
        padding: isMobile ? '32px 16px' : '60px 40px', 
        maxWidth: 1100, 
        margin: '0 auto', 
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Toggle */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 60, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
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
          justifyContent: 'center', 
          gap: isMobile ? 24 : 32, 
          maxWidth: 1200, 
          margin: '0 auto',
          fontFamily: 'Outfit, sans-serif'
        }}>
          {plans.map((plan, idx) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              style={{
                flex: '1',
                maxWidth: isMobile ? '100%' : 380,
                background: plan.isPopular 
                  ? 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)' 
                  : 'rgba(255, 255, 255, 0.95)', 
                color: plan.color,
                borderRadius: 0, // Sharp edges
                padding: isMobile ? '32px 24px' : '48px 36px',
                border: plan.isPopular 
                  ? '2px solid rgba(255, 255, 255, 0.2)' 
                  : '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: plan.isPopular 
                  ? '0 0 0 1px rgba(255, 255, 255, 0.1), 0 20px 40px rgba(122, 18, 204, 0.3)' 
                  : '0 0 0 1px rgba(255, 255, 255, 0.1), 0 10px 30px rgba(0, 0, 0, 0.1)',
                position: 'relative', 
                zIndex: plan.isPopular ? 10 : 1,
                display: 'flex', 
                flexDirection: 'column',
                width: '100%',
                boxSizing: 'border-box',
                backdropFilter: 'blur(10px)',
                clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' // Diagonal cut corner
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: plan.isPopular 
                  ? 'linear-gradient(90deg, #fff, rgba(255,255,255,0.6))' 
                  : 'linear-gradient(90deg, #7a12cc, #9718fb)',
              }} />

              {/* Popular badge */}
              {plan.isPopular && (
                <div style={{ 
                  position: 'absolute',
                  top: -12,
                  right: 24,
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  background: 'rgba(255,255,255,0.95)', 
                  color: '#7a12cc', 
                  padding: '6px 16px', 
                  borderRadius: 0, // Sharp edges
                  fontSize: 11, 
                  fontWeight: 700, 
                  fontFamily: 'Outfit',
                  border: '2px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <Zap size={12} /> MOST POPULAR
                </div>
              )}

              {/* Plan name and trial */}
              <div style={{ marginBottom: 32, textAlign: 'center' }}>
                <h3 style={{ 
                  fontSize: 32, 
                  fontWeight: 800, 
                  margin: '0 0 8px 0',
                  fontFamily: 'Outfit',
                  letterSpacing: '-0.02em',
                  color: plan.isPopular ? 'white' : '#111'
                }}>{plan.name}</h3>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 500, 
                  color: plan.isPopular ? 'rgba(255,255,255,0.8)' : '#666',
                  fontFamily: 'Outfit'
                }}>{plan.trial}</div>
              </div>

              {/* Price */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: 32,
                position: 'relative'
              }}>
                <div style={{ 
                  fontSize: 64, 
                  fontWeight: 900, 
                  lineHeight: 1,
                  fontFamily: 'Outfit',
                  color: plan.isPopular ? 'white' : '#111',
                  letterSpacing: '-0.03em'
                }}>
                  {plan.priceMonthly === 0 ? '₦0' : `₦${(isSemester ? plan.priceSemester : plan.priceMonthly).toLocaleString()}`}
                </div>
                {plan.priceMonthly > 0 && (
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 500, 
                    color: plan.isPopular ? 'rgba(255,255,255,0.7)' : '#666',
                    fontFamily: 'Outfit',
                    marginTop: 4
                  }}>
                    per {isSemester ? 'semester' : 'month'}
                  </div>
                )}
              </div>
              
              {/* CTA Button */}
              <button 
                onClick={() => plan.id !== 'free' ? handleUpgrade(plan) : null}
                style={{ 
                  width: '100%', 
                  padding: '18px', 
                  borderRadius: 0, // Sharp edges
                  fontSize: 16, 
                  fontWeight: 700, 
                  cursor: 'pointer', 
                  marginBottom: 32, 
                  fontFamily: 'Outfit',
                  letterSpacing: '0.02em',
                  background: plan.isPopular 
                    ? 'rgba(255, 255, 255, 0.95)' 
                    : 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)',
                  color: plan.isPopular ? '#7a12cc' : 'white',
                  border: plan.isPopular 
                    ? '2px solid rgba(255, 255, 255, 0.3)' 
                    : 'none',
                  boxShadow: plan.isPopular 
                    ? '0 8px 24px rgba(0,0,0,0.15)' 
                    : '0 8px 24px rgba(122, 18, 204, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => { 
                  e.currentTarget.style.transform = 'translateY(-2px)'; 
                  e.currentTarget.style.boxShadow = plan.isPopular 
                    ? '0 12px 32px rgba(0,0,0,0.2)' 
                    : '0 12px 32px rgba(122, 18, 204, 0.4)';
                }}
                onMouseLeave={e => { 
                  e.currentTarget.style.transform = 'none'; 
                  e.currentTarget.style.boxShadow = plan.isPopular 
                    ? '0 8px 24px rgba(0,0,0,0.15)' 
                    : '0 8px 24px rgba(122, 18, 204, 0.3)';
                }}
              >
                {plan.buttonText}
              </button>
              
              {/* Features list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                {plan.features.map((f, i) => (
                  <div key={f} style={{ 
                    display: 'flex', 
                    gap: 12, 
                    alignItems: 'flex-start',
                    padding: '12px 0',
                    borderBottom: i < plan.features.length - 1 
                      ? `1px solid ${plan.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)'}`
                      : 'none'
                  }}>
                    <div style={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: 0, // Sharp edges
                      background: plan.isPopular 
                        ? 'rgba(255,255,255,0.2)' 
                        : 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0, 
                      marginTop: 0,
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' // Sharp square
                    }}>
                      <Check size={12} color={plan.isPopular ? 'white' : 'white'} strokeWidth={3} />
                    </div>
                    <span style={{ 
                      fontSize: 14, 
                      fontWeight: 500, 
                      lineHeight: 1.5, 
                      color: plan.isPopular ? 'rgba(255,255,255,0.95)' : '#333',
                      fontFamily: 'Outfit'
                    }}>{f}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handlePurchase}
        onStartTrial={handleStartTrial}
      />
    </div>
  );
}
