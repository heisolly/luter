import React, { useState } from 'react'
import { LuterPageLoader } from '../../shared/LuterPageLoader'

export default function OfficeRenderer({ fileUrl, type }) {
  const [loading, setLoading] = useState(true)
  
  // Encodes the URL so Microsoft can fetch and render it
  const microsoftViewer = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`

  return (
    <div className="bg-gray-100 min-h-full py-10" style={{ background: '#F8FAFC' }}>
      <div className="max-w-5xl mx-auto" style={{ height: 'calc(100vh - 200px)', position: 'relative', overflow: 'hidden', background: 'white', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', border: '1.5px solid #F1F5F9' }}>
        {loading && (
          <LuterPageLoader message="Opening Office document..." minHeight="100%" />
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
          title="Office Document"
        />
      </div>
    </div>
  )
}
