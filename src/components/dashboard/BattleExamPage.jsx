import { useState, useEffect, useRef } from 'react'
import { useOutletContext, useNavigate, useParams } from 'react-router-dom'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { 
  Clock, CheckCircle2, XCircle, Users, Trophy, Zap, ArrowRight, 
  Loader2, Award, Flame, Star, Target, Sword, Shield, Crown,
  Wifi, WifiOff, RefreshCw, X, Volume2, VolumeX
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { io } from 'socket.io-client'
import LuterLogo from '../shared/LuterLogo'

// Sound Effects
import correctSound from '../../assets/sounds/dragon-studio-correct-472358.mp3'
import wrongSound from '../../assets/sounds/universfield-wrong-answer-126515.mp3'

const PALETTE = ['#7a12cc', '#9718fb', '#b04dfc', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#6366f1']

// Socket.io configuration
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-server.com' 
  : 'http://localhost:3001'

export default function BattleExamPage() {
  const { user, isMobile, sidebarCollapsed } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch() || { ready: false, bundle: null }
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  // Socket connection
  const [socket, setSocket] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // disconnected, connecting, connected, reconnecting
  
  // Battle states
  const [battleMode, setBattleMode] = useState('waiting') // waiting, countdown, battle, finished
  const [battleSession, setBattleSession] = useState(null)
  const [opponent, setOpponent] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [isReady, setIsReady] = useState(false)
  
  // Question states (cloned from MockExam)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [isAnswered, setIsAnswered] = useState(false)
  
  // Progress tracking
  const [myProgress, setMyProgress] = useState({ currentQuestion: 0, score: 0, finished: false })
  const [opponentProgress, setOpponentProgress] = useState({ currentQuestion: 0, score: 0, finished: false })
  const [showOpponentScore, setShowOpponentScore] = useState(false)
  
  // UI states
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showReconnectionModal, setShowReconnectionModal] = useState(false)
  const [battleResults, setBattleResults] = useState(null)
  
  const battleTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)

  // Initialize socket connection
  useEffect(() => {
    if (!user || !sessionId) return

    const newSocket = io(SOCKET_URL, {
      query: { userId: user.id, sessionId }
    })

    newSocket.on('connect', () => {
      console.log('Connected to battle server')
      setConnectionStatus('connected')
      setShowReconnectionModal(false)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from battle server')
      setConnectionStatus('disconnected')
      setShowReconnectionModal(true)
    })

    newSocket.on('reconnecting', () => {
      setConnectionStatus('reconnecting')
    })

    // Battle events
    newSocket.on('battle_joined', (data) => {
      setBattleSession(data.battle)
      if (data.opponent) {
        setOpponent(data.opponent)
      }
    })

    newSocket.on('opponent_joined', (data) => {
      setOpponent(data.opponent)
    })

    newSocket.on('start_countdown', (data) => {
      setCountdown(data.seconds)
      setBattleMode('countdown')
      startCountdown(data.seconds)
    })

    newSocket.on('start_battle', (data) => {
      setBattleMode('battle')
      setGeneratedQuestions(data.questions)
      setCurrent(0)
      setTimeLeft(data.timeLimit)
      setSelected({})
      setIsAnswered(false)
      startBattleTimer(data.timeLimit)
    })

    newSocket.on('opponent_progress', (data) => {
      setOpponentProgress(prev => ({
        ...prev,
        currentQuestion: data.currentQuestion
      }))
    })

    newSocket.on('opponent_finished', (data) => {
      setOpponentProgress(prev => ({
        ...prev,
        finished: true,
        score: data.score
      }))
    })

    newSocket.on('battle_finished', (data) => {
      setBattleMode('finished')
      setBattleResults(data.results)
      setShowOpponentScore(true)
      if (battleTimerRef.current) clearInterval(battleTimerRef.current)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      if (battleTimerRef.current) clearInterval(battleTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [user, sessionId])

  // Join battle room
  useEffect(() => {
    if (socket && connectionStatus === 'connected') {
      socket.emit('join_battle', { sessionId, userId: user.id })
    }
  }, [socket, connectionStatus, sessionId, user.id])

  const startCountdown = (seconds) => {
    setCountdown(seconds)
    countdownTimerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startBattleTimer = (timeLimit) => {
    setTimeLeft(timeLimit)
    battleTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(battleTimerRef.current)
          submitAnswer(null) // Auto-submit if time runs out
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleReady = () => {
    setIsReady(true)
    if (socket) {
      socket.emit('player_ready', { sessionId, userId: user.id })
    }
  }

  const choose = (answerIndex) => {
    if (isAnswered) return
    
    const newSelected = { ...selected, [current]: answerIndex }
    setSelected(newSelected)
    setIsAnswered(true)
    
    // Calculate if correct
    const question = generatedQuestions[current]
    const isCorrect = answerIndex === question.correctAnswer
    
    // Play sound
    if (soundEnabled) {
      const audio = new Audio(isCorrect ? correctSound : wrongSound)
      audio.volume = 0.5
      audio.play().catch(err => console.error('Sound playback failed:', err))
    }
    
    // Update progress
    const newScore = myProgress.score + (isCorrect ? 1 : 0)
    setMyProgress(prev => ({
      ...prev,
      currentQuestion: current + 1,
      score: newScore
    }))
    
    // Submit to server
    if (socket) {
      socket.emit('submit_answer', {
        sessionId,
        userId: user.id,
        questionIndex: current,
        answer: answerIndex,
        isCorrect
      })
    }
    
    // Auto-advance after delay
    setTimeout(() => {
      if (current < generatedQuestions.length - 1) {
        setCurrent(current + 1)
        setIsAnswered(false)
      } else {
        // Finished all questions
        if (socket) {
          socket.emit('finish_battle', {
            sessionId,
            userId: user.id,
            finalScore: newScore
          })
        }
      }
    }, 1200)
  }

  const submitAnswer = (forcedAnswer = null) => {
    if (isAnswered && !forcedAnswer) return
    
    const answer = forcedAnswer !== null ? forcedAnswer : selected[current]
    const question = generatedQuestions[current]
    const isCorrect = answer === question.correctAnswer
    
    if (socket) {
      socket.emit('submit_answer', {
        sessionId,
        userId: user.id,
        questionIndex: current,
        answer,
        isCorrect
      })
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = generatedQuestions[current]

  // Connection Status Indicator
  const renderConnectionStatus = () => (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
      background: connectionStatus === 'connected' ? '#22c55e' : 
                   connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444',
      color: 'white'
    }}>
      {connectionStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
      {connectionStatus === 'connected' ? 'Connected' : 
       connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
    </div>
  )

  // Progress Bar (The "Ghost" Progress Bar)
  const renderProgressBar = () => (
    <div style={{
      background: 'white',
      padding: '16px 24px',
      borderBottom: '2px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#7a12cc',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800
          }}>
            {user?.email?.charAt(0).toUpperCase() || 'Y'}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>You</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>
              Q{myProgress.currentQuestion + 1} • Score: {myProgress.score}
            </div>
          </div>
        </div>
        
        <div style={{ fontSize: 14, fontWeight: 800, color: '#7a12cc' }}>
          VS
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
              {opponent?.name || 'Opponent'}
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>
              Q{opponentProgress.currentQuestion + 1} • 
              {showOpponentScore ? ` Score: ${opponentProgress.score}` : ' ???'}
            </div>
          </div>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#ef4444',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 800
          }}>
            {opponent?.name?.charAt(0).toUpperCase() || 'O'}
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div style={{
        height: 8,
        background: '#f3f4f6',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* My Progress */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${(myProgress.currentQuestion / generatedQuestions.length) * 100}%`,
          background: '#7a12cc',
          transition: 'width 0.3s ease'
        }} />
        
        {/* Opponent Progress */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${(opponentProgress.currentQuestion / generatedQuestions.length) * 100}%`,
          background: 'rgba(239, 68, 68, 0.3)',
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  )

  // Waiting Room
  const renderWaitingRoom = () => (
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
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: '#7a12cc20',
          border: '3px dashed #7a12cc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Users size={40} color="#7a12cc" />
        </div>
        
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 16 }}>
          Battle Room
        </h2>
        
        <p style={{ color: '#64748b', marginBottom: 32 }}>
          {opponent ? 'Opponent found! Get ready...' : 'Waiting for opponent...'}
        </p>
        
        {/* Participants */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 32 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#7a12cc',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              margin: '0 auto 8px'
            }}>
              {user?.email?.charAt(0).toUpperCase() || 'Y'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>You</div>
            {isReady && (
              <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>Ready!</div>
            )}
          </div>
          
          <div style={{ fontSize: 24, fontWeight: 800, color: '#7a12cc', alignSelf: 'center' }}>
            VS
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: opponent ? '#ef4444' : '#e5e7eb',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 800,
              margin: '0 auto 8px'
            }}>
              {opponent?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
              {opponent?.name || 'Waiting...'}
            </div>
            {opponent?.isReady && (
              <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>Ready!</div>
            )}
          </div>
        </div>
        
        {/* Ready Button */}
        {!isReady && (
          <button
            onClick={handleReady}
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
            Ready?
          </button>
        )}
        
        {isReady && !opponent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Loader2 size={20} className="animate-spin" color="#7a12cc" />
            <span style={{ color: '#64748b' }}>Waiting for opponent to ready up...</span>
          </div>
        )}
      </motion.div>
    </div>
  )

  // Countdown
  const renderCountdown = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <motion.div
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 72,
          fontWeight: 900,
          color: '#7a12cc',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        {countdown || 'GO!'}
      </motion.div>
    </div>
  )

  // Battle Screen (based on MockExam design)
  const renderBattle = () => {
    if (!currentQuestion) return null
    
    const userAns = selected[current]
    const isCorrectAnswer = userAns == currentQuestion.correctAnswer

    return (
      <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Outfit', 'Varela Round', sans-serif", overflow: 'hidden', color: '#1A3A32', position: 'relative' }}>
        
        {renderConnectionStatus()}
        {renderProgressBar()}
        
        {/* Exit Button */}
        <button 
          onClick={() => navigate('/dashboard/compete')}
          style={{ position: 'absolute', top: 80, left: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', zIndex: 20 }}
        >
          <X size={28} strokeWidth={1.5} />
        </button>

        {/* Battle Header */}
        <div style={{ padding: isMobile ? '16px 20px' : '24px 40px', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eefaec', color: '#16a34a', padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 800, border: '1.5px solid #4ade80', boxShadow: '0 4px 12px rgba(22,163,74,0.1)', textTransform: 'lowercase' }}>
            <Clock size={14} /> {formatTime(timeLeft)}
          </div>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 8 }}
          >
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        {/* Battle Content */}
        <div style={{ flex: 1, padding: isMobile ? '20px 16px 40px' : '20px 40px 60px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', overflowY: 'auto' }}>
          <motion.div key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Question Card */}
            <div style={{ background: '#E2F9D1', borderRadius: 16, padding: '24px', marginBottom: 32, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)', border: '1px solid rgba(0, 0, 0, 0.02)', width: '100%' }}>
              <h2 style={{ fontSize: isMobile ? 15 : 17, fontWeight: 500, color: '#1A3A32', margin: 0, lineHeight: 1.6, textAlign: 'center' }}>
                {currentQuestion.question}
              </h2>
            </div>
            
            {/* Answer Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 32, width: '100%' }}>
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selected[current] === i
                const isCorrectOption = isAnswered && i === currentQuestion.correctAnswer
                const isWrongOption = isAnswered && isSelected && i !== currentQuestion.correctAnswer
                
                return (
                  <motion.button
                    key={i} 
                    whileHover={{ y: isAnswered ? 0 : -2 }} 
                    whileTap={{ scale: isAnswered ? 1 : 0.98 }}
                    onClick={() => !isAnswered && choose(i)} 
                    disabled={isAnswered}
                    style={{
                      width: '100%',
                      padding: '20px',
                      borderRadius: 16,
                      border: isCorrectOption ? '2px solid #16a34a' : 
                               isWrongOption ? '2px solid #dc2626' : 
                               isSelected ? '2px solid #7a12cc' : '1.5px solid #e2e8f0',
                      background: isCorrectOption ? '#f0fdf4' : 
                                isWrongOption ? '#fef2f2' : 
                                isSelected ? '#f5f3ff' : 'white',
                      cursor: isAnswered ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: isCorrectOption ? '#16a34a' : 
                                 isWrongOption ? '#dc2626' : 
                                 isSelected ? '#7a12cc' : '#f8fafc',
                        color: isCorrectOption || isWrongOption || isSelected ? 'white' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 800
                      }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: isCorrectOption || isWrongOption ? 'white' : '#1A3A32',
                        textAlign: 'left'
                      }}>
                        {opt}
                      </span>
                    </div>
                    
                    {isCorrectOption && <CheckCircle2 size={20} color="white" />}
                    {isWrongOption && <XCircle size={20} color="white" />}
                  </motion.button>
                )
              })}
            </div>
            
            {/* Question Navigation */}
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                {generatedQuestions.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 2,
                      background: index < current ? '#7a12cc' : 
                               index === current ? '#7a12cc' : '#e5e7eb'
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Results Screen
  const renderResults = () => {
    if (!battleResults) return null
    
    const isWinner = battleResults.winnerId === user.id
    const myAccuracy = Math.round((myProgress.score / generatedQuestions.length) * 100)
    const opponentAccuracy = Math.round((opponentProgress.score / generatedQuestions.length) * 100)
    
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
          {isWinner ? (
            <Trophy size={80} color="#f59e0b" style={{ margin: '0 auto 24px' }} />
          ) : (
            <Shield size={80} color="#64748b" style={{ margin: '0 auto 24px' }} />
          )}
          
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111', marginBottom: 16 }}>
            {isWinner ? 'Victory!' : 'Defeat!'}
          </h2>
          
          <p style={{ fontSize: 18, color: '#64748b', marginBottom: 32 }}>
            {isWinner ? 'You dominated this battle!' : 'Good fight! Try again.'}
          </p>
          
          {/* Score Comparison */}
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#7a12cc' }}>
                {myProgress.score}/{generatedQuestions.length}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Your Score</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>
                {myAccuracy}%
              </div>
            </div>
            
            <div style={{ fontSize: 20, fontWeight: 800, color: '#64748b' }}>
              VS
            </div>
            
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>
                {opponentProgress.score}/{generatedQuestions.length}
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Opponent</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                {opponentAccuracy}%
              </div>
            </div>
          </div>
          
          {/* Luter Grade */}
          <div style={{
            background: '#f8fafc',
            padding: 16,
            borderRadius: 12,
            marginBottom: 24
          }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 8 }}>
              Luter Grade: {myAccuracy >= 90 ? 'A+' : myAccuracy >= 80 ? 'A' : myAccuracy >= 70 ? 'B' : myAccuracy >= 60 ? 'C' : 'D'}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Exam Readiness: {myAccuracy}%
            </div>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <button
              onClick={() => navigate('/dashboard/compete')}
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
              Find New Battle
            </button>
            
            <button
              onClick={() => {/* TODO: Implement review */}}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: '#7a12cc',
                border: '2px solid #7a12cc',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Review Answers
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Reconnection Modal
  const renderReconnectionModal = () => (
    <AnimatePresence>
      {showReconnectionModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 20
          }}
        >
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
            <WifiOff size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 8 }}>
              Connection Lost
            </h3>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
              Trying to reconnect to the battle...
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Loader2 size={20} className="animate-spin" color="#7a12cc" />
              <span style={{ fontSize: 12, color: '#64748b' }}>Reconnecting...</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {battleMode === 'waiting' && renderWaitingRoom()}
      {battleMode === 'countdown' && renderCountdown()}
      {battleMode === 'battle' && renderBattle()}
      {battleMode === 'finished' && renderResults()}
      {renderReconnectionModal()}
    </>
  )
}
