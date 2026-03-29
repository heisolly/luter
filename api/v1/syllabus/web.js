import { runSyllabusWebLayer } from '../../lib/syllabusWeb.js'
import { readJsonBody } from '../../lib/readJsonBody.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ ok: false, error: 'Method not allowed' }))
    return
  }

  const parsed = await readJsonBody(req)
  const { university, department, level, semester, scrapeUrl, searchFocus, includeSnippet } = parsed

  try {
    const out = await runSyllabusWebLayer(
      { university, department, level, semester, scrapeUrl, searchFocus, includeSnippet },
      process.env,
    )
    res.statusCode = 200
    res.end(JSON.stringify(out))
  } catch (e) {
    res.statusCode = 200
    res.end(JSON.stringify({ ok: true, courses: [], error: String(e?.message || e) }))
  }
}
