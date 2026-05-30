import { readJsonBody } from './lib/readJsonBody.js'

const DAILY_API_URL = 'https://api.daily.co/v1'
const DAILY_API_KEY = process.env.DAILY_API_KEY

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  if (!DAILY_API_KEY) {
    res.statusCode = 503
    res.end(JSON.stringify({ error: 'DAILY_API_KEY is not configured' }))
    return
  }

  let body
  try {
    body = await readJsonBody(req)
  } catch {
    body = {}
  }

  const { sessionId } = body

  if (!sessionId) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Missing sessionId' }))
    return
  }

  const roomName = `luter-session-${sessionId}`
  const audioRoomProperties = {
    exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
    max_participants: 100,
    audio_only: true,
    start_video_off: true,
    enable_prejoin_ui: false,
    enable_screenshare: false,
  }

  try {
    // Check if room already exists
    const existingRes = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    let roomUrl
    if (existingRes.ok) {
      let room = await existingRes.json()
      const config = room.config || {}
      const needsAudioOnlyUpdate =
        config.audio_only !== true ||
        config.start_video_off !== true ||
        config.enable_prejoin_ui !== false ||
        config.enable_screenshare !== false

      if (needsAudioOnlyUpdate) {
        const updateRes = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: audioRoomProperties }),
        })

        if (!updateRes.ok) {
          throw new Error(`Failed to update room: ${updateRes.status}`)
        }

        room = await updateRes.json()
      }

      roomUrl = room.url
    } else if (existingRes.status === 404) {
      // Room doesn't exist, create it
      const createRes = await fetch(`${DAILY_API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          properties: audioRoomProperties,
        }),
      })

      if (!createRes.ok) {
        throw new Error(`Failed to create room: ${createRes.status}`)
      }

      const room = await createRes.json()
      roomUrl = room.url
    } else {
      throw new Error(`Daily API error: ${existingRes.status}`)
    }

    res.statusCode = 200
    res.end(
      JSON.stringify({
        success: true,
        roomUrl,
        roomName,
        sessionId,
      }),
    )
  } catch (error) {
    console.error('Daily.co API error:', error)
    res.statusCode = 500
    res.end(JSON.stringify({ error: error.message || 'Failed to create/fetch room' }))
  }
}
