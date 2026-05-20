/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  House,
  CaretLeft,
  CaretRight,
  CaretDown,
  CaretUp,
  FileText,
  FileDoc,
  FilePdf,
  FilePpt,
  Sparkle,
  Cards,
  CardsThree,
  Checks,
  ShareNetwork,
  DotsThree,
  Lightning,
  NotePencil,
  PencilSimple,
  ArrowRight,
  BookmarkSimple,
  User as UserIcon,
  ArrowSquareOut as ArrowSquareOutIcon,
  ChatCircleText as ChatCircleTextIcon,
  ThumbsUp,
  CopySimple,
  ArrowUpRight,
  Microphone,
  SpeakerHigh,
  PaperPlaneRight,
  CircleNotch,
  SidebarSimple,
  SquaresFour,
  Stack,
  ClipboardText,
  List,
  ChatsCircle as ChatsCircleIcon,
  Users,
  X,
  PaperPlaneTilt as PaperPlaneIcon,
  Clock,
  Crown,
  GridFour,
  PenNib,
  Layout,
  ChatCircle,
  ChatCircleText,
  EyeSlash,
  PencilLine,
  Highlighter,
  PaintBrush,
  Timer,
  ArrowsOut,
  SignOut,
  ArrowsLeftRight,
  Trash,
  Copy,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  FloppyDisk,
  ArrowUp,
  Pen,
  TextT,
  Function as PhosphorFunction,
  Eraser,
  ArrowsIn,
  CaretLineUp,
  CaretLineDown,
  Minus,
  Square,
  Flag,
  Article,
  FileText as FileTextIcon,
  ListBullets,
  ArrowsClockwise,
  Shuffle,
  SlidersHorizontal,
  BookOpen,
  Printer,
  WarningCircle,
  Trophy,
  CheckSquare,
  Play,
  Export,
  ChartBar,
  Question,
  Plus
} from '@phosphor-icons/react'
import ReactMarkdown from 'react-markdown'
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
          <ActionButton icon={DownloadSimple} label="Export" />
          <ActionButton icon={ShareNetwork} label="Share" />
          <button
            onClick={onRegenerate}
            style={{ padding: '12px 24px', borderRadius: '14px', background: '#6D28D9', color: 'white', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px -5px rgba(109, 40, 217, 0.25)', fontFamily: 'var(--font-outfit)' }}
          >
            <ArrowsClockwise size={16} /> Regenerate
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
          <WarningCircle weight="bold" size={28} color="#D97706" />
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
  const [explainMode, setExplainMode] = useState(false)

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: '24px' }}>
      <div style={{ position: 'relative', marginBottom: '32px' }}>
        <div style={{ width: '100px', height: '100px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Question weight="bold" size={48} color="#7C3AED" />
        </div>
      </div>
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No quiz generated yet.</p>
      <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>Generate a quiz to test your knowledge</p>
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          style={{
            padding: '12px 24px', background: '#C4B5FD', color: '#4C1D95', border: 'none', borderRadius: '9999px',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px'
          }}
        >
          <Sparkle size={16} /> Generate Quiz
        </button>
      )}
    </div>
  )

  const q = safeQuestions[idx]
  const isAnswered = selected[idx] !== undefined || typeInAnswers[idx] !== undefined

  const getCorrectIndex = (question) => {
    const ans = question.correctAnswer ?? question.correct_answer ?? question.answer
    if (ans === undefined || ans === null) return -1

    if (typeof ans === 'number') return ans

    if (typeof ans === 'string') {
      const lower = ans.trim().toLowerCase()
      if (lower === 'a') return 0
      if (lower === 'b') return 1
      if (lower === 'c') return 2
      if (lower === 'd') return 3
      if (lower === 'true' || lower === 'yes') return 1
      if (lower === 'false' || lower === 'no') return 0
      const parsed = parseInt(lower)
      if (!isNaN(parsed)) return parsed
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
  }

  const handleSubmit = () => {
    setShowExplanation(true)
  }

  const handleNext = () => {
    if (idx < safeQuestions.length - 1) {
      setIdx(idx + 1)
      setShowExplanation(false)
      setExplainMode(false)
    } else {
      setIsFinished(true)
    }
  }

  const handleExplain = () => {
    setExplainMode(!explainMode)
  }

  // Track answer states for progress bar
  const getAnswerState = (index) => {
    if (!selected[index] && !typeInAnswers[index]) return 'upcoming'
    const correctIdx = getCorrectIndex(safeQuestions[index])
    if (selected[index] === correctIdx) return 'correct'
    return 'incorrect'
  }

  if (isFinished) {
    const score = calculateScore()
    const accuracy = Math.round((score / safeQuestions.length) * 100)
    const correctCount = score
    const incorrectCount = safeQuestions.length - score

    let title, subtitle
    if (accuracy >= 80) {
      title = '🎉 Excellent!'
      subtitle = 'Outstanding performance!'
    } else if (accuracy >= 60) {
      title = 'Good Job!'
      subtitle = 'You\'re making great progress!'
    } else if (accuracy >= 40) {
      title = 'Keep Going!'
      subtitle = 'You\'re on the right track!'
    } else {
      title = 'Don\'t Give Up!'
      subtitle = 'Revisit the material and try again!'
    }

    let gradeLetter, gradeColor
    if (accuracy >= 90) { gradeLetter = 'A'; gradeColor = '#059669' }
    else if (accuracy >= 80) { gradeLetter = 'B'; gradeColor = '#059669' }
    else if (accuracy >= 70) { gradeLetter = 'C'; gradeColor = '#D97706' }
    else if (accuracy >= 60) { gradeLetter = 'D'; gradeColor = '#EF4444' }
    else { gradeLetter = 'F'; gradeColor = '#EF4444' }

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '24px' }}>
        {/* Mascot */}
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '2px solid #E5E7EB' }}>
          <Trophy weight="bold" size={32} color="#7C3AED" />
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '4px', margin: 0 }}>{title}</h2>
        <p style={{ fontSize: '13px', color: '#6B7280', marginBottom: '20px', margin: '0 0 20px 0' }}>{subtitle}</p>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', marginBottom: '20px' }}>
          {/* Grade Card */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <CheckSquare size={14} color="#374151" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>GRADE</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: gradeColor }}>{gradeLetter}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{accuracy}% Correct</div>
          </div>

          {/* Best Streak Card */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Lightning size={14} color="#374151" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>BEST STREAK</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: '#111827' }}>{Math.max(1, correctCount)}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>in a row</div>
          </div>

          {/* Breakdown Card */}
          <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', width: '100%' }}>
              <GridFour size={14} color="#374151" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.05em' }}>BREAKDOWN</span>
            </div>
            {/* Donut Chart */}
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#E5E7EB" strokeWidth="8" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#4ADE80" strokeWidth="8" 
                strokeDasharray={`${(correctCount / safeQuestions.length) * 175.93} 175.93`} 
                transform="rotate(-90 32 32)" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#F87171" strokeWidth="8" 
                strokeDasharray={`${(incorrectCount / safeQuestions.length) * 175.93} 175.93`} 
                strokeDashoffset={`-${(correctCount / safeQuestions.length) * 175.93}`}
                transform="rotate(-90 32 32)" />
            </svg>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ADE80' }} />
                  <span style={{ fontSize: '11px', color: '#374151' }}>Correct</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{correctCount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F87171' }} />
                  <span style={{ fontSize: '11px', color: '#374151' }}>Incorrect</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{incorrectCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setIdx(0); setIsFinished(false); setSelected({}); setTypeInAnswers({}); setShowExplanation(false); setExplainMode(false); }}
            style={{ flex: 1, minWidth: '80px', height: '40px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <CaretLeft size={14} /> Back
          </button>
          <button
            style={{ flex: 1, minWidth: '100px', height: '40px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ChartBar size={14} /> View Results
          </button>
          <button
            onClick={() => { setIdx(0); setIsFinished(false); setSelected({}); setTypeInAnswers({}); setShowExplanation(false); setExplainMode(false); }}
            style={{ flex: 1, minWidth: '100px', height: '40px', background: 'white', border: '1px solid #E5E7EB', borderRadius: '9999px', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Play size={14} /> Do New Quiz
          </button>
          <button
            style={{ flex: 1, minWidth: '100px', height: '40px', background: '#C4B5FD', border: 'none', borderRadius: '9999px', fontSize: '13px', fontWeight: 600, color: '#4C1D95', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Export size={14} /> Share Quiz
          </button>
        </div>
      </div>
    )
  }

  const correctIdx = getCorrectIndex(q)
  const isUserSelected = selected[idx] !== undefined
  const isCorrect = isAnswered && selected[idx] === correctIdx

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F9FAFB', padding: 0 }}>
      {/* HEADER BAR */}
      <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: '4px', flex: 1, marginRight: '16px' }}>
          {safeQuestions.map((_, i) => (
            <div
              key={i}
              style={{
                height: '4px',
                borderRadius: '9999px',
                flex: 1,
                background: getAnswerState(i) === 'correct' ? '#4ADE80' : getAnswerState(i) === 'incorrect' ? '#F87171' : i === idx ? '#E5E7EB' : '#E5E7EB'
              }}
            />
          ))}
        </div>
        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>{idx + 1} / {safeQuestions.length}</span>
          <button style={{ width: '28px', height: '28px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', hover: { background: '#F3F4F6' } }}>
            <Flag size={14} color="#9CA3AF" />
          </button>
          <button style={{ width: '28px', height: '28px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', hover: { background: '#F3F4F6' } }}>
            <Copy size={14} color="#9CA3AF" />
          </button>
        </div>
      </div>

      {explainMode ? (
        /* EXPLAIN VIEW */
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <List size={16} color="#374151" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Explain</span>
            </div>
            <button onClick={() => setExplainMode(false)} style={{ width: '24px', height: '24px', borderRadius: '9999px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', hover: { background: '#F3F4F6' } }}>
              <X size={14} color="#9CA3AF" />
            </button>
          </div>

          {/* Explanation Bubble */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* Mascot Avatar */}
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', overflow: 'hidden', border: '2px solid #E5E7EB', flexShrink: 0, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkle size={24} color="#7C3AED" />
            </div>
            {/* Text Bubble */}
            <div style={{ flex: 1, background: '#F5F3FF', borderRadius: '4px 16px 16px 16px', padding: '14px 16px', fontSize: '13px', color: '#374151', lineHeight: 1.6, border: '1px solid #DDD6FE' }}>
              {q.explanation || 'Here\'s an explanation for this question...'}
            </div>
          </div>

          {/* Follow-up Input */}
          <div style={{ marginTop: 'auto', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px', background: 'white' }}>
            <input
              type="text"
              placeholder="Ask for a follow up"
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px', color: '#374151', background: 'transparent' }}
            />
            <button style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '9999px', background: '#7C3AED', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUp size={12} weight="bold" />
            </button>
          </div>
        </div>
      ) : (
        /* QUESTION VIEW */
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          {/* Question */}
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', lineHeight: 1.5, textAlign: 'center', marginBottom: '24px' }}>
            {idx + 1}. {q.question}
          </div>

          {/* Answer Options Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {(q.type === 'multiple' || !q.type) && q.options?.map((opt, i) => {
              const isSelected = selected[idx] === i
              const isOptionCorrect = isAnswered && i === correctIdx
              const isOptionWrong = isAnswered && i !== correctIdx

              let bg = 'white'
              let border = '1px solid #E5E7EB'
              let badgeBg = '#F3F4F6'
              let badgeColor = '#374151'

              if (isAnswered) {
                if (isOptionCorrect) {
                  bg = '#DCFCE7'
                  border = '1px solid #4ADE80'
                  badgeBg = '#4ADE80'
                  badgeColor = 'white'
                } else if (isOptionWrong) {
                  bg = '#FEE2E2'
                  border = '1px solid #F87171'
                  badgeBg = '#F87171'
                  badgeColor = 'white'
                }
              } else if (isSelected) {
                bg = '#F5F3FF'
                border = '1px solid #A78BFA'
                badgeBg = '#A78BFA'
                badgeColor = 'white'
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={isAnswered}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: isAnswered ? 'default' : 'pointer',
                    transition: 'all 150ms ease',
                    border,
                    background: bg,
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => { if (!isAnswered) { e.currentTarget.style.borderColor = '#DDD6FE'; e.currentTarget.style.background = '#F5F3FF' } }}
                  onMouseLeave={(e) => { if (!isAnswered && !isSelected) { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' } }}
                >
                  {/* Letter Badge */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: badgeBg,
                    color: badgeColor
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  {/* Option Text */}
                  <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.4 }}>
                    {typeof opt === 'object' ? (opt.text || opt.choice || JSON.stringify(opt)) : opt}
                  </span>
                </button>
              )
            })}

            {q.type === 'truefalse' && [1, 0].map((val) => {
              const isSelected = selected[idx] === val
              const isOptionCorrect = isAnswered && val === correctIdx
              const isOptionWrong = isAnswered && val !== correctIdx
              const label = val === 1 ? 'True' : 'False'

              let bg = 'white'
              let border = '1px solid #E5E7EB'

              if (isAnswered) {
                if (isOptionCorrect) {
                  bg = '#DCFCE7'
                  border = '1px solid #4ADE80'
                } else if (isOptionWrong) {
                  bg = '#FEE2E2'
                  border = '1px solid #F87171'
                }
              } else if (isSelected) {
                bg = '#F5F3FF'
                border = '1px solid #A78BFA'
              }

              return (
                <button
                  key={val}
                  onClick={() => handleSelect(val)}
                  disabled={isAnswered}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '14px',
                    borderRadius: '12px',
                    cursor: isAnswered ? 'default' : 'pointer',
                    transition: 'all 150ms ease',
                    border,
                    background: bg,
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '13px', color: '#374151', lineHeight: 1.4, fontWeight: 600 }}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ padding: '12px 16px', background: 'white', borderTop: '1px solid #F3F4F6', display: 'flex', gap: '10px', flexShrink: 0 }}>
        <button
          onClick={handleExplain}
          style={{
            flex: 1,
            height: '44px',
            borderRadius: '9999px',
            background: 'white',
            border: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer'
          }}
        >
          <span style={{ background: '#F3F4F6', color: '#6B7280', borderRadius: '6px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace' }}>E</span>
          {showExplanation ? 'Explain Again' : 'Explain'}
        </button>
        <button
          onClick={() => { if (!isAnswered && isUserSelected) handleSubmit(); else handleNext(); }}
          disabled={!isUserSelected && !isAnswered}
          style={{
            flex: 2,
            height: '44px',
            borderRadius: '9999px',
            background: '#C4B5FD',
            color: '#4C1D95',
            border: 'none',
            cursor: (!isUserSelected && !isAnswered) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: 600,
            opacity: (!isUserSelected && !isAnswered) ? 0.5 : 1
          }}
        >
          <span style={{ background: 'rgba(255,255,255,0.3)', color: '#4C1D95', borderRadius: '6px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace' }}>↵</span>
          {!isAnswered ? 'Submit' : (idx === safeQuestions.length - 1 ? 'Finish' : 'Next')}
        </button>
      </div>
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
export function WorkstationSummaryEnhanced({
  content,
  material,
  pageSummaries = {},
  onFetchPageSummaries,
  onRegenerate,
  onJumpToPage,
  isLoading,
  user,
  courseId,
  onAskQuestion,
  onSaveNotes,
  numPages
}) {
  const [viewMode, setViewMode] = useState('full');
  const [selectedPage, setSelectedPage] = useState(null);
  const [isSummarizingPages, setIsSummarizingPages] = useState(false);
  const [expandedPages, setExpandedPages] = useState({});

  useEffect(() => {
    setSelectedPage(null);
  }, [material?.id]);
  
  // Hover states
  const [hoveredRegen, setHoveredRegen] = useState(false);
  const [hoveredSave, setHoveredSave] = useState(false);
  const [hoveredAskIndex, setHoveredAskIndex] = useState(null);
  
  // Save states
  const [saveAllState, setSaveAllState] = useState(null); // null, 'saving', 'saved'
  const [savedPageNotes, setSavedPageNotes] = useState({});

  const handleFetchPages = async () => {
    setIsSummarizingPages(true);
    await onFetchPageSummaries();
    setIsSummarizingPages(false);
  };

  const togglePage = (page) => {
    setExpandedPages(prev => ({ ...prev, [page]: !prev[page] }));
  };

  // Helper to parse key points from markdown
  const parseSummary = (text) => {
    if (!text) return { keyPoints: [], cleanText: '' };
    
    const lines = text.split('\n');
    const keyPoints = [];
    const cleanLines = [];
    
    for (let line of lines) {
      const trimmed = line.trim();
      // Matches standard bullets: - point, * point, • point
      const match = trimmed.match(/^[-*•]\s+(.+)$/);
      if (match) {
        keyPoints.push(match[1]);
      } else {
        cleanLines.push(line);
      }
    }
    
    // Fallback key points if none parsed
    const finalKeyPoints = keyPoints.length > 0 ? keyPoints : [
      "Core principles, theorems, and definitions present in the material.",
      "Key formulas, calculations, or methodology details.",
      "Practical examples, case studies, or application context.",
      "Conclusions, summary notes, and future considerations."
    ];
    
    return {
      keyPoints: finalKeyPoints,
      cleanText: cleanLines.join('\n').trim()
    };
  };

  const handleAskAboutPoint = (text) => {
    if (onAskQuestion) {
      onAskQuestion(`Can you explain this key point from the summary?\n\n"${text}"`);
    }
  };

  const handleAskAboutPage = (page, text) => {
    if (onAskQuestion) {
      onAskQuestion(`Can you explain the summary of Page ${page}?\n\n"${text}"`);
    }
  };

  const handleSavePageNote = async (page, text) => {
    if (onSaveNotes) {
      try {
        setSavedPageNotes(prev => ({ ...prev, [page]: 'saving' }));
        await onSaveNotes(`Page ${page} Summary:\n\n${text}`);
        setSavedPageNotes(prev => ({ ...prev, [page]: 'saved' }));
        setTimeout(() => {
          setSavedPageNotes(prev => ({ ...prev, [page]: null }));
        }, 2000);
      } catch (e) {
        setSavedPageNotes(prev => ({ ...prev, [page]: null }));
      }
    }
  };

  const handleSaveAllNotes = async () => {
    if (onSaveNotes && content) {
      try {
        setSaveAllState('saving');
        await onSaveNotes(content);
        setSaveAllState('saved');
        setTimeout(() => {
          setSaveAllState(null);
        }, 2000);
      } catch (e) {
        setSaveAllState(null);
      }
    }
  };

  const getPageBadge = (pageIndex, text) => {
    const trimmed = (text || '').toLowerCase();
    if (trimmed.includes('definition') || trimmed.includes('formula') || trimmed.includes('theorem')) {
      return 'Core Theory';
    }
    if (trimmed.includes('example') || trimmed.includes('exercise') || trimmed.includes('application')) {
      return 'Practical Application';
    }
    if (trimmed.includes('introduction') || trimmed.includes('overview') || pageIndex === 1) {
      return 'Overview';
    }
    if (trimmed.length > 500) {
      return 'Detailed Analysis';
    }
    return 'Key Insights';
  };

  // Stats calculation
  const wordsCount = (content || '').trim().split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.ceil(wordsCount / 200));
  const headersCount = (content || '').match(/^#+\s/gm)?.length || 0;
  const topicsCount = headersCount > 0 ? headersCount : 4;

  const renderHeaderSection = (isCurrentlyLoading) => {
    const isSaveNotesDisabled = !content || isCurrentlyLoading || saveAllState === 'saved';
    return (
      <div style={{ padding: '28px 32px 0 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#111827', letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-outfit)' }}>
              Course insights
            </h1>
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px', margin: 0 }}>
              Distilled intelligence from your study material.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onRegenerate}
              disabled={isCurrentlyLoading}
              style={{
                border: '1px solid #E5E7EB',
                borderRadius: '9999px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                background: hoveredRegen ? '#F9FAFB' : 'white',
                borderColor: hoveredRegen ? '#D1D5DB' : '#E5E7EB',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isCurrentlyLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                transform: hoveredRegen ? 'translateY(-1px)' : 'translateY(0)'
              }}
              onMouseEnter={() => !isCurrentlyLoading && setHoveredRegen(true)}
              onMouseLeave={() => setHoveredRegen(false)}
            >
              <ArrowsClockwise size={14} className={isCurrentlyLoading ? 'animate-spin' : ''} />
              <span>Regenerate</span>
            </button>
            
            <button
              onClick={handleSaveAllNotes}
              disabled={isSaveNotesDisabled}
              style={{
                background: isSaveNotesDisabled ? '#E5E7EB' : (hoveredSave ? '#6D28D9' : '#7C3AED'),
                color: isSaveNotesDisabled ? '#9CA3AF' : 'white',
                borderRadius: '9999px',
                padding: '7px 16px',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: isSaveNotesDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                transform: (!isSaveNotesDisabled && hoveredSave) ? 'translateY(-1px)' : 'translateY(0)',
                boxShadow: (!isSaveNotesDisabled && hoveredSave) ? '0 2px 4px rgba(124, 58, 237, 0.2)' : 'none'
              }}
              onMouseEnter={() => !isSaveNotesDisabled && setHoveredSave(true)}
              onMouseLeave={() => setHoveredSave(false)}
            >
              {saveAllState === 'saved' ? <Checks size={14} /> : <Plus size={14} />}
              <span>
                {saveAllState === 'saving' ? 'Saving...' : saveAllState === 'saved' ? 'Saved' : 'Save to notes'}
              </span>
            </button>
          </div>
        </div>
        
        <div style={{ position: 'relative', marginTop: '16px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: '#E5E7EB', zIndex: 1 }} />
          <div style={{
            position: 'relative',
            zIndex: 2,
            background: '#F3F4F6',
            borderRadius: '9999px',
            padding: '3px',
            display: 'inline-flex',
            gap: '2px',
            border: '1px solid #E5E7EB'
          }}>
            <button
              onClick={() => setViewMode('full')}
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'full' ? 'white' : 'transparent',
                color: viewMode === 'full' ? '#7C3AED' : '#6B7280',
                boxShadow: viewMode === 'full' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              Full Summary
            </button>
            <button
              onClick={() => setViewMode('pages')}
              style={{
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: viewMode === 'pages' ? 'white' : 'transparent',
                color: viewMode === 'pages' ? '#7C3AED' : '#6B7280',
                boxShadow: viewMode === 'pages' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              By Page
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSkeleton = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Stat cards skeleton */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, height: '76px', borderRadius: '16px', background: 'white', border: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="summary-skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="summary-skeleton" style={{ width: '60px', height: '10px', borderRadius: '4px' }} />
                <div className="summary-skeleton" style={{ width: '90px', height: '14px', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Key points skeleton */}
        <div style={{ border: '1px solid #E5E7EB', borderRadius: '20px', background: 'white', padding: '24px 28px' }}>
          <div className="summary-skeleton" style={{ width: '120px', height: '16px', borderRadius: '4px', marginBottom: '20px' }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E5E7EB', flexShrink: 0 }} />
              <div className="summary-skeleton" style={{ flex: 1, height: '12px', borderRadius: '4px', width: `${95 - i * 5}%` }} />
            </div>
          ))}
        </div>

        {/* Paragraphs skeleton */}
        {[1, 2].map((i) => (
          <div key={i} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '28px 32px' }}>
            <div className="summary-skeleton" style={{ width: '100%', height: '12px', borderRadius: '4px', marginBottom: '10px' }} />
            <div className="summary-skeleton" style={{ width: '95%', height: '12px', borderRadius: '4px', marginBottom: '10px' }} />
            <div className="summary-skeleton" style={{ width: '90%', height: '12px', borderRadius: '4px', marginBottom: '10px' }} />
            <div className="summary-skeleton" style={{ width: '60%', height: '12px', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  };

  const renderEmptyState = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: '400px', margin: '60px auto' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EEF2F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED', marginBottom: '24px' }}>
          <Sparkle size={36} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-outfit)' }}>
          No summary yet
        </h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '24px', lineHeight: '1.5' }}>
          Let Luter distill the core takeaways, definitions, and theorems from this document for you.
        </p>
        <button
          onClick={onRegenerate}
          style={{
            background: '#7C3AED',
            color: 'white',
            borderRadius: '9999px',
            border: 'none',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#6D28D9'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#7C3AED'}
        >
          <Lightning size={16} />
          <span>Generate Summary</span>
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#F9FAFB', width: '100%' }}>
        {renderHeaderSection(true)}
        <div className="summary-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 80px 32px' }}>
          {renderSkeleton()}
        </div>
      </div>
    );
  }

  if (!content && !isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#F9FAFB', width: '100%' }}>
        {renderHeaderSection(false)}
        <div className="summary-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 80px 32px' }}>
          {renderEmptyState()}
        </div>
      </div>
    );
  }

  const parsed = parseSummary(content);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#F9FAFB', width: '100%' }}>
      {renderHeaderSection(false)}
      
      <div className="summary-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 80px 32px' }}>
        {viewMode === 'full' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Quick Stats Grid */}
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* Stat Card 1: Page Count */}
              <div style={{
                flex: 1,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#EEF2F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563'
                }}>
                  <BookOpen size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Length</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-outfit)' }}>
                    {numPages ? `${numPages} pages` : '—'}
                  </span>
                </div>
              </div>

              {/* Stat Card 2: Read Time */}
              <div style={{
                flex: 1,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#EEF2F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563'
                }}>
                  <Clock size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Read time</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-outfit)' }}>
                    {readTimeMin} min read
                  </span>
                </div>
              </div>

              {/* Stat Card 3: Key Topics */}
              <div style={{
                flex: 1,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#EEF2F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4B5563'
                }}>
                  <Sparkle size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Topics</span>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-outfit)' }}>
                    {topicsCount} key areas
                  </span>
                </div>
              </div>
            </div>

            {/* Key Points Card */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '20px', background: 'white', padding: '24px 28px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '20px', fontFamily: 'var(--font-outfit)' }}>
                Key points
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {parsed.keyPoints.map((point, index) => {
                  const isHovered = hoveredAskIndex === index;
                  return (
                    <li
                      key={index}
                      className="summary-point"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        position: 'relative',
                        padding: '10px 12px',
                        marginLeft: '-12px',
                        borderRadius: '10px',
                        transition: 'all 0.2s',
                        background: isHovered ? '#F9FAFB' : 'transparent',
                        animationDelay: `${index * 50}ms`
                      }}
                      onMouseEnter={() => setHoveredAskIndex(index)}
                      onMouseLeave={() => setHoveredAskIndex(null)}
                    >
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#7C3AED',
                        marginTop: '8px',
                        flexShrink: 0
                      }} />
                      <div style={{
                        flex: 1,
                        fontSize: '14.5px',
                        lineHeight: '1.6',
                        color: '#374151',
                        paddingRight: isHovered ? '110px' : '0px',
                        transition: 'padding-right 0.2s'
                      }}>
                        {point}
                      </div>
                      {isHovered && (
                        <button
                          onClick={() => handleAskAboutPoint(point)}
                          title="Ask about this point"
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#F3F4F6',
                            border: 'none',
                            borderRadius: '9999px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            color: '#374151',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                        >
                          <ChatCircle size={14} />
                          <span>Ask Luter</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Full Summary Text Card */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '28px 32px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '20px', fontFamily: 'var(--font-outfit)' }}>
                Full summary
              </div>
              <div className="markdown-body" style={{ fontSize: '15.5px', lineHeight: '1.8', color: '#374151' }}>
                <ReactMarkdown>{parsed.cleanText || content || ""}</ReactMarkdown>
              </div>
              
              {/* Sources badges */}
              {Object.keys(pageSummaries).length > 0 && (
                <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '20px', borderTop: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sources:</span>
                  {Object.keys(pageSummaries).sort((a, b) => parseInt(a) - parseInt(b)).map((page) => (
                    <button
                      key={page}
                      onClick={() => onJumpToPage && onJumpToPage(parseInt(page))}
                      style={{
                        background: '#EEF2F6',
                        color: '#4B5563',
                        border: 'none',
                        borderRadius: '9999px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#E5E7EB';
                        e.currentTarget.style.color = '#111827';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#EEF2F6';
                        e.currentTarget.style.color = '#4B5563';
                      }}
                    >
                      <BookOpen size={10} />
                      <span>Page {page}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'pages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.keys(pageSummaries).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 40px', background: 'white', borderRadius: '24px', border: '1px dashed #D1D5DB' }}>
                <div style={{ width: '64px', height: '64px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7C3AED' }}>
                  <Sparkle size={32} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px', fontFamily: 'var(--font-outfit)' }}>Page-by-Page Insights</h3>
                <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px', lineHeight: 1.5 }}>Deep dive into every single page of your material with granular summaries.</p>
                <button
                  onClick={handleFetchPages}
                  disabled={isSummarizingPages}
                  style={{ padding: '10px 24px', background: '#7C3AED', color: 'white', border: 'none', borderRadius: '9999px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#6D28D9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#7C3AED'}
                >
                  {isSummarizingPages ? <ArrowsClockwise className="animate-spin" size={16} /> : <Lightning size={16} />}
                  {isSummarizingPages ? 'Generating...' : 'Analyze Page by Page'}
                </button>
              </div>
            ) : (() => {
              const pageKeys = Object.keys(pageSummaries).sort((a, b) => parseInt(a) - parseInt(b));
              const activePageKey = selectedPage || (pageKeys.length > 0 ? pageKeys[0] : null);
              const saveState = activePageKey ? savedPageNotes[activePageKey] : null;
              const isSavePageDisabled = saveState === 'saving' || saveState === 'saved';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Picker Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4B5563' }}>Select page:</span>
                    <select
                      value={activePageKey || ""}
                      onChange={(e) => setSelectedPage(e.target.value)}
                      style={{
                        background: 'white',
                        border: '1px solid #D1D5DB',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#374151',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {pageKeys.map((pageKey) => (
                        <option key={pageKey} value={pageKey}>
                          Page {pageKey}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selected Page Card */}
                  {activePageKey && pageSummaries[activePageKey] && (
                    <div
                      style={{
                        background: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '20px',
                        padding: '28px 32px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827', fontFamily: 'var(--font-outfit)' }}>
                          Page {activePageKey}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAskAboutPage(activePageKey, pageSummaries[activePageKey])}
                            style={{
                              border: '1px solid #E5E7EB',
                              borderRadius: '9999px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 500,
                              color: '#374151',
                              background: 'white',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#F9FAFB';
                              e.currentTarget.style.borderColor = '#D1D5DB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'white';
                              e.currentTarget.style.borderColor = '#E5E7EB';
                            }}
                          >
                            <ChatCircle size={14} />
                            <span>Ask Luter</span>
                          </button>
                          
                          <button
                            onClick={() => handleSavePageNote(activePageKey, pageSummaries[activePageKey])}
                            disabled={isSavePageDisabled}
                            style={{
                              background: isSavePageDisabled ? '#E5E7EB' : '#7C3AED',
                              color: isSavePageDisabled ? '#9CA3AF' : 'white',
                              borderRadius: '9999px',
                              padding: '6px 14px',
                              fontSize: '12px',
                              fontWeight: 500,
                              border: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: isSavePageDisabled ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSavePageDisabled) {
                                e.currentTarget.style.background = '#6D28D9';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSavePageDisabled) {
                                e.currentTarget.style.background = '#7C3AED';
                              }
                            }}
                          >
                            {saveState === 'saved' ? <Checks size={14} /> : <Plus size={14} />}
                            <span>
                              {saveState === 'saving' ? 'Adding...' : saveState === 'saved' ? 'Added' : 'Save to notes'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="markdown-body" style={{ fontSize: '14.5px', lineHeight: '1.6', color: '#374151', marginTop: '16px' }}>
                        <ReactMarkdown>
                          {typeof pageSummaries[activePageKey] === 'string' ? pageSummaries[activePageKey] : "No insights for this page."}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
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
            {isSaving ? <CircleNotch className="animate-spin" size={16} /> : <FloppyDisk size={16} />}
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
            <Lightning size={14} /> Formulas
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
