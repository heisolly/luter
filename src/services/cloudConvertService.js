/**
 * CloudConvert Integration Service
 * Professional fallback for document conversion
 * Users never see this - it's a silent background process
 */

export class CloudConvertService {
  
  /**
   * Convert document using CloudConvert API
   * This is used as a professional fallback when client-side conversion fails
   */
  static async convertDocument(file, originalType, targetFormat = 'docx') {
    try {
      console.log(`Starting CloudConvert conversion: ${originalType} → ${targetFormat}`)
      
      // Convert file to base64
      const base64 = await this.fileToBase64(file)
      
      // Call our serverless function
      const response = await fetch('/api/convert-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileBase64: base64,
          filename: file.name,
          originalType,
          targetFormat
        })
      })
      
      if (!response.ok) {
        throw new Error(`CloudConvert API error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'CloudConvert conversion failed')
      }
      
      console.log(`CloudConvert conversion successful: ${result.method}`)
      
      return {
        success: true,
        docxContent: result.content,
        downloadUrl: result.url,
        method: 'cloudconvert',
        quality: 'professional',
        metadata: {
          ...result.metadata,
          conversionMethod: 'cloudconvert',
          processedAt: Date.now()
        }
      }
      
    } catch (error) {
      console.error('CloudConvert conversion failed:', error)
      return {
        success: false,
        error: error.message,
        method: 'cloudconvert'
      }
    }
  }
  
  /**
   * Specialized PDF to Word conversion using CloudConvert
   */
  static async convertPdfToWord(pdfFile, metadata = {}) {
    try {
      const result = await this.convertDocument(pdfFile, 'pdf', 'docx')
      
      if (result.success) {
        return {
          ...result,
          text: result.docxContent,
          structuredContent: result.docxContent,
          conversionQuality: 'professional',
          pageCount: this.estimatePdfPages(result.docxContent),
          hasImages: this.detectImagesInContent(result.docxContent),
          tables: this.extractTablesFromContent(result.docxContent),
          metadata: {
            ...metadata,
            ...result.metadata
          }
        }
      }
      
      return result
      
    } catch (error) {
      console.error('CloudConvert PDF conversion failed:', error)
      return {
        success: false,
        error: error.message,
        method: 'cloudconvert-pdf'
      }
    }
  }
  
  /**
   * Convert PowerPoint to Word using CloudConvert
   */
  static async convertPptxToWord(pptxFile, metadata = {}) {
    try {
      const result = await this.convertDocument(pptxFile, 'pptx', 'docx')
      
      if (result.success) {
        return {
          ...result,
          text: result.docxContent,
          structuredContent: result.docxContent,
          conversionQuality: 'professional',
          slideCount: this.estimateSlideCount(result.docxContent),
          hasImages: true, // PPTX usually has images
          metadata: {
            ...metadata,
            ...result.metadata
          }
        }
      }
      
      return result
      
    } catch (error) {
      console.error('CloudConvert PPTX conversion failed:', error)
      return {
        success: false,
        error: error.message,
        method: 'cloudconvert-pptx'
      }
    }
  }
  
  /**
   * Convert Excel to Word using CloudConvert
   */
  static async convertExcelToWord(excelFile, metadata = {}) {
    try {
      const result = await this.convertDocument(excelFile, 'xlsx', 'docx')
      
      if (result.success) {
        return {
          ...result,
          text: result.docxContent,
          structuredContent: result.docxContent,
          conversionQuality: 'professional',
          sheetCount: this.estimateSheetCount(result.docxContent),
          metadata: {
            ...metadata,
            ...result.metadata
          }
        }
      }
      
      return result
      
    } catch (error) {
      console.error('CloudConvert Excel conversion failed:', error)
      return {
        success: false,
        error: error.message,
        method: 'cloudconvert-excel'
      }
    }
  }
  
  /**
   * Check if CloudConvert is available
   */
  static async checkAvailability() {
    try {
      const response = await fetch('/api/convert-document/status')
      const status = await response.json()
      return status.available || false
    } catch (error) {
      console.error('CloudConvert availability check failed:', error)
      return false
    }
  }
  
  /**
   * Get conversion status and capabilities
   */
  static async getCapabilities() {
    try {
      const response = await fetch('/api/convert-document/capabilities')
      const capabilities = await response.json()
      return capabilities
    } catch (error) {
      console.error('Failed to get CloudConvert capabilities:', error)
      return {
        available: false,
        supportedFormats: [],
        maxFileSize: 0
      }
    }
  }
  
  /**
   * Utility: Convert file to base64
   */
  static async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = error => reject(error)
    })
  }
  
  /**
   * Utility: Estimate PDF pages from content
   */
  static estimatePdfPages(content) {
    const words = content.split(/\s+/).length
    return Math.ceil(words / 500)
  }
  
  /**
   * Utility: Detect images in content
   */
  static detectImagesInContent(content) {
    return content.toLowerCase().includes('image') || 
           content.toLowerCase().includes('figure') ||
           content.toLowerCase().includes('diagram') ||
           content.toLowerCase().includes('picture')
  }
  
  /**
   * Utility: Extract tables from content
   */
  static extractTablesFromContent(content) {
    const lines = content.split('\n')
    return lines.filter(line => line.includes('\t') || line.includes('|')).length
  }
  
  /**
   * Utility: Estimate slide count from content
   */
  static estimateSlideCount(content) {
    // Look for slide indicators
    const slideMarkers = content.match(/slide \d+/gi) || []
    return Math.max(slideMarkers.length, Math.ceil(content.length / 2000))
  }
  
  /**
   * Utility: Estimate sheet count from content
   */
  static estimateSheetCount(content) {
    // Look for sheet indicators
    const sheetMarkers = content.match(/sheet \d+/gi) || []
    return Math.max(sheetMarkers.length, 1)
  }
}

export default CloudConvertService
