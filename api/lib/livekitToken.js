import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@supabase/supabase-js'

const ROOM_PREFIX_PATTERN = /^luter-(session|group|share|material-v2|material)-([a-zA-Z0-9_-]+)$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

function getHeader(req, name) {
  const value = req.headers?.[name] || req.headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

function getBearerToken(req) {
  const header = getHeader(req, 'authorization') || ''
  const match = String(header).match(/^Bearer\s+(.+)$/i)
  return match?.[1] || ''
}

function createAuthedSupabase(jwt, env) {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
  })
}

async function canJoinRoom(supabase, roomName) {
  const match = roomName.match(ROOM_PREFIX_PATTERN)
  if (!match) return false

  const [, roomType, roomKey] = match

  if (roomType === 'session') {
    if (!UUID_PATTERN.test(roomKey)) return false
    const { data, error } = await supabase
      .from('deck_sessions')
      .select('id')
      .eq('id', roomKey)
      .eq('is_active', true)
      .maybeSingle()
    if (error) throw error
    return Boolean(data)
  }

  if (roomType === 'group') {
    if (!UUID_PATTERN.test(roomKey)) return false
    const { data, error } = await supabase
      .from('study_groups')
      .select('id')
      .eq('id', roomKey)
      .maybeSingle()
    if (error) throw error
    return Boolean(data)
  }

  if (roomType === 'share') {
    const { data, error } = await supabase
      .from('deck_sessions')
      .select('id')
      .eq('share_code', roomKey.toLowerCase())
      .eq('is_shared', true)
      .eq('is_active', true)
      .maybeSingle()
    if (error) throw error
    return Boolean(data)
  }

  if (roomType === 'material' || roomType === 'material-v2') {
    if (!UUID_PATTERN.test(roomKey)) return false
    const { data, error } = await supabase
      .from('materials')
      .select('id')
      .eq('id', roomKey)
      .maybeSingle()
    if (error) throw error
    return Boolean(data)
  }

  return false
}

export async function handleLiveKitTokenRequest(req, res, env = process.env) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const livekitUrl = env.LIVEKIT_URL
  const livekitApiKey = env.LIVEKIT_API_KEY
  const livekitApiSecret = env.LIVEKIT_API_SECRET
  if (!livekitUrl || !livekitApiKey || !livekitApiSecret) {
    sendJson(res, 503, { error: 'LiveKit environment variables are not configured' })
    return
  }

  const authToken = getBearerToken(req)
  if (!authToken) {
    sendJson(res, 401, { error: 'Missing authentication token' })
    return
  }

  const { roomName, userId, username } = req.body || {}
  if (!roomName || !userId || !username) {
    sendJson(res, 400, { error: 'Missing roomName, userId, or username' })
    return
  }

  try {
    const supabase = createAuthedSupabase(authToken, env)
    const { data: userData, error: userError } = await supabase.auth.getUser(authToken)
    if (userError || !userData?.user) {
      sendJson(res, 401, { error: 'Invalid authentication token' })
      return
    }

    if (userData.user.id !== userId) {
      sendJson(res, 403, { error: 'User mismatch' })
      return
    }

    const allowed = await canJoinRoom(supabase, roomName)
    if (!allowed) {
      sendJson(res, 403, { error: 'You are not allowed to join this audio room' })
      return
    }

    const token = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: userData.user.id,
      name: String(username).slice(0, 80),
      ttl: 60 * 60,
    })

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
    })

    sendJson(res, 200, {
      token: await token.toJwt(),
      livekitUrl,
    })
  } catch (error) {
    console.error('LiveKit token error:', error)
    sendJson(res, 500, { error: error.message || 'Failed to create LiveKit token' })
  }
}
