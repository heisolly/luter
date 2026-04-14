import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  RefreshCw, 
  CheckCircle2, 
  Share2, 
  Zap,
  ArrowLeft,
  Layers,
  Sparkles,
  Award,
  BookOpen
} from 'lucide-react'
import { supabase } from '../supabaseClient'
import confetti from 'canvas-confetti'
import LuterLogo from './shared/LuterLogo'

export default function SharedFlashcardsView() {
  const { bundleId } = useParams()
  const [bundle, setBundle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [idx, setIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [mastered, setMastered] = useState(new Set())
  const [direction, setDirection] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    async function fetchBundle() {
      try {
        const { data, error } = await supabase
          .from('flashcard_bundles')
          .select('*')
          .eq('id', bundleId)
          .single()
        
        if (data) {
          setBundle(data)
          // Increment shared_count
          await supabase.rpc('increment_bundle_share', { bundle_id: bundleId })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchBundle()
  }, [bundleId])

  const handleNext = () => {
    if (idx < (bundle?.cards?.length || 0) - 1) {
      setDirection(1)
      setIdx(idx + 1)
      setIsFlipped(false)
    } else {
      setIsFinished(true)
      triggerConfetti()
    }
  }

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#7a12cc', '#4C1D95', '#10b981']
    })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', fontFamily: "'Outfit', sans-serif" }}>
      <RefreshCw className="animate-spin" size={40} color="#7a12cc" />
      <p style={{ marginTop: 16, color: '#64748b', fontWeight: 600, textTransform: 'lowercase' }}>loading flashcards...</p>
    </div>
  )

  if (!bundle) return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', background: '#fff', textAlign: 'center', padding: '20px', fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ background: '#FEF2F2', padding: '32px', borderRadius: '24px', border: '1.5px solid #EF4444', maxWidth: '400px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#991b1b', textTransform: 'lowercase' }}>oops!</h2>
        <p style={{ color: '#b91c1c', fontWeight: 500 }}>we couldn't find this shared deck. it might have been moved or deleted.</p>
        <Link to="/" style={{ display: 'inline-block', marginTop: '16px', color: '#111', fontWeight: 800, textDecoration: 'none', borderBottom: '2px solid #111' }}>back to home</Link>
      </div>
    </div>
  )

  const card = bundle.cards[idx]
  const progress = (mastered.size / bundle.cards.length) * 100

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: "'Outfit', 'Varela Round', sans-serif" }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <LuterLogo size={48} fontSize={40} />
          <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', padding: '8px 16px', borderRadius: 99, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#7a12cc', textTransform: 'lowercase' }}>shared study session</span>
          </div>
        </div>

        {isFinished ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            style={{ background: '#fff', borderRadius: 32, padding: '60px 40px', border: '1.5px solid #e2e8f0', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)', textAlign: 'center' }}
          >
            <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <Award size={48} color="#7a12cc" />
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 1000, color: '#111', marginBottom: '12px', textTransform: 'lowercase', letterSpacing: '-0.02em' }}>mastery achieved</h2>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '48px', fontWeight: 500, textTransform: 'lowercase' }}>you've finished reviewing this shared deck! ready to dominate the next exam?</p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/signup" style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#111', color: '#fff', textDecoration: 'none', fontWeight: 900, textTransform: 'lowercase', fontSize: '16px' }}>join luter</Link>
              <button 
                onClick={() => { setIdx(0); setIsFinished(false); setMastered(new Set()); setIsFlipped(false); }}
                style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#fff', color: '#111', border: '1.5px solid #111', fontWeight: 900, textTransform: 'lowercase', cursor: 'pointer' }}
              >
                restart deck
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: 1000, color: '#111', marginBottom: '4px', textTransform: 'lowercase', letterSpacing: '-0.02em' }}>{bundle.title}</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13px', color: '#64748b', fontWeight: 800, textTransform: 'lowercase' }}>
                <span>{bundle.cards.length} flashcards</span>
                <span>•</span>
                <span>shared via luter community</span>
              </div>
            </div>

            {/* Premium Flashcard Core */}
            <div style={{ perspective: '2000px', width: '100%', height: '420px', marginBottom: '40px' }}>
              <AnimatePresence mode="wait">
                <motion.div
                   key={idx}
                   initial={{ x: direction * 40, opacity: 0 }}
                   animate={{ x: 0, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
                   exit={{ x: direction * -40, opacity: 0 }}
                   transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
                   style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', cursor: 'pointer', position: 'relative' }}
                   onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Front Side */}
                  <div style={{ 
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden', 
                    background: '#fff', borderRadius: '32px', 
                    border: '1.5px solid #e2e8f0', padding: '48px', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ height: 6, width: 80, background: '#7a12cc', borderRadius: 99, position: 'absolute', top: 32 }}></div>
                    <p style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', color: '#111', lineHeight: 1.4 }}>
                      {card?.front || card?.question}
                    </p>
                    <div style={{ position: 'absolute', bottom: '32px', color: '#7a12cc', fontWeight: 900, fontSize: '12px', textTransform: 'lowercase', letterSpacing: '0.1em' }}>
                      tap to flip
                    </div>
                  </div>

                  {/* Back Side */}
                  <div style={{ 
                    position: 'absolute', inset: 0, backfaceVisibility: 'hidden', 
                    background: '#111', borderRadius: '32px', 
                    padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.2)',
                    transform: 'rotateY(180deg)',
                    border: '1.5px solid #111'
                  }}>
                     <div style={{ height: 6, width: 80, background: '#7a12cc', borderRadius: 99, position: 'absolute', top: 32, opacity: 0.5 }}></div>
                    <p style={{ fontSize: '22px', fontWeight: 600, textAlign: 'center', color: 'white', lineHeight: 1.5 }}>
                      {card?.back || card?.answer}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: 40 }}>
              <button 
                onClick={() => { setDirection(-1); setIdx(Math.max(0, idx - 1)); setIsFlipped(false); }}
                disabled={idx === 0}
                style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fff', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
              >
                <ChevronLeft size={28} />
              </button>

              <div style={{ flex: 1, maxWidth: 300 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'lowercase', marginBottom: 8 }}>
                    <span>deck progress</span>
                    <span>{idx + 1}/{bundle.cards.length}</span>
                 </div>
                 <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${((idx + 1) / bundle.cards.length) * 100}%` }} style={{ height: '100%', background: '#7a12cc' }} />
                 </div>
              </div>

              <button 
                onClick={handleNext}
                style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#111', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/" style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#fff', color: '#111', border: '1.5px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 900, textTransform: 'lowercase', textDecoration: 'none' }}><ArrowLeft size={20} /> join luter</Link>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('🚀 link copied to clipboard!');
                }}
                style={{ flex: 1, padding: '16px', borderRadius: 16, background: '#7a12cc', color: 'white', border: '1.5px solid #111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 900, textTransform: 'lowercase' }}
              >
                <Share2 size={20} /> share link
              </button>
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: 60, paddingBottom: 40 }}>
           <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800, textTransform: 'lowercase', letterSpacing: '0.1em' }}>powered by luter ai tutor</p>
        </div>
      </div>
    </div>
  )
}
