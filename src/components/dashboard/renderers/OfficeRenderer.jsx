import React, { useEffect, useRef, useState } from 'react'
import { ExternalLink, AlertCircle, Loader2, Download, Sparkles, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useReadingSpace } from '../ReadingSpaceContext'
import ReactMarkdown from 'react-markdown'
import * as docx from "docx-preview"
import Mark from 'mark.js'

export default function OfficeRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const { setViewportData, updateSelection, drawCommands } = useReadingSpace()
  const docxContainerRef = useRef(null)
  const markInstanceRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [isDocx, setIsDocx] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const fileUrl = material.source_url
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  useEffect(() => {
    const type = material.type?.toLowerCase() || ''
    const url = material.source_url || ''
    const isDocFile = type === 'docx' || url.endsWith('.docx')
    setIsDocx(isDocFile)

    if (isDocFile && activeTab === 'content') {
      renderDocx(url)
    }

    if (material.extracted_text) {
      setViewportData({
        visibleText: material.extracted_text.slice(0, 5000),
        scrollPercent: 0,
        currentPage: 1
      })
    }
  }, [material, activeTab])

  // Handle Live Highlights from AI
  useEffect(() => {
    if (isDocx && docxContainerRef.current && drawCommands.length > 0) {
      if (!markInstanceRef.current) {
        markInstanceRef.current = new Mark(docxContainerRef.current)
      }
      
      const lastCommand = drawCommands[drawCommands.length - 1]
      if (lastCommand.type === 'highlight' && lastCommand.label) {
        markInstanceRef.current.unmark()
        markInstanceRef.current.mark(lastCommand.label, {
          className: 'luter-glow',
          accuracy: 'complementary'
        })
      }
    }
  }, [drawCommands, isDocx])

  useEffect(() => {
    const handleMouseUp = (e) => {
      const sel = window.getSelection()
      const text = sel.toString().trim()
      
      if (text && text.length > 2) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        updateSelection(text, rect, true)
      } else {
        if (!e.target.closest('.selection-action-bar')) {
          updateSelection('', null, false)
        }
      }
    }

    const container = docxContainerRef.current
    if (container && isDocx && activeTab === 'content') {
      container.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      if (container) container.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDocx, activeTab, updateSelection])

  const renderDocx = async (url) => {
    setLoading(true)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = ""
        await docx.renderAsync(blob, docxContainerRef.current, docxContainerRef.current, {
          className: "docx",
          inWrapper: false
        })
      }
    } catch (err) {
      console.error("Docx render error:", err)
    } finally {
      setLoading(false)
    }
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
        <div style={{ flex: 1, position: 'relative', background: '#F1F5F9', overflow: 'auto' }}>
          {isDocx ? (
            <div 
              ref={docxContainerRef} 
              className="docx-viewer-container"
              style={{ 
                padding: '40px', 
                background: 'white', 
                maxWidth: '900px', 
                margin: '20px auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                minHeight: '100%'
              }}
            />
          ) : (
            <iframe
              src={viewerUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Document Viewer"
            />
          )}
          
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 40 }}>
              <Loader2 className="animate-spin" size={32} color="#7a12cc" />
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '24px', right: '24px', padding: '12px 20px', background: 'rgba(76, 29, 149, 0.9)', color: 'white', borderRadius: '12px', fontSize: '12px', fontFamily: 'Outfit', maxWidth: '240px', backdropFilter: 'blur(8px)', border: '1px solid #7a12cc', zIndex: 50 }}>
            <p style={{ margin: 0 }}>Luter is reading along with you using the {isDocx ? 'native DOM' : 'pre-scanned map'}.</p>
          </div>
        </div>
      )
    }

    if (analysisState.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', background: 'white' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Luter is analyzing the document...</p>
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
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <button className="ws-tactile-btn" style={{ background: '#7a12cc', color: 'white', padding: '8px 20px' }}>Quit</button>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px' }}>
              {items.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => setCurrentIdx(i)}
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid',
                    borderColor: currentIdx === i ? '#7a12cc' : '#E2E8F0',
                    background: currentIdx === i ? 'white' : 'transparent',
                    color: currentIdx === i ? '#7a12cc' : '#94A3B8',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
            Showing {currentIdx + 1}-{Math.min(currentIdx + 7, items.length)} of {items.length} questions
          </p>

          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #E2E8F0', padding: '48px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', position: 'relative' }}>
             <h3 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', color: '#1A3A32', marginBottom: '40px', lineHeight: 1.4 }}>
               {items[currentIdx]?.question}
             </h3>

             <div style={{ maxWidth: '400px', margin: '0 auto' }}>
               <input 
                 type="text" 
                 placeholder="Enter your answer..."
                 style={{ width: '100%', padding: '16px 24px', borderRadius: '16px', border: '1px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontSize: '15px', textAlign: 'center' }}
               />
             </div>

             <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#F5F3FF', color: '#7a12cc' }} onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}>Previous</button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: 'transparent', color: '#7a12cc' }}>Skip</button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#7a12cc', color: 'white' }} onClick={() => setCurrentIdx(prev => Math.min(items.length - 1, prev + 1))}>Next</button>
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A5568' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: '12px', fontFamily: 'Outfit' }}>Using {isDocx ? 'Native DOM Renderer' : 'External Viewer'} for {material.type?.toUpperCase()}</span>
        </div>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="ws-send-btn"
          style={{ padding: '6px 12px', fontSize: '11px' }}
        >
          <ExternalLink size={12} /> open original
        </a>
      </div>
      
      {renderContent()}
    </div>
  )
}
