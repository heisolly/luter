// Battle Server - Real-time Battle System
// This server handles the real-time battle mechanics using Socket.io

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const { Resend } = require('resend')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
})

// Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'gsk_your_api_key_here'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

// In-memory battle storage (in production, use Redis)
const battles = new Map()
const matchmakingPool = new Map()
const socketToUser = new Map()
const userToSocket = new Map()
const questionCache = new Map()

// Helper functions
const generateSessionId = () => {
  return `luter_${Math.random().toString(36).substr(2, 9)}`
}

// Resend Email Marketing Configuration
const resend = new Resend(process.env.RESEND_API_KEY || 're_GW9dW4Z8_9cWNFutxozVHGJ4nJWn8Ycat')

app.post('/api/send-campaign', async (req, res) => {
  try {
    const { subject, html, emails } = req.body

    if (!subject || !html || !emails || !Array.isArray(emails)) {
      return res.status(400).json({ error: 'Missing required fields: subject, html, or emails array' })
    }

    if (emails.length === 0) {
      return res.status(400).json({ error: 'No recipients provided' })
    }

    console.log(`Preparing to send campaign "${subject}" to ${emails.length} users...`)

    // Resend batch sending (max 100 per batch recommended, but SDK handles arrays up to 50 for free tier usually. 
    // We will chunk it into arrays of 50).
    const chunkSize = 50
    const chunks = []
    
    // Filter out null/undefined emails
    const validEmails = emails.filter(e => e && typeof e === 'string' && e.includes('@'))

    for (let i = 0; i < validEmails.length; i += chunkSize) {
      chunks.push(validEmails.slice(i, i + chunkSize))
    }

    let successCount = 0
    let failCount = 0

    for (const chunk of chunks) {
      // Create batch payload for Resend
      const payload = chunk.map(email => ({
        from: 'Luter <updates@luter.app>', // Note: This needs to be a verified domain in Resend
        to: [email],
        subject: subject,
        html: html
      }))

      try {
        const response = await resend.batch.send(payload)
        successCount += chunk.length
        console.log(`Successfully sent batch of ${chunk.length}. Total sent: ${successCount}`)
      } catch (batchErr) {
        console.error('Batch send failed:', batchErr)
        failCount += chunk.length
      }
    }

    res.json({ success: true, message: `Campaign dispatched. Sent: ${successCount}, Failed: ${failCount}` })
  } catch (error) {
    console.error('Error sending campaign:', error)
    res.status(500).json({ error: 'Internal server error while sending campaign' })
  }
})

// AI Question Generation using Groq
async function generateAIQuestions(subject, difficulty, count = 10) {
  try {
    console.log(`Generating ${count} AI questions for ${subject} (${difficulty})`)
    
    const promptTemplate = (count, subject, difficulty) => `Generate challenging multiple-choice questions for a real-time academic battle. These questions should be solvable within 15-30 seconds and test quick thinking.

Requirements:
- Generate exactly ${count} questions
- Each question must have 4 options (A, B, C, D)
- Only one correct answer per question
- Questions should be balanced in difficulty (mix of easy, medium, hard)
- Include time limits per question (10-30 seconds based on complexity)
- Focus on core concepts that can be answered quickly
- Use Nigerian academic context where appropriate

Subject: ${subject}
Difficulty: ${difficulty}
Question Count: ${count}

Return ONLY a JSON array with this exact structure:
[{
  "id": "q_1",
  "question": "question text here",
  "type": "multiple",
  "options": ["option A", "option B", "option C", "option D"],
  "correct_answer": 0,
  "explanation": "brief explanation",
  "difficulty": "easy|medium|hard",
  "time_limit_seconds": 15,
  "subject": "${subject}",
  "topic": "specific topic"
}]`

    const prompt = promptTemplate(count, subject, difficulty)

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are an expert academic question generator for Nigerian university students. Generate high-quality, challenging questions that test understanding and quick thinking.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const questions = JSON.parse(jsonMatch[0])
    
    // Validate and format questions
    return questions.map((q, index) => ({
      id: q.id || `q_${index + 1}`,
      question: q.question,
      type: q.type || 'multiple',
      options: q.options || [],
      correct_answer: q.correct_answer || 0,
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      time_limit_seconds: q.time_limit_seconds || 15,
      subject: q.subject || subject,
      topic: q.topic || 'General'
    }))
  } catch (error) {
    console.error('Error generating AI questions:', error)
    return getFallbackQuestions(subject, difficulty, count)
  }
}

