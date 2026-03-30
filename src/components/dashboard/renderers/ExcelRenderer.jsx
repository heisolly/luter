import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useReadingSpace } from '../ReadingSpaceContext'
import { Loader2, Table, Download, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

// Simple Excel-like grid component (in production, use Syncfusion or Handsontable)
function SimpleSpreadsheet({ data, onCellClick, highlightedCells }) {
  const [selectedCell, setSelectedCell] = useState(null)

  const handleCellClick = (rowIndex, colIndex, cellData) => {
    setSelectedCell({ row: rowIndex, col: colIndex })
    onCellClick && onCellClick(rowIndex, colIndex, cellData)
  }

  const isCellHighlighted = (rowIndex, colIndex) => {
    return highlightedCells.some(cellHighlight => {
      // Parse cell range like "A1:C5" or "B2"
      const range = cellHighlight.cellRange || cellHighlight
      if (range.includes(':')) {
        const [start, end] = range.split(':')
        const startCol = start.charCodeAt(0) - 65
        const startRow = parseInt(start.slice(1)) - 1
        const endCol = end.charCodeAt(0) - 65
        const endRow = parseInt(end.slice(1)) - 1
        
        return rowIndex >= startRow && rowIndex <= endRow && 
               colIndex >= startCol && colIndex <= endCol
      } else {
        // Single cell like "B2"
        const col = range.charCodeAt(0) - 65
        const row = parseInt(range.slice(1)) - 1
        return rowIndex === row && colIndex === col
      }
    })
  }

  const getCellHighlightColor = (rowIndex, colIndex) => {
    const highlight = highlightedCells.find(range => isCellHighlighted(rowIndex, colIndex))
    return highlight?.color || '#10b981'
  }

  const getColumnName = (index) => String.fromCharCode(65 + index)

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      border: '1px solid #e5e7eb',
      overflow: 'auto',
      maxHeight: '600px'
    }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ 
              width: '40px', 
              background: '#f3f4f6', 
              border: '1px solid #e5e7eb',
              padding: '8px',
              fontSize: '12px',
              fontWeight: 600
            }}></th>
            {data[0]?.map((_, colIndex) => (
              <th key={colIndex} style={{ 
                background: '#f3f4f6', 
                border: '1px solid #e5e7eb',
                padding: '8px',
                fontSize: '12px',
                fontWeight: 600,
                minWidth: '100px'
              }}>
                {getColumnName(colIndex)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td style={{ 
                background: '#f3f4f6', 
                border: '1px solid #e5e7eb',
                padding: '8px',
                fontSize: '12px',
                fontWeight: 600,
                textAlign: 'center'
              }}>
                {rowIndex + 1}
              </td>
              {row.map((cell, colIndex) => {
                const isHighlighted = isCellHighlighted(rowIndex, colIndex)
                const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                
                return (
                  <td 
                    key={colIndex}
                    onClick={() => handleCellClick(rowIndex, colIndex, cell)}
                    style={{
                      border: '1px solid #e5e7eb',
                      padding: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      background: isHighlighted ? `${getCellHighlightColor(rowIndex, colIndex)}20` : 
                                 isSelected ? '#f3f4f6' : 'white',
                      borderLeft: isHighlighted ? `3px solid ${getCellHighlightColor(rowIndex, colIndex)}` : 
                                 isSelected ? '3px solid #6b7280' : '1px solid #e5e7eb',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = isHighlighted ? 
                        `${getCellHighlightColor(rowIndex, colIndex)}30` : '#f9fafb'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = isHighlighted ? 
                        `${getCellHighlightColor(rowIndex, colIndex)}20` : 
                        isSelected ? '#f3f4f6' : 'white'
                    }}
                  >
                    {cell || ''}
                    {isHighlighted && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: getCellHighlightColor(rowIndex, colIndex),
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          zIndex: 10
                        }}
                      >
                        {highlightedCells.find(h => isCellHighlighted(rowIndex, colIndex))?.label}
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ExcelRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const { setViewportData, drawCommands, highlightExcelCells } = useReadingSpace()
  const containerRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [excelData, setExcelData] = useState([])
  const [aiHighlights, setAiHighlights] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)

  // Parse Excel data (simplified - in production use a proper Excel library)
  const parseExcelData = async (url) => {
    setLoading(true)
    try {
      // In a real implementation, use xlsx library or backend parsing
      // For now, simulate with sample data
      const sampleData = [
        ['Month', 'Revenue', 'Expenses', 'Profit'],
        ['January', '$50,000', '$30,000', '$20,000'],
        ['February', '$55,000', '$32,000', '$23,000'],
        ['March', '$48,000', '$28,000', '$20,000'],
        ['April', '$62,000', '$35,000', '$27,000'],
        ['May', '$58,000', '$33,000', '$25,000']
      ]
      setExcelData(sampleData)
      
      // Update viewport data for AI context
      const flatData = sampleData.flat().join(' ')
      setViewportData({
        visibleText: flatData,
        scrollPercent: 0,
        currentPage: 1,
        documentType: 'xlsx'
      })
    } catch (error) {
      console.error('Error parsing Excel data:', error)
    } finally {
      setLoading(false)
    }
  }

  // AI Cell Highlighting Functions
  const triggerExcelHighlight = useCallback((highlightData) => {
    if (highlightData.documentType === 'xlsx') {
      setAiHighlights(prev => [...prev, highlightData])
    }
  }, [])

  // Process AI highlight commands
  useEffect(() => {
    const excelHighlights = drawCommands.filter(cmd => 
      cmd.type === 'highlight' && cmd.documentType === 'xlsx'
    )
    
    excelHighlights.forEach(highlight => {
      triggerExcelHighlight(highlight)
    })
  }, [drawCommands, triggerExcelHighlight])

  // Clear highlights when context requests
  useEffect(() => {
    if (drawCommands.length === 0) {
      setAiHighlights([])
    }
  }, [drawCommands])

  // Expose Excel highlighting function to global scope
  useEffect(() => {
    window.highlightExcelCells = (cellRange, label, color) => {
      highlightExcelCells(cellRange, label, color)
    }
    return () => {
      delete window.highlightExcelCells
    }
  }, [highlightExcelCells])

  useEffect(() => {
    if (material.source_url && activeTab === 'content') {
      parseExcelData(material.source_url)
    }
  }, [material.source_url, activeTab])

  const handleCellClick = (rowIndex, colIndex, cellData) => {
    const cellName = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`
    setSelectedCell({ row: rowIndex, col: colIndex, name: cellName, data: cellData })
    
    // Show action bubble for AI interaction
    // This could trigger an AI analysis of the selected cell
  }

  const downloadContent = () => {
    const content = analysisState[activeTab]
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${material.title}_${activeTab}.md`
    a.click()
  }

  if (activeTab !== 'content') {
    // Show AI analysis content for other tabs
    const content = analysisState[activeTab]
    if (!content) return null

    return (
      <div className="ws-ai-content-pane">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 className="ws-heading" style={{ fontSize: '24px', color: '#7a12cc', textTransform: 'capitalize' }}>
              AI {activeTab}
            </h2>
            <button 
              onClick={downloadContent}
              style={{ padding: '8px', borderRadius: '10px', background: '#F5F3FF', border: 'none', cursor: 'pointer', color: '#7a12cc' }}
            >
              <Download size={20} />
            </button>
          </div>
          <div className="markdown-body" style={{ background: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', background: '#F8FAFC', minHeight: '100%', fontFamily: 'Outfit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1A102D' }}>
          {material.title}
        </h2>
        
        {/* AI Highlight Demo Button */}
        <button
          onClick={() => {
            // Demo AI highlighting
            highlightExcelCells('B2:B6', 'High Revenue', '#10b981')
            highlightExcelCells('C2:C6', 'Expenses', '#f59e0b')
            highlightExcelCells('D4', 'Peak Profit', '#7a12cc')
          }}
          style={{
            padding: '8px 16px',
            background: '#7a12cc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={14} />
          Demo AI Highlights
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '16px' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Loading Excel data...</p>
        </div>
      ) : (
        <div>
          {/* Selected Cell Info */}
          {selectedCell && (
            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              <strong>Selected Cell:</strong> {selectedCell.name} = {selectedCell.data}
              <button
                onClick={() => {
                  // Ask AI to analyze this cell
                  const question = `Analyze cell ${selectedCell.name} with value ${selectedCell.data}`
                  // This would trigger the AI chat with context about this cell
                  console.log('AI Analysis for:', question)
                }}
                style={{
                  marginLeft: '16px',
                  padding: '4px 8px',
                  background: '#7a12cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Ask AI
              </button>
            </div>
          )}

          <SimpleSpreadsheet 
            data={excelData}
            onCellClick={handleCellClick}
            highlightedCells={aiHighlights}
          />
        </div>
      )}

      {/* AI Highlights Info */}
      {aiHighlights.length > 0 && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, color: '#0369a1' }}>
            AI Highlights Active
          </h4>
          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#0c4a6e' }}>
            {aiHighlights.map((highlight, index) => (
              <li key={index}>
                {highlight.cellRange}: {highlight.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
