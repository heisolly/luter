import { supabase } from '../supabaseClient'
import { callGroqAPI } from '../groqClient'

// ==================== NOTES GENERATION ====================

export class AINotesGenerator {
  constructor() {
    this.model = 'mixtral-8x7b-32768' // Using Groq model
    this.maxTokens = 4000
  }

  // Generate comprehensive notes from material content
  async generateNotesFromMaterial(materialId, content, weekNumber, courseContext) {
    try {
      const prompts = this.buildPrompts(content, weekNumber, courseContext)
      const generatedNotes = {}

      // Generate different types of notes
      for (const [type, prompt] of Object.entries(prompts)) {
        const result = await callGroqAPI(prompt, this.model, this.maxTokens)
        generatedNotes[type] = this.parseResponse(result, type)
      }

      // Save to database
      await this.saveGeneratedNotes(materialId, weekNumber, generatedNotes, courseContext.courseId)
      
      return generatedNotes
    } catch (error) {
      console.error('Failed to generate notes:', error)
      throw error
    }
  }

  // Build context-aware prompts for different note types
  buildPrompts(content, weekNumber, courseContext) {
    const { courseName, courseCode, objectives } = courseContext

    return {
      summary: `You are an expert educational content creator. Create a comprehensive summary for Week ${weekNumber} of ${courseCode} - ${courseName}.

Course Context: ${courseName}
Week: ${weekNumber}
Learning Objectives: ${objectives?.join(', ') || 'Not specified'}

Content to summarize:
${content}

Please create a structured summary that:
1. Captures the main concepts and themes
2. Highlights key terminology and definitions
3. Identifies important relationships between concepts
4. Provides context for real-world applications
5. Is approximately 300-500 words

Format the response as a clear, well-structured summary with headings.`,

      key_points: `You are an expert educator. Extract and organize the key points from Week ${weekNumber} material for ${courseCode} - ${courseName}.

Content:
${content}

Please provide:
1. 5-7 main key points with brief explanations
2. Important formulas or equations (if any)
3. Critical definitions
4. Common misconceptions to avoid
5. Quick reference facts

Format as a bulleted list with clear categories.`,

      study_guide: `You are an expert study coach. Create a comprehensive study guide for Week ${weekNumber} of ${courseCode} - ${courseName}.

Content:
${content}

Create a study guide that includes:
1. Learning objectives checklist
2. Study timeline suggestions
3. Practice questions with answers
4. Memory tips and mnemonics
5. Connection to previous weeks
6. Preparation for next week

Make it engaging and practical for student self-study.`,

      flashcards: `You are an expert in creating educational flashcards. Generate flashcard content for Week ${weekNumber} of ${courseCode} - ${courseName}.

Content:
${content}

Create 10-15 flashcards in the following format:
FRONT: [Question/Term]
BACK: [Answer/Definition]

Include:
- Key terms and definitions
- Important concepts
- Quick questions
- Formula applications

Return as a clean list that can be easily converted to flashcards.`,

      quiz: `You are an expert assessment creator. Generate a comprehensive quiz for Week ${weekNumber} of ${courseCode} - ${courseName}.

Content:
${content}

Create a quiz with:
1. 5 multiple choice questions (4 options each)
2. 3 true/false questions
3. 2 short answer questions
4. 1 essay question

Include answer key and brief explanations for each question.
Ensure questions test understanding, not just memorization.`
    }
  }

