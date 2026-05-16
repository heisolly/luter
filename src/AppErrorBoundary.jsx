import { Component } from 'react'

export default class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #F9FAFB 0%, #F3E8FF 100%)',
          padding: '24px',
          fontFamily: "'Outfit', sans-serif",
          textAlign: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999
        }}>
          {/* Decorative Background Element */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '300px',
            height: '300px',
            background: 'rgba(168, 85, 247, 0.1)',
            borderRadius: '50%',
            filter: 'blur(100px)',
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px', width: '100%' }}>
            {/* Mascot/Icon Placeholder - Using Emoji for robustness */}
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>
              🛸
            </div>

            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 800, 
              color: '#111', 
              marginBottom: '16px',
              letterSpacing: '-0.03em'
            }}>
              Something went sideways
            </h1>

            <p style={{ 
              fontSize: '16px', 
              color: '#64748B', 
              marginBottom: '40px',
              lineHeight: 1.6,
              fontFamily: "'Varela Round', sans-serif"
            }}>
              Don't worry, your study materials are safe. A quick refresh should get everything back on track.
            </p>

            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#A855F7',
                color: 'white',
                border: 'none',
                padding: '18px 40px',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(168, 85, 247, 0.25)',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                fontFamily: "'Outfit', sans-serif"
              }}
            >
              Reload Luter
            </button>

            {/* Subtle Error Detail (Hidden by default, small at bottom) */}
            <p style={{ 
              marginTop: '60px', 
              fontSize: '12px', 
              color: '#94A3B8',
              fontStyle: 'italic',
              opacity: 0.7
            }}>
              {this.state.error.message}
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
