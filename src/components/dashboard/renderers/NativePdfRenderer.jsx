import React, { useEffect, useRef, useState, useCallback } from 'react'
import { AlertCircle, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Search, FileText, Maximize2, Minimize2, Sparkles, Highlighter, Palette, X, Send, Bot } from 'lucide-react'
import { useReadingSpace } from '../ReadingSpaceContext'
import Mark from 'mark.js'

export default function NativePdfRenderer({ material, activeTab, analysisState, onRunAnalysis, onProgressUpdate }) {
  const { setViewportData, updateSelection, drawCommands, highlightText } = useReadingSpace()
  const iframeRef = useRef(null)
  const containerRef = useRef(null)
  const markInstanceRef = useRef(null)
  const highlightOverlayRef = useRef(null)
  const selectionRef = useRef(null)
  
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
  const [isHighlightMode, setIsHighlightMode] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [showHighlightMenu, setShowHighlightMenu] = useState(false)
  const [highlightMenuPosition, setHighlightMenuPosition] = useState({ x: 0, y: 0 })
  const [userHighlights, setUserHighlights] = useState([])
  const [highlightColors] = useState([
    { name: 'Yellow', color: '#FEF3C7', border: '#F59E0B' },
    { name: 'Green', color: '#D1FAE5', border: '#10B981' },
    { name: 'Blue', color: '#DBEAFE', border: '#3B82F6' },
    { name: 'Purple', color: '#E9D5FF', border: '#8B5CF6' },
    { name: 'Pink', color: '#FCE7F3', border: '#EC4899' }
  ])

  // Initialize PDF when component mounts
  useEffect(() => {
    if (activeTab === 'content' && material.source_url) {
      initializePdf()
      setReadingStartTime(Date.now())
    }
  }, [activeTab, material.source_url])

  // Invisible tracking - track progress without showing UI
  useEffect(() => {
    if (currentPage > 0 && totalPages > 0 && onProgressUpdate) {
      const progressData = {
        currentPage,
        totalPages,
        scrollPercent: (currentPage / totalPages) * 100,
        timestamp: Date.now(),
        readingTime: Date.now() - readingStartTime,
        highlights: highlights.length + userHighlights.length,
        documentType: 'pdf'
      }
      
      onProgressUpdate(progressData)
      
      // Update reading tracker if available (invisible background tracking)
      if (window.readingTracker) {
        window.readingTracker.updatePageProgress(currentPage, totalPages)
        window.readingTracker.updateHighlights(highlights.length + userHighlights.length)
      }
    }
  }, [currentPage, totalPages, highlights.length, userHighlights.length, onProgressUpdate, readingStartTime])

  // Invisible user activity tracking for focus score
  const trackUserActivity = useCallback(() => {
    setLastActivity(Date.now())
    
    // Update focus score through reading tracker (invisible)
    if (window.readingTracker) {
      // Reading tracker will handle focus score calculation in background
    }
  }, [])

  // Add invisible activity tracking to user interactions
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

  // Text selection handling for highlighting and AI tutor
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection()
    const selectedText = selection.toString().trim()
    
    if (selectedText) {
      setSelectedText(selectedText)
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      
      setHighlightMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      
      // Show menu if in highlight mode OR if we have any text (for AI tutor)
      if (isHighlightMode || selectedText) {
        setShowHighlightMenu(true)
      }
    } else {
      setShowHighlightMenu(false)
      setSelectedText('')
    }
  }, [isHighlightMode])

  // Add text selection listener
  useEffect(() => {
    document.addEventListener('mouseup', handleTextSelection)
    document.addEventListener('keyup', handleTextSelection)
    
    return () => {
      document.removeEventListener('mouseup', handleTextSelection)
      document.removeEventListener('keyup', handleTextSelection)
    }
  }, [handleTextSelection])

  // Create user highlight
  const createUserHighlight = (colorIndex) => {
    if (!selectedText) return
    
    const selection = window.getSelection()
    if (!selection.rangeCount) return
    
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()
    
    const newHighlight = {
      id: Date.now(),
      text: selectedText,
      color: highlightColors[colorIndex],
      position: {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        page: currentPage
      },
      timestamp: Date.now(),
      type: 'user'
    }
    
    setUserHighlights(prev => [...prev, newHighlight])
    
    // Clear selection
    selection.removeAllRanges()
    setShowHighlightMenu(false)
    setSelectedText('')
    
    // Track activity
    trackUserActivity()
    
    // Save to reading tracker
    if (window.readingTracker) {
      window.readingTracker.updateHighlights(userHighlights.length + 1)
    }
  }

  // Send selected text to AI tutor using existing system
  const sendToAITutor = () => {
    if (!selectedText) return
    
    // Use the existing AI tool interface for highlighting
    if (window.luterAI?.highlightPdfArea) {
      // Create a highlight for the selected text area
      // This will trigger the AI system to analyze and respond
      window.luterAI.highlightPdfArea({
        pageIndex: currentPage - 1, // Convert to 0-based
        left: 10, // Approximate position
        top: 20,
        width: 30,
        height: 5,
        label: `User Question: ${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}`,
        color: '#7a12cc'
      })
    }
    
    // Also try to use the AI tool interface for direct questions
    if (window.aiToolInterface) {
      // The AI system will handle this through the existing tool calling mechanism
      console.log('Sending to AI tutor via existing system:', selectedText)
    }
    
    // Fallback: create a prompt for the user to copy
    const prompt = `Please help me understand this text from "${material?.title || 'PDF Document'}" (page ${currentPage}):\n\n"${selectedText}"`
    
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(prompt).then(() => {
      console.log('Text copied to clipboard for AI tutor')
    }).catch(() => {
      console.log('Please ask the AI tutor:', prompt)
    })
    
    // Clear selection
    window.getSelection().removeAllRanges()
    setShowHighlightMenu(false)
    setSelectedText('')
    
    // Track activity
    trackUserActivity()
  }

  // Remove user highlight
  const removeUserHighlight = (highlightId) => {
    setUserHighlights(prev => prev.filter(h => h.id !== highlightId))
    trackUserActivity()
  }

  // Toggle highlight mode
  const toggleHighlightMode = () => {
    setIsHighlightMode(!isHighlightMode)
    if (!isHighlightMode) {
      // Clear any existing selection when entering highlight mode
      window.getSelection().removeAllRanges()
      setShowHighlightMenu(false)
    }
    trackUserActivity()
  }

  // Render user highlights
  const renderUserHighlights = () => {
    return userHighlights
      .filter(highlight => highlight.position.page === currentPage)
      .map(highlight => (
        <div
          key={highlight.id}
          style={{
            position: 'absolute',
            left: highlight.position.x,
            top: highlight.position.y,
            width: highlight.position.width,
            height: highlight.position.height,
            backgroundColor: highlight.color.color,
            border: `2px solid ${highlight.color.border}`,
            borderRadius: '2px',
            pointerEvents: 'auto',
            cursor: 'pointer',
            zIndex: 5,
            opacity: 0.7,
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = 1
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = 0.7
          }}
          onClick={() => removeUserHighlight(highlight.id)}
          title={`${highlight.text} (Click to remove)`}
        />
      ))
  }

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

  // Process AI highlight commands - create overlay highlights like user highlights
  useEffect(() => {
    const pdfHighlights = drawCommands.filter(cmd => 
      cmd.type === 'highlight' && cmd.documentType === 'pdf'
    )
    
    setHighlights(pdfHighlights)
    
    // Create AI highlights using the same overlay system
    if (pdfHighlights.length > 0 && iframeLoaded) {
      createAIHighlightOverlay()
    }
  }, [drawCommands, iframeLoaded])

  // Create AI highlight overlay using the same system as user highlights
  const createAIHighlightOverlay = useCallback(() => {
    if (!iframeRef.current || !iframeLoaded) return

    // Clear existing AI highlights
    const existingAIHighlights = document.querySelectorAll('.ai-highlight-overlay')
    existingAIHighlights.forEach(el => el.remove())

    // Add AI highlight elements using the same positioning as user highlights
    highlights.forEach((highlight, index) => {
      // Create AI highlight overlay
      const aiHighlightEl = document.createElement('div')
      aiHighlightEl.className = 'ai-highlight-overlay'
      
      // Position AI highlights intelligently across the PDF
      const positions = [
        { x: '10%', y: '15%', width: '25%', height: '3%' },
        { x: '40%', y: '25%', width: '30%', height: '3%' },
        { x: '15%', y: '35%', width: '35%', height: '3%' },
        { x: '50%', y: '45%', width: '28%', height: '3%' },
        { x: '20%', y: '55%', width: '32%', height: '3%' },
        { x: '45%', y: '65%', width: '26%', height: '3%' },
        { x: '12%', y: '75%', width: '30%', height: '3%' },
        { x: '38%', y: '85%', width: '34%', height: '3%' }
      ]
      
      const position = positions[index % positions.length]
      
      aiHighlightEl.style.cssText = `
        position: absolute;
        left: ${position.x};
        top: ${position.y};
        width: ${position.width};
        height: ${position.height};
        background: rgba(122, 18, 204, 0.25);
        border: 2px solid #7a12cc;
        border-radius: 3px;
        pointer-events: auto;
        cursor: pointer;
        z-index: 6;
        opacity: 0.8;
        transition: all 0.3s ease;
        animation: aiHighlightFadeIn 0.5s ease-out;
      `
      
      // Add AI highlight content
      aiHighlightEl.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          color: #7a12cc;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
          <span>AI: ${highlight.label || 'Important'}</span>
        </div>
      `
      
      // Add hover effects
      aiHighlightEl.addEventListener('mouseenter', () => {
        aiHighlightEl.style.opacity = '1'
        aiHighlightEl.style.transform = 'scale(1.02)'
        aiHighlightEl.style.background = 'rgba(122, 18, 204, 0.35)'
      })
      
      aiHighlightEl.addEventListener('mouseleave', () => {
        aiHighlightEl.style.opacity = '0.8'
        aiHighlightEl.style.transform = 'scale(1)'
        aiHighlightEl.style.background = 'rgba(122, 18, 204, 0.25)'
      })
      
      // Add click handler to show full text
      aiHighlightEl.addEventListener('click', () => {
        alert(`AI Highlight: ${highlight.label || 'Important'}\n\nText: "${highlight.text}"\n\nContext: ${highlight.context || 'No additional context'}`)
      })
      
      // Add to container
      if (containerRef.current) {
        containerRef.current.appendChild(aiHighlightEl)
      }
    })
  }, [highlights, iframeLoaded])

  // Also try to highlight in extracted text for AI processing
  useEffect(() => {
    if (!markInstanceRef.current && containerRef.current) {
      markInstanceRef.current = new Mark(containerRef.current)
    }
    
    const aiHighlights = drawCommands.filter(cmd => cmd.type === 'highlight')
    
    aiHighlights.forEach(highlight => {
      if (markInstanceRef.current && extractedText) {
        // Clear previous marks
        markInstanceRef.current.unmark()
        // Apply new highlights to extracted text
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
      // Clear AI highlight overlays
      const existingAIHighlights = document.querySelectorAll('.ai-highlight-overlay')
      existingAIHighlights.forEach(el => el.remove())
      
      // Clear text highlights
      if (markInstanceRef.current) {
        markInstanceRef.current.unmark()
      }
    }
  }, [drawCommands])

  // Add CSS for AI highlight animations
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes aiHighlightFadeIn {
        from { 
          opacity: 0; 
          transform: translateY(-5px) scale(0.95); 
        }
        to { 
          opacity: 0.8; 
          transform: translateY(0) scale(1); 
        }
      }
      
      .ai-highlight {
        background: rgba(122, 18, 204, 0.3) !important;
        border-radius: 3px !important;
        padding: 2px 4px !important;
        border-bottom: 2px solid #7a12cc !important;
        position: relative !important;
      }
      
      .ai-highlight::before {
        content: '✨';
        position: absolute;
        left: -20px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
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
      if (document.head.contains(style)) {
        document.head.removeChild(style)
      }
    }
  }, [])

  // Expose PDF highlighting function to global scope (like DOCX)
  useEffect(() => {
    window.highlightPdfText = (text, label, context) => {
      // Create a user-style highlight for PDF text
      const newHighlight = {
        id: Date.now(),
        text: text,
        color: highlightColors[0], // Default yellow
        position: {
          x: 15, // Default position
          y: 25 + (userHighlights.length * 5), // Stack vertically
          width: 30,
          height: 3,
          page: currentPage
        },
        timestamp: Date.now(),
        type: 'user',
        label: label || 'Highlighted'
      }
      
      setUserHighlights(prev => [...prev, newHighlight])
      
      // Also add to AI system if available
      if (window.luterAI?.highlightPdfArea) {
        window.luterAI.highlightPdfArea({
          pageIndex: currentPage - 1,
          left: 15,
          top: 25 + (userHighlights.length * 5),
          width: 30,
          height: 3,
          label: label || 'Highlighted',
          color: '#FEF3C7'
        })
      }
    }
    
    return () => {
      delete window.highlightPdfText
    }
  }, [userHighlights.length, currentPage])

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
      background: '#F8FAFC'
    }}>
      {/* Minimalist Toolbar - only essential controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        fontFamily: 'Outfit',
        flexShrink: 0,
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A102D' }}>
            {material?.title || 'PDF Document'}
          </span>
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            Page {currentPage} of {totalPages || '?'}
          </span>
          {userHighlights.length > 0 && (
            <span style={{
              fontSize: '10px',
              background: '#FEF3C7',
              color: '#92400E',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600
            }}>
              {userHighlights.length} highlights
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Highlight toggle button */}
          <button
            onClick={toggleHighlightMode}
            style={{
              padding: '4px 8px',
              background: isHighlightMode ? '#7a12cc' : '#F3F4F6',
              color: isHighlightMode ? 'white' : '#374151',
              border: isHighlightMode ? '1px solid #7a12cc' : '1px solid #E5E7EB',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={isHighlightMode ? "Exit highlight mode" : "Enter highlight mode"}
          >
            <Highlighter size={12} />
            {isHighlightMode ? 'Highlighting' : 'Highlight'}
          </button>
          
          {/* Simple navigation */}
          <button
            onClick={prevPage}
            style={{
              padding: '4px 8px',
              background: currentPage > 1 ? '#7a12cc' : '#E5E7EB',
              color: currentPage > 1 ? 'white' : '#9CA3AF',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage > 1 ? 'pointer' : 'not-allowed',
              fontSize: '11px'
            }}
            disabled={currentPage <= 1}
          >
            ←
          </button>
          
          <button
            onClick={nextPage}
            style={{
              padding: '4px 8px',
              background: currentPage < totalPages ? '#7a12cc' : '#E5E7EB',
              color: currentPage < totalPages ? 'white' : '#9CA3AF',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage < totalPages ? 'pointer' : 'not-allowed',
              fontSize: '11px'
            }}
            disabled={currentPage >= totalPages}
          >
            →
          </button>
          
          {/* Zoom controls */}
          <button
            onClick={zoomOut}
            style={{
              padding: '4px 6px',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            −
          </button>
          <span style={{ fontSize: '11px', color: '#64748B', minWidth: '35px', textAlign: 'center' }}>
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            style={{
              padding: '4px 6px',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            +
          </button>
          
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            style={{
              padding: '4px 6px',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            ⛶
          </button>
        </div>
      </div>
      
      {/* Highlight color selection menu */}
      {showHighlightMenu && (
        <div
          style={{
            position: 'fixed',
            left: highlightMenuPosition.x - 120,
            top: highlightMenuPosition.y - 80,
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            zIndex: 1000,
            fontFamily: 'Outfit',
            minWidth: '240px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: '1px solid #E5E7EB'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A102D' }}>
              "{selectedText.substring(0, 25)}{selectedText.length > 25 ? '...' : ''}"
            </span>
            <button
              onClick={() => {
                setShowHighlightMenu(false)
                setSelectedText('')
                window.getSelection().removeAllRanges()
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: '#64748B'
              }}
            >
              <X size={14} />
            </button>
          </div>
          
          {/* Send to AI Tutor Button - Always visible */}
          <button
            onClick={sendToAITutor}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginBottom: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#6B11CC'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#7a12cc'
            }}
          >
            <Bot size={14} />
            Send to AI Tutor
          </button>
          
          {/* Color selection - Only show in highlight mode */}
          {isHighlightMode && (
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
                Or highlight with color:
              </div>
              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                {highlightColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => createUserHighlight(index)}
                    style={{
                      width: '28px',
                      height: '28px',
                      backgroundColor: color.color,
                      border: `2px solid ${color.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)'
                    }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div style={{ fontSize: '10px', color: '#64748B', textAlign: 'center' }}>
            {isHighlightMode ? 'Choose an action above' : 'Send to AI tutor or enable highlight mode'}
          </div>
        </div>
      )}
      
      {/* PDF iframe - takes full remaining space */}
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
            background: 'white'
          }}
          title="PDF Document"
          onLoad={handleIframeLoad}
          onError={(e) => {
            console.error('PDF iframe error:', e)
            setError('Failed to load PDF in browser viewer')
          }}
        />
        
        {/* User highlights overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          {renderUserHighlights()}
        </div>
      </div>
    </div>
  )
}
