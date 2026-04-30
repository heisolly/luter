import React from 'react'
import PDFRenderer from './PDFRenderer'
import OfficeRenderer from './OfficeRenderer'
import TextRenderer from './TextRenderer'
import ExcelRenderer from './ExcelRenderer'
import ReactPlayer from 'react-player'
import QuickPinchZoom, { make3dTransformValue } from 'react-quick-pinch-zoom'
import { RiMusicFill as Music } from "react-icons/ri"

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

export default function UniversalViewer({ material, initialPage, onPageChange, onDocumentLoad, plugins }) {
  const type = getFileType(material)
  const fileUrl = material?.source_url

  if (!fileUrl && type !== 'text') {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <span style={{ fontSize: '32px' }}>🔗</span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-outfit)', fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Source URL Missing</h3>
          <p style={{ color: '#64748B', fontSize: '14px', lineHeight: '1.6' }}>
            We couldn't locate the source file for this material. This might happen if the file was deleted or moved.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ws-universal-viewer" style={{ height: '100%', overflowY: 'auto' }}>
      {type === 'pdf' && (
        <PDFRenderer 
          fileUrl={fileUrl} 
          initialPage={initialPage} 
          onPageChange={onPageChange} 
          onDocumentLoad={onDocumentLoad} 
          plugins={plugins} 
        />
      )}

      {(type === 'docx' || type === 'pptx') && (
        <OfficeRenderer fileUrl={fileUrl} type={type} />
      )}

      {type === 'excel' && (
        <ExcelRenderer fileUrl={fileUrl} />
      )}

      {type === 'text' && (
        <TextRenderer content={material.extracted_text} title={material.title} />
      )}

      {type === 'image' && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '40px' }}>
          <QuickPinchZoom onUpdate={({ x, y, scale }) => {
            const img = document.getElementById('zoom-img')
            if (img) img.style.transform = make3dTransformValue({ x, y, scale })
          }} enforceBounds>
            <img id="zoom-img" src={fileUrl} alt="Visual" style={{ maxWidth: '100%', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
          </QuickPinchZoom>
        </div>
      )}

      {type === 'video' && (
        <div style={{ height: '100%', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ReactPlayer url={fileUrl} controls width="100%" height="100%" />
        </div>
      )}

      {type === 'audio' && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32, background: '#F8FAFC' }}>
           <div style={{ 
             width: '120px', height: '120px', borderRadius: '40px', 
             background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
             boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9'
           }}>
             <Music size={64} color="#4B0082" weight="bold" />
           </div>
           <div style={{ textAlign: 'center' }}>
             <h3 style={{ fontFamily: 'var(--font-outfit)', fontWeight: 800, fontSize: '20px', color: '#1A102D', marginBottom: '8px' }}>AUDIO LECTURE</h3>
             <p style={{ fontFamily: 'var(--font-varela)', color: '#64748B', fontSize: '14px' }}>{material.title}</p>
           </div>
           <audio controls src={fileUrl} style={{ width: '400px' }} />
        </div>
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
    </div>
  )
}
