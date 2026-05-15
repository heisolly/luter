/**
 * MaterialRenderer — Thin router that decides which view to show.
 * Now backed entirely by the LangChain pipeline.
 * Old multi-renderer system has been removed.
 */

import React, { Suspense, lazy } from 'react'
import { RiLoader4Line as Loader2 } from 'react-icons/ri'

// The single unified viewer
const DocumentViewer = lazy(() => import('./renderers/DocumentViewer'))

import { LuterPageLoader } from '../shared/LuterPageLoader'
import { reprocessMaterial } from '../../services/langchainPipeline'

const LoadingFallback = () => (
  <LuterPageLoader message="Preparing your workstation..." minHeight="100%" />
)

export default function MaterialRenderer({ material, activeTab, onSparkUpdate, setViewportData, onScrollUpdate, onMaterialUpdate }) {
  if (!material) return null

  // Keep the viewer mounted even if not on content tab to prevent expensive reloads
  // We handle the UI visibility in the parent WorkstationPage


  // If material is still processing, show the professional pending state
  if (material.processing_status === 'pending' || material.processing_status === 'processing') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <LuterPageLoader message="Luter is optimizing this material for your study workstation..." minHeight="300px" />
      </div>
    )
  }

  // If processing failed, show a retry state
  if (material.processing_status === 'failed') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '40px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: '32px' }}>⚠️</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '12px' }}>Processing Failed</h3>
          <p style={{ color: '#6B7280', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
            We encountered an issue while optimizing this material for your workstation. This usually happens with complex PDFs or network interruptions.
          </p>
          <button 
            onClick={async () => {
              const res = await reprocessMaterial(material)
              if (res.success) {
                // Polling will pick it up or it's already updated in DB
                window.location.reload() // Simple way to reset state for now
              }
            }}
            style={{ 
              width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', 
              border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font-outfit)'
            }}
          >
            Retry Optimization
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Suspense fallback={<LoadingFallback />}>
        <DocumentViewer
          material={material}
          onScrollUpdate={onScrollUpdate}
          onSparkUpdate={onSparkUpdate}
          setViewportData={setViewportData}
          onMaterialUpdate={onMaterialUpdate}
        />
      </Suspense>
    </div>
  )
}
