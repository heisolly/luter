import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ExternalLink, AlertCircle, Loader2, Download, Sparkles, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useReadingSpace } from '../ReadingSpaceContext'
import ReactMarkdown from 'react-markdown'
import * as docx from "docx-preview"
import Mark from 'mark.js'

export default function OfficeRenderer({ material, activeTab, analysisState, onRunAnalysis }) {
  const { setViewportData, updateSelection, drawCommands, highlightDocxText, highlightText, highlightPptxText } = useReadingSpace()
  const docxContainerRef = useRef(null)
  const markInstanceRef = useRef(null)
  const pptxContainerRef = useRef(null)
  
  const [loading, setLoading] = useState(false)
  const [isDocx, setIsDocx] = useState(false)
  const [isPptx, setIsPptx] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [userAnswers, setUserAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizScore, setQuizScore] = useState(null)
  const [aiHighlights, setAiHighlights] = useState([])
  const [convertedPdfUrl, setConvertedPdfUrl] = useState(null)
  const [pptxSlides, setPptxSlides] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)

  const fileUrl = material.source_url
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  useEffect(() => {
    const type = material.type?.toLowerCase() || ''
    const url = material.source_url || ''
    const isDocFile = type === 'docx' || url.endsWith('.docx')
    const isPptFile = type === 'pptx' || url.endsWith('.pptx')
    
    setIsDocx(isDocFile)
    setIsPptx(isPptFile)

    if (isDocFile && activeTab === 'content') {
      renderDocx(url)
    }
    
    if (isPptFile && activeTab === 'content') {
      // For PPTX, try to convert to PDF for better highlighting
      convertPptxToPdf(url)
    }

    if (material.extracted_text) {
      setViewportData({
        visibleText: material.extracted_text.slice(0, 5000),
        scrollPercent: 0,
        currentPage: 1,
        documentType: isDocFile ? 'docx' : isPptFile ? 'pptx' : 'unknown'
      })
    }
  }, [material, activeTab])

  // AI Highlighting Functions
  const triggerDocxHighlight = useCallback((highlightData) => {
    if (highlightData.documentType === 'docx' && docxContainerRef.current) {
      if (!markInstanceRef.current) {
        markInstanceRef.current = new Mark(docxContainerRef.current)
      }
      
      // Mark the text with AI highlight
      markInstanceRef.current.mark(highlightData.text, {
        className: 'luter-ai-highlight',
        exclude: ['h1', 'h2', 'h3'],
        caseSensitive: false,
        accuracy: 'exactly'
      })
      
      setAiHighlights(prev => [...prev, highlightData])
    }
  }, [])

  // Trigger PPTX highlight
  const triggerPptxHighlight = useCallback((highlightData) => {
    if (!pptxContainerRef.current) return
    
    const container = pptxContainerRef.current
    const slideElement = container.querySelector(`[data-slide="${currentSlide}"]`)
    
    if (!slideElement) return
    
    // Initialize mark.js for this slide if not already done
    if (!markInstanceRef.current) {
      markInstanceRef.current = new Mark(slideElement)
    }
    
    // Unmark previous highlights
    markInstanceRef.current.unmark()
    
    // Apply new highlight
    markInstanceRef.current.mark(highlightData.text, {
      className: 'ai-highlight',
      caseSensitive: false,
      accuracy: 'exactly'
    })
    
    setAiHighlights(prev => [...prev, highlightData])
  }, [currentSlide])

  // Process PPTX slides from extracted text
  const processPptxSlides = useCallback((extractedText) => {
    if (!extractedText) return
    
    console.log('Processing PPTX slides from extracted text:', extractedText.substring(0, 200))
    
    // Enhanced slide detection patterns
    const slidePatterns = [
      // Common PowerPoint slide separators
      /(?:Slide\s+\d+|Page\s+\d+)/gi,
      /(?:===\s*Slide\s*\d+\s*===|---\s*Slide\s*\d+\s*---)/gi,
      /(?:\n\s*\d+\.\s|\n\s*[A-Z][a-z]+\s+\d+)/gi,
      /(?:\n\s*-{3,}\s*\n|\n\s*={3,}\s*\n)/gi,
      // New slide indicators
      /(?:\n\s*New\s+Slide\s*\n|\n\s*---\s*Slide\s*\d+\s*---\s*\n)/gi,
      // Title-based slide detection (lines that look like slide titles)
      /(?:\n\s*[A-Z][A-Z\s]{10,}\s*\n|\n\s*[A-Z][a-z]+\s+[A-Z][a-z]+\s*\n)/gi
    ]
    
    let slides = []
    
    // Try each pattern to find the best slide separation
    for (const pattern of slidePatterns) {
      const testSlides = extractedText.split(pattern).filter(slide => slide.trim().length > 20)
      if (testSlides.length > 1) {
        slides = testSlides
        console.log(`Found ${slides.length} slides using pattern:`, pattern)
        break
      }
    }
    
    // If no clear slide separators found, use intelligent chunking
    if (slides.length <= 1) {
      console.log('No clear slide separators found, using intelligent chunking')
      
      // Split by double newlines or significant content breaks
      const paragraphs = extractedText.split(/\n\s*\n+/).filter(p => p.trim().length > 10)
      
      // Group paragraphs into slides (max 3-4 paragraphs per slide)
      const chunkSize = 3
      slides = []
      for (let i = 0; i < paragraphs.length; i += chunkSize) {
        const chunk = paragraphs.slice(i, i + chunkSize).join('\n\n')
        if (chunk.trim().length > 20) {
          slides.push(chunk.trim())
        }
      }
      
      // If still only one slide, split by character count
      if (slides.length <= 1) {
        const charLimit = 800 // Characters per slide
        slides = []
        for (let i = 0; i < extractedText.length; i += charLimit) {
          const chunk = extractedText.slice(i, i + charLimit)
          if (chunk.trim().length > 20) {
            slides.push(chunk.trim())
          }
        }
      }
    }
    
    // Clean up slides and ensure minimum content
    slides = slides.map(slide => slide.trim()).filter(slide => slide.length > 20)
    
    // Add slide numbers if not present
    slides = slides.map((slide, index) => {
      // If slide doesn't start with a title, add one
      if (!slide.match(/^(Slide\s+\d+|[A-Z][A-Z\s]{5,}|[A-Z][a-z]+\s+[A-Z])/)) {
        const firstLine = slide.split('\n')[0].trim()
        if (firstLine.length < 50 && firstLine.length > 3) {
          // First line looks like a title, keep it
          return slide
        } else {
          // Add a generic title
          return `Slide ${index + 1}\n${slide}`
        }
      }
      return slide
    })
    
    console.log(`Final slide count: ${slides.length}`)
    slides.forEach((slide, index) => {
      console.log(`Slide ${index + 1}:`, slide.substring(0, 100) + '...')
    })
    
    setPptxSlides(slides)
  }, [])

  // Render PPTX slides with enhanced navigation
  const renderPptxSlides = useCallback(() => {
    if (!pptxContainerRef.current || pptxSlides.length === 0) return
    
    const container = pptxContainerRef.current
    container.innerHTML = ''
    
    // Create main viewer container
    const viewerContainer = document.createElement('div')
    viewerContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #1a1a1a;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      overflow: hidden;
    `
    
    // Create top navigation bar
    const topNav = document.createElement('div')
    topNav.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: rgba(26, 32, 44, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(255,255,255,0.1);
    `
    
    topNav.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px;">
        <span style="color: white; font-weight: 600; font-size: 14px;">
          PowerPoint Presentation
        </span>
        <span style="color: #7a12cc; font-weight: 600; font-size: 12px; background: rgba(122, 18, 204, 0.2); padding: 4px 8px; border-radius: 4px;">
          ${pptxSlides.length} Slides
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button id="prev-slide-top" style="
          padding: 8px 16px;
          background: ${currentSlide === 0 ? 'rgba(255,255,255,0.1)' : '#7a12cc'};
          color: ${currentSlide === 0 ? 'rgba(255,255,255,0.5)' : 'white'};
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          cursor: ${currentSlide === 0 ? 'not-allowed' : 'pointer'};
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s ease;
        " ${currentSlide === 0 ? 'disabled' : ''}>
          ← Previous
        </button>
        <span style="color: white; font-weight: 600; font-size: 13px; min-width: 80px; text-align: center;">
          ${currentSlide + 1} / ${pptxSlides.length}
        </span>
        <button id="next-slide-top" style="
          padding: 8px 16px;
          background: ${currentSlide === pptxSlides.length - 1 ? 'rgba(255,255,255,0.1)' : '#7a12cc'};
          color: ${currentSlide === pptxSlides.length - 1 ? 'rgba(255,255,255,0.5)' : 'white'};
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          cursor: ${currentSlide === pptxSlides.length - 1 ? 'not-allowed' : 'pointer'};
          font-weight: 600;
          font-size: 12px;
          transition: all 0.2s ease;
        " ${currentSlide === pptxSlides.length - 1 ? 'disabled' : ''}>
          Next →
        </button>
      </div>
    `
    
    viewerContainer.appendChild(topNav)
    
    // Create main content area with sidebar and slide
    const mainContent = document.createElement('div')
    mainContent.style.cssText = `
      display: flex;
      flex: 1;
      overflow: hidden;
    `
    
    // Create slide thumbnails sidebar
    const thumbnailSidebar = document.createElement('div')
    thumbnailSidebar.style.cssText = `
      width: 180px;
      background: rgba(26, 32, 44, 0.95);
      backdrop-filter: blur(10px);
      border-right: 1px solid rgba(255,255,255,0.1);
      overflow-y: auto;
      padding: 16px 8px;
    `
    
    // Add slides header
    const slidesHeader = document.createElement('div')
    slidesHeader.style.cssText = `
      color: white;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 12px;
      padding: 0 8px;
      letter-spacing: 0.5px;
    `
    slidesHeader.textContent = 'All Slides'
    thumbnailSidebar.appendChild(slidesHeader)
    
    // Create thumbnails for each slide
    pptxSlides.forEach((slide, index) => {
      const thumbnail = document.createElement('div')
      thumbnail.style.cssText = `
        width: 152px;
        height: 85px;
        background: white;
        border-radius: 4px;
        margin-bottom: 8px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        border: 2px solid ${index === currentSlide ? '#7a12cc' : 'transparent'};
        transition: all 0.2s ease;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
      `
      
      // Add slide number badge
      const slideNumber = document.createElement('div')
      slideNumber.style.cssText = `
        position: absolute;
        top: 4px;
        left: 4px;
        background: rgba(0,0,0,0.8);
        color: white;
        font-size: 9px;
        font-weight: 600;
        padding: 2px 5px;
        border-radius: 2px;
        z-index: 2;
      `
      slideNumber.textContent = index + 1
      thumbnail.appendChild(slideNumber)
      
      // Add content preview
      const contentPreview = document.createElement('div')
      contentPreview.style.cssText = `
        padding: 16px 10px;
        font-size: 5px;
        color: #4a5568;
        line-height: 1.1;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 5;
        -webkit-box-orient: vertical;
        font-family: 'Segoe UI', sans-serif;
        height: 100%;
      `
      
      // Create mini preview of content
      const lines = slide.split('\n').filter(line => line.trim()).slice(0, 3)
      const previewText = lines.join(' ').substring(0, 60) + (lines.join(' ').length > 60 ? '...' : '')
      contentPreview.textContent = previewText
      thumbnail.appendChild(contentPreview)
      
      // Add click handler
      thumbnail.addEventListener('click', () => {
        setCurrentSlide(index)
      })
      
      // Add hover effect
      thumbnail.addEventListener('mouseenter', () => {
        thumbnail.style.transform = 'scale(1.03)'
        thumbnail.style.boxShadow = '0 4px 12px rgba(122, 18, 204, 0.4)'
      })
      
      thumbnail.addEventListener('mouseleave', () => {
        thumbnail.style.transform = 'scale(1)'
        thumbnail.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)'
      })
      
      thumbnailSidebar.appendChild(thumbnail)
    })
    
    // Create main slide viewing area
    const slideViewArea = document.createElement('div')
    slideViewArea.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
      position: relative;
    `
    
    // Create slide stage
    const slideStage = document.createElement('div')
    slideStage.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px;
      position: relative;
    `
    
    // Create main slide element
    const slideElement = document.createElement('div')
    slideElement.setAttribute('data-slide', currentSlide)
    slideElement.style.cssText = `
      width: 100%;
      max-width: 800px;
      aspect-ratio: 16/9;
      background: white;
      border-radius: 6px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.3);
      padding: 50px;
      font-family: 'Segoe UI', 'Arial', sans-serif;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
    `
    
    // Add slide content with proper formatting
    const slideContent = pptxSlides[currentSlide] || 'No content available'
    const lines = slideContent.split('\n').filter(line => line.trim())
    
    // Process slide content
    const processedContent = lines.map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      
      // Check if it's a title
      const isTitle = index === 0 || 
                     trimmed.length < 50 || 
                     /^[A-Z]/.test(trimmed) && !trimmed.includes('.') ||
                     trimmed === trimmed.toUpperCase()
      
      // Check if it's a bullet point
      const isBullet = /^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)
      
      return { text: trimmed, isTitle, isBullet, index }
    }).filter(Boolean)
    
    // Render slide content
    const contentContainer = document.createElement('div')
    contentContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    `
    
    processedContent.forEach(item => {
      const element = document.createElement('div')
      
      if (item.isTitle) {
        element.style.cssText = `
          font-size: 28px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 20px;
          text-align: center;
          line-height: 1.2;
        `
      } else if (item.isBullet) {
        element.style.cssText = `
          font-size: 18px;
          color: #4a5568;
          margin-bottom: 10px;
          margin-left: 20px;
          line-height: 1.5;
          position: relative;
        `
        // Add bullet point
        const bullet = document.createElement('span')
        bullet.style.cssText = `
          position: absolute;
          left: -20px;
          color: #7a12cc;
          font-weight: bold;
        `
        bullet.textContent = item.text.startsWith('-') ? '•' : '→'
        element.textContent = item.text.replace(/^[-•*]\s|^\d+\.\s/, '')
        element.prepend(bullet)
      } else {
        element.style.cssText = `
          font-size: 18px;
          color: #4a5568;
          margin-bottom: 14px;
          line-height: 1.5;
        `
      }
      
      element.textContent = element.textContent || item.text
      contentContainer.appendChild(element)
    })
    
    slideElement.appendChild(contentContainer)
    
    // Add slide number indicator
    const slideNumber = document.createElement('div')
    slideNumber.style.cssText = `
      position: absolute;
      bottom: 16px;
      right: 20px;
      font-size: 12px;
      color: #a0aec0;
      font-weight: 600;
    `
    slideNumber.textContent = `${currentSlide + 1} / ${pptxSlides.length}`
    slideElement.appendChild(slideNumber)
    
    slideStage.appendChild(slideElement)
    slideViewArea.appendChild(slideStage)
    
    // Create bottom navigation bar
    const bottomNav = document.createElement('div')
    bottomNav.style.cssText = `
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      background: rgba(26, 32, 44, 0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255,255,255,0.1);
      gap: 12px;
    `
    
    // Add slide indicator dots
    const dotsContainer = document.createElement('div')
    dotsContainer.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `
    
    pptxSlides.forEach((_, index) => {
      const dot = document.createElement('div')
      dot.style.cssText = `
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: ${index === currentSlide ? '#7a12cc' : 'rgba(255,255,255,0.3)'};
        transition: all 0.2s ease;
        cursor: pointer;
      `
      dot.setAttribute('data-slide-index', index)
      
      dot.addEventListener('click', () => {
        setCurrentSlide(index)
      })
      
      dotsContainer.appendChild(dot)
    })
    
    bottomNav.appendChild(dotsContainer)
    slideViewArea.appendChild(bottomNav)
    
    // Assemble the viewer
    mainContent.appendChild(thumbnailSidebar)
    mainContent.appendChild(slideViewArea)
    viewerContainer.appendChild(mainContent)
    container.appendChild(viewerContainer)
    
    // Add event listeners for navigation buttons
    const addNavigationListeners = () => {
      const prevBtn = document.getElementById('prev-slide-top')
      const nextBtn = document.getElementById('next-slide-top')
      
      prevBtn?.addEventListener('click', () => {
        if (currentSlide > 0) {
          setCurrentSlide(prev => prev - 1)
        }
      })
      
      nextBtn?.addEventListener('click', () => {
        if (currentSlide < pptxSlides.length - 1) {
          setCurrentSlide(prev => prev + 1)
        }
      })
    }
    
    addNavigationListeners()
    
    // Add keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(prev => prev - 1)
      } else if (e.key === 'ArrowRight' && currentSlide < pptxSlides.length - 1) {
        setCurrentSlide(prev => prev + 1)
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    
    // Re-apply highlights when slide changes
    setTimeout(() => {
      const pptxHighlights = drawCommands.filter(cmd => 
        cmd.type === 'highlight' && cmd.documentType === 'pptx'
      )
      
      pptxHighlights.forEach(highlight => {
        triggerPptxHighlight(highlight)
      })
    }, 100)
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [pptxSlides, currentSlide, drawCommands, triggerPptxHighlight])

  // Convert PPTX to PDF for better highlighting
  const convertPptxToPdf = async (pptxUrl) => {
    setLoading(true)
    try {
      console.log('Processing PPTX file:', pptxUrl)
      
      // Process PPTX slides from extracted text
      if (material.extracted_text) {
        console.log('Using extracted text, length:', material.extracted_text.length)
        processPptxSlides(material.extracted_text)
      } else {
        console.log('No extracted text found, creating fallback slides')
        // Create fallback slides if no extracted text
        const fallbackSlides = [
          `Slide 1\n\nPowerPoint Presentation\n\n${material.title || 'Untitled Presentation'}`,
          `Slide 2\n\nContent\n\nThis presentation contains multiple slides.`,
          `Slide 3\n\nInformation\n\nPlease check the original file for complete content.`
        ]
        setPptxSlides(fallbackSlides)
      }
    } catch (error) {
      console.error('PPTX processing failed:', error)
      // Ensure we always have at least some slides
      const errorSlides = [
        `Slide 1\n\nError Loading Slides\n\nCould not process the PowerPoint file.`,
        `Slide 2\n\nTroubleshooting\n\nPlease try uploading the file again.`
      ]
      setPptxSlides(errorSlides)
    } finally {
      setLoading(false)
    }
  }

  // Process AI highlight commands for PPTX
  useEffect(() => {
    const pptxHighlights = drawCommands.filter(cmd => 
      cmd.type === 'highlight' && cmd.documentType === 'pptx'
    )
    
    pptxHighlights.forEach(highlight => {
      triggerPptxHighlight(highlight)
    })
  }, [drawCommands, triggerPptxHighlight])

  // Render PPTX slides when they're ready
  useEffect(() => {
    if (pptxSlides.length > 0 && isPptx && activeTab === 'content') {
      renderPptxSlides()
    }
  }, [pptxSlides, currentSlide, isPptx, activeTab, renderPptxSlides])

  // Expose PPTX highlighting function to global scope
  useEffect(() => {
    window.highlightPptxText = (text, label, context) => {
      highlightPptxText(text, label, context)
    }
    return () => {
      delete window.highlightPptxText
    }
  }, [highlightPptxText])

  // Process AI highlight commands
  useEffect(() => {
    const docxHighlights = drawCommands.filter(cmd => 
      cmd.type === 'highlight' && cmd.documentType === 'docx'
    )
    
    docxHighlights.forEach(highlight => {
      triggerDocxHighlight(highlight)
    })
  }, [drawCommands, triggerDocxHighlight])

  // Clear highlights when context requests
  useEffect(() => {
    if (drawCommands.length === 0 && markInstanceRef.current) {
      markInstanceRef.current.unmark()
      setAiHighlights([])
    }
  }, [drawCommands])

  // Expose DOCX highlighting function to global scope with enhanced context
  useEffect(() => {
    window.highlightDocxText = (text, label, context) => {
      // Create comprehensive context for DOCX
      const fullContext = {
        // Document metadata
        documentInfo: {
          title: material?.title || 'Untitled Document',
          type: 'docx',
          sourceUrl: material?.source_url,
          courseId: material?.course_id,
          materialId: material?.id,
          timestamp: Date.now()
        },
        
        // Location information for DOCX
        location: {
          documentType: 'docx',
          position: 'document-body', // DOCX doesn't have pages like PDF
          section: context?.section || 'main-content',
          paragraph: context?.paragraph || 'unknown',
          positionDescription: `DOCX document, section: ${context?.section || 'main'}, paragraph: ${context?.paragraph || 'unknown'}`,
          textOffset: context?.offset || 0
        },
        
        // Selected content
        content: {
          selectedText: text,
          textLength: text.length,
          wordCount: text.split(/\s+/).length,
          characterCount: text.length
        },
        
        // Reading context
        readingContext: {
          userHighlights: aiHighlights.length,
          documentProgress: 50, // DOCX progress is harder to track
          sessionTime: Date.now() - (material?.sessionStartTime || Date.now()),
          isSelectionMode: false
        },
        
        // System context
        systemContext: {
          component: 'OfficeRenderer',
          viewer: 'docx-preview',
          coordinateSystem: 'text-based',
          renderingMethod: 'html-render',
          viewportSize: {
            width: window.innerWidth,
            height: window.innerHeight
          }
        }
      }
      
      highlightDocxText(text, label, fullContext)
    }
    return () => {
      delete window.highlightDocxText
    }
  }, [highlightDocxText, material, aiHighlights.length])

  // Handle Live Highlights from AI
  useEffect(() => {
    if (isDocx && docxContainerRef.current && drawCommands.length > 0) {
      if (!markInstanceRef.current) {
        markInstanceRef.current = new Mark(docxContainerRef.current)
      }
      
      const lastCommand = drawCommands[drawCommands.length - 1]
      if (lastCommand.type === 'highlight' && lastCommand.label) {
        markInstanceRef.current.unmark()
        markInstanceRef.current.mark(lastCommand.label, {
          className: 'luter-glow',
          accuracy: 'complementary'
        })
      }
    }
  }, [drawCommands, isDocx])

  const renderDocx = async (url) => {
    setLoading(true)
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = ""
        await docx.renderAsync(blob, docxContainerRef.current, docxContainerRef.current, {
          className: "docx",
          inWrapper: false
        })
      }
    } catch (err) {
      console.error("Docx render error:", err)
    } finally {
      setLoading(false)
    }
  }

  const downloadContent = () => {
    const content = analysisState[activeTab] || material.extracted_text
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${material.title}_${activeTab}.md`
    a.click()
  }

  const renderContent = () => {
    if (activeTab === 'content') {
      return (
        <div style={{ flex: 1, position: 'relative', background: '#F1F5F9', overflow: 'auto' }}>
          {isDocx ? (
            <div 
              ref={docxContainerRef} 
              className="docx-viewer-container"
              style={{ 
                padding: '40px', 
                background: 'white', 
                maxWidth: '900px', 
                margin: '20px auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                minHeight: '100%'
              }}
            />
          ) : isPptx ? (
            <div 
              ref={pptxContainerRef}
              style={{
                padding: '20px',
                height: '100%',
                minHeight: '600px'
              }}
            />
          ) : (
            <iframe
              src={viewerUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Document Viewer"
            />
          )}
          
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 40 }}>
              <Loader2 className="animate-spin" size={32} color="#7a12cc" />
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '24px', right: '24px', padding: '12px 20px', background: 'rgba(76, 29, 149, 0.9)', color: 'white', borderRadius: '12px', fontSize: '12px', fontFamily: 'Outfit', maxWidth: '240px', backdropFilter: 'blur(8px)', border: '1px solid #7a12cc', zIndex: 50 }}>
            <p style={{ margin: 0 }}>Luter is reading along with you using the {isDocx ? 'native DOM' : 'pre-scanned map'}.</p>
          </div>
        </div>
      )
    }

    if (analysisState.loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', background: 'white' }}>
          <Loader2 className="animate-spin" color="#7a12cc" size={32} />
          <p style={{ fontFamily: 'Outfit', color: '#4C1D95', fontWeight: 600 }}>Luter is analyzing the document...</p>
        </div>
      )
    }

    const content = analysisState[activeTab]
    if (!content) return null

    if (activeTab === 'flashcards') {
      const items = Array.isArray(content) ? content : []
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', color: '#4A5568' }}>
                  <option>Select topics...</option>
               </select>
            </div>
            <button style={{ fontSize: '13px', color: '#7a12cc', fontWeight: 600, background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> More
            </button>
          </div>

          <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 800, marginBottom: '32px', color: '#1A3A32' }}>{material.title}</h2>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
            <div 
              className={`ws-flashcard ${isFlipped ? 'ws-flashcard--flipped' : ''}`}
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ width: '100%', maxWidth: '600px', height: '350px' }}
            >
              <div className="ws-flashcard-inner">
                <div className="ws-flashcard-front" style={{ background: 'white', border: '1.5px solid #DDD6FE', borderRadius: '24px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '12px', color: '#94A3B8', fontWeight: 700 }}>Question</div>
                  <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px', color: '#F59E0B' }}>
                    <Star size={18} />
                    <Sparkles size={18} color="#7a12cc" />
                  </div>
                  <p style={{ fontSize: '20px', fontWeight: 700, textAlign: 'center', padding: '0 40px', color: '#1A3A32' }}>{items[currentIdx]?.front || "No cards generated"}</p>
                  <div style={{ position: 'absolute', bottom: '32px', color: '#7a12cc', fontSize: '14px', fontWeight: 600 }}>Click to flip</div>
                </div>
                <div className="ws-flashcard-back" style={{ background: '#F5F3FF', border: '1.5px solid #DDD6FE', borderRadius: '24px', position: 'relative' }}>
                   <p style={{ fontSize: '18px', textAlign: 'center', padding: '0 40px', color: '#4C1D95', lineHeight: 1.6 }}>{items[currentIdx]?.back}</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
               <button className="ws-tactile-btn" onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => Math.max(0, prev - 1)) }} disabled={currentIdx === 0}>
                 <ChevronLeft size={20} />
               </button>
               <span style={{ fontWeight: 800, color: '#4C1D95' }}>{currentIdx + 1} of {items.length}</span>
               <button className="ws-tactile-btn" onClick={(e) => { e.stopPropagation(); setCurrentIdx(prev => Math.min(items.length - 1, prev + 1)) }} disabled={currentIdx === items.length - 1}>
                 <ChevronRight size={20} />
               </button>
            </div>
          </div>
        </div>
      )
    }

    if (activeTab === 'quiz') {
      const items = Array.isArray(content) ? content : []
      const currentQuestion = items[currentIdx]
      
      const handleNext = () => {
        setShowExplanation(false)
        if (currentIdx < items.length - 1) {
          setCurrentIdx(currentIdx + 1)
        } else {
          // Calculate score if not already done
          const answeredCount = Object.keys(userAnswers).length
          setQuizScore({
            correct: answeredCount, // Simplified for now, in a real app you'd validate against Luter
            total: items.length
          })
        }
      }

      if (quizScore) {
        return (
          <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center', background: 'white', padding: '48px', borderRadius: '32px', border: '1px solid #E2E8F0', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
            <div style={{ width: '80px', height: '80px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Star size={40} color="#7a12cc" fill="#7a12cc" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1A3A32', marginBottom: '12px' }}>Quiz Completed!</h2>
            <p style={{ color: '#94A3B8', fontSize: '16px', marginBottom: '32px' }}>You've completed the Mock Exam for {material.title}.</p>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#7a12cc', marginBottom: '8px' }}>{quizScore.correct}/{quizScore.total}</div>
            <p style={{ fontWeight: 600, color: '#4C1D95', marginBottom: '40px' }}>Great effort! Review your answers below.</p>
            <button className="ws-tactile-btn" style={{ background: '#7a12cc', color: 'white', padding: '14px 40px', width: '100%' }} onClick={() => setQuizScore(null)}>Restart Quiz</button>
          </div>
        )
      }

      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <button className="ws-tactile-btn" style={{ background: '#FEE2E2', color: '#DC2626', padding: '8px 20px', border: 'none' }} onClick={() => onRunAnalysis('quiz')}>Regenerate</button>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px', flex: 1 }}>
              {items.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => { setCurrentIdx(i); setShowExplanation(false); }}
                  style={{ 
                    minWidth: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid',
                    borderColor: currentIdx === i ? '#7a12cc' : (userAnswers[i] ? '#DDD6FE' : '#E2E8F0'),
                    background: currentIdx === i ? '#7a12cc' : (userAnswers[i] ? '#F5F3FF' : 'transparent'),
                    color: currentIdx === i ? 'white' : (userAnswers[i] ? '#7a12cc' : '#94A3B8'),
                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #E2E8F0', padding: '48px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)', position: 'relative' }}>
             <div style={{ position: 'absolute', top: '24px', right: '40px', display: 'flex', gap: '8px' }}>
               <span style={{ padding: '4px 12px', background: currentQuestion?.difficulty === 'Hard' ? '#FEF2F2' : '#F0FDF4', color: currentQuestion?.difficulty === 'Hard' ? '#DC2626' : '#16A34A', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                 {currentQuestion?.difficulty || 'Standard'}
               </span>
             </div>

             <h3 style={{ fontSize: '22px', fontWeight: 800, textAlign: 'center', color: '#1A3A32', marginBottom: '40px', lineHeight: 1.4 }}>
               {currentQuestion?.question}
             </h3>

             <div style={{ maxWidth: '500px', margin: '0 auto' }}>
               <textarea 
                 placeholder="Type your answer here..."
                 value={userAnswers[currentIdx] || ''}
                 onChange={(e) => setUserAnswers(prev => ({ ...prev, [currentIdx]: e.target.value }))}
                 style={{ width: '100%', padding: '20px', borderRadius: '16px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', outline: 'none', fontSize: '15px', minHeight: '120px', resize: 'none', fontFamily: 'Outfit' }}
               />
               
               {showExplanation && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   style={{ marginTop: '24px', padding: '20px', background: '#F5F3FF', borderRadius: '16px', border: '1px solid #DDD6FE' }}
                 >
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7a12cc', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                     <Sparkles size={14} /> LUTER'S EXPLANATION
                   </div>
                   <p style={{ fontSize: '14px', color: '#4C1D95', lineHeight: 1.6, margin: 0 }}>
                     <strong>Correct Answer:</strong> {currentQuestion?.answer}<br/><br/>
                     {currentQuestion?.explanation}
                   </p>
                 </motion.div>
               )}
             </div>

             <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '48px' }}>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#F8FAFC', color: '#64748B' }} onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))} disabled={currentIdx === 0}>Previous</button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#F5F3FF', color: '#7a12cc' }} onClick={() => setShowExplanation(!showExplanation)}>
                  {showExplanation ? 'Hide Answer' : 'Reveal Answer'}
                </button>
                <button className="ws-tactile-btn" style={{ padding: '12px 32px', background: '#7a12cc', color: 'white' }} onClick={handleNext}>
                  {currentIdx === items.length - 1 ? 'Finish Quiz' : 'Next Question'}
                </button>
             </div>
          </div>
        </div>
      )
    }

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
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {activeTab === 'content' && (
        <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4A5568' }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '12px', fontFamily: 'Outfit' }}>
              Using {isDocx ? 'Native DOM Renderer' : isPptx ? 'Slide Viewer with AI Highlights' : 'External Viewer'} for {material.type?.toUpperCase()}
            </span>
            {isPptx && pptxSlides.length > 0 && (
              <span style={{ 
                fontSize: '11px', 
                background: '#10B981', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '12px', 
                fontWeight: 600 
              }}>
                AI Highlights Active
              </span>
            )}
          </div>
          <a 
            href={fileUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ws-send-btn"
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            <ExternalLink size={12} /> open original
          </a>
        </div>
      )}
      
      {renderContent()}
    </div>
  )
}
