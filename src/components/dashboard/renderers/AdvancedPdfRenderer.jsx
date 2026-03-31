import React, { useState, useCallback } from 'react'
import { Viewer, Worker } from '@react-pdf-viewer/core'
import { selectionModePlugin } from '@react-pdf-viewer/selection-mode'
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { Highlighter, Palette, X, Bot } from 'lucide-react'
import { useReadingSpace } from '../ReadingSpaceContext'
import { DocumentContextService } from '../../../services/documentContextService'

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'

// Use the local worker since we now have compatible version installed
const PDF_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

export default function AdvancedPdfRenderer({ material, activeTab, analysisState, onRunAnalysis, onProgressUpdate }) {
  const { setViewportData, updateSelection, drawCommands, highlightText } = useReadingSpace()
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [userHighlights, setUserHighlights] = useState([])
  const [showActionBubble, setShowActionBubble] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectionRegion, setSelectionRegion] = useState(null)
  const [pdfError, setPdfError] = useState(null)
  const [highlightColors] = useState([
    { name: 'Yellow', color: '#FEF3C7', border: '#F59E0B' },
    { name: 'Green', color: '#D1FAE5', border: '#10B981' },
    { name: 'Blue', color: '#DBEAFE', border: '#3B82F6' },
    { name: 'Purple', color: '#E9D5FF', border: '#8B5CF6' },
    { name: 'Pink', color: '#FCE7F3', border: '#EC4899' }
  ])

  // Initialize plugins
  const selectionModePluginInstance = selectionModePlugin()
  const defaultLayoutPluginInstance = defaultLayoutPlugin()

  // Extract selection plugin
  const { renderSelection } = selectionModePluginInstance
  const { activateSelectionMode } = selectionModePluginInstance

  // Handle PDF page change
  const handlePageChange = useCallback(({ currentPage }) => {
    setCurrentPage(currentPage + 1) // Convert 0-based to 1-based
    
    // Update progress tracking
    if (onProgressUpdate) {
      onProgressUpdate({
        currentPage: currentPage + 1,
        totalPages,
        scrollPercent: ((currentPage + 1) / totalPages) * 100,
        timestamp: Date.now(),
        documentType: 'pdf'
      })
    }
  }, [totalPages, onProgressUpdate])

  // Handle PDF load
  const handleDocumentLoad = useCallback(({ doc }) => {
    setTotalPages(doc.numPages)
    setCurrentPage(1)
    setPdfError(null) // Clear any previous errors
    
    // Update viewport data
    setViewportData({
      visibleText: '',
      scrollPercent: 0,
      currentPage: 1,
      documentType: 'pdf'
    })
  }, [setViewportData])

  // Handle PDF errors
  const handlePdfError = useCallback((error) => {
    console.error('PDF loading error:', error)
    
    // Check if it's a version mismatch error
    const errorMessage = error?.message || error?.toString() || ''
    if (errorMessage.includes('does not match the Worker version')) {
      setPdfError('PDF version mismatch detected. The system will automatically use a compatible viewer.')
      // Auto-trigger fallback after a short delay
      setTimeout(() => {
        useFallbackViewer()
      }, 2000)
    } else if (errorMessage.includes('CORS') || 
               errorMessage.includes('worker') || 
               errorMessage.includes('404') ||
               errorMessage.includes('fake worker')) {
      setPdfError('PDF viewer encountered a CORS or worker issue. Click "Use Basic Viewer" for a compatible alternative.')
    } else {
      setPdfError(errorMessage || 'Failed to load PDF')
    }
  }, [useFallbackViewer])

  // Retry PDF loading
  const retryPdfLoading = useCallback(() => {
    setPdfError(null)
    // Force re-render by updating a key or state
    window.location.reload()
  }, [])

  // Use fallback viewer
  const useFallbackViewer = useCallback(() => {
    // This will be handled by the parent component
    if (window.triggerPdfFallback) {
      window.triggerPdfFallback()
    } else {
      // Fallback: reload page with fallback parameter
      const url = new URL(window.location)
      url.searchParams.set('pdfFallback', 'true')
      window.location.href = url.toString()
    }
  }, [])

  // Selection handler - this is the key part!
  const handleSelection = useCallback(({ selectedText, selectionRegion }) => {
    if (selectedText.trim()) {
      setSelectedText(selectedText)
      setSelectionRegion(selectionRegion)
      setShowActionBubble(true)
      
      // Update selection in context
      updateSelection({
        text: selectedText,
        rect: selectionRegion,
        visible: true
      })
    } else {
      setShowActionBubble(false)
      setSelectedText('')
      setSelectionRegion(null)
    }
  }, [updateSelection])

  // Send to AI tutor with comprehensive context using DocumentContextService
  const sendToAITutor = useCallback(() => {
    if (!selectedText) return
    
    // Create comprehensive context using the service
    const fullContext = DocumentContextService.createContext(
      'pdf', // document type
      material, // material info
      {
        currentPage,
        totalPages,
        coordinates: selectionRegion,
        zoomLevel: 1.0,
        viewportInfo: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }, // location info
      {
        text: selectedText,
        selectedText: selectedText
      }, // selected content
      {
        userHighlights: userHighlights.length,
        documentProgress: totalPages > 0 ? (currentPage / totalPages) * 100 : 0,
        sessionTime: Date.now() - (material?.sessionStartTime || Date.now()),
        isSelectionMode: true
      }, // reading context
      {
        component: 'AdvancedPdfRenderer',
        viewer: 'react-pdf-viewer',
        coordinateSystem: 'pdf-relative',
        renderingMethod: 'canvas-render'
      } // system context
    )
    
    // Send to AI tutor using the service
    DocumentContextService.sendToAITutor(fullContext)
    
    // Close action bubble
    setShowActionBubble(false)
    setSelectedText('')
    setSelectionRegion(null)
  }, [selectedText, selectionRegion, currentPage, totalPages, userHighlights, material])

  // Create highlight
  const createHighlight = useCallback((colorIndex) => {
    if (!selectedText || !selectionRegion) return
    
    const newHighlight = {
      id: Date.now(),
      text: selectedText,
      color: highlightColors[colorIndex],
      position: {
        ...selectionRegion,
        page: currentPage - 1
      },
      timestamp: Date.now(),
      type: 'user'
    }
    
    setUserHighlights(prev => [...prev, newHighlight])
    
    // Also add to AI system
    if (window.luterAI?.highlightPdfArea) {
      window.luterAI.highlightPdfArea({
        pageIndex: currentPage - 1,
        left: selectionRegion.left,
        top: selectionRegion.top,
        width: selectionRegion.width,
        height: selectionRegion.height,
        label: highlightColors[colorIndex].name,
        color: highlightColors[colorIndex].border
      })
    }
    
    // Close action bubble
    setShowActionBubble(false)
    setSelectedText('')
    setSelectionRegion(null)
  }, [selectedText, selectionRegion, currentPage, highlightColors])

  // Render the action bubble
  const renderActionBubble = useCallback((props) => {
    if (!showActionBubble || !selectionRegion) return null
    
    return (
      <div
        style={{
          position: 'absolute',
          left: selectionRegion.left + selectionRegion.width / 2 - 100,
          top: selectionRegion.top - 80,
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 1000,
          fontFamily: 'Outfit',
          minWidth: '200px'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          paddingBottom: '4px',
          borderBottom: '1px solid #E5E7EB'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A102D' }}>
            "{selectedText.substring(0, 25)}{selectedText.length > 25 ? '...' : ''}"
          </span>
          <button
            onClick={() => {
              setShowActionBubble(false)
              setSelectedText('')
              setSelectionRegion(null)
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              color: '#64748B'
            }}
          >
            <X size={14} />
          </button>
        </div>
        
        {/* Send to AI Tutor Button */}
        <button
          onClick={sendToAITutor}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: '#7a12cc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '8px'
          }}
        >
          <Bot size={14} />
          Send to AI Tutor
        </button>
        
        {/* Color selection */}
        <div style={{ marginBottom: '4px' }}>
          <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>
            Or highlight with color:
          </div>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {highlightColors.map((color, index) => (
              <button
                key={index}
                onClick={() => createHighlight(index)}
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: color.color,
                  border: `2px solid ${color.border}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)'
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }, [showActionBubble, selectionRegion, selectedText, sendToAITutor, createHighlight, highlightColors])

  // Expose global function for AI highlighting
  React.useEffect(() => {
    window.highlightPdfText = (text, label, context) => {
      const newHighlight = {
        id: Date.now(),
        text: text,
        color: highlightColors[0],
        position: {
          left: 15,
          top: 25 + (userHighlights.length * 5),
          width: 30,
          height: 3,
          page: currentPage - 1
        },
        timestamp: Date.now(),
        type: 'user',
        label: label || 'Highlighted'
      }
      
      setUserHighlights(prev => [...prev, newHighlight])
      
      if (window.luterAI?.highlightPdfArea) {
        window.luterAI.highlightPdfArea({
          pageIndex: currentPage - 1,
          left: 15,
          top: 25 + (userHighlights.length * 5),
          width: 30,
          height: 3,
          label: label || 'Highlighted',
          color: '#FEF3C7'
        })
      }
    }
    
    return () => {
      delete window.highlightPdfText
    }
  }, [userHighlights.length, currentPage, highlightColors])

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#F8FAFC'
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        fontFamily: 'Outfit',
        flexShrink: 0,
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A102D' }}>
            {material?.title || 'PDF Document'}
          </span>
          <span style={{ fontSize: '11px', color: '#64748B' }}>
            Page {currentPage} of {totalPages || '?'}
          </span>
          {userHighlights.length > 0 && (
            <span style={{
              fontSize: '10px',
              background: '#FEF3C7',
              color: '#92400E',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600
            }}>
              {userHighlights.length} highlights
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => activateSelectionMode()}
            style={{
              padding: '4px 8px',
              background: '#7a12cc',
              color: 'white',
              border: '1px solid #7a12cc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Highlighter size={12} />
            Select Text
          </button>
        </div>
      </div>
      
      {/* PDF Viewer */}
      <div style={{ flex: 1, position: 'relative' }}>
        {pdfError ? (
          // Error fallback UI
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
              padding: '16px',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#DC2626', margin: '0 0 8px 0', fontSize: '16px' }}>
                PDF Loading Error
              </h3>
              <p style={{ color: '#7F1D1D', margin: '0 0 16px 0', fontSize: '14px' }}>
                {pdfError}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={retryPdfLoading}
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
                  Retry
                </button>
                <button
                  onClick={useFallbackViewer}
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
                  href={material.source_url}
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
            </div>
          </div>
        ) : (
          // Normal PDF viewer
          <Worker workerUrl={PDF_WORKER_URL}>
            <Viewer
              fileUrl={material.source_url}
              plugins={[
                selectionModePluginInstance,
                defaultLayoutPluginInstance
              ]}
              onPageChange={handlePageChange}
              onDocumentLoad={handleDocumentLoad}
              renderSelection={renderSelection}
              onSelection={handleSelection}
              onError={handlePdfError}
            />
          </Worker>
        )}
        
        {/* Action Bubble */}
        {renderActionBubble()}
      </div>
    </div>
  )
}
