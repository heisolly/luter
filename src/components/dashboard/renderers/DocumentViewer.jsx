/**
 * DocumentViewer — High-Fidelity Universal Reading Environment for Luter.
 * Now supports: PDF, Word, PPT, Excel, Images, Video, Audio, YouTube, Web, and Anki.
 */

import React, { useEffect, useState, useRef } from 'react'
import { useReadingSpace } from '../ReadingSpaceContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Loader2, AlertCircle, FileText, Eye, Sparkles, Image as ImageIcon, Music, Play, Globe, Layers, Download, Maximize2,
  Search, Moon, Sun, Volume2, PanelLeft, RotateCcw, ChevronDown, Wand2, Lightbulb, GraduationCap, Bookmark
} from 'lucide-react'

// Professional Renderers
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { renderAsync } from 'docx-preview'
import ReactPlayer from 'react-player'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom'
import { searchPlugin } from '@react-pdf-viewer/search'
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen'
import * as XLSX from 'xlsx'

// Styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import '@react-pdf-viewer/search/lib/styles/index.css'
import '@react-pdf-viewer/full-screen/lib/styles/index.css'

import * as pdfjsLib from 'pdfjs-dist'

// PDF Worker configuration
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js'

if (typeof window !== 'undefined' && pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
}

// ─── Main Document Viewer ─────────────────────────────────────────────────────

