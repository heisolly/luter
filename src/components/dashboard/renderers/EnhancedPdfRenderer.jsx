import React, { useEffect, useRef, useState, useCallback } from 'react'
import { AlertCircle, Loader2, Download, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Search, FileText } from 'lucide-react'
import { useReadingSpace } from '../ReadingSpaceContext'
import Mark from 'mark.js'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

export default function EnhancedPdfRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const { setViewportData, updateSelection, drawCommands, highlightText } = useReadingSpace()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const markInstanceRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pdfData, setPdfData] = useState(null)
  const [pdfDocument, setPdfDocument] = useState(null) // For client-side fallback
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [totalPages, setTotalPages] = useState(0)
  const [serverStatus, setServerStatus] = useState('checking')
  const [renderMode, setRenderMode] = useState('auto') // 'server', 'client', 'auto'

  const PDF_SERVER_URL = 'http://127.0.0.1:8001'

  // Check if PDF server is running
  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch(`${PDF_SERVER_URL}/health`, { 
          method: 'GET',
          timeout: 3000 
        })
        if (response.ok) {
          setServerStatus('online')
          setRenderMode('server')
        } else {
          setServerStatus('offline')
          setRenderMode('client')
        }
      } catch (error) {
        setServerStatus('offline')
        setRenderMode('client')
        console.log('PDF server not available, using client-side rendering')
      }
    }
    
    checkServer()
    // Only check once on mount, not repeatedly
  }, [])

  // Load PDF using client-side PDF.js
  const loadPdfClientSide = useCallback(async (pdfUrl) => {
    setLoading(true)
    setError(null)
    
    try {
      const loadingTask = pdfjsLib.getDocument(pdfUrl)
      const pdfDoc = await loadingTask.promise
      setPdfDocument(pdfDoc)
      setTotalPages(pdfDoc.numPages)
      setCurrentPage(1)
      
      // Set viewport data for AI
      setViewportData({
        visibleText: 'PDF loaded successfully. Text extraction in progress...',
        scrollPercent: 0,
        currentPage: 1,
        totalPages: pdfDoc.numPages,
        documentType: 'pdf'
      })
      
      return pdfDoc
      
    } catch (err) {
      console.error('Client-side PDF loading error:', err)
      setError(`Failed to load PDF: ${err.message}`)
      return null
    } finally {
      setLoading(false)
    }
  }, [setViewportData])

  // Render page using client-side PDF.js
  const renderPageClientSide = useCallback(async (pageNum) => {
    if (!pdfDocument || !canvasRef.current) return
    
    try {
      const page = await pdfDocument.getPage(pageNum)
      const viewport = page.getViewport({ scale, rotation: rotation * Math.PI / 180 })
      
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      await page.render(renderContext).promise
      
      // Extract text content for AI
      const textContent = await page.getTextContent()
      const text = textContent.items.map(item => item.str).join(' ')
      
      setViewportData({
        visibleText: text.slice(0, 2000),
        scrollPercent: (pageNum / totalPages) * 100,
        currentPage: pageNum,
        totalPages: totalPages,
        documentType: 'pdf'
      })
      
    } catch (err) {
      console.error('Error rendering page:', err)
      setError(`Failed to render page ${pageNum}: ${err.message}`)
    }
  }, [pdfDocument, scale, rotation, totalPages, setViewportData])

  // Process PDF using Python server
  const processPdfWithServer = useCallback(async (pdfUrl) => {
    if (serverStatus !== 'online') {
      return null
    }

    setLoading(true)
    setError(null)
    
    try {
      // Download PDF from URL
      const response = await fetch(pdfUrl)
      if (!response.ok) throw new Error('Failed to download PDF')
      
      const blob = await response.blob()
      const formData = new FormData()
      formData.append('file', blob, 'document.pdf')
      
      // Send to Python server for processing
      const processResponse = await fetch(`${PDF_SERVER_URL}/process-pdf`, {
        method: 'POST',
        body: formData
      })
      
      if (!processResponse.ok) throw new Error('Failed to process PDF')
      
      const result = await processResponse.json()
      
      if (result.success) {
        setPdfData(result)
        setTotalPages(result.total_pages)
        return result
      } else {
        throw new Error(result.error || 'Unknown processing error')
      }
      
    } catch (error) {
      console.error('PDF processing error:', error)
      setError(error.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [serverStatus])

  // Initialize PDF when component mounts
  useEffect(() => {
    if (activeTab === 'content' && material.source_url) {
      initializePdf()
    }
  }, [activeTab, material.source_url, renderMode])

  const initializePdf = async () => {
    if (renderMode === 'server' && serverStatus === 'online') {
      const processedData = await processPdfWithServer(material.source_url)
      if (processedData) {
        // Server processing successful
        return
      }
    }
    
    // Fallback to client-side rendering
    await loadPdfClientSide(material.source_url)
  }

  // Render page using processed data (server mode)
  const renderPageServer = useCallback((pageNum) => {
    if (!pdfData || !pdfData.pages || !canvasRef.current) return
    
    const pageData = pdfData.pages[pageNum - 1]
    if (!pageData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Set canvas dimensions based on page data
    const pageWidth = pageData.width * scale
    const pageHeight = pageData.height * scale
    
    canvas.width = pageWidth
    canvas.height = pageHeight
    
    // Clear canvas
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, pageWidth, pageHeight)
    
    // Apply rotation
    ctx.save()
    ctx.translate(pageWidth / 2, pageHeight / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-pageWidth / 2, -pageHeight / 2)
    
    // Render text blocks
    ctx.fillStyle = 'black'
    ctx.font = `${12 * scale}px Arial`
    
    pageData.text_blocks?.forEach(block => {
      const x = block.x0 * scale
      const y = block.y0 * scale
      const text = block.text
      
      ctx.fillText(text, x, y)
    })
    
    ctx.restore()
    
    // Update viewport data
    setViewportData({
      visibleText: pageData.text?.slice(0, 1000) || '',
      scrollPercent: (pageNum / totalPages) * 100,
      currentPage: pageNum,
      totalPages: totalPages,
      documentType: 'pdf'
    })
  }, [pdfData, scale, rotation, totalPages, setViewportData])

  // Main render function
  const renderPage = useCallback((pageNum) => {
    if (renderMode === 'server' && pdfData) {
      renderPageServer(pageNum)
    } else if (renderMode === 'client' && pdfDocument) {
      renderPageClientSide(pageNum)
    }
  }, [renderMode, pdfData, pdfDocument, renderPageServer, renderPageClientSide])

  // Navigation functions
  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      renderPage(pageNum)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  // Zoom functions
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))
  const resetZoom = () => setScale(1.0)

  // Rotation functions
  const rotateClockwise = () => setRotation(prev => (prev + 90) % 360)
  const resetRotation = () => setRotation(0)

  // Search functionality
  const searchInDocument = () => {
    if (!searchTerm.trim()) return
    
    if (markInstanceRef.current) {
      markInstanceRef.current.unmark()
      markInstanceRef.current.mark(searchTerm, {
        className: 'pdf-search-highlight',
        caseSensitive: false,
        accuracy: 'partially'
      })
    }
  }

  // Process AI highlight commands
  useEffect(() => {
    if (!markInstanceRef.current && containerRef.current) {
      markInstanceRef.current = new Mark(containerRef.current)
    }
    
    const highlights = drawCommands.filter(cmd => cmd.type === 'highlight')
    
    highlights.forEach(highlight => {
      if (markInstanceRef.current) {
        markInstanceRef.current.mark(highlight.text, {
          className: 'ai-highlight',
          caseSensitive: false,
          accuracy: 'exactly'
        })
      }
    })
  }, [drawCommands])

  // Clear highlights
  useEffect(() => {
    if (drawCommands.length === 0 && markInstanceRef.current) {
      markInstanceRef.current.unmark()
    }
  }, [drawCommands])

  // Render current page
  useEffect(() => {
    if (currentPage) {
      renderPage(currentPage)
    }
  }, [currentPage, renderPage])

  // Expose highlighting function globally
  useEffect(() => {
    window.highlightPdfText = (text, label, context) => {
      highlightText(text, label, context)
    }
    return () => {
      delete window.highlightPdfText
    }
  }, [highlightText])

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
          {renderMode === 'server' ? 'Using enhanced processing' : 'Using standard viewer'}
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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        fontFamily: 'Outfit'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} style={{ color: '#7a12cc' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1A102D' }}>
              PDF Viewer
            </span>
            {renderMode === 'server' ? (
              <span style={{
                fontSize: '11px',
                background: '#10B981',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                Enhanced Processing
              </span>
            ) : (
              <span style={{
                fontSize: '11px',
                background: '#6B7280',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                Standard Viewer
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              style={{
                padding: '6px 12px',
                background: currentPage <= 1 ? '#E5E7EB' : '#7a12cc',
                color: currentPage <= 1 ? '#9CA3AF' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '12px'
              }}
            >
              <ChevronLeft size={14} />
            </button>
            
            <input
              id="page-input"
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
            
            <span style={{ fontSize: '14px', color: '#64748B' }}>of {totalPages}</span>
            
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              style={{
                padding: '6px 12px',
                background: currentPage >= totalPages ? '#E5E7EB' : '#7a12cc',
                color: currentPage >= totalPages ? '#9CA3AF' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
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
              id="search-input"
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
      
      {/* PDF Canvas Container */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'flex-start',
          overflow: 'auto',
          padding: '20px',
          background: '#E5E7EB'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: '8px',
            background: 'white'
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
        fontFamily: 'Outfit'
      }}>
        <div>
          Page {currentPage} of {totalPages} • Scale: {Math.round(scale * 100)}% • Rotation: {rotation}°
        </div>
        <div>
          {material.title} • {renderMode === 'server' ? 'Enhanced Processing' : 'Standard Rendering'}
        </div>
      </div>
    </div>
  )
}
