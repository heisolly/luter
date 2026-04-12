import { callGroqAPI, GROQ_MODELS, GROQ_PROMPTS } from '../groqClient'

// Battle-specific AI prompts
export const BATTLE_PROMPTS = {
  // Generate questions for real-time battles
  BATTLE_QUESTIONS: ({ count, subject, difficulty }) => `Generate challenging multiple-choice questions for a real-time academic battle. These questions should be solvable within 15-30 seconds and test quick thinking.

Requirements:
- Generate exactly ${count} questions
- Each question must have 4 options (A, B, C, D)
- Only one correct answer per question
- Questions should be balanced in difficulty (mix of easy, medium, hard)
- Include time limits per question (10-30 seconds based on complexity)
- Focus on core concepts that can be answered quickly
- Use Nigerian academic context where appropriate

Subject: ${subject}
Difficulty: ${difficulty}
Question Count: ${count}

Return ONLY a JSON array with this exact structure:
[{
  "id": "q_1",
  "question": "question text here",
  "type": "multiple",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_answer": 0,
  "explanation": "brief explanation",
  "difficulty": "easy|medium|hard",
  "time_limit_seconds": 15,
  "subject": "${subject}",
  "topic": "specific topic"
}]`,

  // Analyze battle performance and provide insights
  BATTLE_ANALYSIS: ({ score, totalQuestions, timeTaken, subject, missedQuestions, accuracy }) => `Analyze this battle performance and provide comprehensive insights for improvement.

Student Performance:
- Score: ${score}/${totalQuestions} (${accuracy}%)
- Time taken: ${timeTaken} seconds
- Subject: ${subject}
- Questions missed: ${JSON.stringify(missedQuestions)}

Provide:
1. **Strengths**: What the student knows well
2. **Weaknesses**: Specific topics to review
3. **Study Recommendations**: 3-4 actionable study tips
4. **Exam Readiness**: Percentage readiness for actual exams (0-100%)
5. **Next Steps**: What to focus on next

Format as JSON with keys: strengths, weaknesses, recommendations, examReadiness, nextSteps`,

  // Generate adaptive difficulty questions
  ADAPTIVE_QUESTIONS: ({ count, level, performance, weakAreas, strongAreas }) => `Generate questions that adapt to the student's performance level.

Student Profile:
- Current Level: ${level}
- Recent Performance: ${performance}
- Weak Areas: ${weakAreas}
- Strong Areas: ${strongAreas}

Generate ${count} questions that:
- 60% target weak areas for improvement
- 40% reinforce strong areas
- Gradually increase difficulty if performing well
- Include confidence-building questions if struggling

Return JSON array same format as BATTLE_QUESTIONS`,

  // Real-time battle hints and tips
  BATTLE_HINT: ({ question, options, subject }) => `Provide a helpful hint for this question without giving away the answer.

Question: ${question}
Options: ${JSON.stringify(options)}
Subject: ${subject}

Generate a hint that:
- Points the student in the right direction
- Is encouraging and motivational
- Uses Nigerian academic context
- Is concise (max 50 words)

Return as JSON: {"hint": "your hint here", "motivation": "encouraging message"}`,

  // Post-battle detailed review
  BATTLE_REVIEW: ({ subject, score, opponentScore, totalQuestions, avgTime, questionReview }) => `Create a comprehensive review of this battle session.

Battle Data:
- Subject: ${subject}
- Student Score: ${score}/${totalQuestions}
- Opponent Score: ${opponentScore}/${totalQuestions}
- Time per Question: ${avgTime} seconds
- Questions Reviewed: ${JSON.stringify(questionReview)}

For each incorrect answer, provide:
1. **Why it was wrong**: Clear explanation
2. **Correct approach**: How to solve it
3. **Related concepts**: What to study
4. **Practice questions**: 1-2 similar questions

Return as JSON with "questionReviews" array and overall "summary".`
}

export class BattleQuestionGenerator {
  constructor() {
    this.cache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
  }

  // Get cache key for questions
  getCacheKey(subject, difficulty, count) {
    return `${subject}_${difficulty}_${count}`
  }

