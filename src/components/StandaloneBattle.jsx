import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Users, Sword, Search, X, CheckCircle2, 
  Loader2, Copy, Timer, ChevronLeft, User, Star, Clock
} from 'lucide-react'

// Session storage for battle persistence
const BATTLE_SESSIONS = new Map()

export default function StandaloneBattle() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [battle, setBattle] = useState(null)
  const [battlePhase, setBattlePhase] = useState('joining') // joining, waiting, question, answer, result
  const [battleQuestion, setBattleQuestion] = useState(null)
  const [battleAnswer, setBattleAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [battleResults, setBattleResults] = useState([])
  const [playerName, setPlayerName] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [participants, setParticipants] = useState([])
  const [sessionTimeLeft, setSessionTimeLeft] = useState(600) // 10 minutes in seconds
  
  const battleTimerRef = useRef(null)
  const sessionTimerRef = useRef(null)
  const battleIntervalRef = useRef(null)

  useEffect(() => {
    if (!sessionId) {
      setError('No battle session provided')
      setLoading(false)
      return
    }

    initializeBattle()
    
    return () => {
      if (battleTimerRef.current) clearInterval(battleTimerRef.current)
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
      if (battleIntervalRef.current) clearInterval(battleIntervalRef.current)
    }
  }, [sessionId])

  const initializeBattle = () => {
    // Check if battle session already exists in global storage
    let existingBattle = null
    
    if (typeof window !== 'undefined' && window.BATTLE_SESSIONS) {
      existingBattle = window.BATTLE_SESSIONS.get(sessionId)
    }
    
    if (!existingBattle) {
      // Create new battle session
      existingBattle = {
        id: `battle_${Math.random().toString(36).substr(2, 9)}`,
        session_id: sessionId,
        battle_type: 'duel',
        status: 'waiting',
        current_question: 0,
        time_limit_seconds: 120,
        question_count: 10,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        participants: []
      }
      
      // Store in global session storage
      if (typeof window !== 'undefined') {
        window.BATTLE_SESSIONS = window.BATTLE_SESSIONS || new Map()
        window.BATTLE_SESSIONS.set(sessionId, existingBattle)
      }
      
      console.log('Created new battle session:', sessionId)
    } else {
      console.log('Joined existing battle session:', sessionId)
    }
    
    setBattle(existingBattle)
    setParticipants(existingBattle.participants || [])
    setLoading(false)
    
    // Start session timer
    startSessionTimer(existingBattle)
    
    // Simulate battle progression
    simulateBattleProgression()
  }

  const startSessionTimer = (battleSession) => {
    const updateSessionTime = () => {
      const now = new Date()
      const expiresAt = new Date(battleSession.expires_at)
      const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000))
      
      setSessionTimeLeft(timeLeft)
      
      if (timeLeft <= 0) {
        // Session expired
        if (typeof window !== 'undefined' && window.BATTLE_SESSIONS) {
          window.BATTLE_SESSIONS.delete(sessionId)
        }
        setBattlePhase('expired')
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current)
      }
    }
    
    updateSessionTime()
    sessionTimerRef.current = setInterval(updateSessionTime, 1000)
  }

  const simulateBattleProgression = () => {
    // Only simulate progression if there are participants
    const checkForBattleStart = () => {
      if (typeof window !== 'undefined' && window.BATTLE_SESSIONS) {
        const battleSession = window.BATTLE_SESSIONS.get(sessionId)
        if (battleSession && battleSession.participants && battleSession.participants.length >= 2) {
          // Start battle when we have at least 2 participants
          const botPlayer = {
            id: `bot_${Math.random().toString(36).substr(2, 9)}`,
            name: 'Bot Player',
            isAnonymous: false,
            joinedAt: new Date().toISOString()
          }
          
          const updatedParticipants = [...battleSession.participants, botPlayer]
          setParticipants(updatedParticipants)
          
          // Update battle session in global storage
          battleSession.participants = updatedParticipants
          battleSession.status = 'active'
          window.BATTLE_SESSIONS.set(sessionId, battleSession)
          
          setBattle(prev => ({ ...prev, status: 'active' }))
          setBattlePhase('question')
          generateMockQuestion()
          
          if (battleIntervalRef.current) {
            clearInterval(battleIntervalRef.current)
          }
        }
      }
    }
    
    // Check every 2 seconds for battle start conditions
    battleIntervalRef.current = setInterval(checkForBattleStart, 2000)
    
    // Also simulate a bot joining after 5-10 seconds if no one else joins
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.BATTLE_SESSIONS) {
        const battleSession = window.BATTLE_SESSIONS.get(sessionId)
        if (battleSession && battleSession.participants && battleSession.participants.length === 1) {
          // Add a bot player to make it interesting
          const botPlayer = {
            id: `bot_${Math.random().toString(36).substr(2, 9)}`,
            name: 'Bot Player',
            isAnonymous: false,
            joinedAt: new Date().toISOString()
          }
          
          const updatedParticipants = [...battleSession.participants, botPlayer]
          setParticipants(updatedParticipants)
          
          battleSession.participants = updatedParticipants
          battleSession.status = 'active'
          window.BATTLE_SESSIONS.set(sessionId, battleSession)
          
          setBattle(prev => ({ ...prev, status: 'active' }))
          setBattlePhase('question')
          generateMockQuestion()
          
          if (battleIntervalRef.current) {
            clearInterval(battleIntervalRef.current)
          }
        }
      }
    }, 5000 + Math.random() * 5000) // Random delay between 5-10 seconds
  }

  const generateMockQuestion = () => {
    const questions = [
      {
        id: `q_${Math.random().toString(36).substr(2, 9)}`,
        question_text: "What is the capital of Nigeria?",
        question_type: "multiple",
        options: ["Lagos", "Abuja", "Kano", "Ibadan"],
        correct_answer: "Abuja",
        time_limit_seconds: 15
      },
      {
        id: `q_${Math.random().toString(36).substr(2, 9)}`,
        question_text: "2 + 2 = ?",
        question_type: "multiple",
        options: ["3", "4", "5", "6"],
        correct_answer: "4",
        time_limit_seconds: 10
      },
      {
        id: `q_${Math.random().toString(36).substr(2, 9)}`,
        question_text: "What is the largest planet in our solar system?",
        question_type: "multiple",
        options: ["Earth", "Mars", "Jupiter", "Saturn"],
        correct_answer: "Jupiter",
        time_limit_seconds: 15
      },
      {
        id: `q_${Math.random().toString(36).substr(2, 9)}`,
        question_text: "Who painted the Mona Lisa?",
        question_type: "multiple",
        options: ["Van Gogh", "Da Vinci", "Picasso", "Monet"],
        correct_answer: "Da Vinci",
        time_limit_seconds: 12
      },
      {
        id: `q_${Math.random().toString(36).substr(2, 9)}`,
        question_text: "What is the chemical symbol for gold?",
        question_type: "multiple",
        options: ["Go", "Gd", "Au", "Ag"],
        correct_answer: "Au",
        time_limit_seconds: 10
      }
    ]
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)]
    setBattleQuestion(randomQuestion)
    setTimeLeft(randomQuestion.time_limit_seconds)
    
    // Start timer
    battleTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(battleTimerRef.current)
          // Only submit answer if there's an active question
          if (battleQuestion && !battleAnswer) {
            submitAnswer('')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const submitAnswer = async (answer) => {
    if (battleAnswer || !battleQuestion) return
    
    setBattleAnswer(answer)
    if (battleTimerRef.current) clearInterval(battleTimerRef.current)
    
    const isCorrect = answer === battleQuestion.correct_answer
    const points = isCorrect ? Math.ceil(timeLeft * 10) : 0
    
    setBattleResults(prev => [...prev, { 
      question_id: battleQuestion.id, 
      is_correct: isCorrect, 
      points_earned: points 
    }])
    
    setBattlePhase('answer')
    
    // Wait for next question or battle end
    setTimeout(() => {
      if (battleResults.length < 2) { // Simulate 3 questions total
        setBattlePhase('question')
        generateMockQuestion()
        setBattleAnswer('')
      } else {
        setBattlePhase('result')
      }
    }, 2000)
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/battle/${sessionId}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleGoHome = () => {
    navigate('/')
  }

  const handleJoinBattle = () => {
    if (!playerName.trim() && !isAnonymous) return
    
    // Add current player to participants
    const currentPlayer = {
      id: 'current_player',
      name: isAnonymous ? 'Anonymous' : playerName,
      isAnonymous: isAnonymous,
      joinedAt: new Date().toISOString(),
      isCurrentPlayer: true
    }
    
    const updatedParticipants = [...participants, currentPlayer]
    setParticipants(updatedParticipants)
    
    // Update battle session in global storage
    if (typeof window !== 'undefined' && window.BATTLE_SESSIONS) {
      const battleSession = window.BATTLE_SESSIONS.get(sessionId)
      if (battleSession) {
        battleSession.participants = updatedParticipants
        window.BATTLE_SESSIONS.set(sessionId, battleSession)
      }
    }
    
    setBattlePhase('waiting')
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Loader2 size={48} className="animate-spin" color="white" />
        <p style={{ color: 'white', marginTop: 16, fontSize: 18 }}>Joining Battle...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: 20
      }}>
        <div style={{
          background: 'white',
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          maxWidth: 400
        }}>
          <X size={48} color="#ef4444" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>
            Battle Not Found
          </h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            {error}
          </p>
          <button
            onClick={handleGoHome}
            style={{
              padding: '12px 24px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Expired Phase
  if (battlePhase === 'expired') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            maxWidth: 400,
            width: '100%'
          }}
        >
          <Clock size={60} color="#ef4444" style={{ marginBottom: 24 }} />
          
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 16 }}>
            Session Expired
          </h2>
          
          <p style={{ color: '#64748b', marginBottom: 32 }}>
            This battle session has expired (10 minute limit)
          </p>
          
          <button
            onClick={handleGoHome}
            style={{
              padding: '16px 32px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Create New Battle
          </button>
        </motion.div>
      </div>
    )
  }

  // Joining Phase
  if (battlePhase === 'joining') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            maxWidth: 400,
            width: '100%'
          }}
        >
          <Trophy size={60} color="#7a12cc" style={{ marginBottom: 24 }} />
          
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 16 }}>
            Join Battle!
          </h1>
          
          <p style={{ color: '#64748b', marginBottom: 32 }}>
            Enter your name to join this epic battle
          </p>
          
          <div style={{ marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={isAnonymous}
              style={{
                width: '100%',
                padding: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: 12,
                fontSize: 16,
                marginBottom: 12,
                outline: 'none',
                transition: 'border-color 0.2s',
                opacity: isAnonymous ? 0.5 : 1
              }}
              onFocus={(e) => !isAnonymous && (e.target.style.borderColor = '#7a12cc')}
              onBlur={(e) => !isAnonymous && (e.target.style.borderColor = '#e5e7eb')}
            />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#64748b' }}>
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Play as Anonymous
            </label>
          </div>
          
          <div style={{
            background: '#f8fafc',
            padding: 12,
            borderRadius: 12,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Clock size={16} color="#f59e0b" />
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Session expires in: {formatTime(sessionTimeLeft)}
            </span>
          </div>
          
          <button
            onClick={handleJoinBattle}
            disabled={!playerName.trim() && !isAnonymous}
            style={{
              width: '100%',
              padding: '16px',
              background: (!playerName.trim() && !isAnonymous) ? '#94a3b8' : '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: (!playerName.trim() && !isAnonymous) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Join Battle
          </button>
          
          <button
            onClick={handleGoHome}
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              color: '#64748b',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              cursor: 'pointer',
              marginTop: 12
            }}
          >
            Cancel
          </button>
        </motion.div>
      </div>
    )
  }

  // Waiting Phase
  if (battlePhase === 'waiting') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            maxWidth: 500,
            width: '100%'
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#7a12cc20',
              border: '3px dashed #7a12cc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}
          >
            <Users size={40} color="#7a12cc" />
          </motion.div>
          
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 8 }}>
            Waiting for Opponent...
          </h2>
          
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            The battle will start when someone joins!
          </p>
          
          {/* Session Timer */}
          <div style={{
            background: '#fef3c7',
            padding: 12,
            borderRadius: 12,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center'
          }}>
            <Clock size={16} color="#f59e0b" />
            <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
              Session expires in: {formatTime(sessionTimeLeft)}
            </span>
          </div>
          
          {/* Participant List */}
          <div style={{ marginBottom: 24, textAlign: 'left' }}>
            <h4 style={{ fontSize: 11, fontWeight: 800, color: '#111', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Joined Players ({participants.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {participants.map((participant, index) => (
                <div key={participant.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: participant.isCurrentPlayer ? '1.5px solid #7a12cc' : '1px solid #e5e7eb'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: '50%', background: '#7a12cc', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800
                    }}>
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>
                      {participant.name} {participant.isCurrentPlayer && '(You)'}
                    </span>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                </div>
              ))}
              {participants.length === 0 && (
                <div style={{ 
                  padding: '20px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: 13
                }}>
                  No players joined yet. Share the link!
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleCopyLink}
            style={{
              padding: '12px 24px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {copiedLink ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copiedLink ? 'Link Copied!' : 'Share Battle'}
          </button>
        </motion.div>
      </div>
    )
  }

  // Question Phase
  if (battlePhase === 'question') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            maxWidth: 600,
            width: '100%'
          }}
        >
          {/* Timer */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 32
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: timeLeft > 5 ? '#22c55e' : '#ef4444',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800
            }}>
              {timeLeft}
            </div>
          </div>

          {/* Question */}
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: 24 }}>
            {battleQuestion?.question_text}
          </h3>
          
          {battleQuestion?.question_type === 'multiple' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {battleQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => submitAnswer(option)}
                  disabled={battleAnswer !== ''}
                  style={{
                    padding: '20px',
                    background: battleAnswer === option ? '#7a12cc' : 'white',
                    color: battleAnswer === option ? 'white' : '#111',
                    border: '2px solid #e5e7eb',
                    borderRadius: 16,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: battleAnswer ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    opacity: battleAnswer && battleAnswer !== option ? 0.6 : 1
                  }}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // Answer Phase
  if (battlePhase === 'answer') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            maxWidth: 400,
            width: '100%'
          }}
        >
          <div style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: battleAnswer === battleQuestion?.correct_answer ? '#22c55e' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px'
          }}>
            {battleAnswer === battleQuestion?.correct_answer ? (
              <CheckCircle2 size={60} color="white" />
            ) : (
              <X size={60} color="white" />
            )}
          </div>
          
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 12 }}>
            {battleAnswer === battleQuestion?.correct_answer ? 'Correct!' : 'Wrong!'}
          </h2>
          <p style={{ fontSize: 18, color: '#64748b', marginBottom: 8 }}>
            Correct answer: {battleQuestion?.correct_answer}
          </p>
          <p style={{ fontSize: 14, color: '#94a3b8' }}>
            Next question starting...
          </p>
        </motion.div>
      </div>
    )
  }

  // Result Phase
  if (battlePhase === 'result') {
    const correctAnswers = battleResults.filter(r => r.is_correct).length
    const totalPoints = battleResults.reduce((sum, r) => sum + r.points_earned, 0)

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 40,
            textAlign: 'center',
            maxWidth: 400,
            width: '100%'
          }}
        >
          <Trophy size={100} color="#7a12cc" style={{ marginBottom: 32 }} />
          
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111', marginBottom: 16 }}>
            Battle Complete!
          </h2>
          
          <div style={{ display: 'flex', gap: 32, marginBottom: 32, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#7a12cc' }}>
                {correctAnswers}
              </div>
              <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase' }}>Correct</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#111' }}>
                {totalPoints}
              </div>
              <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase' }}>Points</div>
            </div>
          </div>
          
          <div style={{
            background: '#f8fafc',
            padding: 16,
            borderRadius: 12,
            marginBottom: 24
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <User size={16} color="#7a12cc" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                {isAnonymous ? 'Anonymous' : playerName}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Thanks for playing!
            </div>
          </div>
          
          <button
            onClick={handleGoHome}
            style={{
              padding: '16px 32px',
              background: '#7a12cc',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 12
            }}
          >
            Play More Battles
          </button>
          
          <button
            onClick={handleCopyLink}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: '#7a12cc',
              border: '2px solid #7a12cc',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {copiedLink ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copiedLink ? 'Link Copied!' : 'Share This Battle'}
          </button>
        </motion.div>
      </div>
    )
  }

  return null
}
