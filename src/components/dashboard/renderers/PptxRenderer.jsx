import React, { useState } from 'react'
import { CircleNotch } from '@phosphor-icons/react'

export default function PptxRenderer({ fileUrl, title }) {
  const [loading, setLoading] = useState(true)
  
  // Encodes the URL so Microsoft can fetch and render it
  const microsoftViewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', background: '#F8FAFC' }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <CircleNotch className="ws-spin" color="#4B0082" size={32} weight="bold" />
            <div style={{ color: '#64748B', fontWeight: 500 }}>Loading presentation...</div>
          </div>
        </div>
      )}
      <iframe
        src={microsoftViewer}
        style={{ 
          width: '100%', 
          height: '100%',
          border: 'none',
          pointerEvents: 'auto'
        }}
        onLoad={() => setLoading(false)}
        title={title || "Office Document"}
      />
    </div>
  )
}
