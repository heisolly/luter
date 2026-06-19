import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function TextRenderer({ content, title }) {
  return (
    <div className="min-h-full" style={{ background: '#F8FAFC', padding: '20px' }}>
      <div style={{ maxWidth: '100%' }}>
        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
          {title && <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700, marginBottom: '24px', color: '#1A102D' }}>{title}</h1>}
          <div className="markdown-body" style={{ fontSize: '15px', lineHeight: 1.7, color: '#2D3748', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "No content available."}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
