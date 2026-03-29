import { OAuth2Client } from 'google-auth-library'
import { readJsonBody } from './lib/readJsonBody.js'

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) {
    res.statusCode = 503
    res.end(JSON.stringify({ error: 'VITE_GOOGLE_CLIENT_ID is not configured' }))
    return
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch {
    body = {}
  }
  const { token } = body
  if (!token) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Missing token' }))
    return
  }

  try {
    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    })
    const payload = ticket.getPayload()
    res.statusCode = 200
    res.end(
      JSON.stringify({
        message: 'Success',
        user: {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        },
      }),
    )
  } catch (e) {
    res.statusCode = 401
    res.end(JSON.stringify({ error: e.message }))
  }
}
