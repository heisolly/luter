import React, { useState } from 'react';
import { Check, Plus, Star, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { PageBackground, HighlightedText, RevealDiv, SharedNavbar } from './PageShared';

const FAQItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} style={{ background: 'white', border: `1px solid ${open ? 'rgba(151,24,251,0.25)' : '#f0eaff'}`, borderRadius: 16, marginBottom: 12, overflow: 'hidden', cursor: 'pointer', boxShadow: open ? '0 4px 20px rgba(151,24,251,0.06)' : '0 2px 8px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>{q}</h4>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: open ? 'var(--primary)' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.25s', transform: open ? 'rotate(45deg)' : 'none' }}>
          <Plus size={14} color={open ? 'white' : '#999'} />
        </div>
      </div>
      <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
        <p style={{ fontSize: 14, color: '#666', lineHeight: 1.75, padding: '0 24px 20px', fontWeight: 500, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
};

const plans = [
  {
    name: 'Basic', trial: 'Basic plan',
    priceMonthly: 0, priceSemester: 0,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonStyle: { background: 'white', color: '#111', border: '1px solid #e5e7eb' },
    buttonText: 'Start for Free',
    features: ['5 uploads per month', 'Smart Notes (Basic)', 'Summary', 'Flashcard generation', 'Community support']
  },
  {
    name: 'University Pro', trial: 'Most popular for students',
    priceMonthly: 4000, priceSemester: 9000,
    isPopular: true,
    bg: 'linear-gradient(160deg, #6d28d9, #9718fb 60%, #7180FE)', color: 'white', border: 'transparent',
    buttonStyle: { background: 'white', color: 'var(--primary)', border: 'none' },
    buttonText: 'Get Started',
    features: ['Unlimited uploads', 'Advanced Smart Notes', 'Summary + Quizzes', 'Spaced-rep Flashcards', 'Math Expert', 'Live Lecture Recording', 'Priority support']
  },
  {
    name: 'Premium', trial: 'For power users',
    priceMonthly: 7000, priceSemester: 16000,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonStyle: { background: 'linear-gradient(135deg, var(--primary), #7180fe)', color: 'white', border: 'none' },
    buttonText: 'Get Started',
    features: ['Everything in University Pro', 'Analyze Images', 'Multi-file Sessions', 'Team collaboration', 'Dedicated support', 'Early feature access']
  }
];

const testimonials = [
  { name: 'Casey', text: 'Luter\'s chatbot is awesome! I get answers to my questions anytime. 🤖', avatar: 'https://framerusercontent.com/modules/PLP5SWQpFPuFrn7tLf3t/suo2OcdmUu5xmjtBXZ7I/assets/XfjXHJ2H7SzzlzPr1bGFm1T9BpI.png' },
  { name: 'Taylor', text: 'The quizzes on Luter are spot on. Helps me prep for tests like a boss! 📝', avatar: 'https://framerusercontent.com/modules/PLP5SWQpFPuFrn7tLf3t/suo2OcdmUu5xmjtBXZ7I/assets/GaxkgrTkzKlxI7B3EJtZp4dabI.png' },
  { name: 'Raiven', text: 'Med school is drowning me in homework and I have tests coming up. You literally just saved the day with study material.', avatar: 'https://framerusercontent.com/modules/PLP5SWQpFPuFrn7tLf3t/suo2OcdmUu5xmjtBXZ7I/assets/5nnqp2inSINDktAAWpI7gxJei0w.png' },
  { name: 'Sam', text: 'Love the step-by-step solutions on Luter. It\'s like having a tutor in my pocket! 📚', avatar: 'https://framerusercontent.com/modules/PLP5SWQpFPuFrn7tLf3t/suo2OcdmUu5xmjtBXZ7I/assets/Vu8TxX7VMCMZDjoliFK7D0nOyX0.png' },
  { name: 'Susan S.', text: 'Perfect! I just discovered Luter a week back and I am in love. Wish I had found this before!!!', avatar: 'https://framerusercontent.com/modules/PLP5SWQpFPuFrn7tLf3t/suo2OcdmUu5xmjtBXZ7I/assets/ebCaegtDakUaQGRtXSYmPR43Q.png' },
  { name: 'Raj P.', text: 'Luter is legit! I don\'t have to waste time making flashcards anymore. I just upload my stuff, and it does the rest. Plus, it\'s got my back even at 1am!', avatar: 'https://framerusercontent.com/modules/PLP5SWQpFPuFrn7tLf3t/suo2OcdmUu5xmjtBXZ7I/assets/Vu8TxX7VMCMZDjoliFK7D0nOyX0.png' },
  { name: 'Jordan', text: 'Flashcards on Luter are dope! Makes memorizing stuff so much easier. 💡', avatar: 'https://framerusercontent.com/modules/PLP5SWQpFPuFrn7tLf3t/suo2OcdmUu5xmjtBXZ7I/assets/BJytCbStiWSy9rxpQ0wU6I3SNiI.png' },
  { name: 'Alex', text: 'Luter\'s step-by-step solutions are a lifesaver! Finally, I get where I went wrong. 👍', avatar: 'https://framerusercontent.com/modules/PLP5SWQpFPuFrn7tLf3t/suo2OcdmUu5xmjtBXZ7I/assets/mhC7dhzvLcqmUofPcC2BW8vh4.png' },
];

export default function Pricing() {
  const [isSemester, setIsSemester] = useState(true);

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#111', position: 'relative' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 120, paddingBottom: 120 }}>

        {/* Header */}
        <div className="container-custom" style={{ textAlign: 'center', marginBottom: 60 }}>
          <RevealDiv>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20, background: 'rgba(151,24,251,0.07)', padding: '6px 16px', borderRadius: 99, border: '1px solid rgba(151,24,251,0.12)' }}>
              <Sparkles size={13} /> Upgrade anytime
            </div>
          </RevealDiv>
          <RevealDiv delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 20, lineHeight: 1.1 }}>
              Simple pricing for{' '}
              <HighlightedText texts={['students']} />
            </h1>
          </RevealDiv>
          <RevealDiv delay={0.15}>
            <p style={{ fontSize: 18, color: '#555', maxWidth: 560, margin: '0 auto 36px', fontWeight: 500, lineHeight: 1.7 }}>
              Start free. Upgrade when you're ready. No tricks, no hidden fees.
            </p>
          </RevealDiv>
          <RevealDiv delay={0.2}>
            <div style={{ display: 'inline-flex', background: 'white', border: '1px solid #e5e7eb', borderRadius: 99, padding: 4, gap: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <button onClick={() => setIsSemester(false)} style={{ padding: '9px 28px', borderRadius: 99, background: !isSemester ? 'var(--primary)' : 'transparent', color: !isSemester ? 'white' : '#555', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.25s' }}>Monthly</button>
              <button onClick={() => setIsSemester(true)} style={{ padding: '9px 28px', borderRadius: 99, background: isSemester ? 'var(--primary)' : 'transparent', color: isSemester ? 'white' : '#555', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', alignItems: 'center', gap: 8 }}>
                Per Semester <span style={{ fontSize: 10, background: '#d1fae5', color: '#059669', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>Best Value</span>
              </button>
            </div>
          </RevealDiv>
        </div>

        {/* Plans */}
        <div className="container-full" style={{ marginBottom: 80 }}>
          <RevealDiv>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: 24, 
              maxWidth: 1000, 
              margin: '0 auto'
            }}>
              {plans.map((plan) => (
                <div key={plan.name} style={{
                  background: plan.isPopular ? 'var(--primary)' : 'white',
                  color: plan.color,
                  borderRadius: 16,
                  padding: '32px 24px',
                  border: plan.isPopular ? 'none' : '1px solid #e5e7eb',
                  boxShadow: plan.isPopular ? '0 10px 30px rgba(122, 18, 204, 0.2)' : '0 4px 12px rgba(0,0,0,0.08)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = plan.isPopular 
                    ? '0 15px 40px rgba(122, 18, 204, 0.25)' 
                    : '0 8px 20px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = plan.isPopular 
                    ? '0 10px 30px rgba(122, 18, 204, 0.2)' 
                    : '0 4px 12px rgba(0,0,0,0.08)';
                }}>
                  {plan.isPopular && (
                    <div style={{ 
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'white',
                      color: 'var(--primary)',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'Outfit'
                    }}>
                      MOST POPULAR
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <h3 style={{ 
                      fontSize: 24, 
                      fontWeight: 700, 
                      margin: '0 0 8px 0',
                      fontFamily: 'Outfit',
                      color: plan.isPopular ? 'white' : '#111'
                    }}>{plan.name}</h3>
                    <p style={{ 
                      fontSize: 13, 
                      fontWeight: 500, 
                      margin: 0,
                      color: plan.isPopular ? 'rgba(255,255,255,0.8)' : '#666',
                      fontFamily: 'Outfit'
                    }}>{plan.trial}</p>
                  </div>

                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ 
                      fontSize: 48, 
                      fontWeight: 800, 
                      lineHeight: 1,
                      fontFamily: 'Outfit',
                      color: plan.isPopular ? 'white' : '#111'
                    }}>
                      {plan.priceMonthly === 0 ? '₦0' : `₦${isSemester ? plan.priceSemester.toLocaleString() : plan.priceMonthly.toLocaleString()}`}
                    </div>
                    {plan.priceMonthly > 0 && (
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 500, 
                        color: plan.isPopular ? 'rgba(255,255,255,0.7)' : '#666',
                        fontFamily: 'Outfit'
                      }}>
                        per {isSemester ? 'semester' : 'month'}
                      </div>
                    )}
                  </div>
                  
                  <button style={{ 
                    width: '100%', 
                    padding: '16px', 
                    borderRadius: 12, 
                    fontSize: 15, 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    marginBottom: 24, 
                    fontFamily: 'Outfit',
                    background: plan.isPopular ? 'white' : 'var(--primary)',
                    color: plan.isPopular ? 'var(--primary)' : 'white',
                    border: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}>
                    {plan.buttonText}
                  </button>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ 
                        display: 'flex', 
                        gap: 12, 
                        alignItems: 'center'
                      }}>
                        <div style={{ 
                          width: 20, 
                          height: 20, 
                          borderRadius: '50%', 
                          background: plan.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(122, 18, 204, 0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexShrink: 0
                        }}>
                          <Check size={12} color={plan.isPopular ? 'white' : 'var(--primary)'} strokeWidth={3} />
                        </div>
                        <span style={{ 
                          fontSize: 14, 
                          fontWeight: 500, 
                          lineHeight: 1.4, 
                          color: plan.isPopular ? 'rgba(255,255,255,0.9)' : '#333',
                          fontFamily: 'Outfit'
                        }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </RevealDiv>
        </div>

        {/* University Trust */}
        <RevealDiv>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#bbb', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>Trusted by students at</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap', opacity: 0.45 }}>
              {['Stanford', 'PRINCETON', 'MIT', 'Harvard', 'Oxford', 'UNILAG'].map(u => <span key={u} style={{ fontSize: 17, fontWeight: 900, fontFamily: 'var(--font-besley)', color: '#555' }}>{u}</span>)}
            </div>
          </div>
        </RevealDiv>

        {/* Testimonials */}
        <div style={{ padding: '60px 0', position: 'relative', overflow: 'hidden' }}>
          {/* Header with gradient badge */}
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 24 
            }}>
              <div style={{
                background: 'white',
                border: '1px solid rgb(245, 242, 255)',
                borderRadius: '30px',
                padding: '12px 32px',
                boxShadow: 'rgba(42, 40, 46, 0.29) 0px 0.6px 0.6px -0.9px, rgba(42, 40, 46, 0.28) 0px 1.8px 1.8px -1.9px, rgba(42, 40, 46, 0.24) 0px 4.8px 4.8px -2.8px, rgba(42, 40, 46, 0.1) 0px 15px 15px -3.8px',
                position: 'relative'
              }}>
                <div style={{
                  background: 'linear-gradient(316deg, rgb(165, 143, 255) 0%, rgb(51, 0, 255) 55.7%, rgb(165, 143, 255) 100%)',
                  borderRadius: '20px',
                  padding: '8px 24px',
                  position: 'relative'
                }}>
                  <div style={{ 
                    color: 'white', 
                    fontSize: 14, 
                    fontWeight: 700, 
                    fontFamily: 'Outfit, sans-serif',
                    letterSpacing: '0.5px'
                  }}>
                    Testimonials
                  </div>
                </div>
              </div>
            </div>
            <h2 style={{ 
              fontSize: 'clamp(2rem, 4vw, 3rem)', 
              fontWeight: 800, 
              fontFamily: 'Outfit, sans-serif', 
              color: '#111', 
              textAlign: 'center',
              marginBottom: 0
            }}>
              Why 1,000,000+ learners choose Luter
            </h2>
          </div>

          {/* Animated Testimonial Cards */}
          <div style={{ 
            display: 'flex', 
            width: '100%', 
            height: '400px',
            maxWidth: '1200px',
            margin: '0 auto',
            gap: '20px',
            justifyContent: 'center'
          }}>
            {/* Left Column - Moving Up */}
            <div style={{ 
              display: 'flex', 
              width: '100%', 
              height: '100%', 
              placeItems: 'center', 
              margin: 0, 
              padding: 0, 
              listStyleType: 'none', 
              opacity: 1, 
              maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 25%, rgb(0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%)', 
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px',
                animation: 'scrollUp 30s linear infinite'
              }}>
                {[...testimonials, ...testimonials].map((testimonial, index) => (
                  <div key={`left-${index}`} style={{
                    background: index % 2 === 0 
                      ? 'linear-gradient(rgba(118, 84, 255, 0.3) 0%, rgb(251, 250, 255) 100%)'
                      : 'rgba(236, 227, 255, 0.06)',
                    border: index % 2 === 0 
                      ? '1px solid rgb(255, 255, 255)'
                      : '1px solid rgb(236, 227, 255)',
                    borderRadius: '10px',
                    padding: '20px',
                    width: '280px',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flexShrink: 0
                  }}>
                    <p style={{ 
                      fontSize: 14, 
                      color: '#000', 
                      fontWeight: 500, 
                      margin: 0,
                      fontFamily: 'Outfit, sans-serif',
                      lineHeight: 1.5,
                      textAlign: 'left'
                    }}>
                      "{testimonial.text}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%',
                        backgroundColor: 'rgb(201, 179, 255)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                        />
                      </div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: '#000',
                        fontFamily: 'Outfit, sans-serif'
                      }}>
                        {testimonial.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle Column - Moving Down */}
            <div style={{ 
              display: 'flex', 
              width: '100%', 
              height: '100%', 
              placeItems: 'center', 
              margin: 0, 
              padding: 0, 
              listStyleType: 'none', 
              opacity: 1, 
              maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 25%, rgb(0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%)', 
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px',
                animation: 'scrollDown 30s linear infinite'
              }}>
                {[...testimonials, ...testimonials].map((testimonial, index) => (
                  <div key={`middle-${index}`} style={{
                    background: index % 2 === 0 
                      ? 'rgba(236, 227, 255, 0.06)'
                      : 'linear-gradient(rgba(118, 84, 255, 0.3) 0%, rgb(251, 250, 255) 100%)',
                    border: index % 2 === 0 
                      ? '1px solid rgb(236, 227, 255)'
                      : '1px solid rgb(255, 255, 255)',
                    borderRadius: '10px',
                    padding: '20px',
                    width: '280px',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flexShrink: 0
                  }}>
                    <p style={{ 
                      fontSize: 14, 
                      color: '#000', 
                      fontWeight: 500, 
                      margin: 0,
                      fontFamily: 'Outfit, sans-serif',
                      lineHeight: 1.5,
                      textAlign: 'left'
                    }}>
                      "{testimonial.text}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%',
                        backgroundColor: 'rgb(201, 179, 255)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                        />
                      </div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: '#000',
                        fontFamily: 'Outfit, sans-serif'
                      }}>
                        {testimonial.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Moving Up */}
            <div style={{ 
              display: 'flex', 
              width: '100%', 
              height: '100%', 
              placeItems: 'center', 
              margin: 0, 
              padding: 0, 
              listStyleType: 'none', 
              opacity: 1, 
              maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 25%, rgb(0, 0, 0) 75%, rgba(0, 0, 0, 0) 100%)', 
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '20px',
                animation: 'scrollUp 30s linear infinite'
              }}>
                {[...testimonials, ...testimonials].map((testimonial, index) => (
                  <div key={`right-${index}`} style={{
                    background: index % 2 === 0 
                      ? 'linear-gradient(rgba(118, 84, 255, 0.3) 0%, rgb(251, 250, 255) 100%)'
                      : 'rgba(236, 227, 255, 0.06)',
                    border: index % 2 === 0 
                      ? '1px solid rgb(255, 255, 255)'
                      : '1px solid rgb(236, 227, 255)',
                    borderRadius: '10px',
                    padding: '20px',
                    width: '280px',
                    minHeight: '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    flexShrink: 0
                  }}>
                    <p style={{ 
                      fontSize: 14, 
                      color: '#000', 
                      fontWeight: 500, 
                      margin: 0,
                      fontFamily: 'Outfit, sans-serif',
                      lineHeight: 1.5,
                      textAlign: 'left'
                    }}>
                      "{testimonial.text}"
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%',
                        backgroundColor: 'rgb(201, 179, 255)',
                        overflow: 'hidden',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                        />
                      </div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600, 
                        color: '#000',
                        fontFamily: 'Outfit, sans-serif'
                      }}>
                        {testimonial.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CSS Animations */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes scrollUp {
                0% { transform: translateY(0); }
                100% { transform: translateY(-50%); }
              }
              @keyframes scrollDown {
                0% { transform: translateY(-50%); }
                100% { transform: translateY(0); }
              }
            `
          }} />
        </div>

        {/* FAQ */}
        <div className="container-custom" style={{ maxWidth: 720 }}>
          <RevealDiv>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, fontFamily: 'var(--font-besley)', color: '#111', marginBottom: 12 }}>Frequently Asked Questions</h2>
              <p style={{ fontSize: 15, color: '#666', fontWeight: 500 }}>Can't find your answer? Email us at <span style={{ color: 'var(--primary)', fontWeight: 700 }}>support@luter.ai</span></p>
            </div>
            {[
              { q: 'What files does Luter accept?', a: 'PDFs, Word documents, PowerPoints, YouTube links, and direct audio/video file uploads.' },
              { q: 'Can I use Luter for free?', a: 'Yes! Our Basic plan gives you 5 uploads per month so you can try out the core features.' },
              { q: 'Is my data safe?', a: 'Yes. All files are encrypted in transit and at rest. We never use your content to train our models.' },
              { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel from your account settings — no hoops, no phone calls.' },
              { q: 'How does the Semester plan work?', a: 'The Semester plan is billed once every 4 months, which perfectly aligns with a typical university semester. It saves you money compared to the monthly option.' },
            ].map(faq => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </RevealDiv>
        </div>
      </div>
    </div>
  );
}
