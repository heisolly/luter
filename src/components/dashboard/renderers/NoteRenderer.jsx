import React, { useEffect, useRef } from 'react'
import { useReadingSpace } from '../ReadingSpaceContext'
import { SharedCanvasOverlay, LuterSpark } from '../WorkstationOverlays'
import ReactMarkdown from 'react-markdown'
import { Loader2 } from 'lucide-react'

export default function NoteRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const { setViewportData, highlightText, updateSpark, clearHighlights, updateSelection } = useReadingSpace()
  const contentRef = useRef(null)

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

  useEffect(() => {
    const el = contentRef.current
    if (!el || activeTab !== 'content') return

    const handleScroll = () => {
      const scrollPercent = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
      
      const paragraphs = Array.from(el.querySelectorAll('p'))
      const visibleParagraphs = paragraphs.filter(p => {
        const rect = p.getBoundingClientRect()
        return rect.top >= 0 && rect.bottom <= window.innerHeight
      })
      
      const visibleText = visibleParagraphs.map(p => p.innerText).join('\n')
      
      setViewportData({
        visibleText,
        scrollPercent,
        currentPage: Math.floor(scrollPercent / 10) + 1
      })
    }

    el.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => el.removeEventListener('scroll', handleScroll)
  }, [material, activeTab, setViewportData])

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
        <div style={{ fontFamily: 'Outfit', color: '#4C1D95', lineHeight: 1.8, maxWidth: '800px', margin: '0 auto' }}>
          <h1 className="ws-heading" style={{ fontSize: '32px', marginBottom: '24px' }}>{material.title}</h1>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {material.extracted_text ? (
              material.extracted_text.split('\n\n').map((p, i) => (
                <p key={i} style={{ marginBottom: '1.5em' }}>{p}</p>
              ))
            ) : (
              <p style={{ opacity: 0.5 }}>No text extracted from this material.</p>
            )}
          </div>
        </div>
      )
    }

    if (analysisState.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Luter is thinking...</p>
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
                  <p style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', padding: '0 40px', color: '#1A3A32' }}>{items[currentFlashcardIndex]?.front || "No cards generated"}</p>
                  <div style={{ position: 'absolute', bottom: '32px', color: '#7a12cc', fontSize: '14px', fontWeight: 600 }}>Click to flip</div>
                </div>
                <div className="ws-flashcard-back" style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: '24px', position: 'relative' }}>
                   <p style={{ fontSize: '18px', textAlign: 'center', padding: '0 40px', color: '#4C1D95', lineHeight: 1.6 }}>{items[currentFlashcardIndex]?.back}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
               <button className="ws-tactile-btn" onClick={(e) => { e.stopPropagation(); setCurrentFlashcardIndex(prev => Math.max(0, prev - 1)) }} disabled={currentFlashcardIndex === 0}>
                 <ChevronLeft size={20} />
               </button>
               <span style={{ fontWeight: 800, color: '#4C1D95' }}>{currentFlashcardIndex + 1} of {items.length}</span>
               <button className="ws-tactile-btn" onClick={(e) => { e.stopPropagation(); setCurrentFlashcardIndex(prev => Math.min(items.length - 1, prev + 1)) }} disabled={currentFlashcardIndex === items.length - 1}>
                 <ChevronRight size={20} />
               </button>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'quiz') {
      const items = Array.isArray(content) ? content : []
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <button className="ws-tactile-btn" style={{ background: '#7a12cc', color: 'white', padding: '8px 20px' }}>Quit</button>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px' }}>
              {items.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentFlashcardIndex(i)}
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid',
                    borderColor: currentFlashcardIndex === i ? '#7a12cc' : '#E2E8F0',
                    background: currentFlashcardIndex === i ? 'white' : 'transparent',
                    color: currentFlashcardIndex === i ? '#7a12cc' : '#94A3B8',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
            Showing {currentFlashcardIndex + 1}-{Math.min(currentFlashcardIndex + 7, items.length)} of {items.length} questions
          </p>

          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #E2E8F0', padding: '48px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', position: 'relative' }}>
             <h3 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', color: '#1A3A32', marginBottom: '40px', lineHeight: 1.4 }}>
               {items[currentFlashcardIndex]?.question}
             </h3>

             <div style={{ maxWidth: '400px', margin: '0 auto' }}>
               <input 
                 type="text" 
                 placeholder="Enter your answer..."
                 style={{ width: '100%', padding: '16px 24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontSize: '15px', textAlign: 'center' }}
               />
             </div>

             <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#F5F3FF', color: '#7a12cc' }} onClick={() => setCurrentFlashcardIndex(prev => Math.max(0, prev - 1))}>Previous</button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: 'transparent', color: '#7a12cc' }}>Skip</button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#7a12cc', color: 'white' }} onClick={() => setCurrentFlashcardIndex(prev => Math.min(items.length - 1, prev + 1))}>Next</button>
             </div>
          </div>
        </div>
      )
    }

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="ws-heading" style={{ fontSize: '24px', color: '#7a12cc', textTransform: 'capitalize' }}>
            AI {activeTab}
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
    )
  }
  
  return (
    <div 
      ref={contentRef}
      className="ws-content-scroll" 
      style={{ padding: '32px', position: 'relative', height: '100%' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
        <SharedCanvasOverlay />
        <LuterSpark />
      </div>
      {renderContent()}
    </div>
  )
}
