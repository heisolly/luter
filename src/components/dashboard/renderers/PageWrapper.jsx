import React from 'react'

/**
 * PageWrapper — Shared premium container for all document renderers.
 * Ensures every file type renders inside a clean, modern, consistent card.
 */
export default function PageWrapper({
  children,
  className = '',
  style = {},
  padding = '40px 48px',
  maxWidth = '1000px',
  minHeight = '60vh',
}) {
  return (
    <div
      className={`bg-gray-100 min-h-full py-10 ${className}`}
      style={{ background: '#F8FAFC', padding: '40px 20px' }}
    >
      <div
        className="mx-auto"
        style={{
          maxWidth,
          background: 'white',
          borderRadius: 24,
          boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
          border: '1.5px solid #F1F5F9',
          minHeight,
          position: 'relative',
          overflow: 'hidden',
          padding,
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Smaller variant for inline previews, thumbnails, or compact views */
export function CompactWrapper({ children, style = {} }) {
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 10px 25px rgba(0,0,0,0.04)',
        border: '1.5px solid #F1F5F9',
        padding: 24,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Error/fallback state card */
export function ErrorCard({ icon, title, message, actionLabel, onAction }) {
  return (
    <div
      style={{
        padding: '60px 40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
      }}
    >
      {icon && (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          fontWeight: 700,
          color: '#111827',
          marginBottom: 8,
        }}
      >
        {title || 'Something went wrong'}
      </h3>
      <p
        style={{
          color: '#64748B',
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 24,
          maxWidth: 400,
        }}
      >
        {message}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 20px',
            background: '#4B0082',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: 'var(--font-display)',
            fontSize: 14,
          }}
        >
          {actionLabel || 'Try again'}
        </button>
      )}
    </div>
  )
}