// Fallback questions if AI fails
function getFallbackQuestions(subject, difficulty, count = 10) {
  console.log('Using fallback questions for', subject)
  
  const fallbackQuestions = [
    {
      id: 'fallback_1',
      question: `What is the primary function of ${subject}?`,
      type: 'multiple',
      options: [
        'To analyze and solve problems systematically',
        'To memorize facts without understanding',
        'To skip difficult topics completely',
        'To avoid studying altogether'
      ],
      correct_answer: 0,
      explanation: 'The primary function is to analyze and solve problems systematically.',
      difficulty: 'easy',
      time_limit_seconds: 15,
      subject,
      topic: 'Fundamentals'
    },
    {
      id: 'fallback_2',
      question: `Which study method is most effective for ${subject}?`,
      type: 'multiple',
      options: [
        'Last-minute cramming all night',
        'Consistent daily practice and review',
        'Only reading without exercises',
        'Studying without any breaks'
      ],
      correct_answer: 1,
      explanation: 'Consistent daily practice and regular review is the most effective approach.',
      difficulty: 'medium',
      time_limit_seconds: 20,
      subject,
      topic: 'Study Methods'
    },
    {
      id: 'fallback_3',
      question: `When facing a complex problem in ${subject}, the best approach is to:`,
      type: 'multiple',
      options: [
        'Give up immediately and move on',
        'Break it down into smaller, manageable parts',
        'Guess randomly without thinking',
        'Skip it and hope it\'s not on the exam'
      ],
      correct_answer: 1,
      explanation: 'Breaking complex problems into smaller parts makes them more manageable and solvable.',
      difficulty: 'easy',
      time_limit_seconds: 15,
      subject,
      topic: 'Problem Solving'
    },
    {
      id: 'fallback_4',
      question: `What is the most important skill to master in ${subject}?`,
      type: 'multiple',
      options: [
        'Memorizing everything without understanding',
        'Critical thinking and problem-solving',
        'Writing fast without accuracy',
        'Avoiding challenging topics'
      ],
      correct_answer: 1,
      explanation: 'Critical thinking and problem-solving are essential skills for mastering any academic subject.',
      difficulty: 'medium',
      time_limit_seconds: 20,
      subject,
      topic: 'Skills'
    },
    {
      id: 'fallback_5',
      question: `How should you prepare for exams in ${subject}?`,
      type: 'multiple',
      options: [
        'Start studying one hour before the exam',
        'Create a study schedule and stick to it',
        'Only review the day before',
        'Hope for the best without preparation'
      ],
      correct_answer: 1,
      explanation: 'Creating and following a consistent study schedule is the key to exam success.',
      difficulty: 'easy',
      time_limit_seconds: 15,
      subject,
      topic: 'Exam Preparation'
    }
  ]

  // Generate enough questions
  const result = []
  for (let i = 0; i < count; i++) {
    const baseQuestion = fallbackQuestions[i % fallbackQuestions.length]
    result.push({
      ...baseQuestion,
      id: `fallback_${i + 1}`,
      question: i >= fallbackQuestions.length 
        ? `${baseQuestion.question} (Advanced Practice ${i + 1})`
        : baseQuestion.question
    })
  }

  return result
}

