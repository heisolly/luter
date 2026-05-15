import React, { useState, useEffect } from 'react'
import { 
  RiBookOpenFill as BookOpen, RiStarFill as Star, RiFlashlightFill as Zap, RiArrowLeftSLine as ChevronLeft, RiArrowRightSLine as ChevronRight, 
  RiDownloadFill as Download, RiShareForwardFill as Share2, RiPrinterFill as Printer, 
  RiCheckboxCircleFill as CheckCircle, RiErrorWarningFill as AlertCircle, RiBookmarkFill as Bookmark, RiRefreshLine as RefreshCw, 
  RiTrophyFill as Trophy, RiMagicFill as Sparkle, RiStackFill as Layers, RiQuestionFill as HelpCircle, 
  RiPencilFill as PencilLine, RiMagicFill as Wand2, RiSaveFill as Save,
  RiCloseCircleFill as XCircle, RiListCheck as List, RiLayoutMasonryFill as Layout, RiEyeFill as Eye, RiTimeFill as Clock, RiBarChartFill as BarChart3, RiGraduationCapFill as GraduationCap,
  RiLoader4Line as CircleNotch, RiStickyNoteFill as NoteIcon
} from 'react-icons/ri'
import ReactMarkdown from 'react-markdown'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../../groqClient'
import canvasConfetti from 'canvas-confetti'
import LuterLogo from '../shared/LuterLogo'
import { FlashcardEngine as FlashcardEngineComponent } from './flashcards/FlashcardEngine'

export function WorkstationNotes({ content, material, onRegenerate }) {
  if (!content) return <EmptyState icon={BookOpen} label="Notes are being drafted..." />

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', fontFamily: "var(--font-varela)" }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '24px 32px', borderRadius: '24px', border: '1.5px solid #F1F5F9', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.04)' }}>
        <div>
          <div style={{ color: '#4B0082', fontSize: '13px', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "var(--font-outfit)" }}>
             <BookOpen size={16} /> Structured study notes
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1A102D', margin: 0, fontFamily: "var(--font-outfit)", letterSpacing: '-0.02em' }}>{material?.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ActionButton onClick={() => window.print()} icon={Printer} label="Print" />
          <ActionButton icon={Download} label="Export" />
          <ActionButton icon={Share2} label="Share" />
          <button 
            onClick={onRegenerate}
            style={{ padding: '12px 24px', borderRadius: '14px', background: '#6D28D9', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px -5px rgba(109, 40, 217, 0.25)', fontFamily: 'var(--font-outfit)' }}
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
          borderRadius: '40px', 
          border: '1.5px solid #E2E8F0', 
          boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.08)',
          fontSize: '18px',
          lineHeight: 1.8,
          color: '#2D3748',
          position: 'relative'
        }}
      >
        <div style={{ position: 'absolute', top: 32, right: 40, opacity: 0.05 }}><LuterLogo size={120} /></div>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div style={{ marginTop: '40px', padding: '32px', background: '#FFFBEB', borderRadius: '32px', border: '1.5px solid #FEF3C7', display: 'flex', gap: '24px', alignItems: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle weight="bold" size={28} color="#D97706" />
        </div>
        <div>
          <h4 style={{ color: '#92400E', fontWeight: 700, marginBottom: '4px', fontSize: '18px', fontFamily: "var(--font-outfit)" }}>Professor's Insight</h4>
          <p style={{ color: '#B45309', fontSize: '15px', margin: 0, fontWeight: 500 }}>These notes cover all major points from your lecture slides. Focus specifically on the "Core Mechanisms" section for the upcoming exam.</p>
        </div>
      </div>
    </motion.div>
  )
}

