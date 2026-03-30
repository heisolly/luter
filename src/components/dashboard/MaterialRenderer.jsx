import React, { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load specific rendering engines
const PdfRenderer = lazy(() => import('./renderers/PdfRenderer'))
const VideoRenderer = lazy(() => import('./renderers/VideoRenderer'))
const OfficeRenderer = lazy(() => import('./renderers/OfficeRenderer'))
const AnkiRenderer = lazy(() => import('./renderers/AnkiRenderer'))
const NoteRenderer = lazy(() => import('./renderers/NoteRenderer'))

export default function MaterialRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  if (!material) return null

  // Strategy detection based on file type/extension
  const getRenderer = () => {
    const type = material.type?.toLowerCase()
    const url = material.source_url || ''
    
    // 1. YouTube & Video
    if (type === 'youtube' || url.includes('youtube.com') || url.includes('youtu.be')) {
      return <VideoRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 2. Anki Imports (.apkg)
    if (type === 'anki' || url.endsWith('.apkg')) {
      return <AnkiRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 3. Office Docs (Word & PowerPoint)
    if (['docx', 'pptx', 'doc', 'ppt'].includes(type)) {
      return <OfficeRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 4. PDFs (High Precision)
    if (type === 'pdf' || url.endsWith('.pdf')) {
      return <PdfRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }

    // 5. Google Docs (Embed Strategy)
    if (url.includes('docs.google.com')) {
      return <OfficeRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
    }
    
    // Default to a markdown/note renderer
    return <NoteRenderer material={material} activeTab={activeTab} analysisState={analysisState} onRunAnalysis={onRunAnalysis} />
  }

  return (
    <div className="ws-canvas-container" style={{ width: '100%', height: '100%' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Loading Viewing Engine...</p>
        </div>
      }>
        {getRenderer()}
      </Suspense>
    </div>
  )
}
