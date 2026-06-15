/* eslint-disable no-unused-vars, react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
/**
 * DocumentViewer — High-Fidelity Universal Reading Environment for Luter.
 * Now supports: PDF, Word, PPT, Excel, Images, Video, Audio, YouTube, Web, and Anki.
 */

import React, { useEffect, useState, useRef } from 'react'
import { useReadingSpace } from '../ReadingSpaceContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Sparkle as SparkleLight,
  Lightbulb as LightbulbLight,
  Stack as StackLight,
  BookmarkSimple,
  Columns as ColumnsLight,
  MagnifyingGlass as MagnifyingGlassLight,
  Moon as MoonLight,
  SpeakerHigh as SpeakerHighLight,
  CaretDown as CaretDownLight,
  Eye as EyeLight,
  GraduationCap as GraduationCapLight,
  DownloadSimple,
  ArrowsOutSimple,
  CircleNotch
} from '@phosphor-icons/react'
import { supabase } from '../../../supabaseClient'
import { 
  RiErrorWarningFill as Warning, RiFileTextFill as FileText, RiEyeFill as Eye, RiMagicFill as Sparkle, RiImageFill as ImageIcon, RiMusicFill as Music, RiPlayFill as Play, RiGlobalFill as Globe, RiStackFill as Stack, RiDownloadLine as Download, RiFullscreenFill as CornersOut, 
  RiSearchLine as MagnifyingGlass, RiMoonFill as Moon, RiSunFill as Sun, RiVolumeUpFill as SpeakerHigh, RiLayoutColumnFill as Columns, RiRefreshLine as ArrowClockwise, RiArrowDownSLine as CaretDown, RiMagicLine as MagicWand, RiLightbulbFill as Lightbulb, RiGraduationCapFill as GraduationCap, RiBookmarkFill as Bookmark,
  RiYoutubeFill as YoutubeLogo, RiCheckboxCircleFill as CheckCircle, RiListCheck as List
} from "react-icons/ri";

import * as XLSX from 'xlsx'
import UniversalViewer from './UniversalViewer'



// ─── Main Document Viewer ─────────────────────────────────────────────────────

