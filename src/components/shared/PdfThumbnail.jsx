import { useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js'

if (typeof window !== 'undefined' && pdfjsLib?.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
}

/**
 * PdfThumbnail
 * Renders page 1 of a PDF from a URL directly into a <canvas>.
 *
 * Props:
 *   url       — public URL of the PDF
 *   width     — canvas render width in px (default 240)
 *   className — extra class on the wrapper
 *   style     — extra style on the wrapper
 */
export default function PdfThumbnail({ url, width = 240, className = '', style = {} }) {
  const canvasRef = useRef(null)
  const [state, setState] = useState('idle') // idle | loading | done | error

  useEffect(() => {
    if (!url) return

    let cancelled = false
    setState('loading')

    async function render() {
      try {
        const loadingTask = pdfjsLib.getDocument({ url, disableStream: true, disableRange: false })
        const pdf = await loadingTask.promise
        if (cancelled) return

        const page = await pdf.getPage(1)
        if (cancelled) return

        const viewport = page.getViewport({ scale: 1 })
        const scale = width / viewport.width
        const scaledViewport = page.getViewport({ scale })

        const canvas = canvasRef.current
        if (!canvas || cancelled) return

        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height

        const ctx = canvas.getContext('2d')
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
        if (!cancelled) setState('done')
      } catch (err) {
        if (!cancelled) {
          console.warn('[PdfThumbnail] render error:', err)
          setState('error')
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [url, width])

  return (
    <div
      className={`pdf-thumb-wrap ${className}`}
      style={{
        width,
        aspectRatio: '3/4',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'inherit',
        background: 'var(--sb-border-subtle, #F3F4F6)',
        ...style,
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: state === 'done' ? 'block' : 'none',
          borderRadius: 'inherit',
        }}
      />

      {/* Loading skeleton */}
      {state === 'loading' && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 28, height: 28,
            border: '2px solid var(--sb-border, #E5E7EB)',
            borderTopColor: 'var(--sb-purple, #C4B5FD)',
            borderRadius: '50%',
            animation: 'pdf-thumb-spin 0.7s linear infinite',
          }} />
        </div>
      )}

      {/* Error / no-preview fallback */}
      {(state === 'error' || state === 'idle') && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 6,
          color: 'var(--sb-text-muted, #9CA3AF)',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'Outfit, Inter, sans-serif' }}>
            No preview
          </span>
        </div>
      )}

      <style>{`
        @keyframes pdf-thumb-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
