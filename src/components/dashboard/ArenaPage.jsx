import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Users, Zap, Shield, Search, Sword, Target, 
  Crown, Star, Award, Flame, Timer, Loader2, ArrowRight,
  Copy, CheckCircle2, X, Eye, MessageSquare, Play, Pause,
  TrendingUp, Calendar, UserPlus, Settings, ChevronRight,
  Medal, Monitor, Volume2, Send, User
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

export default function ArenaPage() {
  const { user, isMobile } = useOutletContext()
  
  // Battle States
  const [battlePhase, setBattlePhase] = useState('menu') // menu, waiting, searching, question, answer, result
  const [currentBattle, setCurrentBattle] = useState(null)
  const [battleQuestion, setBattleQuestion] = useState(null)
  const [battleAnswer, setBattleAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [battleResults, setBattleResults] = useState([])
  const [spectatorMode, setSpectatorMode] = useState(false)
  
  // Matchmaking States
  const [isSearching, setIsSearching] = useState(false)
  const [searchTarget, setSearchTarget] = useState(null)
  const [players, setPlayers] = useState({ challenger: null, opponent: null })
  const [liveCount, setLiveCount] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)
  
  // UI States
  const [showBattleModal, setShowBattleModal] = useState(false)
  const [battleChat, setBattleChat] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [connectionError, setConnectionError] = useState(false)
  
  // Refs
  const battleTimerRef = useRef(null)
  const chatEndRef = useRef(null)
  const battleChannelRef = useRef(null)

  // Initialize component
  useEffect(() => {
    if (!user) return
    
    setupRealtimeSubscriptions()
    
    // Check for invite link in URL
    const params = new URLSearchParams(window.location.search)
    const battleId = params.get('battle')
    if (battleId) {
      joinBattle(battleId)
    }
    
    return () => {
      if (battleTimerRef.current) clearInterval(battleTimerRef.current)
      if (battleChannelRef.current) supabase.removeChannel(battleChannelRef.current)
    }
  }, [user])

  const setupRealtimeSubscriptions = () => {
    const fetchLive = async () => {
      try {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString()
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_active_at', fiveMinsAgo)
        setLiveCount(count || 1)
      } catch (error) {
        console.error('Error fetching live count:', error)
        setLiveCount(1)
      }
    }
    
    fetchLive()
    const liveInterval = setInterval(fetchLive, 60000)
    
    return () => clearInterval(liveInterval)
  }

  // Battle Functions
  const findOpponent = async () => {
    setIsSearching(true)
    setBattlePhase('searching')
    
    try {
      const { data: liveUsers } = await supabase
        .from('profiles')
        .select('id, full_name, level')
        .neq('id', user.id)
        .limit(5)

      setTimeout(() => {
         if (liveUsers && liveUsers.length > 0) {
            const opponent = liveUsers[Math.floor(Math.random() * liveUsers.length)]
            setSearchTarget(opponent.full_name)
            setBattlePhase('found')
            setTimeout(() => {
               createBattle('duel')
               setIsSearching(false)
            }, 2000)
         } else {
            setBattlePhase('menu')
            setIsSearching(false)
         }
      }, 4000)
    } catch (error) {
      console.error('Error finding opponent:', error)
      setIsSearching(false)
      setBattlePhase('menu')
    }
  }

  const createInviteLink = async () => {
    try {
      const matchId = `luter_${Math.random().toString(36).substr(2, 9)}`
      const { data } = await supabase
        .from('battles')
        .insert({ 
          battle_type: 'duel',
          session_id: matchId,
          status: 'waiting',
          time_limit_seconds: 120,
          question_count: 10
        })
        .select()
        .single()

      if (data) {
        // Add challenger to battle
        await supabase
          .from('battle_participants')
          .insert({
            battle_id: data.id,
            user_id: user.id,
            role: 'challenger'
          })
        
        const link = `${window.location.origin}/compete?battle=${matchId}`
        navigator.clipboard.writeText(link)
        setCopiedLink(true)
        setCurrentBattle(data)
        setBattlePhase('waiting')
        setTimeout(() => setCopiedLink(false), 2000)
      }
    } catch (error) {
      console.error('Error creating invite link:', error)
      setConnectionError(true)
    }
  }

  const createBattle = async (battleType = 'duel') => {
    try {
      const sessionId = `luter_${Math.random().toString(36).substr(2, 9)}`
      
      const { data: battle } = await supabase
        .from('battles')
        .insert({
          battle_type: battleType,
          session_id: sessionId,
          status: 'waiting',
          time_limit_seconds: 120,
          question_count: 10
        })
        .select()
        .single()
      
      if (battle) {
        // Add challenger
        await supabase
          .from('battle_participants')
          .insert({
            battle_id: battle.id,
            user_id: user.id,
            role: 'challenger'
          })
        
        setCurrentBattle(battle)
        setBattlePhase('waiting')
        setupBattleSubscription(battle.id)
      }
    } catch (error) {
      console.error('Error creating battle:', error)
      setBattlePhase('menu')
    }
  }

  const joinBattle = async (sessionId) => {
    try {
      const { data: battle } = await supabase
        .from('battles')
        .select('*')
        .eq('session_id', sessionId)
        .single()
      
      if (battle && battle.status === 'waiting') {
        // Add as opponent
        await supabase
          .from('battle_participants')
          .insert({
            battle_id: battle.id,
            user_id: user.id,
            role: 'opponent'
          })
        
        // Update battle status to active
        await supabase
          .from('battles')
          .update({ status: 'active' })
          .eq('id', battle.id)
        
        setCurrentBattle(battle)
        setBattlePhase('waiting')
        setupBattleSubscription(battle.id)
      }
    } catch (error) {
      console.error('Error joining battle:', error)
    }
  }

  const setupBattleSubscription = (battleId) => {
    battleChannelRef.current = supabase
      .channel(`battle_${battleId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'battles', filter: `id=eq.${battleId}` },
        handleBattleUpdate
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'battle_chat', filter: `battle_id=eq.${battleId}` },
        handleNewChatMessage
      )
      .subscribe()
  }

  const handleBattleUpdate = (payload) => {
    const battle = payload.new
    setCurrentBattle(battle)
    
    if (battle.status === 'active' && battlePhase === 'waiting') {
      startBattle(battle)
    } else if (battle.status === 'completed') {
      endBattle(battle)
    }
  }

  const handleNewChatMessage = (payload) => {
    setBattleChat(prev => [...prev, payload.new])
  }

  const startBattle = async (battle) => {
    setBattlePhase('question')
    
    // Generate battle questions
    const questions = await generateBattleQuestions(battle)
    
    // Start with first question
    if (questions.length > 0) {
      presentQuestion(questions[0])
    }
  }

  const generateBattleQuestions = async (battle) => {
    // Sample questions - integrate with your question generation system
    return [
      {
        question_text: "What is the capital of Nigeria?",
        question_type: "multiple",
        options: ["Lagos", "Abuja", "Kano", "Ibadan"],
        correct_answer: "Abuja",
        time_limit_seconds: 15
      },
      {
        question_text: "2 + 2 = ?",
        question_type: "multiple", 
        options: ["3", "4", "5", "6"],
        correct_answer: "4",
        time_limit_seconds: 10
      },
      {
        question_text: "Which programming language is known as the 'language of the web'?",
        question_type: "multiple",
        options: ["Python", "Java", "JavaScript", "C++"],
        correct_answer: "JavaScript",
        time_limit_seconds: 12
      }
    ]
  }

  const presentQuestion = (question) => {
    setBattleQuestion(question)
    setTimeLeft(question.time_limit_seconds)
    setBattleAnswer('')
    
    // Start question timer
    battleTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(battleTimerRef.current)
          submitAnswer('')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const submitAnswer = async (answer) => {
    if (battleTimerRef.current) {
      clearInterval(battleTimerRef.current)
    }
    
    try {
      const isCorrect = answer === battleQuestion.correct_answer
      const points = isCorrect ? Math.max(100 - (battleQuestion.time_limit_seconds - timeLeft) * 2, 10) : 0
      
      // Save answer
      await supabase
        .from('battle_answers')
        .insert({
          battle_id: currentBattle.id,
          user_id: user.id,
          question_number: currentBattle.current_question + 1,
          answer,
          is_correct: isCorrect,
          answer_time_ms: (battleQuestion.time_limit_seconds - timeLeft) * 1000,
          points_earned: points
        })
      
      // Show result phase
      setBattlePhase('answer')
      
      // Move to next question after delay
      setTimeout(() => {
        if (currentBattle.current_question < currentBattle.question_count - 1) {
          setCurrentBattle(prev => ({ ...prev, current_question: prev.current_question + 1 }))
          setBattlePhase('question')
        } else {
          completeBattle()
        }
      }, 3000)
    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const completeBattle = async () => {
    setBattlePhase('result')
    
    try {
      // Calculate final results
      const { data: results } = await supabase
        .from('battle_answers')
        .select('*')
        .eq('battle_id', currentBattle.id)
      
      setBattleResults(results || [])
      
      // Update battle status
      await supabase
        .from('battles')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', currentBattle.id)
    } catch (error) {
      console.error('Error completing battle:', error)
    }
  }

  const endBattle = (battle) => {
    setBattlePhase('result')
  }

  const sendBattleChat = async (message) => {
    if (!message.trim() || !currentBattle) return
    
    try {
      await supabase
        .from('battle_chat')
        .insert({
          battle_id: currentBattle.id,
          user_id: user.id,
          message: message.trim()
        })
      
      setChatInput('')
    } catch (error) {
      console.error('Error sending chat:', error)
    }
  }

  const handleAnswerClick = (answer) => {
    if (battleAnswer) return
    setBattleAnswer(answer)
    submitAnswer(answer)
  }

  const resetBattle = () => {
    setBattlePhase('menu')
    setCurrentBattle(null)
    setBattleQuestion(null)
    setBattleAnswer('')
    setTimeLeft(0)
    setBattleResults([])
    setBattleChat([])
    setSearchTarget(null)
  }

  // Render functions
  const renderMenu = () => (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #7a12cc, #9718fb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32
      }}>
        <Trophy size={60} color="white" />
      </div>
      
      <h1 style={{ fontSize: isMobile ? 36 : 48, fontWeight: 800, color: '#111', margin: '0 0 16px' }}>
        Battle Arena
      </h1>
      <p style={{ fontSize: 18, color: '#64748b', margin: '0 0 48px', maxWidth: 400 }}>
        Challenge live students to epic knowledge duels. Test your speed, accuracy, and mastery!
      </p>
      
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 16, width: '100%', maxWidth: 400 }}>
        <button
          onClick={findOpponent}
          disabled={isSearching}
          style={{
            flex: 1,
            height: 60,
            borderRadius: 16,
            background: isSearching ? '#94a3b8' : '#7a12cc',
            color: 'white',
            border: 'none',
            fontSize: 16,
            fontWeight: 800,
            cursor: isSearching ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            transition: 'all 0.2s'
          }}
        >
          {isSearching ? <Loader2 size={20} className="animate-spin" /> : <Sword size={20} />}
          {isSearching ? 'Searching...' : 'Quick Match'}
        </button>
        
        <button
          onClick={createInviteLink}
          style={{
            height: 60,
            borderRadius: 16,
            background: 'white',
            color: '#7a12cc',
            border: '2px solid #7a12cc',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          <Users size={18} />
          Invite
        </button>
      </div>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 32,
        fontSize: 14,
        color: '#64748b'
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 10px #22c55e'
        }} className="animate-pulse" />
        <span>{liveCount} Scholars Online</span>
      </div>
    </div>
  )

  const renderSearching = () => (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: '#7a12cc20',
          border: '4px solid #7a12cc',
          borderTopColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32
        }}
      >
        <Search size={40} color="#7a12cc" />
      </motion.div>
      
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>
        Finding Opponent...
      </h2>
      <p style={{ fontSize: 16, color: '#64748b', margin: 0 }}>
        Scanning for available scholars
      </p>
    </div>
  )

  const renderOpponentFound = () => (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: '#22c55e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24
      }}>
        <Users size={50} color="white" />
      </div>
      
      <h2 style={{ fontSize: 28, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
        Opponent Found!
      </h2>
      <p style={{ fontSize: 18, color: '#64748b', margin: '0 0 8px' }}>
        {searchTarget}
      </p>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
        Starting battle...
      </p>
    </div>
  )

  const renderWaiting = () => (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
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
          marginBottom: 24
        }}
      >
        <Users size={40} color="#7a12cc" />
      </motion.div>
      
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>
        Waiting for Opponent...
      </h2>
      <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 24px' }}>
        Share the battle link to invite friends
      </p>
      
      <button
        onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/compete?battle=${currentBattle.session_id}`)
          setCopiedLink(true)
          setTimeout(() => setCopiedLink(false), 2000)
        }}
        style={{
          padding: '12px 24px',
          background: '#7a12cc',
          color: 'white',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        {copiedLink ? <CheckCircle2 size={16} /> : <Copy size={16} />}
        {copiedLink ? 'Link Copied!' : 'Copy Battle Link'}
      </button>
    </div>
  )

  const renderQuestion = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
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
      <div style={{
        background: '#f8fafc',
        padding: '32px',
        borderRadius: 20,
        marginBottom: 32,
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 24px' }}>
          {battleQuestion?.question_text}
        </h3>
        
        {battleQuestion?.question_type === 'multiple' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {battleQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(option)}
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
      </div>
    </div>
  )

  const renderAnswer = () => (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: battleAnswer === battleQuestion?.correct_answer ? '#22c55e' : '#ef4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32
      }}>
        {battleAnswer === battleQuestion?.correct_answer ? (
          <CheckCircle2 size={60} color="white" />
        ) : (
          <X size={60} color="white" />
        )}
      </div>
      
      <h2 style={{ fontSize: 32, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>
        {battleAnswer === battleQuestion?.correct_answer ? 'Correct!' : 'Wrong!'}
      </h2>
      <p style={{ fontSize: 18, color: '#64748b', margin: '0 0 8px' }}>
        Correct answer: {battleQuestion?.correct_answer}
      </p>
      <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
        Next question starting...
      </p>
    </div>
  )

  const renderResult = () => (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
      <Trophy size={100} color="#7a12cc" style={{ marginBottom: 32 }} />
      
      <h2 style={{ fontSize: 36, fontWeight: 800, color: '#111', margin: '0 0 16px' }}>
        Battle Complete!
      </h2>
      
      <div style={{ display: 'flex', gap: 32, marginBottom: 40 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#7a12cc' }}>
            {battleResults.filter(r => r.is_correct).length}
          </div>
          <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase' }}>Correct</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 800, color: '#111' }}>
            {battleResults.reduce((sum, r) => sum + r.points_earned, 0)}
          </div>
          <div style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase' }}>Points</div>
        </div>
      </div>
      
      <button
        onClick={resetBattle}
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
        Back to Arena
      </button>
    </div>
  )

  return (
    <div style={{ 
      height: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '20px 40px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#7a12cc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Trophy size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>
              Battle Arena
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
              {spectatorMode ? 'Spectating' : 'Competing'}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 10px #22c55e'
            }} className="animate-pulse" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
              {liveCount} Online
            </span>
          </div>
          
          {battlePhase !== 'menu' && (
            <button
              onClick={resetBattle}
              style={{
                padding: '8px 16px',
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Exit Battle
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        <AnimatePresence mode="wait">
          {battlePhase === 'menu' && renderMenu()}
          {battlePhase === 'searching' && renderSearching()}
          {battlePhase === 'found' && renderOpponentFound()}
          {battlePhase === 'waiting' && renderWaiting()}
          {battlePhase === 'question' && renderQuestion()}
          {battlePhase === 'answer' && renderAnswer()}
          {battlePhase === 'result' && renderResult()}
        </AnimatePresence>
      </div>
    </div>
  )
}
