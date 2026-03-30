// AI Highlight Service - Context-Aware Document Analysis
import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../groqClient'

/**
 * AI Service for analyzing documents and generating smart highlights
 * This service understands document context and can trigger precise highlights
 */
export class AIHighlightService {
  
  /**
   * Analyze document and generate coordinate-based highlights for PDFs
   */
  static async analyzePdfForHighlights(material, userQuestion = '') {
    try {
      const prompt = `
Analyze this PDF document and identify key areas that should be highlighted for better understanding.

Document Title: ${material.title}
${userQuestion ? `User Question: ${userQuestion}` : ''}

Return a JSON array of highlight objects with the following structure:
{
  "highlights": [
    {
      "pageIndex": 0,
      "left": 20,
      "top": 30, 
      "width": 25,
      "height": 5,
      "label": "Key Formula",
      "reason": "This is the main formula used throughout the document",
      "importance": "high"
    }
  ]
}

Guidelines:
- Identify formulas, definitions, key concepts, and important data
- Provide approximate coordinates (0-100% for left/top, reasonable width/height)
- Label each highlight clearly
- Include why it's important
- Use pageIndex (0-based) for multi-page documents
- Focus on areas that answer the user's question if provided

Return ONLY valid JSON.
`

      const response = await callGroqAPI(
        [{ 
          role: 'user', 
          content: `Document Content: ${material.extracted_text?.slice(0, 8000)}\n\n${prompt}` 
        }],
        GROQ_MODELS.SPEEDSTER,
        { systemPromptOverride: GROQ_PROMPTS.AI_TUTOR }
      )

      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return { highlights: [] }
    } catch (error) {
      console.error('Error analyzing PDF for highlights:', error)
      return { highlights: [] }
    }
  }

  /**
   * Analyze DOCX document and generate text-based highlights
   */
  static async analyzeDocxForHighlights(material, userQuestion = '') {
    try {
      const prompt = `
Analyze this Word document and identify key text passages that should be highlighted.

Document Title: ${material.title}
${userQuestion ? `User Question: ${userQuestion}` : ''}

Return a JSON array of text highlights:
{
  "highlights": [
    {
      "text": "exact text to highlight",
      "label": "Key Definition",
      "reason": "This defines the core concept",
      "importance": "high",
      "context": "surrounding text for context"
    }
  ]
}

Guidelines:
- Find exact text matches for important concepts
- Include surrounding context for accuracy
- Label each highlight clearly
- Explain why it's important
- Focus on definitions, key terms, and important statements
- Prioritize content that answers the user's question

Return ONLY valid JSON.
`

      const response = await callGroqAPI(
        [{ 
          role: 'user', 
          content: `Document Content: ${material.extracted_text?.slice(0, 8000)}\n\n${prompt}` 
        }],
        GROQ_MODELS.SPEEDSTER,
        { systemPromptOverride: GROQ_PROMPTS.AI_TUTOR }
      )

      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return { highlights: [] }
    } catch (error) {
      console.error('Error analyzing DOCX for highlights:', error)
      return { highlights: [] }
    }
  }

  /**
   * Analyze Excel data and generate cell-based highlights
   */
  static async analyzeExcelForHighlights(material, userQuestion = '') {
    try {
      const prompt = `
Analyze this Excel spreadsheet data and identify important cells or ranges that should be highlighted.

Document Title: ${material.title}
${userQuestion ? `User Question: ${userQuestion}` : ''}

Return a JSON array of cell highlights:
{
  "highlights": [
    {
      "cellRange": "B2:B6",
      "label": "Revenue Growth",
      "reason": "Shows consistent revenue growth over time",
      "importance": "high",
      "color": "#10b981"
    }
  ]
}

Guidelines:
- Identify important data trends, outliers, or key metrics
- Use Excel cell notation (A1, B2:C5, etc.)
- Suggest appropriate colors:
  - #10b981 (green) for positive/good data
  - #ef4444 (red) for negative/concerning data  
  - #f59e0b (amber) for neutral/important data
  - #7a12cc (purple) for critical insights
- Label each highlight clearly
- Explain the significance
- Focus on data that answers the user's question

Return ONLY valid JSON.
`

      const response = await callGroqAPI(
        [{ 
          role: 'user', 
          content: `Spreadsheet Data: ${material.extracted_text?.slice(0, 8000)}\n\n${prompt}` 
        }],
        GROQ_MODELS.SPEEDSTER,
        { systemPromptOverride: GROQ_PROMPTS.AI_TUTOR }
      )

      const content = response.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      
      return { highlights: [] }
    } catch (error) {
      console.error('Error analyzing Excel for highlights:', error)
      return { highlights: [] }
    }
  }

