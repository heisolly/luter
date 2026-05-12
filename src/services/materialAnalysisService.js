/**
 * Material Analysis Service
 * Caches AI-generated content to avoid repeated API calls
 * Saves analysis results to Supabase for persistence
 */

import { supabase } from '../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../groqClient'
import { queryStudyMaterials, reprocessMaterial } from './langchainPipeline' // Import the extraction pipeline

export class MaterialAnalysisService {
  
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
      
      // EMERGENCY FIX: If content is missing, try to extract it now!
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
      ], GROQ_MODELS.PROFESSOR, 0.3)
      
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
  static async generateFlashcards(analysis, count = 10, material = null) {
    try {
      // If analysis is empty or incomplete, and we have material, generate directly from content
      const content = material?.extracted_text || analysis?.extracted_text || ""
      
      if ((!analysis || (!analysis.summary && !analysis.keyTopics && !analysis.keyTerms)) && content) {
        console.log('[Flashcards] Analysis incomplete, generating directly from material content')
        return this.generateDirectFlashcards({ ...analysis, extracted_text: content }, count)
      }
      
      if (!analysis) {
        throw new Error('No analysis or material available for flashcard generation')
      }

      console.log('[Flashcards] Using cached analysis to generate flashcards')
      
      const flashcardPrompt = `
Based on this educational material analysis, generate ${count} flashcards for studying. Create question-answer pairs that test understanding of the key concepts.

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
1. Key terms and definitions
2. Important concepts
3. Learning objectives
4. Core ideas from the summary
`

      const response = await callGroqAPI([
        { role: 'user', content: flashcardPrompt }
      ], GROQ_MODELS.SPEEDSTER, 0.3)
      
      let flashcardData
      try {
        const rawContent = response.choices[0].message.content
        flashcardData = this.cleanAndParseJson(rawContent)
      } catch (parseError) {
        console.error('Final flashcard parse failed:', parseError)
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
   * Generate quiz from cached analysis or material content
   */
  static async generateQuiz(analysis, questionCount = 5, difficulty = 'medium', material = null) {
    try {
      // If analysis is empty or incomplete, and we have material, generate directly from content
      const content = material?.extracted_text || analysis?.extracted_text || ""
      
      if ((!analysis || (!analysis.summary && !analysis.keyTopics && !analysis.keyTerms)) && content) {
        console.log('[Quiz] Analysis incomplete, generating directly from material content')
        return this.generateDirectQuiz({ ...analysis, extracted_text: content }, questionCount, difficulty)
      }
      
      if (!analysis) {
        throw new Error('No analysis or material available for quiz generation')
      }

      console.log('[Quiz] Using cached analysis to generate quiz')
      
      const quizPrompt = `
Based on this educational material analysis, generate a quiz with ${questionCount} multiple-choice questions at ${difficulty} difficulty level.

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
      ], GROQ_MODELS.SPEEDSTER, 0.3)
      
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
      success: true,
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
1. Key terms and definitions
2. Important concepts
3. Main ideas from the content
4. Practical applications
`

      let response
      try {
        response = await callGroqAPI([
          { role: 'user', content: flashcardPrompt }
        ], GROQ_MODELS.SPEEDSTER, 0.3)
      } catch (rateLimitError) {
        if (rateLimitError.message?.includes('429') || rateLimitError.message?.includes('rate limit')) {
          console.warn('Rate limit hit for flashcards, using fallback method')
          return this.createFallbackFlashcards(count)
        }
        throw rateLimitError
      }
      
      let flashcardData
      try {
        const rawContent = response.choices[0].message.content
        const cleanContent = stripJsonFence(rawContent)
        flashcardData = JSON.parse(cleanContent)
      } catch (parseError) {
        console.warn('Direct flashcard parse failed, trying regex fallback:', parseError)
        try {
           const deepMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
           flashcardData = JSON.parse(deepMatch[0])
        } catch(e) {
           console.error('Final direct flashcard parse failed:', e)
           flashcardData = this.createBasicFlashcards(analysis, count)
        }
      }
      
      const result = {
        success: true,
        flashcards: flashcardData.flashcards || []
      }
      console.log('Direct flashcards generated:', result.flashcards?.length || 0, 'cards')
      return result
      
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

      let response
      try {
        response = await callGroqAPI([
          { role: 'user', content: quizPrompt }
        ], GROQ_MODELS.SPEEDSTER, 0.3)
      } catch (rateLimitError) {
        if (rateLimitError.message?.includes('429') || rateLimitError.message?.includes('rate limit')) {
          console.warn('Rate limit hit for quiz, using fallback method')
          return this.createFallbackQuiz(questionCount, difficulty)
        }
        throw rateLimitError
      }
      
      let quizData
      try {
        const rawContent = response.choices[0].message.content
        const cleanContent = stripJsonFence(rawContent)
        quizData = JSON.parse(cleanContent)
      } catch (parseError) {
        console.warn('Direct quiz parse failed, trying regex fallback:', parseError)
        try {
           const deepMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
           quizData = JSON.parse(deepMatch[0])
        } catch(e) {
           console.error('Final direct quiz parse failed:', e)
           quizData = this.createBasicQuiz(analysis, questionCount, difficulty)
        }
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
   * Retrieves all text chunks for a material and groups them by page number
   */
  static async getPageTextMap(materialId) {
    console.log('Fetching page text map for:', materialId);
    const { data, error } = await supabase
      .from('study_vault')
      .select('content, metadata')
      .eq('material_id', materialId);
    
    if (error) {
      console.error('Error fetching page map:', error);
      return {};
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
      
      // 2. Fix unescaped newlines in strings (but not within already escaped content)
      repaired = repaired.replace(/(?<!\\)\n/g, '\\n');
      
      // 3. Fix unescaped quotes in strings
      repaired = repaired.replace(/(?<!\\)"(?=[^,:}\]\s]*[,}\]])/g, '\\"');
      
      // 4. Fix missing quotes around property names
      repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // 5. Fix single quotes to double quotes
      repaired = repaired.replace(/'/g, '"');
      
      return JSON.parse(repaired);
    } catch (repairError) {
      // 6. Final attempt: Extract just the object using a more permissive regex
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let finalTry = jsonMatch[0];
          // Apply all repairs to the extracted JSON
          finalTry = finalTry.replace(/,\s*([\}\]])/g, '$1');
          finalTry = finalTry.replace(/(?<!\\)\n/g, '\\n');
          finalTry = finalTry.replace(/(?<!\\)"(?=[^,:}\]\s]*[,}\]])/g, '\\"');
          finalTry = finalTry.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
          finalTry = finalTry.replace(/'/g, '"');
          
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