// AI Performance Analysis
async function analyzePerformance(battleData) {
  try {
    const { score, totalQuestions, timeTaken, subject, missedQuestions } = battleData
    const accuracy = Math.round((score / totalQuestions) * 100)
    
    const promptTemplate = (score, totalQuestions, timeTaken, subject, missedQuestions, accuracy) => `Analyze this battle performance and provide comprehensive insights for improvement.

Student Performance:
- Score: ${score}/${totalQuestions} (${accuracy}%)
- Time taken: ${timeTaken} seconds
- Subject: ${subject}
- Questions missed: ${JSON.stringify(missedQuestions)}

Provide:
1. **Strengths**: What the student knows well
2. **Weaknesses**: Specific topics to review
3. **Study Recommendations**: 3-4 actionable study tips
4. **Exam Readiness**: Percentage readiness for actual exams (0-100%)
5. **Next Steps**: What to focus on next

Return as JSON: {"strengths": [...], "weaknesses": [...], "recommendations": [...], "examReadiness": 85, "nextSteps": "..."}`

    const prompt = promptTemplate(score, totalQuestions, timeTaken, subject, missedQuestions, accuracy)

    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert academic advisor providing personalized learning recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    
    return getFallbackAnalysis(battleData)
  } catch (error) {
    console.error('Error analyzing performance:', error)
    return getFallbackAnalysis(battleData)
  }
}

function getFallbackAnalysis(battleData) {
  const { score, totalQuestions } = battleData
  const accuracy = Math.round((score / totalQuestions) * 100)
  
  return {
    strengths: accuracy >= 70 ? ['Good performance', 'Solid understanding'] : ['Participation'],
    weaknesses: accuracy < 70 ? ['Needs more practice', 'Review fundamentals'] : ['Minor improvements needed'],
    recommendations: [
      'Practice consistently',
      'Review incorrect answers',
      'Focus on weak areas',
      'Manage time effectively'
    ],
    examReadiness: Math.min(95, accuracy + 10),
    nextSteps: accuracy >= 80 ? 'Challenge harder topics' : 'Strengthen fundamentals'
  }
}

const calculateLuterGrade = (accuracy) => {
  if (accuracy >= 90) return 'A+'
  if (accuracy >= 80) return 'A'
  if (accuracy >= 70) return 'B'
  if (accuracy >= 60) return 'C'
  return 'D'
}

