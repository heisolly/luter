/**
 * MaterialRenderer — Thin router that decides which view to show.
 * Now backed entirely by the LangChain pipeline.
 * Old multi-renderer system has been removed.
 */

import React, { Suspense, lazy } from 'react'
import { RiLoader4Line as Loader2 } from 'react-icons/ri'

// The single unified viewer
const DocumentViewer = lazy(() => import('./renderers/DocumentViewer'))

const LoadingFallback = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
    <Loader2 className="animate-spin" color="#7a12cc" size={32} />
    <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600, margin: 0 }}>Loading Viewer…</p>
  </div>
)

export default function MaterialRenderer({ material, activeTab, analysisState, onRunAnalysis, onScrollUpdate }) {
  if (!material) return null

  // Only mount the viewer when we're on the content tab
  if (activeTab !== 'content') return null

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Suspense fallback={<LoadingFallback />}>
        <DocumentViewer
          material={material}
          onScrollUpdate={onScrollUpdate}
        />
      </Suspense>
    </div>
  )
}
