import React, { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { LuterPageLoader } from '../../shared/LuterPageLoader'
import { RiFileTextFill as FileText } from 'react-icons/ri'

export default function DocxRenderer({ fileUrl, title }) {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="bg-gray-100 min-h-full py-10" style={{ background: '#F8FAFC', padding: '40px 20px' }}>
      <div
        className="max-w-4xl mx-auto"
        style={{
          background: 'white',
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
          border: '1.5px solid #F1F5F9',
          minHeight: '60vh',
          position: 'relative',
          overflow: 'hidden',
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
          style={{ padding: '40px 48px', minHeight: '60vh' }}
        />
      </div>
    </div>
  )
}
