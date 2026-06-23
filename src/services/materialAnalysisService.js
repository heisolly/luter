/**
 * Material Analysis Service
 * Caches AI-generated content to avoid repeated API calls
 * Saves analysis results to Supabase for persistence
 */

import { supabase } from '../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../groqClient'
import { queryStudyMaterials, reprocessMaterial } from './langchainPipeline' // Import the extraction pipeline

export class MaterialAnalysisService {
  
  static async reprocessMaterial(material) {
    return reprocessMaterial(material);
  }
  
  /**
   * Get or create material analysis
   * Returns cached analysis if exists, generates new one if not
   */
  static async getOrCreateAnalysis(materialId, material, userId) {
    try {
      console.log('[MaterialAnalysisService] Getting analysis for material:', materialId)
      console.log('[MaterialAnalysisService] Material has extracted_text:', !!material.extracted_text, 'Length:', material.extracted_text?.length || 0)
      
      // First try to get existing analysis from Supabase
      const existingAnalysis = await this.getAnalysisFromSupabase(materialId, userId)
      
      if (existingAnalysis && !existingAnalysis.isFallback && !existingAnalysis.fallbackAnalysis) {
        // Check if analysis has actual content (not just placeholder)
        const hasContent = existingAnalysis.summary && 
          !existingAnalysis.summary.includes('will be available soon') &&
          !existingAnalysis.summary.includes('being processed')
        
        if (hasContent) {
          console.log('[MaterialAnalysisService] Found valid cached analysis')
          return {
            success: true,
            analysis: existingAnalysis,
            isCached: true
          }
        }
        console.log('[MaterialAnalysisService] Cached analysis incomplete, regenerating...')
      } else if (existingAnalysis) {
        console.log('[MaterialAnalysisService] Cached analysis is fallback, regenerating...')
      }
      
      // No cached analysis found, generate new one
      console.log('[MaterialAnalysisService] Generating new analysis...')
      const newAnalysis = await this.generateNewAnalysis(material, userId)
      
      if (newAnalysis.success && !newAnalysis.isFallback) {
        // Save to Supabase for future use - but not if it's a fallback
        await this.saveAnalysisToSupabase(materialId, newAnalysis.analysis, userId)
        console.log('New analysis saved to cache')
      } else if (newAnalysis.isFallback) {
        console.log('Fallback analysis not saved to cache (will regenerate next time)')
      }
      
      return {
        ...newAnalysis,
        isCached: false
      }
      
    } catch (error) {
      console.error('Analysis service error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Get existing analysis from Supabase
   */
  static async getAnalysisFromSupabase(materialId, userId) {
    try {
      const { data, error } = await supabase
        .from('material_analysis')
        .select('*')
        .eq('material_id', materialId)
        .limit(1)
        .maybeSingle() // Fetch any existing analysis for this material (shared across session members)
      
      if (error) {
        console.error('Supabase error:', error)
        return null
      }
      
      if (!data) {
        console.log('No analysis found in cache')
        return null
      }
      
      console.log('Found cached analysis')
      return data.analysis
      
    } catch (error) {
      console.error('Error fetching analysis from Supabase:', error)
      return null
    }
  }
  
  /**
   * Save analysis to Supabase
   */
  static async saveAnalysisToSupabase(materialId, analysis, userId) {
    try {
      let finalUserId = userId
      if (!finalUserId) {
        const { data: { session } } = await supabase.auth.getSession()
        finalUserId = session?.user?.id
      }

      // Check if record exists
      let query = supabase
        .from('material_analysis')
        .select('id')
        .eq('material_id', materialId)

      if (finalUserId) {
        query = query.eq('user_id', finalUserId)
      }

      const { data: existing, error: selectError } = await query.maybeSingle()

      if (selectError) {
        console.error('Error checking existing analysis:', selectError)
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from('material_analysis')
          .update({
            analysis: analysis,
            updated_at: new Date().toISOString(),
            ...(finalUserId ? { user_id: finalUserId } : {})
          })
          .eq('id', existing.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('material_analysis')
          .insert({
            material_id: materialId,
            user_id: finalUserId,
            analysis: analysis,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) throw insertError
      }
      
      return true
      
    } catch (error) {
      console.error('Error saving analysis to Supabase:', error)
      return false
    }
  }
  
  /**
   * Generate new analysis using AI
   */
  static async generateNewAnalysis(material, userId) {
    try {
      // Check rate limiting - if we're close to limit, use fallback
      const lastCall = window.lastAnalysisCall || 0
      const now = Date.now()
      if (now - lastCall < 5000) { // 5 second cooldown between analysis generations
        console.log('Analysis generation rate limited (5s cooldown), using fallback')
        return this.createFallbackAnalysis(material, userId)
      }
      window.lastAnalysisCall = now
      
      // Check if we should use fallback due to high usage
      const dailyUsage = window.groqDailyUsage || 0
      if (dailyUsage > 95000) { // If close to limit
        console.log('Approaching daily token limit, using fallback analysis')
        return this.createFallbackAnalysis(material, userId)
      }
      
      let content = material.extracted_text || ''
      
      // Skip extraction for YouTube — no downloadable text content
      if (material.type === 'youtube') {
        return this.createFallbackAnalysis(material, userId)
      }
      
      // If content is missing, try to extract it now
      if (!content || content.length < 100) {
        console.warn('[AnalysisService] Content missing or too short, attempting emergency extraction...')
        try {
          // Trigger the LangChain pipeline to re-extract
          const result = await reprocessMaterial(material) 
          
          if (result.success && result.fullText) {
            content = result.fullText
          } else {
            // Re-fetch the material to see if text is now present
            const { data: updatedMaterial } = await supabase
              .from('materials')
              .select('extracted_text')
              .eq('id', material.id)
              .single()
               
            content = updatedMaterial?.extracted_text || ''
          }
        } catch (extractionError) {
          console.error('[AnalysisService] Emergency extraction failed:', extractionError)
        }
      }
      
      if (!content || content.length < 100) {
        throw new Error('Insufficient content for analysis. Please ensure the document has text and try again.')
      }
      
      // Generate comprehensive analysis
      const analysisPrompt = `
Create a comprehensive academic summary of this material. For the "summary" field of the JSON output, you must structure your response EXACTLY as follows:

## Key Points
List 8-12 specific, detailed bullet points covering the most important concepts, definitions, and facts.

## Essential Concepts
Provide a deep-dive description of 3-5 core concepts, using clear markdown headers (e.g. ### [Concept Name]) for each, with 2-3 explanatory paragraphs per concept.

## Detailed Summary
A thorough, section-by-section or topic-by-topic breakdown of the material (at least 4-6 substantial paragraphs) explaining the thesis, arguments, methods, and conclusions.

---
Title: ${material.title || 'Untitled'}
Type: ${material.type || 'document'}
Content:
${content.substring(0, 8000)} ${content.length > 8000 ? '...' : ''}

Return the analysis in JSON format with the following structure:
{
  "summary": "The structured academic summary in Markdown format following the exact structure specified above",
  "keyTopics": ["topic1", "topic2", ...],
  "learningObjectives": ["objective1", "objective2", ...],
  "difficultyLevel": "Intermediate",
  "difficultyExplanation": "reasoning for difficulty level",
  "estimatedStudyTime": 2.5,
  "prerequisites": ["prereq1", "prereq2", ...],
  "keyTerms": [{"term": "definition"}, ...],
  "coreConcepts": [{"concept": "explanation"}, ...],
  "materialMetadata": {
    "wordCount": 1234,
    "readingLevel": "College",
    "topics": ["topic1", "topic2"]
  }
}
`

      const response = await callGroqAPI([
        { role: 'user', content: analysisPrompt }
      ], GROQ_MODELS.PROFESSOR, {
        temperature: 0.3,
        systemPromptOverride: "You are an expert academic summarizer. You create comprehensive, detailed summaries that capture every important concept, formula, definition, and example from the material. Never give brief overviews — always give thorough, structured summaries that a student can study from directly without reading the original material."
      })
      
      // Track usage
      window.groqDailyUsage = (window.groqDailyUsage || 0) + 5000 // Estimate
      
      let analysisData
      try {
        const rawContent = response.choices[0].message.content
        analysisData = this.cleanAndParseJson(rawContent)
      } catch (parseError) {
        console.error('Failed to parse analysis JSON:', parseError)
        // Create basic analysis from text response
        analysisData = this.createBasicAnalysis(response.choices[0].message.content, material)
      }
      
      // Add metadata
      analysisData.generatedAt = new Date().toISOString()
      analysisData.materialId = material.id
      analysisData.userId = userId
      analysisData.wordCount = content.split(/\s+/).length
      
      return {
        success: true,
        analysis: analysisData
      }
      
    } catch (error) {
      console.error('Failed to generate analysis:', error)
      // Check if it's a rate limit error
      if (error.message?.includes('Rate limit reached') || error.message?.includes('429')) {
        console.log('Rate limit reached, using fallback analysis')
        window.groqDailyUsage = 100000 // Mark as at limit
      }
      // Return fallback analysis instead of error
      return {
        success: true,
        analysis: this.createFallbackAnalysis(material, userId)
      }
    }
  }
  
  /**
   * Create fallback analysis when rate limited or error occurs
   */
  static createFallbackAnalysis(material, userId) {
    const content = material.extracted_text || ''
    const wordCount = content.split(/\s+/).length
    
    return {
      summary: `This document contains ${wordCount} words and covers important educational content. A detailed summary is being processed and will be available soon.`,
      keyTopics: this.extractTopics(content),
      learningObjectives: [
        'Understand the main concepts presented',
        'Apply the knowledge in practical scenarios',
        'Analyze the key themes and ideas'
      ],
      difficultyLevel: 'Intermediate',
      difficultyExplanation: 'Based on content complexity and terminology',
      estimatedStudyTime: Math.max(1, Math.round(wordCount / 500)),
      prerequisites: [],
      keyTerms: this.extractTerms(content),
      coreConcepts: this.extractConcepts(content),
      materialMetadata: {
        wordCount,
        readingLevel: 'College',
        topics: this.extractTopics(content)
      },
      generatedAt: new Date().toISOString(),
      materialId: material.id,
      userId: userId,
      isFallback: true
    }
  }
  
  /**
   * Create basic analysis from text response when JSON parsing fails
   */
  static createBasicAnalysis(textResponse, material) {
    const content = material.extracted_text || ''
    const wordCount = content.split(/\s+/).length
    
    return {
      summary: textResponse.substring(0, 500) + '...',
      keyTopics: this.extractTopics(textResponse),
      learningObjectives: this.extractObjectives(textResponse),
      difficultyLevel: 'Intermediate',
      difficultyExplanation: 'Based on content complexity',
      estimatedStudyTime: Math.max(1, Math.round(wordCount / 500)),
      prerequisites: [],
      keyTerms: this.extractTerms(textResponse),
      coreConcepts: this.extractConcepts(textResponse),
      materialMetadata: {
        wordCount,
        readingLevel: 'College',
        topics: this.extractTopics(textResponse)
      },
      generatedAt: new Date().toISOString(),
      materialId: material.id,
      fallbackAnalysis: true
    }
  }
  
  /**
   * Generate flashcards from cached analysis or material content
   */
  static async generateFlashcards(analysis, count = 10, material = null, options = {}) {
    try {
      const content = this.getGenerationContent(analysis, material)
      
      if (content && content.length >= 120) {
        console.log('[Flashcards] Generating directly from material content')
        return this.generateDirectFlashcards({ ...analysis, extracted_text: content }, count, options)
      }
      
      if (!analysis) {
        throw new Error('No analysis or material available for flashcard generation')
      }

      console.log('[Flashcards] Using cached analysis to generate flashcards')
      
      const flashcardPrompt = `
Based on this educational material analysis, generate ${count} flashcards for studying. Create question-answer pairs that test understanding of the key concepts.

Regeneration id: ${options.seed || Date.now()}
Avoid repeating these previous prompts:
${this.formatAvoidList(options.previous || options.avoid)}

Analysis Data:
${JSON.stringify(analysis, null, 2)}

Generate flashcards in this valid JSON format only. Do not include any preamble, introduction, or markdown formatting outside the JSON block.

Format:
{
  "flashcards": [
    {
      "id": "fc_1",
      "question": "What is...?",
      "answer": "The answer is...",
      "difficulty": "easy|medium|hard",
      "topic": "related topic"
    }
  ]
}

Focus on:
1. Specific terminology and their detailed definitions
2. Cause and effect relationships
3. Practical applications or examples
4. Comparing or contrasting concepts

CRITICAL RULE: DO NOT use repetitive phrasing like "What should you remember about X?". Write natural, varied questions.
Examples of GOOD questions: "How does X affect Y?", "What are the three main components of Z?", "Define the term [concept]."
Examples of BAD questions: "What should you remember about [topic]?", "What is the key idea of [topic]?"
`

      const response = await callGroqAPI([
        { role: 'user', content: flashcardPrompt }
      ], GROQ_MODELS.SPEEDSTER, { temperature: 0.55 })
      
      let flashcardData
      try {
        const rawContent = response.choices[0].message.content
        flashcardData = this.cleanAndParseJson(rawContent)
      } catch (parseError) {
        console.error('Final flashcard parse failed:', parseError)
        flashcardData = this.createBasicFlashcards(analysis, count)
      }
      
      // Final validation
      const finalCards = flashcardData.flashcards || []
      if (finalCards.length === 0) {
        console.warn('AI returned empty flashcards, using basic cards fallback')
        const fallback = this.createBasicFlashcards(analysis, count)
        return {
          success: true,
          flashcards: fallback.flashcards
        }
      }

      return {
        success: true,
        flashcards: finalCards
      }
      
    } catch (error) {
      console.error('Failed to generate flashcards:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Generate quiz from cached analysis or material content
   */
  static async generateQuiz(analysis, questionCount = 5, difficulty = 'medium', material = null, options = {}) {
    try {
      const content = this.getGenerationContent(analysis, material)
      
      if (content && content.length >= 120) {
        console.log('[Quiz] Generating directly from material content')
        return this.generateDirectQuiz({ ...analysis, extracted_text: content }, questionCount, difficulty, options)
      }
      
      if (!analysis) {
        throw new Error('No analysis or material available for quiz generation')
      }

      console.log('[Quiz] Using cached analysis to generate quiz')
      
      const quizPrompt = `
Based on this educational material analysis, generate a quiz with ${questionCount} multiple-choice questions at ${difficulty} difficulty level.

Regeneration id: ${options.seed || Date.now()}
Avoid repeating these previous questions:
${this.formatAvoidList(options.previous || options.avoid)}

Analysis Data:
${JSON.stringify(analysis, null, 2)}

Generate a quiz in this valid JSON format only. Do not include any preamble or headers.

Format:
{
  "quiz": {
    "title": "Quiz on [Material Title]",
    "difficulty": "${difficulty}",
    "questions": [
      {
        "id": "q_1",
        "question": "What is...?",
        "options": [
          {"id": 0, "text": "Option A"},
          {"id": 1, "text": "Option B"},
          {"id": 2, "text": "Option C"},
          {"id": 3, "text": "Option D"}
        ],
        "correctAnswer": 0,
        "explanation": "The correct answer is Option A because..."
      }
    ]
  }
}

Create questions that test:
1. Understanding of key concepts
2. Knowledge of important terms
3. Application of learning objectives
4. Critical thinking about the material
Avoid generic questions like "What is the main topic covered?". Every question must be specific to the material.
`

      const response = await callGroqAPI([
        { role: 'user', content: quizPrompt }
      ], GROQ_MODELS.SPEEDSTER, { temperature: 0.55 })
      
      let quizData
      try {
        const rawContent = response.choices[0].message.content
        quizData = this.cleanAndParseJson(rawContent)
      } catch (parseError) {
        console.error('Final quiz parse failed:', parseError)
        quizData = this.createBasicQuiz(analysis, questionCount, difficulty)
      }
      
      return {
        success: true,
        quiz: quizData.quiz
      }
      
    } catch (error) {
      console.error('Failed to generate quiz:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
  
  /**
   * Helper methods for extracting content when JSON parsing fails
   */
  static extractTopics(text) {
    const topics = text.match(/(?:topics?|main points?|key points?):?\s*([^.]+)/gi) || []
    return topics.slice(0, 5).map(topic => topic.split(':')[1]?.trim()).filter(Boolean)
  }
  
  static extractObjectives(text) {
    const objectives = text.match(/(?:objectives?|goals?):?\s*([^.]+)/gi) || []
    return objectives.slice(0, 5).map(obj => obj.split(':')[1]?.trim()).filter(Boolean)
  }
  
  static extractTerms(text) {
    const terms = text.match(/(?:terms?|vocabulary?):?\s*([^.]+)/gi) || []
    return terms.slice(0, 5).map(term => term.split(':')[1]?.trim()).filter(Boolean)
  }
  
  static extractConcepts(text) {
    const concepts = text.match(/(?:concepts?|ideas?):?\s*([^.]+)/gi) || []
    return concepts.slice(0, 5).map(concept => concept.split(':')[1]?.trim()).filter(Boolean)
  }
  
  static createBasicFlashcards(analysis, count) {
    const flashcards = []
    const topics = analysis.keyTopics || []
    const terms = analysis.keyTerms || []
    
    for (let i = 0; i < Math.min(count, topics.length + terms.length); i++) {
      if (i < topics.length) {
        flashcards.push({
          id: `fc_${i + 1}`,
          front: `What is ${topics[i]}?`,
          back: `This is a key concept covered in the material.`,
          difficulty: 'medium',
          topic: topics[i]
        })
      } else {
        const termIndex = i - topics.length
        const termItem = terms[termIndex]
        if (termItem) {
          const term = typeof termItem === 'object' ? Object.keys(termItem)[0] : termItem
          const definition = typeof termItem === 'object' ? Object.values(termItem)[0] : 'Key term from the material.'
          
          flashcards.push({
            id: `fc_${i + 1}`,
            front: `Define: ${term}`,
            back: definition,
            difficulty: 'easy',
            topic: 'Vocabulary'
          })
        }
      }
    }
    
    return { success: true, flashcards }
  }
  
  static createBasicQuiz(analysis, questionCount, difficulty) {
    const questions = []
    const topics = analysis.keyTopics || []
    
    for (let i = 0; i < Math.min(questionCount, topics.length); i++) {
      questions.push({
        id: `q_${i + 1}`,
        question: `What is the main concept of ${topics[i]}?`,
        options: [
          { id: 0, text: 'Correct answer about ' + topics[i] },
          { id: 1, text: 'Incorrect option 1' },
          { id: 2, text: 'Incorrect option 2' },
          { id: 3, text: 'Incorrect option 3' }
        ],
        correctAnswer: 0,
        explanation: `This question tests understanding of ${topics[i]}`
      })
    }
    
    return {
      success: true,
      quiz: {
        title: `Quiz on ${analysis.materialMetadata?.topics?.join(', ') || 'Material'}`,
        difficulty,
        questions
      }
    }
  }

  static getGenerationContent(analysis, material) {
    return (
      material?.extracted_text ||
      material?.content ||
      analysis?.extracted_text ||
      analysis?.materialMetadata?.content ||
      analysis?.content ||
      ''
    ).toString()
  }

  static buildContentWindow(content, maxLength = 9000) {
    const clean = (content || '').replace(/\s+/g, ' ').trim()
    if (clean.length <= maxLength) return clean
    const part = Math.floor(maxLength / 3)
    const middleStart = Math.max(0, Math.floor(clean.length / 2) - Math.floor(part / 2))
    return [
      clean.slice(0, part),
      clean.slice(middleStart, middleStart + part),
      clean.slice(-part)
    ].join('\n\n[...]\n\n')
  }

  static formatAvoidList(items = []) {
    const list = (Array.isArray(items) ? items : [])
      .map((item) => item?.question || item?.front || item?.term || item?.title || '')
      .filter(Boolean)
      .slice(0, 16)

    return list.length ? list.map((text, index) => `${index + 1}. ${text}`).join('\n') : 'None'
  }

  static extractStudySentences(content, limit = 12) {
    const sentences = (content || '')
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= 45 && sentence.length <= 260)
      .filter((sentence) => !/^(page|slide)\s+\d+/i.test(sentence))

    const seen = new Set()
    return sentences.filter((sentence) => {
      const key = sentence.toLowerCase().slice(0, 80)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, limit)
  }

  static createContentFlashcards(content, count = 10) {
    const sentences = this.extractStudySentences(content, count)
    const flashcards = sentences.map((sentence, index) => {
      const topicMatch = sentence.match(/\b([A-Z][A-Za-z0-9()./-]*(?:\s+[A-Z][A-Za-z0-9()./-]*){0,4})\b/)
      const topic = topicMatch?.[1]?.trim() || `Concept ${index + 1}`
      return {
        id: `fc_${Date.now()}_${index + 1}`,
        question: `What should you remember about ${topic}?`,
        answer: sentence,
        front: `What should you remember about ${topic}?`,
        back: sentence,
        difficulty: index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard',
        topic
      }
    })

    return {
      success: true,
      flashcards: flashcards.length ? flashcards : this.createFallbackFlashcards(count).flashcards
    }
  }

  static createContentQuiz(content, questionCount = 5, difficulty = 'medium') {
    const sentences = this.extractStudySentences(content, questionCount)
    const questions = sentences.map((sentence, index) => {
      const words = sentence.match(/\b[A-Za-z][A-Za-z-]{4,}\b/g) || []
      const focus = words.find((word) => !/^(which|there|their|about|these|those|because|between|should|would|could)$/i.test(word)) || `concept ${index + 1}`
      const question = `Which statement best describes ${focus} in this material?`
      return {
        id: `q_${Date.now()}_${index + 1}`,
        question,
        options: [
          { id: 0, text: sentence },
          { id: 1, text: `${focus} is mentioned only as an unrelated example.` },
          { id: 2, text: `${focus} is described as outside the scope of the source.` },
          { id: 3, text: `${focus} contradicts the main explanation in the material.` }
        ],
        correctAnswer: 0,
        explanation: `The source states: ${sentence}`
      }
    })

    return {
      success: true,
      quiz: {
        title: 'Study Quiz',
        difficulty,
        questions: questions.length ? questions : this.createFallbackQuiz(questionCount, difficulty).quiz.questions
      }
    }
  }
  
  /**
   * Create fallback flashcards when analysis is incomplete
   */
  static createFallbackFlashcards(count = 10) {
    const flashcards = []
    
    for (let i = 0; i < count; i++) {
      flashcards.push({
        id: `fc_${i + 1}`,
        front: `What is the key concept covered in this document? (Card ${i + 1})`,
        back: `This is an important concept from the material that you should study and understand thoroughly.`,
        difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
        topic: 'General Study'
      })
    }
    
    return {
      success: true,
      flashcards
    }
  }
  
  /**
   * Generate flashcards directly from content when analysis is incomplete
   */
  static async generateDirectFlashcards(analysis, count = 10, options = {}) {
    try {
      // Get content from multiple possible sources
      const content = analysis.extracted_text || 
                     analysis.materialMetadata?.content || 
                     analysis.content ||
                     ''
      
      console.log('Direct flashcard generation, content length:', content.length)
      
      if (!content || content.length < 50) {
        console.log('No sufficient content available, using fallback flashcards')
        return this.createFallbackFlashcards(count)
      }

      const contentWindow = this.buildContentWindow(content)
      
      const flashcardPrompt = `
Generate ${count} flashcards from this educational material. Create question-answer pairs that test understanding of the key concepts.

Regeneration id: ${options.seed || Date.now()}
Avoid repeating these previous prompts:
${this.formatAvoidList(options.previous || options.avoid)}

Material Content:
"""
${contentWindow}
"""

Generate flashcards in this valid JSON format only. Do not include any preamble or extra text.

Format:
{
  "flashcards": [
    {
      "id": "fc_1",
      "question": "What is...?",
      "answer": "The answer is...",
      "difficulty": "easy|medium|hard",
      "topic": "related topic"
    }
  ]
}

Focus on:
1. Specific terminology and their detailed definitions
2. Cause and effect relationships
3. Practical applications or examples
4. Comparing or contrasting concepts

CRITICAL RULE: DO NOT use repetitive phrasing like "What should you remember about X?". Write natural, varied questions.
Examples of GOOD questions: "How does X affect Y?", "What are the three main components of Z?", "Define the term [concept]."
Examples of BAD questions: "What should you remember about [topic]?", "What is the key idea of [topic]?"
`

      let response
      try {
        response = await callGroqAPI([
          { role: 'user', content: flashcardPrompt }
        ], GROQ_MODELS.SPEEDSTER, { temperature: 0.3 })
      } catch (rateLimitError) {
        if (rateLimitError.message?.includes('429') || rateLimitError.message?.includes('rate limit')) {
          console.warn('Rate limit hit for flashcards, using fallback method')
          return this.createContentFlashcards(content, count)
        }
        throw rateLimitError
      }
      
      let flashcardData
      try {
        const rawContent = response.choices[0].message.content
        flashcardData = this.cleanAndParseJson(rawContent)
      } catch (parseError) {
        console.warn('Direct flashcard parse failed, using fallback:', parseError)
        flashcardData = this.createContentFlashcards(content, count)
      }

      const finalCards = flashcardData.flashcards || []
      if (!finalCards.length) return this.createContentFlashcards(content, count)
      
      const result = {
        success: true,
        flashcards: finalCards
      }
      console.log('Direct flashcards generated:', result.flashcards?.length || 0, 'cards')
      return result
      
    } catch (error) {
      console.error('Failed to generate direct flashcards:', error)
      return this.createContentFlashcards(analysis?.extracted_text || '', count)
    }
  }
  
  /**
   * Generate quiz directly from content when analysis is incomplete
   */
  static async generateDirectQuiz(analysis, questionCount = 5, difficulty = 'medium', options = {}) {
    try {
      // Get content from multiple possible sources
      const content = analysis.extracted_text || 
                     analysis.materialMetadata?.content || 
                     analysis.content ||
                     ''
      
      console.log('Direct quiz generation, content length:', content.length)
      
      if (!content || content.length < 50) {
        console.log('No sufficient content available, using fallback quiz')
        return this.createFallbackQuiz(questionCount, difficulty)
      }

      const contentWindow = this.buildContentWindow(content)
      
      const quizPrompt = `
Generate a quiz with ${questionCount} multiple-choice questions at ${difficulty} difficulty level from this educational material.

Regeneration id: ${options.seed || Date.now()}
Avoid repeating these previous questions:
${this.formatAvoidList(options.previous || options.avoid)}

Material Content:
"""
${contentWindow}
"""

Generate a valid JSON quiz only. Do not include any preamble or extra text.

Format:
{
  "quiz": {
    "title": "Quiz on Material",
    "difficulty": "${difficulty}",
    "questions": [
      {
        "id": "q_1",
        "question": "What is...?",
        "options": [
          {"id": 0, "text": "Option A"},
          {"id": 1, "text": "Option B"},
          {"id": 2, "text": "Option C"},
          {"id": 3, "text": "Option D"}
        ],
        "correctAnswer": 0,
        "explanation": "The correct answer is Option A because..."
      }
    ]
  }
}

Create questions that test:
1. Understanding of key concepts
2. Knowledge of important terms
3. Application of the material
4. Critical thinking about the content
Avoid generic questions like "What is the main topic covered?". Each question must name a specific term, process, formula, person, or claim from the source.
`

      let response
      try {
        response = await callGroqAPI([
          { role: 'user', content: quizPrompt }
        ], GROQ_MODELS.SPEEDSTER, { temperature: 0.55 })
      } catch (rateLimitError) {
        if (rateLimitError.message?.includes('429') || rateLimitError.message?.includes('rate limit')) {
          console.warn('Rate limit hit for quiz, using fallback method')
          return this.createContentQuiz(content, questionCount, difficulty)
        }
        throw rateLimitError
      }
      
      let quizData
      try {
        const rawContent = response.choices[0].message.content
        quizData = this.cleanAndParseJson(rawContent)
      } catch (parseError) {
        console.warn('Direct quiz parse failed, using fallback:', parseError)
        quizData = this.createContentQuiz(content, questionCount, difficulty)
      }

      const questions = quizData.quiz?.questions || []
      if (!questions.length) return this.createContentQuiz(content, questionCount, difficulty)
      
      return {
        success: true,
        quiz: quizData.quiz
      }
      
    } catch (error) {
      console.error('Failed to generate direct quiz:', error)
      return this.createFallbackQuiz(questionCount, difficulty)
    }
  }
  
  /**
   * Create fallback quiz when analysis is incomplete
   */
  static createFallbackQuiz(questionCount = 5, difficulty = 'medium') {
    const questions = []
    
    for (let i = 0; i < questionCount; i++) {
      questions.push({
        id: `q_${i + 1}`,
        question: `What is the main topic covered in section ${i + 1} of this document?`,
        options: [
          { id: 0, text: 'The primary concept discussed in this section' },
          { id: 1, text: 'A related but secondary concept' },
          { id: 2, text: 'An unrelated concept' },
          { id: 3, text: 'A concept not mentioned in the material' }
        ],
        correctAnswer: 0,
        explanation: `This question tests your understanding of the main topics covered in the document.`
      })
    }
    
    return {
      success: true,
      quiz: {
        title: 'Study Quiz',
        difficulty,
        questions
      }
    }
  }

  /**
   * Retrieves all text chunks for a material and groups them by page number
   */
  static async fetchMaterialPageMap(materialId, material) {
    let { data, error } = await supabase
      .from('study_vault')
      .select('content, metadata')
      .eq('material_id', materialId);
    
    if (error) {
      console.error('Error fetching page map:', error);
      return {};
    }

    // Fallback if study_vault is empty: use extracted_text
    if ((!data || data.length === 0) && material?.extracted_text) {
      console.log('study_vault empty, creating pseudo-pages from extracted_text');
      const text = material.extracted_text;
      const chunks = [];
      const chunkSize = 2500;
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push({ 
          content: text.slice(i, i + chunkSize), 
          metadata: { pageNumber: Math.floor(i / chunkSize) + 1 } 
        });
      }
      data = chunks;
    }

    const pageMap = {};
    (data || []).forEach(row => {
      const pg = row.metadata?.pageNumber || row.metadata?.page || 1;
      if (!pageMap[pg]) pageMap[pg] = "";
      pageMap[pg] += row.content + "\n";
    });
    return pageMap;
  }

  /**
   * Generates summaries for each page of the material
   */
  static async generatePageByPageSummary(materialId, pageTextMap) {
    const pageSummaries = {};
    const pages = Object.keys(pageTextMap).sort((a,b) => parseInt(a)-parseInt(b));
    
    const targetPages = pages.slice(0, 10); // Reduced from 20 to 10
    console.log(`Generating summaries for ${targetPages.length} pages...`);

    // Process pages one by one to avoid rate limiting
    for (let i = 0; i < targetPages.length; i++) {
      const pg = targetPages[i];
      const text = pageTextMap[pg];
      if (!text || text.length < 100) {
        console.log(`Skipping page ${pg} - insufficient content`);
        continue;
      }

      const prompt = `Summarize the following page from an academic document in 2-4 concise bullet points. Focus on key definitions, formulas, or concepts.
MATERIAL PAGE ${pg}:
"""
${text.substring(0, 2000)} // Reduced from 3000 to save tokens
"""`;

      try {
        console.log(`Summarizing page ${pg} (${i + 1}/${targetPages.length})...`);
        const res = await callGroqAPI(
          [{ role: 'user', content: prompt }], 
          GROQ_MODELS.SPEEDSTER, 
          { systemPromptOverride: "You are an expert academic summarizer. Be concise and precise." }
        );
        pageSummaries[pg] = res.choices[0].message.content;
        console.log(`✓ Page ${pg} summarized`);
        
        // Add delay between requests to avoid rate limiting
        if (i < targetPages.length - 1) {
          console.log('Waiting 3 seconds before next request...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (e) {
        console.warn(`Failed to summarize page ${pg}:`, e);
        // Wait longer if we hit rate limit
        if (e.message?.includes('429') || e.message?.includes('rate limit')) {
          console.log('Rate limit hit, waiting 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }

    return pageSummaries;
  }
}

function stripJsonFence(text) {
  if (!text) return null;
  
  // 1. Remove markdown code fences first
  let clean = text.trim();
  clean = clean.replace(/```json\n?|```\s*$/g, '').trim();
  clean = clean.replace(/^```|```$/g, '').trim();

  // 2. Extract the furthest possible JSON block
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  
  let startIndex = -1;
  let charMatch = '';
  
  if (firstBrace !== -1 && (firstBracket === -1 || (firstBrace < firstBracket && firstBrace !== -1))) {
    startIndex = firstBrace;
    charMatch = '}';
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    charMatch = ']';
  }

  if (startIndex !== -1) {
    const lastIndex = clean.lastIndexOf(charMatch);
    if (lastIndex !== -1 && lastIndex > startIndex) {
      return clean.substring(startIndex, lastIndex + 1);
    }
  }

  return clean;
}



/**
 * Robust JSON repair for common AI mistakes
 */
MaterialAnalysisService.cleanAndParseJson = function(text) {
  const cleaned = stripJsonFence(text);
  if (!cleaned) throw new Error('No JSON found in response');

  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    console.warn('Initial JSON parse failed, attempting repair...', initialError.message);
    
    try {
      // 1. Fix trailing commas in arrays/objects
      let repaired = cleaned.replace(/,\s*([\}\]])/g, '$1');
      
      // 2. Fix unescaped newlines in strings - ONLY inside double quotes
      // This is a common AI error where it puts a raw newline inside a JSON string
      // We look for characters that are likely inside a string value
      repaired = repaired.replace(/":\s*"([^"]*)\n([^"]*)"/g, '": "$1\\n$2"');
      
      // 3. Fix unescaped quotes in strings
      repaired = repaired.replace(/(?<!\\)"(?=[^,:}\]\s]*[,}\]])/g, '\\"');
      
      // 3b. Fix double-double quotes (e.g., ""prop"": ""value"")
      repaired = repaired.replace(/""/g, '"');
      
      // 4. Fix missing quotes around property names
      repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // 5. Fix single quotes to double quotes - ONLY if they seem to be delimiters
      repaired = repaired.replace(/'([^']*)'/g, '"$1"');
      
      // 6. Final cleanup: ensure no extra text before or after the JSON block
      const start = repaired.indexOf('{');
      const end = repaired.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        repaired = repaired.substring(start, end + 1);
      }

      return JSON.parse(repaired);
    } catch (repairError) {
      // 6. Final attempt: Extract just the object using a more permissive regex
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let finalTry = jsonMatch[0];
          // Apply basic repairs
          finalTry = finalTry.replace(/,\s*([\}\]])/g, '$1');
          finalTry = finalTry.replace(/":\s*"([^"]*)\n([^"]*)"/g, '": "$1\\n$2"');
          
          return JSON.parse(finalTry);
        } catch (e) {
          // If all fails, return a basic structure
          console.error('JSON repair completely failed, returning fallback structure');
          return {
            summary: "Analysis temporarily unavailable",
            topics: [],
            difficulty: "Medium",
            studyTime: "30 minutes",
            keyPoints: []
          };
        }
      }
      // Return fallback if no JSON found
      console.error('No JSON found in response, returning fallback structure');
      return {
        summary: "Analysis temporarily unavailable",
        topics: [],
        difficulty: "Medium",
        studyTime: "30 minutes",
        keyPoints: []
      };
    }
  }
}

export default MaterialAnalysisService;
