import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Groq AI Configuration
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

// Model Selection Logic
export const GROQ_MODELS = {
  PROFESSOR: 'llama-3.3-70b-versatile',  // For AI Notes, Complex Tutoring, Context Understanding
  SPEEDSTER: 'llama-3.1-8b-instant'      // For AI Summary, Flashcard Generation, Mock Exam MCQs
}

// Master System Prompt - The Soul of Luter AI
export const LUTER_SYSTEM_PROMPT = `You are Luter AI, a premium, high-energy Academic Tutor for Nigerian University students. Your goal is to simplify complex departmental materials into 'First Class' quality insights.

Tone: Encouraging, sharp, and professional. Use Nigerian academic context where appropriate (e.g., referencing 'JAMB-style' or 'CBT-standard' questions).

Constraint 1 (Groundedness): Only answer based on the provided study materials. If the answer isn't there, say 'The lecturer didn't cover this in the uploaded notes, but generally speaking...'
Constraint 2 (Formatting): Always output in clean Markdown. Use bolding for key terms and bullet points for readability. No long walls of text.
Constraint 3 (The 30-Min Promise): When solving assignments, provide a 'Logic First' breakdown—show's formula, then the substitution, then the final result.`

// Feature-Specific Prompts
export const GROQ_PROMPTS = {
  AI_NOTES: `Analyze the following lecture content. Extract the core definitions, the 3 most important formulas/concepts, and create a 2-paragraph 'Executive Summary' for a student who missed this class. Format with clear H2 headings.`,
  
  FLASHCARDS: `Convert this material into a JSON array of flashcards. Each object must have a 'front' (question/term) and a 'back' (concise answer). Focus on 'Active Recall'—ask questions that test understanding, not just rote memorization.`,
  
  MOCK_EXAM: `Generate 5 Multiple Choice Questions (MCQs) based on this text. Format: 1 Question, 4 Options (A, B, C, D), and Correct Answer with a brief explanation. Ensure 1 question is 'Hard' (Boss Level) and others are 'Standard'.`,
  
  ASSIGNMENT_SOLUTION: `Provide a step-by-step solution to this assignment problem. Follow the 'Logic First' approach: 1) Identify the formula/concept, 2) Show the substitution, 3) Calculate the result, 4) Explain the reasoning. Format in clear markdown with numbered steps.`,
  
  AI_TUTOR: `You are Luter AI Tutor helping a student understand this course material. Be encouraging, use examples relevant to Nigerian university context, and provide clear, concise explanations.`
}

// Request Queue for Rate Limit Handling
class RequestQueue {
  constructor() {
    this.queue = []
    this.processing = false
  }

  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const { request, resolve, reject } = this.queue.shift()
      
      try {
        const result = await this.executeRequest(request)
        resolve(result)
      } catch (error) {
        // If rate limited, wait and retry
        if (error.status === 429) {
          console.log('Rate limited. Waiting 10 seconds before retry...')
          await new Promise(resolve => setTimeout(resolve, 10000))
          // Add back to front of queue to retry
          this.queue.unshift({ request, resolve, reject })
          continue // Skip to next iteration
        } else {
          reject(error)
        }
      }
    }
    
    this.processing = false
  }

  async executeRequest({ messages, model, temperature = 0.7, responseFormat }) {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        ...(responseFormat && { response_format: responseFormat })
      })
    })

    if (!response.ok) {
      const error = new Error(`HTTP error! status: ${response.status}`)
      error.status = response.status
      throw error
    }

    return response.json()
  }
}

export const groqQueue = new RequestQueue()

// Main Groq API Function
export async function callGroqAPI(messages, model = GROQ_MODELS.PROFESSOR, options = {}) {
  const { temperature = 0.7, responseFormat = null, useQueue = true } = options
  
  const request = {
    messages: [
      { role: 'system', content: LUTER_SYSTEM_PROMPT },
      ...messages
    ],
    model,
    temperature,
    ...(responseFormat && { response_format: responseFormat })
  }

  if (useQueue) {
    return await groqQueue.add(request)
  } else {
    return await groqQueue.executeRequest(request)
  }
}
