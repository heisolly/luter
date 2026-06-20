import React, { useState } from 'react'
import PageWrapper, { ErrorCard } from './PageWrapper'
import { LuterPageLoader } from '../../shared/LuterPageLoader'
import {
  RiFilePptFill as FilePpt,
  RiDownloadLine as Download,
  RiArrowLeftSLine as ChevronLeft,
  RiArrowRightSLine as ChevronRight,
} from 'react-icons/ri'

export default function ImageSlidesRenderer({ slideImages = [], title, fileUrl }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [imgLoaded, setImgLoaded] = useState({})

  if (!slideImages.length) {
    return (
      <PageWrapper padding={0}>
        <ErrorCard
          icon={<FilePpt size={32} color="#EF4444" />}
          title="No slide images available"
          message="The presentation was converted but no slide images were generated."
          actionLabel="Download PPTX"
          onAction={() => window.open(fileUrl, '_blank')}
        />
      </PageWrapper>
    )
  }

  const current = slideImages[activeIdx]

  return (
    <div className="bg-gray-100 min-h-full py-10" style={{ background: '#F8FAFC', padding: '40px 20px' }}>
      <div className="max-w-5xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <PageWrapper padding="32px 40px" maxWidth="100%" minHeight="auto">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FilePpt size={28} color="#F97316" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 20, fontWeight: 800, color: '#1A102D', margin: 0 }}>
                  {title || 'Presentation'}
                </h2>
                <p style={{ color: '#64748B', fontSize: 14, margin: '4px 0 0', fontFamily: 'var(--font-outfit)' }}>
                  {slideImages.length} slides
                </p>
              </div>
            </div>
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', background: '#4B0082', color: 'white',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                fontWeight: 600, fontFamily: 'var(--font-outfit)', fontSize: 14,
              }}
            >
              <Download size={18} /> Download PPTX
            </button>
          </div>
        </PageWrapper>

        {/* Main Slide */}
        <PageWrapper padding={0} maxWidth="100%" minHeight="50vh">
          <div style={{ position: 'relative', width: '100%', minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0F172A' }}>
            {!imgLoaded[activeIdx] && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
                <LuterPageLoader message={`Loading slide ${activeIdx + 1}...`} minHeight="100%" />
              </div>
            )}
            <img
              src={current}
              alt={`Slide ${activeIdx + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                opacity: imgLoaded[activeIdx] ? 1 : 0,
                transition: 'opacity 0.3s',
              }}
              onLoad={() => setImgLoaded(prev => ({ ...prev, [activeIdx]: true }))}
              onError={() => setImgLoaded(prev => ({ ...prev, [activeIdx]: true }))}
            />

            {/* Navigation arrows */}
            <button
              onClick={() => setActiveIdx(Math.max(0, activeIdx - 1))}
              disabled={activeIdx === 0}
              style={{
                position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: 12, border: 'none',
                background: activeIdx === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                color: activeIdx === 0 ? '#94A3B8' : '#1A102D',
                cursor: activeIdx === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 3,
              }}
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => setActiveIdx(Math.min(slideImages.length - 1, activeIdx + 1))}
              disabled={activeIdx >= slideImages.length - 1}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: 12, border: 'none',
                background: activeIdx >= slideImages.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
                color: activeIdx >= slideImages.length - 1 ? '#94A3B8' : '#1A102D',
                cursor: activeIdx >= slideImages.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 3,
              }}
            >
              <ChevronRight size={24} />
            </button>

            {/* Slide counter badge */}
            <div style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.6)', color: 'white',
              padding: '6px 16px', borderRadius: 20,
              fontFamily: 'var(--font-outfit)', fontSize: 13, fontWeight: 600,
              zIndex: 3,
            }}>
              {activeIdx + 1} / {slideImages.length}
            </div>
          </div>
        </PageWrapper>

        {/* Thumbnails */}
        <PageWrapper padding="20px" maxWidth="100%" minHeight="auto">
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {slideImages.map((src, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                style={{
                  flexShrink: 0,
                  width: 120,
                  height: 80,
                  borderRadius: 12,
                  border: activeIdx === idx ? '2px solid #7a12cc' : '2px solid transparent',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  padding: 0,
                  position: 'relative',
                  background: '#F1F5F9',
                }}
              >
                <img
                  src={src}
                  alt={`Thumb ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(0,0,0,0.5)', color: 'white',
                  fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-outfit)',
                  padding: '4px 0', textAlign: 'center',
                }}>
                  {idx + 1}
                </div>
              </button>
            ))}
          </div>
        </PageWrapper>
      </div>
    </div>
  )
}
