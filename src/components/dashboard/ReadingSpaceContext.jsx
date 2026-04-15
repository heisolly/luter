import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

const ReadingSpaceContext = createContext()

export function ReadingSpaceProvider({ children }) {
  const [viewportData, setViewportData] = useState({
    visibleText: '',
    scrollPercent: 0,
    currentPage: 1,
    totalPages: 0,
    documentType: 'pdf', // pdf, docx, pptx, xlsx
    coordinateMap: {} // AI-generated coordinate map for precise highlighting
  })
  
  const [drawCommands, setDrawCommands] = useState([])
  const [sparkPosition, setLuterSparkPosition] = useState({ x: 0, y: 0, visible: false })
  const [selection, setSelection] = useState({ text: '', rect: null, visible: false })
  const [isSidePanelCollapsed, setSidePanelCollapsed] = useState(false)
  
  // Advanced AI highlighting with coordinate support
  const highlightText = (highlightData) => {
    const id = Date.now()
    
    // Support multiple highlight formats
    if (Array.isArray(highlightData)) {
      // Multiple highlights
      const highlights = highlightData.map(data => ({
        id: Date.now() + Math.random(),
        ...data,
        type: 'highlight'
      }))
      setDrawCommands(prev => [...prev, ...highlights])
    } else {
      // Single highlight
      const highlight = {
        id,
        ...highlightData,
        type: 'highlight'
      }
      setDrawCommands(prev => [...prev, highlight])
    }
  }

  // AI tool calling functions
  const highlightPdfArea = ({ pageIndex, left, top, width, height, label, color = '#7a12cc' }) => {
    highlightText({
      documentType: 'pdf',
      pageIndex,
      coordinates: { left, top, width, height },
      label,
      color
    })
  }

  const highlightDocxText = (text, label, context) => {
    // Enhanced context handling for DOCX
    const enhancedContext = context || {
      documentInfo: {
        type: 'docx',
        timestamp: Date.now()
      },
      location: {
        documentType: 'docx',
        position: 'document-body'
      },
      content: {
        selectedText: text,
        textLength: text?.length || 0,
        wordCount: text?.split(/\s+/).length || 0
      }
    }
    
    highlightText({
      documentType: 'docx',
      text,
      context: enhancedContext,
      label,
      fullContext: enhancedContext // Store full context for AI
    })
  }

  const highlightExcelCells = (cellRange, label, color = '#10b981') => {
    highlightText({
      documentType: 'xlsx',
      cellRange, // e.g., "A1:C5", "B2", "D4:F10"
      label,
      color
    })
  }

  const clearHighlights = () => setDrawCommands([])

  const updateSpark = (x, y, visible = true) => {
    setLuterSparkPosition({ x, y, visible })
  }

  const updateSelection = (text, rect, visible = true) => {
    setSelection({ text, rect, visible })
  }

  // Update coordinate map from backend analysis
  const updateCoordinateMap = (map) => {
    setViewportData(prev => ({
      ...prev,
      coordinateMap: map
    }))
  }

  // Expose AI tool functions to global scope for tool calling
  useEffect(() => {
    window.luterAI = {
      highlightPdfArea,
      highlightDocxText,
      highlightExcelCells,
      highlightText,
      clearHighlights,
      updateSpark
    }
    
    return () => {
      delete window.luterAI
    }
  }, [])

  return (
    <ReadingSpaceContext.Provider value={{
      viewportData,
      setViewportData,
      drawCommands,
      highlightText,
      clearHighlights,
      sparkPosition,
      updateSpark,
      selection,
      updateSelection,
      updateCoordinateMap,
      // AI tool functions
      highlightPdfArea,
      highlightDocxText,
      highlightExcelCells,
      isSidePanelCollapsed,
      setSidePanelCollapsed
    }}>
      {children}
    </ReadingSpaceContext.Provider>
  )
}

export const useReadingSpace = () => useContext(ReadingSpaceContext)
