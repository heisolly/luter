/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { searchPlugin } from '@react-pdf-viewer/search'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { zoomPlugin } from '@react-pdf-viewer/zoom'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/search/lib/styles/index.css'
import {
  FileText,
  DownloadSimple as Download,
  MagnifyingGlassPlus as ZoomIn,
  MagnifyingGlassMinus as ZoomOut,
  CornersOut as Fullscreen,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  CornersIn as Compress,
  ChatCircleText as MessageIcon,
  Eye as EyeIcon,
} from '@phosphor-icons/react'
import { useBroadcastEvent, useEventListener, useUpdateMyPresence } from '../../../liveblocks.config'
import { useDocumentComments } from '../../../hooks/useCommentThreads'
import LiveCursors from '../../LiveCursors'
import AnnotationLayer from '../AnnotationLayer'

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
  onPageChange,
  onDocumentLoad,
  annotateMode = false,
  commentMode = false,
  focusModeTool = false,
  annotationColor = '#7C3AED',
  annotationStrokeSize = 4,
  isEraserMode = false,
  annotationToolType = 'draw',
  pendingEquation = '',
  onEquationPlaced,
  onCommentThreadSelect,
  canvasRefs,
  onCanvasSave,
  material,
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
  const annotationStoreRef = useRef(new Map())
  const coverStoreRef = useRef(new Map())
  const drawingRef = useRef({ active: false, canvas: null, ctx: null, points: [], page: 1, mode: 'draw', startPoint: null, baseImage: null })
  const focusDragRef = useRef({ active: false, layer: null, page: 1, startX: 0, startY: 0, rectEl: null })
  const [commentPopover, setCommentPopover] = useState(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [threadVersion, setThreadVersion] = useState(0)
  const updateMyPresence = useUpdateMyPresence()
  const broadcast = useBroadcastEvent()
  const { pageThreads, addComment } = useDocumentComments(currentPage)

  // Retrieve current user ID from Supabase
  const [userId, setUserId] = useState(null)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUserId(user.id)
      } catch (e) {
        console.warn('Failed fetching user in FlashkaDocumentViewer:', e)
      }
    }
    fetchUser()
  }, [])

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

  useEffect(() => {
    const handleSnapshotLoad = (event) => {
      const { pageNum, dataUrl } = event.detail
      annotationStoreRef.current.set(pageNum, dataUrl)
      
      if (canvasRefs && canvasRefs.current) {
        const canvas = canvasRefs.current[pageNum]
        if (canvas) {
          const img = new Image()
          img.onload = () => {
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          }
          img.src = dataUrl
        }
      }
    }
    window.addEventListener('luter-load-annotation-snapshot', handleSnapshotLoad)
    return () => window.removeEventListener('luter-load-annotation-snapshot', handleSnapshotLoad)
  }, [canvasRefs])

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

  // Handle hide/reveal focus cover dragging
  useEffect(() => {
    const root = viewerContainerRef.current
    if (!root || !docLoaded) return

    const installFocusMode = () => {
      const layers = Array.from(root.querySelectorAll('.rpv-core__page-layer'))
      layers.forEach((layer, index) => {
        const pageNumber = index + 1
        layer.style.position = 'relative'

        if (!layer.dataset.luterFocusReady) {
          layer.dataset.luterFocusReady = 'true'
          layer.addEventListener('mousedown', (event) => {
            if (!focusModeTool || event.target.closest('.ws-comment-marker, .ws-focus-cover')) return
            const page = Number(layer.closest('[data-page-number]')?.dataset.pageNumber || pageNumber)
            const rect = layer.getBoundingClientRect()
            const startX = event.clientX - rect.left
            const startY = event.clientY - rect.top
            const rectEl = document.createElement('div')
            rectEl.className = 'ws-focus-cover'
            layer.appendChild(rectEl)
            focusDragRef.current = { active: true, layer, page, startX, startY, rectEl }
          })
          layer.addEventListener('mousemove', (event) => {
            const drag = focusDragRef.current
            if (!drag.active || drag.layer !== layer) return
            const rect = layer.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            Object.assign(drag.rectEl.style, {
              left: `${Math.min(drag.startX, x)}px`,
              top: `${Math.min(drag.startY, y)}px`,
              width: `${Math.abs(x - drag.startX)}px`,
              height: `${Math.abs(y - drag.startY)}px`,
            })
          })
          layer.addEventListener('mouseup', () => {
            const drag = focusDragRef.current
            if (!drag.active || drag.layer !== layer) return
            const box = drag.rectEl.getBoundingClientRect()
            const layerBox = layer.getBoundingClientRect()
            if (box.width < 6 || box.height < 6) {
              drag.rectEl.remove()
            } else {
              const area = {
                id: `${Date.now()}-${drag.page}`,
                x: box.left - layerBox.left,
                y: box.top - layerBox.top,
                width: box.width,
                height: box.height,
                revealed: false,
              }
              const list = coverStoreRef.current.get(drag.page) || []
              coverStoreRef.current.set(drag.page, [...list, area])
              broadcast({ type: 'COVER_ADDED', page: drag.page, area })
              setThreadVersion((value) => value + 1)
              drag.rectEl.remove() // Remove temp DOM box, React renders it cleanly!
            }
            focusDragRef.current = { active: false, layer: null, page: 1, startX: 0, startY: 0, rectEl: null }
          })
        }
      })
    }

    installFocusMode()
    const timer = window.setTimeout(installFocusMode, 300)
    window.addEventListener('resize', installFocusMode)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', installFocusMode)
    }
  }, [docLoaded, focusModeTool, broadcast])

  // Sync state for focus covers from Liveblocks
  useEventListener(({ event }) => {
    if (event.type === 'COVER_ADDED') {
      const list = coverStoreRef.current.get(event.page) || []
      coverStoreRef.current.set(event.page, [...list, event.area])
      setThreadVersion((value) => value + 1)
    }
    if (event.type === 'COVER_REVEALED') {
      const list = coverStoreRef.current.get(event.page) || []
      coverStoreRef.current.set(event.page, list.map((area) => area.id === event.areaId ? { ...area, revealed: true } : area))
      setThreadVersion((value) => value + 1)
    }
  })

  const renderPage = (props) => {
    const pageNum = props.pageIndex + 1;
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {props.canvasLayer.children}
        {props.textLayer.children}
        {props.annotationLayer.children}

        {/* Canvas annotation overlay */}
        <AnnotationLayer
          pageNum={pageNum}
          isActive={annotateMode}
          sessionId={material?.id || ''}
          fileId={material?.id || ''}
          userId={userId}
          readOnly={false}
          color={annotationColor}
          strokeWidth={annotationStrokeSize}
          isEraser={isEraserMode}
          onAPIReady={(api) => {
            if (canvasRefs && canvasRefs.current) {
              canvasRefs.current[pageNum] = api
            }
          }}
        />

        {/* Comment Thread Markers */}
        {pageThreads.map((thread) => {
          if (pageNum !== currentPage) return null;
          return (
            <button
              key={thread.id}
              type="button"
              className="ws-comment-marker"
              title={thread.metadata?.selectedText || 'Open comment'}
              style={{
                position: 'absolute',
                left: `${thread.metadata?.positionX || 0}px`,
                top: `${thread.metadata?.positionY || 0}px`,
                zIndex: 15,
              }}
              onClick={() => onCommentThreadSelect?.(thread)}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/>
              </svg>
            </button>
          );
        })}

        {/* Focus Mode Covers */}
        {(coverStoreRef.current.get(pageNum) || []).map((area) => {
          if (area.revealed) return null;
          return (
            <div
              key={area.id}
              className="ws-focus-cover"
              style={{
                position: 'absolute',
                left: `${area.x}px`,
                top: `${area.y}px`,
                width: `${area.width}px`,
                height: `${area.height}px`,
                zIndex: 12,
                transition: 'opacity 0.2s',
              }}
            >
              <button
                type="button"
                title="Click to reveal"
                onClick={(e) => {
                  e.stopPropagation();
                  area.revealed = true;
                  broadcast({ type: 'COVER_REVEALED', page: pageNum, areaId: area.id });
                  setThreadVersion((v) => v + 1); // trigger re-render
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 5c5.5 0 9.5 5 10 7-.5 2-4.5 7-10 7S2.5 14 2 12c.5-2 4.5-7 10-7Zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/>
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    );
  };


  useEffect(() => {
    if (!commentMode) {
      setCommentPopover(null)
      return undefined
    }

    const handleMouseUp = () => {
      const selection = window.getSelection()
      const selectedText = selection?.toString().trim()
      if (!selectedText) return
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const root = viewerContainerRef.current
      const pageLayer = range.commonAncestorContainer?.parentElement?.closest?.('.rpv-core__page-layer') || document.elementFromPoint(rect.left, rect.top)?.closest?.('.rpv-core__page-layer')
      const pageRect = pageLayer?.getBoundingClientRect() || root?.getBoundingClientRect()
      setCommentDraft('')
      setCommentPopover({
        selectedText,
        pageNum: Number(pageLayer?.closest('[data-page-number]')?.dataset.pageNumber || currentPage),
        top: rect.bottom + 8,
        left: rect.left,
        position: {
          x: Math.max(0, rect.left - (pageRect?.left || 0)),
          y: Math.max(0, rect.top - (pageRect?.top || 0)),
        },
      })
      updateMyPresence({ selectedText, currentTool: 'comment' })
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [commentMode, currentPage, updateMyPresence])

  // Timeout for loading - increased for better resilience
  useEffect(() => {
    setLoadingTimeout(false); // Reset timeout state on change
    const timer = setTimeout(() => {
      if (!docLoaded) setLoadingTimeout(true)
    }, 30000) // 30 seconds
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
          background: transparent !important;
        }
        .flashka-desk .rpv-core__viewer {
          background: transparent !important;
          border: none !important;
          overflow-x: auto !important;
          overflow-y: auto !important;
          padding: 0px 0px 100px 0px !important;
          scroll-behavior: smooth !important;
          height: 100% !important;
          width: 100% !important;
          max-width: 100% !important;
          -webkit-overflow-scrolling: touch !important;
        }
        .flashka-desk .rpv-core__inner-page {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
          will-change: transform !important;
          display: flex !important;
          justify-content: center !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .flashka-desk .rpv-core__page-layer {
          width: 100% !important;
          min-width: 100% !important;
          max-width: 100% !important;
          margin: 0 auto 4px auto !important;
          display: block !important;
          box-shadow: none !important;
          border-radius: 0 !important;
          background: white !important;
          overflow: hidden !important;
          transition: none !important;
          transform: translateZ(0) !important;
          will-change: transform !important;
        }
        .flashka-desk .rpv-core__page-layer:hover {
          box-shadow: none !important;
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
          padding: 0 !important;
          margin: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          width: 100% !important;
        }
        .flashka-desk img,
        .flashka-desk canvas {
          max-width: 100% !important;
          height: auto !important;
          display: block !important;
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
      style={{ background: 'transparent' }}
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
        className="flashka-viewer-scroll flex-1 overflow-auto"
        style={{
          opacity: fadeIn ? 1 : 0,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          scrollBehavior: 'smooth',
        }}
      >
        <div className="flashka-viewer-pages">
          <Viewer
            fileUrl={fileUrl}
            plugins={[searchPluginInstance, pageNavigationPluginInstance, zoomPluginInstance]}
            defaultScale={scale}
            initialPage={initialPage > 0 ? initialPage - 1 : 0}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            renderPage={renderPage}
          />
          <LiveCursors />
        </div>
      </div>

      {commentPopover && (
        <div className="ws-comment-popover" style={{ top: commentPopover.top, left: commentPopover.left }}>
          <div className="ws-comment-quote">
            {commentPopover.selectedText.length > 60 ? `${commentPopover.selectedText.slice(0, 60)}...` : commentPopover.selectedText}
          </div>
          <textarea
            placeholder="Add a comment..."
            value={commentDraft}
            onChange={(event) => setCommentDraft(event.target.value)}
            autoFocus
          />
          <div className="ws-comment-actions">
            <button type="button" className="ws-comment-cancel" onClick={() => setCommentPopover(null)}>Cancel</button>
            <button
              type="button"
              className="ws-comment-post"
              disabled={!commentDraft.trim()}
              onClick={() => {
                const thread = addComment({
                  selectedText: commentPopover.selectedText,
                  comment: commentDraft,
                  position: commentPopover.position,
                  pageNum: commentPopover.pageNum,
                })
                onCommentThreadSelect?.(thread)
                setCommentPopover(null)
                setCommentDraft('')
                window.getSelection()?.removeAllRanges()
                setThreadVersion((value) => value + 1)
              }}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {/* Floating Toolbar — auto-hides */}
      <div
        className="flashka-viewer-toolbar"
        data-visible={showToolbar}
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          opacity: showToolbar ? 1 : 0,
          transition: 'opacity 0.2s ease',
          pointerEvents: showToolbar ? 'auto' : 'none',
        }}
      >
        <div className="flashka-viewer-toolbar-inner" style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #E5E7EB',
          borderRadius: '9999px',
          padding: '5px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
          whiteSpace: 'nowrap'
        }}>
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

          <div className="flashka-viewer-title">{title}</div>

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

          <div className="flashka-viewer-separator" />

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

    </div>
  )
}
