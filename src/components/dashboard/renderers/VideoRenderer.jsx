import React, { useState, useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { useReadingSpace } from '../ReadingSpaceContext'
import { Play, Pause, FileText, Clock, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function VideoRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const { setViewportData, updateSelection } = useReadingSpace()
  const [played, setPlayed] = useState(0)
  const playerRef = useRef(null)

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

  const renderContent = () => {
    if (activeTab === 'content') {
      return (
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

    if (activeTab === 'flashcards' || activeTab === 'quiz') {
      const items = Array.isArray(content) ? content : []
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px' }}>
          <h2 className="ws-heading" style={{ fontSize: '24px', marginBottom: '24px', color: '#7a12cc' }}>
            {activeTab === 'flashcards' ? 'AI Video Flashcards' : 'AI Video Quiz'}
          </h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ padding: '24px', borderRadius: '16px', background: 'white', border: '1px solid #DDD6FE', boxShadow: '0 4px 12px rgba(122, 18, 204, 0.05)' }}>
                <p style={{ fontWeight: 600, color: '#4C1D95', marginBottom: '12px' }}>{item.front || item.question}</p>
                <p style={{ color: '#4A5568', fontSize: '14px' }}>{item.back || item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="ws-content-scroll" style={{ padding: '40px' }}>
        <div className="markdown-body" style={{ maxWidth: '800px', margin: '0 auto', color: '#4C1D95' }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    )
  }

  return (
    <div className="ws-content-scroll" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: '100%' }}>
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

      {renderContent()}
    </div>
  )
}