export default function DocumentViewer({
  material,
  onScrollUpdate,
  onMaterialUpdate,
  annotateMode = false,
  highlightMode = false,
  commentMode = false,
  focusModeTool = false,
  pinMode = false,
  annotationColor = '#7C3AED',
  annotationStrokeSize = 4,
  isEraserMode = false,
  annotationToolType = 'draw',
  pendingEquation = '',
  onEquationPlaced,
  onCommentThreadSelect,
  canvasRefs,
  onCanvasSave,
  scrollContainerRef,
  highlights,
  highlightColors,
  createPdfViewerHighlight,
  preparePdfViewerHighlight,
  initCanvas,
  startDrawing,
  draw,
  stopDrawing,
  drawMode,
  loadHighlights,
  setHighlightToolbox,
  isDark
}) {
  const { setViewportData, askAI } = useReadingSpace()
  const [viewMode, setViewMode] = useState('visuals')
  const [fontSize, setFontSize] = useState(17)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  if (!material) return null

  const type = (material.type || '').toLowerCase()
  const status = material.processing_status
  const isVideo = type === 'video' || type === 'youtube' || material.source_url?.includes('youtube.com') || material.source_url?.includes('youtu.be')
  const isAudio = type === 'audio' || (!['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(type) && material.source_url?.match(/\.(mp3|wav|ogg|m4a)$/))
  const isWeb = type === 'web'
  const isImage = type === 'image' || (!['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(type) && material.source_url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/))

  // Sync to global context
  useEffect(() => {
    setViewportData(prev => ({
      ...prev,
      currentPage,
      totalPages: totalPages || prev.totalPages
    }))
  }, [currentPage, totalPages, setViewportData])
    
  const aiReaderRef = useRef(null)
  const canvasRef = useRef(null)

  // Removed legacy PDF plugins

  const handlePageJump = (pg) => {
    const p = parseInt(pg)
    if (!isNaN(p) && p > 0 && p <= totalPages) {
      setCurrentPage(p)
      // Custom event to trigger PDF viewer page change if needed
      window.dispatchEvent(new CustomEvent('luter-jump-to-page', { detail: { page: p } }))
    }
  }

  useEffect(() => {
    if (!material) return
    
    const handleJump = (e) => {
      if (e.detail && e.detail.page) {
        setCurrentPage(e.detail.page)
        setViewMode('visuals')
      }
    }

    const handleHighlight = (e) => {
      if (e.detail && e.detail.text) {
        setViewMode('ai')
      }
    }

    window.addEventListener('luter-jump-to-page', handleJump)
    window.addEventListener('luter-highlight-text', handleHighlight)

    // Directly use material.source_url without signed URL fetching

    setViewportData({
      visibleText: (material.extracted_text || '').replace(/\*\*/g, '').slice(0, 3000),
      scrollPercent: 0,
      currentPage: 1,
      documentType: material.type || 'unknown',
    })

    return () => {
      window.removeEventListener('luter-jump-to-page', handleJump)
      window.removeEventListener('luter-highlight-text', handleHighlight)
    }
  }, [material?.id, material?.extracted_text, material?.source_url, type])

  const getProcessedText = () => {
    let text = material.extracted_text || ''
    return text
  }

  /** Flashka-Style Property Grid for Metadata */
  const PropertyGridHeader = () => {
    const isLandmark = material.title?.toLowerCase().includes('landmark') || material.description?.toLowerCase().includes('landmark')
    return (
      <div className="ws-property-card" style={{ marginBottom: '48px' }}>
        {isLandmark && <div className="ws-inst-logo" style={{ marginBottom: 24, background: '#6D28D9', color: 'white', border: 'none' }}>LMU</div>}
        <h1 className="ws-ntn-h1" style={{ fontSize: 42, fontWeight: 800, fontFamily: 'var(--font-outfit)', letterSpacing: '-0.04em', color: '#1A102D', marginBottom: '12px' }}>{material.course_code || 'STUDY MATERIAL'}</h1>
        <p style={{ color: '#64748B', fontSize: 20, fontWeight: 500, margin: 0, fontFamily: 'var(--font-varela)', opacity: 0.8 }}>{material.title}</p>
        
        <div className="ws-property-grid" style={{ 
          marginTop: '40px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1px',
          background: '#F1F5F9',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #F1F5F9'
        }}>
           <div className="ws-prop-item" style={{ background: 'white', padding: '20px' }}>
              <span className="ws-prop-label" style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: '8px', display: 'block' }}>Course</span>
              <span className="ws-prop-value" style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', fontFamily: 'var(--font-outfit)' }}>{material.course_name || 'Natural Sciences'}</span>
           </div>
           <div className="ws-prop-item" style={{ background: 'white', padding: '20px' }}>
              <span className="ws-prop-label" style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: '8px', display: 'block' }}>Type</span>
              <span className="ws-prop-value" style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', fontFamily: 'var(--font-outfit)' }}>{material.type || 'Document'}</span>
           </div>
           <div className="ws-prop-item" style={{ background: 'white', padding: '20px' }}>
              <span className="ws-prop-label" style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: '8px', display: 'block' }}>Status</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
                <span className="ws-prop-value" style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', fontFamily: 'var(--font-outfit)' }}>Ready</span>
              </div>
           </div>
           <div className="ws-prop-item" style={{ background: 'white', padding: '20px' }}>
              <span className="ws-prop-label" style={{ fontSize: '10px', fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', marginBottom: '8px', display: 'block' }}>Source</span>
              <span className="ws-prop-value" style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', fontFamily: 'var(--font-outfit)' }}>Luter cloud</span>
           </div>
        </div>
      </div>
    )
  }

  if (status === 'pending' && !material.source_url) {
    return <PendingState material={material} />
  }

  return (
    <div className="ws-infinite-reader-container" ref={canvasRef} style={{ background: 'transparent' }}>
      <div className="ws-canvas-scroller" style={{ padding: 0 }}>
        
        <div className="ws-canvas-surface" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* VISUAL VIEW: CLEAN DOCUMENT MODE */}
          {viewMode === 'visuals' && (
            <div className="ws-visual-viewport" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                 <UniversalViewer
                    material={material}
                    initialPage={currentPage}
                    onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
                    onDocumentLoad={(e) => setTotalPages(e.doc.numPages)}
                    onMaterialUpdate={onMaterialUpdate}
                    annotateMode={annotateMode}
                    highlightMode={highlightMode}
                    commentMode={commentMode}
                    focusModeTool={focusModeTool}
                    pinMode={pinMode}
                    annotationColor={annotationColor}
                    annotationStrokeSize={annotationStrokeSize}
                    isEraserMode={isEraserMode}
                    annotationToolType={annotationToolType}
                    pendingEquation={pendingEquation}
                    onEquationPlaced={onEquationPlaced}
                    onCommentThreadSelect={onCommentThreadSelect}
                    canvasRefs={canvasRefs}
                    onCanvasSave={onCanvasSave}
                    scrollContainerRef={scrollContainerRef}
                    highlights={highlights}
                    highlightColors={highlightColors}
                    createPdfViewerHighlight={createPdfViewerHighlight}
                    preparePdfViewerHighlight={preparePdfViewerHighlight}
                    initCanvas={initCanvas}
                    startDrawing={startDrawing}
                    draw={draw}
                    stopDrawing={stopDrawing}
                    drawMode={drawMode}
                    loadHighlights={loadHighlights}
                    setHighlightToolbox={setHighlightToolbox}
                    isDark={isDark}
                 />
            </div>
          )}

          {/* AI VIEW: STRUCTURED DATA MODE */}
          {viewMode === 'ai' && (
            <div className="ws-native-canvas" style={{ background: 'white' }}>
              <div className="ws-notion-layout" style={{ maxWidth: '850px' }}>
                <PropertyGridHeader />
                <div className="ws-notion-card" ref={aiReaderRef}>
                  <div className="ws-notion-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="ws-ntn-h1" style={{ fontFamily: 'var(--font-outfit)', fontSize: '32px', fontWeight: 800, marginTop: '48px', marginBottom: '20px' }}>{children}</h1>,
                        h2: ({ children }) => <h2 className="ws-ntn-h2" style={{ fontFamily: 'var(--font-outfit)', fontSize: '24px', fontWeight: 700, marginTop: '36px', marginBottom: '16px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '8px' }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '20px', fontWeight: 700, marginTop: '28px', marginBottom: '12px' }}>{children}</h3>,
                        p: ({ children }) => <p className="ws-ntn-p" style={{ fontSize: `${fontSize}px`, fontFamily: 'var(--font-varela)', lineHeight: '1.8', color: '#334155', marginBottom: '24px' }}>{children}</p>,
                        li: ({ children }) => <li style={{ fontFamily: 'var(--font-varela)', fontSize: `${fontSize - 1}px`, marginBottom: '12px', color: '#334155' }}>{children}</li>,
                        em: ({ children, ...props }) => {
                          return <em {...props}>{children}</em>
                        },
                        strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#1A102D' }}>{children}</strong>
                      }}
                    >
                      {getProcessedText().replace(/\\\*/g, '*')}
                    </ReactMarkdown>
                  </div>
                </div>
                <div style={{ height: 100 }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── High-Fidelity Renderers ─────────────────────────────────────────────────

function HighFidelityPDF({ fileUrl, initialPage = 1, onPageChange, onDocumentLoad, plugins = [] }) {
  const renderPage = (props) => (
    <div className="notranslate" translate="no" style={{ display: 'contents' }}>
      {props.canvasLayer.children}
      {props.textLayer.children}
      {props.annotationLayer.children}
      <div className="ws-annotation-overlay" />
    </div>
  )
  return (
    <div className="luter-pdf-canvas notranslate" translate="no" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <Viewer 
        key={fileUrl}
        fileUrl={fileUrl} 
        initialPage={initialPage > 0 ? initialPage - 1 : 0}
        onPageChange={onPageChange}
        onDocumentLoad={onDocumentLoad}
        renderPage={renderPage}
        theme={{ theme: 'light' }}
        defaultScale={SpecialZoomLevel.PageWidth}
        plugins={plugins}
      />
    </div>
  )
}

/** The Pro Move: Microsoft/Google Office Viewer for PPT and DOCX */
function OfficeViewer({ fileUrl }) {
  const [loading, setLoading] = useState(true)
  
  // Encodes the URL so Microsoft can fetch and render it
  const microsoftViewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 56px)', position: 'relative', overflow: 'hidden', background: 'white' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
           <CircleNotch className="ws-spin" color="#4B0082" size={32} weight="bold" />
        </div>
      )}
      <iframe
        src={microsoftViewer}
        style={{ 
          width: '100%', 
          height: '100%',
          border: 'none',
          pointerEvents: 'auto'
        }}
        onLoad={() => setLoading(false)}
        title="Office Document"
      />
    </div>
  )
}

