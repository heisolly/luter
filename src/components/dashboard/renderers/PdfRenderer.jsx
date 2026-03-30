import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjs from 'pdfjs-dist'
import { useReadingSpace } from '../ReadingSpaceContext'
import { SharedCanvasOverlay, LuterSpark } from '../WorkstationOverlays'
import { Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import Mark from 'mark.js'
import { AIHighlightService } from '../../../services/aiHighlightService'

// Set worker path - use local worker to avoid CORS issues
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

export default function PdfRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const textLayerRef = useRef(null)
  const highlightLayerRef = useRef(null)
  const markInstanceRef = useRef(null)
  
  const { setViewportData, highlightText, updateSpark, clearHighlights, updateSelection, drawCommands, highlightPdfArea } = useReadingSpace()
  
  const [pdf, setPdf] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.5)
  const [loading, setLoading] = useState(true)
  const [isFlipped, setIsFlipped] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizScore, setQuizScore] = useState(null)
  const [aiHighlights, setAiHighlights] = useState([])
  const [coordinateMap, setCoordinateMap] = useState({})
  const [isCardChanging, setIsCardChanging] = useState(false)
  const [cardDirection, setCardDirection] = useState('next') // 'next' or 'prev'

  // AI Highlighting Functions
  const triggerAiHighlight = useCallback((highlightData) => {
    if (highlightData.documentType === 'pdf' && highlightData.pageIndex === pageNumber - 1) {
      const highlight = {
        id: highlightData.id || Date.now(),
        ...highlightData.coordinates,
        label: highlightData.label,
        color: highlightData.color || '#7a12cc'
      }
      setAiHighlights(prev => [...prev, highlight])
    }
  }, [pageNumber])

  // Process AI highlight commands
  useEffect(() => {
    const pdfHighlights = drawCommands.filter(cmd => 
      cmd.type === 'highlight' && cmd.documentType === 'pdf'
    )
    
    pdfHighlights.forEach(highlight => {
      if (highlight.pageIndex === pageNumber - 1) {
        triggerAiHighlight(highlight)
      }
    })
  }, [drawCommands, pageNumber, triggerAiHighlight])

  // Clear highlights when page changes or context requests
  useEffect(() => {
    setAiHighlights([])
  }, [pageNumber])

  useEffect(() => {
    if (drawCommands.length === 0) {
      setAiHighlights([])
    }
  }, [drawCommands])

  // Card change animation function
  const changeCard = useCallback((newIndex, direction) => {
    if (newIndex === currentIdx || isCardChanging) return
    
    setIsCardChanging(true)
    setCardDirection(direction)
    
    // Start fade out
    setTimeout(() => {
      setCurrentIdx(newIndex)
      setIsFlipped(false)
      
      // Start fade in
      setTimeout(() => {
        setIsCardChanging(false)
      }, 50)
    }, 200)
  }, [currentIdx, isCardChanging])

  // Expose PDF highlighting function to global scope
  useEffect(() => {
    window.highlightPdfArea = (data) => {
      highlightPdfArea(data)
    }
    return () => {
      delete window.highlightPdfArea
    }
  }, [highlightPdfArea])

  const renderTaskRef = useRef(null)

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
    console.log('Loading PDF from URL:', url)
    
    try {
      // Check if URL is valid
      if (!url) {
        throw new Error('No PDF URL provided')
      }

      // Configure PDF.js loading options for v5.x
      const loadingTask = pdfjs.getDocument({
        url: url,
        // Remove cMap options for v5.x as they may cause issues
        disableAutoFetch: true,
        disableStream: true
      })
      
      loadingTask.onProgress = (progress) => {
        console.log('PDF loading progress:', progress)
      }
      
      const pdfDoc = await loadingTask.promise
      console.log('PDF loaded successfully, pages:', pdfDoc.numPages)
      setPdf(pdfDoc)
      setLoading(false)
    } catch (error) {
      console.error('Error loading PDF:', error)
      console.error('PDF URL was:', url)
      setLoading(false)
      
      // Set error state that can be displayed to user
      setPdf(null)
    }
  }

  const renderPage = async (num) => {
    if (!pdf) return
    
    // Cancel previous render task if any
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
    }

    try {
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
      
      const renderTask = page.render(renderContext)
      renderTaskRef.current = renderTask
      await renderTask.promise

      // Render text layer for coordinate mapping
      const textContent = await page.getTextContent()
      const textLayer = textLayerRef.current
      if (textLayer) {
        textLayer.innerHTML = ''
        textLayer.style.height = `${viewport.height}px`
        textLayer.style.width = `${viewport.width}px`
        
        // Simplified text layer for PDF.js v5.x - just extract text for AI context
        try {
          // Create basic text divs for selection without advanced TextLayer
          textContent.items.forEach((item, index) => {
            const textDiv = document.createElement('div')
            textDiv.textContent = item.str
            textDiv.style.position = 'absolute'
            textDiv.style.left = `${item.transform[4]}px`
            textDiv.style.top = `${viewport.height - item.transform[5]}px`
            textDiv.style.fontSize = `${item.height}px`
            textDiv.style.fontFamily = item.fontName
            textDiv.style.color = 'transparent'
            textDiv.style.userSelect = 'text'
            textDiv.style.cursor = 'text'
            textDiv.setAttribute('data-index', index)
            textLayer.appendChild(textDiv)
          })
        } catch (err) {
          console.warn('Basic text layer setup failed:', err)
          // Fallback: just add invisible text for basic functionality
          const textItems = textContent.items.map(item => item.str).join(' ')
          textLayer.textContent = textItems
          textLayer.style.color = 'transparent'
          textLayer.style.fontSize = '1px'
        }
      }

      // Update context for AI
      const textItems = textContent.items.map(item => item.str).join(' ')
      setViewportData({
        visibleText: textItems,
        scrollPercent: (num / pdf.numPages) * 100,
        currentPage: num
      })
    } catch (err) {
      if (err.name === 'RenderingCancelledException') {
        console.log('Rendering cancelled')
      } else {
        console.error('Render error:', err)
      }
    }
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
      // Show error state if PDF failed to load
      if (!loading && !pdf && material.source_url) {
        return (
          <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
            <div style={{ width: '80px', height: '80px', background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={40} color="#DC2626" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D', margin: 0 }}>PDF Failed to Load</h3>
            <p style={{ fontSize: '14px', color: '#64748B', textAlign: 'center', margin: 0, maxWidth: '400px' }}>
              We couldn't load this PDF file. This might be due to:
            </p>
            <ul style={{ fontSize: '13px', color: '#64748B', textAlign: 'left', margin: 0 }}>
              <li>Corrupted or invalid PDF file</li>
              <li>Network connection issues</li>
              <li>Access restrictions on the file</li>
              <li>Unsupported PDF format</li>
            </ul>
            <button 
              onClick={() => loadPdf(material.source_url)}
              style={{
                padding: '12px 24px',
                background: '#7a12cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          </div>
        )
      }

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
            
            {/* AI Highlight Overlay Layer */}
            <div 
              ref={highlightLayerRef}
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                pointerEvents: 'none',
                zIndex: 15
              }}
            >
              {aiHighlights.map(highlight => (
                <div
                  key={highlight.id}
                  style={{
                    position: 'absolute',
                    left: `${highlight.left}%`,
                    top: `${highlight.top}%`,
                    width: `${highlight.width}%`,
                    height: `${highlight.height}%`,
                    background: `${highlight.color}33`, // Add transparency
                    border: `2px solid ${highlight.color}`,
                    borderRadius: '4px',
                    pointerEvents: 'auto',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    animation: 'luterHighlightPulse 2s ease-in-out infinite'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Show action bubble or handle click
                    updateSpark(e.clientX, e.clientY, true)
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-28px',
                      left: '0',
                      background: highlight.color,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    {highlight.label}
                  </div>
                </div>
              ))}
            </div>
            
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
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', background: '#F8FAFC', minHeight: '100vh' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D', marginBottom: '8px' }}>Flashcards</h1>
              <p style={{ fontSize: '16px', color: '#64748B', margin: 0 }}>Master the material with interactive flashcards</p>
            </div>
            <button 
              onClick={() => onRunAnalysis('flashcards')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #7a12cc 0%, #6d11b8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(122, 18, 204, 0.3)'
              }}
            >
              <Sparkles size={16} /> Regenerate
            </button>
          </div>

          {/* Progress Bar */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Progress</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#7a12cc' }}>{currentIdx + 1} / {items.length}</span>
            </div>
            <div style={{ 
              height: '8px', 
              background: '#E5E7EB', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${((currentIdx + 1) / items.length) * 100}%`,
                background: 'linear-gradient(90deg, #7a12cc 0%, #8b5cf6 100%)',
                borderRadius: '4px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Flashcard */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px', height: '400px' }}>
            <div 
              className={`ws-flashcard ${isFlipped ? 'ws-flashcard--flipped' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ 
                width: '100%', 
                maxWidth: '650px', 
                height: '100%',
                cursor: 'pointer',
                opacity: isCardChanging ? 0 : 1,
                transform: isCardChanging 
                  ? (cardDirection === 'next' ? 'translateY(30px)' : 'translateY(-30px)')
                  : 'translateY(0)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div className="ws-flashcard-inner">
                {/* Front of card */}
                <div className="ws-flashcard-front" style={{
                  background: 'linear-gradient(135deg, #7a12cc 0%, #8b5cf6 100%)',
                  borderRadius: '20px',
                  border: 'none',
                  boxShadow: '0 20px 40px rgba(122, 18, 204, 0.2)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Pattern overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    opacity: 0.5
                  }} />
                  
                  <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'white',
                        marginBottom: '32px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Question {currentIdx + 1}
                      </div>
                      <h2 style={{ 
                        fontSize: '28px', 
                        fontWeight: 700, 
                        color: 'white', 
                        margin: '0',
                        lineHeight: 1.4,
                        minHeight: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {items[currentIdx]?.front || "No cards generated"}
                      </h2>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: '30px',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'white',
                        backdropFilter: 'blur(10px)'
                      }}>
                        <span>Click to reveal answer</span>
                        <ChevronRight size={16} style={{ transform: isFlipped ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back of card */}
                <div className="ws-flashcard-back" style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: '2px solid #E5E7EB',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  position: 'relative'
                }}>
                  <div style={{ padding: '40px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: '#F3F4F6',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#6B7280',
                        marginBottom: '32px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                      }}>
                        Answer
                      </div>
                      <p style={{ 
                        fontSize: '20px', 
                        lineHeight: 1.6, 
                        color: '#1F2937',
                        margin: '0',
                        fontWeight: 500
                      }}>
                        {items[currentIdx]?.back}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Mark as difficult
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          border: '1px solid #FECACA',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Difficult
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Mark as known
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#F0FDF4',
                          color: '#16A34A',
                          border: '1px solid #BBF7D0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Got it!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button 
              className="ws-tactile-btn" 
              onClick={(e) => { 
                e.stopPropagation(); 
                changeCard(Math.max(0, currentIdx - 1), 'prev');
              }} 
              disabled={currentIdx === 0}
              style={{
                padding: '12px 24px',
                background: currentIdx === 0 ? '#F3F4F6' : 'white',
                color: currentIdx === 0 ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: currentIdx === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => { 
                    const direction = index > currentIdx ? 'next' : 'prev'
                    changeCard(index, direction);
                  }}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    border: 'none',
                    background: index === currentIdx ? '#7a12cc' : '#E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
            
            <button 
              className="ws-tactile-btn" 
              onClick={(e) => { 
                e.stopPropagation(); 
                changeCard(Math.min(items.length - 1, currentIdx + 1), 'next');
              }} 
              disabled={currentIdx === items.length - 1}
              style={{
                padding: '12px 24px',
                background: currentIdx === items.length - 1 ? '#F3F4F6' : 'white',
                color: currentIdx === items.length - 1 ? '#9CA3AF' : '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: currentIdx === items.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Next
              <ChevronRight size={18} />
            </button>
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
            <button 
              className="ws-tactile-btn" 
              style={{ padding: '6px 12px', fontSize: '11px', background: '#7a12cc', color: 'white' }}
              onClick={async () => {
                // Generate smart highlights
                if (material) {
                  const analysis = await AIHighlightService.generateSmartHighlights(material, 'pdf')
                  console.log('Generated highlights:', analysis)
                }
              }}
            >
              <Sparkles size={14} /> AI Highlights
            </button>
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
