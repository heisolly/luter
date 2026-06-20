import { useEffect } from 'react'

const CSS = `
  @keyframes lpl-pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.03); }
  }
  @keyframes lpl-progress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }
  @keyframes lpl-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .lpl-root {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Outfit', 'Outfit', sans-serif;
    background: transparent;
    gap: 24px;
    animation: lpl-fade-in 0.3s ease both;
  }

  .lpl-logo {
    height: 48px;
    width: auto;
    object-fit: contain;
    animation: lpl-pulse 2s ease-in-out infinite;
  }

  .lpl-track {
    width: 160px;
    height: 3px;
    border-radius: 99px;
    background: rgba(196, 181, 253, 0.2);
    overflow: hidden;
  }

  .lpl-bar {
    height: 100%;
    border-radius: 99px;
    background: linear-gradient(90deg, #7a12cc, #a855f7);
    animation: lpl-progress 2s ease-in-out infinite;
  }

  body.dark-mode .lpl-logo {
    filter: brightness(0) invert(1);
  }
  body.dark-mode .lpl-track {
    background: rgba(196, 181, 253, 0.1);
  }

  /* Inline variant */
  .lpl-inline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 32px 0;
    animation: lpl-fade-in 0.3s ease both;
  }
  .lpl-inline-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #c4b5fd;
    animation: lpl-bounce 1.2s ease-in-out infinite both;
  }
  .lpl-inline-dot:nth-child(2) { animation-delay: 0.15s; }
  .lpl-inline-dot:nth-child(3) { animation-delay: 0.3s; }
  @keyframes lpl-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }

  /* Content skeletons */
  .lpl-skel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    animation: lpl-fade-in 0.3s ease both;
  }
  .lpl-skel-row {
    display: flex;
    gap: 12px;
  }
  .lpl-skel-block {
    border-radius: 10px;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 600px 100%;
    animation: lpl-shimmer 1.5s infinite;
  }
  @keyframes lpl-shimmer {
    0% { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  body.dark-mode .lpl-skel-block {
    background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
    background-size: 600px 100%;
  }
`

let cssInjected = false

function injectCSS() {
  if (cssInjected) return
  const style = document.createElement('style')
  style.id = 'luter-page-loader-css'
  style.textContent = CSS
  document.head.appendChild(style)
  cssInjected = true
}

export const LuterPageLoader = ({ minHeight = '100vh' }) => {
  useEffect(injectCSS, [])

  return (
    <div className="lpl-root" style={{ minHeight }}>
      <img className="lpl-logo" src="/logo.png" alt="Luter" />
      <div className="lpl-track">
        <div className="lpl-bar" />
      </div>
    </div>
  )
}

export const LuterInlineLoader = () => {
  useEffect(injectCSS, [])

  return (
    <div className="lpl-inline">
      <div className="lpl-inline-dot" />
      <div className="lpl-inline-dot" />
      <div className="lpl-inline-dot" />
    </div>
  )
}

export function ContentSkeleton({ rows = 3, cols = 1, height = 20, width = '100%', style = {} }) {
  useEffect(injectCSS, [])

  const items = Array.from({ length: rows * cols })
  return (
    <div className="lpl-skel" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, ...style }}>
      {items.map((_, i) => (
        <div key={i} className="lpl-skel-block" style={{ height, width: cols > 1 ? '100%' : width }} />
      ))}
    </div>
  )
}

export function CardSkeleton({ count = 6 }) {
  useEffect(injectCSS, [])
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9', background: 'white' }}>
          <div className="lpl-skel-block" style={{ height: 120, borderRadius: 0 }} />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="lpl-skel-block" style={{ height: 14, width: '70%' }} />
            <div className="lpl-skel-block" style={{ height: 10, width: '40%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 5 }) {
  useEffect(injectCSS, [])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'white', border: '1px solid #f1f5f9' }}>
          <div className="lpl-skel-block" style={{ width: 36, height: 36, borderRadius: 8 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div className="lpl-skel-block" style={{ height: 13, width: '60%' }} />
            <div className="lpl-skel-block" style={{ height: 10, width: '30%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

export default LuterPageLoader