export default function DocumentViewer({ material, onScrollUpdate }) {
  const { setViewportData, askAI } = useReadingSpace()
  const [viewMode, setViewMode] = useState('visuals')
  const [fontSize, setFontSize] = useState(17)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  // Sync to global context
  useEffect(() => {
    setViewportData(prev => ({
      ...prev,
      currentPage,
      totalPages: totalPages || prev.totalPages
    }))
  }, [currentPage, totalPages, setViewportData])
  const [highlightText, setHighlightText] = useState('')
  const [selection, setSelection] = useState({ text: '', x: 0, y: 0, show: false })
  
  const aiReaderRef = useRef(null)
  const canvasRef = useRef(null)

  // PDF Plugins - Initialized once
  const searchPluginInstance = searchPlugin()
  const fullScreenPluginInstance = fullScreenPlugin()

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
        setHighlightText(e.detail.text)
        setViewMode('ai')
        setTimeout(() => setHighlightText(''), 8000)
      }
    }

    window.addEventListener('luter-jump-to-page', handleJump)
    window.addEventListener('luter-highlight-text', handleHighlight)

    setViewportData({
      visibleText: material.extracted_text?.slice(0, 3000) || '',
      scrollPercent: 0,
      currentPage: 1,
      documentType: material.type || 'unknown',
    })

    return () => {
      window.removeEventListener('luter-jump-to-page', handleJump)
      window.removeEventListener('luter-highlight-text', handleHighlight)
    }
  }, [material?.id, material?.extracted_text])

  // Contextual Selection Logic
  useEffect(() => {
    const handleMouseUp = () => {
      const activeSelection = window.getSelection()
      const text = activeSelection.toString().trim()
      
      if (text && text.length > 2) {
        const range = activeSelection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        
        setSelection({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top,
          show: true
        })
      } else {
        setSelection(s => ({ ...s, show: false }))
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // AI Reader Scroll Logic
  useEffect(() => {
    if (highlightText && aiReaderRef.current && viewMode === 'ai') {
      setTimeout(() => {
        const el = aiReaderRef.current.querySelector('.luter-highlight-active')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [highlightText, viewMode])

  const getProcessedText = () => {
    if (!highlightText || !material.extracted_text) return material.extracted_text
    const escaped = highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    return material.extracted_text.replace(regex, '*$1*')
  }

  if (!material) return null

  const type = (material.type || '').toLowerCase()
  const status = material.processing_status
  const isVideo = type === 'video' || type === 'youtube' || material.source_url?.includes('youtube.com') || material.source_url?.includes('youtu.be')
  const isAudio = type === 'audio' || (!['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(type) && material.source_url?.match(/\.(mp3|wav|ogg|m4a)$/))
  const isWeb = type === 'web'
  const isImage = type === 'image' || (!['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(type) && material.source_url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/))

  /* Raycast-Inspired Pro Action Bubble */
  const ActionBubble = () => {
    if (!selection.show) return null
    return (
      <div 
        className="ws-pro-action-bubble" 
        style={{ left: selection.x, top: selection.y - 60 }}
      >
        <button className="ws-bubble-main-btn" onClick={() => askAI(selection.text)}>
          <Sparkles size={16} />
          <span>Analyze selection</span>
        </button>
        <div className="ws-bubble-divider" />
        <button className="ws-bubble-icon-btn" title="Explain"><Lightbulb size={16} /></button>
        <button className="ws-bubble-icon-btn" title="Summarize"><Layers size={16} /></button>
        <button 
          className="ws-bubble-icon-btn" 
          onClick={() => {
            setHighlightText(selection.text)
            setViewMode('ai')
          }}
          title="Keep Highlight"
        >
          <Bookmark size={16} />
        </button>
      </div>
    )
  }

  /** Floating Studio Navigation Bar */
  const { isSidePanelCollapsed, setSidePanelCollapsed } = useReadingSpace()
  const StudioNav = () => (
    <div className="ws-studio-floating-bar">
      <div className="ws-nav-section">
        <button 
          className="ws-nav-btn" 
          onClick={() => setSidePanelCollapsed(!isSidePanelCollapsed)}
          title="Toggle Sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <button 
          className="ws-nav-btn" 
          onClick={() => searchPluginInstance.openSearchPopover()}
          title="Search Document"
        >
          <Search size={18} />
        </button>
        <button className="ws-nav-btn"><Moon size={18} /></button>
        <button className="ws-nav-btn"><Volume2 size={18} /></button>
      </div>
      
      <div className="ws-nav-center-group">
        <div className="ws-nav-pg-wrap">
          <input 
            className="ws-nav-pg-input" 
            key={currentPage}
            defaultValue={currentPage}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePageJump(e.target.value)
            }}
          />
          <span className="ws-pg-total">/ {totalPages || '--'}</span>
        </div>
        <div className="ws-nav-divider" />
        <div className="ws-nav-dropdown">
          <span>Page fit</span>
          <ChevronDown size={14} />
        </div>
      </div>

      <div className="ws-nav-section">
        <button 
          className="ws-nav-btn" 
          onClick={() => setViewMode(viewMode === 'visuals' ? 'ai' : 'visuals')}
          title={viewMode === 'visuals' ? 'Switch to AI View' : 'Switch to Visual View'}
        >
          {viewMode === 'visuals' ? <Sparkles size={18} color="var(--luter-primary)" /> : <Eye size={18} />}
        </button>
        <button className="ws-nav-btn" title="Summarize Material">
          <Layers size={18} />
        </button>
        <button className="ws-nav-btn" title="View Contextual Analysis">
          <GraduationCap size={18} />
        </button>
        <div className="ws-nav-divider" />
        <button className="ws-nav-btn" onClick={() => window.open(material.source_url, '_blank')} title="Download">
          <Download size={18} />
        </button>
        <button className="ws-nav-btn" onClick={() => fullScreenPluginInstance.enterFullScreen()} title="Fullscreen">
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  )

  /** Flashka-Style Property Grid for Metadata */
  const PropertyGridHeader = () => {
    const isLandmark = material.title?.toLowerCase().includes('landmark') || material.description?.toLowerCase().includes('landmark')
    return (
      <div className="ws-property-card">
        {isLandmark && <div className="ws-inst-logo" style={{ marginBottom: 16 }}>LMU</div>}
        <h1 className="ws-ntn-h1" style={{ fontSize: 32, fontWeight: 800 }}>{material.course_code || 'Landmark University'}</h1>
        <p style={{ color: '#64748B', fontSize: 18, fontWeight: 500, margin: 0 }}>{material.title}</p>
        <div className="ws-property-grid">
           <div className="ws-prop-item">
              <span className="ws-prop-label">Course</span>
              <span className="ws-prop-value">{material.course_name || 'Biochemistry'}</span>
           </div>
           <div className="ws-prop-item">
              <span className="ws-prop-label">Level</span>
              <span className="ws-prop-value">Level 400</span>
           </div>
           <div className="ws-prop-item">
              <span className="ws-prop-label">Credit Units</span>
              <span className="ws-prop-value">3 Units</span>
           </div>
           <div className="ws-prop-item">
              <span className="ws-prop-label">Academic Subject</span>
              <span className="ws-prop-value">Natural Sciences</span>
           </div>
        </div>
      </div>
    )
  }

  if (status === 'pending' && !material.source_url) {
    return <PendingState material={material} />
  }

  return (
    <div className="ws-infinite-reader-container" ref={canvasRef}>
      <div className="ws-canvas-scroller">
        {/* Minimal Tool Overlay */}
        {/* Minimal Tool Overlay Removed */}
        <ActionBubble />
        
        <div className="ws-canvas-surface" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* VISUAL VIEW: CLEAN DOCUMENT MODE */}
          {viewMode === 'visuals' && (
            <div className="ws-visual-viewport" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
               {type === 'pdf' && material.source_url && (
                 <div className="ws-paper-sheet">
                    <HighFidelityPDF 
                      fileUrl={material.source_url} 
                      initialPage={currentPage}
                      onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
                      onDocumentLoad={(e) => setTotalPages(e.doc.numPages)}
                      plugins={[searchPluginInstance, fullScreenPluginInstance]}
                    />
                 </div>
               )}
               {(type === 'docx' || type === 'doc' || type === 'pptx' || type === 'ppt') && material.source_url && (
                 <div className="ws-paper-sheet">
                    <OfficeViewer fileUrl={material.source_url} />
                 </div>
               )}
               {(type === 'xlsx' || type === 'xls' || type === 'csv') && material.source_url && (
                 <div className="ws-paper-sheet">
                   <HighFidelityExcel fileUrl={material.source_url} />
                 </div>
               )}
               {isImage && <div className="ws-paper-sheet"><HighFidelityImage fileUrl={material.source_url} /></div>}
               {isVideo && (
                  <div style={{ height: '100%', background: '#000', borderRadius: 12, overflow: 'hidden' }}>
                    <ReactPlayer url={material.source_url} controls width="100%" height="100%" />
                  </div>
               )}
               {isAudio && <HighFidelityAudio material={material} />}
               {isWeb && <HighFidelityWeb url={material.source_url} />}
               {(type === 'anki' || type === 'apkg') && <HighFidelityAnki material={material} />}
            </div>
          )}

          {/* AI VIEW: STRUCTURED DATA MODE */}
          {viewMode === 'ai' && (
            <div className="ws-native-canvas">
              <div className="ws-notion-layout">
                <PropertyGridHeader />
                <div className="ws-notion-card" ref={aiReaderRef}>
                  <div className="ws-notion-body">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => <h1 className="ws-ntn-h1">{children}</h1>,
                        h2: ({ children }) => <h2 className="ws-ntn-h2">{children}</h2>,
                        p: ({ children }) => <p className="ws-ntn-p" style={{ fontSize: fontSize }}>{children}</p>,
                        em: ({ children, node, ...props }) => {
                          const text = node?.children?.[0]?.value || ""
                          if (highlightText && typeof text === 'string' && text.toLowerCase().includes(highlightText.toLowerCase())) {
                            return <mark className="luter-highlight-active">{children}</mark>
                          }
                          return <em {...props}>{children}</em>
                        }
                      }}
                    >
                      {getProcessedText()}
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
    <>
      {props.canvasLayer.children}
      {props.textLayer.children}
      {props.annotationLayer.children}
      <div className="ws-annotation-overlay" />
    </>
  )
  return (
    <div className="luter-pdf-canvas" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <Worker workerUrl={PDF_WORKER_URL}>
        <Viewer 
          fileUrl={fileUrl} 
          initialPage={initialPage > 0 ? initialPage - 1 : 0}
          onPageChange={onPageChange}
          onDocumentLoad={onDocumentLoad}
          renderPage={renderPage}
          theme={{ theme: 'light' }}
          defaultScale={SpecialZoomLevel.PageWidth}
          plugins={plugins}
        />
      </Worker>
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
           <Loader2 className="animate-spin" color="var(--luter-primary)" size={32} />
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
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
       <Music size={48} color="var(--luter-primary)" />
       <audio controls src={material.source_url} />
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)', gap: 24 }}>
      <Loader2 size={32} color="var(--luter-primary)" className="animate-spin" />
      <p style={{ color: 'var(--luter-primary-dark)', fontWeight: '600' }}>Luter is optimizing <strong>{material?.title}</strong>...</p>
    </div>
  )
}
