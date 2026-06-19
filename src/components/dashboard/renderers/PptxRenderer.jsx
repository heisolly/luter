import React, { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { LuterPageLoader } from '../../shared/LuterPageLoader'
import {
  RiFilePptFill as FilePpt,
  RiDownloadLine as Download,
  RiPlayFill as Play,
} from 'react-icons/ri'

async function extractPptxSlides(fileUrl) {
  const res = await fetch(fileUrl)
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
  const blob = await res.blob()
  const zip = await JSZip.loadAsync(blob)

  // Parse presentation.xml for slide order
  const presXml = await zip.file('ppt/presentation.xml')?.async('text')
  let slideIds = []
  if (presXml) {
    const idMatch = presXml.match(/<p:sldId[^>]*r:id="([^"]*)"/g)
    if (idMatch) {
      slideIds = idMatch.map(m => m.match(/r:id="([^"]*)"/)?.[1]).filter(Boolean)
    }
  }

  // Map rId -> target via slide rels
  const relsXml = await zip.file('ppt/_rels/presentation.xml.rels')?.async('text')
  const rIdToTarget = {}
  if (relsXml) {
    const relMatches = relsXml.match(/<Relationship[^>]*\/>/g) || []
    relMatches.forEach(rel => {
      const idMatch = rel.match(/Id="([^"]*)"/)
      const targetMatch = rel.match(/Target="([^"]*)"/)
      if (idMatch && targetMatch) rIdToTarget[idMatch[1]] = targetMatch[1]
    })
  }

  // Build ordered slide paths
  const slidePaths = slideIds.map(rid => {
    const target = rIdToTarget[rid]
    if (!target) return null
    return target.startsWith('/') ? `ppt${target}` : `ppt/${target}`
  }).filter(Boolean)

  // Fallback: discover all slide XML files if rels failed
  if (slidePaths.length === 0) {
    zip.forEach((path, file) => {
      if (path.startsWith('ppt/slides/slide') && path.endsWith('.xml')) {
        slidePaths.push(path)
      }
    })
    slidePaths.sort((a, b) => {
      const nA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0', 10)
      const nB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0', 10)
      return nA - nB
    })
  }

  const slides = []
  for (const path of slidePaths) {
    const xml = await zip.file(path)?.async('text')
    if (!xml) continue

    // Extract text nodes inside <a:t> tags (all text in PPTX lives here)
    const texts = []
    const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || []
    textMatches.forEach(m => {
      const text = m.replace(/<a:t>|<\/a:t>/g, '')
      if (text.trim()) texts.push(text.trim())
    })

    slides.push({
      number: slides.length + 1,
      text: texts.join('\n\n'),
    })
  }

  return slides
}

export default function PptxRenderer({ fileUrl, title }) {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (!fileUrl) return
    let cancelled = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await extractPptxSlides(fileUrl)
        if (!cancelled) {
          setSlides(data)
          setActiveSlide(0)
        }
      } catch (err) {
        console.error('[PptxRenderer] Extract error:', err)
        if (!cancelled) setError(err.message || 'Failed to read presentation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [fileUrl])

  return (
    <div className="bg-gray-100 min-h-full py-10" style={{ background: '#F8FAFC', padding: '40px 20px' }}>
      <div className="max-w-5xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: 24,
          padding: '32px 40px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
          border: '1.5px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: '#FFF7ED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FilePpt size={28} color="#F97316" />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#1A102D', margin: 0 }}>
                {title || 'Presentation'}
              </h2>
              <p style={{ color: '#64748B', fontSize: 14, margin: '4px 0 0', fontFamily: 'var(--font-body)' }}>
                {slides.length > 0 ? `${slides.length} slides` : 'Loading slides...'}
              </p>
            </div>
          </div>
          <button
            onClick={() => window.open(fileUrl, '_blank')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', background: '#4B0082', color: 'white',
              border: 'none', borderRadius: 12, cursor: 'pointer',
              fontWeight: 600, fontFamily: 'var(--font-display)', fontSize: 14,
            }}
          >
            <Download size={18} /> Download PPTX
          </button>
        </div>

        {loading && (
          <div style={{
            background: 'white', borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
            border: '1.5px solid #F1F5F9', minHeight: '50vh',
          }}>
            <LuterPageLoader message="Reading presentation slides..." minHeight="100%" />
          </div>
        )}

        {error && !loading && (
          <div style={{
            background: 'white', borderRadius: 24, padding: '60px 40px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9',
            textAlign: 'center',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <FilePpt size={32} color="#EF4444" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Couldn&apos;t read slides</h3>
            <p style={{ color: '#64748B', fontSize: 14, lineHeight: 1.6, marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              {error}
            </p>
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              style={{
                padding: '10px 20px', background: '#4B0082', color: 'white',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontWeight: 600, fontFamily: 'var(--font-display)',
              }}
            >
              Open in PowerPoint
            </button>
          </div>
        )}

        {/* Slide Navigator */}
        {!loading && !error && slides.length > 0 && (
          <>
            {/* Active Slide Card */}
            <div style={{
              background: 'white', borderRadius: 24, padding: '48px 56px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9',
              minHeight: '40vh', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 24, right: 32,
                fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                color: '#94A3B8',
              }}>
                Slide {activeSlide + 1} / {slides.length}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700,
                color: '#1A102D', marginBottom: 24,
              }}>
                Slide {activeSlide + 1}
              </h3>
              <div style={{
                fontFamily: 'var(--font-body)', fontSize: 17, lineHeight: 1.8,
                color: '#334155', whiteSpace: 'pre-wrap',
              }}>
                {slides[activeSlide]?.text || 'This slide has no text content.'}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 40 }}>
                <button
                  onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                  disabled={activeSlide === 0}
                  style={{
                    padding: '10px 20px', borderRadius: 12, border: '1.5px solid #E2E8F0',
                    background: activeSlide === 0 ? '#F8FAFC' : 'white',
                    color: activeSlide === 0 ? '#94A3B8' : '#1A102D',
                    cursor: activeSlide === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontFamily: 'var(--font-display)',
                  }}
                >
                  Previous
                </button>
                <button
                  onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                  disabled={activeSlide >= slides.length - 1}
                  style={{
                    padding: '10px 20px', borderRadius: 12, border: 'none',
                    background: activeSlide >= slides.length - 1 ? '#F8FAFC' : '#4B0082',
                    color: activeSlide >= slides.length - 1 ? '#94A3B8' : 'white',
                    cursor: activeSlide >= slides.length - 1 ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontFamily: 'var(--font-display)',
                  }}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Slide Thumbnails */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              {slides.map((slide, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  style={{
                    background: activeSlide === idx ? '#F3E8FF' : 'white',
                    border: activeSlide === idx ? '2px solid #7a12cc' : '1.5px solid #E2E8F0',
                    borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                    color: activeSlide === idx ? '#7a12cc' : '#94A3B8',
                    marginBottom: 8,
                  }}>
                    Slide {idx + 1}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.5,
                    color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical',
                    wordBreak: 'break-word',
                  }}>
                    {slide.text.slice(0, 200) || 'No text'}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {!loading && !error && slides.length === 0 && (
          <div style={{
            background: 'white', borderRadius: 24, padding: '60px 40px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9',
            textAlign: 'center',
          }}>
            <p style={{ color: '#64748B', fontSize: 16, fontFamily: 'var(--font-body)' }}>
              No readable slides found in this presentation.
            </p>
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              style={{
                marginTop: 20, padding: '10px 20px', background: '#4B0082', color: 'white',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontWeight: 600, fontFamily: 'var(--font-display)',
              }}
            >
              Download to open locally
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
