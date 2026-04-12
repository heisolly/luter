/**
 * DocumentViewer — The single, unified reading engine for Luter.
 * Replaces all previous renderer files (PDF, DOCX, Excel, Anki, Video, Office, etc.)
 * Uses LangChain-extracted text as the primary content source.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useReadingSpace } from '../ReadingSpaceContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Loader2, AlertCircle, FileText, Video, Music, Image as ImageIcon,
  ChevronLeft, ChevronRight, ExternalLink, RefreshCw, BookOpen,
  Hash, List, ZoomIn, ZoomOut
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTypeLabel(type) {
  const map = {
    pdf: 'PDF Document', docx: 'Word Document', doc: 'Word Document',
    pptx: 'Presentation', ppt: 'Presentation',
    xlsx: 'Spreadsheet', xls: 'Spreadsheet',
    video: 'Video', youtube: 'YouTube Video',
    audio: 'Audio File', image: 'Image',
    anki: 'Anki Deck', txt: 'Text File', md: 'Markdown',
  }
  return map[(type || '').toLowerCase()] || 'Document'
}

function getTypeColor(type) {
  const t = (type || '').toLowerCase()
  if (t === 'pdf') return '#ef4444'
  if (['docx','doc'].includes(t)) return '#2563eb'
  if (['pptx','ppt'].includes(t)) return '#f97316'
  if (['xlsx','xls'].includes(t)) return '#16a34a'
  if (['video','youtube'].includes(t)) return '#dc2626'
  if (t === 'anki') return '#7c3aed'
  return '#7a12cc'
}

function getTypeIcon(type) {
  const t = (type || '').toLowerCase()
  if (['video','youtube'].includes(t)) return <Video size={14} />
  if (t === 'audio') return <Music size={14} />
  if (t === 'image') return <ImageIcon size={14} />
  return <FileText size={14} />
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton({ message = 'Loading document...' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={28} color="#7a12cc" className="animate-spin" />
        </div>
        <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #DDD6FE', borderTopColor: '#7a12cc', animation: 'spin 1.5s linear infinite' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'Outfit', fontWeight: 600, color: '#4C1D95', margin: '0 0 4px' }}>{message}</p>
        <p style={{ fontFamily: 'Outfit', fontSize: 13, color: '#94A3B8', margin: 0 }}>Powered by LangChain</p>
      </div>
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ title, message, onRetry, sourceUrl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 40 }}>
      <div style={{ width: 72, height: 72, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={36} color="#DC2626" />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A102D', margin: '0 0 8px', fontFamily: 'Outfit' }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px', fontFamily: 'Outfit' }}>{message}</p>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {onRetry && (
          <button onClick={onRetry} style={{ padding: '10px 20px', background: '#7a12cc', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit' }}>
            <RefreshCw size={14} /> Try Again
          </button>
        )}
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 20px', background: '#F1F5F9', color: '#374151', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Outfit', textDecoration: 'none' }}>
            <ExternalLink size={14} /> Open Directly
          </a>
        )}
      </div>
    </div>
  )
}

// ─── YouTube / Video Embed ────────────────────────────────────────────────────

function VideoEmbed({ material }) {
  const url = material.source_url || ''
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be')

  const getEmbedUrl = (u) => {
    const match = u.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null
  }

  if (isYoutube) {
    const embedUrl = getEmbedUrl(url)
    if (!embedUrl) return <ErrorState title="Invalid YouTube URL" message="We couldn't parse this YouTube link." sourceUrl={url} />
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0f0f0f' }}>
        <iframe
          src={embedUrl}
          style={{ flex: 1, border: 'none', width: '100%' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={material.title}
        />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video src={url} controls style={{ maxWidth: '100%', maxHeight: '100%' }}>
        Your browser does not support the video tag.
      </video>
    </div>
  )
}

// ─── Reading Toolbar ──────────────────────────────────────────────────────────

function ReadingToolbar({ material, fontSize, setFontSize, currentPage, totalPages, onPageChange }) {
  const typeColor = getTypeColor(material?.type)

  return (
    <div style={{
      padding: '10px 20px', background: 'white', borderBottom: '1px solid #E2E8F0',
      display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, fontFamily: 'Outfit'
    }}>
      {/* Type badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: `${typeColor}15`, borderRadius: 20, border: `1px solid ${typeColor}30`, color: typeColor, fontSize: 11, fontWeight: 700 }}>
        {getTypeIcon(material?.type)}
        {getTypeLabel(material?.type)}
      </div>

      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1A102D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {material?.title || 'Untitled'}
      </div>

      {/* Font size controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => setFontSize(s => Math.max(12, s - 1))}
          style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
          <ZoomOut size={13} />
        </button>
        <span style={{ fontSize: 12, color: '#64748B', minWidth: 28, textAlign: 'center' }}>{fontSize}</span>
        <button onClick={() => setFontSize(s => Math.min(24, s + 1))}
          style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}>
          <ZoomIn size={13} />
        </button>
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 12, borderLeft: '1px solid #E2E8F0' }}>
          <button onClick={() => onPageChange(-1)} disabled={currentPage <= 1}
            style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: 6, background: currentPage <= 1 ? '#F9FAFB' : 'white', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', color: currentPage <= 1 ? '#CBD5E1' : '#7a12cc', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={13} />
          </button>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500, minWidth: 60, textAlign: 'center' }}>
            {currentPage} / {totalPages}
          </span>
          <button onClick={() => onPageChange(1)} disabled={currentPage >= totalPages}
            style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: 6, background: currentPage >= totalPages ? '#F9FAFB' : 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', color: currentPage >= totalPages ? '#CBD5E1' : '#7a12cc', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {material?.source_url && (
        <a href={material.source_url} target="_blank" rel="noopener noreferrer"
          style={{ padding: '4px 8px', border: '1px solid #E2E8F0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          title="Open original file">
          <ExternalLink size={13} />
        </a>
      )}
    </div>
  )
}

// ─── Text Content Reader ──────────────────────────────────────────────────────

function TextContentReader({ material, fontSize, onScrollUpdate }) {
  const contentRef = useRef(null)
  const [pages, setPages] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  // Break extracted text into pseudo-pages for better navigation
  useEffect(() => {
    const text = material?.extracted_text || ''
    if (!text) return setPages([])

    const CHARS_PER_PAGE = 3000
    const chunks = []
    for (let i = 0; i < text.length; i += CHARS_PER_PAGE) {
      chunks.push(text.slice(i, i + CHARS_PER_PAGE))
    }
    setPages(chunks.length ? chunks : [text])
    setCurrentPage(1)
  }, [material?.id])

  // Track visible text for AI context
  const handleScroll = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    const percent = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
    onScrollUpdate?.({ scrollPercent: Math.round(percent), currentPage, totalPages: pages.length })
  }, [currentPage, pages.length, onScrollUpdate])

  useEffect(() => {
    const el = contentRef.current
    if (el) el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el?.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const currentText = pages[currentPage - 1] || ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ReadingToolbar
        material={material}
        fontSize={fontSize}
        setFontSize={() => {}} // Passed from parent
        currentPage={currentPage}
        totalPages={pages.length}
        onPageChange={(delta) => {
          setCurrentPage(p => Math.max(1, Math.min(pages.length, p + delta)))
          contentRef.current?.scrollTo(0, 0)
        }}
      />

      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', background: 'white', padding: '0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 48px' }}>
          {/* Page indicator */}
          {pages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
              <BookOpen size={14} color="#7a12cc" />
              <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Outfit', fontWeight: 500 }}>
                Section {currentPage} of {pages.length}
              </span>
            </div>
          )}

          <div
            className="luter-doc-content"
            style={{
              fontSize,
              lineHeight: 1.85,
              fontFamily: '"Outfit", "Georgia", serif',
              color: '#1A102D',
              letterSpacing: '0.01em',
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentText}
            </ReactMarkdown>
          </div>

          {/* Page nav at bottom */}
          {pages.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
              <button
                disabled={currentPage <= 1}
                onClick={() => { setCurrentPage(p => p - 1); contentRef.current?.scrollTo(0, 0) }}
                style={{ padding: '10px 20px', background: currentPage <= 1 ? '#F9FAFB' : '#F5F3FF', color: currentPage <= 1 ? '#CBD5E1' : '#7a12cc', border: '1px solid', borderColor: currentPage <= 1 ? '#E2E8F0' : '#DDD6FE', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Outfit' }}>Section {currentPage}/{pages.length}</span>
              <button
                disabled={currentPage >= pages.length}
                onClick={() => { setCurrentPage(p => p + 1); contentRef.current?.scrollTo(0, 0) }}
                style={{ padding: '10px 20px', background: currentPage >= pages.length ? '#F9FAFB' : '#7a12cc', color: currentPage >= pages.length ? '#CBD5E1' : 'white', border: '1px solid', borderColor: currentPage >= pages.length ? '#E2E8F0' : '#7a12cc', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: currentPage >= pages.length ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 6 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Empty / Pending State ────────────────────────────────────────────────────

function PendingState({ material, onRetry }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20, padding: 40 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={36} color="#7a12cc" className="animate-spin" />
        </div>
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1A102D', margin: '0 0 8px', fontFamily: 'Outfit' }}>
          Luter is ingesting your material…
        </h3>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 8px', fontFamily: 'Outfit' }}>
          LangChain is extracting, chunking, and embedding <strong>{material?.title}</strong> into your study vault.
        </p>
        <p style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Outfit', margin: 0 }}>
          {elapsed}s elapsed — large files may take up to 60 seconds
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['Extract', 'Chunk', 'Embed', 'Store'].map((step, i) => (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: elapsed > i * 10 ? '#7a12cc' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.5s ease' }}>
              {elapsed > i * 10 ? <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>✓</span> : <span style={{ color: '#94A3B8', fontSize: 11 }}>{i + 1}</span>}
            </div>
            <span style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'Outfit', fontWeight: 500 }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Document Viewer ─────────────────────────────────────────────────────

export default function DocumentViewer({ material, onScrollUpdate }) {
  const { setViewportData } = useReadingSpace()
  const [fontSize, setFontSize] = useState(15)

  // Update AI viewport context whenever material changes
  useEffect(() => {
    if (!material) return
    setViewportData({
      visibleText: material.extracted_text?.slice(0, 3000) || '',
      scrollPercent: 0,
      currentPage: 1,
      documentType: material.type || 'unknown',
    })
  }, [material?.id, material?.extracted_text])

  if (!material) return null

  const type = (material.type || '').toLowerCase()
  const status = material.processing_status

  // 1. Still being ingested
  if (status === 'pending') {
    return <PendingState material={material} />
  }

  // 2. Video / YouTube — show embed
  if (type === 'video' || type === 'youtube' || material.source_url?.includes('youtube.com') || material.source_url?.includes('youtu.be')) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ReadingToolbar material={material} fontSize={fontSize} setFontSize={setFontSize} currentPage={1} totalPages={1} onPageChange={() => {}} />
        <div style={{ flex: 1 }}>
          <VideoEmbed material={material} />
        </div>
        {/* Transcript below if available */}
        {material.extracted_text && (
          <div style={{ borderTop: '1px solid #E2E8F0', padding: '20px 32px', maxHeight: 200, overflowY: 'auto', background: '#F8FAFC' }}>
            <p style={{ fontFamily: 'Outfit', fontSize: 12, fontWeight: 700, color: '#7a12cc', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Transcript</p>
            <p style={{ fontFamily: 'Outfit', fontSize: 13, color: '#4A5568', lineHeight: 1.6, margin: 0 }}>{material.extracted_text.slice(0, 800)}…</p>
          </div>
        )}
      </div>
    )
  }

  // 3. Extraction failed
  if (status === 'failed' || (!material.extracted_text && status !== 'pending')) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ReadingToolbar material={material} fontSize={fontSize} setFontSize={setFontSize} currentPage={1} totalPages={1} onPageChange={() => {}} />
        <ErrorState
          title="Content Extraction Failed"
          message="LangChain couldn't extract readable text from this file. It may be a scanned image PDF, corrupt, or an unsupported format. You can still open the original file directly."
          sourceUrl={material.source_url}
        />
      </div>
    )
  }

  // 4. No text yet (shouldn't happen but be safe)
  if (!material.extracted_text) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ReadingToolbar material={material} fontSize={fontSize} setFontSize={setFontSize} currentPage={1} totalPages={1} onPageChange={() => {}} />
        <PendingState material={material} />
      </div>
    )
  }

  // 5. Rich text reading view (all text-based formats land here)
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TextContentReaderWithToolbar
        material={material}
        fontSize={fontSize}
        setFontSize={setFontSize}
        onScrollUpdate={(data) => {
          setViewportData(prev => ({
            ...prev,
            ...data,
            visibleText: material.extracted_text?.slice(0, 3000) || '',
          }))
          onScrollUpdate?.(data)
        }}
      />
    </div>
  )
}

// Wrapper that threads fontSize setter into toolbar
function TextContentReaderWithToolbar({ material, fontSize, setFontSize, onScrollUpdate }) {
  const contentRef = useRef(null)
  const [pages, setPages] = useState([])
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const text = material?.extracted_text || ''
    if (!text) return setPages([])
    const CHARS_PER_PAGE = 3000
    const chunks = []
    for (let i = 0; i < text.length; i += CHARS_PER_PAGE) chunks.push(text.slice(i, i + CHARS_PER_PAGE))
    setPages(chunks.length ? chunks : [text])
    setCurrentPage(1)
  }, [material?.id])

  const handleScroll = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    const percent = (el.scrollTop / (el.scrollHeight - el.clientHeight || 1)) * 100
    onScrollUpdate?.({ scrollPercent: Math.round(percent), currentPage, totalPages: pages.length })
  }, [currentPage, pages.length, onScrollUpdate])

  useEffect(() => {
    const el = contentRef.current
    if (el) el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el?.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const changePage = (delta) => {
    setCurrentPage(p => Math.max(1, Math.min(pages.length, p + delta)))
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentText = pages[currentPage - 1] || ''

  return (
    <>
      <ReadingToolbar
        material={material}
        fontSize={fontSize}
        setFontSize={setFontSize}
        currentPage={currentPage}
        totalPages={pages.length}
        onPageChange={changePage}
      />

      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 48px' }}>
          {pages.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
              <Hash size={14} color="#7a12cc" />
              <span style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'Outfit', fontWeight: 500 }}>
                Section {currentPage} of {pages.length} — {material?.type?.toUpperCase()}
              </span>
            </div>
          )}

          <div
            style={{ fontSize, lineHeight: 1.85, fontFamily: '"Outfit", Georgia, serif', color: '#1A102D', letterSpacing: '0.01em' }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {currentText}
            </ReactMarkdown>
          </div>

          {pages.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48, paddingTop: 24, borderTop: '1px solid #F1F5F9' }}>
              <button disabled={currentPage <= 1} onClick={() => changePage(-1)}
                style={{ padding: '10px 20px', background: currentPage <= 1 ? '#F9FAFB' : '#F5F3FF', color: currentPage <= 1 ? '#CBD5E1' : '#7a12cc', border: `1px solid ${currentPage <= 1 ? '#E2E8F0' : '#DDD6FE'}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={14} /> Previous
              </button>
              <span style={{ fontSize: 13, color: '#94A3B8', fontFamily: 'Outfit', alignSelf: 'center' }}>{currentPage} / {pages.length}</span>
              <button disabled={currentPage >= pages.length} onClick={() => changePage(1)}
                style={{ padding: '10px 20px', background: currentPage >= pages.length ? '#F9FAFB' : '#7a12cc', color: currentPage >= pages.length ? '#CBD5E1' : 'white', border: `1px solid ${currentPage >= pages.length ? '#E2E8F0' : '#7a12cc'}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: currentPage >= pages.length ? 'not-allowed' : 'pointer', fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: 6 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
