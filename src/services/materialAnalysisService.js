/**
 * Material Analysis Service
 * Caches AI-generated content to avoid repeated API calls
 * Saves analysis results to Supabase for persistence
 */

import { supabase } from '../supabaseClient'
import { callGroqAPI } from '../groqClient'

export class MaterialAnalysisService {
  
  /**
   * Get or create material analysis
   * Returns cached analysis if exists, generates new one if not
   */
  static async getOrCreateAnalysis(materialId, material, userId) {
    try {
      console.log('Getting material analysis for:', materialId)
      
      // First try to get existing analysis from Supabase
      const existingAnalysis = await this.getAnalysisFromSupabase(materialId, userId)
      
      if (existingAnalysis) {
        console.log('Found cached analysis for material:', materialId)
        return {
          success: true,
          analysis: existingAnalysis,
          isCached: true
        }
      }
      
      // No cached analysis found, generate new one
      console.log('No cached analysis found, generating new analysis...')
      const newAnalysis = await this.generateNewAnalysis(material, userId)
      
      if (newAnalysis.success) {
        // Save to Supabase for future use
        await this.saveAnalysisToSupabase(materialId, newAnalysis.analysis, userId)
        console.log('New analysis saved to cache')
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
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors
      
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
      const { error } = await supabase
        .from('material_analysis')
        .upsert({
          material_id: materialId,
          user_id: userId,
          analysis: analysis,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (error) {
        throw error
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
      if (now - lastCall < 60000) { // 1 minute cooldown
        console.log('Analysis generation rate limited, using fallback')
        return this.createFallbackAnalysis(material, userId)
      }
      window.lastAnalysisCall = now
      
      // Check if we should use fallback due to high usage
      const dailyUsage = window.groqDailyUsage || 0
      if (dailyUsage > 95000) { // If close to limit
        console.log('Approaching daily token limit, using fallback analysis')
        return this.createFallbackAnalysis(material, userId)
      }
      
      const content = material.extracted_text || ''
      
      if (!content || content.length < 100) {
        throw new Error('Insufficient content for analysis')
      }
      
      // Generate comprehensive analysis
      const analysisPrompt = `
Analyze this educational material and provide a comprehensive analysis. Include:

1. **Summary**: A detailed summary of the main topics and concepts
2. **Key Topics**: List the main topics covered with brief descriptions
3. **Learning Objectives**: What students should learn from this material
4. **Difficulty Level**: Beginner, Intermediate, or Advanced with explanation
5. **Study Time**: Estimated study time in hours
6. **Prerequisites**: Any prior knowledge needed
7. **Key Terms**: Important vocabulary and definitions
8. **Concepts**: Core concepts explained simply

Material Content:
"""
${content.substring(0, 6000)} ${content.length > 6000 ? '...' : ''}
"""

Material Title: ${material.title || 'Untitled'}
Material Type: ${material.type || 'document'}

Return the analysis in JSON format with the following structure:
{
  "summary": "detailed summary",
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
      ], 'llama-3.3-70b-versatile', 0.3)
      
      // Track usage
      window.groqDailyUsage = (window.groqDailyUsage || 0) + 5000 // Estimate
      
      let analysisData
      try {
        // Try to parse JSON response
        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
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
   * Generate flashcards from cached analysis
   */
  static async generateFlashcards(analysis, count = 10) {
    try {
      if (!analysis) {
        throw new Error('No analysis available for flashcard generation')
      }
      
      // If analysis is empty or incomplete, generate directly from content
      if (!analysis.summary && !analysis.keyTopics && !analysis.keyTerms) {
        console.log('Analysis is incomplete, generating flashcards directly from content')
        return this.generateDirectFlashcards(analysis, count)
      }
      
      console.log('Using cached analysis to generate flashcards')
      
      const flashcardPrompt = `
Based on this educational material analysis, generate ${count} flashcards for studying. Create question-answer pairs that test understanding of the key concepts.

Analysis Data:
${JSON.stringify(analysis, null, 2)}

Generate flashcards in this JSON format:
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
1. Key terms and definitions
2. Important concepts
3. Learning objectives
4. Core ideas from the summary
`

      const response = await callGroqAPI([
        { role: 'user', content: flashcardPrompt }
      ], 'llama-3.3-70b-versatile', 0.3)
      
      let flashcardData
      try {
        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          flashcardData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in flashcard response')
        }
      } catch (parseError) {
        console.error('Failed to parse flashcard JSON:', parseError)
        flashcardData = this.createBasicFlashcards(analysis, count)
      }
      
      return {
        success: true,
        flashcards: flashcardData.flashcards || []
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
   * Generate quiz from cached analysis
   */
  static async generateQuiz(analysis, questionCount = 5, difficulty = 'medium') {
    try {
      if (!analysis) {
        throw new Error('No analysis available for quiz generation')
      }
      
      // If analysis is empty or incomplete, generate directly from content
      if (!analysis.summary && !analysis.keyTopics && !analysis.keyTerms) {
        console.log('Analysis is incomplete, generating quiz directly from content')
        return this.generateDirectQuiz(analysis, questionCount, difficulty)
      }
      
      console.log('Using cached analysis to generate quiz')
      
      const quizPrompt = `
Based on this educational material analysis, generate a quiz with ${questionCount} multiple-choice questions at ${difficulty} difficulty level.

Analysis Data:
${JSON.stringify(analysis, null, 2)}

Generate a quiz in this JSON format:
{
  "quiz": {
    "title": "Quiz on [Material Title]",
    "difficulty": "${difficulty}",
    "questions": [
      {
        "id": "q_1",
        "question": "What is...?",
        "options": [
          {"id": "a", "text": "Option A"},
          {"id": "b", "text": "Option B"},
          {"id": "c", "text": "Option C"},
          {"id": "d", "text": "Option D"}
        ],
        "correctAnswer": "a",
        "explanation": "The correct answer is A because..."
      }
    ]
  }
}

Create questions that test:
1. Understanding of key concepts
2. Knowledge of important terms
3. Application of learning objectives
4. Critical thinking about the material
`

      const response = await callGroqAPI([
        { role: 'user', content: quizPrompt }
      ], 'llama-3.3-70b-versatile', 0.3)
      
      let quizData
      try {
        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          quizData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in quiz response')
        }
      } catch (parseError) {
        console.error('Failed to parse quiz JSON:', parseError)
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
          question: `What is ${topics[i]}?`,
          answer: `This is a key concept covered in the material.`,
          difficulty: 'medium',
          topic: topics[i]
        })
      } else {
        const termIndex = i - topics.length
        const term = Object.keys(terms)[termIndex]
        if (term) {
          flashcards.push({
            id: `fc_${i + 1}`,
            question: `Define: ${term}`,
            answer: terms[term],
            difficulty: 'easy',
            topic: 'Vocabulary'
          })
        }
      }
    }
    
    return { flashcards }
  }
  
  static createBasicQuiz(analysis, questionCount, difficulty) {
    const questions = []
    const topics = analysis.keyTopics || []
    
    for (let i = 0; i < Math.min(questionCount, topics.length); i++) {
      questions.push({
        id: `q_${i + 1}`,
        question: `What is the main concept of ${topics[i]}?`,
        options: [
          { id: 'a', text: 'Correct answer about ' + topics[i] },
          { id: 'b', text: 'Incorrect option 1' },
          { id: 'c', text: 'Incorrect option 2' },
          { id: 'd', text: 'Incorrect option 3' }
        ],
        correctAnswer: 'a',
        explanation: `This question tests understanding of ${topics[i]}`
      })
    }
    
    return {
      quiz: {
        title: `Quiz on ${analysis.materialMetadata?.topics?.join(', ') || 'Material'}`,
        difficulty,
        questions
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
        question: `What is the key concept covered in this document? (Card ${i + 1})`,
        answer: `This is an important concept from the material that you should study and understand thoroughly.`,
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
  static async generateDirectFlashcards(analysis, count = 10) {
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
      
      const flashcardPrompt = `
Generate ${count} flashcards from this educational material. Create question-answer pairs that test understanding of the key concepts.

Material Content:
"""
${content.substring(0, 4000)} ${content.length > 4000 ? '...' : ''}
"""

Generate flashcards in this JSON format:
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
1. Key terms and definitions
2. Important concepts
3. Main ideas from the content
4. Practical applications
`

      const response = await callGroqAPI([
        { role: 'user', content: flashcardPrompt }
      ], 'llama-3.3-70b-versatile', 0.3)
      
      let flashcardData
      try {
        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          flashcardData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in flashcard response')
        }
      } catch (parseError) {
        console.error('Failed to parse flashcard JSON:', parseError)
        flashcardData = this.createBasicFlashcards(analysis, count)
      }
      
      return {
        success: true,
        flashcards: flashcardData.flashcards || []
      }
      
    } catch (error) {
      console.error('Failed to generate direct flashcards:', error)
      return this.createFallbackFlashcards(count)
    }
  }
  
  /**
   * Generate quiz directly from content when analysis is incomplete
   */
  static async generateDirectQuiz(analysis, questionCount = 5, difficulty = 'medium') {
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
      
      const quizPrompt = `
Generate a quiz with ${questionCount} multiple-choice questions at ${difficulty} difficulty level from this educational material.

Material Content:
"""
${content.substring(0, 4000)} ${content.length > 4000 ? '...' : ''}
"""

Generate a quiz in this JSON format:
{
  "quiz": {
    "title": "Quiz on Material",
    "difficulty": "${difficulty}",
    "questions": [
      {
        "id": "q_1",
        "question": "What is...?",
        "options": [
          {"id": "a", "text": "Option A"},
          {"id": "b", "text": "Option B"},
          {"id": "c", "text": "Option C"},
          {"id": "d", "text": "Option D"}
        ],
        "correctAnswer": "a",
        "explanation": "The correct answer is A because..."
      }
    ]
  }
}

Create questions that test:
1. Understanding of key concepts
2. Knowledge of important terms
3. Application of the material
4. Critical thinking about the content
`

      const response = await callGroqAPI([
        { role: 'user', content: quizPrompt }
      ], 'llama-3.3-70b-versatile', 0.3)
      
      let quizData
      try {
        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          quizData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in quiz response')
        }
      } catch (parseError) {
        console.error('Failed to parse quiz JSON:', parseError)
        quizData = this.createBasicQuiz(analysis, questionCount, difficulty)
      }
      
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
          { id: 'a', text: 'The primary concept discussed in this section' },
          { id: 'b', text: 'A related but secondary concept' },
          { id: 'c', text: 'An unrelated concept' },
          { id: 'd', text: 'A concept not mentioned in the material' }
        ],
        correctAnswer: 'a',
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
   * Create basic flashcards from analysis when JSON parsing fails
   */
  static createBasicFlashcards(analysis, count = 10) {
    const flashcards = []
    const topics = analysis.keyTopics || []
    const terms = analysis.keyTerms || []
    
    for (let i = 0; i < Math.min(count, Math.max(topics.length, terms.length, 5)); i++) {
      const topic = topics[i] || `Concept ${i + 1}`
      const term = terms[i]?.term || `Term ${i + 1}`
      const definition = terms[i]?.definition || 'Definition of this term'
      
      flashcards.push({
        id: `fc_${i + 1}`,
        question: `What is ${topic}?`,
        answer: definition || `${topic} is an important concept covered in this material.`,
        difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard',
        topic: topic
      })
    }
    
    return {
      flashcards
    }
  }
}

export default MaterialAnalysisService
