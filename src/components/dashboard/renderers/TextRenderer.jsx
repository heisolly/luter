import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function TextRenderer({ content, title }) {
  return (
    <div className="bg-gray-100 min-h-full py-10" style={{ background: '#F8FAFC' }}>
      <div className="max-w-4xl mx-auto">
        <div style={{ background: 'white', padding: '60px', borderRadius: '32px', border: '1.5px solid #E2E8F0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)' }}>
          {title && <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: '32px', fontWeight: 800, marginBottom: '32px', color: '#1A102D' }}>{title}</h1>}
          <div className="markdown-body" style={{ fontSize: '17px', lineHeight: 1.8, color: '#2D3748' }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "No content available."}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