  // Check cache for existing questions
  getCachedQuestions(subject, difficulty, count) {
    const key = this.getCacheKey(subject, difficulty, count)
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.questions
    }
    return null
  }

  // Cache questions for future use
  cacheQuestions(subject, difficulty, count, questions) {
    const key = this.getCacheKey(subject, difficulty, count)
    this.cache.set(key, {
      questions,
      timestamp: Date.now()
    })
  }

  // Generate battle questions with AI
  async generateBattleQuestions(subject, difficulty = 'medium', count = 10) {
    try {
      // Check cache first
      const cached = this.getCachedQuestions(subject, difficulty, count)
      if (cached) {
        console.log('Using cached questions for', subject, difficulty)
        return cached
      }

      console.log('Generating AI questions for', subject, difficulty, count)
      
      const prompt = BATTLE_PROMPTS.BATTLE_QUESTIONS({
        count,
        subject,
        difficulty
      })

      const response = await callGroqAPI(prompt, GROQ_MODELS.SPEEDSTER)
      
      if (!response) {
        throw new Error('Failed to generate questions')
      }

      // Parse and validate response
      let questions
      try {
        questions = JSON.parse(response)
      } catch {
        console.error('Failed to parse AI response:', response)
        throw new Error('Invalid question format from AI')
      }

      // Validate questions structure
      if (!Array.isArray(questions) || questions.length !== count) {
        throw new Error(`Expected ${count} questions, got ${questions?.length || 0}`)
      }

      // Add IDs and validate each question
      questions = questions.map((q, index) => ({
        id: q.id || `q_${index + 1}`,
        question: q.question,
        type: q.type || 'multiple',
        options: q.options || [],
        correct_answer: q.correct_answer || 0,
        explanation: q.explanation || '',
        difficulty: q.difficulty || 'medium',
        time_limit_seconds: q.time_limit_seconds || 15,
        subject: q.subject || subject,
        topic: q.topic || 'General'
      }))

      // Cache the generated questions
      this.cacheQuestions(subject, difficulty, count, questions)

      return questions
    } catch (error) {
      console.error('Error generating battle questions:', error)
      
      // Fallback to predefined questions if AI fails
      return this.getFallbackQuestions(subject, difficulty, count)
    }
  }

  // Generate adaptive questions based on performance
  async generateAdaptiveQuestions(studentProfile, count = 10) {
    try {
      const { level, performance, weakAreas, strongAreas } = studentProfile
      
      const prompt = BATTLE_PROMPTS.ADAPTIVE_QUESTIONS({
        count,
        level: level || 'intermediate',
        performance: performance || 'average',
        weakAreas: weakAreas?.join(', ') || 'none',
        strongAreas: strongAreas?.join(', ') || 'none'
      })

      const response = await callGroqAPI(prompt, GROQ_MODELS.SPEEDSTER)
      
      if (!response) {
        throw new Error('Failed to generate adaptive questions')
      }

      const questions = JSON.parse(response)
      return questions.map((q, index) => ({
        id: q.id || `adaptive_q_${index + 1}`,
        ...q
      }))
    } catch (error) {
      console.error('Error generating adaptive questions:', error)
      return this.getFallbackQuestions('General', 'medium', count)
    }
  }

  // Generate hint for a specific question
  async generateHint(question, options, subject) {
    try {
      const prompt = BATTLE_PROMPTS.BATTLE_HINT({
        question,
        options,
        subject
      })

      const response = await callGroqAPI(prompt, GROQ_MODELS.SPEEDSTER)
      
      if (!response) {
        throw new Error('Failed to generate hint')
      }

      const hintData = JSON.parse(response)
      return hintData
    } catch (error) {
      console.error('Error generating hint:', error)
      return {
        hint: 'Think carefully about the key concepts involved.',
        motivation: 'You can do this! Take your time and reason through it.'
      }
    }
  }

  // Analyze battle performance
  async analyzePerformance(battleData) {
    try {
      const {
        score,
        totalQuestions,
        timeTaken,
        subject,
        missedQuestions,
        opponentScore
      } = battleData

      const accuracy = Math.round((score / totalQuestions) * 100)
      
      const prompt = BATTLE_PROMPTS.BATTLE_ANALYSIS({
        score,
        totalQuestions,
        timeTaken,
        subject,
        missedQuestions,
        accuracy
      })

      const response = await callGroqAPI(prompt, GROQ_MODELS.PROFESSOR)
      
      if (!response) {
        throw new Error('Failed to analyze performance')
      }

      const analysis = JSON.parse(response)
      return {
        ...analysis,
        accuracy,
        score,
        totalQuestions,
        timeTaken,
        opponentScore
      }
    } catch (error) {
      console.error('Error analyzing performance:', error)
      return this.getFallbackAnalysis(battleData)
    }
  }

  // Generate comprehensive battle review
  async generateBattleReview(battleData) {
    try {
      const {
        subject,
        score,
        opponentScore,
        totalQuestions,
        avgTime,
        questionReview
      } = battleData

      const prompt = BATTLE_PROMPTS.BATTLE_REVIEW({
        subject,
        score,
        opponentScore,
        totalQuestions,
        avgTime,
        questionReview
      })

      const response = await callGroqAPI(prompt, GROQ_MODELS.PROFESSOR)
      
      if (!response) {
        throw new Error('Failed to generate battle review')
      }

      return JSON.parse(response)
    } catch (error) {
      console.error('Error generating battle review:', error)
      return this.getFallbackReview(battleData)
    }
  }

  // Fallback questions if AI fails
  getFallbackQuestions(subject, difficulty, count) {
    console.log('Using fallback questions for', subject)
    
    const fallbackQuestions = [
      {
        id: 'fallback_1',
        question: `What is the primary function of ${subject}?`,
        type: 'multiple',
        options: [
          'To analyze and solve problems',
          'To memorize facts only',
          'To skip difficult topics',
          'To avoid studying'
        ],
        correct_answer: 0,
        explanation: 'The primary function is to analyze and solve problems systematically.',
        difficulty: 'easy',
        time_limit_seconds: 15,
        subject,
        topic: 'Basics'
      },
      {
        id: 'fallback_2',
        question: `Which approach is best for studying ${subject}?`,
        type: 'multiple',
        options: [
          'Last-minute cramming',
          'Consistent practice and review',
          'Only reading without practice',
          'Studying without breaks'
        ],
        correct_answer: 1,
        explanation: 'Consistent practice and regular review is the most effective approach.',
        difficulty: 'medium',
        time_limit_seconds: 20,
        subject,
        topic: 'Study Methods'
      },
      {
        id: 'fallback_3',
        question: `When facing a difficult problem in ${subject}, you should:`,
        type: 'multiple',
        options: [
          'Give up immediately',
          'Break it down into smaller parts',
          'Skip it completely',
          'Guess randomly'
        ],
        correct_answer: 1,
        explanation: 'Breaking difficult problems into smaller parts makes them more manageable.',
        difficulty: 'easy',
        time_limit_seconds: 15,
        subject,
        topic: 'Problem Solving'
      }
    ]

    // Repeat and modify questions to reach count
    const result = []
    for (let i = 0; i < count; i++) {
      const baseQuestion = fallbackQuestions[i % fallbackQuestions.length]
      result.push({
        ...baseQuestion,
        id: `fallback_${i + 1}`,
        question: i >= fallbackQuestions.length 
          ? `${baseQuestion.question} (Practice ${i + 1})`
          : baseQuestion.question
      })
    }

    return result
  }

  // Fallback analysis if AI fails
  getFallbackAnalysis(battleData) {
    const { accuracy } = battleData
    
    return {
      strengths: accuracy >= 70 ? ['Good overall performance', 'Solid understanding'] : ['Attempted the battle'],
      weaknesses: accuracy < 70 ? ['Need more practice', 'Review basic concepts'] : ['Minor areas to improve'],
      recommendations: [
        'Practice regularly with similar questions',
        'Review explanations for incorrect answers',
        'Focus on understanding concepts',
        'Manage time effectively during battles'
      ],
      examReadiness: Math.min(95, accuracy + 10),
      nextSteps: accuracy >= 80 ? 'Challenge harder battles' : 'Practice fundamental concepts'
    }
  }

  // Fallback review if AI fails
  getFallbackReview(battleData) {
    const { score, totalQuestions, questionReview } = battleData
    
    return {
      questionReviews: questionReview?.map(q => ({
        question: q.question,
        whyWrong: 'Review the concept and practice similar questions',
        correctApproach: 'Study the fundamental principles and apply them systematically',
        relatedConcepts: ['Basic concepts', 'Problem-solving techniques'],
        practiceQuestions: ['Practice similar problems', 'Review textbook examples']
      })) || [],
      summary: `You scored ${score}/${totalQuestions}. Keep practicing to improve your performance.`
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear()
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Export singleton instance
export const battleQuestionGenerator = new BattleQuestionGenerator()
