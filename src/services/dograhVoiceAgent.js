import { callGroqAPI, GROQ_MODELS } from '../groqClient'

export async function askDograhVoiceAgent({
  question,
  fileName,
  currentPage,
  totalPages,
  materialContext,
}) {
  const endpoint = import.meta.env.VITE_DOGRAH_AGENT_URL
  const systemPrompt = `You are Luter AI, a study assistant.
The student is currently studying: ${fileName || 'Study material'}
Current slide/page: ${currentPage || 1}${totalPages ? ` of ${totalPages}` : ''}
Material context: ${materialContext || 'No extracted page context is available yet.'}

Answer questions about this material clearly and concisely. You are speaking, so keep responses natural and conversational. Aim for 2-3 sentences unless more depth is needed.`

  if (endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        systemPrompt,
        context: {
          fileName,
          currentPage,
          totalPages,
          materialContext,
        },
      }),
    })

    if (!response.ok) throw new Error('Dograh voice agent request failed')
    const data = await response.json()
    return data.response || data.text || data.answer || ''
  }

  const response = await callGroqAPI(
    [{ role: 'user', content: question }],
    GROQ_MODELS.SPEEDSTER,
    { systemPromptOverride: systemPrompt }
  )

  return response?.choices?.[0]?.message?.content || ''
}
