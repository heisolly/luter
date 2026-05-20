/* eslint-disable no-unused-vars, react-hooks/rules-of-hooks, react-hooks/exhaustive-deps, react-refresh/only-export-components */
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
import ConversionSkeleton from './ConversionSkeleton'
import { pollConversionStatus } from '../../../services/materialsService'

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

/** Determine if a material type is one that gets converted to PDF */
function isConvertibleToPdf(type) {
  return ['docx', 'doc', 'pptx', 'ppt'].includes(type)
}

/**
 * UniversalViewer — Flashka philosophy: normalize everything to one experience.
 *
 * Priority:
 * 1. High-fidelity converted PDF → FlashkaDocumentViewer
 * 2. Native PDF → FlashkaDocumentViewer
 * 3. DOCX → DocxRenderer (fallback only, no raw text)
 * 4. PPTX → ConversionSkeleton (wait for PDF conversion)
 * 5. Everything else → appropriate native renderer
 */
export default function UniversalViewer({
  material,
  initialPage,
  onPageChange,
  onDocumentLoad,
  onMaterialUpdate,
  annotateMode = false,
  highlightMode = false,
  commentMode = false,
  focusModeTool = false,
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
  initCanvas,
  startDrawing,
  draw,
  stopDrawing,
  drawMode,
  loadHighlights,
  setHighlightToolbox,
}) {
  if (!material) return null

  const type = getFileType(material)
  const fileUrl = material?.source_url
  const [conversionFailed, setConversionFailed] = useState(false)

  console.log('[UniversalViewer] Render state:', {
    type,
    has_converted_url: !!material?.converted_url,
    converted_url: material?.converted_url,
    material_id: material?.id
  })

  // ─── Poll for converted_url when PPTX has no converted_url yet ────────────
  useEffect(() => {
    if (type !== 'pptx' && type !== 'docx') return
    if (hasConvertedPdf(material)) return
    if (conversionFailed) return

    console.log(`[UniversalViewer] Starting conversion poll for ${material.id} (${type})`)
    const cleanup = pollConversionStatus(material.id, {
      onConverted: (data) => {
        console.log(`[UniversalViewer] Conversion ready for ${material.id}, triggering update`)
        onMaterialUpdate?.({ converted_url: data.converted_url, converted_type: data.converted_type })
      },
      onFailed: () => {
        console.warn(`[UniversalViewer] Conversion failed for ${material.id}`)
        setConversionFailed(true)
      },
      intervalMs: 3000,
      maxAttempts: 120, // 6 minutes
    })

    return cleanup
  }, [material.id, type, material.converted_url, conversionFailed])

  // ─── 1. CONVERTED PDF (highest fidelity) ────────────────────────────────
  if (hasConvertedPdf(material)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ height: '100%' }}
      >
        <FlashkaDocumentViewer
          fileUrl={material.converted_url}
          initialPage={initialPage}
          title={material.title}
          type={type}
          onPageChange={onPageChange}
          onDocumentLoad={onDocumentLoad}
          annotateMode={annotateMode}
          highlightMode={highlightMode}
          commentMode={commentMode}
          focusModeTool={focusModeTool}
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
          initCanvas={initCanvas}
          startDrawing={startDrawing}
          draw={draw}
          stopDrawing={stopDrawing}
          drawMode={drawMode}
          loadHighlights={loadHighlights}
          setHighlightToolbox={setHighlightToolbox}
          material={material}
        />
      </motion.div>
    )
  }

  // ─── 2. NATIVE PDF ───────────────────────────────────────────────────────
  if (type === 'pdf') {
    return (
      <FlashkaDocumentViewer
        fileUrl={fileUrl}
        initialPage={initialPage}
        title={material.title}
        type={type}
        onPageChange={onPageChange}
        onDocumentLoad={onDocumentLoad}
        annotateMode={annotateMode}
        highlightMode={highlightMode}
        commentMode={commentMode}
        focusModeTool={focusModeTool}
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
        initCanvas={initCanvas}
        startDrawing={startDrawing}
        draw={draw}
        stopDrawing={stopDrawing}
        drawMode={drawMode}
        loadHighlights={loadHighlights}
        setHighlightToolbox={setHighlightToolbox}
        material={material}
      />
    )
  }

  // ─── 3. PPTX — show skeleton while converting, or error if failed ───────
  if (type === 'pptx') {
    return <ConversionSkeleton type="pptx" failed={conversionFailed} onRetry={() => setConversionFailed(false)} />
  }

  // ─── 4. MISSING SOURCE URL ────────────────────────────────────────────────
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

  // ─── 5. EVERYTHING ELSE → native renderer ───────────────────────────────
  if (type === 'docx') {
    return <DocxRenderer fileUrl={fileUrl} title={material.title} />
  }

  if (type === 'excel') {
    return <ExcelRenderer fileUrl={fileUrl} />
  }

  if (type === 'text') {
    return <TextRenderer content={material.extracted_text} title={material.title} />
  }

  if (type === 'image') {
    return <ImageRenderer fileUrl={fileUrl} title={material.title} />
  }

  if (type === 'video') {
    return material.type === 'youtube'
      ? <YouTubeRenderer url={fileUrl} />
      : <VideoRenderer fileUrl={fileUrl} title={material.title} />
  }

  if (type === 'audio') {
    return <AudioRenderer fileUrl={fileUrl} title={material.title} />
  }

  return (
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
  )
}
