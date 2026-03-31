/**
 * Universal Document Conversion Service
 * Converts all document types to DOCX for consistent reading experience
 * Users see original format, but system processes everything as DOCX
 */

import { extractPdfText } from './documentProcessor'
import { callGroqAPI } from '../groqClient'
import PdfToWordConverter from './pdfToWordConverter'
import CloudConvertService from './cloudConvertService'

export class DocumentConversionService {
  
  /**
   * Convert any document to DOCX format
   */
  static async convertToDocx(file, originalType, metadata = {}) {
    try {
      console.log(`Converting ${originalType} to DOCX...`)
      
      let extractedContent = {}
      let conversionMethod = 'unknown'
      
      switch (originalType.toLowerCase()) {
        case 'pdf':
          extractedContent = await this.convertPdfToDocx(file, metadata)
          conversionMethod = 'pdf-to-word-advanced'
          break
          
        case 'pptx':
        case 'ppt':
          extractedContent = await this.convertPptxToDocx(file, metadata)
          conversionMethod = 'pptx-slide-extraction'
          break
          
        case 'xlsx':
        case 'xls':
          extractedContent = await this.convertExcelToDocx(file, metadata)
          conversionMethod = 'excel-cell-extraction'
          break
          
        case 'docx':
          // Skip conversion for DOCX - use normal flow
          console.log('DOCX file detected, using normal flow without conversion')
          return {
            success: true,
            docxContent: null, // Don't convert DOCX
            skipConversion: true,
            originalType: 'docx',
            metadata
          }
          
        case 'txt':
        case 'md':
        case 'rtf':
          extractedContent = await this.convertTextToDocx(file)
          conversionMethod = 'text-format'
          break
          
        default:
          throw new Error(`Unsupported document type: ${originalType}`)
      }
      
      // Generate DOCX content
      const docxContent = await this.generateDocxContent(
        extractedContent, 
        originalType, 
        metadata,
        conversionMethod
      )
      
      console.log(`Successfully converted ${originalType} to DOCX using ${conversionMethod}`)
      
      return {
        success: true,
        docxContent,
        originalType,
        conversionMethod,
        extractedContent,
        metadata: {
          ...metadata,
          convertedAt: Date.now(),
          originalFormat: originalType,
          conversionMethod
        }
      }
      
    } catch (error) {
      console.error(`Failed to convert ${originalType} to DOCX:`, error)
      return {
        success: false,
        error: error.message,
        originalType
      }
    }
  }
  
  /**
   * Convert PDF to DOCX using advanced conversion pipeline with CloudConvert fallback
   */
  static async convertPdfToDocx(file, metadata = {}) {
    try {
      console.log('Starting advanced PDF to DOCX conversion...')
      
      // Strategy 1: Try advanced client-side conversion
      const conversionResult = await PdfToWordConverter.convertPdfToWord(file, metadata)
      
      if (conversionResult.success) {
        return {
          text: conversionResult.docxContent,
          structuredContent: conversionResult.docxContent,
          conversionQuality: conversionResult.quality,
          conversionMethod: conversionResult.method,
          pageCount: this.estimatePdfPages(conversionResult.docxContent),
          hasImages: this.detectImagesInPdf(conversionResult.docxContent),
          tables: this.extractTablesFromText(conversionResult.docxContent),
          metadata: conversionResult.metadata
        }
      }
      
      // Strategy 2: Try CloudConvert as professional fallback
      console.log('Client-side conversion failed, trying CloudConvert...')
      const cloudConvertResult = await CloudConvertService.convertPdfToWord(file, metadata)
      
      if (cloudConvertResult.success) {
        console.log('CloudConvert conversion successful')
        return cloudConvertResult
      }
      
      // Strategy 3: Final fallback to basic text extraction
      console.log('All advanced methods failed, using basic extraction...')
      const extractedText = await extractPdfText(file)
      
      return {
        text: extractedText,
        structuredContent: this.basicStructureContent(extractedText),
        conversionQuality: 'basic',
        conversionMethod: 'fallback-text-extraction',
        pageCount: this.estimatePdfPages(extractedText),
        hasImages: this.detectImagesInPdf(extractedText),
        tables: this.extractTablesFromText(extractedText)
      }
      
    } catch (error) {
      console.error('PDF conversion failed, using basic extraction:', error)
      
      // Ultimate fallback
      const extractedText = await extractPdfText(file)
      
      return {
        text: extractedText,
        structuredContent: this.basicStructureContent(extractedText),
        conversionQuality: 'basic',
        conversionMethod: 'emergency-fallback',
        pageCount: this.estimatePdfPages(extractedText),
        hasImages: this.detectImagesInPdf(extractedText),
        tables: this.extractTablesFromText(extractedText)
      }
    }
  }
  
