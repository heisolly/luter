import React, { useState, useCallback } from 'react'
import { useReadingSpace } from '../ReadingSpaceContext'
import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

export default function AdvancedPdfRenderer({ material, activeTab, analysisState, onRunAnalysis, onProgressUpdate }) {
  const { setViewportData, updateSelection, drawCommands, highlightText } = useReadingSpace()
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [documentText, setDocumentText] = useState('')
  const [pages, setPages] = useState([])

  // Extract text from PDF
  const extractPdfText = useCallback(async (pdfUrl) => {
    try {
      setLoading(true)
      setError(null)
      
      const loadingTask = pdfjsLib.getDocument(pdfUrl)
      const pdf = await loadingTask.promise
      
      setTotalPages(pdf.numPages)
      setCurrentPage(1)
      
      const allPages = []
      let fullText = ''
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map(item => item.str).join(' ')
        
        allPages.push({
          pageNumber: pageNum,
          text: pageText
        })
        
        fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`
      }
      
      setPages(allPages)
      setDocumentText(fullText)
      
      // Set viewport data for AI processing
      setViewportData({
        visibleText: fullText.substring(0, 2000),
        scrollPercent: 0,
        currentPage: 1,
        totalPages: pdf.numPages,
        documentType: 'pdf'
      })
      
    } catch (err) {
      console.error('Error extracting PDF text:', err)
      setError('Failed to extract text from document')
    } finally {
      setLoading(false)
    }
  }, [setViewportData])

  // Initialize PDF text extraction
  React.useEffect(() => {
    if (activeTab === 'content' && material?.source_url) {
      extractPdfText(material.source_url)
    }
  }, [activeTab, material?.source_url, extractPdfText])

  // Handle page navigation
  const goToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
      
      // Update viewport data
      const pageData = pages[pageNum - 1]
      if (pageData) {
        setViewportData({
          visibleText: pageData.text.substring(0, 2000),
          scrollPercent: (pageNum / totalPages) * 100,
          currentPage: pageNum,
          totalPages: totalPages,
          documentType: 'pdf'
        })
      }
    }
  }

  // Expose highlighting function for AI
  React.useEffect(() => {
    window.highlightPdfText = (text, label, context) => {
      highlightText(text, label, context)
    }
    
    return () => {
      delete window.highlightPdfText
    }
  }, [highlightText])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        background: '#F8FAFC',
        fontFamily: 'Satoshi'
      }}>
        <div style={{ fontSize: '14px', color: '#64748B' }}>
          Extracting document content...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        background: '#F8FAFC',
        fontFamily: 'Satoshi'
      }}>
        <div style={{ fontSize: '14px', color: '#64748B' }}>
          Unable to load document
        </div>
      </div>
    )
  }

  const currentPageData = pages[currentPage - 1]

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: '#F8FAFC'
    }}>
      {/* Simple header with page navigation */}
      <div style={{
        padding: '12px 16px',
        background: 'white',
        borderBottom: '1px solid #E2E8F0',
        fontFamily: 'Satoshi',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#1A102D' }}>
          {material?.title || 'Document'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{
              padding: '4px 8px',
              background: currentPage <= 1 ? '#E5E7EB' : '#7a12cc',
              color: currentPage <= 1 ? '#9CA3AF' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            ←
          </button>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              padding: '4px 8px',
              background: currentPage >= totalPages ? '#E5E7EB' : '#7a12cc',
              color: currentPage >= totalPages ? '#9CA3AF' : 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              fontSize: '12px'
            }}
          >
            →
          </button>
        </div>
      </div>
      
      {/* Document content area */}
      <div style={{ 
        flex: 1, 
        padding: '24px',
        background: 'white',
        overflow: 'auto'
      }}>
        {currentPageData ? (
          <div style={{
            fontFamily: 'Satoshi',
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#1A102D',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#64748B',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '1px solid #E2E8F0'
            }}>
              Page {currentPage}
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {currentPageData.text || 'No text content on this page'}
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            fontFamily: 'Satoshi'
          }}>
            <div style={{ fontSize: '14px', color: '#64748B' }}>
              No content available
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
