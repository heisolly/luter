import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Users, Zap, Shield, Search, Sword, Target, 
  Crown, Star, Award, Flame, Timer, Loader2, ArrowRight,
  Copy, CheckCircle2, X, Eye, MessageSquare, Play, Pause,
  TrendingUp, Calendar, UserPlus, Settings, ChevronRight,
  Medal, Monitor, Volume2
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { renderLeaderboard, renderArena, renderTournaments, renderTeams, renderAchievements, renderBattleModal } from './CompetePageRenderFunctions'
import { ConnectionErrorFallback } from './ConnectionErrorFallback'

export default function CompetePage() {
  const { user, isMobile } = useOutletContext()
  const { ready, bundle } = useDashboardPrefetch()
  
  // Enhanced State Management
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [leaderboard, setLeaderboard] = useState([])
  const [tournaments, setTournaments] = useState([])
  const [myTeams, setMyTeams] = useState([])
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeBattles, setActiveBattles] = useState([])
  const [connectionError, setConnectionError] = useState(false)
  
  // Battle States
  const [currentBattle, setCurrentBattle] = useState(null)
  const [battlePhase, setBattlePhase] = useState('waiting') // waiting, question, answer, result
  const [battleQuestion, setBattleQuestion] = useState(null)
  const [battleAnswer, setBattleAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [battleResults, setBattleResults] = useState([])
  const [spectatorMode, setSpectatorMode] = useState(false)
  
  // Matchmaking States
  const [isSearching, setIsSearching] = useState(false)
  const [matchingStep, setMatchingStep] = useState(0)
  const [searchTarget, setSearchTarget] = useState(null)
  const [players, setPlayers] = useState({ challenger: null, opponent: null })
  const [liveCount, setLiveCount] = useState(0)
  const [copiedLink, setCopiedLink] = useState(false)
  
  // UI States
  const [showBattleModal, setShowBattleModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showTournamentModal, setShowTournamentModal] = useState(false)
  const [battleChat, setBattleChat] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  // Refs
  const battleTimerRef = useRef(null)
  const chatEndRef = useRef(null)
  const battleChannelRef = useRef(null)

  // Initialize data
  useEffect(() => {
    if (!user) return
    
    fetchInitialData()
    setupRealtimeSubscriptions()
    
    // Check for invite link in URL
    const params = new URLSearchParams(window.location.search)
    const battleId = params.get('battle')
    if (battleId) {
      joinBattle(battleId)
    }
    
    }, [user])

  useEffect(() => {
    // Monitor battle session changes for real-time updates
    const checkBattleSession = () => {
      if (currentBattle && typeof window !== 'undefined' && window.BATTLE_SESSIONS) {
        const session = window.BATTLE_SESSIONS.get(currentBattle.session_id)
        if (session && session.participants) {
          // Update participants if they've changed
          if (JSON.stringify(session.participants) !== JSON.stringify(currentBattle.participants)) {
            setCurrentBattle(prev => ({ ...prev, participants: session.participants }))
          }
          
          // Start battle if session became active
          if (session.status === 'active' && battlePhase === 'waiting') {
            setBattlePhase('question')
            // Generate a mock question for the host
            const mockQuestion = {
              id: `q_${Math.random().toString(36).substr(2, 9)}`,
              question_text: "What is the capital of Nigeria?",
              question_type: "multiple",
              options: ["Lagos", "Abuja", "Kano", "Ibadan"],
              correct_answer: "Abuja",
              time_limit_seconds: 15
            }
            setBattleQuestion(mockQuestion)
            setTimeLeft(15)
          }
        }
      }
    }
    
    // Check every second for updates
    const interval = setInterval(checkBattleSession, 1000)
    
    return () => clearInterval(interval)
  }, [currentBattle, battlePhase])

  const fetchInitialData = async () => {
    setLoading(true)
    setConnectionError(false)
    
    try {
      // Use mock data immediately for reliable experience
      console.log('Loading compete system with mock data...')
      
      const mockLeaderboard = [
        { total_xp: 2500, streak_days: 15, battle_wins: 25, battle_losses: 5, profiles: { full_name: 'Alex Champion', level: 12, university: 'Demo University', battle_level: 8 } },
        { total_xp: 2100, streak_days: 10, battle_wins: 20, battle_losses: 8, profiles: { full_name: 'Sam Warrior', level: 10, university: 'Demo University', battle_level: 7 } },
        { total_xp: 1800, streak_days: 8, battle_wins: 18, battle_losses: 6, profiles: { full_name: 'Jordan Master', level: 9, university: 'Demo University', battle_level: 6 } },
        { total_xp: 1500, streak_days: 12, battle_wins: 15, battle_losses: 4, profiles: { full_name: 'Casey Expert', level: 8, university: 'Demo University', battle_level: 5 } },
        { total_xp: 1200, streak_days: 6, battle_wins: 12, battle_losses: 7, profiles: { full_name: 'Morgan Pro', level: 7, university: 'Demo University', battle_level: 4 } }
      ]
      
      const mockTournaments = [
        { id: 1, name: 'Weekly Championship', status: 'registration', start_time: new Date(Date.now() + 86400000).toISOString(), participants: 15, max_participants: 32 },
        { id: 2, name: 'Battle Royale', status: 'active', start_time: new Date().toISOString(), participants: 8, max_participants: 16 }
      ]
      
      const mockTeams = [
        { id: 1, name: 'Elite Scholars', tag: 'ELITE', team_xp: 5000, team_level: 5, wins: 25, losses: 5, current_members: 4, max_members: 4 },
        { id: 2, name: 'Battle Masters', tag: 'BTL', team_xp: 3500, team_level: 4, wins: 18, losses: 8, current_members: 3, max_members: 4 }
      ]
      
      const mockAchievements = [
        { 
          progress: 100, 
          completed_at: new Date().toISOString(), 
          reward_claimed: false, 
          achievements: { 
            name: 'First Victory', 
            description: 'Win your first battle', 
            icon: '🏆', 
            category: 'battle', 
            reward_xp: 100, 
            reward_badge: 'warrior' 
          } 
        },
        { 
          progress: 75, 
          completed_at: null, 
          reward_claimed: false, 
          achievements: { 
            name: 'Quick Thinker', 
            description: 'Answer 10 questions correctly', 
            icon: '⚡', 
            category: 'speed', 
            reward_xp: 150, 
            reward_badge: 'lightning' 
          } 
        },
        { 
          progress: 50, 
          completed_at: null, 
          reward_claimed: false, 
          achievements: { 
            name: 'Battle Ready', 
            description: 'Participate in 5 battles', 
            icon: '⚔️', 
            category: 'battle', 
            reward_xp: 200, 
            reward_badge: 'warrior' 
          } 
        }
      ]
      
      setLeaderboard(mockLeaderboard)
      setTournaments(mockTournaments)
      setMyTeams(mockTeams)
      setAchievements(mockAchievements)
      
      console.log('Mock data loaded successfully')
      
      // Try to fetch real data in background (optional)
      try {
        const [realLeaderboard, realTournaments, realTeams, realAchievements] = await Promise.allSettled([
          fetchLeaderboard(),
          fetchTournaments(),
          fetchMyTeams(),
          fetchAchievements()
        ])
        
        // Update with real data if available
        if (realLeaderboard.status === 'fulfilled' && realLeaderboard.value.length > 0) {
          setLeaderboard(realLeaderboard.value)
          console.log('Using real leaderboard data')
        }
        
        if (realTournaments.status === 'fulfilled' && realTournaments.value.length > 0) {
          setTournaments(realTournaments.value)
          console.log('Using real tournament data')
        }
        
        if (realTeams.status === 'fulfilled' && realTeams.value.length > 0) {
          setMyTeams(realTeams.value)
          console.log('Using real team data')
        }
        
        if (realAchievements.status === 'fulfilled' && realAchievements.value.length > 0) {
          setAchievements(realAchievements.value)
          console.log('Using real achievement data')
        }
        
      } catch (bgError) {
        console.log('Background data fetch failed, using mock data:', bgError.message)
      }
      
    } catch (error) {
      console.error('Error in fetchInitialData:', error)
      setConnectionError(true)
    } finally {
      setLoading(false)
    }
  }

  const mapLeaderboard = (data) =>
    data.map((row, i) => ({
      rank: i + 1,
      name: row.profiles?.full_name || 'Anonymous Scholar',
      streak: row.streak_days || 0,
      xp: row.total_xp || 0,
      wins: row.battle_wins || 0,
      losses: row.battle_losses || 0,
      winRate: row.battle_wins && row.battle_losses ? 
        Math.round((row.battle_wins / (row.battle_wins + row.battle_losses)) * 100) : 0,
      uni: row.profiles?.university || 'University Student',
      level: row.profiles?.level || 'L100',
      battleLevel: row.profiles?.battle_level || 1
    }))

  const fetchTournaments = async () => {
    try {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .in('status', ['registration', 'active'])
        .order('start_time', { ascending: true })
      
      return data || []
    } catch (error) {
      console.error('Error fetching tournaments:', error)
      // Return mock tournaments
      return [
        { id: 1, name: 'Weekly Championship', status: 'registration', start_time: new Date(Date.now() + 86400000).toISOString(), participants: 15, max_participants: 32 },
        { id: 2, name: 'Battle Royale', status: 'active', start_time: new Date().toISOString(), participants: 8, max_participants: 16 }
      ]
    }
  }

  const fetchMyTeams = async () => {
    try {
      const { data } = await supabase
        .from('team_members')
        .select(`
          role,
          teams!inner(id, name, tag, team_xp, team_level, wins, losses, current_members, max_members)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      return data?.map(tm => tm.teams) || []
    } catch (error) {
      console.error('Error fetching teams:', error)
      return []
    }
  }

  const fetchAchievements = async () => {
    try {
      const { data } = await supabase
        .from('user_achievements')
        .select(`
          progress, completed_at, reward_claimed,
          achievements!inner(name, description, icon, category, reward_xp, reward_badge)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
      
      return data || []
    } catch (error) {
      console.log('Achievements fetch failed (400 expected), using mock data:', error.message)
      // Return mock achievements for demo
      return [
        { 
          progress: 100, 
          completed_at: new Date().toISOString(), 
          reward_claimed: false, 
          achievements: { 
            name: 'First Victory', 
            description: 'Win your first battle', 
            icon: '🏆', 
            category: 'battle', 
            reward_xp: 100, 
            reward_badge: 'warrior' 
          } 
        },
        { 
          progress: 75, 
          completed_at: null, 
          reward_claimed: false, 
          achievements: { 
            name: 'Quick Thinker', 
            description: 'Answer 10 questions correctly', 
            icon: '⚡', 
            category: 'speed', 
            reward_xp: 150, 
            reward_badge: 'lightning' 
          } 
        },
        { 
          progress: 50, 
          completed_at: null, 
          reward_claimed: false, 
          achievements: { 
            name: 'Battle Ready', 
            description: 'Participate in 5 battles', 
            icon: '⚔️', 
            category: 'battle', 
            reward_xp: 200, 
            reward_badge: 'warrior' 
          } 
        }
      ]
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Live user count
    const fetchLive = async () => {
      try {
        const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString()
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_active_at', fiveMinsAgo)
        setLiveCount(count || 1)
      } catch (error) {
        console.error('Error fetching live count:', error)
        setLiveCount(1) // Default fallback
      }
    }
    
    fetchLive()
    const liveInterval = setInterval(fetchLive, 60000)
    
    // User heartbeat
    const heartbeat = setInterval(async () => {
      try {
        await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id)
      } catch (error) {
        console.error('Error updating heartbeat:', error)
      }
    }, 30000)
    
    return () => {
      clearInterval(liveInterval)
      clearInterval(heartbeat)
    }
  }

  // Real-time Battle System
  const createBattle = async (battleType = 'duel', opponentId = null) => {
    try {
      setLoading(true)
      const sessionId = `luter_${Math.random().toString(36).substr(2, 9)}`
      
      const { data: battle, error: battleError } = await supabase
        .from('battles')
        .insert({
          battle_type: battleType,
          session_id: sessionId,
          status: 'waiting',
          time_limit_seconds: 120,
          question_count: 10,
          current_question: 0
        })
        .select()
        .single()
      
      if (battleError) throw battleError
      
      if (battle) {
        // Add challenger to battle_participants
        const { error: participantError } = await supabase
          .from('battle_participants')
          .insert({
            battle_id: battle.id,
            user_id: user.id,
            role: 'challenger',
            status: 'active'
          })
        
        if (participantError) throw participantError
        
        setCurrentBattle(battle)
        setBattlePhase('waiting')
        setShowBattleModal(true)
        setupBattleSubscription(battle.id)
        
        // If we have a specific opponent, we could notify them here
        if (opponentId) {
          // Logic for direct challenge notification
        }
      }
    } catch (error) {
      console.error('Error creating battle:', error)
      setBattlePhase('menu')
      setConnectionError(true)
    } finally {
      setLoading(false)
    }
  }

  const joinBattle = async (sessionId) => {
    try {
      setLoading(true)
      const { data: battle, error: fetchError } = await supabase
        .from('battles')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle()
      
      if (fetchError) throw fetchError
      
      if (battle && (battle.status === 'waiting' || battle.status === 'active')) {
        // Check if already a participant
        const { data: existingPart } = await supabase
          .from('battle_participants')
          .select('*')
          .eq('battle_id', battle.id)
          .eq('user_id', user.id)
          .maybeSingle()

        if (!existingPart) {
          // Add as opponent
          await supabase
            .from('battle_participants')
            .insert({
              battle_id: battle.id,
              user_id: user.id,
              role: 'opponent',
              status: 'active'
            })
          
          // Update battle status to active if it was waiting
          if (battle.status === 'waiting') {
            await supabase
              .from('battles')
              .update({ status: 'active', started_at: new Date().toISOString() })
              .eq('id', battle.id)
          }
        }
        
        setCurrentBattle(battle)
        setBattlePhase(battle.status === 'active' ? 'question' : 'waiting')
        setShowBattleModal(true)
        setupBattleSubscription(battle.id)
      } else {
        alert("This battle session is no longer available.")
      }
    } catch (error) {
      console.error('Error joining battle:', error)
      setConnectionError(true)
    } finally {
      setLoading(false)
    }
  }

  const setupBattleSubscription = (battleId) => {
    battleChannelRef.current = supabase
      .channel(`battle_${battleId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'battles', filter: `id=eq.${battleId}` },
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
    const oldBattle = payload.old
    setCurrentBattle(battle)
    
    if (battle.status === 'active' && battlePhase === 'waiting') {
      startBattle(battle)
    } else if (battle.status === 'active' && oldBattle && battle.current_question !== oldBattle.current_question) {
      // Opponent or System moved to next question
      handleNextQuestion(battle.current_question)
    } else if (battle.status === 'completed') {
      setBattlePhase('result')
      // Fetch final results/leaderboard for this battle
    }
  }

  const handleNewChatMessage = (payload) => {
    setBattleChat(prev => [...prev, payload.new])
  }

  const startBattle = async (battle) => {
    setLoading(true)
    // 1. Fetch or Generate questions
    const questions = await generateBattleQuestions(battle.id)
    
    if (questions && questions.length > 0) {
      setBattlePhase('question')
      presentQuestion(questions[0])
    }
    setLoading(false)
  }

  const generateBattleQuestions = async (battleId) => {
    try {
      // Check if questions already exist for this battle
      const { data: existing } = await supabase
        .from('battle_questions')
        .select('*')
        .eq('battle_id', battleId)
        .order('question_number', { ascending: true })
      
      if (existing && existing.length > 0) return existing

      // Only the first participant (challenger) should generate the questions
      // We check if we are the challenger for efficiency, but even if both try, 
      // the first one wins and the other will see existing questions.
      
      const userMsg = `Generate 10 challenging academic questions for a student in ${user?.faculty || 'General Studies'} at ${user?.university || 'University'}. Level: ${user?.level || '100'}.`
      
      const data = await callGroqAPI([{ role: 'user', content: userMsg }], GROQ_MODELS.SPEEDSTER, {
        temperature: 0.7,
        systemPromptOverride: GROQ_PROMPTS.MOCK_EXAM
      })

      let raw = data?.choices?.[0]?.message?.content?.trim() || ''
      if (raw.startsWith('```json')) raw = raw.slice(7)
      if (raw.startsWith('```')) raw = raw.slice(3)
      if (raw.endsWith('```')) raw = raw.slice(0, -3)
      
      const questionsData = JSON.parse(raw.trim())
      
      const dbQuestions = questionsData.map((q, i) => ({
        battle_id: battleId,
        question_text: q.question,
        question_type: 'multiple',
        options: q.options,
        correct_answer: q.options[q.correct_answer - 1], // Convert 1-indexed to string
        question_number: i
      }))

      const { data: inserted, error } = await supabase
        .from('battle_questions')
        .insert(dbQuestions)
        .select()

      if (error) throw error
      return inserted
    } catch (error) {
      console.error('Error generating questions:', error)
      return []
    }
  }

  const presentQuestion = (question) => {
    setBattleQuestion(question)
    setTimeLeft(20) // Standard 20s per question
    setBattleAnswer('')
    
    if (battleTimerRef.current) clearInterval(battleTimerRef.current)
    
    battleTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(battleTimerRef.current)
          if (!battleAnswer) submitAnswer('') // Auto-submit empty if time runs out
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const submitAnswer = async (answer) => {
    if (battleTimerRef.current) clearInterval(battleTimerRef.current)
    if (battleAnswer) return // Already answered
    
    setBattleAnswer(answer)
    const isCorrect = answer === battleQuestion.correct_answer
    const points = isCorrect ? Math.ceil(timeLeft * 10) : 0
    
    try {
      // Record participant progress
      const { data: currentPart } = await supabase
        .from('battle_participants')
        .select('correct_answers, total_answers')
        .eq('battle_id', currentBattle.id)
        .eq('user_id', user.id)
        .single()

      await supabase
        .from('battle_participants')
        .update({ 
          score: (battleResults.reduce((s, r) => s + r.points_earned, 0)) + points,
          correct_answers: (currentPart?.correct_answers || 0) + (isCorrect ? 1 : 0),
          total_answers: (currentPart?.total_answers || 0) + 1,
          status: 'active'
        })
        .eq('battle_id', currentBattle.id)
        .eq('user_id', user.id)

      setBattleResults(prev => [...prev, { 
        question_id: battleQuestion.id, 
        is_correct: isCorrect, 
        points_earned: points 
      }])
      
      setBattlePhase('answer')
      
      // If we are the one moving the battle forward (or just waiting for the next)
      // Usually, the app should wait for both to answer or time to expire.
      // For simplicity in this v1, we proceed after a delay if it's our turn to update.
      setTimeout(() => {
         moveBattleForward()
      }, 2000)

    } catch (error) {
      console.error('Error submitting answer:', error)
    }
  }

  const moveBattleForward = async () => {
    const nextIndex = currentBattle.current_question + 1
    if (nextIndex < 10) {
      await supabase
        .from('battles')
        .update({ current_question: nextIndex })
        .eq('id', currentBattle.id)
    } else {
      await supabase
        .from('battles')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('id', currentBattle.id)
      
      // Grant XP
      const totalScore = battleResults.reduce((s, r) => s + r.points_earned, 0)
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
      await supabase.from('profiles').update({ xp: (profile?.xp || 0) + totalScore }).eq('id', user.id)
    }
  }

  const handleNextQuestion = async (index) => {
    const { data: nextQuestion } = await supabase
      .from('battle_questions')
      .select('*')
      .eq('battle_id', currentBattle.id)
      .eq('question_number', index)
      .single()
    
    if (nextQuestion) {
      presentQuestion(nextQuestion)
      setBattlePhase('question')
    }
  }

  const findOpponent = async () => {
    setIsSearching(true)
    setMatchingStep(1)
    try {
      const { data: availableBattle } = await supabase
        .from('battles')
        .select('*, battle_participants(user_id)')
        .eq('status', 'waiting')
        .eq('battle_type', 'duel')
        .limit(1)
        .maybeSingle()
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      if (availableBattle) {
        setSearchTarget("Opponent Found!")
        setMatchingStep(2)
        await joinBattle(availableBattle.session_id)
      } else {
        setMatchingStep(3)
        await createBattle('duel', null)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
      setMatchingStep(0)
    }
  }

  const createInviteLink = async () => {
    try {
      setLoading(true)
      const sessionId = `luter_${Math.random().toString(36).substr(2, 9)}`
      
      // For the new real-time battle system, we don't need to create a mock battle
      // The BattleExamPage will handle the real-time connection
      const mockBattle = {
        id: `battle_${Math.random().toString(36).substr(2, 9)}`,
        session_id: sessionId,
        battle_type: 'duel',
        status: 'waiting',
        current_question: 0,
        time_limit_seconds: 120,
        question_count: 10,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        participants: [{
          id: 'host_player',
          name: user?.user_metadata?.full_name || user?.email || 'Host',
          isAnonymous: false,
          joinedAt: new Date().toISOString(),
          isCurrentPlayer: true
        }]
      }
      
      // Store in session storage for compatibility
      if (typeof window !== 'undefined') {
        window.BATTLE_SESSIONS = window.BATTLE_SESSIONS || new Map()
        window.BATTLE_SESSIONS.set(sessionId, mockBattle)
      }
      
      // Set the battle state immediately
      setCurrentBattle(mockBattle)
      setBattlePhase('waiting')
      setShowBattleModal(true)
      
      // Generate and copy the NEW battle link (using battle-exam route)
      const link = `${window.location.origin}/battle-exam/${mockBattle.session_id}`
      navigator.clipboard.writeText(link)
      setCopiedLink(true)
      
      setTimeout(() => setCopiedLink(false), 2000)
      
      console.log('Battle created with session ID:', mockBattle.session_id)
      console.log('NEW Battle link (real-time):', link)
      
    } catch (error) {
      console.error('Error creating invite link:', error)
    } finally {
      setLoading(false)
    }
  }

  const findQuickBattle = () => {
    // Navigate to Battle Exam page for matchmaking
    const sessionId = `luter_${Math.random().toString(36).substr(2, 9)}`
    navigate(`/battle-exam/${sessionId}`)
  }

  const joinTournament = async (tid) => {
    await supabase.from('tournament_participants').insert({ tournament_id: tid, user_id: user.id })
    fetchTournaments()
  }

  const sendBattleChat = async (msg) => {
    if (!msg.trim() || !currentBattle) return
    await supabase.from('battle_chat').insert({ battle_id: currentBattle.id, user_id: user.id, message: msg.trim() })
    setChatInput('')
  }

  const renderProps = {
    leaderboard: mapLeaderboard(leaderboard), loading, isMobile, tournaments, myTeams, achievements,
    activeBattles, findOpponent, createInviteLink, findQuickBattle,
    joinTournament, user, battlePhase, battleQuestion, battleAnswer,
    timeLeft, battleResults, spectatorMode, soundEnabled,
    setSoundEnabled, battleChat, chatInput, setChatInput,
    sendBattleChat, showBattleModal, setShowBattleModal, submitAnswer,
    currentBattle, copiedLink, setCopiedLink, searchTarget, isSearching, liveCount, setBattlePhase
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '40px', maxWidth: 1200, margin: '0 auto', fontFamily: 'inherit' }}>
      {connectionError && (
        <ConnectionErrorFallback onRetry={() => {
          setConnectionError(false)
          fetchInitialData()
        }} />
      )}
      <div style={{ marginBottom: 32, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: 20 }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(90deg, #f5eeff, #ffffff)', padding: '6px 14px', borderRadius: 99, marginBottom: 16, border: '1.5px solid #e9d5ff' }}>
            <Trophy size={14} color="#7a12cc" fill="#7a12cc" />
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7a12cc' }}>Arena v3.0</span>
          </div>
          <h1 style={{ fontSize: isMobile ? 32 : 44, fontWeight: 800, color: '#111', margin: '0 0 12px', letterSpacing: '-0.05em', lineHeight: 1 }}>Battle. <span style={{ color: '#7a12cc' }}>Conquer.</span></h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <p style={{ fontSize: isMobile ? 14 : 16, color: '#666', fontWeight: 500, margin: 0 }}>Epic multiplayer battles await</p>
            <div style={{ width: 1.5, height: 16, background: '#eee' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }} className="animate-pulse" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#111' }}>{liveCount} Online</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, background: '#f5eeff10', padding: '5px', borderRadius: 18, border: '1.5px solid #f5eeff', backdropFilter: 'blur(10px)', width: isMobile ? '100%' : 'auto' }}>
          {['leaderboard', 'arena', 'tournaments', 'teams', 'achievements'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: isMobile ? 1 : 'initial', padding: isMobile ? '8px 12px' : '10px 20px', borderRadius: 14, fontSize: 11, fontWeight: 900, background: activeTab === tab ? '#7a12cc' : 'transparent', color: activeTab === tab ? 'white' : '#7a12cc99', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }}>
              {tab}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' && renderLeaderboard(renderProps)}
        {activeTab === 'arena' && renderArena(renderProps)}
        {activeTab === 'tournaments' && renderTournaments(renderProps)}
        {activeTab === 'teams' && renderTeams(renderProps)}
        {activeTab === 'achievements' && renderAchievements(renderProps)}
      </AnimatePresence>
      {renderBattleModal(renderProps)}
    </div>
  )
}