const calculateExamReadiness = (accuracy, subject) => {
  const baseReadiness = accuracy
  const subjectMultiplier = {
    'Mathematics': 1.1,
    'Chemistry': 1.05,
    'Physics': 1.08,
    'Biology': 1.02,
    'English': 0.95
  }
  
  const multiplier = subjectMultiplier[subject] || 1.0
  return Math.min(100, Math.round(baseReadiness * multiplier))
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)
  
  // Extract user info from query
  const { userId, sessionId } = socket.handshake.query
  
  if (userId) {
    socketToUser.set(socket.id, userId)
    userToSocket.set(userId, socket.id)
  }
  
  // Join existing battle
  socket.on('join_battle', (data) => {
    const { sessionId: battleSessionId, userId } = data
    
    let battle = battles.get(battleSessionId)
    
    if (!battle) {
      // Create new battle if it doesn't exist
      battle = {
        id: battleSessionId,
        sessionId: battleSessionId,
        players: {},
        questions: [],
        status: 'waiting',
        createdAt: new Date(),
        subject: 'General',
        difficulty: 'medium'
      }
      battles.set(battleSessionId, battle)
    }
    
    // Add player to battle
    if (!battle.players[userId]) {
      battle.players[userId] = {
        id: userId,
        score: 0,
        currentQuestion: 0,
        finished: false,
        socketId: socket.id,
        isReady: false,
        answers: {},
        joinedAt: new Date()
      }
    } else {
      // Reconnecting player
      battle.players[userId].socketId = socket.id
      battle.players[userId].disconnected = false
    }
    
    // Join socket room
    socket.join(battleSessionId)
    
    // Find opponent
    const opponentId = Object.keys(battle.players).find(id => id !== userId)
    const opponent = opponentId ? battle.players[opponentId] : null
    
    // Send battle data to user
    socket.emit('battle_joined', {
      battle: {
        id: battle.id,
        sessionId: battle.sessionId,
        status: battle.status,
        playerCount: Object.keys(battle.players).length
      },
      opponent: opponent ? {
        id: opponent.id,
        name: `Player ${opponent.id.slice(-4)}`,
        isReady: opponent.isReady
      } : null
    })
    
    // Notify opponent
    if (opponent) {
      const opponentSocket = io.sockets.sockets.get(opponent.socketId)
      if (opponentSocket) {
        opponentSocket.emit('opponent_joined', {
          opponent: {
            id: userId,
            name: `Player ${userId.slice(-4)}`,
            isReady: battle.players[userId].isReady
          }
        })
      }
    }
    
    console.log(`User ${userId} joined battle ${battleSessionId}`)
  })
  
  // Player ready
  socket.on('player_ready', (data) => {
    const { sessionId: battleSessionId, userId } = data
    
    const battle = battles.get(battleSessionId)
    if (!battle) return
    
    const player = battle.players[userId]
    if (!player) return
    
    player.isReady = true
    
    // Check if all players are ready
    const players = Object.values(battle.players)
    const allReady = players.length >= 2 && players.every(p => p.isReady)
    
    if (allReady && battle.status === 'waiting') {
      // Start countdown
      battle.status = 'countdown'
      io.to(battleSessionId).emit('start_countdown', { seconds: 5 })
      
      // Start battle after countdown
      setTimeout(() => {
        startBattle(battleSessionId)
      }, 5000)
    }
    
    // Update opponent about readiness
    const opponentId = Object.keys(battle.players).find(id => id !== userId)
    if (opponentId) {
      const opponent = battle.players[opponentId]
      const opponentSocket = io.sockets.sockets.get(opponent.socketId)
      if (opponentSocket) {
        opponentSocket.emit('opponent_ready', { userId })
      }
    }
  })
  
  // Submit answer
  socket.on('submit_answer', (data) => {
    const { sessionId: battleSessionId, userId, questionIndex, answer, isCorrect } = data
    
    const battle = battles.get(battleSessionId)
    if (!battle) return
    
    const player = battle.players[userId]
    if (!player) return
    
    // Store answer
    player.answers[questionIndex] = answer
    player.currentQuestion = questionIndex + 1
    
    if (isCorrect) {
      player.score += 1
    }
    
    // Notify opponent about progress
    const opponentId = Object.keys(battle.players).find(id => id !== userId)
    if (opponentId) {
      const opponent = battle.players[opponentId]
      const opponentSocket = io.sockets.sockets.get(opponent.socketId)
      if (opponentSocket) {
        opponentSocket.emit('opponent_progress', {
          currentQuestion: player.currentQuestion
        })
      }
    }
    
    console.log(`User ${userId} answered question ${questionIndex}: ${isCorrect ? 'Correct' : 'Wrong'}`)
  })
  
  // Finish battle
  socket.on('finish_battle', (data) => {
    const { sessionId: battleSessionId, userId, finalScore } = data
    
    const battle = battles.get(battleSessionId)
    if (!battle) return
    
    const player = battle.players[userId]
    if (!player) return
    
    player.finished = true
    player.finalScore = finalScore
    player.finishedAt = new Date()
    
    // Notify opponent
    const opponentId = Object.keys(battle.players).find(id => id !== userId)
    if (opponentId) {
      const opponent = battle.players[opponentId]
      const opponentSocket = io.sockets.sockets.get(opponent.socketId)
      if (opponentSocket) {
        opponentSocket.emit('opponent_finished', {
          score: finalScore
        })
      }
    }
    
    // Check if all players finished
    const players = Object.values(battle.players)
    const allFinished = players.every(p => p.finished)
    
    if (allFinished) {
      endBattle(battleSessionId)
    }
  })
  
  // Join matchmaking pool
  socket.on('join_matchmaking', (data) => {
    const { userId, subject, difficulty, battleType } = data
    
    // Remove from existing pool
    for (const [key, value] of matchmakingPool.entries()) {
      if (value.userId === userId) {
        matchmakingPool.delete(key)
        break
      }
    }
    
    // Add to pool
    const poolEntry = {
      userId,
      socketId: socket.id,
      subject,
      difficulty: difficulty || 'medium',
      battleType: battleType || 'duel',
      joinedAt: new Date()
    }
    
    matchmakingPool.set(userId, poolEntry)
    
    // Try to find match
    findMatch(userId, subject, difficulty, battleType)
  })
  
  // Leave matchmaking
  socket.on('leave_matchmaking', (data) => {
    const { userId } = data
    matchmakingPool.delete(userId)
  })
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
    
    const userId = socketToUser.get(socket.id)
    if (userId) {
      socketToUser.delete(socket.id)
      userToSocket.delete(userId)
      
      // Mark as disconnected in battles
      for (const [battleSessionId, battle] of battles.entries()) {
        const player = battle.players[userId]
        if (player) {
          player.disconnected = true
          player.disconnectedAt = new Date()
          
          // Notify opponent
          const opponentId = Object.keys(battle.players).find(id => id !== userId)
          if (opponentId) {
            const opponent = battle.players[opponentId]
            const opponentSocket = io.sockets.sockets.get(opponent.socketId)
            if (opponentSocket) {
              opponentSocket.emit('opponent_disconnected', { userId })
            }
          }
        }
      }
      
      // Remove from matchmaking
      matchmakingPool.delete(userId)
    }
  })
})

