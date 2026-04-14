/**
 * DocumentViewer — High-Fidelity Universal Reading Environment for Luter.
 * Now supports: PDF, Word, PPT, Excel, Images, Video, Audio, YouTube, Web, and Anki.
 */

import React, { useEffect, useState, useRef } from 'react'
import { useReadingSpace } from '../ReadingSpaceContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Loader2, AlertCircle, FileText, Eye, Sparkles, Image as ImageIcon, Music, Play, Globe, Layers, Download, Maximize2
} from 'lucide-react'

// Professional Renderers
import { Viewer, Worker } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { renderAsync } from 'docx-preview'
import ReactPlayer from 'react-player'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom'
import * as XLSX from 'xlsx'

// Styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'

// Hardened PDF Worker Initialization (Vite-compatible)
import * as pdfjsLib from 'pdfjs-dist'
const PDF_WORKER_URL = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`

// Assign worker source to the main pdfjs object and expose to window for the Worker component
if (typeof window !== 'undefined') {
  window.pdfjsLib = pdfjsLib
}

if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
}

// Model Configuration
export const GROQ_MODELS = {
  PROFESSOR: 'llama-3.3-70b-versatile',  // For Complex Tutoring & Deep Analysis
  SPEEDSTER: 'llama-3.1-8b-instant',      // DEFAULT for Summaries, Flashcards, Quizzes to avoid TPD limits
  VISION: 'llama-3.2-11b-vision-preview', 
  WHISPER: 'whisper-large-v3-turbo'       
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTypeLabel(type) {
  const map = {
    pdf: 'PDF Document', docx: 'Word Document', doc: 'Word Document',
    pptx: 'Presentation', ppt: 'Presentation',
    xlsx: 'Spreadsheet', xls: 'Spreadsheet', csv: 'Data Sheet',
    video: 'Video', youtube: 'YouTube Video',
    audio: 'Audio File', image: 'Image',
    anki: 'Anki Deck', apkg: 'Anki Deck',
    txt: 'Text File', md: 'Markdown', web: 'Website'
  }
  return map[(type || '').toLowerCase()] || 'Document'
}

function getTypeColor(type) {
  const t = (type || '').toLowerCase()
  if (t === 'pdf') return '#ef4444'
  if (['docx','doc'].includes(t)) return '#2563eb'
  if (['pptx','ppt'].includes(t)) return '#f97316'
  if (['xlsx','xls','csv'].includes(t)) return '#16a34a'
  if (['video','youtube'].includes(t)) return '#dc2626'
  if (['audio'].includes(t)) return '#8b5cf6'
  if (['image'].includes(t)) return '#ec4899'
  if (['anki','apkg'].includes(t)) return '#0ea5e9'
  return '#7a12cc'
}

// ─── Specialized Renderers ───────────────────────────────────────────────────

/** Visual PDF Viewer with Pro Layout */
function HighFidelityPDF({ fileUrl, initialPage = 1 }) {
  // Create a plugin instance
  const defaultLayoutPluginInstance = defaultLayoutPlugin()
  
  return (
    <div style={{ height: '100%', width: '100%', background: '#1a1a1a', borderRadius: '12px', overflow: 'hidden' }}>
      <Worker workerUrl={PDF_WORKER_URL}>
        <Viewer 
          fileUrl={fileUrl} 
          initialPage={initialPage > 0 ? initialPage - 1 : 0}
          plugins={[defaultLayoutPluginInstance]} 
          theme="dark"
          defaultScale={1.2}
        />
      </Worker>
    </div>
  )
}

/** Visual Word Document Viewer */
function HighFidelityWord({ fileUrl }) {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDoc = async () => {
      setLoading(true)
      try {
        const response = await fetch(fileUrl, { method: 'GET', mode: 'cors' })
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          await renderAsync(arrayBuffer, containerRef.current, undefined, { breakPages: true, ignoreHeight: false })
        }
      } catch (err) { console.error('Word failed:', err) } finally { setLoading(false) }
    }
    loadDoc()
  }, [fileUrl])

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#F1F5F9', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {loading && <Loader2 className="animate-spin" color="#7a12cc" style={{ marginTop: 100 }} />}
      <div ref={containerRef} style={{ background: 'white', maxWidth: '850px', width: '100%', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
    </div>
  )
}

/** Visual Spreadsheet Viewer */
function HighFidelityExcel({ fileUrl }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const res = await fetch(fileUrl)
        const ab = await res.arrayBuffer()
        const wb = XLSX.read(ab, { type: 'array' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const json = XLSX.utils.sheet_to_json(ws, { header: 1 })
        setData(json)
      } catch (err) { console.error('Excel failed:', err) } finally { setLoading(false) }
    }
    loadExcel()
  }, [fileUrl])

  if (loading) return <PendingState material={{ title: 'Spreadsheet' }} />

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#F8FAFC', padding: 20 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', background: 'white', borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: i === 0 ? '#F8FAFC' : 'transparent' }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '12px 16px', fontSize: 13, color: i === 0 ? '#1A102D' : '#475569', fontWeight: i === 0 ? 700 : 400 }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Visual Image Viewer with Pinch-Zoom */
function HighFidelityImage({ fileUrl }) {
  const onUpdate = ({ x, y, scale }) => {
    const img = document.getElementById('zoom-img')
    if (img) img.style.transform = make3dTransformValue({ x, y, scale })
  }
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A', overflow: 'hidden' }}>
      <QuickPinchZoom onUpdate={onUpdate} enforceBounds>
        <img id="zoom-img" src={fileUrl} alt="Visual Content" style={{ maxWidth: '100%', transition: 'transform 0.1s ease-out' }} />
      </QuickPinchZoom>
    </div>
  )
}

/** High Fidelity Audio Workspace */
function HighFidelityAudio({ material }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FDFCFE', gap: 32 }}>
       <div style={{ width: 140, height: 140, borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px rgba(122, 18, 204, 0.1)' }}>
         <Music size={48} color="#7a12cc" />
       </div>
       <div style={{ textAlign: 'center' }}>
         <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1A102D', marginBottom: 8 }}>{material.title}</h2>
         <p style={{ color: '#64748B' }}>Audio Study Material</p>
       </div>
       <audio controls style={{ width: '400px', borderRadius: '32px' }} src={material.source_url} />
    </div>
  )
}

/** Web Content / Website Viewer */
function HighFidelityWeb({ url }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 16px', background: '#F1F5F9', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #E2E8F0' }}>
         <Globe size={14} color="#64748B" />
         <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</span>
      </div>
      <iframe src={url} style={{ flex: 1, border: 'none' }} title="Website Content" />
    </div>
  )
}

/** Anki / Flashcard Preview */
function HighFidelityAnki({ material }) {
  return (
    <div style={{ height: '100%', background: '#F8FAFC', padding: 40, overflowY: 'auto' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
           <Layers color="#0ea5e9" size={24} />
           <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A102D', margin: 0 }}>Anki Flashcard Deck</h2>
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, textAlign: 'center', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
           <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6 }}>
             This Anki deck has been imported into your <strong>Flashcards</strong> tool. 
             You can study the cards using the active recall interface on the right.
           </p>
           <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <div style={{ padding: '12px 24px', borderRadius: '12px', background: '#F0F9FF', color: '#0369A1', fontWeight: 700, fontSize: 14 }}>
                 {material.title}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Document Viewer ─────────────────────────────────────────────────────

export default function DocumentViewer({ material, onScrollUpdate }) {
  const { setViewportData } = useReadingSpace()
  const [viewMode, setViewMode] = useState('visuals') // 'visuals' or 'ai'
  const [fontSize, setFontSize] = useState(16)

  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!material) return
    
    // Listen for "jump-to-page" events from the Reading Space (AI Chat)
    const handleJump = (e) => {
      if (e.detail && e.detail.page) {
        setCurrentPage(e.detail.page)
        setViewMode('visuals') // Switch to visuals if AI wants to show something
      }
    }
    window.addEventListener('luter-jump-to-page', handleJump)

    setViewportData({
      visibleText: material.extracted_text?.slice(0, 3000) || '',
      scrollPercent: 0,
      currentPage: 1,
      documentType: material.type || 'unknown',
    })

    return () => window.removeEventListener('luter-jump-to-page', handleJump)
  }, [material?.id, material?.extracted_text])

  if (!material) return null

  const type = (material.type || '').toLowerCase()
  const status = material.processing_status
  
  // Exclusive type detection to prevent double-rendering in iframes (which triggers downloads)
  const isVideo = type === 'video' || type === 'youtube' || material.source_url?.includes('youtube.com') || material.source_url?.includes('youtu.be')
  const isAudio = type === 'audio' || (!['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(type) && material.source_url?.match(/\.(mp3|wav|ogg|m4a)$/))
  const isWeb = type === 'web'
  const isImage = type === 'image' || (!['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv'].includes(type) && material.source_url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/))

  // Toolbar Component
  const Toolbar = () => (
    <div style={{
      height: '56px', padding: '0 24px', background: 'white', borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', gap: 16, zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: `${getTypeColor(type)}10`, borderRadius: '12px', color: getTypeColor(type), fontSize: '12px', fontWeight: 800 }}>
        {isWeb ? <Globe size={14} /> : isVideo ? <Play size={14} /> : isImage ? <ImageIcon size={14} /> : <FileText size={14} />} 
        {getTypeLabel(type)}
      </div>
      
      <div style={{ flex: 1, fontSize: '14px', fontWeight: 700, color: '#1A102D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {material.title}
      </div>

      <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '10px', padding: '3px' }}>
        <button 
          onClick={() => setViewMode('visuals')}
          style={{ 
            padding: '6px 12px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            background: viewMode === 'visuals' ? 'white' : 'transparent',
            color: viewMode === 'visuals' ? '#7a12cc' : '#64748B',
            boxShadow: viewMode === 'visuals' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
          }}
        >
          <Eye size={14} /> Full Viewer
        </button>
        <button 
          onClick={() => setViewMode('ai')}
          style={{ 
            padding: '6px 12px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            background: viewMode === 'ai' ? 'white' : 'transparent',
            color: viewMode === 'ai' ? '#7a12cc' : '#64748B',
            boxShadow: viewMode === 'ai' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
          }}
        >
          <Sparkles size={14} /> AI Context
        </button>
      </div>
    </div>
  )

  // 1. Still being ingested
  if (status === 'pending' && !material.source_url) {
    return <PendingState material={material} />
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>
      <Toolbar />
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        
        {/* VIEW MODE: VISUALS */}
        {viewMode === 'visuals' && (
          <div style={{ height: '100%', width: '100%' }}>
            {type === 'pdf' && material.source_url && (
              <HighFidelityPDF fileUrl={material.source_url} initialPage={currentPage} />
            )}
            {(type === 'docx' || type === 'doc') && material.source_url && <HighFidelityWord fileUrl={material.source_url} />}
            {(type === 'pptx' || type === 'ppt') && material.source_url && (
              // If we have metadata indicating a PDF conversion is ready, use it
              material.metadata?.pdf_url ? (
                <HighFidelityPDF fileUrl={material.metadata.pdf_url} initialPage={currentPage} />
              ) : (
                <OfficeEmbed fileUrl={material.source_url} />
              )
            )}
            {(type === 'xlsx' || type === 'xls' || type === 'csv') && material.source_url && <HighFidelityExcel fileUrl={material.source_url} />}
            {isImage && <HighFidelityImage fileUrl={material.source_url} />}
            {isVideo && (
               <div style={{ height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <ReactPlayer url={material.source_url} controls width="100%" height="100%" />
               </div>
            )}
            {isAudio && <HighFidelityAudio material={material} />}
            {isWeb && <HighFidelityWeb url={material.source_url} />}
            {(type === 'anki' || type === 'apkg') && <HighFidelityAnki material={material} />}

            {!['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'csv', 'video', 'youtube', 'image', 'audio', 'web', 'anki', 'apkg'].includes(type) && !isVideo && !isAudio && !isWeb && (
              <div style={{ height: '100%', background: '#fff', padding: '60px' }}>
                <PendingState material={material} />
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE: AI */}
        {viewMode === 'ai' && (
          <div style={{ height: '100%', overflowY: 'auto', background: 'white' }}>
            {!material.extracted_text && status === 'pending' ? (
              <PendingState material={material} />
            ) : !material.extracted_text ? (
              <ErrorState 
                title="AI context unavailable" 
                message="We couldn't extract text for the AI study tools. You can still use the Full Viewer to read it normally."
                sourceUrl={material.source_url}
              />
            ) : (
              <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 48px' }}>
                 <div className="luter-ai-reader" style={{ fontSize: `${fontSize}px`, lineHeight: 1.8, fontFamily: 'Outfit', color: '#1A102D' }}>
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>{material.extracted_text}</ReactMarkdown>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Office Embed Fallback */
function OfficeEmbed({ fileUrl }) {
  // Use Google Docs Viewer which is more stable and less prone to auto-downloads
  const embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
  return <iframe src={embedUrl} width="100%" height="100%" frameBorder="0" title="Document Viewer" />
}

// ─── States ──────────────────────────────────────────────────────────────────

function PendingState({ material }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 24, padding: 40 }}>
      <div style={{ width: 80, height: 80, borderRadius: '24px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} color="#7a12cc" className="animate-spin" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1A102D', margin: '0 0 12px', fontFamily: 'Outfit' }}>Preparing study space…</h3>
        <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, margin: 0, fontFamily: 'Outfit' }}>Luter is optimizing <strong>{material?.title}</strong> for your session.</p>
      </div>
    </div>
  )
}

function ErrorState({ title, message, sourceUrl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40 }}>
      <div style={{ width: 72, height: 72, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={36} color="#DC2626" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: 'Outfit' }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: 0, fontFamily: 'Outfit' }}>{message}</p>
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 16, color: '#7a12cc', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Open Original File</a>
        )}
      </div>
    </div>
  )
}
