import React, { useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import { useReadingSpace } from '../ReadingSpaceContext'
import { SharedCanvasOverlay, LuterSpark } from '../WorkstationOverlays'
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

// Set worker path
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

export default function PdfRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)
  
  const { setViewportData, highlightText, updateSpark, clearHighlights, updateSelection } = useReadingSpace()
  
  const [pdf, setPdf] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [loading, setLoading] = useState(true)

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
    if (material.source_url) {
      loadPdf(material.source_url)
    }
  }, [material.source_url])

  useEffect(() => {
    if (pdf && activeTab === 'content') renderPage(pageNumber)
  }, [pdf, pageNumber, scale, activeTab])

  const loadPdf = async (url) => {
    setLoading(true)
    try {
      const loadingTask = pdfjs.getDocument(url)
      const pdfDoc = await loadingTask.promise
      setPdf(pdfDoc)
      setLoading(false)
    } catch (error) {
      console.error('Error loading PDF:', error)
      setLoading(false)
    }
  }

  const renderPage = async (num) => {
    const page = await pdf.getPage(num)
    const viewport = page.getViewport({ scale })
    
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }
    await page.render(renderContext).promise

    // Render text layer for coordinate mapping
    const textContent = await page.getTextContent()
    const textLayer = textLayerRef.current
    if (textLayer) {
      textLayer.innerHTML = ''
      textLayer.style.height = `${viewport.height}px`
      textLayer.style.width = `${viewport.width}px`
      
      pdfjs.renderTextLayer({
        textContentSource: textContent,
        container: textLayer,
        viewport: viewport,
        textDivs: []
      })
    }

    // Update context for AI
    const textItems = textContent.items.map(item => item.str).join(' ')
    setViewportData({
      visibleText: textItems,
      scrollPercent: (num / pdf.numPages) * 100,
      currentPage: num
    })
  }

  const handlePageChange = (delta) => {
    const newPage = Math.min(Math.max(1, pageNumber + delta), pdf.numPages)
    setPageNumber(newPage)
    clearHighlights()
  }

  const downloadContent = () => {
    const content = analysisState[activeTab]
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
        <div style={{ flex: 1, padding: '40px', display: 'flex', justifyContent: 'center' }}>
          <div 
            ref={containerRef}
            style={{ 
              position: 'relative', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
              borderRadius: '4px',
              overflow: 'hidden',
              background: 'white'
            }}
          >
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 40 }}>
                <Loader2 className="animate-spin" size={32} color="#7a12cc" />
              </div>
            )}
            
            <canvas ref={canvasRef} />
            <div ref={textLayerRef} className="textLayer" style={{ position: 'absolute', top: 0, left: 0, opacity: 0.2 }} />
            
            {/* AI Interaction Layers */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <SharedCanvasOverlay />
              <LuterSpark />
            </div>
          </div>
        </div>
      )
    }

    if (analysisState.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Luter is analyzing the PDF...</p>
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
                  <p style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', padding: '0 40px', color: '#1A3A32' }}>{items[pageNumber - 1]?.front || "No cards generated"}</p>
                  <div style={{ position: 'absolute', bottom: '32px', color: '#7a12cc', fontSize: '14px', fontWeight: 600 }}>Click to flip</div>
                </div>
                <div className="ws-flashcard-back" style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: '24px', position: 'relative' }}>
                   <p style={{ fontSize: '18px', textAlign: 'center', padding: '0 40px', color: '#4C1D95', lineHeight: 1.6 }}>{items[pageNumber - 1]?.back}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
               <button className="ws-tactile-btn" onClick={(e) => { e.stopPropagation(); setPageNumber(prev => Math.max(1, prev - 1)) }} disabled={pageNumber === 1}>
                 <ChevronLeft size={20} />
               </button>
               <span style={{ fontWeight: 800, color: '#4C1D95' }}>{pageNumber} of {items.length}</span>
               <button className="ws-tactile-btn" onClick={(e) => { e.stopPropagation(); setPageNumber(prev => Math.min(items.length, prev + 1)) }} disabled={pageNumber === items.length}>
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
                  onClick={() => setPageNumber(i + 1)}
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid',
                    borderColor: pageNumber === (i + 1) ? '#7a12cc' : '#E2E8F0',
                    background: pageNumber === (i + 1) ? 'white' : 'transparent',
                    color: pageNumber === (i + 1) ? '#7a12cc' : '#94A3B8',
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', fontWeight: 600, marginBottom: '24px' }}>
            Showing {pageNumber}-{Math.min(pageNumber + 6, items.length)} of {items.length} questions
          </p>

          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #E2E8F0', padding: '48px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', position: 'relative' }}>
             <h3 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', color: '#1A3A32', marginBottom: '40px', lineHeight: 1.4 }}>
               {items[pageNumber - 1]?.question}
             </h3>

             <div style={{ maxWidth: '400px', margin: '0 auto' }}>
               <input 
                 type="text" 
                 placeholder="Enter your answer..."
                 style={{ width: '100%', padding: '16px 24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontSize: '15px', textAlign: 'center' }}
               />
             </div>

             <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#F5F3FF', color: '#7a12cc' }} onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}>Previous</button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: 'transparent', color: '#7a12cc' }}>Skip</button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#7a12cc', color: 'white' }} onClick={() => setPageNumber(prev => Math.min(items.length, prev + 1))}>Next</button>
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
    <div className="ws-content-scroll" style={{ padding: '0', background: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      {/* PDF Controls - only show in content tab */}
      {activeTab === 'content' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 30, background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="ws-tactile-btn" style={{ padding: '6px' }} onClick={() => handlePageChange(-1)} disabled={pageNumber <= 1}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '13px' }}>
              Page {pageNumber} of {pdf?.numPages || '?'}
            </span>
            <button className="ws-tactile-btn" style={{ padding: '6px' }} onClick={() => handlePageChange(1)} disabled={pageNumber >= pdf?.numPages}>
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="ws-tactile-btn" style={{ padding: '6px' }} onClick={() => setScale(s => Math.max(0.5, s - 0.2))}>
              <ZoomOut size={18} />
            </button>
            <button className="ws-tactile-btn" style={{ padding: '6px' }} onClick={() => setScale(s => Math.min(3, s + 0.2))}>
              <ZoomIn size={18} />
            </button>
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  )
}