// Helper functions
function findMatch(userId, subject, difficulty, battleType) {
  const userEntry = matchmakingPool.get(userId)
  if (!userEntry) return
  
  // Find matching opponent
  for (const [opponentId, opponentEntry] of matchmakingPool.entries()) {
    if (opponentId === userId) continue
    
    // Check compatibility
    if (opponentEntry.subject === subject && 
        opponentEntry.difficulty === difficulty && 
        opponentEntry.battleType === battleType) {
      
      // Create battle session
      const sessionId = generateSessionId()
      const questions = generateQuestions(subject, difficulty)
      
      const battle = {
        id: sessionId,
        sessionId,
        players: {},
        questions: questions.map(q => ({
          ...q,
          correctAnswer: undefined // Don't send correct answers to clients
        })),
        status: 'waiting',
        createdAt: new Date(),
        subject,
        difficulty,
        timeLimit: 600 // 10 minutes
      }
      
      // Add players
      battle.players[userId] = {
        id: userId,
        score: 0,
        currentQuestion: 0,
        finished: false,
        socketId: userEntry.socketId,
        isReady: false,
        answers: {},
        joinedAt: new Date()
      }
      
      battle.players[opponentId] = {
        id: opponentId,
        score: 0,
        currentQuestion: 0,
        finished: false,
        socketId: opponentEntry.socketId,
        isReady: false,
        answers: {},
        joinedAt: new Date()
      }
      
      battles.set(sessionId, battle)
      
      // Remove both from pool
      matchmakingPool.delete(userId)
      matchmakingPool.delete(opponentId)
      
      // Notify both players
      const userSocket = io.sockets.sockets.get(userEntry.socketId)
      const opponentSocket = io.sockets.sockets.get(opponentEntry.socketId)
      
      if (userSocket) {
        userSocket.join(sessionId)
        userSocket.emit('match_found', { sessionId, opponent: { id: opponentId } })
      }
      
      if (opponentSocket) {
        opponentSocket.join(sessionId)
        opponentSocket.emit('match_found', { sessionId, opponent: { id: userId } })
      }
      
      console.log(`Match found: ${userId} vs ${opponentId} in session ${sessionId}`)
      return
    }
  }
}

