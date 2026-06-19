import React, { useState } from 'react';
import { RiCheckLine as Check, RiArrowRightSLine as CaretRight, RiMagicFill as Sparkle } from 'react-icons/ri';
import { PageBackground, HighlightedText, RevealDiv, SharedNavbar, SharedFAQ, SharedFooter, PremiumButton } from './PageShared';

const pricingFaqs = [
  { q: 'What files does Luter accept?', a: 'PDFs, Word documents, PowerPoints, YouTube links, and direct audio/video file uploads.' },
  { q: 'Can I use Luter for free?', a: 'Yes! Our Basic plan gives you 5 uploads per month so you can try out the core features.' },
  { q: 'Is my data safe?', a: 'Yes. All files are encrypted in transit and at rest. We never use your content to train our models.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel from your account settings — no hoops, no phone calls.' },
  { q: 'How does the Semester plan work?', a: 'The Semester plan is billed once every 4 months, which perfectly aligns with a typical university semester. It saves you money compared to the monthly option.' },
];

const plans = [
  {
    name: 'Basic', trial: 'Basic plan',
    priceMonthly: 0, priceSemester: 0,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
    buttonText: 'Start for Free',
    features: ['5 uploads per month', 'Smart Notes (Basic)', 'Summary', 'Flashcard generation', 'Community support']
  },
  {
    name: 'University Pro', trial: 'Most popular for students',
    priceMonthly: 4000, priceSemester: 9000,
    isPopular: true,
    bg: 'linear-gradient(135deg, #4B0082, #A855F7)', color: 'white', border: 'transparent',
    buttonText: 'Get Started',
    features: ['Unlimited uploads', 'Advanced Smart Notes', 'Summary + Quizzes', 'Spaced-rep Flashcards', 'Math Expert', 'Live Lecture Recording', 'Priority support']
  },
  {
    name: 'Premium', trial: 'For power users',
    priceMonthly: 7000, priceSemester: 16000,
    isPopular: false,
    bg: 'white', color: '#111', border: '#e5e7eb',
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
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#111', position: 'relative', fontFamily: 'var(--font-body)' }}>
      <PageBackground />
      <SharedNavbar />

      <div style={{ position: 'relative', zIndex: 1, paddingTop: 160, paddingBottom: 120 }}>

        {/* Header */}
        <div className="container-custom" style={{ textAlign: 'center', marginBottom: 80 }}>
          <RevealDiv>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 10, 
              background: 'rgba(75, 0, 130, 0.06)', border: '1px solid rgba(75, 0, 130, 0.12)', 
              borderRadius: 9999, padding: '10px 24px', fontSize: 13, fontWeight: 800, 
              color: '#4B0082', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              <Sparkle size={18} weight="bold" /> Upgrade anytime
            </div>
          </RevealDiv>
          <RevealDiv delay={0.1}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#111', marginBottom: 24, lineHeight: 1.1, letterSpacing: '-0.04em' }}>
              Simple pricing for{' '}
              <HighlightedText texts={['students']} />
            </h1>
          </RevealDiv>
          <RevealDiv delay={0.15}>
            <p style={{ fontSize: 20, color: '#64748B', maxWidth: 600, margin: '0 auto 48px', fontWeight: 500, lineHeight: 1.6 }}>
              Start free. Upgrade when you're ready. No tricks, no hidden fees.
            </p>
          </RevealDiv>
          <RevealDiv delay={0.2}>
            <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 9999, padding: 6, gap: 4, border: '1.5px solid #E2E8F0' }}>
              <button 
                onClick={() => setIsSemester(false)} 
                style={{ 
                  padding: '12px 32px', borderRadius: 9999, 
                  background: !isSemester ? '#4B0082' : 'transparent', 
                  color: !isSemester ? 'white' : '#64748B', 
                  fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >Monthly</button>
              <button 
                onClick={() => setIsSemester(true)} 
                style={{ 
                  padding: '12px 32px', borderRadius: 9999, 
                  background: isSemester ? '#4B0082' : 'transparent', 
                  color: isSemester ? 'white' : '#64748B', 
                  fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', transition: 'all 0.2s', 
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}
              >
                Per Semester <span style={{ fontSize: 11, background: '#D1FAE5', color: '#059669', padding: '4px 12px', borderRadius: 9999, fontWeight: 900 }}>Save 40%</span>
              </button>
            </div>
          </RevealDiv>
        </div>

        {/* Plans */}
        <div className="container-full" style={{ marginBottom: 120 }}>
          <RevealDiv>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: 32, 
              maxWidth: 1100, 
              margin: '0 auto'
            }}>
              {plans.map((plan) => (
                <div key={plan.name} style={{
                  background: plan.isPopular ? 'linear-gradient(160deg, #4B0082, #A855F7)' : 'white',
                  color: plan.isPopular ? 'white' : '#111',
                  borderRadius: 40,
                  padding: '48px 40px',
                  border: '1.5px solid #F1F5F9',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  if (!plan.isPopular) e.currentTarget.style.borderColor = '#4B0082';
                  e.currentTarget.style.boxShadow = plan.isPopular 
                    ? '0 20px 40px rgba(75, 0, 130, 0.15)' 
                    : '0 20px 40px rgba(0,0,0,0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  if (!plan.isPopular) e.currentTarget.style.borderColor = '#F1F5F9';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.02)';
                }}>
                  {plan.isPopular && (
                    <div style={{ 
                      position: 'absolute',
                      top: 24,
                      right: 24,
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '0.05em'
                    }}>
                      POPULAR
                    </div>
                  )}

                  <div style={{ marginBottom: 40 }}>
                    <h3 style={{ 
                      fontSize: 28, 
                      fontWeight: 800, 
                      margin: '0 0 12px 0',
                      fontFamily: 'var(--font-display)'
                    }}>{plan.name}</h3>
                    <p style={{ 
                      fontSize: 15, 
                      fontWeight: 600, 
                      margin: 0,
                      opacity: 0.8,
                      fontFamily: 'var(--font-body)'
                    }}>{plan.trial}</p>
                  </div>

                  <div style={{ marginBottom: 40 }}>
                    <div style={{ 
                      fontSize: 56, 
                      fontWeight: 900, 
                      lineHeight: 1,
                      fontFamily: 'var(--font-display)',
                      marginBottom: 8
                    }}>
                      {plan.priceMonthly === 0 ? '₦0' : `₦${isSemester ? plan.priceSemester.toLocaleString() : plan.priceMonthly.toLocaleString()}`}
                    </div>
                    {plan.priceMonthly > 0 && (
                      <div style={{ 
                        fontSize: 16, 
                        fontWeight: 600, 
                        opacity: 0.7,
                        fontFamily: 'var(--font-body)'
                      }}>
                        per {isSemester ? 'semester' : 'month'}
                      </div>
                    )}
                  </div>
                  
                  <PremiumButton 
                    size="lg" 
                    style={{ width: '100%', marginBottom: 40 }}
                    variant={plan.isPopular ? 'primary' : 'outline'}
                  >
                    {plan.buttonText}
                  </PremiumButton>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ 
                        display: 'flex', 
                        gap: 16, 
                        alignItems: 'center'
                      }}>
                        <div style={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          background: plan.isPopular ? 'rgba(255,255,255,0.2)' : 'rgba(75, 0, 130, 0.08)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          flexShrink: 0
                        }}>
                          <Check size={14} weight="bold" color={plan.isPopular ? 'white' : '#4B0082'} />
                        </div>
                        <span style={{ 
                          fontSize: 16, 
                          fontWeight: 500, 
                          lineHeight: 1.4, 
                          fontFamily: 'var(--font-body)'
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
          <div style={{ textAlign: 'center', marginBottom: 120 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 40, fontFamily: 'var(--font-display)' }}>Trusted by students at</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap', opacity: 0.5 }}>
              {['Stanford', 'PRINCETON', 'MIT', 'Harvard', 'Oxford', 'UNILAG'].map(u => <span key={u} style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#64748B' }}>{u}</span>)}
            </div>
          </div>
        </RevealDiv>

        {/* Testimonials */}
        <div style={{ padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <RevealDiv>
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 10, 
                background: 'rgba(75, 0, 130, 0.06)', border: '1px solid rgba(75, 0, 130, 0.12)', 
                borderRadius: 9999, padding: '10px 24px', fontSize: 13, fontWeight: 800, 
                color: '#4B0082', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                <Sparkle size={18} weight="bold" /> Real Success Stories
              </div>
            </RevealDiv>
            <RevealDiv delay={0.1}>
              <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#111', marginBottom: 0, letterSpacing: '-0.03em' }}>
                Join 1,000,000+ smart learners
              </h2>
            </RevealDiv>
          </div>

          {/* Animated Testimonial Cards */}
          <div style={{ 
            display: 'flex', 
            width: '100%', 
            height: '450px',
            maxWidth: '1200px',
            margin: '0 auto',
            gap: '24px',
            justifyContent: 'center'
          }}>
            {/* Scroll Columns */}
            {[0, 1, 2].map((colIndex) => (
              <div key={colIndex} style={{ 
                display: 'flex', 
                width: '100%', 
                height: '100%', 
                maskImage: 'linear-gradient(rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 15%, rgb(0, 0, 0) 85%, rgba(0, 0, 0, 0) 100%)', 
                overflow: 'hidden'
              }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '24px',
                  animation: colIndex === 1 ? 'scrollDown 40s linear infinite' : 'scrollUp 40s linear infinite'
                }}>
                  {[...testimonials, ...testimonials].map((testimonial, index) => (
                    <div key={`${colIndex}-${index}`} style={{
                      background: 'white',
                      border: '1.5px solid #F1F5F9',
                      borderRadius: '24px',
                      padding: '24px',
                      width: '320px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      flexShrink: 0
                    }}>
                      <p style={{ 
                        fontSize: 15, 
                        color: '#475569', 
                        fontWeight: 500, 
                        margin: 0,
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.6
                      }}>
                        "{testimonial.text}"
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          width: '44px', 
                          height: '44px', 
                          borderRadius: '50%',
                          backgroundColor: '#F1F5F9',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          <img 
                            src={testimonial.avatar} 
                            alt={testimonial.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ 
                          fontSize: 15, 
                          fontWeight: 800, 
                          color: '#111',
                          fontFamily: 'var(--font-display)'
                        }}>
                          {testimonial.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

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

        <SharedFAQ items={pricingFaqs} />
      </div>
      <SharedFooter />
    </div>
  );
}
