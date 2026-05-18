// mistralClient.js — Mistral AI API interface for Luter AI
import { useLuterStore } from './store/useLuterStore'

export const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || import.meta.env.MISTRAL_API_KEY

export const MISTRAL_MODELS = {
  TINY: 'mistral-tiny',
  SMALL: 'mistral-small-latest',
  MEDIUM: 'mistral-medium-latest',
  LARGE: 'mistral-large-latest'
}

export const MISTRAL_SYSTEM_PROMPT = `You are Luter AI (powered by Mistral AI), a premium, high-energy Academic Tutor for Nigerian University students. Your goal is to simplify complex departmental materials into 'First Class' quality insights.

Tone: Encouraging, sharp, and professional. Use Nigerian academic context where appropriate (e.g., referencing 'JAMB-style' or 'CBT-standard' questions).

Constraint 1 (Groundedness): Only answer based on the provided study materials. If the answer isn't there, say 'The lecturer didn't cover this in the uploaded notes, but generally speaking...'
Constraint 2 (Formatting): Always output in clean Markdown. Use bolding for key terms and bullet points for readability. No long walls of text.
Constraint 3 (The 30-Min Promise): When solving assignments, provide a 'Logic First' breakdown—show's formula, then the substitution, then the final result.`

export function buildMistralSystemPrompt(profile) {
  let prompt = MISTRAL_SYSTEM_PROMPT
  if (!profile) return prompt
  const uni = profile.university
  const fac = profile.faculty
  if (uni || fac) {
    prompt += `\n\nAcademic placement: The learner studies ${fac || 'their programme'}${uni ? ` at ${uni}` : ''}. Prefer Nigerian NUC/JAMB-adjacent framing for 100-level and General Studies (GST/GNS) when it helps.`
  }
  return prompt
}

/**
 * Main Mistral AI API Function
 * Maps OpenAI-style message format to Mistral AI format
 */
export async function callMistralAPI(messages, modelName = MISTRAL_MODELS.LARGE, options = {}) {
  const apiKeyUsed = MISTRAL_API_KEY
  if (!apiKeyUsed) {
    throw new Error('Mistral API key is not configured in .env file')
  }

  const {
    temperature = 0.7,
    responseFormat = null,
    profile = null,
    systemPromptOverride = null,
  } = options

  let systemContent =
    systemPromptOverride ??
    (profile ? buildMistralSystemPrompt(profile) : MISTRAL_SYSTEM_PROMPT)

  try {
    const lang = useLuterStore.getState().currentLanguage
    if (lang && lang !== 'en') {
      systemContent += `\n\nUser Preference: ${lang.toUpperCase()}. CRITICAL INSTRUCTION: You are now a tutor helping the user. The user's preferred language is ${lang.toUpperCase()}. You MUST respond ONLY in this language (${lang.toUpperCase()}) unless explicitly asked otherwise. If you are generating structured data (like JSON), keep all JSON keys in English, but translate the string values to ${lang.toUpperCase()}!`
    }
  } catch (e) {}

  const fullMessages = [
    { role: 'system', content: systemContent },
    ...messages.filter(m => m.role !== 'system')
  ]

  console.log(`[MistralAPI] Calling ${modelName} with temperature ${temperature}`)

  // 1. Try official SDK first
  try {
    const { Mistral } = await import('@mistralai/mistralai')
    if (Mistral) {
      const client = new Mistral({ apiKey: apiKeyUsed })
      const response = await client.chat.complete({
        model: modelName,
        messages: fullMessages,
        temperature,
        ...(responseFormat?.type === 'json_object' && { responseFormat: { type: 'json_object' } })
      })

      return {
        choices: [
          {
            message: {
              role: 'assistant',
              content: response.choices[0]?.message?.content || ''
            }
          }
        ],
        usage: {
          total_tokens: response.usage?.totalTokens || 0
        }
      }
    }
  } catch (sdkError) {
    console.warn('[MistralAPI] SDK initialization or completion failed, falling back to pure fetch:', sdkError)
  }

  // 2. Fallback to pure fetch (100% resilient)
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKeyUsed}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: fullMessages,
      temperature,
      ...(responseFormat?.type === 'json_object' && { response_format: { type: 'json_object' } })
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Mistral API request failed: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const result = await response.json()
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: result.choices[0]?.message?.content || ''
        }
      }
    ],
    usage: {
      total_tokens: result.usage?.total_tokens || 0
    }
  }
}
