import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, BarChart3, Star, Award, Zap, ArrowLeft, Loader2, BookOpen, Share2 } from 'lucide-react'
import LuterLogo from './shared/LuterLogo'

export default function ExamSessionView() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showReview, setShowReview] = useState(true)

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
    } catch (err) {
      console.error('Error fetching session:', err)
      setError('Session not found or has been deleted.')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Luter Exam Review: ${session?.course_code}`,
          text: `Check out this exam session on Luter!`,
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
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', fontFamily: "'Outfit', 'Varela Round', sans-serif" }}>
        <Loader2 className="animate-spin" size={40} color="#7a12cc" />
        <p style={{ marginTop: 16, color: '#64748b', fontWeight: 600 }}>loading session data...</p>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 20, textAlign: 'center', fontFamily: "'Outfit', 'Varela Round', sans-serif" }}>
        <div style={{ background: '#FEF2F2', padding: 32, borderRadius: 24, border: '1.5px solid #EF4444', maxWidth: 400 }}>
          <h2 style={{ color: '#991b1b', fontWeight: 900, marginBottom: 12 }}>oops!</h2>
          <p style={{ color: '#b91c1c', fontWeight: 500, marginBottom: 24 }}>{error || 'we couldn\'t find this session.'}</p>
          <Link to="/" style={{ display: 'inline-block', padding: '12px 24px', background: '#111', color: '#fff', borderRadius: 12, textDecoration: 'none', fontWeight: 700 }}>back to home</Link>
        </div>
      </div>
    )
  }

  const pass = session.accuracy >= 50

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: "'Outfit', 'Varela Round', sans-serif" }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <LuterLogo size={48} fontSize={40} />
          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', padding: '8px 16px', borderRadius: 99, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#7a12cc', textTransform: 'lowercase' }}>exam review session</span>
          </div>
        </div>

        {/* Result Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#fff', borderRadius: 32, padding: '40px', border: '1.5px solid #e2e8f0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', marginBottom: 24, textAlign: 'center', position: 'relative', overflow: 'hidden' }}
        >
          {/* Status Badge */}
          <div style={{ position: 'absolute', top: 24, right: 24 }}>
            <div style={{ background: pass ? '#DCFCE7' : '#FEF2F2', color: pass ? '#166534' : '#991b1b', padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 800, textTransform: 'lowercase' }}>
              {pass ? 'passed' : 'failed'}
            </div>
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', marginBottom: 4, textTransform: 'lowercase' }}>{session.course_code}</h2>
          <p style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginBottom: 32, textTransform: 'lowercase' }}>{session.course_name}</p>

          <div style={{ fontSize: 88, fontWeight: 1000, color: '#111', lineHeight: 1, letterSpacing: '-0.05em', marginBottom: 8 }}>
            {session.score}<span style={{ opacity: 0.3, fontSize: 32 }}>/{session.total_questions}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#64748b', textTransform: 'lowercase', letterSpacing: '0.2em', marginBottom: 40 }}>final score</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'accuracy', value: `${session.accuracy}%`, icon: <BarChart3 size={18} />, color: '#7a12cc' },
              { label: 'date', value: new Date(session.created_at).toLocaleDateString(), icon: <Clock size={18} />, color: '#10b981' }
            ].map((stat, i) => (
              <div key={i} style={{ padding: '16px', borderRadius: 20, background: '#f8fafc', border: '1.5px solid #eee', display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: stat.color }}>{stat.icon}<span style={{ fontSize: 10, fontWeight: 900, textTransform: 'lowercase', opacity: 0.8 }}>{stat.label}</span></div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
          <Link to="/" style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#fff', color: '#111', border: '1.5px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 900, textTransform: 'lowercase', textDecoration: 'none' }}><ArrowLeft size={20} /> join luter</Link>
          <button onClick={handleShare} style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#7a12cc', color: 'white', border: '1.5px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 900, textTransform: 'lowercase' }}><Share2 size={20} /> share session</button>
        </div>

        {/* Review Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <BookOpen size={20} color="#111" />
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: 0, textTransform: 'lowercase' }}>detailed review</h3>
          </div>

          {session.questions.map((q, idx) => {
            const userAns = session.user_answers[idx];
            const isCorrect = q.type === 'typein' 
              ? !!session.type_in_answers[idx]?.trim() 
              : userAns === q.answer;
            
            return (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                style={{ padding: '24px', borderRadius: 24, background: isCorrect ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${isCorrect ? '#dcfce7' : '#fee2e2'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#111', margin: 0, lineHeight: 1.5 }}>{idx + 1}. {q.question}</p>
                  {isCorrect ? <CheckCircle2 size={20} color="#22c55e" /> : <XCircle size={20} color="#ef4444" />}
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.5)', padding: '12px 16px', borderRadius: 12, fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>
                  {q.type === 'typein' ? (
                    <>your answer: <span style={{ color: '#111' }}>{session.type_in_answers[idx] || 'none'}</span></>
                  ) : (
                    <>your answer: <span style={{ color: isCorrect ? '#166534' : '#991b1b' }}>{userAns === -1 ? 'skipped' : (q.type === 'truefalse' ? (userAns === 1 ? 'true' : 'false') : q.options[userAns])}</span></>
                  )}
                </div>

                {!isCorrect && (
                  <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 12, background: '#fff', border: '1.5px solid #fee2e2', fontSize: 13, color: '#166534', fontWeight: 700, textTransform: 'lowercase' }}>
                    correct answer: {q.type === 'typein' ? q.expectedAnswer : (q.type === 'truefalse' ? (q.answer === 1 ? 'true' : 'false') : q.options[q.answer])}
                  </div>
                )}

                {q.explanation && (
                  <div style={{ marginTop: 12, fontSize: 12, color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>
                    <strong>Insight:</strong> {q.explanation}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 60, paddingBottom: 40 }}>
          <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>powered by luter ai tutor</p>
        </div>
      </div>
    </div>
  )
}
