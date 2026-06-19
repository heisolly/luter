import { supabase } from '../supabaseClient'
import { callGroqAPI, GROQ_MODELS } from '../groqClient'

export const heistService = {
  supabase,

  /* ── ROOM MANAGEMENT ── */

  async createRoom(userId, { subject = 'General', difficulty = 'medium', maxPlayers = 8 } = {}) {
    const { data, error } = await supabase
      .from('heist_rooms')
      .insert({
        created_by: userId,
        subject,
        difficulty,
        max_players: Math.max(4, Math.min(10, maxPlayers)),
        status: 'waiting',
        integrity: 100,
        current_round: 0,
        settings: { subject, difficulty, maxPlayers }
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as first participant (host is always an agent, role assigned later)
    await this.joinRoom(data.id, userId)
    return data
  },

  async joinRoom(roomId, userId, guestName = null) {
    const participantData = {
      room_id: roomId,
      is_ready: false,
      score: 0,
      questions_answered: 0,
      correct_count: 0,
      sabotage_uses: 2
    }

    if (userId) participantData.user_id = userId
    if (guestName) participantData.guest_name = guestName

    const { data, error } = await supabase
      .from('heist_participants')
      .upsert(participantData, {
        onConflict: userId ? 'room_id,user_id' : undefined
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async joinByCode(roomCode, userId, guestName = null) {
    const { data: room } = await supabase
      .from('heist_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .single()

    if (!room) throw new Error('Room not found')
    if (room.status !== 'waiting') throw new Error('Game already started')

    // Check if room is full by counting actual participants
    const { count } = await supabase
      .from('heist_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)

    if (room.max_players && count >= room.max_players) {
      throw new Error('Room is full')
    }

    const participant = await this.joinRoom(room.id, userId, guestName)
    return { room, participant }
  },

  async leaveRoom(roomId, userId) {
    const { error } = await supabase
      .from('heist_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)

    if (error) throw error
  },

  async getParticipants(roomId) {
    const { data: participants, error: pError } = await supabase
      .from('heist_participants')
      .select('*')
      .eq('room_id', roomId)

    if (pError) throw pError
    if (!participants || participants.length === 0) return []

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

  async setReady(participantId, isReady) {
    const { error } = await supabase
      .from('heist_participants')
      .update({ is_ready: isReady, last_action_at: new Date().toISOString() })
      .eq('id', participantId)

    if (error) throw error
  },

  /* ── GAME START / ROLE ASSIGNMENT ── */

  async startGame(roomId) {
    // 1. Get all participants
    const participants = await this.getParticipants(roomId)
    const count = participants.length

    if (count < 4) throw new Error('Need at least 4 players')

    // 2. Determine number of thieves (1 thief per 4-5 players)
    const thiefCount = Math.max(1, Math.floor(count / 4))
    const shuffled = [...participants].sort(() => Math.random() - 0.5)

    // 3. Assign roles
    for (let i = 0; i < shuffled.length; i++) {
      const role = i < thiefCount ? 'thief' : 'agent'
      await supabase
        .from('heist_participants')
        .update({ role, sabotage_uses: role === 'thief' ? 2 : 0 })
        .eq('id', shuffled[i].id)
    }

    // 4. Update room status
    const { data: room } = await supabase
      .from('heist_rooms')
      .update({
        status: 'playing',
        current_round: 1,
        current_phase: 'task',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single()

    // 5. Create first round
    const { data: round } = await supabase
      .from('heist_rounds')
      .insert({
        room_id: roomId,
        round_number: 1,
        phase: 'task',
        phase_started_at: new Date().toISOString(),
        phase_ends_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes
        integrity_at_start: 100
      })
      .select()
      .single()

    return { room, round }
  },

  /* ── AI QUESTION GENERATION ── */

  async generateQuestions(subject, difficulty, count = 5, playerContext = '') {
    const diffPrompt = {
      easy: 'Make questions straightforward with clear answers.',
      medium: 'Make questions require some thought but not expert knowledge.',
      hard: 'Make questions challenging, requiring deep understanding.'
    }[difficulty] || 'Make questions at an appropriate difficulty level.'

    const contextPrompt = playerContext
      ? `\nPersonalize for this learner: ${playerContext}`
      : ''

    const prompt = `You are a study quiz generator for a social deduction learning game called Knowledge Heist.

Generate exactly ${count} multiple-choice quiz questions on: "${subject}"

${diffPrompt}${contextPrompt}

Requirements:
- Each question should be educational and meaningful
- Provide exactly 4 options per question (1 correct, 3 plausible distractors)
- Include a brief explanation of why the correct answer is right
- Vary question types: definitions, facts, cause-and-effect, application

CRITICAL: Output ONLY valid JSON. No markdown, no extra text.

Format:
{
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    },
    ...
  ]
}`

    try {
      const response = await callGroqAPI(
        [{ role: 'user', content: prompt }],
        GROQ_MODELS.SPEEDSTER,
        { responseFormat: { type: 'json_object' } }
      )

      let raw = response.choices[0].message.content.trim()
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start !== -1 && end !== -1) raw = raw.substring(start, end + 1)

      const parsed = JSON.parse(raw)
      const qs = parsed.questions || []

      return qs.map((q, i) => ({
        id: `q_${i}`,
        question: (q.question || '').replace(/\*\*/g, '').trim(),
        options: (q.options || []).map(o => String(o).replace(/\*\*/g, '').trim()),
        correctIndex: Number(q.correctIndex) || 0,
        explanation: (q.explanation || '').replace(/\*\*/g, '').trim()
      })).filter(q => q.question && q.options.length >= 2)
    } catch (err) {
      console.error('[heistService] generateQuestions error:', err)
      return this.getFallbackQuestions(subject, count)
    }
  },

  getFallbackQuestions(subject, count = 5) {
    const fallbacks = [
      {
        question: `What is the primary focus of ${subject}?`,
        options: ['Understanding core concepts', 'Memorizing random facts', 'Skipping difficult topics', 'Copying from others'],
        correctIndex: 0,
        explanation: 'Learning focuses on understanding core concepts first.'
      },
      {
        question: `Which study method works best for ${subject}?`,
        options: ['Active recall and practice', 'Cramming the night before', 'Highlighting everything', 'Reading once and hoping'],
        correctIndex: 0,
        explanation: 'Active recall and spaced repetition are proven effective.'
      },
      {
        question: `When stuck on a ${subject} problem, what should you do?`,
        options: ['Break it into smaller parts', 'Give up immediately', 'Guess randomly', 'Avoid the topic forever'],
        correctIndex: 0,
        explanation: 'Breaking problems down helps understanding.'
      },
      {
        question: `How do you know you truly understand ${subject}?`,
        options: ['You can explain it simply', 'You memorized definitions', 'You read it once', 'You copied notes'],
        correctIndex: 0,
        explanation: 'True understanding means you can explain concepts simply.'
      },
      {
        question: `What is "metacognition" in learning?`,
        options: ['Thinking about your thinking', 'Memorizing formulas', 'Copying homework', 'Sleeping in class'],
        correctIndex: 0,
        explanation: 'Metacognition is awareness and understanding of your own thought processes.'
      }
    ]
    return fallbacks.slice(0, count)
  },

  /* ── ROUND / PHASE MANAGEMENT ── */

  async advancePhase(roomId, roundId, nextPhase, integrity) {
    const now = new Date()
    let duration = 0

    switch (nextPhase) {
      case 'task': duration = 2 * 60; break
      case 'discussion': duration = 90; break
      case 'voting': duration = 30; break
      default: duration = 0
    }

    const { data: round } = await supabase
      .from('heist_rounds')
      .update({
        phase: nextPhase,
        phase_started_at: now.toISOString(),
        phase_ends_at: duration > 0 ? new Date(now.getTime() + duration * 1000).toISOString() : null,
        ended_at: nextPhase === 'ended' ? now.toISOString() : null
      })
      .eq('id', roundId)
      .select()
      .single()

    await supabase
      .from('heist_rooms')
      .update({
        current_phase: nextPhase,
        integrity: Math.max(0, Math.min(100, integrity)),
        updated_at: now.toISOString()
      })
      .eq('id', roomId)

    // Reset is_ready for all participants for the next phase
    await supabase
      .from('heist_participants')
      .update({ is_ready: false })
      .eq('room_id', roomId)

    return round
  },

  async createNextRound(roomId, roundNumber, integrity) {
    const { data: round } = await supabase
      .from('heist_rounds')
      .insert({
        room_id: roomId,
        round_number: roundNumber,
        phase: 'task',
        phase_started_at: new Date().toISOString(),
        phase_ends_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        integrity_at_start: integrity
      })
      .select()
      .single()

    await supabase
      .from('heist_rooms')
      .update({
        current_round: roundNumber,
        current_phase: 'task',
        integrity,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)

    // Reset votes and is_ready for all participants
    await supabase
      .from('heist_participants')
      .update({ has_voted_this_round: false, is_ready: false })
      .eq('room_id', roomId)

    return round
  },

  async eliminatePlayer(participantId) {
    await supabase
      .from('heist_participants')
      .update({ is_alive: false })
      .eq('id', participantId)
  },

  async endGame(roomId, winner) {
    const { data: room } = await supabase
      .from('heist_rooms')
      .update({
        status: 'finished',
        winner,
        current_phase: 'ended',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single()

    return room
  },

  /* ── VOTING ── */

  async castVote(roundId, voterId, targetId) {
    const { error } = await supabase
      .from('heist_votes')
      .upsert({
        round_id: roundId,
        voter_id: voterId,
        target_id: targetId
      }, { onConflict: 'round_id,voter_id' })

    if (error) throw error

    await supabase
      .from('heist_participants')
      .update({ has_voted_this_round: true })
      .eq('id', voterId)
  },

  async getVotes(roundId) {
    const { data, error } = await supabase
      .from('heist_votes')
      .select('*')
      .eq('round_id', roundId)

    if (error) throw error
    return data || []
  },

  /* ── CHAT ── */

  async sendChat(roomId, participantId, message, isSystem = false) {
    const { error } = await supabase
      .from('heist_chat')
      .insert({
        room_id: roomId,
        participant_id: participantId,
        message,
        is_system: isSystem
      })

    if (error) throw error
  },

  async getChat(roomId, limit = 100) {
    const { data, error } = await supabase
      .from('heist_chat')
      .select('*, heist_participants(user_id, guest_name, profiles(full_name))')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  /* ── ANSWERS / EVIDENCE ── */

  async recordAnswer(roundId, participantId, question, correctAnswer, playerAnswer, isCorrect, timeSpentMs, isSabotaged = false) {
    const { error } = await supabase
      .from('heist_answers')
      .insert({
        round_id: roundId,
        participant_id: participantId,
        question,
        correct_answer: correctAnswer,
        player_answer: playerAnswer,
        is_correct: isCorrect,
        is_sabotaged: isSabotaged,
        time_spent_ms: timeSpentMs
      })

    if (error) throw error
  },

  async getRoundAnswers(roundId) {
    const { data, error } = await supabase
      .from('heist_answers')
      .select('*, heist_participants(user_id, guest_name, role, is_alive)')
      .eq('round_id', roundId)

    if (error) throw error
    return data || []
  },

  async sabotagePlayer(roomId, targetId, thiefId) {
    // 1. Get current room metadata
    const { data: room, error: rErr } = await supabase
      .from('heist_rooms')
      .select('metadata')
      .eq('id', roomId)
      .single()

    if (rErr) throw rErr

    const metadata = room.metadata || {}
    const sabotaged = metadata.sabotaged_players || {}
    sabotaged[targetId] = true
    metadata.sabotaged_players = sabotaged

    // 2. Update room metadata
    const { error: uErr } = await supabase
      .from('heist_rooms')
      .update({ metadata })
      .eq('id', roomId)

    if (uErr) throw uErr

    // 3. Decrement thief's sabotage uses
    const { data: thief, error: tErr } = await supabase
      .from('heist_participants')
      .select('sabotage_uses')
      .eq('id', thiefId)
      .single()

    if (tErr) throw tErr

    const { error: sErr } = await supabase
      .from('heist_participants')
      .update({ sabotage_uses: Math.max(0, (thief?.sabotage_uses || 2) - 1) })
      .eq('id', thiefId)

    if (sErr) throw sErr
  },

  async clearSabotage(roomId, targetId) {
    const { data: room, error: rErr } = await supabase
      .from('heist_rooms')
      .select('metadata')
      .eq('id', roomId)
      .single()

    if (rErr) throw rErr

    const metadata = room.metadata || {}
    if (metadata.sabotaged_players) {
      delete metadata.sabotaged_players[targetId]
      const { error: uErr } = await supabase
        .from('heist_rooms')
        .update({ metadata })
        .eq('id', roomId)

      if (uErr) throw uErr
    }
  },

  async updateParticipantStats(participantId, { scoreDelta = 0, questionsDelta = 0, correctDelta = 0 }) {
    const { data: p } = await supabase
      .from('heist_participants')
      .select('score, questions_answered, correct_count')
      .eq('id', participantId)
      .single()

    if (!p) return

    await supabase
      .from('heist_participants')
      .update({
        score: (p.score || 0) + scoreDelta,
        questions_answered: (p.questions_answered || 0) + questionsDelta,
        correct_count: (p.correct_count || 0) + correctDelta,
        last_action_at: new Date().toISOString()
      })
      .eq('id', participantId)
  },

  /* ── POST-GAME SESSION REPORT ── */

  async saveSession(userId, roomId, {
    subject,
    difficulty,
    role,
    result,
    questionsAttempted,
    correctAnswers,
    accuracy,
    topicsPracticed,
    strengthAreas,
    weakAreas,
    recommendations,
    awards,
    metadata
  }) {
    const { data, error } = await supabase
      .from('heist_sessions')
      .insert({
        room_id: roomId,
        user_id: userId,
        subject,
        difficulty,
        role,
        result,
        questions_attempted: questionsAttempted,
        correct_answers: correctAnswers,
        accuracy,
        topics_practiced: topicsPracticed || [],
        strength_areas: strengthAreas || [],
        weak_areas: weakAreas || [],
        learning_recommendations: recommendations || [],
        awards: awards || [],
        session_metadata: metadata || {}
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async generateReport(roomId, userId) {
    // Fetch all answers for this user in this room
    const { data: answers } = await supabase
      .from('heist_answers')
      .select('*, heist_participants!inner(user_id), heist_rounds!inner(room_id)')
      .eq('heist_participants.user_id', userId)
      .eq('heist_rounds.room_id', roomId)

    const { data: participant } = await supabase
      .from('heist_participants')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single()

    const { data: room } = await supabase
      .from('heist_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (!answers || !participant || !room) return null

    const correct = answers.filter(a => a.is_correct).length
    const total = answers.length
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    const topics = [...new Set(answers.map(a => {
      // Extract topic from question roughly
      const q = a.question.toLowerCase()
      if (q.includes('history')) return 'History'
      if (q.includes('math') || q.includes('equation')) return 'Mathematics'
      if (q.includes('science') || q.includes('biology') || q.includes('chemistry')) return 'Science'
      return room.subject
    }))]

    const wrongAnswers = answers.filter(a => !a.is_correct)
    const strengths = topics.slice(0, 2)
    const weaknesses = wrongAnswers.length > 0
      ? [`Review: ${room.subject} fundamentals`, 'Practice more active recall']
      : []

    // Determine awards
    const awards = []
    if (accuracy >= 80) awards.push({ type: 'accuracy', label: 'Sharp Mind' })
    if (participant.role === 'agent' && room.winner === 'agents') awards.push({ type: 'team', label: 'Guardian of Knowledge' })
    if (participant.role === 'thief' && room.winner === 'thieves') awards.push({ type: 'deception', label: 'Master Thief' })

    return {
      questionsAttempted: total,
      correctAnswers: correct,
      accuracy,
      topicsPracticed: topics,
      strengthAreas: strengths,
      weakAreas: weaknesses,
      recommendations: weaknesses,
      awards,
      role: participant.role,
      result: room.winner === (participant.role === 'agent' ? 'agents' : 'thieves') ? 'won' : 'lost'
    }
  },

  /* ── REALTIME SUBSCRIPTION ── */

  subscribeToRoom(roomId, onUpdate) {
    const channel = supabase
      .channel(`heist-room:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'heist_rooms',
        filter: `id=eq.${roomId}`
      }, async (payload) => {
        onUpdate('room', payload.new)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'heist_participants',
        filter: `room_id=eq.${roomId}`
      }, payload => onUpdate('participants', payload))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'heist_rounds',
        filter: `room_id=eq.${roomId}`
      }, payload => onUpdate('rounds', payload))
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'heist_votes'
      }, payload => onUpdate('votes', payload))
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'heist_chat',
        filter: `room_id=eq.${roomId}`
      }, payload => onUpdate('chat', payload))
      .subscribe()

    return channel
  },

  /* ── UTILITY ── */

  async getRoomByCode(code) {
    const { data, error } = await supabase
      .from('heist_rooms')
      .select('*')
      .eq('room_code', code.toUpperCase())
      .single()

    if (error) throw error
    return data
  },

  async getRoom(roomId) {
    const { data, error } = await supabase
      .from('heist_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (error) throw error
    return data
  },

  async getCurrentRound(roomId) {
    const { data, error } = await supabase
      .from('heist_rounds')
      .select('*')
      .eq('room_id', roomId)
      .order('round_number', { ascending: false })
      .limit(1)
      .single()

    if (error) return null
    return data
  }
}