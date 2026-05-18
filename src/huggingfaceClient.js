// huggingfaceClient.js — Hugging Face API interface for Luter AI
import { HfInference } from '@huggingface/inference'
import { useLuterStore } from './store/useLuterStore'

export const HF_API_KEY = import.meta.env.VITE_HF_API_KEY || import.meta.env.HF_API_KEY

export const HF_MODELS = {
  CODER: 'NousResearch/NousCoder-14B',
  HERMES: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
  QWEN: 'Qwen/Qwen2.5-72B-Instruct'
}

export const HF_SYSTEM_PROMPT = `You are Luter AI (powered by Hugging Face), a premium, high-energy Academic Tutor for Nigerian University students. Your goal is to simplify complex departmental materials into 'First Class' quality insights.

Tone: Encouraging, sharp, and professional. Use Nigerian academic context where appropriate (e.g., referencing 'JAMB-style' or 'CBT-standard' questions).

Constraint 1 (Groundedness): Only answer based on the provided study materials. If the answer isn't there, say 'The lecturer didn't cover this in the uploaded notes, but generally speaking...'
Constraint 2 (Formatting): Always output in clean Markdown. Use bolding for key terms and bullet points for readability. No long walls of text.
Constraint 3 (The 30-Min Promise): When solving assignments, provide a 'Logic First' breakdown—show's formula, then the substitution, then the final result.`

export function buildHfSystemPrompt(profile) {
  let prompt = HF_SYSTEM_PROMPT
  if (!profile) return prompt
  const uni = profile.university
  const fac = profile.faculty
  if (uni || fac) {
    prompt += `\n\nAcademic placement: The learner studies ${fac || 'their programme'}${uni ? ` at ${uni}` : ''}. Prefer Nigerian NUC/JAMB-adjacent framing for 100-level and General Studies (GST/GNS) when it helps.`
  }
  return prompt
}

/**
 * Main Hugging Face API Function (Chat Completion)
 * Compatible with Groq/OpenAI chat completion response format
 */
export async function callHuggingFaceAPI(messages, modelName = HF_MODELS.HERMES, options = {}) {
  const apiKeyUsed = HF_API_KEY
  if (!apiKeyUsed) {
    throw new Error('Hugging Face API key is not configured in .env file')
  }

  const {
    temperature = 0.7,
    maxTokens = 1000,
    profile = null,
    systemPromptOverride = null,
  } = options

  let systemContent =
    systemPromptOverride ??
    (profile ? buildHfSystemPrompt(profile) : HF_SYSTEM_PROMPT)

  try {
    const lang = useLuterStore.getState().currentLanguage
    if (lang && lang !== 'en') {
      systemContent += `\n\nUser Preference: ${lang.toUpperCase()}. CRITICAL INSTRUCTION: You are now a tutor helping the user. The user's preferred language is ${lang.toUpperCase()}. You MUST respond ONLY in this language (${lang.toUpperCase()}) unless explicitly asked otherwise. If you are generating structured data (like JSON), keep all JSON keys in English, but translate the string values to ${lang.toUpperCase()}!`
    }
  } catch (e) {}

  const hf = new HfInference(apiKeyUsed)

  // Construct request message sequence with system instructions
  const fullMessages = [
    { role: 'system', content: systemContent },
    ...messages.filter(m => m.role !== 'system')
  ]

  console.log(`[HuggingFaceAPI] Calling chatCompletion with model ${modelName}`)

  try {
    const response = await hf.chatCompletion({
      model: modelName,
      messages: fullMessages,
      max_tokens: maxTokens,
      temperature: temperature
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
        total_tokens: 0
      }
    }
  } catch (chatError) {
    console.warn(`[HuggingFaceAPI] chatCompletion failed, falling back to textGeneration:`, chatError)
    
    // Fallback: direct text generation using prompt format if chatCompletion is not supported by the model
    const lastUserMessage = messages[messages.length - 1]?.content || ''
    const fullPrompt = `${systemContent}\n\nUser: ${lastUserMessage}\n\nAssistant:`
    
    const response = await hf.textGeneration({
      model: modelName,
      inputs: fullPrompt,
      parameters: {
        max_new_tokens: maxTokens,
        temperature: temperature,
        return_full_text: false
      }
    })

    return {
      choices: [
        {
          message: {
            role: 'assistant',
            content: response.generated_text?.trim() || ''
          }
        }
      ],
      usage: {
        total_tokens: 0
      }
    }
  }
}

/**
 * Text Generation specifically (e.g. for NousCoder-14B)
 */
export async function callHuggingFaceTextGeneration(prompt, modelName = HF_MODELS.CODER, maxTokens = 500) {
  const apiKeyUsed = HF_API_KEY
  if (!apiKeyUsed) {
    throw new Error('Hugging Face API key is not configured in .env file')
  }

  const hf = new HfInference(apiKeyUsed)
  console.log(`[HuggingFaceAPI] Calling textGeneration with model ${modelName}`)
  
  const response = await hf.textGeneration({
    model: modelName,
    inputs: prompt,
    parameters: {
      max_new_tokens: maxTokens,
      return_full_text: false
    }
  })

  return response.generated_text?.trim() || ''
}
