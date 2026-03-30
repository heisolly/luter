import React, { createContext, useContext, useState, useRef, useEffect } from 'react'

const ReadingSpaceContext = createContext()

export function ReadingSpaceProvider({ children }) {
  const [viewportData, setViewportData] = useState({
    visibleText: '',
    scrollPercent: 0,
    currentPage: 1
  })
  
  const [drawCommands, setDrawCommands] = useState([])
  const [sparkPosition, setLuterSparkPosition] = useState({ x: 0, y: 0, visible: false })
  const [selection, setSelection] = useState({ text: '', rect: null, visible: false })
  
  // Method for AI to trigger a highlight
  const highlightText = (rects, label = '') => {
    const id = Date.now()
    setDrawCommands(prev => [...prev, { id, rects, label, type: 'highlight' }])
  }

  const clearHighlights = () => setDrawCommands([])

  const updateSpark = (x, y, visible = true) => {
    setLuterSparkPosition({ x, y, visible })
  }

  const updateSelection = (text, rect, visible = true) => {
    setSelection({ text, rect, visible })
  }

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
      updateSelection
    }}>
      {children}
    </ReadingSpaceContext.Provider>
  )
}

export const useReadingSpace = () => useContext(ReadingSpaceContext)