function startBattle(sessionId) {
  const battle = battles.get(sessionId)
  if (!battle) return
  
  battle.status = 'active'
  battle.startedAt = new Date()
  
  // Generate AI questions
  generateAIQuestions(battle.subject, battle.difficulty, battle.questionCount || 10)
    .then(questions => {
      battle.questions = questions
      
      // Send questions to all players (without correct answers)
      const clientQuestions = questions.map(q => ({
        ...q,
        correct_answer: undefined // Don't send correct answers to clients
      }))
      
      io.to(sessionId).emit('start_battle', {
        questions: clientQuestions,
        timeLimit: battle.timeLimit || 600
      })
      
      console.log(`AI Battle started: ${sessionId} with ${questions.length} questions`)
    })
    .catch(error => {
      console.error('Error starting AI battle:', error)
      // Use fallback questions
      const fallbackQuestions = getFallbackQuestions(battle.subject, battle.difficulty, battle.questionCount || 10)
      battle.questions = fallbackQuestions
      
      const clientQuestions = fallbackQuestions.map(q => ({
        ...q,
        correct_answer: undefined
      }))
      
      io.to(sessionId).emit('start_battle', {
        questions: clientQuestions,
        timeLimit: battle.timeLimit || 600
      })
    })
}

function endBattle(sessionId) {
  const battle = battles.get(sessionId)
  if (!battle) return
  
  battle.status = 'finished'
  battle.finishedAt = new Date()
  
  // Calculate results
  const players = Object.values(battle.players)
  const sortedPlayers = players.sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]
  
  // Calculate results and generate AI analysis
  const results = []
  
  Promise.all(
    players.map(async (player) => {
      const accuracy = Math.round((player.score / battle.questions.length) * 100)
      const missedQuestions = battle.questions
        .filter((q, index) => player.answers[index] !== q.correct_answer)
        .map(q => q.question)
      
      // Get AI performance analysis
      const aiAnalysis = await analyzePerformance({
        score: player.score,
        totalQuestions: battle.questions.length,
        timeTaken: player.finishedAt ? (player.finishedAt - battle.startedAt) / 1000 : 0,
        subject: battle.subject,
        missedQuestions
      })
      
      return {
        userId: player.id,
        score: player.score,
        accuracy,
        luterGrade: calculateLuterGrade(accuracy),
        examReadiness: aiAnalysis.examReadiness || calculateExamReadiness(accuracy, battle.subject),
        rank: sortedPlayers.findIndex(p => p.id === player.id) + 1,
        aiAnalysis
      }
    })
  ).then(playerResults => {
    const battleResults = {
      winnerId: winner.id,
      results: playerResults,
      battle: {
        sessionId: battle.sessionId,
        subject: battle.subject,
        difficulty: battle.difficulty,
        duration: battle.finishedAt - battle.startedAt,
        questionCount: battle.questions.length,
        aiGenerated: true
      }
    }
    
    io.to(sessionId).emit('battle_finished', battleResults)
    
    console.log(`AI Battle finished: ${sessionId}, Winner: ${winner.id}`)
    
    // Cleanup after delay
    setTimeout(() => {
      battles.delete(sessionId)
    }, 60000) // Keep for 1 minute for post-battle review
  })
}

// Cleanup expired battles and matchmaking entries
setInterval(() => {
  const now = new Date()
  
  // Clean up expired battles
  for (const [sessionId, battle] of battles.entries()) {
    if (battle.status === 'waiting' && (now - battle.createdAt) > 10 * 60 * 1000) {
      battles.delete(sessionId)
      console.log(`Cleaned up expired battle: ${sessionId}`)
    }
  }
  
  // Clean up expired matchmaking entries
  for (const [userId, entry] of matchmakingPool.entries()) {
    if ((now - entry.joinedAt) > 2 * 60 * 1000) {
      matchmakingPool.delete(userId)
      console.log(`Cleaned up expired matchmaking entry: ${userId}`)
    }
  }
}, 30000) // Run every 30 seconds

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    activeBattles: battles.size,
    matchmakingPool: matchmakingPool.size,
    connectedUsers: socketToUser.size
  })
})

// Start server
const PORT = process.env.BATTLE_SERVER_PORT || 3001
server.listen(PORT, () => {
  console.log(`Battle server running on port ${PORT}`)
})