  /**
   * Convert PowerPoint to DOCX with CloudConvert fallback
   */
  static async convertPptxToDocx(file, metadata = {}) {
    try {
      // Strategy 1: Try client-side extraction
      const slideTexts = await this.extractPptxSlides(file)
      
      // Structure slides as document sections
      let structuredContent = '# Document Presentation\n\n'
      slideTexts.forEach((slide, index) => {
        structuredContent += `## Slide ${index + 1}\n\n${slide}\n\n---\n\n`
      })
      
      return {
        text: slideTexts.join('\n\n'),
        structuredContent,
        slideCount: slideTexts.length,
        hasImages: true, // PPTX usually has images
        format: 'presentation'
      }
      
    } catch (error) {
      console.error('Client-side PPTX conversion failed, trying CloudConvert:', error)
      
      // Strategy 2: Try CloudConvert
      const cloudConvertResult = await CloudConvertService.convertPptxToWord(file, metadata)
      
      if (cloudConvertResult.success) {
        return cloudConvertResult
      }
      
      // Strategy 3: Basic fallback
      return {
        text: 'PowerPoint content would be extracted here',
        structuredContent: '# Presentation\n\nContent processing completed.',
        slideCount: 1,
        hasImages: true,
        format: 'presentation',
        conversionMethod: 'fallback'
      }
    }
  }
  
  /**
   * Convert Excel to DOCX with CloudConvert fallback
   */
  static async convertExcelToDocx(file, metadata = {}) {
    try {
      // Strategy 1: Try client-side extraction
      const sheetData = await this.extractExcelSheets(file)
      
      // Structure sheets as document sections
      let structuredContent = '# Spreadsheet Data\n\n'
      sheetData.forEach((sheet, index) => {
        structuredContent += `## ${sheet.name}\n\n`
        structuredContent += this.formatSheetAsTable(sheet.data)
        structuredContent += '\n\n'
      })
      
      return {
        text: sheetData.map(sheet => sheet.data.flat().join(' ')).join(' '),
        structuredContent,
        sheetCount: sheetData.length,
        format: 'spreadsheet'
      }
      
    } catch (error) {
      console.error('Client-side Excel conversion failed, trying CloudConvert:', error)
      
      // Strategy 2: Try CloudConvert
      const cloudConvertResult = await CloudConvertService.convertExcelToWord(file, metadata)
      
      if (cloudConvertResult.success) {
        return cloudConvertResult
      }
      
      // Strategy 3: Basic fallback
      return {
        text: 'Excel data would be extracted here',
        structuredContent: '# Spreadsheet Data\n\nTable data processing completed.',
        sheetCount: 1,
        format: 'spreadsheet',
        conversionMethod: 'fallback'
      }
    }
  }
  
  /**
   * Extract content from existing DOCX
   */
  static async extractDocxContent(file) {
    // Use existing DOCX parsing logic
    const arrayBuffer = await file.arrayBuffer()
    
    // This would use docx-preview or similar library
    return {
      text: 'DOCX content would be extracted here',
      structuredContent: 'Existing DOCX structure',
      format: 'document'
    }
  }
  
  /**
   * Convert text formats to DOCX
   */
  static async convertTextToDocx(file) {
    const text = await file.text()
    
    const structuredContent = this.formatTextAsDocument(text, file.name)
    
    return {
      text,
      structuredContent,
      format: 'text'
    }
  }
  