  /**
   * Trigger AI highlights based on user question
   */
  static async triggerContextualHighlights(material, userQuestion, documentType) {
    let analysis
    
    switch (documentType) {
      case 'pdf':
        analysis = await this.analyzePdfForHighlights(material, userQuestion)
        break
      case 'docx':
        analysis = await this.analyzeDocxForHighlights(material, userQuestion)
        break
      case 'xlsx':
        analysis = await this.analyzeExcelForHighlights(material, userQuestion)
        break
      default:
        console.warn(`Unsupported document type: ${documentType}`)
        return { highlights: [] }
    }

    // Apply highlights using the global AI functions
    if (analysis.highlights && analysis.highlights.length > 0) {
      analysis.highlights.forEach(highlight => {
        if (documentType === 'pdf' && window.luterAI?.highlightPdfArea) {
          window.luterAI.highlightPdfArea(highlight)
        } else if (documentType === 'docx' && window.luterAI?.highlightDocxText) {
          window.luterAI.highlightDocxText(highlight.text, highlight.label, highlight.context)
        } else if (documentType === 'xlsx' && window.luterAI?.highlightExcelCells) {
          window.luterAI.highlightExcelCells(highlight.cellRange, highlight.label, highlight.color)
        }
      })
    }

    return analysis
  }

  /**
   * Generate smart highlights for key concepts without user query
   */
  static async generateSmartHighlights(material, documentType) {
    const prompt = `
Analyze this document and automatically highlight the most important concepts that a student should focus on.

Document Title: ${material.title}

Identify and highlight:
1. Key definitions and terminology
2. Important formulas or equations
3. Critical data points or findings
4. Main conclusions or takeaways
5. Any concepts that are frequently tested

Generate highlights that would be most valuable for studying and exam preparation.
`

    return this.triggerContextualHighlights(material, prompt, documentType)
  }

  /**
   * Clear all AI highlights
   */
  static clearAllHighlights() {
    if (window.luterAI?.clearHighlights) {
      window.luterAI.clearHighlights()
    }
  }

  /**
   * Get highlight summary for user
   */
  static getHighlightSummary(highlights) {
    if (!highlights || highlights.length === 0) {
      return "No highlights found."
    }

    const summary = highlights.map(h => `- ${h.label}: ${h.reason}`).join('\n')
    return `Found ${highlights.length} important areas:\n${summary}`
  }
}

/**
 * Tool Calling Interface for AI
 * This allows the AI to "call functions" in the frontend
 */
export const AIToolInterface = {
  
  // PDF highlighting tool
  highlightPdfArea: (params) => {
    if (window.luterAI?.highlightPdfArea) {
      window.luterAI.highlightPdfArea(params)
      return { success: true, message: `Highlighted area: ${params.label}` }
    }
    return { success: false, error: 'PDF highlighting not available' }
  },

  // DOCX highlighting tool
  highlightDocxText: (params) => {
    if (window.luterAI?.highlightDocxText) {
      window.luterAI.highlightDocxText(params.text, params.label, params.context)
      return { success: true, message: `Highlighted text: ${params.label}` }
    }
    return { success: false, error: 'DOCX highlighting not available' }
  },

  // Excel highlighting tool
  highlightExcelCells: (params) => {
    if (window.luterAI?.highlightExcelCells) {
      window.luterAI.highlightExcelCells(params.cellRange, params.label, params.color)
      return { success: true, message: `Highlighted cells: ${params.cellRange}` }
    }
    return { success: false, error: 'Excel highlighting not available' }
  },

  // Clear highlights tool
  clearHighlights: () => {
    if (window.luterAI?.clearHighlights) {
      window.luterAI.clearHighlights()
      return { success: true, message: 'All highlights cleared' }
    }
    return { success: false, error: 'Clear highlights not available' }
  },

  // Update spark position tool
  updateSpark: (params) => {
    if (window.luterAI?.updateSpark) {
      window.luterAI.updateSpark(params.x, params.y, params.visible)
      return { success: true, message: 'Spark position updated' }
    }
    return { success: false, error: 'Spark update not available' }
  }
}

// Expose tool interface globally for AI calling
if (typeof window !== 'undefined') {
  window.aiToolInterface = AIToolInterface
}
