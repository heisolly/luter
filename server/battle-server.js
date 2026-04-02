// Battle Server - Real-time Battle System
// This server handles the real-time battle mechanics using Socket.io

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://your-domain.com'] 
      : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
})

// In-memory battle storage (in production, use Redis)
const battles = new Map()
const matchmakingPool = new Map()
const socketToUser = new Map()
const userToSocket = new Map()

// Helper functions
const generateSessionId = () => {
  return `luter_${Math.random().toString(36).substr(2, 9)}`
}

const generateQuestions = (subject, difficulty, count = 10) => {
  // Mock questions - in production, fetch from database or AI
  const questions = [
    {
      id: 1,
      question: "What is the capital of Nigeria?",
      options: ["Lagos", "Abuja", "Kano", "Ibadan"],
      correctAnswer: 1,
      type: "multiple",
      timeLimit: 15
    },
    {
      id: 2,
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1,
      type: "multiple",
      timeLimit: 10
    },
    {
      id: 3,
      question: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Venus"],
      correctAnswer: 1,
      type: "multiple",
      timeLimit: 12
    },
    {
      id: 4,
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: 2,
      type: "multiple",
      timeLimit: 10
    },
    {
      id: 5,
      question: "Who painted the Mona Lisa?",
      options: ["Van Gogh", "Da Vinci", "Picasso", "Monet"],
      correctAnswer: 1,
      type: "multiple",
      timeLimit: 15
    }
  ]
  
  // Shuffle and select requested number of questions
  const shuffled = questions.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, questions.length))
}

const calculateLuterGrade = (accuracy) => {
  if (accuracy >= 90) return 'A+'
  if (accuracy >= 80) return 'A'
  if (accuracy >= 70) return 'B'
  if (accuracy >= 60) return 'C'
  return 'D'
}

const calculateExamReadiness = (accuracy, subject) => {
  // Subject-specific readiness calculation
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
  
  // Send questions to all players
  const questions = generateQuestions(battle.subject, battle.difficulty, battle.questionCount || 10)
  battle.questions = questions
  
  io.to(sessionId).emit('start_battle', {
    questions: questions.map(q => ({
      ...q,
      correctAnswer: undefined // Don't send correct answers
    })),
    timeLimit: battle.timeLimit
  })
  
  console.log(`Battle started: ${sessionId}`)
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
  
  // Calculate grades and readiness
  const results = players.map(player => {
    const accuracy = Math.round((player.score / battle.questions.length) * 100)
    return {
      userId: player.id,
      score: player.score,
      accuracy,
      luterGrade: calculateLuterGrade(accuracy),
      examReadiness: calculateExamReadiness(accuracy, battle.subject),
      rank: sortedPlayers.findIndex(p => p.id === player.id) + 1
    }
  })
  
  const battleResults = {
    winnerId: winner.id,
    results,
    battle: {
      sessionId: battle.sessionId,
      subject: battle.subject,
      duration: battle.finishedAt - battle.startedAt,
      questionCount: battle.questions.length
    }
  }
  
  io.to(sessionId).emit('battle_finished', battleResults)
  
  console.log(`Battle finished: ${sessionId}, Winner: ${winner.id}`)
  
  // Cleanup after delay
  setTimeout(() => {
    battles.delete(sessionId)
  }, 60000) // Keep for 1 minute for post-battle review
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
