import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { searchPlugin } from '@react-pdf-viewer/search'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { zoomPlugin } from '@react-pdf-viewer/zoom'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/search/lib/styles/index.css'
import {
  RiFileTextFill as FileText,
  RiDownloadLine as Download,
  RiZoomInLine as ZoomIn,
  RiZoomOutLine as ZoomOut,
  RiFullscreenFill as Fullscreen,
  RiArrowLeftSLine as ChevronLeft,
  RiArrowRightSLine as ChevronRight,
  RiFullscreenExitFill as Compress,
} from 'react-icons/ri'

const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js'

/** Loading skeleton with faint page outlines */
function DocumentSkeleton() {
  return (
    <div style={{ height: '100%', background: 'linear-gradient(to bottom, #F8FAFC, #F1F5F9)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '1100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((page) => (
          <div
            key={page}
            style={{
              background: 'white',
              borderRadius: 8,
              boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
              height: page === 1 ? '70vh' : '75vh',
              animation: `flashka-skeleton-pulse 2s ease-in-out ${page * 0.3}s infinite`,
              opacity: 0.6,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes flashka-skeleton-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.75; }
        }
      `}</style>
    </div>
  )
}

/**
 * FlashkaDocumentViewer — Immersive, full-width document experience.
 * Built around the document, not the other way around.
 */
export default function FlashkaDocumentViewer({
  fileUrl,
  initialPage = 1,
  title,
  type,
  onPageChange,
  onDocumentLoad,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(SpecialZoomLevel.PageWidth)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [docLoaded, setDocLoaded] = useState(false)
  const [showToolbar, setShowToolbar] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  const viewerContainerRef = useRef(null)
  const toolbarTimerRef = useRef(null)

  const searchPluginInstance = searchPlugin()
  const pageNavigationPluginInstance = pageNavigationPlugin()
  const zoomPluginInstance = zoomPlugin()

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Auto-hide toolbar after 3s of inactivity
  const scheduleToolbarHide = useCallback(() => {
    if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current)
    setShowToolbar(true)
    toolbarTimerRef.current = setTimeout(() => {
      setShowToolbar(false)
    }, 3000)
  }, [])

  useEffect(() => {
    scheduleToolbarHide()
    return () => { if (toolbarTimerRef.current) clearTimeout(toolbarTimerRef.current) }
  }, [scheduleToolbarHide])

  // Timeout for loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!docLoaded) setLoadingTimeout(true)
    }, 15000)
    return () => clearTimeout(timer)
  }, [docLoaded, fileUrl])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          goToPage(-1)
          break
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          goToPage(1)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case '+':
        case '=':
          e.preventDefault()
          zoomIn()
          break
        case '-':
        case '_':
          e.preventDefault()
          zoomOut()
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!fileUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-500 font-medium">No document selected</p>
        </div>
      </div>
    )
  }

  // Inject custom Flashka CSS
  useEffect(() => {
    const styleId = 'flashka-pdf-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .flashka-desk {
          background: #F8FAFC !important;
        }
        .flashka-desk .rpv-core__viewer {
          background: transparent !important;
          border: none !important;
          overflow-y: auto !important;
          scroll-behavior: smooth !important;
          height: 100% !important;
        }
        .flashka-desk .rpv-core__inner-page {
          background: transparent !important;
          padding: 16px 24px 32px !important;
          margin: 0 !important;
          will-change: transform !important;
        }
        .flashka-desk .rpv-core__page-layer {
          box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important;
          border-radius: 12px !important;
          background: white !important;
          transition: box-shadow 0.3s ease !important;
          transform: translateZ(0) !important;
          will-change: transform !important;
        }
        .flashka-desk .rpv-core__page-layer:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
        }
        .flashka-desk .rpv-default-layout__toolbar,
        .flashka-desk .rpv-default-layout__sidebar {
          display: none !important;
        }
        .flashka-desk .rpv-default-layout__container,
        .flashka-desk .rpv-default-layout__main,
        .flashka-desk .rpv-default-layout__body {
          border: none !important;
          background: transparent !important;
        }
        .flashka-desk .rpv-core__inner-pages {
          padding: 24px 0 80px 0 !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
        }
        .flashka-desk .rpv-core__inner-page {
          width: 100% !important;
          max-width: 100% !important;
          display: flex !important;
          justify-content: center !important;
        }
        .flashka-desk .rpv-core__viewer {
          width: 100% !important;
          max-width: 100% !important;
          -webkit-overflow-scrolling: touch !important;
        }
      `
      document.head.appendChild(style)
    }
    return () => {
      const existing = document.getElementById(styleId)
      if (existing) existing.remove()
    }
  }, [])

  // Sync initialPage when it changes or on load
  useEffect(() => {
    if (initialPage > 1 && docLoaded) {
      setTimeout(() => {
        const target = document.querySelector(`[data-page-number="${initialPage}"]`)
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' })
          setCurrentPage(initialPage)
        }
      }, 100)
    }
  }, [initialPage, docLoaded])

  const handleDocumentLoad = useCallback((e) => {
    setTotalPages(e.doc.numPages)
    setDocLoaded(true)
    // Trigger fade-in after a brief delay for smoothness
    requestAnimationFrame(() => setFadeIn(true))
    onDocumentLoad?.(e)
  }, [onDocumentLoad])

  const handlePageChange = useCallback((e) => {
    setCurrentPage(e.currentPage + 1)
    onPageChange?.(e)
  }, [onPageChange])

  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.1, 3.0))
  }, [])

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev - 0.1, 0.5))
  }, [])

  const fitToWidth = useCallback(() => {
    setScale(SpecialZoomLevel.PageWidth)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = viewerContainerRef.current
    if (!isFullscreen && container?.requestFullscreen) {
      container.requestFullscreen()
    } else if (isFullscreen && document.exitFullscreen) {
      document.exitFullscreen()
    }
  }, [isFullscreen])

  const goToPage = useCallback((delta) => {
    const newPage = currentPage + delta
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      const target = document.querySelector(`[data-page-number="${newPage}"]`)
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentPage, totalPages])

  // Show error if loading timed out
  if (loadingTimeout && !docLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-gray-50 to-gray-100 p-8">
        <div className="text-center max-w-md">
          <FileText size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Taking longer than expected</h3>
          <p className="text-gray-600 mb-6">The PDF viewer is having trouble loading this document.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              Open in New Tab
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={viewerContainerRef}
      className="flashka-desk h-full flex flex-col relative"
      style={{ background: '#F8FAFC' }}
      onMouseMove={scheduleToolbarHide}
    >
      {/* Loading Skeleton */}
      {!docLoaded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          <DocumentSkeleton />
        </div>
      )}

      {/* PDF Viewer with fade-in */}
      <div
        className="flex-1 overflow-auto"
        style={{
          opacity: fadeIn ? 1 : 0,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          scrollBehavior: 'smooth',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto', height: '100%', padding: '0 24px' }}>
          <Viewer
            fileUrl={fileUrl}
            plugins={[searchPluginInstance, pageNavigationPluginInstance, zoomPluginInstance]}
            defaultScale={scale}
            initialPage={initialPage > 0 ? initialPage - 1 : 0}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Floating Toolbar — auto-hides */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
        style={{
          opacity: showToolbar ? 1 : 0,
          transform: showToolbar ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-12px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          pointerEvents: showToolbar ? 'auto' : 'none',
        }}
      >
        <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg">
          {/* Navigation */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => goToPage(-1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-gray-700 min-w-[50px] text-center tabular-nums">
              {currentPage} / {totalPages || '-'}
            </span>
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="w-px h-4 bg-gray-200" />

          {/* Zoom Controls */}
          <div className="flex items-center gap-0.5">
            <button onClick={zoomOut} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-medium text-gray-700 min-w-[42px] text-center tabular-nums">
              {typeof scale === 'number' ? Math.round(scale * 100) : '100'}%
            </span>
            <button onClick={zoomIn} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
              <ZoomIn size={16} />
            </button>
          </div>

          <div className="w-px h-4 bg-gray-200" />

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={fitToWidth}
              className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Fit
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              {isFullscreen ? <Compress size={16} /> : <Fullscreen size={16} />}
            </button>
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Page Badge — always visible at bottom center */}
      {docLoaded && totalPages > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <div
            className="bg-gray-900/80 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg"
            style={{ fontFamily: 'var(--font-outfit)', letterSpacing: '0.02em' }}
          >
            {currentPage} / {totalPages}
          </div>
        </div>
      )}
    </div>
  )
}
