import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RiCheckboxCircleFill as CheckCircle2, RiCloseCircleFill as XCircle, RiTimeFill as Clock, RiBarChartFill as BarChart3, RiStarFill as Star, RiAwardFill as Award, RiFlashlightFill as Zap, 
  RiArrowLeftLine as ArrowLeft, RiLoader4Line as Loader2, RiBookOpenFill as BookOpen, RiShareFill as Share2, RiTrophyFill as Trophy, RiArrowRightLine as ArrowRight,
  RiShieldCheckFill as ShieldCheck, RiMagicFill as Sparkles, RiGraduationCapFill as GraduationCap
} from 'react-icons/ri'
import LuterLogo from './shared/LuterLogo'
import confetti from 'canvas-confetti'
import { toPng } from 'html-to-image'

export default function ExamSessionView() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      setSession(data)
      triggerConfetti(data.accuracy >= 50)
    } catch (err) {
      console.error('Error fetching session:', err)
      setError('Session not found or has been deleted.')
    } finally {
      setLoading(false)
    }
  }

  const triggerConfetti = (pass) => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7a12cc', '#fbbf24', '#ffffff', '#22c55e']
    });

    if (pass) {
        const duration = 4 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Luter Exam Review: ${session?.course_code}`,
          text: `Check out my Luter AI study session! I scored ${session?.score}/${session?.total_questions}.`,
          url: shareUrl
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('🚀 Link copied to clipboard!');
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
        <Loader2 className="animate-spin" size={40} color="#7a12cc" />
        <p style={{ marginTop: 16, color: '#64748b', fontWeight: 600 }}>loading session data...</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fcfaff', padding: 20, textAlign: 'center', fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
        <div style={{ background: '#fff', padding: 48, borderRadius: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.05)', maxWidth: 440, border: '1px solid #f0f0f0' }}>
          <LuterLogo size={48} fontSize={40} />
          <h2 style={{ color: '#111', fontWeight: 1000, margin: '24px 0 12px', fontSize: 28 }}>Session missing</h2>
          <p style={{ color: '#666', fontWeight: 500, marginBottom: 32, lineHeight: 1.6 }}>We couldn't find this specific study session. It might have been deleted or the link is incorrect.</p>
          <Link to="/" style={{ display: 'block', padding: '16px 24px', background: '#7a12cc', color: '#fff', borderRadius: 16, textDecoration: 'none', fontWeight: 800, fontSize: 16 }}>Go to Luter Home</Link>
        </div>
      </div>
    )
  }

  const pass = session.accuracy >= 50

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff', 
      fontFamily: "'DM Sans', 'Inter', sans-serif",
      color: '#111'
    }}>
      {/* Marketing Sticky Header */}
      <nav style={{ 
        position: 'sticky', top: 0, zIndex: 1000, background: 'rgba(255,255,255,0.85)', 
        backdropFilter: 'blur(12px)', borderBottom: '1px solid #f0f0f0', padding: '16px 32px'
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <LuterLogo size={32} fontSize={24} />
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/signin" style={{ color: '#666', fontWeight: 700, fontSize: 14, padding: '10px 20px', textDecoration: 'none' }}>Sign In</Link>
            <Link to="/signup" style={{ 
              background: '#7a12cc', color: 'white', fontWeight: 800, fontSize: 14, 
              padding: '10px 24px', borderRadius: 12, textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(122, 18, 204, 0.25)'
            }}>Join Luter Free</Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '60px 20px 100px' }}>
        
        {/* User Info & Badge */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#f5f3ff', padding: '8px 18px', borderRadius: 99, marginBottom: 20 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7a12cc' }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#7a12cc' }}>Luter Official Study Review</span>
           </div>
           <h1 style={{ fontSize: 32, fontWeight: 1000, letterSpacing: '-0.02em', marginBottom: 8 }}>{session.course_code}: {session.course_name}</h1>
           <p style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>Shared with you via Luter AI Tutor</p>
        </div>

        {/* Shareable Result Card */}
        <div ref={resultRef} style={{ background: 'white', padding: '4px', borderRadius: 32, overflow: 'visible' }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              style={{ 
                background: '#ECFDF5', 
                borderRadius: 40, 
                padding: window.innerWidth < 640 ? '48px 24px' : '64px 48px', 
                border: '1.5px solid rgba(0,0,0,0.02)', 
                textAlign: 'left', 
                position: 'relative', 
                overflow: 'visible',
                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                minHeight: window.innerWidth < 640 ? 220 : 280,
                marginBottom: 24
              }}
            >
              {/* Left Section: Score */}
              <div style={{ flex: 1, zIndex: 2 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#4A5568', textTransform: 'lowercase', marginBottom: 8, letterSpacing: '0.02em', opacity: 0.8 }}>
                    final exam score
                </div>
                <div style={{ fontSize: window.innerWidth < 640 ? 64 : 110, fontWeight: 1000, color: '#111', lineHeight: 1, letterSpacing: '-0.05em', display: 'flex', alignItems: 'baseline' }}>
                    {session.score}<span style={{ opacity: 0.2, fontSize: window.innerWidth < 640 ? 28 : 48, marginLeft: 6 }}>/{session.total_questions}</span>
                </div>
                <div style={{ marginTop: 24, fontSize: window.innerWidth < 640 ? 18 : 22, fontWeight: 1000, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
                   {pass ? 'Smashed it! 🚀' : 'Keep on training! 💪'}
                </div>
              </div>

              {/* Right Section: Mascot BREAKOUT */}
              <div style={{ 
                position: 'absolute', 
                right: window.innerWidth < 640 ? -30 : -80, 
                top: '50%', 
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: window.innerWidth < 640 ? 220 : 420,
                pointerEvents: 'none'
              }}>
                <motion.img 
                    initial={{ x: 40, opacity: 0, scale: 0.8 }}
                    animate={{ x: 0, opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                    src="/mock-session-mascot.png" 
                    alt="Mascot" 
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </motion.div>

            {/* Public Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '24px 0 40px' }}>
                {[
                    { label: 'accuracy', value: `${session.accuracy}%`, icon: <BarChart3 size={22} />, color: '#7a12cc' },
                    { label: 'completion date', value: new Date(session.created_at).toLocaleDateString(), icon: <Clock size={22} />, color: '#3b82f6' }
                ].map((stat, i) => (
                    <div key={i} style={{ padding: '24px', borderRadius: 24, background: 'white', border: '1.5px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: stat.color }}>{stat.icon}<span style={{ fontSize: 12, fontWeight: 900, textTransform: 'lowercase', letterSpacing: '0.1em' }}>{stat.label}</span></div>
                        <div style={{ fontSize: 24, fontWeight: 1000, color: '#111' }}>{stat.value}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Primary CTA */}
        <div style={{ marginBottom: 60 }}>
            <Link to="/signup" style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, 
              width: '100%', padding: '24px', borderRadius: 24, background: '#111', color: 'white',
              fontSize: 18, fontWeight: 900, textDecoration: 'none', transition: 'transform 0.2s',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Start Your Own Journey <ArrowRight size={24} />
            </Link>
            <p style={{ textAlign: 'center', fontSize: 14, color: '#666', fontWeight: 600, marginTop: 16 }}>Join 10,000+ students leveraging Luter AI for guaranteed success.</p>
        </div>

        {/* Detailed Review for Friends */}
        <div style={{ marginBottom: 80 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <BookOpen size={24} color="#7a12cc" />
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: 0 }}>Review the Session</h3>
              <div style={{ flex: 1, height: '1.5px', background: '#f0f0f0' }} />
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {session.questions.map((q, idx) => {
                  const userAns = session.user_answers[idx];
                  const typeInAns = session.type_in_answers?.[idx];
                  const isCorrect = q.type === 'typein' 
                    ? (typeInAns?.trim()?.toLowerCase() || '') === (q.expectedAnswer?.toLowerCase() || '')
                    : userAns === q.answer;
                  
                  return (
                    <div key={idx} style={{ 
                      padding: '24px', borderRadius: 24, background: isCorrect ? '#f0fdf4' : '#fef2f2', 
                      border: `1.5px solid ${isCorrect ? '#dcfce7' : '#fee2e2'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                           <p style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.6 }}>{idx + 1}. {q.question}</p>
                        </div>
                        {isCorrect ? <CheckCircle2 size={24} color="#16a34a" /> : <XCircle size={24} color="#ef4444" />}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: 16 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#666', marginRight: 8 }}>Student Answer:</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: isCorrect ? '#166534' : '#b91c1c' }}>
                            {q.type === 'typein' ? (typeInAns || 'Not Answered') : (userAns === -1 ? 'Skipped' : (q.type === 'truefalse' ? (userAns === 1 ? 'True' : 'False') : q.options[userAns]))}
                          </span>
                        </div>

                        {!isCorrect && (
                          <div style={{ background: '#f0fdf4', padding: '16px', borderRadius: 16, border: '1px solid #dcfce7' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginRight: 8 }}>Correct Answer:</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>
                              {q.type === 'typein' ? q.expectedAnswer : (q.type === 'truefalse' ? (q.answer === 1 ? 'True' : 'False') : q.options[q.answer])}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
           </div>
        </div>

        {/* Marketing Footer CTAs */}
        <section style={{ borderTop: '2px solid #f0f0f0', paddingTop: 80 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <h2 style={{ fontSize: 32, fontWeight: 1000, letterSpacing: '-0.04em', color: '#111' }}>Unlock Your Potential with Luter AI</h2>
                <p style={{ fontSize: 16, color: '#666', fontWeight: 500, maxWidth: 440, margin: '16px auto' }}>Luter uses advanced AI to analyze your materials and create customized mock exams just like this one.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 80 }}>
                {[
                    { title: 'AI Study Hub', desc: 'Turn any PDF or note into a mastery tool.', icon: <Sparkles size={24} color="#7a12cc" /> },
                    { title: 'Real-time Battles', desc: 'Compete with friends in live study arenas.', icon: <Award size={24} color="#f59e0b" /> },
                    { title: 'Pass Guarantee', desc: '98% of active Luter users ace their exams.', icon: <ShieldCheck size={24} color="#10b981" /> }
                ].map((feature, i) => (
                    <div key={i} style={{ padding: '32px', borderRadius: 24, border: '1px solid #f0f0f0', background: '#fafafa', textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>{feature.icon}</div>
                        <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{feature.title}</h4>
                        <p style={{ fontSize: 13, color: '#666', fontWeight: 500, lineHeight: 1.5 }}>{feature.desc}</p>
                    </div>
                ))}
            </div>

            <div style={{ 
                background: 'linear-gradient(135deg, #7a12cc 0%, #9718fb 100%)', 
                borderRadius: 40, padding: '80px 40px', textAlign: 'center', color: 'white',
                position: 'relative', overflow: 'hidden', boxShadow: '0 40px 80px -20px rgba(122, 18, 204, 0.4)'
            }}>
                <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.2 }}><GraduationCap size={200} /></div>
                <h2 style={{ fontSize: 40, fontWeight: 1000, margin: 0, position: 'relative', zIndex: 1 }}>Build Your Own Legacy.</h2>
                <p style={{ fontSize: 18, margin: '20px 0 40px', opacity: 0.9, position: 'relative', zIndex: 1 }}>Stop studying hard. Start studying smart with Luter AI.</p>
                <Link to="/signup" style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 12, background: 'white', 
                    color: '#7a12cc', fontWeight: 900, fontSize: 18, padding: '20px 48px', 
                    borderRadius: 20, textDecoration: 'none', position: 'relative', zIndex: 1
                }}>Get Started Now <ArrowRight size={24} /></Link>
            </div>
        </section>

      </main>

      <footer style={{ padding: '48px 20px', textAlign: 'center', borderTop: '1px solid #f0f0f0', background: '#fafafa' }}>
          <LuterLogo size={24} fontSize={20} />
          <p style={{ fontSize: 12, color: '#999', fontWeight: 600, marginTop: 12 }}>© 2026 Luter Learning Studio. All rights reserved.</p>
      </footer>
    </div>
  )
}
