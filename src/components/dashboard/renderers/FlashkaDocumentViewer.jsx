/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { searchPlugin } from '@react-pdf-viewer/search'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { zoomPlugin } from '@react-pdf-viewer/zoom'
import { highlightPlugin, Trigger } from '@react-pdf-viewer/highlight'
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/search/lib/styles/index.css'
import '@react-pdf-viewer/highlight/lib/styles/index.css'
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
import AnnotationCanvas from '../AnnotationCanvas'
import { supabase } from '../../../supabaseClient'

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
  highlightMode = false,
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
  scrollContainerRef,
  highlights,
  highlightColors = [],
  createPdfViewerHighlight,
  preparePdfViewerHighlight,
  initCanvas,
  startDrawing,
  draw,
  stopDrawing,
  drawMode,
  loadHighlights,
  setHighlightToolbox,
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

  // ─── Live cursor tracking ─────────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    const container = scrollContainerRef?.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    updateMyPresence({
      cursor: {
        x: e.clientX - rect.left + container.scrollLeft,
        y: e.clientY - rect.top + container.scrollTop,
      },
    })
  }, [updateMyPresence, scrollContainerRef])

  const handlePointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null })
  }, [updateMyPresence])

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

  // Load highlights when user or file changes
  useEffect(() => {
    if (userId && fileUrl) {
      loadHighlights?.();
    }
  }, [userId, fileUrl, loadHighlights])

  const searchPluginInstance = searchPlugin()
  const pageNavigationPluginInstance = pageNavigationPlugin()
  const zoomPluginInstance = zoomPlugin()
  const safeHighlightColors = Array.isArray(highlightColors) ? highlightColors : []
  const viewerHighlightColors = safeHighlightColors.length
    ? safeHighlightColors
    : [
        { id: 'yellow', bg: '#FEF08A', border: '#FDE047', label: 'Yellow' },
        { id: 'green', bg: '#BBF7D0', border: '#4ADE80', label: 'Green' },
        { id: 'purple', bg: '#DDD6FE', border: '#A78BFA', label: 'Purple' },
      ]

  const getHighlightAreas = useCallback((highlight) => {
    if (Array.isArray(highlight.areas) && highlight.areas.length > 0) {
      return highlight.areas
    }

    return (highlight.rects || []).map((rect) => ({
      pageIndex: Math.max(0, (highlight.pageNum || 1) - 1),
      left: rect.left * 100,
      top: rect.top * 100,
      width: rect.width * 100,
      height: rect.height * 100,
    }))
  }, [])

  const renderHighlightTarget = useCallback((props) => {
    const selection = {
      highlightAreas: props.highlightAreas,
      selectedText: props.selectedText,
      selectionData: props.selectionData,
    }

    return (
      <div
        className="luter-pdf-highlight-target"
        style={{
          position: 'absolute',
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top}%`,
          transform: 'translateY(calc(-100% - 8px))',
          zIndex: 50,
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="luter-pdf-highlight-target__colors">
          {viewerHighlightColors.slice(0, 5).map((color) => (
            <button
              key={color.id}
              type="button"
              title={color.label || color.id}
              style={{ '--highlight-color': color.bg, '--highlight-border': color.border || color.bg }}
              onClick={() => {
                createPdfViewerHighlight?.(color, selection)
                props.cancel()
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="luter-pdf-highlight-target__ask"
          title="Ask Luter"
          onClick={() => {
            const containerRect = scrollContainerRef?.current?.getBoundingClientRect()
            preparePdfViewerHighlight?.(selection, containerRect ? {
              x: ((props.selectionRegion.left + props.selectionRegion.width / 2) / 100) * containerRect.width,
              y: (props.selectionRegion.top / 100) * containerRect.height,
            } : null)
            props.cancel()
          }}
        >
          <MessageIcon size={14} weight="fill" />
        </button>
      </div>
    )
  }, [createPdfViewerHighlight, preparePdfViewerHighlight, scrollContainerRef, viewerHighlightColors])

  const renderHighlights = useCallback((props) => (
    <div>
      {(highlights || []).map((highlight) => (
        <React.Fragment key={highlight.id}>
          {getHighlightAreas(highlight)
            .filter((area) => area.pageIndex === props.pageIndex)
            .map((area, index) => (
              <button
                key={`${highlight.id}-${index}`}
                type="button"
                className="luter-pdf-highlight-area"
                title={highlight.text || 'Highlight'}
                style={{
                  ...props.getCssProperties(area, props.rotation),
                  '--highlight-color': highlight.color || '#FEF08A',
                }}
                onClick={(event) => {
                  event.stopPropagation()
                  const containerRect = scrollContainerRef?.current?.getBoundingClientRect()
                  setHighlightToolbox?.({
                    x: containerRect ? event.clientX - containerRect.left : event.clientX,
                    y: containerRect ? event.clientY - containerRect.top : event.clientY,
                    text: highlight.text,
                    existingId: highlight.id,
                  })
                }}
              />
            ))}
        </React.Fragment>
      ))}
    </div>
  ), [getHighlightAreas, highlights, scrollContainerRef, setHighlightToolbox])

  const highlightPluginInstance = highlightPlugin({
    trigger: Trigger.TextSelection,
    renderHighlightTarget,
    renderHighlights,
  })
  const { zoomTo } = zoomPluginInstance

  useEffect(() => {
    highlightPluginInstance.switchTrigger(highlightMode ? Trigger.TextSelection : Trigger.None)
  }, [highlightMode, highlightPluginInstance])

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
      <div style={{ position: 'relative', minWidth: 0 }} className="flashka-page-render notranslate" translate="no">
        <div style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          marginBottom: '20px',
          marginLeft: 'auto',
          marginRight: 'auto',
          maxWidth: '100%',
          display: 'block',
          overflow: 'visible',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          {props.canvasLayer.children}
          {props.textLayer.children}
          {props.annotationLayer.children}

          {/* Canvas drawing overlay */}
          <AnnotationCanvas
            pageNum={pageNum}
            isActive={annotateMode}
            initCanvas={initCanvas}
            startDrawing={startDrawing}
            draw={draw}
            stopDrawing={stopDrawing}
            drawMode={drawMode}
          />

        </div>

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
          overflow-x: hidden !important;
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
          width: auto !important;
          min-width: 0 !important;
          max-width: 100% !important;
        }
        .flashka-desk .rpv-core__page-layer {
          background: white !important;
          border-radius: 10px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07) !important;
          margin-bottom: 20px !important;
          margin-left: auto !important;
          margin-right: auto !important;
          max-width: 100% !important;
          display: block !important;
          overflow: visible !important;
          box-sizing: border-box !important;
          transition: none !important;
          transform: translateZ(0) !important;
          will-change: transform !important;
        }
        .flashka-desk .rpv-core__page-layer:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.07) !important;
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
          display: block !important;
        }

        /* Force selectable PDF text layer inside highlight mode */
        .ws-highlight-active .rpv-core__text-layer,
        .ws-highlight-active .rpv-core__text-layer *,
        .ws-highlight-active .rpv-core__text-line,
        .ws-highlight-active .rpv-core__text-line * {
          pointer-events: auto !important;
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .luter-pdf-highlight-target {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px;
          border-radius: 9999px;
          border: 1px solid rgba(229, 231, 235, 0.92);
          background: rgba(255, 255, 255, 0.96);
          box-shadow: 0 12px 34px rgba(17, 24, 39, 0.16);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          pointer-events: auto;
        }
        body.dark-mode .luter-pdf-highlight-target {
          border-color: rgba(255, 255, 255, 0.12);
          background: rgba(17, 24, 39, 0.96);
        }
        .luter-pdf-highlight-target__colors {
          display: inline-flex;
          gap: 3px;
        }
        .luter-pdf-highlight-target__colors button {
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          border: 2px solid var(--highlight-border);
          background: var(--highlight-color);
          cursor: pointer;
          transition: transform 140ms ease, box-shadow 140ms ease;
        }
        .luter-pdf-highlight-target__colors button:hover {
          transform: translateY(-1px) scale(1.04);
          box-shadow: 0 4px 10px rgba(17, 24, 39, 0.12);
        }
        .luter-pdf-highlight-target__ask {
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 9999px;
          background: rgba(196, 181, 253, 0.28);
          color: #7a12cc;
          cursor: pointer;
        }
        body.dark-mode .luter-pdf-highlight-target__ask {
          color: #C4B5FD;
          background: rgba(196, 181, 253, 0.18);
        }
        .luter-pdf-highlight-area {
          position: absolute;
          border: 0;
          padding: 0;
          background: var(--highlight-color);
          opacity: 0.44;
          mix-blend-mode: multiply;
          cursor: pointer;
          border-radius: 2px;
          transition: opacity 140ms ease;
        }
        .luter-pdf-highlight-area:hover {
          opacity: 0.62;
        }
        body.dark-mode .luter-pdf-highlight-area {
          mix-blend-mode: screen;
          opacity: 0.34;
        }
        .ws-annotate-active .rpv-highlight__selected-text,
        .ws-annotate-active .luter-pdf-highlight-target {
          display: none !important;
        }
        .ws-annotate-active .rpv-core__text-layer,
        .ws-annotate-active .rpv-core__text-layer * {
          pointer-events: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
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
    setScale((prev) => {
      const next = Math.min((typeof prev === 'number' ? prev : 1) + 0.1, 3.0)
      zoomTo(next)
      return next
    })
  }, [zoomTo])

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max((typeof prev === 'number' ? prev : 1) - 0.1, 0.5)
      zoomTo(next)
      return next
    })
  }, [zoomTo])

  const fitToWidth = useCallback(() => {
    setScale(SpecialZoomLevel.PageWidth)
    zoomTo(SpecialZoomLevel.PageWidth)
  }, [zoomTo])

  useEffect(() => {
    if (!docLoaded) return undefined

    let frameId = window.requestAnimationFrame(() => {
      zoomTo(SpecialZoomLevel.PageWidth)
    })

    const target = viewerContainerRef.current || scrollContainerRef?.current
    if (!target || typeof ResizeObserver === 'undefined') {
      return () => window.cancelAnimationFrame(frameId)
    }

    const resizeObserver = new ResizeObserver(() => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        zoomTo(SpecialZoomLevel.PageWidth)
      })
    })
    resizeObserver.observe(target)

    return () => {
      window.cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
    }
  }, [docLoaded, scrollContainerRef, zoomTo])

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

  const deskClassName = `flashka-desk h-full flex flex-col relative ${
    highlightMode ? 'ws-highlight-active' : ''
  } ${
    annotateMode ? 'ws-annotate-active' : ''
  }`.trim()

  return (
    <div
      ref={viewerContainerRef}
      className={deskClassName}
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
        className="flashka-viewer-scroll notranslate"
        ref={scrollContainerRef}
        translate="no"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          opacity: fadeIn ? 1 : 0,
          transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          scrollBehavior: 'smooth',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          background: '#F0F0F0',
          padding: '24px 32px 100px 32px',
          position: 'relative',
        }}
      >
        <div className="flashka-viewer-pages notranslate" translate="no" style={{ position: 'relative' }}>
                  <Worker workerUrl={PDF_WORKER_URL}>
          <Viewer
            key={fileUrl}
            fileUrl={fileUrl}
            plugins={[searchPluginInstance, pageNavigationPluginInstance, zoomPluginInstance, highlightPluginInstance]}
            defaultScale={scale}
            initialPage={initialPage > 0 ? initialPage - 1 : 0}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            renderPage={renderPage}
          />
        </Worker>
        </div>
        {/* Live cursors positioned relative to the scroll container */}
        <LiveCursors />
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