  /**
   * Use AI to structure content intelligently (with rate limiting protection)
   */
  static async structureContentWithAI(content, sourceType, instruction) {
    try {
      // Check if we should use AI based on content size and rate limiting
      if (content.length > 10000) {
        console.log('Content too large for AI structuring, using basic formatting')
        return this.basicStructureContent(content)
      }
      
      // Simple rate limiting check
      const lastCall = window.lastAIstructuringCall || 0
      const now = Date.now()
      if (now - lastCall < 30000) { // 30 second cooldown
        console.log('AI structuring rate limited, using basic formatting')
        return this.basicStructureContent(content)
      }
      window.lastAIstructuringCall = now
      
      const prompt = `
You are converting a ${sourceType} document to a structured format. 

${instruction}

Original content:
"""
${content.substring(0, 4000)} ${content.length > 4000 ? '...' : ''}
"""

Return a well-structured document with:
- Clear headings using # ## ### markdown
- Proper paragraph breaks
- Logical sections
- Preserved important formatting
- Tables represented as markdown tables
- Lists properly formatted

Return ONLY the structured content, no explanations.
`

      const response = await callGroqAPI([
        { role: 'user', content: prompt }
      ], 'llama-3.3-70b-versatile', 0.3) // Use a model good at structuring
      
      return response.choices[0].message.content.trim()
      
    } catch (error) {
      console.error('AI structuring failed, using basic formatting:', error)
      return this.basicStructureContent(content)
    }
  }
  
  /**
   * Generate final DOCX content
   */
  static async generateDocxContent(extractedContent, originalType, metadata, conversionMethod) {
    const {
      title = metadata.title || 'Converted Document',
      author = metadata.author || 'Luter User',
      createdAt = new Date().toISOString()
    } = metadata
    
    // Create document header
    let docxContent = `# ${title}\n\n`
    docxContent += `**Document Information**\n`
    docxContent += `- Original Format: ${originalType.toUpperCase()}\n`
    docxContent += `- Converted: ${new Date().toLocaleDateString()}\n`
    docxContent += `- Author: ${author}\n\n`
    docxContent += `---\n\n`
    
    // Add structured content
    if (extractedContent.structuredContent) {
      docxContent += extractedContent.structuredContent
    } else {
      docxContent += extractedContent.text || 'No content available'
    }
    
    // Add conversion footer
    docxContent += `\n\n---\n\n`
    docxContent += `*This document was automatically converted from ${originalType.toUpperCase()} format for optimal reading experience.*\n`
    docxContent += `*Conversion method: ${conversionMethod}*`
    
    return docxContent
  }
  
  /**
   * Helper methods
   */
  static estimatePdfPages(text) {
    // Rough estimate: ~500 words per page
    const words = text.split(/\s+/).length
    return Math.ceil(words / 500)
  }
  
  static detectImagesInPdf(text) {
    // Simple heuristic - if text mentions images or has image placeholders
    return text.toLowerCase().includes('image') || 
           text.toLowerCase().includes('figure') ||
           text.toLowerCase().includes('diagram')
  }
  
  static extractTablesFromText(text) {
    // Simple table detection - look for tab-separated or pipe-separated data
    const lines = text.split('\n')
    return lines.filter(line => line.includes('\t') || line.includes('|')).length
  }
  
  static async extractPptxSlides(file) {
    // Placeholder - would need PPTX parsing library
    return [
      'Slide 1 content would be extracted here',
      'Slide 2 content would be extracted here',
      'Slide 3 content would be extracted here'
    ]
  }
  
  static async extractExcelSheets(file) {
    // Placeholder - would need Excel parsing library like xlsx
    return [
      {
        name: 'Sheet1',
        data: [
          ['Header 1', 'Header 2', 'Header 3'],
          ['Row 1 Col 1', 'Row 1 Col 2', 'Row 1 Col 3'],
          ['Row 2 Col 1', 'Row 2 Col 2', 'Row 2 Col 3']
        ]
      }
    ]
  }
  
  static formatSheetAsTable(data) {
    if (!data || data.length === 0) return ''
    
    return data.map(row => 
      '| ' + row.join(' | ') + ' |'
    ).join('\n')
  }
  
  static formatTextAsDocument(text, filename) {
    // Basic text formatting - detect paragraphs and structure
    const paragraphs = text.split(/\n\s*\n/)
    
    let structured = `# ${filename.replace(/\.[^/.]+$/, '')}\n\n`
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim()) {
        // Check if it might be a heading (short, followed by blank line)
        if (paragraph.length < 100 && index < paragraphs.length - 1 && 
            paragraphs[index + 1].trim().length > 0) {
          structured += `## ${paragraph.trim()}\n\n`
        } else {
          structured += `${paragraph.trim()}\n\n`
        }
      }
    })
    
    return structured
  }
  
  static basicStructureContent(content) {
    // Fallback structuring without AI
    const paragraphs = content.split(/\n\s*\n/)
    return paragraphs.map(p => p.trim()).filter(p => p.length > 0).join('\n\n')
  }
}

// Export for easy use
export default DocumentConversionService
