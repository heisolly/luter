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
  RiEyeOffLine as EyeOff,
  RiEyeLine as Eye,
} from 'react-icons/ri'

const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js'

/**
 * FlashkaDocumentViewer — Immersive, full-width document experience.
 * Built around the document, not the other way around.
 *
 * Design principles:
 * - Document is the main character
 * - Fluid canvas, not boxed pages
 * - Auto-fit scaling
 * - Minimal, floating controls
 * - Notion-style background
 */
export default function FlashkaDocumentViewer({
  fileUrl,
  title,
  type,
  onPageChange,
  onDocumentLoad,
}) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(SpecialZoomLevel.PageWidth)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [docLoaded, setDocLoaded] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const viewerContainerRef = useRef(null)
  const containerRef = useRef(null)
  
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

  
  // Timeout for loading - if PDF takes too long, show error
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!docLoaded) {
        setLoadingTimeout(true)
      }
    }, 15000) // 15 second timeout
    return () => clearTimeout(timer)
  }, [docLoaded, fileUrl])

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
          background: linear-gradient(to bottom, #F8FAFC, #F1F5F9) !important;
        }
        /* Let the viewer handle scrolling internally */
        .flashka-desk .rpv-core__viewer {
          background: transparent !important;
          border: none !important;
          overflow-y: auto !important;
          scroll-behavior: smooth !important;
          height: 100% !important;
        }
        /* ZERO padding around pages - full bleed */
        .flashka-desk .rpv-core__inner-page {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        /* Page styling - FULL WIDTH */
        .flashka-desk .rpv-core__page-layer {
          box-shadow: 0 1px 8px rgba(0,0,0,0.04) !important;
          border-radius: 4px !important;
          overflow: hidden !important;
          background: white !important;
          margin: 0 auto 8px auto !important;
          max-width: 100% !important;
          width: 100% !important;
        }
        /* Make canvas fill the page width */
        .flashka-desk .rpv-core__canvas-layer {
          max-width: 100% !important;
          width: 100% !important;
        }
        /* Text layer should also fill */
        .flashka-desk .rpv-core__text-layer {
          max-width: 100% !important;
        }
        .flashka-desk .rpv-core__page-layer:hover {
          box-shadow: 0 2px 16px rgba(0,0,0,0.06) !important;
        }
        /* Remove default toolbar and sidebar */
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
        /* ZERO padding on inner page container */
        .flashka-desk .rpv-core__inner-pages {
          padding: 0 !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
        }
        /* Make each page take full width */
        .flashka-desk .rpv-core__inner-page {
          width: 100% !important;
          max-width: 100% !important;
          display: flex !important;
          justify-content: center !important;
        }
        /* Ensure the viewer container fills width */
        .flashka-desk .rpv-core__viewer {
          width: 100% !important;
          max-width: 100% !important;
        }
        /* Smooth scrolling on all elements */
        .flashka-desk * {
          scroll-behavior: smooth !important;
        }
      `
      document.head.appendChild(style)
    }
    return () => {
      const existing = document.getElementById(styleId)
      if (existing) existing.remove()
    }
  }, [])

  const handleDocumentLoad = useCallback((e) => {
    setTotalPages(e.doc.numPages)
    setDocLoaded(true)
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
    <div className="flashka-desk bg-gradient-to-b from-gray-50 to-gray-100 h-full flex flex-col">
      {/* Floating Toolbar - minimal padding */}
      <div className="shrink-0 flex justify-center py-2">
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
              {Math.round(scale * 100)}%
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

      {/* Document Canvas - Restore scrolling */}
      <div 
        ref={viewerContainerRef}
        className="flex-1 overflow-hidden"
      >
        <Worker workerUrl={PDF_WORKER_URL}>
          <Viewer
            fileUrl={fileUrl}
            plugins={[searchPluginInstance, pageNavigationPluginInstance, zoomPluginInstance]}
            defaultScale={scale}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
          />
        </Worker>
      </div>
    </div>
  )
}
