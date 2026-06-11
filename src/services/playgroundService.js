import { supabase } from '../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../groqClient'

export const playgroundService = {
  supabase,

  // ── ROOM MANAGEMENT ──
  
  async createRoom(gameType, userId, settings = {}, metadata = {}) {
    const { data, error } = await supabase
      .from('playground_rooms')
      .insert({
        game_type: gameType,
        created_by: userId,
        status: 'waiting',
        settings,
        metadata
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Add creator as first participant
    await this.joinRoom(data.id, userId)
    
    return data
  },

  async joinRoom(roomId, userId, guestName = null) {
    const participantData = {
      room_id: roomId,
      status: 'active',
      score: 0,
      is_ready: false
    }

    if (userId) participantData.user_id = userId
    if (guestName) participantData.guest_name = guestName

    const { data, error } = await supabase
      .from('playground_participants')
      .upsert(participantData, { 
        onConflict: userId ? 'room_id,user_id' : undefined 
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async leaveRoom(roomId, userId) {
    const { error } = await supabase
      .from('playground_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  async getParticipants(roomId) {
    // 1. Fetch participants
    const { data: participants, error: pError } = await supabase
      .from('playground_participants')
      .select('*')
      .eq('room_id', roomId)
    
    if (pError) throw pError
    if (!participants || participants.length === 0) return []

    // 2. Fetch profiles for user_ids
    const userIds = participants.filter(p => p.user_id).map(p => p.user_id)
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds)
      
      if (profiles) {
        return participants.map(p => ({
          ...p,
          profiles: profiles.find(pr => pr.id === p.user_id)
        }))
      }
    }
    
    return participants
  },

  async setParticipantReady(id, isReady) {
    const { error } = await supabase
      .from('playground_participants')
      .update({ is_ready: isReady })
      .eq('id', id)
    
    if (error) throw error
  },

  async startGame(roomId) {
    const { error } = await supabase
      .from('playground_rooms')
      .update({ status: 'playing' })
      .eq('id', roomId)
    
    if (error) throw error
  },

  async updateRoomMetadata(roomId, patch = {}) {
    const { data: room, error: fetchError } = await supabase
      .from('playground_rooms')
      .select('metadata')
      .eq('id', roomId)
      .single()

    if (fetchError) throw fetchError

    const metadata = {
      ...(room?.metadata || {}),
      ...patch,
    }

    const { data, error } = await supabase
      .from('playground_rooms')
      .update({ metadata })
      .eq('id', roomId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async finishRoom(roomId, patch = {}) {
    const { data: room, error: fetchError } = await supabase
      .from('playground_rooms')
      .select('metadata')
      .eq('id', roomId)
      .single()

    if (fetchError) throw fetchError

    const metadata = {
      ...(room?.metadata || {}),
      ...patch,
      finished_at: patch.finished_at || new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('playground_rooms')
      .update({ status: 'finished', metadata })
      .eq('id', roomId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // ── GAMEPLAY & CONTENT ──

  async generateAIQuestions(gameType, subject, count = 10) {
    const safeCount = Math.max(4, Math.min(Number(count) || 10, 15))
    const prompt = `You are a study game assistant. Generate exactly ${safeCount} high-quality study quiz items for a "${gameType}" game on the subject: "${subject}".
    
    CRITICAL: Output ONLY a valid JSON object. 
    NO markdown bolding (**), NO formatting, NO conversational text.
    
    Format:
    {
      "questions": [
        {"term": "Direct question or concept", "definition": "The correct answer"},
        ...
      ]
    }
    
    Rules:
    1. For clut-live, make terms read like real quiz questions where possible.
    2. definitions must be under 150 characters.
    3. terms must be plain text (no **asterisks**).
    4. ensure valid JSON escaping for quotes.`

    try {
      const response = await callGroqAPI(
        [{ role: 'user', content: prompt }], 
        GROQ_MODELS.SPEEDSTER, 
        { responseFormat: { type: 'json_object' } }
      )
      
      let contentString = response.choices[0].message.content.trim()

      // Extremely robust JSON extraction
      const startIdx = contentString.indexOf('{')
      const endIdx = contentString.lastIndexOf('}')
      if (startIdx !== -1 && endIdx !== -1) {
        contentString = contentString.substring(startIdx, endIdx + 1)
      }

      try {
        const content = JSON.parse(contentString)
        const rawQuestions = content.questions || (Array.isArray(content) ? content : [])
        
        // Sanitize: Strip markdown bolding (**) that LLMs often add
        return rawQuestions.map(q => ({
          term: q.term?.replace(/\*\*/g, '').trim(),
          definition: q.definition?.replace(/\*\*/g, '').trim()
        }))
      } catch (parseErr) {
        // One last attempt: try to fix common JSON issues
        const fixedJson = contentString
          .replace(/,\s*\]/g, ']')
          .replace(/,\s*\}/g, '}')
        
        const content = JSON.parse(fixedJson)
        const rawQuestions = content.questions || (Array.isArray(content) ? content : [])
        
        return rawQuestions.map(q => ({
          term: q.term?.replace(/\*\*/g, '').trim(),
          definition: q.definition?.replace(/\*\*/g, '').trim()
        }))
      }
    } catch (error) {
      console.error("Groq Generation Error:", error)
      return []
    }
  },

  async updateParticipantScore(id, score) {
    const { error } = await supabase
      .from('playground_participants')
      .update({ 
        score,
        last_action_at: new Date().toISOString()
      })
      .eq('id', id)
    
    if (error) throw error
  },

  async saveSession(userId, sessionData) {
    const { data, error } = await supabase
      .from('playground_sessions')
      .insert({
        user_id: userId,
        game_type: sessionData.game_type,
        course_code: sessionData.course_code,
        course_name: sessionData.course_name,
        score: sessionData.score,
        accuracy: sessionData.accuracy,
        total_questions: sessionData.total_questions,
        participants: sessionData.participants,
        game_metadata: sessionData.game_metadata
      })
    
    if (error) throw error
    return data
  },

  // ── REALTIME SUBSCRIPTION HELPERS ──

  subscribeToRoom(roomId, onUpdate) {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'playground_rooms', 
        filter: `id=eq.${roomId}` 
      }, async (payload) => {
        if (payload.new && payload.new.status) {
          onUpdate('room', payload.new)
        } else {
          // Fallback: Fetch full room if payload is incomplete (Replica Identity issues)
          const { data } = await supabase.from('playground_rooms').select('*').eq('id', roomId).single()
          if (data) onUpdate('room', data)
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'playground_participants', 
        filter: `room_id=eq.${roomId}` 
      }, payload => onUpdate('participants', payload))
      .subscribe()

    return channel
  }
}