  // Parse and structure AI responses
  parseResponse(response, type) {
    try {
      // Clean up the response
      let cleanResponse = response.trim()
      
      // Remove any AI disclaimer text
      cleanResponse = cleanResponse.replace(/^(As an AI|I'm an AI|Please note).*/gm, '')
      
      switch (type) {
        case 'summary':
          return {
            content: cleanResponse,
            wordCount: cleanResponse.split(/\s+/).length,
            readingTime: Math.ceil(cleanResponse.split(/\s+/).length / 200) // 200 WPM average
          }
        
        case 'key_points':
          return {
            points: this.extractBulletPoints(cleanResponse),
            formulas: this.extractFormulas(cleanResponse),
            definitions: this.extractDefinitions(cleanResponse)
          }
        
        case 'study_guide':
          return {
            objectives: this.extractSection(cleanResponse, 'objectives'),
            timeline: this.extractSection(cleanResponse, 'timeline'),
            practice: this.extractSection(cleanResponse, 'practice'),
            tips: this.extractSection(cleanResponse, 'tips')
          }
        
        case 'flashcards':
          return {
            cards: this.extractFlashcards(cleanResponse),
            count: this.countFlashcards(cleanResponse)
          }
        
        case 'quiz':
          return {
            multipleChoice: this.extractMultipleChoice(cleanResponse),
            trueFalse: this.extractTrueFalse(cleanResponse),
            shortAnswer: this.extractShortAnswer(cleanResponse),
            essay: this.extractEssay(cleanResponse),
            answerKey: this.extractAnswerKey(cleanResponse)
          }
        
        default:
          return { content: cleanResponse }
      }
    } catch (error) {
      console.error(`Failed to parse ${type} response:`, error)
      return { content: response, error: true }
    }
  }

  // Text extraction helpers
  extractBulletPoints(text) {
    const bulletPattern = /^[•\-*]\s+(.+)$/gm
    const points = []
    let match
    while ((match = bulletPattern.exec(text)) !== null) {
      points.push(match[1].trim())
    }
    return points
  }

  extractFormulas(text) {
    const formulaPattern = /(?:^|\s)([A-Za-z]+\s*=\s*[^.\n]+)/gm
    const formulas = []
    let match
    while ((match = formulaPattern.exec(text)) !== null) {
      formulas.push(match[1].trim())
    }
    return formulas
  }

  extractDefinitions(text) {
    const definitionPattern = /(\w+(?:\s+\w+)*)\s*[:-]\s*([^.\n]+)/gm
    const definitions = []
    let match
    while ((match = definitionPattern.exec(text)) !== null) {
      definitions.push({
        term: match[1].trim(),
        definition: match[2].trim()
      })
    }
    return definitions
  }

  extractSection(text, sectionName) {
    const pattern = new RegExp(`${sectionName}[^:]*:\\s*([\\s\\S]*?)(?=\\n\\n|\\n[A-Z]|\\n#|$)`, 'i')
    const match = pattern.exec(text)
    return match ? match[1].trim() : ''
  }

  extractFlashcards(text) {
    const cards = []
    const cardPattern = /FRONT:\s*(.+?)\nBACK:\s*(.+?)(?=\n\n|\nFRONT:|$)/gs
    let match
    while ((match = cardPattern.exec(text)) !== null) {
      cards.push({
        front: match[1].trim(),
        back: match[2].trim()
      })
    }
    return cards
  }

  countFlashcards(text) {
    const cardPattern = /FRONT:/g
    const matches = text.match(cardPattern)
    return matches ? matches.length : 0
  }

  extractMultipleChoice(text) {
    const questions = []
    const mcPattern = /(\d+\.[^?]*\?)(\s*[A-D]\.\s*[^.\n]+\.?){4}/gs
    let match
    while ((match = mcPattern.exec(text)) !== null) {
      const fullQuestion = match[0]
      const questionText = fullQuestion.match(/\d+\.[^?]*\?/)[0]
      const options = fullQuestion.match(/[A-D]\.\s*[^.\n]+\.?/g)
      
      questions.push({
        question: questionText,
        options: options.map(opt => opt.replace(/^[A-D]\.\s*/, '').replace(/\.$/, '')),
        type: 'multiple_choice'
      })
    }
    return questions
  }

  extractTrueFalse(text) {
    const questions = []
    const tfPattern = /\d+\.\s*(.+?)\s*\[\s*(True|False)\s*\]/g
    let match
    while ((match = tfPattern.exec(text)) !== null) {
      questions.push({
        question: match[1].trim(),
        answer: match[2].trim(),
        type: 'true_false'
      })
    }
    return questions
  }

  extractShortAnswer(text) {
    const questions = []
    const saPattern = /\d+\.\s*(.+?\?)/g
    let match
    while ((match = saPattern.exec(text)) !== null) {
      if (!match[1].toLowerCase().includes('essay')) {
        questions.push({
          question: match[1].trim(),
          type: 'short_answer'
        })
      }
    }
    return questions.slice(0, 3) // Limit to 3 as specified
  }

  extractEssay(text) {
    const essayPattern = /\d+\.\s*(.+essay.+?\?)/i
    const match = essayPattern.exec(text)
    return match ? [{
      question: match[1].trim(),
      type: 'essay'
    }] : []
  }

  extractAnswerKey(text) {
    const answerPattern = /ANSWER\s*KEY[^:]*:\s*([\s\S]*)/i
    const match = answerPattern.exec(text)
    return match ? match[1].trim() : ''
  }

  // Save generated notes to database
  async saveGeneratedNotes(materialId, weekNumber, notes, courseId) {
    try {
      const promises = Object.entries(notes).map(async ([type, content]) => {
        const { data, error } = await supabase
          .from('ai_generated_notes')
          .insert({
            material_id: materialId,
            course_id: courseId,
            week_number: weekNumber,
            note_type: type,
            content: content,
            ai_model: this.model,
            generation_prompt: this.buildPrompts('', weekNumber, {})[type],
            quality_score: this.calculateQualityScore(content),
            is_published: false // Admin review required
          })
          .select()
          .single()
        
        if (error) throw error
        return data
      })

      const results = await Promise.all(promises)
      return results
    } catch (error) {
      console.error('Failed to save notes:', error)
      throw error
    }
  }

  // Calculate quality score for generated content
  calculateQualityScore(content) {
    let score = 50 // Base score

    if (typeof content === 'object') {
      // Check content quality metrics
      if (content.content && content.content.length > 100) score += 10
      if (content.points && content.points.length > 3) score += 10
      if (content.cards && content.cards.length > 5) score += 10
      if (content.quiz && content.quiz.multipleChoice?.length > 0) score += 10
      if (content.study_guide && content.study_guide.objectives) score += 10
    } else if (typeof content === 'string') {
      // For simple text content
      const wordCount = content.split(/\s+/).length
      if (wordCount > 200) score += 15
      if (wordCount > 500) score += 10
    }

    return Math.min(score, 100) // Cap at 100
  }

  // Generate notes for user requests
  async generateNotesForRequest(requestId, subject, topic, weekNumber, courseContext) {
    try {
      const prompt = `Create comprehensive educational notes for a student request.

Request Details:
- Subject: ${subject}
- Topic: ${topic}
- Week: ${weekNumber}
- Course: ${courseContext.courseName} (${courseContext.courseCode})

Please create detailed notes that cover:
1. Concept explanation
2. Key examples
3. Practice problems
4. Study tips
5. Common mistakes to avoid

Make the content engaging, clear, and suitable for self-study.`

      const result = await callGroqAPI(prompt, this.model, this.maxTokens)
      
      // Update request with generated notes
      await supabase
        .from('notes_requests')
        .update({
          status: 'completed',
          admin_notes: result,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)

      return result
    } catch (error) {
      console.error('Failed to generate notes for request:', error)
      throw error
    }
  }

  // Batch generate notes for entire week
  async generateWeekNotes(courseId, weekNumber, materials) {
    try {
      const results = []
      
      for (const material of materials) {
        if (material.extracted_text) {
          const notes = await this.generateNotesFromMaterial(
            material.id,
            material.extracted_text,
            weekNumber,
            { courseId }
          )
          results.push({ materialId: material.id, notes })
        }
      }

      return results
    } catch (error) {
      console.error('Failed to generate week notes:', error)
      throw error
    }
  }
}

// Export singleton instance
export const aiNotesGenerator = new AINotesGenerator()

// ==================== HELPER FUNCTIONS ====================

export async function generateNotesForMaterial(materialId, content, weekNumber, courseContext) {
  return await aiNotesGenerator.generateNotesFromMaterial(materialId, content, weekNumber, courseContext)
}

export async function generateNotesForRequest(requestId, subject, topic, weekNumber, courseContext) {
  return await aiNotesGenerator.generateNotesForRequest(requestId, subject, topic, weekNumber, courseContext)
}

export async function batchGenerateWeekNotes(courseId, weekNumber, materials) {
  return await aiNotesGenerator.generateWeekNotes(courseId, weekNumber, materials)
}
