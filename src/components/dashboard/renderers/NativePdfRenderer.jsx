import React, { useEffect, useRef, useState, useCallback } from 'react'
import { AlertCircle, Loader2, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Search, FileText, Maximize2, Minimize2, Sparkles } from 'lucide-react'
import { useReadingSpace } from '../ReadingSpaceContext'
import Mark from 'mark.js'

export default function NativePdfRenderer({ material, activeTab, analysisState, onRunAnalysis, onProgressUpdate }) {
  const { setViewportData, updateSelection, drawCommands, highlightText } = useReadingSpace()
  const iframeRef = useRef(null)
  const containerRef = useRef(null)
  const markInstanceRef = useRef(null)
  const highlightOverlayRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [highlights, setHighlights] = useState([])
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [readingStartTime, setReadingStartTime] = useState(Date.now())
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Initialize PDF when component mounts
  useEffect(() => {
    if (activeTab === 'content' && material.source_url) {
      initializePdf()
      setReadingStartTime(Date.now())
    }
  }, [activeTab, material.source_url])

  // Track reading progress
  useEffect(() => {
    if (currentPage > 0 && totalPages > 0 && onProgressUpdate) {
      const progressData = {
        currentPage,
        totalPages,
        scrollPercent: (currentPage / totalPages) * 100,
        timestamp: Date.now(),
        readingTime: Date.now() - readingStartTime,
        highlights: highlights.length,
        documentType: 'pdf'
      }
      
      onProgressUpdate(progressData)
      
      // Update reading tracker if available
      if (window.readingTracker) {
        window.readingTracker.updatePageProgress(currentPage, totalPages)
        window.readingTracker.updateHighlights(highlights.length)
      }
    }
  }, [currentPage, totalPages, highlights.length, onProgressUpdate, readingStartTime])

  // Track user activity for focus score
  const trackUserActivity = useCallback(() => {
    setLastActivity(Date.now())
    
    // Update focus score through reading tracker
    if (window.readingTracker) {
      // Reading tracker will handle focus score calculation
    }
  }, [])

  // Add activity tracking to user interactions
  useEffect(() => {
    const activities = ['click', 'scroll', 'keypress', 'mousemove']
    
    const handleActivity = () => {
      trackUserActivity()
    }

    activities.forEach(activity => {
      document.addEventListener(activity, handleActivity, { passive: true })
    })

    return () => {
      activities.forEach(activity => {
        document.removeEventListener(activity, handleActivity)
      })
    }
  }, [trackUserActivity])

  const initializePdf = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Create a URL that forces browser PDF viewer
      const url = material.source_url
      
      // Add timestamp to prevent caching issues
      const timestampedUrl = url.includes('?') 
        ? `${url}&_t=${Date.now()}` 
        : `${url}?_t=${Date.now()}`
      
      setPdfUrl(timestampedUrl)
      
      // Set initial viewport data
      setViewportData({
        visibleText: 'PDF loading... Please wait.',
        scrollPercent: 0,
        currentPage: 1,
        totalPages: 1,
        documentType: 'pdf'
      })
      
      // Try to extract text using a simple fetch approach
      await extractPdfText(timestampedUrl)
      
    } catch (err) {
      console.error('PDF initialization error:', err)
      setError(`Failed to load PDF: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Extract text from PDF for AI processing
  const extractPdfText = async (url) => {
    try {
      // For now, use the material's extracted text if available
      if (material.extracted_text) {
        setExtractedText(material.extracted_text)
        setViewportData({
          visibleText: material.extracted_text.slice(0, 2000),
          scrollPercent: 0,
          currentPage: 1,
          totalPages: 1,
          documentType: 'pdf'
        })
      } else {
        setExtractedText('PDF text extraction not available. Using browser viewer.')
        setViewportData({
          visibleText: 'PDF loaded successfully. Browser-based viewing active.',
          scrollPercent: 0,
          currentPage: 1,
          totalPages: 1,
          documentType: 'pdf'
        })
      }
    } catch (error) {
      console.error('Text extraction error:', error)
    }
  }

  // Send commands to the PDF iframe
  const sendCommandToPdf = (command) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(command, '*')
      } catch (error) {
        console.log('Cannot send command to PDF iframe:', error)
      }
    }
  }

  // Navigation functions
  const nextPage = () => {
    trackUserActivity()
    sendCommandToPdf({ type: 'nextPage' })
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const prevPage = () => {
    trackUserActivity()
    sendCommandToPdf({ type: 'previousPage' })
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  const goToPage = (pageNum) => {
    trackUserActivity()
    sendCommandToPdf({ type: 'goToPage', pageNumber: pageNum })
    setCurrentPage(pageNum)
  }

  // Zoom functions
  const zoomIn = () => {
    trackUserActivity()
    sendCommandToPdf({ type: 'zoomIn' })
    setScale(prev => Math.min(prev + 0.25, 3.0))
  }

  const zoomOut = () => {
    trackUserActivity()
    sendCommandToPdf({ type: 'zoomOut' })
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const resetZoom = () => {
    trackUserActivity()
    sendCommandToPdf({ type: 'resetZoom' })
    setScale(1.0)
  }

  // Search functionality
  const searchInDocument = () => {
    if (!searchTerm.trim()) return
    
    trackUserActivity()
    sendCommandToPdf({ type: 'search', query: searchTerm })
    
    // Also try to highlight in our extracted text
    if (markInstanceRef.current) {
      markInstanceRef.current.unmark()
      markInstanceRef.current.mark(searchTerm, {
        className: 'pdf-search-highlight',
        caseSensitive: false,
        accuracy: 'partially'
      })
    }
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    trackUserActivity()
    setIsFullscreen(!isFullscreen)
  }

  // Create highlight overlay for PDF
  const createHighlightOverlay = useCallback(() => {
    if (!iframeRef.current || !iframeLoaded) return

    const iframe = iframeRef.current
    const iframeRect = iframe.getBoundingClientRect()
    
    // Create or update highlight overlay
    if (!highlightOverlayRef.current) {
      highlightOverlayRef.current = document.createElement('div')
      highlightOverlayRef.current.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10;
      `
      iframe.parentElement.appendChild(highlightOverlayRef.current)
    }
    
    // Clear existing highlights
    highlightOverlayRef.current.innerHTML = ''
    
    // Add highlight elements
    highlights.forEach((highlight, index) => {
      const highlightEl = document.createElement('div')
      highlightEl.style.cssText = `
        position: absolute;
        background: rgba(122, 18, 204, 0.3);
        border: 2px solid #7a12cc;
        border-radius: 4px;
        pointer-events: auto;
        cursor: pointer;
        margin: 10px;
        padding: 8px 12px;
        font-family: 'Outfit', sans-serif;
        font-size: 12px;
        color: #7a12cc;
        font-weight: 600;
        max-width: 200px;
        word-wrap: break-word;
        animation: fadeIn 0.3s ease-in-out;
      `
      
      highlightEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <Sparkles size={12} />
          <span>AI Highlight</span>
        </div>
        <div style="margin-top: 4px; font-size: 11px; color: #4a5568;">
          "${highlight.text.substring(0, 50)}${highlight.text.length > 50 ? '...' : ''}"
        </div>
        <div style="margin-top: 4px; font-size: 10px; color: #6b7280;">
          ${highlight.label || 'Important'}
        </div>
      `
      
      // Position highlights in different locations
      const positions = [
        { top: '20%', left: '10%' },
        { top: '40%', left: '70%' },
        { top: '60%', left: '30%' },
        { top: '80%', left: '60%' },
        { top: '30%', left: '50%' }
      ]
      
      const position = positions[index % positions.length]
      Object.assign(highlightEl.style, position)
      
      // Add click handler
      highlightEl.addEventListener('click', () => {
        trackUserActivity()
        console.log('Highlight clicked:', highlight)
        // You could show more details or navigate to the relevant section
      })
      
      highlightOverlayRef.current.appendChild(highlightEl)
    })
  }, [highlights, iframeLoaded, trackUserActivity])

  // Process AI highlight commands
  useEffect(() => {
    const pdfHighlights = drawCommands.filter(cmd => 
      cmd.type === 'highlight' && cmd.documentType === 'pdf'
    )
    
    setHighlights(pdfHighlights)
    
    // Create overlay when highlights change
    if (pdfHighlights.length > 0 && iframeLoaded) {
      createHighlightOverlay()
    } else if (pdfHighlights.length === 0 && highlightOverlayRef.current) {
      // Clear overlay if no highlights
      highlightOverlayRef.current.innerHTML = ''
    }
  }, [drawCommands, iframeLoaded, createHighlightOverlay])

  // Also try to highlight in extracted text
  useEffect(() => {
    if (!markInstanceRef.current && containerRef.current) {
      markInstanceRef.current = new Mark(containerRef.current)
    }
    
    const highlights = drawCommands.filter(cmd => cmd.type === 'highlight')
    
    highlights.forEach(highlight => {
      if (markInstanceRef.current && extractedText) {
        // Clear previous marks
        markInstanceRef.current.unmark()
        // Apply new highlights
        markInstanceRef.current.mark(highlight.text, {
          className: 'ai-highlight',
          caseSensitive: false,
          accuracy: 'exactly'
        })
      }
    })
  }, [drawCommands, extractedText])

  // Clear highlights
  useEffect(() => {
    if (drawCommands.length === 0) {
      if (markInstanceRef.current) {
        markInstanceRef.current.unmark()
      }
      if (highlightOverlayRef.current) {
        highlightOverlayRef.current.innerHTML = ''
      }
    }
  }, [drawCommands])

  // Listen for messages from PDF iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'pdfInfo') {
        setTotalPages(event.data.totalPages || 1)
        setCurrentPage(event.data.currentPage || 1)
        
        // Update viewport data with current page info
        setViewportData({
          visibleText: extractedText.slice(0, 2000),
          scrollPercent: ((event.data.currentPage || 1) / (event.data.totalPages || 1)) * 100,
          currentPage: event.data.currentPage || 1,
          totalPages: event.data.totalPages || 1,
          documentType: 'pdf'
        })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [extractedText, setViewportData])

  // Expose highlighting function globally
  useEffect(() => {
    window.highlightPdfText = (text, label, context) => {
      trackUserActivity()
      highlightText(text, label, context)
    }
    return () => {
      delete window.highlightPdfText
    }
  }, [highlightText, trackUserActivity])

  // Handle iframe load
  const handleIframeLoad = () => {
    console.log('PDF iframe loaded')
    setIframeLoaded(true)
    setLoading(false)
    
    // Create highlights after a short delay to ensure PDF is rendered
    setTimeout(() => {
      if (highlights.length > 0) {
        createHighlightOverlay()
      }
    }, 1000)
  }

  // Add CSS animation
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .ai-highlight {
        background: rgba(122, 18, 204, 0.3) !important;
        border-radius: 3px !important;
        padding: 2px 4px !important;
        border-bottom: 2px solid #7a12cc !important;
      }
      
      .pdf-search-highlight {
        background: rgba(251, 191, 36, 0.3) !important;
        border-radius: 3px !important;
        padding: 2px 4px !important;
        border-bottom: 2px solid #f59e0b !important;
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        background: '#F8FAFC',
        fontFamily: 'Outfit'
      }}>
        <Loader2 className="animate-spin" size={48} style={{ color: '#7a12cc', marginBottom: '16px' }} />
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A102D', marginBottom: '8px' }}>
          Loading PDF...
        </div>
        <div style={{ fontSize: '14px', color: '#64748B' }}>
          Using browser's native PDF viewer
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        background: '#F8FAFC',
        fontFamily: 'Outfit',
        padding: '40px'
      }}>
        <AlertCircle size={48} style={{ color: '#DC2626', marginBottom: '16px' }} />
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#1A102D', marginBottom: '8px' }}>
          PDF Loading Error
        </div>
        <div style={{ fontSize: '14px', color: '#64748B', textAlign: 'center', marginBottom: '24px' }}>
          {error}
        </div>
        <button
          onClick={initializePdf}
          style={{
            padding: '12px 24px',
            background: '#7a12cc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#F8FAFC',
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? 0 : 'auto',
      left: isFullscreen ? 0 : 'auto',
      right: isFullscreen ? 0 : 'auto',
      bottom: isFullscreen ? 0 : 'auto',
      zIndex: isFullscreen ? 9999 : 1
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        fontFamily: 'Outfit',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} style={{ color: '#7a12cc' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A102D' }}>
              Native PDF Viewer
            </span>
            <span style={{
              fontSize: '11px',
              background: '#3B82F6',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600
            }}>
              Browser Native
            </span>
            {highlights.length > 0 && (
              <span style={{
                fontSize: '11px',
                background: '#10B981',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Sparkles size={10} />
                {highlights.length} AI Highlights
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={prevPage}
              style={{
                padding: '6px 12px',
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px'
              }}
            >
              <ChevronLeft size={14} />
            </button>
            
            <input
              id="page-input-native"
              type="number"
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
              min="1"
              max={totalPages}
              style={{
                width: '60px',
                padding: '6px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                textAlign: 'center',
                fontSize: '12px'
              }}
            />
            
            <span style={{ fontSize: '14px', color: '#64748B' }}>of {totalPages || '?'}</span>
            
            <button
              onClick={nextPage}
              style={{
                padding: '6px 12px',
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '12px'
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              onClick={zoomOut}
              style={{
                padding: '6px 8px',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <ZoomOut size={14} />
            </button>
            <span style={{ fontSize: '12px', color: '#64748B', minWidth: '40px', textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              style={{
                padding: '6px 8px',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={resetZoom}
              style={{
                padding: '6px 8px',
                background: '#F3F4F6',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <RotateCw size={14} />
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              id="search-input-native"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchInDocument()}
              placeholder="Search..."
              style={{
                padding: '6px 12px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '12px',
                width: '120px'
              }}
            />
            <button
              onClick={searchInDocument}
              style={{
                padding: '6px 8px',
                background: '#7a12cc',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Search size={14} />
            </button>
          </div>
          
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '6px 8px',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          
          <a
            href={material.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              textDecoration: 'none',
              color: '#374151',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ExternalLink size={12} />
            Open Original
          </a>
        </div>
      </div>
      
      {/* PDF iframe container */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          overflow: 'hidden',
          background: '#E5E7EB',
          position: 'relative'
        }}
      >
        <iframe
          ref={iframeRef}
          src={pdfUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
          title="PDF Document"
          onLoad={handleIframeLoad}
          onError={(e) => {
            console.error('PDF iframe error:', e)
            setError('Failed to load PDF in browser viewer')
          }}
        />
      </div>
      
      {/* Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 24px',
        background: 'white',
        borderTop: '1px solid #E2E8F0',
        fontSize: '12px',
        color: '#64748B',
        fontFamily: 'Outfit',
        flexShrink: 0
      }}>
        <div>
          Page {currentPage} of {totalPages || '?'} • Scale: {Math.round(scale * 100)}%
          {highlights.length > 0 && ` • ${highlights.length} AI Highlights`}
        </div>
        <div>
          {material.title} • Browser Native Viewer
        </div>
      </div>
    </div>
  )
}
