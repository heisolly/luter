import React, { useState, useEffect } from 'react'
import { Brain, Zap, RotateCcw, CheckCircle2, XCircle, Download, Sparkles, ChevronLeft, ChevronRight, Star, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'

export default function AnkiRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizScore, setQuizScore] = useState(null)
  
  const downloadContent = () => {
    const content = analysisState[activeTab] || material.extracted_text
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${material.title}_${activeTab}.md`
    a.click()
  }

  const renderContent = () => {
    if (activeTab === 'content') {
      const cards = [
        { front: "What is the primary function of Mitochondria?", back: "The 'powerhouse' of the cell, responsible for ATP production through cellular respiration." },
        { front: "Define Hydrostatic Equilibrium.", back: "A state where the compression due to gravity is balanced by a pressure gradient force." },
        { front: "Who proposed the Theory of Relativity?", back: "Albert Einstein." }
      ]

      return (
        <div className="ws-content-scroll" style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#7a12cc', marginBottom: '16px' }}>
              <Brain size={32} />
              <h2 className="ws-heading" style={{ fontSize: '28px' }}>Active Recall Zone</h2>
            </div>
            <p style={{ fontFamily: 'Outfit', color: '#4A5568' }}>Master your Anki deck with Luter's assistance.</p>
          </div>

          <div 
            className={`ws-flashcard ${isFlipped ? 'ws-flashcard--flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
            style={{ width: '100%', maxWidth: '600px', height: '350px' }}
          >
            <div className="ws-flashcard-inner">
              <div className="ws-flashcard-front" style={{ border: '3px solid #7a12cc' }}>
                <span style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '12px', color: '#64748B', fontFamily: 'Outfit', fontWeight: 700, textTransform: 'uppercase' }}>Question</span>
                <p className="ws-flashcard-text" style={{ fontSize: '24px' }}>{cards[currentIdx].front}</p>
                <div style={{ position: 'absolute', bottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: '#7a12cc', fontFamily: 'Outfit', fontSize: '14px', fontWeight: 600 }}>
                  <Zap size={16} /> Click to reveal answer
                </div>
              </div>
              <div className="ws-flashcard-back" style={{ border: '3px solid #4C1D95', background: '#F5F3FF' }}>
                <span style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '12px', color: '#64748B', fontFamily: 'Outfit', fontWeight: 700, textTransform: 'uppercase' }}>Luter's Explanation</span>
                <p className="ws-flashcard-text" style={{ fontSize: '20px', lineHeight: 1.6 }}>{cards[currentIdx].back}</p>
                
                <div style={{ position: 'absolute', bottom: '32px', display: 'flex', gap: '16px' }}>
                  <button className="ws-tactile-btn" style={{ background: '#FEE2E2', borderColor: '#EF4444', color: '#991B1B' }} onClick={(e) => { e.stopPropagation(); setIsFlipped(false) }}>
                    <XCircle size={18} /> hard
                  </button>
                  <button className="ws-tactile-btn" style={{ background: '#F3E8FF', borderColor: '#7a12cc', color: '#4C1D95' }} onClick={(e) => { e.stopPropagation(); setIsFlipped(false); setCurrentIdx((prev) => (prev + 1) % cards.length) }}>
                    <CheckCircle2 size={18} /> easy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button className="ws-tactile-btn" onClick={() => setCurrentIdx((prev) => (prev - 1 + cards.length) % cards.length)}>
              <RotateCcw size={18} /> prev card
            </button>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: '#4C1D95' }}>{currentIdx + 1} / {cards.length}</span>
            <button className="ws-tactile-btn" onClick={() => setCurrentIdx((prev) => (prev + 1) % cards.length)}>
              next card
            </button>
          </div>
        </div>
      )
    }

    if (analysisState.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '40px' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Luter is syncing with your Anki deck...</p>
        </div>
      )
    }

    const content = analysisState[activeTab]
    if (!content) return null

    if (activeTab === 'flashcards') {
      const items = Array.isArray(content) ? content : []
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#4A5568' }}>
                  <option>Select topics...</option>
               </select>
            </div>
            <button style={{ fontSize: '13px', color: '#7a12cc', fontWeight: 600, background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> More
            </button>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 800, marginBottom: '32px', color: '#1A3A32' }}>{material.title}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
            <div 
              className={`ws-flashcard ${isFlipped ? 'ws-flashcard--flipped' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ width: '100%', maxWidth: '600px', height: '350px' }}
            >
              <div className="ws-flashcard-inner">
                <div className="ws-flashcard-front" style={{ background: 'white', border: '1.5px solid #DDD6FE', borderRadius: '24px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>Question</div>
                  <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px', color: '#F59E0B' }}>
                    <Star size={18} />
                    <Sparkles size={18} color="#7a12cc" />
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', padding: '0 40px', color: '#1A3A32' }}>{items[currentIdx]?.front || "No cards generated"}</p>
                  <div style={{ position: 'absolute', bottom: '32px', color: '#7a12cc', fontSize: '14px', fontWeight: 600 }}>Click to flip</div>
                </div>
                <div className="ws-flashcard-back" style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: '24px', position: 'relative' }}>
                   <p style={{ fontSize: '18px', textAlign: 'center', padding: '0 40px', color: '#4C1D95', lineHeight: 1.6 }}>{items[currentIdx]?.back}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
               <button className="ws-tactile-btn" onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => Math.max(0, prev - 1)) }} disabled={currentIdx === 0}>
                 <ChevronLeft size={20} />
               </button>
               <span style={{ fontWeight: 800, color: '#4C1D95' }}>{currentIdx + 1} of {items.length}</span>
               <button className="ws-tactile-btn" onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => Math.min(items.length - 1, prev + 1)) }} disabled={currentIdx === items.length - 1}>
                 <ChevronRight size={20} />
               </button>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'quiz') {
      const items = Array.isArray(content) ? content : []
      const currentQuestion = items[currentIdx]
      
      const handleNext = () => {
        setShowExplanation(false)
        if (currentIdx < items.length - 1) {
          setCurrentIdx(currentIdx + 1)
        } else {
          const answeredCount = Object.keys(userAnswers).length
          setQuizScore({
            correct: answeredCount,
            total: items.length
          })
        }
      }

      if (quizScore) {
        return (
          <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', background: 'white', padding: '48px', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '80px', height: '80px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Star size={40} color="#7a12cc" fill="#7a12cc" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1A3A32', marginBottom: '12px' }}>Quiz Completed!</h2>
            <p style={{ color: '#94A3B8', fontSize: '16px', marginBottom: '32px' }}>You've completed the Mock Exam for {material.title}.</p>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#7a12cc', marginBottom: '8px' }}>{quizScore.correct}/{quizScore.total}</div>
            <p style={{ fontWeight: 600, color: '#4C1D95', marginBottom: '40px' }}>Great effort! Review your answers below.</p>
            <button className="ws-tactile-btn" style={{ background: '#7a12cc', color: 'white', padding: '14px 40px', width: '100%' }} onClick={() => setQuizScore(null)}>Restart Quiz</button>
          </div>
        )
      }

      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <button className="ws-tactile-btn" style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px 20px', border: 'none' }} onClick={() => onRunAnalysis('quiz')}>Regenerate</button>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px', flex: 1 }}>
              {items.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => { setCurrentIdx(i); setShowExplanation(false); }}
                  style={{ 
                    minWidth: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid',
                    borderColor: currentIdx === i ? '#7a12cc' : (userAnswers[i] ? '#DDD6FE' : '#E2E8F0'),
                    background: currentIdx === i ? '#7a12cc' : (userAnswers[i] ? '#F5F3FF' : 'transparent'),
                    color: currentIdx === i ? 'white' : (userAnswers[i] ? '#7a12cc' : '#94A3B8'),
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #E2E8F0', padding: '48px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', position: 'relative' }}>
             <div style={{ position: 'absolute', top: '24px', right: '40px', display: 'flex', gap: '8px' }}>
               <span style={{ padding: '4px 12px', background: currentQuestion?.difficulty === 'Hard' ? '#FEF2F2' : '#F0FDF4', color: currentQuestion?.difficulty === 'Hard' ? '#DC2626' : '#16A34A', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                 {currentQuestion?.difficulty || 'Standard'}
               </span>
             </div>

             <h3 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', color: '#1A3A32', marginBottom: '40px', lineHeight: 1.4 }}>
               {currentQuestion?.question}
             </h3>

             <div style={{ maxWidth: '500px', margin: '0 auto' }}>
               <textarea 
                 placeholder="Type your answer here..."
                 value={userAnswers[currentIdx] || ''}
                 onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentIdx]: e.target.value }))}
                 style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontSize: '15px', minHeight: '120px', resize: 'none', fontFamily: 'Outfit' }}
               />
               
               {showExplanation && (
                 <div style={{ marginTop: '24px', padding: '20px', background: '#F5F3FF', borderRadius: '16px', border: '1px solid #DDD6FE' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a12cc', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                     <Sparkles size={14} /> LUTER'S EXPLANATION
                   </div>
                   <p style={{ fontSize: '14px', color: '#4C1D95', lineHeight: 1.6, margin: 0 }}>
                     <strong>Correct Answer:</strong> {currentQuestion?.answer}<br/><br/>
                     {currentQuestion?.explanation}
                   </p>
                 </div>
               )}
             </div>

             <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#F8FAFC', color: '#64748B' }} onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} disabled={currentIdx === 0}>Previous</button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#F5F3FF', color: '#7a12cc' }} onClick={() => setShowExplanation(!showExplanation)}>
                  {showExplanation ? 'Hide Answer' : 'Reveal Answer'}
                </button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#7a12cc', color: 'white' }} onClick={handleNext}>
                  {currentIdx === items.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </button>
             </div>
          </div>
        </div>
      )
    }

    return (
      <div className="ws-ai-content-pane">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="ws-heading" style={{ fontSize: '24px', color: '#7a12cc', textTransform: 'capitalize' }}>
              AI Anki {activeTab}
            </h2>
            <button 
              onClick={downloadContent}
              style={{ padding: '8px', borderRadius: '10px', background: '#F5F3FF', border: 'none', cursor: 'pointer', color: '#7a12cc' }}
            >
              <Download size={20} />
            </button>
          </div>
          <div className="markdown-body" style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="ws-content-scroll" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {renderContent()}
    </div>
  )
}
