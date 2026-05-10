import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiCheckLine as Check, RiMagicFill as Sparkles, RiStarFill as Star,
  RiFlashlightFill as Zap, RiShieldFill as Shield, RiRocketFill as Rocket,
  RiArrowRightLine as ArrowRight, RiCloseLine as X,
  RiLoader4Line as Loader, RiVipCrownFill as Crown,
  RiBankCard2Line as CreditCard, RiSecurePaymentLine as SecurePayment
} from 'react-icons/ri';
import { supabase } from '../supabaseClient';

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
    cta: 'Get Started',
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
    badge: 'MOST CHOSEN',
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
  },
  {
    id: 'executive',
    name: 'Luter Executive',
    tagline: 'For elite researchers & power users',
    priceMonthly: 9000,
    priceSemester: 16000,
    priceIdMonthly: 'price_1TQBBdHPD8pnlRZIp7HSWNQj',
    priceIdSemester: 'price_1TQBBeHPD8pnlRZIeg7YvWbb',
    icon: Rocket,
    accentColor: '#0ea5e9',
    badge: 'PREMIUM',
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
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Computer Science Student',
    content: 'Luter transformed my study routine. I went from struggling to acing my exams!',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Engineering Student',
    content: 'The AI-powered notes save me hours every week. Best investment ever!',
    rating: 5
  },
  {
    name: 'Amina Bello',
    role: 'Medical Student',
    content: 'The spaced repetition feature is a game-changer for memorization.',
    rating: 5
  }
];

export default function StandalonePricingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isSemester, setIsSemester] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('paystack');

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
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
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

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #7a12cc',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Navigation Header */}
      <div style={{
        padding: '20px 40px',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 24,
            fontWeight: 800,
            color: '#1e293b'
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #7a12cc, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 20
            }}>
              L
            </div>
            Luter
          </div>
          
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={() => user ? navigate('/dashboard') : navigate('/auth')}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#1e293b',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {user ? 'Dashboard' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{
        padding: '80px 40px 60px',
        textAlign: 'center',
        maxWidth: 900,
        margin: '0 auto'
      }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #7a12cc15, #8b5cf615)',
            padding: '6px 16px',
            borderRadius: 20,
            marginBottom: 24,
            border: '1px solid #7a12cc30'
          }}>
            <Crown size={16} color="#7a12cc" />
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#7a12cc',
              letterSpacing: '0.05em'
            }}>
              PREMIUM ACADEMICS
            </span>
          </div>
          
          <h1 style={{
            fontSize: 'clamp(48px, 8vw, 72px)',
            fontWeight: 800,
            margin: '0 0 24px 0',
            color: '#1e293b',
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            Elevate Your <span style={{ color: '#7a12cc' }}>Learning</span>
          </h1>
          
          <p style={{
            fontSize: 20,
            color: '#64748b',
            maxWidth: 600,
            margin: '0 auto 40px',
            lineHeight: 1.6
          }}>
            Join 10,000+ students using AI to master their curriculum in half the time.
          </p>

          {/* Payment Method Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 40
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
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 60
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
                  background: !isSemester ? '#ffffff' : 'transparent',
                  color: !isSemester ? '#1e293b' : '#94a3b8',
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
                  background: isSemester ? '#ffffff' : 'transparent',
                  color: isSemester ? '#1e293b' : '#94a3b8',
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
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div style={{
        padding: '0 40px 80px',
        maxWidth: 1200,
        margin: '0 auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          alignItems: 'stretch'
        }}>
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
                style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  padding: '32px',
                  border: current ? `2px solid ${plan.accentColor}` : (hoveredPlan === plan.id ? `2px solid ${plan.accentColor}` : '1px solid #e2e8f0'),
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  transform: hoveredPlan === plan.id ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hoveredPlan === plan.id ? '0 12px 32px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                {plan.badge && (
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    right: 24,
                    background: plan.isPrimary ? 'linear-gradient(135deg, #7a12cc, #8b5cf6)' : '#dc2626',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#ffffff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {plan.badge}
                  </div>
                )}

                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      background: plan.isPrimary ? `${plan.accentColor}15` : '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: plan.isPrimary ? `1px solid ${plan.accentColor}30` : '1px solid #e2e8f0'
                    }}>
                      <PlanIcon size={24} color={plan.accentColor} />
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
                        {plan.tagline}
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
                        ₦{price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {plan.id === 'free' ? (
                  <button
                    disabled={true}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#94a3b8',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => !current && handleCheckout(plan)}
                    disabled={current}
                    style={{
                      width: '100%',
                      height: 48,
                      borderRadius: 8,
                      border: current ? '1px solid #e2e8f0' : (plan.isPrimary ? '2px solid #7a12cc' : '1px solid #e2e8f0'),
                      background: current ? '#f8fafc' : (plan.isPrimary ? '#7a12cc' : '#ffffff'),
                      color: current ? '#94a3b8' : (plan.isPrimary ? '#ffffff' : '#1e293b'),
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
                    {current ? 'Current Plan' : plan.cta}
                    {!current && <ArrowRight size={16} />}
                  </button>
                )}

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
                        flexShrink: 0,
                        border: '1px solid #bbf7d0'
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
            );
          })}
        </div>
      </div>

      {/* Testimonials Section */}
      <div style={{
        padding: '80px 40px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: 36,
            fontWeight: 800,
            margin: '0 0 48px 0',
            color: '#1e293b'
          }}>
            Trusted by Students Everywhere
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 32
          }}>
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                style={{
                  background: '#f8fafc',
                  borderRadius: 16,
                  padding: '32px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} color="#fbbf24" />
                  ))}
                </div>
                <p style={{
                  fontSize: 16,
                  color: '#475569',
                  lineHeight: 1.6,
                  marginBottom: 20,
                  fontStyle: 'italic'
                }}>
                  "{testimonial.content}"
                </p>
                <div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: 4
                  }}>
                    {testimonial.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: '#64748b'
                  }}>
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '40px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
            marginBottom: 24,
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#64748b',
              fontWeight: 500,
              padding: '12px 16px',
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}>
              <Shield size={16} color="#10b981" />
              Secure Payments
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#64748b',
              fontWeight: 500,
              padding: '12px 16px',
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}>
              <Zap size={16} color="#f59e0b" />
              Instant Access
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: '#64748b',
              fontWeight: 500,
              padding: '12px 16px',
              background: '#ffffff',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}>
              <Rocket size={16} color="#8b5cf6" />
              Cancel Anytime
            </div>
          </div>
          
          <div style={{
            fontSize: 12,
            color: '#94a3b8'
          }}>
            © 2024 Luter. All rights reserved.
          </div>
        </div>
      </div>

      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