export function WorkstationSummary({ content, material }) {
  if (!content) return <EmptyState icon={Sparkle} label="Distilling key insights..." />

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }}
      style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', fontFamily: "var(--font-varela)" }}
    >
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', padding: '10px 20px', background: 'rgba(75, 0, 130, 0.08)', borderRadius: '100px', color: '#4B0082', fontWeight: 600, fontSize: '12px', marginBottom: '20px', border: '1px solid rgba(75, 0, 130, 0.1)', fontFamily: "var(--font-outfit)", letterSpacing: '0.03em' }}>
          ✨ Summary Brief
        </div>
        <h2 style={{ fontSize: '36px', fontWeight: 700, color: '#1A102D', fontFamily: "var(--font-outfit)", letterSpacing: '-0.03em' }}>{material?.title}</h2>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #4B0082 0%, #4C1D95 100%)', padding: '2px', borderRadius: '40px', marginBottom: '48px', boxShadow: '0 30px 60px -12px rgba(75, 0, 130, 0.2)' }}>
        <div style={{ background: 'white', padding: '56px', borderRadius: '38px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.03 }}><LuterLogo size={180} /></div>
          <div className="markdown-body" style={{ fontSize: '19px', color: '#4A5568', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <SummaryTile title="Est. Read Time" value="2 Minutes" icon={Clock} color="#4B0082" />
        <SummaryTile title="Complexity" value="Standard" icon={Layout} color="#F59E0B" />
      </div>
    </motion.div>
  )
}


export function WorkstationFlashcards({ flashcards = [], items = [], material, user, onRegenerate }) {
  const getItems = () => {
    if (Array.isArray(flashcards) && flashcards.length > 0) return flashcards
    if (flashcards?.flashcards && Array.isArray(flashcards.flashcards)) return flashcards.flashcards
    if (flashcards?.items && Array.isArray(flashcards.items)) return flashcards.items
    if (Array.isArray(items) && items.length > 0) return items
    if (items?.flashcards && Array.isArray(items.flashcards)) return items.flashcards
    return []
  }
  const safeItems = getItems()
  
  return <FlashcardEngineComponent material={material} items={safeItems} user={user} onRegenerate={onRegenerate} />
}


export function WorkstationQuiz({ quiz = [], items = [], material, onComplete, onRegenerate }) {
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState({})
  const [typeInAnswers, setTypeInAnswers] = useState({})
  const [isFinished, setIsFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  const getQuestions = () => {
    if (Array.isArray(quiz) && quiz.length > 0) return quiz
    if (quiz?.questions && Array.isArray(quiz.questions)) return quiz.questions
    if (quiz?.items && Array.isArray(quiz.items)) return quiz.items
    if (Array.isArray(items) && items.length > 0) return items
    if (items?.questions && Array.isArray(items.questions)) return items.questions
    return []
  }
  const safeQuestions = getQuestions()
  
  if (safeQuestions.length === 0) return (
    <EmptyState 
      icon={HelpCircle} 
      label="No quiz generated yet." 
      action={
        <button 
          onClick={onRegenerate}
          style={{ 
            padding: '12px 24px', background: '#A78BFA', color: 'white', border: 'none', borderRadius: '12px', 
            fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)', fontFamily: 'var(--font-outfit)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#8B5CF6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#A78BFA'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Zap size={16} /> Generate Quiz
        </button>
      }
    />
  )

  const q = safeQuestions[idx]
  const progress = ((idx + 1) / safeQuestions.length) * 100
  const isAnswered = selected[idx] !== undefined || typeInAnswers[idx] !== undefined

  const getCorrectIndex = (question) => {
    const ans = question.correctAnswer ?? question.correct_answer ?? question.answer
    if (ans === undefined || ans === null) return -1
    
    if (typeof ans === 'number') return ans
    
    if (typeof ans === 'string') {
      const lower = ans.trim().toLowerCase()
      // Handle letter keys (a, b, c, d)
      if (lower === 'a') return 0
      if (lower === 'b') return 1
      if (lower === 'c') return 2
      if (lower === 'd') return 3
      
      // Handle true/false
      if (lower === 'true' || lower === 'yes') return 1
      if (lower === 'false' || lower === 'no') return 0
      
      // Try parsing as int
      const parsed = parseInt(lower)
      if (!isNaN(parsed)) return parsed
      
      // Try to find the index in options text
      if (question.options) {
        const idx = question.options.findIndex(opt => {
          const text = (typeof opt === 'object' ? (opt.text || opt.choice || "") : opt).toString().toLowerCase()
          return text === lower
        })
        if (idx !== -1) return idx
      }
    }
    
    return ans
  }

  const calculateScore = () => {
    return safeQuestions.reduce((acc, question, index) => {
      const userAns = selected[index]
      if (question.type === 'typein') {
        const userText = (typeInAnswers[index] || '').trim().toLowerCase()
        const expected = (question.expected_answer || question.answer || '').trim().toLowerCase()
        return acc + (userText && userText === expected ? 1 : 0)
      }
      
      const correctIdx = getCorrectIndex(question)
      return acc + (userAns == correctIdx ? 1 : 0)
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
        style={{ maxWidth: '640px', margin: '60px auto', background: 'white', padding: '64px 48px', borderRadius: '48px', border: '1px solid #f1f5f9', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.12)', textAlign: 'center', fontFamily: "'Varela Round', sans-serif" }}
      >
        <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
          <Trophy weight="bold" size={48} color="#A78BFA" />
        </div>
        <h2 style={{ fontSize: '32px', fontWeight: 700, color: '#1A102D', marginBottom: '12px', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>Assessment complete</h2>
        <p style={{ color: '#64748B', fontSize: '17px', marginBottom: '40px', fontWeight: 500, lineHeight: 1.6 }}>Great focus! You've analyzed your understanding of {material?.title}.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
          <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '24px', border: '1.5px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', letterSpacing: '0.03em' }}>Accuracy</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: accuracy >= 50 ? '#059669' : '#EF4444' }}>{accuracy}%</div>
          </div>
          <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '24px', border: '1.5px solid #E2E8F0' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', marginBottom: '8px', letterSpacing: '0.03em' }}>Score</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A102D' }}>{score}/{safeQuestions.length}</div>
          </div>
        </div>

        <button 
          onClick={() => { setIdx(0); setIsFinished(false); setSelected({}); setTypeInAnswers({}); setShowExplanation(false); }}
          style={{ 
            width: '100%', padding: '18px', borderRadius: '16px', background: '#A78BFA', color: 'white', 
            fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '15px', 
            boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)', fontFamily: 'var(--font-outfit)', 
            transition: 'all 0.2s' 
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#8B5CF6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#A78BFA'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          Retake assessment
        </button>
      </motion.div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: "'Varela Round', sans-serif" }}>
      {/* Quiz Progress Bar */}
      <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '99px', marginBottom: '48px', overflow: 'hidden' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          style={{ height: '100%', background: '#A78BFA', borderRadius: '99px' }}
        />
      </div>

      <motion.div 
        key={idx}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '32px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle weight="bold" size={20} color="#A78BFA" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.03em' }}>Question {idx + 1} of {safeQuestions.length}</span>
          </div>
          <span style={{ padding: '6px 16px', background: '#ECFDF5', color: '#059669', borderRadius: '99px', fontSize: '12px', fontWeight: 600, border: '1px solid #D1FAE5' }}>Practice mode</span>
        </div>

        {/* Question Area */}
        <div style={{ background: 'white', borderRadius: '32px', padding: '48px', width: '100%', marginBottom: '40px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.04)', border: '1.5px solid #F1F5F9', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -15, left: 40, background: '#1A102D', color: 'white', padding: '4px 16px', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>Prompt</div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#1A102D', lineHeight: 1.5, margin: 0, textAlign: 'left', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.02em' }}>{q.question}</h3>
        </div>

        {/* Options Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginBottom: '40px' }}>
          {(q.type === 'multiple' || !q.type) && q.options?.map((opt, i) => {
            const isUserSelected = selected[idx] === i
            const correctAns = getCorrectIndex(q)
            const isCorrect = isAnswered && i == correctAns
            const isWrong = isAnswered && isUserSelected && i != correctAns

            return (
              <motion.button
                key={i}
                whileHover={{ x: isAnswered ? 0 : 8 }}
                whileTap={{ scale: isAnswered ? 1 : 0.99 }}
                onClick={() => handleSelect(i)}
                disabled={isAnswered}
                style={{ 
                  padding: '24px 32px', 
                  borderRadius: '24px', 
                  background: isCorrect ? '#ECFDF5' : isWrong ? '#FEF2F2' : (isUserSelected ? '#F5F3FF' : 'white'), 
                  border: isCorrect ? '2px solid #059669' : isWrong ? '2px solid #EF4444' : (isUserSelected ? '2px solid #7a12cc' : '1.5px solid #E2E8F0'),
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isUserSelected ? '0 10px 20px -5px rgba(122, 18, 204, 0.1)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '10px', 
                    background: isCorrect ? '#059669' : isWrong ? '#EF4444' : (isUserSelected ? '#7a12cc' : '#F1F5F9'), 
                    color: (isCorrect || isWrong || isUserSelected) ? 'white' : '#94A3B8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ fontSize: '17px', fontWeight: 600, color: isUserSelected ? '#1A102D' : '#4A5568' }}>
                    {typeof opt === 'object' ? (opt.text || opt.choice || JSON.stringify(opt)) : opt}
                  </span>
                </div>
                {isCorrect && <CheckCircle weight="fill" size={24} color="#059669" />}
                {isWrong && <XCircle weight="fill" size={24} color="#EF4444" />}
              </motion.button>
            )
          })}

          {q.type === 'truefalse' && [1, 0].map((val) => {
            const isUserSelected = selected[idx] === val
            const correctAns = getCorrectIndex(q)
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
                  border: isCorrect ? '2px solid #22C55E' : isWrong ? '2px solid #EF4444' : (isUserSelected ? '2px solid #4B0082' : '1.5px solid #E2E8F0'),
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#1A3A32' }}>{label}</span>
                {isCorrect && <CheckCircle weight="bold" size={18} color="#22C55E" />}
                {isWrong && <AlertCircle weight="bold" size={18} color="#EF4444" />}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4338CA', fontWeight: 600, fontSize: '11px', marginBottom: '8px' }}>
                <Sparkle size={14} /> Explanation & Reasoning
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

function EmptyState({ icon: Icon, label, action }) {
  return (
    <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ position: 'relative', marginBottom: '32px' }}>
         <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 4px 12px rgba(75, 0, 130, 0.1)' }}>
            <Icon size={48} weight="bold" color="#4B0082" />
         </div>
         <motion.div
           animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
           transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
           style={{ position: 'absolute', inset: -20, border: '2.5px solid #4B0082', borderRadius: '50%' }}
         />
      </div>
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D', letterSpacing: '-0.02em', fontFamily: 'var(--font-outfit)', marginBottom: '8px' }}>{label}</p>
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', fontFamily: 'var(--font-outfit)', marginBottom: action ? '24px' : '0' }}>Luter is curating your space...</div>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  )
}

function ActionButton({ icon: Icon, label, onClick }) {
  return (
    <button 
      onClick={onClick} 
      style={{ 
        width: '44px', height: '44px', borderRadius: '12px', background: 'white', border: '1.5px solid #F1F5F9', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', 
        transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' 
      }}
      title={label}
    >
      <Icon size={20} weight="bold" />
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
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A102D' }}>{value}</div>
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
export function WorkstationSummaryEnhanced({ content, material, pageSummaries = {}, onFetchPageSummaries, onRegenerate }) {
  const [viewMode, setViewMode] = useState('full');
  const [isSummarizingPages, setIsSummarizingPages] = useState(false);

  const handleFetchPages = async () => {
    setIsSummarizingPages(true);
    await onFetchPageSummaries();
    setIsSummarizingPages(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px', fontFamily: 'var(--font-varela)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1A102D', marginBottom: '8px', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}>Course insights</h1>
          <p style={{ color: '#64748B', fontSize: '14px', fontWeight: '500' }}>Distilled intelligence from your study material.</p>
        </div>
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '12px', border: '1.5px solid #F1F5F9' }}>
          <button 
            onClick={() => setViewMode('full')}
            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: viewMode === 'full' ? 'white' : 'transparent', color: viewMode === 'full' ? '#4B0082' : '#64748B', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em', boxShadow: viewMode === 'full' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}
          >
            Full Summary
          </button>
          <button 
            onClick={() => setViewMode('pages')}
            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: viewMode === 'pages' ? 'white' : 'transparent', color: viewMode === 'pages' ? '#4B0082' : '#64748B', fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em', boxShadow: viewMode === 'pages' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}
          >
            By Page
          </button>
        </div>
      </div>

      {viewMode === 'full' ? (
        <div style={{ background: 'white', padding: '60px', borderRadius: '32px', border: '1.5px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)' }}>
          <div className="markdown-body" style={{ fontSize: '17px', lineHeight: 1.8, color: '#2D3748' }}>
            <ReactMarkdown>{content || ""}</ReactMarkdown>
            {!content && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>No summary has been generated for this material yet.</p>
                <button 
                  onClick={onRegenerate}
                  style={{ padding: '12px 24px', background: '#6D28D9', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', boxShadow: '0 10px 20px -5px rgba(109, 40, 217, 0.25)', fontFamily: 'var(--font-outfit)' }}
                >
                  <Zap size={16} /> Generate Summary
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.keys(pageSummaries).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '32px', border: '1px dashed #CBD5E1' }}>
              <div style={{ width: '64px', height: '64px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7a12cc' }}>
                 <Sparkle size={32} />
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
                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8' }}>Page</div>
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', background: 'white', fontFamily: 'var(--font-varela)' }}>
      <header style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ color: '#4B0082', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-outfit)' }}>
              <PencilLine size={14} /> Notepad
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D', margin: 0, fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}>Study jottings</h1>
          </div>
          <button 
            onClick={handleManualSave}
            disabled={isSaving}
            style={{ padding: '10px 20px', borderRadius: '12px', background: '#4B0082', border: 'none', color: 'white', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em', boxShadow: '0 4px 12px rgba(75, 0, 130, 0.2)' }}
          >
            {isSaving ? <CircleNotch className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? 'Saving' : 'Save'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleAiAssist('points')}
            disabled={isAssisting}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#F5F3FF', border: '1.5px solid #DDD6FE', color: '#4B0082', fontWeight: 600, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em', transition: 'all 0.2s' }}
          >
            <Sparkle size={14} /> AI points
          </button>
          <button 
            onClick={() => handleAiAssist('formulas')}
            disabled={isAssisting}
            style={{ flex: 1, padding: '10px', borderRadius: '12px', background: '#FFF7ED', border: '1.5px solid #FFEDD5', color: '#EA580C', fontWeight: 600, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: 'var(--font-outfit)', letterSpacing: '0.01em', transition: 'all 0.2s' }}
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
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', padding: '8px 16px', background: '#1A102D', borderRadius: '100px', color: 'white', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-outfit)', letterSpacing: '0.03em', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CircleNotch size={14} className="animate-spin" />
            Luter is thinking...
          </div>
        )}
      </div>
    </div>
  );
}
