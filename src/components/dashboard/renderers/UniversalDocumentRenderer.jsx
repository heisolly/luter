import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, FileText, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { useReadingSpace } from '../ReadingSpaceContext'
import DocumentConversionService from '../../../services/documentConversionService'
import OfficeRenderer from './OfficeRenderer'

export default function UniversalDocumentRenderer({ material, activeTab, analysisState, onRunAnalysis, onProgressUpdate }) {
  const { setViewportData } = useReadingSpace()
  
  const [conversionState, setConversionState] = useState({
    status: 'loading', // loading, converting, ready, error
    progress: 0,
    message: 'Preparing document...',
    showOriginalFormat: false
  })
  
  const [convertedContent, setConvertedContent] = useState(null)
  const [conversionInfo, setConversionInfo] = useState(null)

  // Convert document to DOCX on mount
  useEffect(() => {
    if (activeTab === 'content' && material) {
      convertDocument()
    }
  }, [material, activeTab])

  const convertDocument = useCallback(async () => {
    try {
      // For PDFs, skip conversion entirely and display directly
      if (material.type === 'pdf') {
        console.log('PDF detected, displaying directly without conversion')
        setConversionState({
          status: 'ready',
          progress: 100,
          message: 'PDF ready for reading',
          showOriginalFormat: true // Always show original format for PDFs
        })
        
        // Set the original material without conversion
        setConvertedContent({
          ...material,
          isConverted: false // Mark as not converted so it uses appropriate renderer
        })
        
        // Update viewport data
        setViewportData({
          visibleText: material.extracted_text?.slice(0, 2000) || '',
          scrollPercent: 0,
          currentPage: 1,
          documentType: 'pdf'
        })
        
        return
      }

      setConversionState({
        status: 'converting',
        progress: 20,
        message: 'Luter is processing your document...',
        showOriginalFormat: false
      })

      // Fetch the original file
      const response = await fetch(material.source_url)
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`)
      }
      
      const blob = await response.blob()
      const file = new File([blob], material.title || 'document', { 
        type: blob.type || 'application/octet-stream' 
      })

      setConversionState(prev => ({
        ...prev,
        progress: 50,
        message: 'Luter is optimizing your document...'
      }))

      // Convert to DOCX (only for non-PDF documents)
      const conversionResult = await DocumentConversionService.convertToDocx(
        file,
        material.type || 'unknown',
        {
          title: material.title,
          author: material.author || 'Luter User',
          courseId: material.course_id,
          materialId: material.id
        }
      )

      if (!conversionResult.success) {
        throw new Error(conversionResult.error)
      }

      // Check if conversion should be skipped (for DOCX files)
      if (conversionResult.skipConversion) {
        console.log('Skipping conversion, using original DOCX file')
        setConversionState({
          status: 'ready',
          progress: 100,
          message: 'Document ready',
          showOriginalFormat: false
        })
        
        // Return the original material without conversion
        setConvertedContent({
          ...material,
          isConverted: false // Mark as not converted so it uses OfficeRenderer
        })
        setConversionInfo(conversionResult.metadata)
        
        // Update viewport data
        setViewportData({
          visibleText: material.extracted_text?.slice(0, 2000) || '',
          scrollPercent: 0,
          currentPage: 1,
          documentType: 'docx'
        })
        
        return
      }

      setConversionState(prev => ({
        ...prev,
        progress: 80,
        message: 'Luter is finalizing your document...'
      }))

      // Create a synthetic material for the renderer
      const convertedMaterial = {
        ...material,
        type: 'text', // Use text type instead of fake DOCX
        source_url: createContentUrl(conversionResult.docxContent),
        extracted_text: conversionResult.docxContent,
        conversionInfo: conversionResult.metadata,
        // Don't try to render as DOCX since we only have text content
        isConverted: true
      }

      setConvertedContent(convertedMaterial)
      setConversionInfo(conversionResult.metadata)

      setConversionState({
        status: 'ready',
        progress: 100,
        message: 'Document ready',
        showOriginalFormat: false
      })

      // Update viewport data
      setViewportData({
        visibleText: conversionResult.docxContent.slice(0, 2000),
        scrollPercent: 0,
        currentPage: 1,
        documentType: 'docx'
      })
    } catch (error) {
      console.error('Document conversion failed:', error)
      setConversionState({
        status: 'error',
        progress: 0,
        message: `Conversion failed: ${error.message}`,
        showOriginalFormat: false
      })
    }
  }, [material, setViewportData])

  // Create a data URL for the content (not as DOCX file, but as text content)
  const createContentUrl = (content) => {
    // Create a blob with the text content, not a fake DOCX
    const blob = new Blob([content], { type: 'text/plain' })
    return URL.createObjectURL(blob)
  }

  // Toggle between converted and original format
  const toggleFormat = useCallback(() => {
    setConversionState(prev => ({
      ...prev,
      showOriginalFormat: !prev.showOriginalFormat
    }))
  }, [])

  // Retry conversion
  const retryConversion = useCallback(() => {
    setConversionState(prev => ({
      ...prev,
      status: 'loading',
      progress: 0,
      message: 'Luter is preparing your document...'
    }))
    convertDocument()
  }, [convertDocument])

  // Render loading/conversion state
  if (conversionState.status !== 'ready' || conversionState.showOriginalFormat) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#F8FAFC',
        fontFamily: 'Outfit'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A102D' }}>
              {material?.title || 'Document'}
            </span>
            <span style={{
              fontSize: '10px',
              background: '#DBEAFE',
              color: '#1E40AF',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: 600
            }}>
              {material?.type?.toUpperCase() || 'UNKNOWN'}
            </span>
            {conversionInfo && (
              <span style={{
                fontSize: '10px',
                background: '#D1FAE5',
                color: '#065F46',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600
              }}>
                Converted to DOCX
              </span>
            )}
          </div>
          
          {conversionState.status === 'ready' && (
            <button
              onClick={toggleFormat}
              style={{
                padding: '4px 8px',
                background: '#7a12cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {conversionState.showOriginalFormat ? <Eye size={12} /> : <EyeOff size={12} />}
              {conversionState.showOriginalFormat ? 'Show Converted' : 'Show Original'}
            </button>
          )}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {conversionState.status === 'loading' && (
            <div style={{ textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: '#7a12cc', marginBottom: '16px' }} />
              <h3 style={{ color: '#1A102D', margin: '0 0 8px 0', fontSize: '16px' }}>
                Loading Document
              </h3>
              <p style={{ color: '#64748B', margin: '0 0 16px 0', fontSize: '14px' }}>
                {conversionState.message}
              </p>
            </div>
          )}

          {conversionState.status === 'converting' && (
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: '#7a12cc', marginBottom: '16px' }} />
              <h3 style={{ color: '#1A102D', margin: '0 0 8px 0', fontSize: '16px' }}>
                Converting Document
              </h3>
              <p style={{ color: '#64748B', margin: '0 0 16px 0', fontSize: '14px' }}>
                {conversionState.message}
              </p>
              
              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '8px',
                background: '#E5E7EB',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '16px'
              }}>
                <div style={{
                  width: `${conversionState.progress}%`,
                  height: '100%',
                  background: '#7a12cc',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#64748B',
                background: '#F3F4F6',
                padding: '8px 12px',
                borderRadius: '6px'
              }}>
                Converting to optimal format for best reading experience...
              </div>
            </div>
          )}

          {conversionState.status === 'error' && (
            <div style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '400px',
              textAlign: 'center'
            }}>
              <AlertCircle size={32} style={{ color: '#DC2626', marginBottom: '16px' }} />
              <h3 style={{ color: '#DC2626', margin: '0 0 8px 0', fontSize: '16px' }}>
                Conversion Failed
              </h3>
              <p style={{ color: '#7F1D1D', margin: '0 0 16px 0', fontSize: '14px' }}>
                {conversionState.message}
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={retryConversion}
                  style={{
                    padding: '8px 16px',
                    background: '#7a12cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RefreshCw size={14} />
                  Retry
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
                    fontWeight: 600
                  }}
                >
                  Open Original
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Render converted document using DOCX renderer
  return (
    <div style={{ width: '100%', height: '100%' }}>
      {/* Header - only show for converted documents, not DOCX */}
      {!convertedContent.isConverted ? null : (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          fontSize: '12px',
          fontFamily: 'Outfit'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#1A102D' }}>
              {material?.title || 'Document'}
            </span>
          </div>
        </div>
      )}

      {/* Render based on content type */}
      <div style={{ height: 'calc(100% - 41px)' }}>
        {convertedContent.isConverted ? (
          // Render converted text content directly
          <div style={{
            height: '100%',
            padding: '20px',
            overflow: 'auto',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#1A102D',
            background: 'white'
          }}>
            <div dangerouslySetInnerHTML={{ 
              __html: convertedContent.extracted_text
                .replace(/\n/g, '<br>')
                .replace(/#{1,6}\s(.+)/g, '<h3 style="margin: 20px 0 10px 0; color: #7a12cc; font-weight: 600;">$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/- (.+)/g, '<li style="margin: 5px 0;">$1</li>')
            }} />
          </div>
        ) : (
          // Use OfficeRenderer for DOCX and other non-converted content
          <OfficeRenderer 
            material={convertedContent} 
            activeTab={activeTab} 
            analysisState={analysisState} 
            onRunAnalysis={onRunAnalysis}
          />
        )}
      </div>
    </div>
  )
}
