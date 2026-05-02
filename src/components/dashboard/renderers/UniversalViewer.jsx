import React from 'react'
import FlashkaDocumentViewer from './FlashkaDocumentViewer'
import DocxRenderer from './DocxRenderer'
import PptxRenderer from './PptxRenderer'
import ImageSlidesRenderer from './ImageSlidesRenderer'
import TextRenderer from './TextRenderer'
import ExcelRenderer from './ExcelRenderer'
import YouTubeRenderer from './YouTubeRenderer'
import AudioRenderer from './AudioRenderer'
import VideoRenderer from './VideoRenderer'
import ImageRenderer from './ImageRenderer'
import ReactPlayer from 'react-player'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom'
import { RiMusicFill as Music, RiSparklingFill as Sparkle } from "react-icons/ri"
import { LuterPageLoader } from '../../shared/LuterPageLoader'

export const getFileType = (material) => {
  if (!material) return 'unknown'
  const type = (material.type || '').toLowerCase()
  const url = (material.source_url || '').toLowerCase()

  if (type === 'pdf' || url.endsWith('.pdf')) return 'pdf'
  if (type === 'docx' || type === 'doc' || url.endsWith('.docx') || url.endsWith('.doc')) return 'docx'
  if (type === 'pptx' || type === 'ppt' || url.endsWith('.pptx') || url.endsWith('.ppt')) return 'pptx'
  if (type === 'xlsx' || type === 'xls' || type === 'csv' || url.endsWith('.xlsx') || url.endsWith('.xls') || url.endsWith('.csv')) return 'excel'
  if (type === 'image' || url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) return 'image'
  if (type === 'video' || type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) return 'video'
  if (type === 'audio' || url.match(/\.(mp3|wav|ogg|m4a)$/)) return 'audio'
  if (type === 'text' || type === 'md' || url.endsWith('.txt') || url.endsWith('.md')) return 'text'

  return 'unknown'
}

/** Check if material has a high-fidelity converted version ready */
function hasConvertedPdf(material) {
  return !!material?.converted_url
}

function hasSlideImages(material) {
  const imgs = material?.slide_images
  return Array.isArray(imgs) && imgs.length > 0
}

/**
 * UniversalViewer — Flashka philosophy: normalize everything to one experience.
 *
 * Priority:
 * 1. High-fidelity converted PDF → FlashkaDocumentViewer (single engine, perfect consistency)
 * 2. Slide images (for PPTX) → ImageSlidesRenderer (visual fidelity)
 * 3. Native renderer → DocxRenderer / PptxRenderer / ExcelRenderer (fallback while converting)
 * 4. Video / Audio / Image → Native (these don't convert)
 * 5. Text → TextRenderer
 */
export default function UniversalViewer({ material, initialPage, onPageChange, onDocumentLoad }) {
  const type = getFileType(material)
  const fileUrl = material?.source_url

  // ─── 1. HIGH-FIDELITY PDF (THE FLASHKA WAY) ─────────────────────────────
  if (hasConvertedPdf(material)) {
    return (
      <FlashkaDocumentViewer
        fileUrl={material.converted_url}
        title={material.title}
        type={type}
        onPageChange={onPageChange}
        onDocumentLoad={onDocumentLoad}
      />
    )
  }

  // ─── 2. SLIDE IMAGES (PPTX visual fallback) ───────────────────────────────
  if (hasSlideImages(material)) {
    return (
      <ImageSlidesRenderer
        slideImages={material.slide_images}
        title={material.title}
        fileUrl={fileUrl}
      />
    )
  }

  // ─── 3. MISSING SOURCE URL ────────────────────────────────────────────────
  if (!fileUrl && type !== 'text') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: '32px' }}>🔗</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Source URL Missing</h3>
          <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.6' }}>
            We couldn&apos;t locate the source file. This might happen if the file was deleted or moved.
          </p>
        </div>
      </div>
    )
  }

  // ─── 4. CONVERSION PENDING (show native + banner) ─────────────────────────
  const isConverting = material?.render_quality === 'native' && ['docx', 'pptx', 'excel'].includes(type)

  return (
    <>
      {isConverting && (
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: '#FFF7ED', borderBottom: '1.5px solid #FED7AA',
          padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Sparkle size={18} color="#F97316" />
          <span style={{ fontFamily: 'var(--font-outfit)', fontSize: 13, fontWeight: 600, color: '#9A3412' }}>
            Converting to high-fidelity view… native preview shown below.
          </span>
        </div>
      )}

      {type === 'pdf' && (
        <FlashkaDocumentViewer
          fileUrl={fileUrl}
          title={material.title}
          type={type}
          onPageChange={onPageChange}
          onDocumentLoad={onDocumentLoad}
        />
      )}

      {type === 'docx' && (
        <DocxRenderer fileUrl={fileUrl} title={material.title} />
      )}

      {type === 'pptx' && (
        <PptxRenderer fileUrl={fileUrl} title={material.title} />
      )}

      {type === 'excel' && (
        <ExcelRenderer fileUrl={fileUrl} />
      )}

      {type === 'text' && (
        <TextRenderer content={material.extracted_text} title={material.title} />
      )}

      {type === 'image' && (
        <ImageRenderer fileUrl={fileUrl} title={material.title} />
      )}

      {type === 'video' && (
        material.type === 'youtube' ? (
          <YouTubeRenderer url={fileUrl} />
        ) : (
          <VideoRenderer fileUrl={fileUrl} title={material.title} />
        )
      )}

      {type === 'audio' && (
        <AudioRenderer fileUrl={fileUrl} title={material.title} />
      )}

      {type === 'unknown' && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontFamily: 'var(--font-outfit)' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: 700 }}>Unsupported file format</p>
            <p style={{ fontSize: '14px' }}>{material?.title}</p>
            <button
              onClick={() => window.open(fileUrl, '_blank')}
              style={{ marginTop: '20px', padding: '10px 20px', background: '#4B0082', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
            >
              Download anyway
            </button>
          </div>
        </div>
      )}
    </>
  )
}
