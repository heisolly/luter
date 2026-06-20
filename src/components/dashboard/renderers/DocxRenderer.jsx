import React, { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { LuterPageLoader } from '../../shared/LuterPageLoader'
import {
  RiFileTextFill as FileText,
  RiDownloadLine as Download,
  RiFullscreenFill as Fullscreen,
  RiFullscreenExitFill as Compress,
} from 'react-icons/ri'

export default function DocxRenderer({ fileUrl, title }) {
  const containerRef = useRef(null)
  const wrapperRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!fileUrl || !containerRef.current) return

    let cancelled = false

    const renderDoc = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(fileUrl)
        if (!res.ok) throw new Error(`Failed to fetch document: ${res.status}`)
        const blob = await res.blob()

        if (cancelled) return

        // Clear previous content
        containerRef.current.innerHTML = ''

        await renderAsync(blob, containerRef.current, null, {
          className: 'luter-docx-rendered',
          inWrapper: true,
        })
      } catch (err) {
        console.error('[DocxRenderer] Render error:', err)
        if (!cancelled) setError(err.message || 'Failed to render document')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    renderDoc()
    return () => { cancelled = true }
  }, [fileUrl])

  // Inject custom styles for docx-preview to fill width and match PDF shadow
  useEffect(() => {
    const styleId = 'luter-docx-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .luter-docx-rendered {
          width: 100% !important;
          max-width: 100% !important;
        }
        .luter-docx-rendered .docx-wrapper {
          background: white !important;
          box-shadow: 0 1px 8px rgba(0,0,0,0.04) !important;
          border-radius: 4px !important;
          margin: 0 auto 8px auto !important;
          max-width: 100% !important;
          width: 100% !important;
          padding: 40px 48px !important;
        }
        .luter-docx-rendered .docx-wrapper:hover {
          box-shadow: 0 2px 16px rgba(0,0,0,0.06) !important;
        }
        .luter-docx-rendered p, .luter-docx-rendered span {
          font-family: var(--font-sans), system-ui, sans-serif !important;
        }
      `
      document.head.appendChild(style)
    }
    return () => {
      const existing = document.getElementById(styleId)
      if (existing) existing.remove()
    }
  }, [])

  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    try {
      if (!isFullscreen) {
        if (wrapper.requestFullscreen) await wrapper.requestFullscreen()
      } else {
        if (document.exitFullscreen) await document.exitFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{
        background: '#F8FAFC',
        height: '100%',
        overflowY: 'auto',
        position: 'relative',
      }}
    >
      {/* Floating toolbar */}
      {!loading && !error && (
        <div
          style={{
            position: 'sticky',
            top: 12,
            zIndex: 20,
            display: 'flex',
            justifyContent: 'center',
            paddingBottom: 8,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              pointerEvents: 'auto',
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', fontFamily: 'var(--font-outfit)', padding: '0 8px' }}>
              Word
            </span>
            <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              {isFullscreen ? <Compress size={16} /> : <Fullscreen size={16} />}
            </button>
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              title="Download"
              style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Content area */}
      <div style={{ padding: '20px 20px 60px', maxWidth: '100%' }}>
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
            border: '1.5px solid #F1F5F9',
            minHeight: '60vh',
            position: 'relative',
            overflow: 'hidden',
            maxWidth: '100%',
            width: '100%',
          }}
        >
          {loading && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'white' }}>
              <LuterPageLoader message="Opening Word document..." minHeight="100%" />
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <FileText size={32} color="#EF4444" />
              </div>
              <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Couldn&apos;t open document</h3>
              <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                {error}
              </p>
              <button
                onClick={() => window.open(fileUrl, '_blank')}
                style={{
                  padding: '10px 20px',
                  background: '#4B0082',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontFamily: 'var(--font-outfit)',
                }}
              >
                Download Document
              </button>
            </div>
          )}

          <div
            ref={containerRef}
            className="luter-docx-rendered"
            style={{ padding: '40px 48px', minHeight: '60vh', width: '100%' }}
          />
        </div>
      </div>
    </div>
  )
}