function HighFidelityExcel({ fileUrl }) {
  const [data, setData] = useState([])
  useEffect(() => {
    const loadExcel = async () => {
      const res = await fetch(fileUrl)
      const ab = await res.arrayBuffer()
      const wb = XLSX.read(ab, { type: 'array' })
      const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })
      setData(json)
    }
    loadExcel()
  }, [fileUrl])
  return (
    <div>
      <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white', border: '1px solid #E2E8F0' }}>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
              {row.map((cell, j) => <td key={j} style={{ padding: 12, fontSize: 13, fontWeight: i === 0 ? 700 : 400 }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HighFidelityImage({ fileUrl }) {
  const onUpdate = ({ x, y, scale }) => {
    const img = document.getElementById('zoom-img')
    if (img) img.style.transform = make3dTransformValue({ x, y, scale })
  }
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <QuickPinchZoom onUpdate={onUpdate} enforceBounds>
        <img id="zoom-img" src={fileUrl} alt="Visual" style={{ maxWidth: '100%', borderRadius: 8 }} />
      </QuickPinchZoom>
    </div>
  )
}

function HighFidelityAudio({ material }) {
  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, background: '#F8FAFC' }}>
       <div style={{ 
         width: '120px', height: '120px', borderRadius: '40px', 
         background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
         boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9'
       }}>
         <Music size={64} color="#4B0082" weight="bold" />
       </div>
       <div style={{ textAlign: 'center' }}>
         <h3 style={{ fontFamily: 'var(--font-outfit)', fontWeight: 800, fontSize: '20px', color: '#1A102D', marginBottom: '8px' }}>AUDIO LECTURE</h3>
         <p style={{ fontFamily: 'var(--font-varela)', color: '#64748B', fontSize: '14px' }}>{material.title}</p>
       </div>
       <audio controls src={material.source_url} style={{ width: '400px' }} />
    </div>
  )
}

function HighFidelityWeb({ url }) {
  return <iframe src={url} style={{ width: '100%', height: 'calc(100vh - 56px)', border: 'none' }} title="Web" />
}

function HighFidelityAnki({ material }) {
  return <div style={{ padding: 40, textAlign: 'center' }}>Anki Deck: {material.title}</div>
}

function PendingState({ material }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)', gap: 24, background: '#F8FAFC' }}>
      <div style={{ position: 'relative' }}>
        <CircleNotch size={48} color="#4B0082" weight="bold" className="ws-spin" />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkle size={20} weight="bold" color="#7a12cc" />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#1A102D', fontWeight: 800, fontSize: '18px', fontFamily: 'var(--font-outfit)', marginBottom: '4px' }}>OPTIMIZING FOR STUDY</p>
        <p style={{ color: '#64748B', fontWeight: 500, fontSize: '14px', fontFamily: 'var(--font-varela)' }}>{material?.title || 'Preparing your material'}...</p>
      </div>
    </div>
  )
}
