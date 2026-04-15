import React, { useState, useEffect } from 'react'
import { 
  BookOpen, Star, Zap, ChevronLeft, ChevronRight, Download, Share2, Printer, 
  CheckCircle2, AlertCircle, Bookmark, RefreshCw, Trophy, Sparkles, Layers, 
  HelpCircle, Edit3, Wand2, Save 
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../../groqClient'

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

import confetti from 'canvas-confetti'

export function WorkstationFlashcards({ items = [], material, user }) {
  const [idx, setIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [mastered, setMastered] = useState(new Set())
  const [direction, setDirection] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const safeItems = Array.isArray(items) ? items : []
  if (safeItems.length === 0) return <EmptyState icon={Layers} label="Assembling your flashcard deck..." />

  const card = safeItems[idx]
  const progress = (mastered.size / safeItems.length) * 100

  const triggerConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 }
    const randomInRange = (min, max) => Math.random() * (max - min) + min

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)
      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)
  }

  const handleNext = () => {
    if (idx < safeItems.length - 1) {
      setDirection(1)
      setIdx(idx + 1)
      setIsFlipped(false)
    } else {
      setIsFinished(true)
      triggerConfetti()
    }
  }

  const handleMastered = () => {
    setMastered(prev => new Set([...prev, idx]))
    handleNext()
  }

  const handleShare = async () => {
    if (isSharing) return
    setIsSharing(true)
    try {
      const { data, error } = await supabase
        .from('flashcard_bundles')
        .insert({
          user_id: user?.id,
          material_id: material?.id,
          title: `Flashcards: ${material?.title || 'Untitled'}`,
          cards: safeItems
        })
        .select('id')
        .single()
      
      if (data) {
        const shareUrl = `${window.location.origin}/share/flashcards/${data.id}`
        await navigator.clipboard.writeText(shareUrl)
        alert('Flashcard Bundle Link copied to clipboard!')
      } else {
        throw error
      }
    } catch (err) {
      console.error(err)
      alert('Failed to create bundle link. Make sure you are logged in.')
    } finally {
      setIsSharing(false)
    }
  }

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', background: 'white', padding: '60px', borderRadius: '40px', border: '1.5px solid #E2E8F0', boxShadow: '0 30px 60px rgba(0,0,0,0.08)' }}
      >
        <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <Zap size={48} color="#7a12cc" />
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '16px', color: '#1A102D' }}>Mastery Achieved!</h2>
        <p style={{ color: '#64748B', fontSize: '18px', marginBottom: '48px' }}>You've reviewed the entire deck. Your retention is looking strong!</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '48px' }}>
          <div style={{ padding: '24px', background: '#F0FDF4', borderRadius: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#16A34A', textTransform: 'uppercase', marginBottom: '8px' }}>Mastered</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{mastered.size}</div>
          </div>
          <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '8px' }}>Deck Size</div>
            <div style={{ fontSize: '24px', fontWeight: 800 }}>{safeItems.length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => { setIdx(0); setIsFinished(false); setMastered(new Set()); setIsFlipped(false); }}
            style={{ flex: 1, padding: '18px', borderRadius: '20px', border: '2.5px solid #F1F5F9', background: 'white', fontWeight: 800, cursor: 'pointer', color: '#1A102D' }}
          >
            Reset Deck
          </button>
          <button 
            onClick={handleShare}
            style={{ flex: 2, padding: '18px', borderRadius: '20px', background: '#7a12cc', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {isSharing ? 'Generating...' : <><Share2 size={20} /> Share Bundle</>}
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
           <div style={{ fontSize: '12px', fontWeight: 900, color: '#7a12cc', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Active Session</div>
           <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#1A102D' }}>{material?.title || 'Recall Training'}</h2>
        </div>
        <button 
          onClick={handleShare}
          style={{ padding: '10px 20px', borderRadius: '12px', background: '#F5F3FF', color: '#7a12cc', border: '1px solid #E2E8F0', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isSharing ? <RefreshCw className="animate-spin" size={16} /> : <Share2 size={16} />} Share Deck
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          <span>Current Progress: {idx + 1}/{safeItems.length}</span>
          <span>Mastery: {Math.round(progress)}%</span>
        </div>
        <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
          <motion.div 
            animate={{ width: `${((idx + 1) / safeItems.length) * 100}%` }}
            style={{ height: '100%', background: '#E2E8F0', transition: 'width 0.3s' }} 
          />
          <motion.div 
            animate={{ width: `${progress}%` }}
            style={{ height: '100%', background: '#10B981', position: 'absolute', left: 0, transition: 'width 0.3s' }} 
          />
        </div>
      </div>

      {/* Card UI */}
      <div style={{ perspective: '2000px', height: '400px', marginBottom: '48px', position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ x: direction * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1, rotateY: isFlipped ? 180 : 0 }}
            exit={{ x: direction * -50, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'relative', 
              transformStyle: 'preserve-3d', 
              cursor: 'pointer' 
            }}
          >
            {/* Front Side */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: 'white', borderRadius: '32px', border: '2px solid #F1F5F9',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '60px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)'
            }}>
              <div style={{ position: 'absolute', top: '32px', padding: '6px 14px', background: '#F8FAFC', borderRadius: '99px', fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Question</div>
              <p style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', color: '#1A102D', lineHeight: 1.4 }}>
                {card?.front || card?.question}
              </p>
              <div style={{ position: 'absolute', bottom: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: '#7a12cc' }}>
                <Sparkles size={14} /> <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>Click to Reveal</span>
              </div>
            </div>

            {/* Back Side */}
            <div style={{
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
              background: '#1A102D', borderRadius: '32px', border: '2px solid #1A102D',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '60px', transform: 'rotateY(180deg)', boxShadow: '0 30px 60px -15px rgba(0,0,0,0.3)'
            }}>
              <div style={{ position: 'absolute', top: '32px', padding: '6px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', fontSize: '11px', fontWeight: 800, color: 'white', textTransform: 'uppercase', opacity: 0.6 }}>Answer</div>
              <p style={{ fontSize: '20px', fontWeight: 600, textAlign: 'center', color: 'white', lineHeight: 1.6 }}>
                {card?.back || card?.answer}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
        <button 
          onClick={(e) => { e.stopPropagation(); setDirection(-1); setIdx(Math.max(0, idx - 1)); setIsFlipped(false); }}
          disabled={idx === 0}
          style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'white', border: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? '#CBD5E1' : '#1A102D', cursor: idx === 0 ? 'default' : 'pointer', transition: 'all 0.2s' }}
        >
          <ChevronLeft size={28} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(140px, 1fr) minmax(140px, 1fr)', gap: '16px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); handleNext(); }}
            style={{ padding: '20px 32px', borderRadius: '22px', background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px' }}
          >
            Skip
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleMastered(); }}
            style={{ padding: '20px 32px', borderRadius: '22px', background: '#DCFCE7', color: '#16A34A', border: 'none', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)' }}
          >
            <CheckCircle2 size={20} /> Mastered
          </button>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); setDirection(1); handleNext(); }}
          style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#1A102D', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  )
}

