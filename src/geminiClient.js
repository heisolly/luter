// geminiClient.js — Gemini API interface for Luter AI
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useLuterStore } from './store/useLuterStore'

export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY

export const GEMINI_MODELS = {
  FLASH: 'gemini-1.5-flash',
  PRO: 'gemini-1.5-pro'
}

export const GEMINI_SYSTEM_PROMPT = `You are Luter AI (powered by Gemini), a premium, high-energy Academic Tutor for Nigerian University students. Your goal is to simplify complex departmental materials into 'First Class' quality insights.

Tone: Encouraging, sharp, and professional. Use Nigerian academic context where appropriate (e.g., referencing 'JAMB-style' or 'CBT-standard' questions).

Constraint 1 (Groundedness): Only answer based on the provided study materials. If the answer isn't there, say 'The lecturer didn't cover this in the uploaded notes, but generally speaking...'
Constraint 2 (Formatting): Always output in clean Markdown. Use bolding for key terms and bullet points for readability. No long walls of text.
Constraint 3 (The 30-Min Promise): When solving assignments, provide a 'Logic First' breakdown—show's formula, then the substitution, then the final result.`

export function buildGeminiSystemPrompt(profile) {
  let prompt = GEMINI_SYSTEM_PROMPT
  if (!profile) return prompt
  const uni = profile.university
  const fac = profile.faculty
  if (uni || fac) {
    prompt += `\n\nAcademic placement: The learner studies ${fac || 'their programme'}${uni ? ` at ${uni}` : ''}. Prefer Nigerian NUC/JAMB-adjacent framing for 100-level and General Studies (GST/GNS) when it helps.`
  }
  return prompt
}

/**
 * Main Gemini API Function
 * Maps OpenAI-style message format to Google Generative AI format
 */
export async function callGeminiAPI(messages, modelName = GEMINI_MODELS.FLASH, options = {}) {
  const apiKeyUsed = GEMINI_API_KEY
  if (!apiKeyUsed) {
    throw new Error('Gemini API key is not configured in .env file')
  }

  const {
    temperature = 0.4,
    responseFormat = null,
    profile = null,
    systemPromptOverride = null,
  } = options

  let systemContent =
    systemPromptOverride ??
    (profile ? buildGeminiSystemPrompt(profile) : GEMINI_SYSTEM_PROMPT)

  try {
    const lang = useLuterStore.getState().currentLanguage
    if (lang && lang !== 'en') {
      systemContent += `\n\nUser Preference: ${lang.toUpperCase()}. CRITICAL INSTRUCTION: You are now a tutor helping the user. The user's preferred language is ${lang.toUpperCase()}. You MUST respond ONLY in this language (${lang.toUpperCase()}) unless explicitly asked otherwise. If you are generating structured data (like JSON), keep all JSON keys in English, but translate the string values to ${lang.toUpperCase()}!`
    }
  } catch (e) {}

  // 1. Initialize SDK
  const genAI = new GoogleGenerativeAI(apiKeyUsed)
  
  // 2. Map messages to Gemini API format
  // Filter out system messages and map user/assistant messages to roles 'user'/'model'
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

  // If no user content, provide a fallback part
  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'Hello' }]
    })
  }

  // 3. Prepare config
  const generationConfig = {
    temperature,
    ...(responseFormat?.type === 'json_object' && { responseMimeType: 'application/json' })
  }

  console.log(`[GeminiAPI] Calling ${modelName} with temperature ${temperature}`)
  
  // 4. Request generation
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemContent
  })

  const result = await model.generateContent({
    contents,
    generationConfig
  })

  const response = await result.response
  const text = response.text()

  // Return structure matching OpenAI/Groq for seamless drop-in integration
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: text
        }
      }
    ],
    usage: {
      total_tokens: 0 // Node SDK doesn't return usage directly easily, default to 0
    }
  }
}
