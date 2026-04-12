/**
 * Document Context Service
 * Provides comprehensive location and context information for all document types
 * Ensures tutor gets full context about exact document locations
 */

export class DocumentContextService {
  
  /**
   * Create comprehensive context for any document type
   */
  static createContext(documentType, material, locationInfo, selectedContent, readingContext, systemContext) {
    const baseContext = {
      // Document metadata
      documentInfo: {
        title: material?.title || 'Untitled Document',
        type: documentType,
        sourceUrl: material?.source_url,
        courseId: material?.course_id,
        materialId: material?.id,
        timestamp: Date.now(),
        fileSize: material?.file_size,
        uploadedAt: material?.created_at,
        lastModified: material?.updated_at
      },
      
      // Location information (specific to document type)
      location: this.createLocationContext(documentType, locationInfo),
      
      // Selected content analysis
      content: this.createContentContext(selectedContent),
      
      // Reading behavior context
      readingContext: this.createReadingContext(readingContext),
      
      // System technical context
      systemContext: this.createSystemContext(documentType, systemContext)
    }
    
    return baseContext
  }
  
  /**
   * Create location-specific context based on document type
   */
  static createLocationContext(documentType, locationInfo) {
    const baseLocation = {
      documentType,
      timestamp: Date.now()
    }
    
    switch (documentType) {
      case 'pdf':
        return {
          ...baseLocation,
          currentPage: locationInfo?.currentPage || 1,
          totalPages: locationInfo?.totalPages || 1,
          pageIndex: (locationInfo?.currentPage || 1) - 1,
          coordinates: locationInfo?.coordinates || {},
          positionDescription: `Page ${locationInfo?.currentPage || 1} of ${locationInfo?.totalPages || 1}`,
          zoomLevel: locationInfo?.zoomLevel || 1.0,
          viewportInfo: locationInfo?.viewportInfo || {}
        }
        
      case 'docx':
        return {
          ...baseLocation,
          position: 'document-body',
          section: locationInfo?.section || 'main-content',
          paragraph: locationInfo?.paragraph || 'unknown',
          headingLevel: locationInfo?.headingLevel || null,
          textOffset: locationInfo?.textOffset || 0,
          positionDescription: `DOCX document, section: ${locationInfo?.section || 'main'}, paragraph: ${locationInfo?.paragraph || 'unknown'}`
        }
        
      case 'xlsx':
        return {
          ...baseLocation,
          worksheet: locationInfo?.worksheet || 'Sheet1',
          cellRange: locationInfo?.cellRange || 'A1',
          row: locationInfo?.row || 1,
          column: locationInfo?.column || 'A',
          positionDescription: `Excel worksheet: ${locationInfo?.worksheet || 'Sheet1'}, cell: ${locationInfo?.cellRange || 'A1'}`
        }
        
      case 'pptx':
        return {
          ...baseLocation,
          slideNumber: locationInfo?.slideNumber || 1,
          totalSlides: locationInfo?.totalSlides || 1,
          slideIndex: (locationInfo?.slideNumber || 1) - 1,
          positionOnSlide: locationInfo?.positionOnSlide || 'content-area',
          positionDescription: `PowerPoint slide ${locationInfo?.slideNumber || 1} of ${locationInfo?.totalSlides || 1}`
        }
        
      default:
        return {
          ...baseLocation,
          position: 'unknown',
          positionDescription: `${documentType.toUpperCase()} document, location unspecified`
        }
    }
  }
  
  /**
   * Create content analysis context
   */
  static createContentContext(selectedContent) {
    if (!selectedContent) {
      return {
        selectedText: '',
        textLength: 0,
        wordCount: 0,
        characterCount: 0,
        lineCount: 0,
        paragraphCount: 0,
        language: 'unknown',
        contentType: 'text'
      }
    }
    
    const text = selectedContent.text || selectedContent.selectedText || ''
    
    return {
      selectedText: text,
      textLength: text.length,
      wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
      characterCount: text.length,
      lineCount: text.split('\n').length,
      paragraphCount: text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
      language: this.detectLanguage(text),
      contentType: this.detectContentType(text),
      hasFormulas: this.containsFormulas(text),
      hasNumbers: /\d/.test(text),
      hasUrls: /https?:\/\/|www\./i.test(text)
    }
  }
  
  /**
   * Create reading behavior context
   */
  static createReadingContext(readingContext) {
    return {
      userHighlights: readingContext?.userHighlights || 0,
      documentProgress: readingContext?.documentProgress || 0,
      sessionTime: readingContext?.sessionTime || 0,
      isSelectionMode: readingContext?.isSelectionMode || false,
      scrollPosition: readingContext?.scrollPosition || 0,
      readingSpeed: readingContext?.readingSpeed || 0, // words per minute
      focusScore: readingContext?.focusScore || 0,
      lastActivity: readingContext?.lastActivity || Date.now(),
      timeOnPage: readingContext?.timeOnPage || 0,
      totalViewTime: readingContext?.totalViewTime || 0
    }
  }
  