export function WorkstationQuiz({ items = [], material, onComplete }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState({})
  const [typeInAnswers, setTypeInAnswers] = useState({})
  const [isFinished, setIsFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  // Handle items being an object with a questions array or just an array
  const safeQuestions = Array.isArray(items) ? items : (items?.questions || [])
  
  if (safeQuestions.length === 0) return <EmptyState icon={HelpCircle} label="Generating your practice quiz..." />

  const q = safeQuestions[idx]
  const progress = ((idx + 1) / safeQuestions.length) * 100
  const isAnswered = selected[idx] !== undefined || typeInAnswers[idx] !== undefined

  const calculateScore = () => {
    return safeQuestions.reduce((acc, question, index) => {
      const userAns = selected[index]
      if (question.type === 'typein') {
        const userText = (typeInAnswers[index] || '').trim().toLowerCase()
        const expected = (question.expected_answer || question.answer || '').trim().toLowerCase()
        return acc + (userText && userText === expected ? 1 : 0)
      }
      return acc + (userAns == (question.correct_answer ?? question.answer) ? 1 : 0)
    }, 0)
  }

  const handleSelect = (choiceIdx) => {
    if (isAnswered) return
    setSelected(prev => ({ ...prev, [idx]: choiceIdx }))
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (idx < safeQuestions.length - 1) {
      setIdx(idx + 1)
      setShowExplanation(false)
    } else {
      setIsFinished(true)
    }
  }

  if (isFinished) {
    const score = calculateScore()
    const accuracy = Math.round((score / safeQuestions.length) * 100)
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: '600px', margin: '40px auto', background: 'white', padding: '48px', borderRadius: '32px', border: '1.5px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}
      >
        <div style={{ width: '80px', height: '80px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Trophy size={40} color="#7a12cc" />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1A102D', marginBottom: '8px' }}>Session Complete!</h2>
        <p style={{ color: '#64748B', fontSize: '16px', marginBottom: '32px' }}>Great focus! You've analyzed your understanding of {material?.title}.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '20px', border: '1.5px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Accuracy</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: accuracy >= 50 ? '#10B981' : '#EF4444' }}>{accuracy}%</div>
          </div>
          <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '20px', border: '1.5px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px' }}>Correct</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#1A102D' }}>{score}/{safeQuestions.length}</div>
          </div>
        </div>

        <button 
          onClick={() => { setIdx(0); setIsFinished(false); setSelected({}); setTypeInAnswers({}); setShowExplanation(false); }}
          style={{ width: '100%', padding: '16px', borderRadius: '16px', background: '#7a12cc', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '15px', boxShadow: '0 10px 20px -5px rgba(122, 18, 204, 0.3)' }}
        >
          Retake Assessment
        </button>
      </motion.div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Quiz Progress Bar */}
      <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', marginBottom: '40px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          style={{ height: '100%', background: '#7a12cc', borderRadius: '99px' }}
        />
      </div>

      <motion.div 
        key={idx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '24px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>Question {idx + 1} / {safeQuestions.length}</span>
          <span style={{ padding: '4px 12px', background: '#F0FDF4', color: '#166534', borderRadius: '99px', fontSize: '11px', fontWeight: 800 }}>Practice Mode</span>
        </div>

        {/* Question Area */}
        <div style={{ background: '#F5F3FF', borderRadius: '24px', padding: '32px', width: '100%', marginBottom: '32px', boxShadow: '0 4px 15px rgba(122, 18, 204, 0.05)', border: '1.5px solid #E0E7FF' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1A102D', lineHeight: 1.5, margin: 0, textAlign: 'center' }}>{q.question}</h3>
        </div>

        {/* Options Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginBottom: '32px' }}>
          {(q.type === 'multiple' || !q.type) && q.options?.map((opt, i) => {
            const isUserSelected = selected[idx] === i
            const correctAns = q.correct_answer ?? q.answer
            const isCorrect = isAnswered && i == correctAns
            const isWrong = isAnswered && isUserSelected && i != correctAns

            return (
              <motion.button
                key={i}
                whileHover={{ y: isAnswered ? 0 : -2 }}
                whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                onClick={() => handleSelect(i)}
                disabled={isAnswered}
                style={{ 
                  padding: '18px 24px', 
                  borderRadius: '16px', 
                  background: isCorrect ? '#DCFCE7' : isWrong ? '#FEF2F2' : (isUserSelected ? '#F5F3FF' : 'white'), 
                  border: isCorrect ? '2px solid #22C55E' : isWrong ? '2px solid #EF4444' : (isUserSelected ? '2px solid #7a12cc' : '1.5px solid #E2E8F0'),
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#1A3A32' }}>
                  {String.fromCharCode(65 + i)}. {typeof opt === 'object' ? (opt.text || opt.choice || JSON.stringify(opt)) : opt}
                </span>
                {isCorrect && <CheckCircle2 size={18} color="#22C55E" />}
                {isWrong && <AlertCircle size={18} color="#EF4444" />}
              </motion.button>
            )
          })}

          {q.type === 'truefalse' && [1, 0].map((val) => {
            const isUserSelected = selected[idx] === val
            const correctAns = q.correct_answer ?? q.answer
            const isCorrect = isAnswered && val == correctAns
            const isWrong = isAnswered && isUserSelected && val != correctAns
            const label = val === 1 ? 'True' : 'False'

            return (
              <motion.button
                key={val}
                whileHover={{ y: isAnswered ? 0 : -2 }}
                onClick={() => handleSelect(val)}
                disabled={isAnswered}
                style={{ 
                  padding: '18px 24px', 
                  borderRadius: '16px', 
                  background: isCorrect ? '#DCFCE7' : isWrong ? '#FEF2F2' : (isUserSelected ? '#F5F3FF' : 'white'), 
                  border: isCorrect ? '2px solid #22C55E' : isWrong ? '2px solid #EF4444' : (isUserSelected ? '2px solid #7a12cc' : '1.5px solid #E2E8F0'),
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#1A3A32' }}>{label}</span>
                {isCorrect && <CheckCircle2 size={18} color="#22C55E" />}
                {isWrong && <AlertCircle size={18} color="#EF4444" />}
              </motion.button>
            )
          })}

          {q.type === 'typein' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <textarea 
                placeholder="Type your answer here..."
                value={typeInAnswers[idx] || ''}
                onChange={(e) => setTypeInAnswers(prev => ({ ...prev, [idx]: e.target.value }))}
                disabled={isAnswered}
                style={{ width: '100%', minHeight: '120px', padding: '20px', borderRadius: '16px', background: 'white', border: '1.5px solid #E2E8F0', outline: 'none', fontSize: '16px', fontFamily: 'inherit', resize: 'none' }}
              />
              {!isAnswered && (
                <button 
                  onClick={() => setShowExplanation(true)}
                  style={{ alignSelf: 'flex-end', padding: '10px 24px', borderRadius: '12px', background: '#7a12cc', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  Submit Answer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Explanation Block */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ width: '100%', background: '#F8F9FF', borderRadius: '20px', padding: '24px', border: '1.5px solid #E0E7FF', marginBottom: '32px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4338CA', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>
                <Sparkles size={14} /> Explanation & Reasoning
              </div>
              <p style={{ margin: 0, color: '#374151', fontSize: '14px', lineHeight: 1.6 }}>{q.explanation}</p>
              {q.type === 'typein' && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E0E7FF' }}>
                  <span style={{ fontWeight: 800, fontSize: '11px', color: '#166534' }}>Expected Answer: </span>
                  <span style={{ fontSize: '14px', color: '#14532D', fontWeight: 600 }}>{q.expected_answer || q.answer}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
           onClick={handleNext}
           disabled={!isAnswered}
           style={{ alignSelf: 'flex-end', padding: '14px 32px', borderRadius: '14px', background: isAnswered ? '#1A102D' : '#E2E8F0', color: 'white', fontWeight: 800, border: 'none', cursor: isAnswered ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
        >
          {idx === safeQuestions.length - 1 ? 'Finish Assessment' : 'Next Question'} <ChevronRight size={18} />
        </button>
      </motion.div>
    </div>
  )
}

function EmptyState({ icon: Icon, label }) {
  return (
    <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', marginBottom: '32px' }}>
         <Icon size={64} style={{ color: 'var(--luter-primary)' }} />
         <motion.div
           animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.4, 0.2] }}
           transition={{ repeat: Infinity, duration: 2.5 }}
           style={{ position: 'absolute', inset: -15, border: '2px solid var(--luter-primary)', borderRadius: '50%' }}
         />
      </div>
      <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--luter-primary-dark)', letterSpacing: '-0.01em' }}>{label}</p>
      <div style={{ marginTop: '16px', fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Luter is drafting...</div>
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
    <button onClick={onClick} disabled={disabled} style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: disabled ? '#E2E8F0' : '#7a12cc', cursor: disabled ? 'default' : 'pointer', transition: 'all 0.2s', boxShadow: 'none' }}>
      <Icon size={24} />
    </button>
  )
}

/**
 * WorkstationSummaryEnhanced
 * Supports Full Summary and Page-by-Page Summary
 */
export function WorkstationSummaryEnhanced({ content, material, pageSummaries = {}, onFetchPageSummaries }) {
  const [viewMode, setViewMode] = useState('full');
  const [isSummarizingPages, setIsSummarizingPages] = useState(false);

  const handleFetchPages = async () => {
    setIsSummarizingPages(true);
    await onFetchPageSummaries();
    setIsSummarizingPages(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '900px', margin: '0 auto', padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D', marginBottom: '8px' }}>Course Insights</h1>
          <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Distilled intelligence from your study material.</p>
        </div>
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <button 
            onClick={() => setViewMode('full')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'full' ? 'white' : 'transparent', color: viewMode === 'full' ? '#1A102D' : '#64748B', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Full Summary
          </button>
          <button 
            onClick={() => setViewMode('pages')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'pages' ? 'white' : 'transparent', color: viewMode === 'pages' ? '#1A102D' : '#64748B', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            By Page
          </button>
        </div>
      </div>

      {viewMode === 'full' ? (
        <div style={{ background: 'white', padding: '60px', borderRadius: '32px', border: '1.5px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)' }}>
          <div className="markdown-body" style={{ fontSize: '17px', lineHeight: 1.8, color: '#2D3748' }}>
            <ReactMarkdown>{content || "Summary is still being processed..."}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.keys(pageSummaries).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '32px', border: '1px dashed #CBD5E1' }}>
              <div style={{ width: '64px', height: '64px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7a12cc' }}>
                 <Sparkles size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1A102D', marginBottom: '8px' }}>Page-by-Page Insights</h3>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', maxWidth: '300px', margin: '0 auto 24px' }}>Deep dive into every single page of your material with granular summaries.</p>
              <button 
                onClick={handleFetchPages}
                disabled={isSummarizingPages}
                style={{ padding: '12px 24px', background: 'var(--luter-primary-dark)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
              >
                {isSummarizingPages ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                {isSummarizingPages ? 'Generating...' : 'Analyze Page by Page'}
              </button>
            </div>
          ) : (
            Object.entries(pageSummaries).sort(([a],[b]) => parseInt(a)-parseInt(b)).map(([pg, sum]) => (
              <motion.div key={pg} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #E2E8F0', display: 'flex', gap: '24px' }}>
                <div style={{ padding: '12px 16px', background: '#F8FAFB', borderRadius: '12px', border: '1.5px solid #F1F5F9', height: 'fit-content', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase' }}>PAGE</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#1A102D' }}>{pg}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="markdown-body" style={{ fontSize: '15px', lineHeight: 1.6, color: '#334155' }}>
                    <ReactMarkdown>{typeof sum === 'string' ? sum : "No insights for this page."}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}

/**
 * WorkstationWrite
 * A dedicated space for personal study notes with AI assistance
 */
export function WorkstationWrite({ initialContent = "", onSave, material, user }) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssisting, setIsAssisting] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleAiAssist = async (type) => {
    if (isAssisting) return;
    setIsAssisting(true);
    try {
      const prompt = `You are Luter AI. Assist the student with their study notes. 
MATERIAL TITLE: ${material?.title}
MATERIAL CONTEXT (Extracted): ${material?.extracted_text?.slice(0, 4000)}

STUDENT CURRENT JOTS:
"""
${content}
"""

TASK: ${type === 'points' ? 'Expand these jots into structured academic points.' : 'Extract any important formulas, dates, or key terms from the context related to these jots.'}
Return the assistance in markdown format. Be concise.`;

      const res = await callGroqAPI([{ role: 'user', content: prompt }], GROQ_MODELS.SPEEDSTER, { systemPromptOverride: "You are an advanced academic study assistant." });
      const aiNote = res.choices[0].message.content;
      setContent(prev => prev + "\n\n---\n### AI Assist:\n" + aiNote);
    } catch (e) {
      console.error('AI Assist error:', e);
    } finally {
      setIsAssisting(false);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    await onSave(content);
    setIsSaving(false);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', background: 'white' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ color: 'var(--luter-primary)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={12} /> Notepad
            </div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#1A102D', margin: 0 }}>Study Jottings</h1>
          </div>
          <button 
            onClick={handleManualSave}
            disabled={isSaving}
            style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--luter-primary-dark)', border: 'none', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSaving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
            {isSaving ? 'Saving' : 'Save'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => handleAiAssist('points')}
            disabled={isAssisting}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#7a12cc', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Sparkles size={14} /> AI Points
          </button>
          <button 
            onClick={() => handleAiAssist('formulas')}
            disabled={isAssisting}
            style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#FFF7ED', border: '1px solid #FFEDD5', color: '#EA580C', fontWeight: '700', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Zap size={14} /> Formulas
          </button>
        </div>
      </header>

      <div style={{ flex: 1, position: 'relative', background: '#F9FAFB', borderRadius: '16px', border: '1px solid var(--luter-border)', padding: '20px' }}>
        <textarea 
          placeholder="Start jotting down what you're learning..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ width: '100%', height: '100%', border: 'none', resize: 'none', outline: 'none', fontSize: '15px', lineHeight: '1.6', color: '#334155', background: 'transparent', fontFamily: 'inherit' }}
        />
        {isAssisting && (
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', padding: '8px 16px', background: 'rgba(26, 16, 45, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '100px', color: 'white', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={12} className="animate-pulse" />
            Luter is thinking...
          </div>
        )}
      </div>
    </div>
  );
}
