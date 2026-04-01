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
    // Automatically use basic viewer without showing error
    if (this.props.useFallback) {
      this.props.useFallback()
    }
  }

  render() {
    if (this.state.hasError) {
      // Don't show any error UI - just return null
      // The basic viewer will be shown automatically via componentDidCatch
      return null
    }

    return this.props.children
  }
}

export default PdfErrorBoundary
