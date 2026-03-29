/**
 * Shared syllabus web layer: Tavily search + optional scrape + Groq extraction.
 * Used by Vite dev middleware and Vercel serverless.
 */
export async function runSyllabusWebLayer(
  { university, department, level, semester, scrapeUrl, searchFocus, includeSnippet },
  env,
) {
  const tavilyKey = env.TAVILY_API_KEY || ''
  const groqKey = env.GROQ_API_KEY || env.VITE_GROQ_API_KEY || ''
  let blob = ''

  const baseParts = [
    university || '',
    department || '',
    level || '',
    'level',
    semester || '',
    'semester',
    'courses syllabus Nigeria university',
  ]
  if (searchFocus && String(searchFocus).trim()) {
    baseParts.push(String(searchFocus).trim())
  }
  const tavilyQuery = baseParts.filter(Boolean).join(' ')

  if (tavilyKey) {
    const tr = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: tavilyQuery,
        search_depth: 'advanced',
        max_results: 12,
        include_answer: true,
      }),
    })
    const tj = await tr.json()
    blob += (tj.answer || '') + '\n'
    for (const r of tj.results || []) {
      blob += (r.content || '') + '\n'
    }
  }

  if (scrapeUrl && typeof scrapeUrl === 'string' && scrapeUrl.startsWith('http')) {
    try {
      const fr = await fetch(scrapeUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Luter/1.0)' },
      })
      const html = await fr.text()
      blob +=
        '\n' +
        html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .slice(0, 25000)
    } catch {
      /* ignore scrape errors */
    }
  }

  let courses = []
  if (groqKey && blob.length > 80) {
    const gr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.25,
        messages: [
          {
            role: 'system',
            content:
              'Extract Nigerian university courses from the text. Return ONLY a JSON array. Each object: {"code":"CSC301","name":"Full course title"}. Codes: compact uppercase, no spaces.',
          },
          { role: 'user', content: blob.slice(0, 28000) },
        ],
      }),
    })
    const gj = await gr.json()
    let txt = gj.choices?.[0]?.message?.content || ''
    txt = txt.trim()
    if (txt.startsWith('```json')) txt = txt.slice(7)
    if (txt.startsWith('```')) txt = txt.slice(3)
    if (txt.endsWith('```')) txt = txt.slice(0, -3)
    const arr = JSON.parse(txt.trim())
    const list = Array.isArray(arr) ? arr : arr?.courses || []
    courses = list
      .map((c) => ({
        code: String(c.code || '')
          .replace(/\s+/g, '')
          .toUpperCase()
          .slice(0, 16),
        name: String(c.name || c.title || '').trim(),
      }))
      .filter((c) => c.code && c.name)
  }

  const out = {
    ok: true,
    courses,
    meta: { tavily: Boolean(tavilyKey), scrape: Boolean(scrapeUrl) },
  }
  if (includeSnippet && blob.length > 0) {
    out.snippet = blob.slice(0, 8000)
  }
  return out
}