  /**
   * Create system technical context
   */
  static createSystemContext(documentType, systemContext) {
    return {
      component: systemContext?.component || 'UnknownRenderer',
      viewer: systemContext?.viewer || 'unknown',
      coordinateSystem: systemContext?.coordinateSystem || 'unknown',
      renderingMethod: systemContext?.renderingMethod || 'unknown',
      viewportSize: {
        width: window.innerWidth,
        height: window.innerHeight,
        ...systemContext?.viewportSize
      },
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      },
      performance: {
        loadTime: systemContext?.loadTime || 0,
        renderTime: systemContext?.renderTime || 0,
        memoryUsage: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null
      }
    }
  }
  
  /**
   * Detect language of selected text (simple implementation)
   */
  static detectLanguage(text) {
    if (!text || text.length < 10) return 'unknown'
    
    // Simple language detection based on character patterns
    const englishPattern = /^[a-zA-Z\s\d.,!?;:'"()-]+$/
    const frenchPattern = /[àâäéèêëïîôöùûüÿç]/i
    const spanishPattern = /[ñáéíóúü]/i
    const germanPattern = /[äöüß]/i
    
    if (frenchPattern.test(text)) return 'french'
    if (spanishPattern.test(text)) return 'spanish'
    if (germanPattern.test(text)) return 'german'
    if (englishPattern.test(text)) return 'english'
    
    return 'unknown'
  }
  
  /**
   * Detect type of content
   */
  static detectContentType(text) {
    if (!text) return 'empty'
    
    // Check for different content types
    if (/^\s*\d+\.\s/.test(text) || /^-\s/.test(text) || /^\*\s/.test(text)) return 'list'
    if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text) || /\d{1,2}-\d{1,2}-\d{2,4}/.test(text)) return 'date'
    if (/^https?:\/\/|www\./i.test(text)) return 'url'
    if (/^[\w._%+-]+@[\w.-]+\.[A-Z]{2,}$/i.test(text)) return 'email'
    if (/^\(?[\d]{3}\)?[-.\s]?[\d]{3}[-.\s]?[\d]{4}$/.test(text)) return 'phone'
    if (/^[A-Z]/.test(text) && text.includes(' ') && text.length < 100) return 'sentence'
    if (text.includes('\n') && text.length > 200) return 'paragraph'
    if (this.containsFormulas(text)) return 'formula'
    
    return 'text'
  }
  
  /**
   * Check if text contains mathematical/scientific formulas
   */
  static containsFormulas(text) {
    const formulaPatterns = [
      /[a-zA-Z]\s*=\s*[a-zA-Z0-9+\-*/()]+/, // Simple equations
      /∫|∑|∏|∂|∇/, // Mathematical symbols
      /π|e|θ|α|β|γ|δ/, // Greek letters
      /\^2|\^3|\^n/, // Exponents
      /√|∛|∜/, // Roots
      /sin|cos|tan|log|ln|exp/i // Functions
    ]
    
    return formulaPatterns.some(pattern => pattern.test(text))
  }
  
  /**
   * Send context to tutor with all available information
   */
  static sendToAITutor(fullContext) {
    // Create a comprehensive prompt for the AI
    const prompt = this.createAIPrompt(fullContext)
    
    // Send through existing AI systems
    if (window.luterAI) {
      // Send to highlight system with full context
      const highlightMethod = `highlight${fullContext.documentInfo.type.charAt(0).toUpperCase() + fullContext.documentInfo.type.slice(1)}Area`
      if (window.luterAI[highlightMethod]) {
        window.luterAI[highlightMethod]({
          ...fullContext.location,
          label: `User Question: ${fullContext.content.selectedText.substring(0, 50)}${fullContext.content.selectedText.length > 50 ? '...' : ''}`,
          color: '#7a12cc',
          context: fullContext
        })
      }
    }
    
    // Send to tool interface
    if (window.aiToolInterface) {
      console.log('Sending comprehensive context to tutor:', fullContext)
    }
    
    // Enhanced global function
    if (window.sendToLuterWithFullContext) {
      window.sendToLuterWithFullContext(fullContext)
    }
    
    // Fallback: copy comprehensive prompt to clipboard
    navigator.clipboard.writeText(prompt).then(() => {
      console.log('Comprehensive context copied to clipboard for tutor')
    }).catch(() => {
      console.log('Comprehensive prompt for tutor:', prompt)
    })
    
    return prompt
  }
  
  /**
   * Create comprehensive AI prompt from context
   */
  static createAIPrompt(context) {
    const { documentInfo, location, content, readingContext, systemContext } = context
    
    return `Please help me understand this content from "${documentInfo.title}":

DOCUMENT TYPE: ${documentInfo.type.toUpperCase()}
LOCATION: ${location.positionDescription}
SELECTED TEXT: "${content.selectedText}"

CONTENT ANALYSIS:
- Length: ${content.textLength} characters, ${content.wordCount} words
- Content type: ${content.contentType}
- Language: ${content.language}
- Contains formulas: ${content.hasFormulas ? 'Yes' : 'No'}

READING CONTEXT:
- Progress: ${Math.round(readingContext.documentProgress)}% through document
- User highlights created: ${readingContext.userHighlights}
- Session time: ${Math.round(readingContext.sessionTime / 1000 / 60)} minutes

SYSTEM CONTEXT:
- Viewer: ${systemContext.viewer}
- Coordinate system: ${systemContext.coordinateSystem}

Please provide a detailed explanation of this content in the context of the document, considering its location and my reading progress.`
  }
}

// Expose globally for easy access
if (typeof window !== 'undefined') {
  window.DocumentContextService = DocumentContextService
}
