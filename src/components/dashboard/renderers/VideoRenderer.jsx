import React, { useState, useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { useReadingSpace } from '../ReadingSpaceContext'
import { Play, Pause, FileText, Clock, Loader2, Download, Sparkles, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'

export default function VideoRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const { setViewportData, updateSelection } = useReadingSpace()
  const [played, setPlayed] = useState(0)
  const playerRef = useRef(null)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizScore, setQuizScore] = useState(null)

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection()
      const text = sel.toString().trim()
      
      if (text && text.length > 2) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        updateSelection(text, rect, true)
      } else {
        updateSelection('', null, false)
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [updateSelection])
  
  // Standardized Transcript Map (from Stage 1 Pre-Scan)
  // For demo, we'll split the extracted text into chunks with pseudo-timestamps
  const transcriptChunks = material.extracted_text?.split('\n\n') || []
  
  const handleProgress = (state) => {
    setPlayed(state.played)
    
    // Update active context for AI
    const currentChunkIndex = Math.floor(state.played * transcriptChunks.length)
    const activeChunk = transcriptChunks[currentChunkIndex] || ''
    
    setViewportData(prev => ({
      ...prev,
      visibleText: activeChunk,
      scrollPercent: state.played * 100
    }))
  }

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
      return (
        <>
          {/* Video Sticky Header */}
          <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'white', borderBottom: '1px solid #F3E8FF', padding: '24px' }}>
            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '2px solid #7a12cc', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', aspectRatio: '16/9', background: 'black' }}>
              <ReactPlayer 
                ref={playerRef}
                url={material.source_url}
                width="100%"
                height="100%"
                controls
                onProgress={handleProgress}
              />
            </div>
          </div>

          <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: '#7a12cc' }}>
              <FileText size={20} />
              <h3 className="ws-heading" style={{ fontSize: '18px' }}>AI Transcript Analysis</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {transcriptChunks.map((chunk, idx) => {
                const isActive = Math.floor(played * transcriptChunks.length) === idx
                return (
                  <div 
                    key={idx}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid',
                      borderColor: isActive ? '#7a12cc' : '#E2E8F0',
                      background: isActive ? '#F3E8FF' : 'white',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const targetTime = (idx / transcriptChunks.length) * playerRef.current?.getDuration()
                      playerRef.current?.seekTo(targetTime)
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.5, fontSize: '12px', fontFamily: 'Outfit' }}>
                      <Clock size={12} />
                      <span>{Math.floor((idx / transcriptChunks.length) * 10)}:{(idx % 3) * 20}</span>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontFamily: 'Outfit', 
                      fontSize: '14px', 
                      lineHeight: 1.6,
                      color: isActive ? '#4C1D95' : '#4A5568',
                      fontWeight: isActive ? 600 : 400
                    }}>
                      {chunk}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )
    }

    if (analysisState.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', padding: '40px' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Luter is processing video insights...</p>
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
              AI Video {activeTab}
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
