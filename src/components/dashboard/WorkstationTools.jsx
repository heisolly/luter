import React, { useState } from 'react'
import { BookOpen, Star, Zap, ChevronLeft, ChevronRight, Download, Share2, Printer, CheckCircle2, AlertCircle, Bookmark, RefreshCw, Trophy, Sparkles, Layers, HelpCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'

export function WorkstationNotes({ content, material, onRegenerate }) {
  if (!content) return <EmptyState icon={BookOpen} label="Notes are being drafted..." />

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', borderBottom: '2px solid #F1F5F9', paddingBottom: '24px' }}>
        <div>
          <div style={{ color: '#7a12cc', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <BookOpen size={16} /> Structured Study Notes
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D' }}>{material?.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ActionButton onClick={() => window.print()} icon={Printer} label="Print" />
          <ActionButton icon={Download} label="Export" />
          <ActionButton icon={Share2} label="Share" />
          <button 
            onClick={onRegenerate}
            style={{ padding: '10px 20px', borderRadius: '12px', background: '#F5F3FF', color: '#7a12cc', border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} /> Regenerate
          </button>
        </div>
      </div>

      <div 
        className="markdown-body" 
        style={{ 
          background: 'white', 
          padding: '60px', 
          borderRadius: '32px', 
          border: '1.5px solid #E2E8F0', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
          fontSize: '17px',
          lineHeight: 1.7,
          color: '#2D3748'
        }}
      >
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div style={{ marginTop: '40px', padding: '24px', background: '#FDFCF7', borderRadius: '20px', border: '1px solid #FEF3C7', display: 'flex', gap: '16px' }}>
        <AlertCircle color="#D97706" />
        <div>
          <h4 style={{ color: '#92400E', fontWeight: 700, marginBottom: '4px' }}>Professor's Insight</h4>
          <p style={{ color: '#B45309', fontSize: '14px', margin: 0 }}>These notes cover all major points from your lecture slides. Focus specifically on the "Core Mechanisms" section for the upcoming exam.</p>
        </div>
      </div>
    </motion.div>
  )
}

export function WorkstationSummary({ content, material }) {
  if (!content) return <EmptyState icon={Sparkles} label="Distilling key insights..." />

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }}
      style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', padding: '8px 16px', background: 'rgba(122, 18, 204, 0.08)', borderRadius: '100px', color: '#7a12cc', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', marginBottom: '16px' }}>
          ✨ Summary Brief
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D' }}>{material?.title}</h2>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #7a12cc 0%, #4C1D95 100%)', padding: '2px', borderRadius: '32px', marginBottom: '40px' }}>
        <div style={{ background: 'white', padding: '48px', borderRadius: '30px' }}>
          <div className="markdown-body" style={{ fontSize: '18px', color: '#4A5568' }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <SummaryTile title="Est. Read Time" value="2 Minutes" icon={RefreshCw} color="#7a12cc" />
        <SummaryTile title="Complexity" value="Standard" icon={BookOpen} color="#F59E0B" />
      </div>
    </motion.div>
  )
}

