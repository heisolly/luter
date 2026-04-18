import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { 
  Zap, Trophy, Clock, BarChart3, Star, Flame, Loader2, 
  ChevronLeft, BookOpen, Share2, RotateCcw, CheckCircle2, XCircle,
  Award, MessageCircle, Gift, Search, MoreHorizontal, Trash2, Users, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOutletContext } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { toPng } from 'html-to-image'
import LuterLogo from '../shared/LuterLogo'


export default function ExamSessionPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { isMobile, user } = useOutletContext()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(true)
  const [isSharing, setIsSharing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const resultRef = useRef(null)

  useEffect(() => {
    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId])

  async function fetchSessionData() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (data) {
        setSession(data)
        triggerConfetti(data.accuracy >= 50)
      }
    } catch (err) {
      console.error("Error fetching session:", err)
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
        const duration = 3 * 1000;
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

  // --- Share Utilities ---
  const shareReviewLink = async () => {
    const shareUrl = `${window.location.origin}/exam-session/${sessionId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('🚀 session link copied to clipboard!');
      setShowShareModal(false);
    } catch (err) {
      alert('❌ failed to copy link.');
    }
  };

  const downloadResultImage = async () => {
    if (resultRef.current === null) return
    setIsSharing(true)
    try {
      const dataUrl = await toPng(resultRef.current, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a');
      link.download = `luter-result-${sessionId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error downloading image', err)
    } finally {
      setIsSharing(false)
    }
  }

  const copyImageToClipboard = async () => {
    if (resultRef.current === null) return
    setIsSharing(true)
    try {
      const dataUrl = await toPng(resultRef.current, { cacheBust: true, pixelRatio: 2 })
      const blob = await (await fetch(dataUrl)).blob()
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        alert('🎉 Image copied to clipboard!');
      } else {
        alert('Browser support failed. Try downloading.');
      }
    } catch (err) {
      console.error('Error copying image', err)
    } finally {
      setIsSharing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
        <Loader2 className="animate-spin" size={40} color="#7a12cc" />
        <p style={{ marginTop: 16, fontWeight: 700, color: '#666' }}>Loading your session details...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <XCircle size={48} color="#ef4444" />
        <h2 style={{ marginTop: 16, fontWeight: 800 }}>Session not found</h2>
        <button onClick={() => navigate('/dashboard/library')} style={{ marginTop: 24, padding: '12px 24px', background: '#111', color: '#fff', borderRadius: 12, border: 'none', fontWeight: 700, cursor: 'pointer' }}>Back to Library</button>
      </div>
    )
  }

  const { questions = [], user_answers = {}, accuracy = 0, score = 0, course_name, course_code } = session
  const pass = accuracy >= 50

  return (
    <div className="dh-root" style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', 'Varela Round', sans-serif" }}>
      {/* Premium Header */}
      <header style={{ padding: '24px 40px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button 
            onClick={() => navigate('/dashboard/library')}
            style={{ padding: '8px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={20} />
          </button>
          <LuterLogo size={32} fontSize={24} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
           <span style={{ fontSize: '13px', fontWeight: '800', color: '#7a12cc', background: '#7a12cc10', padding: '6px 12px', borderRadius: '8px' }}>
              {course_code}
           </span>
           <span style={{ fontSize: '14px', fontWeight: '700', color: '#666' }}>
              Session History
           </span>
        </div>
      </header>

      <div style={{ flex: 1, padding: isMobile ? '20px 12px 100px' : '40px 20px 100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>
          <div style={{ background: '#fff', borderRadius: 24, position: 'relative' }}>
            
            {/* Shareable Area */}
            <div ref={resultRef} style={{ background: 'white', padding: '10px', overflow: 'visible' }}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    style={{ 
                        background: '#ECFDF5', 
                        borderRadius: 40, 
                        padding: isMobile ? '48px 24px' : '64px 48px', 
                        marginBottom: 40, 
                        position: 'relative', 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        minHeight: isMobile ? 220 : 280,
                        overflow: 'visible',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.02)'
                    }}
                >
                    {/* Left Section: Score */}
                    <div style={{ flex: 1, textAlign: 'left', zIndex: 2 }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#4A5568', textTransform: 'lowercase', marginBottom: 12, letterSpacing: '0.02em', opacity: 0.8 }}>
                            final exam score
                        </div>
                        <div style={{ fontSize: isMobile ? 72 : 120, fontWeight: 1000, color: '#111', lineHeight: 1, display: 'flex', alignItems: 'baseline', letterSpacing: '-0.04em' }}>
                            {score}<span style={{ fontSize: isMobile ? 32 : 48, color: '#D1D5DB', marginLeft: 6 }}>/{questions.length}</span>
                        </div>
                        <div style={{ marginTop: 28, fontSize: isMobile ? 20 : 24, fontWeight: 1000, color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
                            {pass ? 'Smashed it! 🎉' : 'Keep going! 💪'}
                        </div>
                    </div>

                    {/* Right Section: Mascot BREAKOUT */}
                    <div style={{ 
                        position: 'absolute', 
                        right: isMobile ? -30 : -100, 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        zIndex: 10,
                        width: isMobile ? 240 : 440,
                        pointerEvents: 'none'
                    }}>
                        <motion.img 
                            initial={{ x: 40, opacity: 0, scale: 0.9 }}
                            animate={{ x: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                            src="/mock-session-mascot.png" 
                            alt="Mascot" 
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 40 }}>
                {[
                    { label: 'accuracy', value: `${accuracy}%`, icon: <BarChart3 size={20} />, color: '#7a12cc' },
                    { label: 'questions', value: questions.length, icon: <BookOpen size={20} />, color: '#3b82f6' },
                    { label: 'earned xp', value: `+${score * 50}`, icon: <Zap size={20} />, color: '#f59e0b' },
                    { label: 'completion', value: '100%', icon: <Star size={20} />, color: '#22c55e' }
                ].map((stat, i) => (
                    <div key={i} style={{ padding: '24px', borderRadius: 24, background: 'white', border: '1.5px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: stat.color }}>
                        {stat.icon}
                        <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: '0.1em', opacity: 0.8, textTransform: 'lowercase' }}>{stat.label}</span>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 1000, color: '#111' }}>{stat.value}</div>
                    </div>
                ))}
                </div>
            </div>

            {/* Detailed Review Section */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <BookOpen size={20} color="#7a12cc" />
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: 0 }}>Detailed Review</h3>
                <div style={{ flex: 1, height: '1.5px', background: '#f0f0f0' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {questions.map((q, idx) => {
                  const userAns = user_answers[idx];
                  const typeInAns = session.type_in_answers?.[idx];
                  const isCorrect = q.type === 'typein' 
                    ? (typeInAns?.trim()?.toLowerCase() || '') === (q.expectedAnswer?.toLowerCase() || '')
                    : userAns === q.answer;
                  
                  return (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      style={{ 
                        padding: '24px', 
                        borderRadius: 24, 
                        background: isCorrect ? '#f0fdf4' : '#fef2f2', 
                        border: `1.5px solid ${isCorrect ? '#dcfce7' : '#fee2e2'}`,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                        <div style={{ flex: 1 }}>
                           <span style={{ fontSize: 11, fontWeight: 900, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'block' }}>Question {idx + 1}</span>
                           <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.6 }}>{q.question}</p>
                        </div>
                        {isCorrect ? (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>
                            <CheckCircle2 size={20} />
                          </div>
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c' }}>
                            <XCircle size={20} />
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: 16 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#666', marginRight: 8 }}>Your Answer:</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: isCorrect ? '#15803d' : '#b91c1c' }}>
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
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 16, marginTop: 48 }}>
              <button 
                onClick={() => navigate('/dashboard/mock-exam')}
                style={{ flex: 1, padding: '18px', borderRadius: 20, background: '#f8f8f8', color: '#111', border: '1.5px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 900, fontSize: 16 }}
              >
                <RotateCcw size={22} /> Retake Exam
              </button>
              <button 
                onClick={() => setShowShareModal(true)}
                style={{ flex: 1, padding: '18px', borderRadius: 20, background: '#7a12cc', color: 'white', border: '1.5px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontWeight: 900, fontSize: 16 }}
              >
                <Share2 size={22} /> Share Proof
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showShareModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: 440, background: 'white', borderRadius: 32, padding: '32px', border: '1.5px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}
            >
              <button onClick={() => setShowShareModal(false)} style={{ position: 'absolute', top: 24, right: 24, background: '#f8fafc', border: 'none', borderRadius: 12, padding: 8, cursor: 'pointer', color: '#64748b' }}><X size={20} /></button>
              
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 56, height: 56, background: '#f5f3ff', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#7a12cc' }}><Share2 size={28} /></div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', margin: '0 0 8px', textTransform: 'lowercase' }}>share your win!</h2>
                <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, margin: 0, textTransform: 'lowercase' }}>choose how you want to share your progress.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button 
                  onClick={shareReviewLink}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a12cc' }}><BookOpen size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'lowercase' }}>share review link</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>copy link to clipboard</div>
                  </div>
                </button>

                <button 
                  onClick={copyImageToClipboard}
                  disabled={isSharing}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%', opacity: isSharing ? 0.6 : 1 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>{isSharing ? <Loader2 className="animate-spin" size={20} /> : <Award size={20} />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'lowercase' }}>copy score card</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>{isSharing ? 'generating...' : 'copy result image to clipboard'}</div>
                  </div>
                </button>

                <button 
                  onClick={downloadResultImage}
                  disabled={isSharing}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%', opacity: isSharing ? 0.6 : 1 }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>{isSharing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textTransform: 'lowercase' }}>download image</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>{isSharing ? 'downloading...' : 'save result as image'}</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
