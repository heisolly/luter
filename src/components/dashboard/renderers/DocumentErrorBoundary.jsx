import React from 'react';

export default class DocumentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DocumentErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444' }}>
          <h3>Failed to load document</h3>
          <p style={{ opacity: 0.8, marginTop: '8px' }}>
            The PDF viewer encountered an unexpected error, likely due to unsupported fonts or corrupted elements within the document.
          </p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: '16px', padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