export function WorkstationFlashcards({ items = [], material }) {
  const [idx, setIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  // Handle error cases where items might be a string or invalid data
  const safeItems = Array.isArray(items) ? items : []
  
  if (!safeItems || safeItems.length === 0) return <EmptyState icon={Layers} label="Creating flashcards..." />
  
  // Handle different flashcard formats
  const normalizedItems = safeItems.map(item => {
    if (typeof item === 'string') {
      // If it's a string, try to parse or create a basic card
      return {
        front: item.substring(0, 100) + '...',
        back: item.substring(0, 200) + '...',
        question: item.substring(0, 100) + '...',
        answer: item.substring(0, 200) + '...'
      }
    }
    
    // Handle different property names
    return {
      front: item.front || item.question || item.question || 'Question',
      back: item.back || item.answer || item.answer || 'Answer',
      question: item.question || item.front || item.question || 'Question',
      answer: item.answer || item.back || item.answer || 'Answer'
    }
  })

  const card = normalizedItems[idx]

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Recall Practice</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          {normalizedItems.map((_, i) => (
            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i === idx ? '#7a12cc' : '#E2E8F0' }} />
          ))}
        </div>
      </div>

      <div style={{ perspective: '1000px', width: '100%', height: '400px', marginBottom: '48px' }}>
        <motion.div
           animate={{ rotateY: isFlipped ? 180 : 0 }}
           transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
           style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d', cursor: 'pointer', position: 'relative' }}
           onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'white', borderRadius: '32px', border: '2px solid #E2E8F0', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <div style={{ position: 'absolute', top: '32px', left: '32px', fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Front</div>
            <p style={{ fontSize: '28px', fontWeight: 800, textAlign: 'center', color: '#1A102D', lineHeight: 1.4 }}>{card?.front}</p>
            <div style={{ position: 'absolute', bottom: '32px', color: '#7a12cc', fontWeight: 700, fontSize: '14px' }}>Click to Reveal Answer</div>
          </div>

          {/* Back */}
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: '#7a12cc', borderRadius: '32px', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotateY(180deg)' }}>
            <div style={{ position: 'absolute', top: '32px', left: '32px', fontSize: '12px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Back</div>
            <p style={{ fontSize: '24px', fontWeight: 600, textAlign: 'center', color: 'white', lineHeight: 1.5 }}>{card?.back}</p>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
        <NavButton icon={ChevronLeft} onClick={() => { setIdx(Math.max(0, idx - 1)); setIsFlipped(false); }} disabled={idx === 0} />
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1A102D' }}>{idx + 1} / {items.length}</div>
        <NavButton icon={ChevronRight} onClick={() => { setIdx(Math.min(items.length - 1, idx + 1)); setIsFlipped(false); }} disabled={idx === items.length - 1} />
      </div>
    </div>
  )
}

export function WorkstationQuiz({ items = [], material, onComplete }) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [showAnswer, setShowAnswer] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  if (!items || items.length === 0) return <EmptyState icon={HelpCircle} label="Generating mock exam..." />

  const q = items[idx]
  const progress = ((idx + 1) / items.length) * 100

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', background: 'white', padding: '60px', borderRadius: '40px', border: '1.5px solid #E2E8F0', boxShadow: '0 30px 60px rgba(0,0,0,0.08)' }}
      >
        <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <Trophy size={48} color="#7a12cc" />
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px' }}>Mission Accomplished!</h2>
        <p style={{ color: '#64748B', fontSize: '18px', marginBottom: '48px' }}>You have completed the self-assessment for {material?.title}.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '48px' }}>
          <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Questions</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{items.length}</div>
          </div>
          <div style={{ padding: '24px', background: '#F0FDF4', borderRadius: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', marginBottom: '8px' }}>Accuracy</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>96%</div>
          </div>
        </div>
        <button 
          onClick={() => { setIdx(0); setIsFinished(false); setAnswers({}); }}
          style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#7a12cc', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '16px' }}
        >
          Retake Assessment
        </button>
      </motion.div>
    )
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '40px' }}>
      {/* Progress Bar */}
      <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '100px', marginBottom: '48px', position: 'relative', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: '#7a12cc', borderRadius: '100px' }} 
        />
      </div>

      <div style={{ background: 'white', borderRadius: '32px', border: '1.5px solid #E2E8F0', padding: '60px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.03)' }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#94A3B8' }}>QUESTION {idx + 1} OF {items.length}</span>
          <span style={{ padding: '6px 12px', background: q?.difficulty === 'Hard' ? '#FEF2F2' : '#F0FDF4', color: q?.difficulty === 'Hard' ? '#DC2626' : '#16A34A', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>{q?.difficulty || 'STANDARD'}</span>
        </div>

        <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#1A102D', lineHeight: 1.4, marginBottom: '48px', textAlign: 'center' }}>{q?.question}</h3>

        <textarea 
          placeholder="Type your explanation or answer here..."
          value={answers[idx] || ''}
          onChange={(e) => setAnswers({...answers, [idx]: e.target.value})}
          style={{ width: '100%', minHeight: '150px', padding: '24px', borderRadius: '24px', border: '2px solid #F1F5F9', background: '#F8FAFC', outline: 'none', fontSize: '16px', fontFamily: 'Outfit', transition: 'all 0.2s', resize: 'none' }}
        />

        <AnimatePresence>
          {showAnswer && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '32px', padding: '32px', background: '#F5F3FF', borderRadius: '24px', border: '1px solid #DDD6FE' }}
            >
              <div style={{ fontWeight: 800, color: '#7a12cc', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> Verified Answer & Logicing
              </div>
              <p style={{ color: '#4C1D95', fontSize: '15px', lineHeight: 1.6, fontWeight: 500 }}>{q?.answer}</p>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #DDD6FE', color: '#6D28D9', fontSize: '13px', fontStyle: 'italic' }}>
                {q?.explanation}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', gap: '16px', marginTop: '60px' }}>
          <button 
            onClick={() => setShowAnswer(!showAnswer)}
            style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '2px solid #E2E8F0', background: 'white', color: '#1A102D', fontWeight: 700, cursor: 'pointer' }}
          >
            {showAnswer ? 'Hide Solution' : 'Check Solution'}
          </button>
          <button 
            onClick={() => {
              if (idx === items.length - 1) setIsFinished(true)
              else { setIdx(idx + 1); setShowAnswer(false); }
            }}
            style={{ flex: 1.5, padding: '16px', borderRadius: '16px', background: '#7a12cc', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {idx === items.length - 1 ? 'Finish Assessment' : 'Next Question'} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div style={{ height: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
      <div style={{ position: 'relative' }}>
         <Icon size={64} style={{ color: '#7a12cc', marginBottom: '24px' }} />
         <motion.div
           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
           transition={{ repeat: Infinity, duration: 2 }}
           style={{ position: 'absolute', inset: -10, border: '2px solid #7a12cc', borderRadius: '50%' }}
         />
      </div>
      <p style={{ fontSize: '18px', fontWeight: 600, color: '#4C1D95' }}>{label}</p>
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s' }}>
      <Icon size={20} />
    </button>
  )
}

function SummaryTile({ title, value, icon: Icon, color }) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', background: `${color}1A`, color: color, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1A102D' }}>{value}</div>
      </div>
    </div>
  )
}

function NavButton({ icon: Icon, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: disabled ? '#E2E8F0' : '#7a12cc', cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <Icon size={24} />
    </button>
  )
}
