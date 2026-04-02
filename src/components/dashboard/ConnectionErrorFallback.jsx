import { AlertCircle, Wifi, WifiOff } from 'lucide-react'

export const ConnectionErrorFallback = ({ onRetry }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      border: '1.5px solid #fef2f2',
      padding: '32px',
      textAlign: 'center',
      margin: '20px 0'
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: '#fef2f2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px'
      }}>
        <WifiOff size={32} color="#ef4444" />
      </div>
      
      <h3 style={{
        fontSize: 18,
        fontWeight: 800,
        color: '#111',
        margin: '0 0 8px'
      }}>
        Connection Issues
      </h3>
      
      <p style={{
        fontSize: 14,
        color: '#64748b',
        margin: '0 0 20px',
        lineHeight: 1.5
      }}>
        Having trouble connecting to the battle servers. Some features may be limited.
      </p>
      
      <button
        onClick={onRetry}
        style={{
          padding: '12px 24px',
          background: '#7a12cc',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <Wifi size={16} />
        Try Again
      </button>
    </div>
  )
}
