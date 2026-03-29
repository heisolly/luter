/**
 * Parse JSON body for Vite middleware (Node req) and Vercel serverless.
 */
export async function readJsonBody(req) {
  if (req.body != null) {
    if (Buffer.isBuffer(req.body)) {
      try {
        return JSON.parse(req.body.toString('utf8') || '{}')
      } catch {
        return {}
      }
    }
    if (typeof req.body === 'object') {
      return req.body
    }
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body || '{}')
      } catch {
        return {}
      }
    }
  }

  const chunks = []
  try {
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)))
    }
  } catch {
    return {}
  }
  if (!chunks.length) return {}
  const raw = Buffer.concat(chunks).toString('utf8')
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}
