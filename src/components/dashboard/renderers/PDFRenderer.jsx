import React from 'react'
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { searchPlugin } from '@react-pdf-viewer/search'
import { fullScreenPlugin } from '@react-pdf-viewer/full-screen'

// Styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import '@react-pdf-viewer/search/lib/styles/index.css'
import '@react-pdf-viewer/full-screen/lib/styles/index.css'

import { LuterPageLoader } from '../../shared/LuterPageLoader'

const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js'

export default function PDFRenderer({ fileUrl, initialPage, onPageChange, onDocumentLoad, plugins = [] }) {
  const renderPage = (props) => (
    <>
      {props.canvasLayer.children}
      {props.textLayer.children}
      {props.annotationLayer.children}
      <div className="ws-annotation-overlay" />
    </>
  )

  const renderLoader = (percentages) => (
    <LuterPageLoader message={`Loading PDF ${Math.round(percentages)}%...`} minHeight="100%" />
  );

  return (
    <div className="luter-pdf-canvas" style={{ height: 'calc(100vh - 120px)', overflow: 'hidden', background: '#F1F5F9', padding: '20px' }}>
      <div className="ws-paper-sheet" style={{ maxWidth: '1000px', margin: '0 auto', background: 'white', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
        <Worker workerUrl={PDF_WORKER_URL}>
          <Viewer 
            fileUrl={fileUrl} 
            initialPage={initialPage > 0 ? initialPage - 1 : 0}
            onPageChange={onPageChange}
            onDocumentLoad={onDocumentLoad}
            renderPage={renderPage}
            renderLoader={renderLoader}
            theme={{ theme: 'light' }}
            defaultScale={SpecialZoomLevel.PageWidth}
            plugins={plugins}
          />
        </Worker>
      </div>
    </div>
  )
}
