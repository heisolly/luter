import { Liveblocks } from "@liveblocks/node"
import { createClient } from "@supabase/supabase-js"
import { readJsonBody } from "./lib/readJsonBody.js"

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  
  const liveblocks = new Liveblocks({
    secret: process.env.VITE_LIVEBLOCKS_SECRET_KEY || ""
  })

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  // Get user session token from Authorization header
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.statusCode = 401
    res.end(JSON.stringify({ error: 'Missing authorization header' }))
    return
  }

  // Init supabase server client to verify token
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    res.statusCode = 401
    res.end(JSON.stringify({ error: 'Unauthorized' }))
    return
  }

  // Fetch the user's profile to get their real name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, avatar_url')
    .eq('id', user.id)
    .single()

  const firstName = profile?.first_name || 'Scholar'
  const lastName = profile?.last_name || ''
  const displayName = `${firstName} ${lastName}`.trim() || user.email?.split('@')[0]

  // Unique color hash function
  const colors = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399', '#2dd4bf', 
    '#38bdf8', '#818cf8', '#a78bfa', '#e879f9', '#fb7185'
  ]
  let hash = 0
  for (let i = 0; i < user.id.length; i++) {
    hash = user.id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const color = colors[Math.abs(hash) % colors.length]

  try {
    let body
    try {
      body = await readJsonBody(req)
    } catch {
      body = {}
    }
    const { room } = body

    // Create session for user
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        id: user.id,
        name: displayName,
        avatar: profile?.avatar_url || null,
        color: color
      }
    })

    if (room) {
      session.allow(room, session.FULL_ACCESS)
    } else {
      session.allow("*", session.FULL_ACCESS)
    }

    const { status, body: authBody } = await session.authorize()
    res.statusCode = status
    res.end(authBody)
    
  } catch (err) {
    console.error("Liveblocks Auth Error:", err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Internal Server Error' }))
  }
}
