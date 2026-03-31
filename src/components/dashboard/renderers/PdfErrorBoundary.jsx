import React from 'react'

class PdfErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('PDF Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when PDF rendering fails
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: '20px',
          background: '#F8FAFC',
          fontFamily: 'Outfit'
        }}>
          <div style={{
            background: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#DC2626', margin: '0 0 8px 0', fontSize: '16px' }}>
              PDF Viewer Error
            </h3>
            <p style={{ color: '#7F1D1D', margin: '0 0 16px 0', fontSize: '14px' }}>
              The advanced PDF viewer encountered an error. Falling back to basic viewer.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                style={{
                  padding: '8px 16px',
                  background: '#7a12cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Try Advanced Again
              </button>
              <button
                onClick={this.props.useFallback}
                style={{
                  padding: '8px 16px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                Use Basic Viewer
              </button>
              <a
                href={this.props.material?.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-block'
                }}
              >
                Open in New Tab
              </a>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '16px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', fontSize: '12px', color: '#64748B' }}>
                  Error Details (Development)
                </summary>
                <pre style={{ 
                  fontSize: '11px', 
                  color: '#374151', 
                  background: '#F3F4F6', 
                  padding: '8px', 
                  borderRadius: '4px',
                  marginTop: '8px',
                  overflow: 'auto',
                  maxHeight: '100px'
                }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default PdfErrorBoundary
