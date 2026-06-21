/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react'
import { useOutletContext, useNavigate, useParams } from 'react-router-dom'
import { 
  RiStackFill as MatchingIcon, 
  RiStackLine as StackerIcon, 
  RiGridFill as GridIcon, 
  RiGamepadFill as Gamepad,
  RiArrowLeftLine as ArrowLeft,
  RiFlashlightFill as BlitzIcon,
  RiUserFill as UserIcon,
  RiTeamFill as TeamIcon,
  RiBookOpenFill as BookIcon,
  RiHistoryFill as HistoryIcon,
  RiLayoutGridFill as ArenaIcon,
  RiLoader4Line as Loader,
  RiExternalLinkLine as LinkIcon,
  RiTrophyFill as TrophyIcon,
  RiCalendarEventFill as CalendarIcon,
  RiMoreFill as MoreIcon,
  RiBarChartBoxFill as StatsIcon
} from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import { playgroundService } from '../../services/playgroundService'
import { supabase } from '../../supabaseClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../services/creditService'
import { usePlanGate } from '../../hooks/usePlanGate'
import GameLobby from './playground/GameLobby'
import MatchingGame from './playground/MatchingGame'
import StackerGame from './playground/StackerGame'
import TermBuilderGame from './playground/TermBuilderGame'
import BrainBlitzGame from './playground/BrainBlitzGame'
import './arcade.css'

import { Cards, Stack, PuzzlePiece, Lightning, Brain, Keyboard, Folder, Hash, Sparkle, CaretRight, X, Fire, CoinVertical, Trophy, Target, Lock } from '@phosphor-icons/react'

const PLAYGROUND_GAMES = [
  { id: 'matching', name: 'Matching', icon: Cards, color: '#7c3aed', desc: 'Match terms with definitions as fast as you can.', tag: 'Memory' },
  { id: 'stacker', name: 'Stacker', icon: Stack, color: '#16a34a', desc: 'Build a tower by picking the correct definitions.', tag: 'Logic' },
  { id: 'term-builder', name: 'Term Builder', icon: PuzzlePiece, color: '#d97706', desc: 'Construct terms from scrambled letters.', tag: 'Spelling' },
  { id: 'brain-blitz', name: 'Brain Blitz', icon: Lightning, color: '#ef4444', desc: 'Rapid-fire Yes/No study challenge.', tag: 'Speed' },
  { id: 'knowledge-heist', name: 'Knowledge Heist', icon: Brain, color: '#ef4444', desc: 'Social deduction learning game. Find the thieves!', isHeist: true, tag: 'Social' }
]

export default function PlaygroundPage() {
  const { isMobile, user, profile } = useOutletContext()
  const navigate = useNavigate()
  const { roomId } = useParams()
  const { canMultiplayer, maxFiles, getLockedItemIds } = usePlanGate(profile)
  
  const [activeTab, setActiveTab] = useState('arena') // arena | history
  const [step, setStep] = useState('hub') // hub | quiz-material | clut-menu | clut-material | clut-topic | clut-code | content | game | mode | play
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [playMode, setPlayMode] = useState(null) // solo | multiplayer
  const [materials, setMaterials] = useState([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [showGamesDrawer, setShowGamesDrawer] = useState(false)
  
  const [room, setRoom] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [history, setHistory] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch materials (courses)
  useEffect(() => {
    if (user) {
      fetchUserCourses()
      fetchUserMaterials()
      fetchHistory()
    }
  }, [user])

  // Handle roomId from URL
  useEffect(() => {
    if (roomId && user) {
      resumeSession(roomId)
    } else if (!roomId) {
      setRoom(null)
      setStep('hub')
    }
  }, [roomId, user])

  const fetchUserCourses = async () => {
    const { data } = await supabase
      .from('user_courses')
      .select('*, courses(*)')
      .eq('user_id', user.id)
    
    if (data) {
      setCourses(data.filter(c => c.courses).map(c => c.courses))
    }
  }

  const fetchUserMaterials = async () => {
    const { data } = await supabase
      .from('materials')
      .select('id, title, file_name, type, extracted_text, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(40)

    if (data) setMaterials(data)
  }

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('playground_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setHistory(data)
  }

  const resumeSession = async (id) => {
    setLoading(true)
    try {
      const { data: roomData, error } = await supabase
        .from('playground_rooms')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error || !roomData) {
        navigate('/compete')
        return
      }

      setRoom(roomData)
      setStep('play')
      // Join if not already in (guest or user)
      await playgroundService.joinRoom(id, user.id)
      fetchParticipants(id)
    } catch (e) {
      navigate('/compete')
    } finally {
      setLoading(false)
    }
  }

  // Realtime Subscription
  useEffect(() => {
    let channel;
    
    if (roomId) {
      const init = async () => {
        setLoading(true)
        const { data } = await playgroundService.supabase
          .from('playground_rooms')
          .select('*')
          .eq('id', roomId)
          .single()
        
        if (data) {
          setRoom(data)
          channel = playgroundService.subscribeToRoom(roomId, (type, payload) => {
            if (type === 'room') {
              console.log("Host Room Update:", payload)
              setRoom(prev => ({ ...prev, ...payload }))
            } else {
              fetchParticipants()
            }
          })
          fetchParticipants()
        }
        setLoading(false)
      }
      init()
    }

    return () => {
      if (channel) {
        console.log("Cleaning up host room subscription")
        playgroundService.supabase.removeChannel(channel)
      }
    }
  }, [roomId])

  const fetchParticipants = async () => {
    if (!roomId) return
    try {
      const data = await playgroundService.getParticipants(roomId)
      setParticipants(data || [])
    } catch (e) {
      console.error('Fetch error:', e)
    }
  }

  const handleStartGame = async (modeOverride, gameOverride) => {
    const finalMode = modeOverride || playMode
    const finalGame = gameOverride || selectedGame
    if (!user || !finalGame || !selectedMaterial || !finalMode) return
    setLoading(true)
    try {
      // 1. Fetch materials for this course to see if we have text
      const { data: materials } = await supabase
        .from('materials')
        .select('title, extracted_text')
        .eq('course_id', selectedMaterial.id)
        .not('extracted_text', 'is', null)
        .limit(3)

      let finalDeck = []

      const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.PLAYGROUND_QUESTIONS, profile?.is_premium)
      if (!ok) { setLoading(false); return }
      
      // 2. Generate content using Groq (either from extracted text or just course info)
      const contextText = materials?.map(m => m.extracted_text).join('\n').substring(0, 3000)
      console.log("Generating questions with AI...")
      const aiQuestions = await playgroundService.generateAIQuestions(
        finalGame, 
        selectedMaterial.name + (contextText ? ` (Context: ${contextText})` : ''), 
        15
      )
      
      if (aiQuestions && aiQuestions.length > 0) {
        finalDeck = aiQuestions.map((q, i) => ({ ...q, id: `ai_${i}` }))
      }

      // 3. Last fallback
      if (finalDeck.length === 0) {
        finalDeck = [
          { id: 1, term: 'Study', definition: 'To apply oneself to learning' },
          { id: 2, term: 'Luter', definition: 'Your personal AI study companion' },
          { id: 3, term: 'Nebula', definition: 'Premium design system' },
          { id: 4, term: 'Champion', definition: 'A winner of a battle' },
          { id: 5, term: 'Focus', definition: 'Concentrated effort' }
        ]
      }

      const metadata = { 
        course_id: selectedMaterial.id,
        course_code: selectedMaterial.code,
        course_name: selectedMaterial.name,
        deck: finalDeck
      }
      
      const newRoom = await playgroundService.createRoom(finalGame, user.id, { mode: finalMode }, metadata)
      
      if (finalMode === 'solo') {
        await playgroundService.startGame(newRoom.id)
      }
      
      // MOVE TO SESSION URL
      navigate(`/playground/${newRoom.id}`)
    } catch (error) {
      console.error("Failed to start game:", error)
      showToast("Error setting up game. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = (nextGame) => {
    if (nextGame && typeof nextGame === 'string') {
      setSelectedGame(nextGame)
      handleStartGame(playMode, nextGame)
      return
    }
    if (roomId) {
      navigate('/compete')
    } else if (['quiz-material', 'clut-menu'].includes(step)) setStep('hub')
    else if (['clut-material', 'clut-topic', 'clut-code'].includes(step)) setStep('clut-menu')
    else if (step === 'mode') setStep('game')
    else if (step === 'game') setStep('content')
    else if (step === 'content') setStep('hub')
    else setStep('hub')
  }

  const filteredMaterials = materials.filter((material) => {
    const q = materialSearch.trim().toLowerCase()
    const name = `${material.title || ''} ${material.file_name || ''} ${material.type || ''}`.toLowerCase()
    return name.includes(q)
  })

  const lockedFiles = getLockedItemIds(materials, maxFiles)

  const openMaterialQuiz = (material) => {
    navigate(`/workstation?materialId=${encodeURIComponent(material.id)}&tool=quiz`)
  }

  const createClutCode = () => String(Math.floor(100000000 + Math.random() * 900000000))

  const openClutLive = async ({ material, topic, code } = {}) => {
    if (code) {
      navigate(`/clut/live/${encodeURIComponent(code)}`)
      return
    }
    if (!user?.id) return

    const { ok } = await checkAndDeductCredits(user?.id, CREDIT_COSTS.PLAYGROUND_QUESTIONS, profile?.is_premium)
    if (!ok) { setLoading(false); return }

    setLoading(true)
    const roomCode = createClutCode()
    const params = new URLSearchParams()
    const title = material?.title || material?.file_name || topic || 'Clut Live'
    try {
      const subject = material?.extracted_text
        ? `${title} Context: ${material.extracted_text.slice(0, 3500)}`
        : title
      const generated = await playgroundService.generateAIQuestions('clut-live', subject, 8)
      const deck = generated.length ? generated.slice(0, 8).map((item, index) => ({ ...item, id: `clut_${index}` })) : [
        { id: 'fallback_1', term: title, definition: `A quick recall question about ${title}` },
        { id: 'fallback_2', term: 'Study', definition: 'Focused practice to improve memory' },
        { id: 'fallback_3', term: 'Recall', definition: 'Retrieving information from memory' },
        { id: 'fallback_4', term: 'Mastery', definition: 'Knowing a topic deeply enough to use it' },
      ]

      await playgroundService.createRoom('clut-live', user.id, { mode: 'multiplayer' }, {
        clut_code: roomCode,
        source_type: material ? 'material' : 'topic',
        source_id: material?.id || null,
        title,
        topic: topic || null,
        deck,
      })

      if (material?.id) params.set('materialId', material.id)
      params.set('title', title)
      navigate(`/clut/live/${roomCode}?${params.toString()}`)
    } catch (error) {
      console.error('Failed to create Clut room:', error)
      showToast('Could not create Clut room. Try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const renderActiveGame = () => {
    if (!room) return null
    const commonProps = { 
      room, 
      participants, 
      user, 
      deck: room.metadata?.deck || [],
      onExit: handleBack,
      onFinish: async (scoreData) => {
        try {
          await playgroundService.saveSession(user.id, {
            game_type: room.game_type,
            course_code: selectedMaterial?.code || room.metadata?.course_code,
            course_name: selectedMaterial?.name || room.metadata?.course_name,
            score: scoreData.score,
            accuracy: scoreData.accuracy || 0,
            total_questions: scoreData.total || 0,
            participants: participants,
            game_metadata: room.metadata
          })
          fetchHistory()
        } catch (e) { console.error("History save failed:", e) }
      }
    }
    
    switch (room.game_type) {
      case 'matching': return <MatchingGame {...commonProps} />
      case 'stacker': return <StackerGame {...commonProps} />
      case 'term-builder': return <TermBuilderGame {...commonProps} />
      case 'brain-blitz': return <BrainBlitzGame {...commonProps} />
      default: return <div>Coming Soon</div>
    }
  }

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
            background: toast.type === 'error' ? '#ef4444' : '#16a34a',
            color: 'white', padding: '12px 24px', borderRadius: 20,
            fontWeight: 800, fontSize: 14, zIndex: 9999, whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}
        >
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Scholar stats
  const scholarLevel = profile?.level || 1
  const xpCurrent = profile?.xp || 0
  const xpMax = scholarLevel * 500
  const xpPercent = Math.min((xpCurrent / xpMax) * 100, 100)
  const streakDays = profile?.streak_days || 0
  const credits = profile?.credits ?? 0
  const recentMaterial = materials[0] || null
  const top3History = history.slice(0, 3)

  // Daily quests
  const dailyQuests = [
    { label: 'Review 1 study material', done: materials.length > 0 },
    { label: 'Play a solo practice game', done: history.some(h => new Date(h.created_at).toDateString() === new Date().toDateString()) },
    { label: 'Score 80%+ accuracy', done: history.some(h => h.accuracy >= 80 && new Date(h.created_at).toDateString() === new Date().toDateString()) },
  ]

  return (
    <div className="playground-root" style={{ 
      height: '100vh',
      overflow: roomId ? 'hidden' : 'auto', 
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "var(--font-display, 'DM Sans', sans-serif)"
    }}>
      {renderToast()}
      
      {/* ── Tab Bar ── */}
      {!roomId && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 40, 
          padding: '24px 0', 
          background: 'var(--arcade-card-bg)', 
          borderBottom: '1px solid var(--arcade-card-border)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          transition: 'background 0.3s ease, border-color 0.3s ease'
        }}>
          <button 
            onClick={() => { setActiveTab('arena'); setSelectedSession(null) }}
            style={{ 
              background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer',
              color: activeTab === 'arena' ? '#7c3aed' : 'var(--arcade-text-muted)',
              fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
              position: 'relative', fontFamily: 'inherit'
            }}
          >
            <ArenaIcon size={18} /> Arena
            {activeTab === 'arena' && <motion.div layoutId="tab-underline" className="tab-underline-indicator" />}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer',
              color: activeTab === 'history' ? '#7c3aed' : 'var(--arcade-text-muted)',
              fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
              position: 'relative', fontFamily: 'inherit'
            }}
          >
            <HistoryIcon size={18} /> History
            {activeTab === 'history' && <motion.div layoutId="tab-underline" className="tab-underline-indicator" />}
          </button>
        </div>
      )}

      <main style={{ 
        flex: 1, 
        padding: isMobile ? '24px 20px' : roomId ? '24px' : '48px',
        maxWidth: roomId ? '100%' : 1200,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        <AnimatePresence mode="wait">
          {roomId ? (
            <motion.div key="play-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <Loader className="animate-spin" size={32} color="#7c3aed" />
                    <p style={{ fontWeight: 700, color: '#7c3aed' }}>Luter is preparing your Arena...</p>
                  </div>
                ) : (room?.status === 'playing' || room?.status === 'finished' || (playMode === 'solo' && room?.status === 'waiting')) ? (
                  renderActiveGame()
                ) : room?.status === 'waiting' ? (
                  <GameLobby room={room} participants={participants} user={user} onStart={() => fetchParticipants()} onRefresh={() => fetchParticipants()} showToast={showToast} />
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--arcade-text-muted)' }}>Initializing session...</div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'arena' ? (
            <motion.div key="arena" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              
              <AnimatePresence mode="wait">
                {step === 'hub' && (
                  <motion.div key="hub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    {/* ── Hero Section ── */}
                    <ArcadeHero />

                    {/* ── Bento Grid ── */}
                    <div className="arcade-bento-grid">
                      
                      {/* Tile 1 — Scholar Profile (tall left) */}
                      <div className="arcade-glass-card bento-tile-tall" style={{ padding: isMobile ? 20 : 28 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                          {/* XP Ring */}
                          <div className="xp-avatar-container">
                            <svg className="xp-ring-svg" viewBox="0 0 80 80">
                              <circle className="xp-ring-bg" cx="40" cy="40" r="36" />
                              <circle 
                                className="xp-ring-fill" 
                                cx="40" cy="40" r="36"
                                stroke="#7c3aed"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - xpPercent / 100)}`}
                              />
                            </svg>
                            {profile?.avatar_url ? (
                              <img className="xp-avatar-img" src={profile.avatar_url} alt="" />
                            ) : (
                              <div className="xp-avatar-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserIcon size={28} color="var(--arcade-text-muted)" />
                              </div>
                            )}
                          </div>

                          <span style={{ fontSize: 11, fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                            Level {scholarLevel}
                          </span>
                          <strong style={{ fontSize: 18, fontWeight: 950, color: 'var(--arcade-text-primary)', marginBottom: 2 }}>
                            {profile?.full_name || profile?.username || 'Scholar'}
                          </strong>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--arcade-text-muted)', marginBottom: 16 }}>
                            {xpCurrent} / {xpMax} XP
                          </span>

                          {/* Streak & Credits */}
                          <div style={{ display: 'flex', gap: 12, marginBottom: 18, width: '100%', justifyContent: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: 'var(--arcade-inner-bg)', border: '1px solid var(--arcade-border-subtle)' }}>
                              <Fire size={16} weight="fill" color="#ef4444" />
                              <span style={{ fontSize: 13, fontWeight: 850, color: 'var(--arcade-text-primary)' }}>{streakDays}d</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: 'var(--arcade-inner-bg)', border: '1px solid var(--arcade-border-subtle)' }}>
                              <CoinVertical size={16} weight="fill" color="#f59e0b" />
                              <span style={{ fontSize: 13, fontWeight: 850, color: 'var(--arcade-text-primary)' }}>{credits}</span>
                            </div>
                          </div>

                          {/* Daily Quests */}
                          <div className="bento-quest-list">
                            <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--arcade-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, textAlign: 'left' }}>
                              Daily Quests
                            </span>
                            {dailyQuests.map((q, i) => (
                              <div key={i} className={`bento-quest-item ${q.done ? 'completed' : ''}`}>
                                <span style={{ width: 18, height: 18, borderRadius: 6, border: q.done ? '2px solid #16a34a' : '2px solid var(--arcade-text-muted)', background: q.done ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {q.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                                </span>
                                {q.label}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Tile 2 — Clut Live Battle Arena (wide top-right) */}
                      <div className="arcade-glass-card bento-tile-wide" style={{ padding: isMobile ? 20 : 28 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, border: '2px solid #f59e0b', background: 'rgba(245, 158, 11, 0.06)' }}>
                            <div className="clut-arena-pulse" />
                            <Sparkle size={18} weight="fill" color="#f59e0b" />
                            <span style={{ fontSize: 14, fontWeight: 950, color: 'var(--arcade-text-primary)' }}>Clut Live</span>
                          </div>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 650, color: 'var(--arcade-text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
                          Host a live quiz room — friends join with a code or link. Play from your materials or any topic.
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button className="arcade-btn-clut" style={{ padding: '12px 20px', fontSize: 13.5 }} onClick={() => setStep('clut-menu')}>
                            <Sparkle size={16} weight="fill" /> Host Room
                          </button>
                          <button className="arcade-btn-outline-clut" style={{ padding: '10px 16px' }} onClick={() => setStep('clut-code')}>
                            <Hash size={16} weight="bold" /> Join with Code
                          </button>
                        </div>
                      </div>

                      {/* Tile 3 — Quick Study (normal) */}
                      <div className="arcade-glass-card bento-tile-normal" style={{ padding: isMobile ? 18 : 24, cursor: recentMaterial ? 'pointer' : 'default' }} onClick={() => recentMaterial && openMaterialQuiz(recentMaterial)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Brain size={22} weight="duotone" />
                          </div>
                          <strong style={{ fontSize: 15, fontWeight: 950, color: 'var(--arcade-text-primary)' }}>Quick Study</strong>
                        </div>
                        {recentMaterial ? (
                          <>
                            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--arcade-text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 6 }}>
                              {recentMaterial.title || recentMaterial.file_name}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--arcade-text-muted)' }}>Tap to quiz from this material →</span>
                          </>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--arcade-text-muted)' }}>Upload a study material to get started</span>
                        )}
                      </div>

                      {/* Tile 4 — Cognitive Games Drawer Launcher (normal) */}
                      <div className="arcade-glass-card bento-tile-normal" style={{ padding: isMobile ? 18 : 24, cursor: 'pointer' }} onClick={() => setShowGamesDrawer(true)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Gamepad size={22} />
                          </div>
                          <strong style={{ fontSize: 15, fontWeight: 950, color: 'var(--arcade-text-primary)' }}>Arcade Games</strong>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {PLAYGROUND_GAMES.slice(0, 4).map(g => (
                            <span key={g.id} style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: `${g.color}12`, color: g.color, border: `1px solid ${g.color}22` }}>
                              {g.tag || g.name}
                            </span>
                          ))}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 650, color: 'var(--arcade-text-muted)', marginTop: 10, display: 'block' }}>
                          Matching · Stacker · Builder · Blitz →
                        </span>
                      </div>

                      {/* Tile 5 — Scoreboard Ledger (full width bottom) */}
                      <div className="arcade-glass-card bento-tile-full" style={{ padding: isMobile ? 18 : 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Trophy size={20} weight="fill" color="#7c3aed" />
                            <strong style={{ fontSize: 15, fontWeight: 950, color: 'var(--arcade-text-primary)' }}>Recent Scores</strong>
                          </div>
                          {history.length > 3 && (
                            <button 
                              onClick={() => setActiveTab('history')} 
                              style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                              View All →
                            </button>
                          )}
                        </div>
                        {top3History.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {top3History.map((session, i) => {
                              const game = PLAYGROUND_GAMES.find(g => g.id === session.game_type)
                              const date = new Date(session.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
                              return (
                                <div key={session.id} className="arcade-scoreboard-row" onClick={() => { setActiveTab('history'); setSelectedSession(session) }}>
                                  <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--arcade-text-muted)', width: 20 }}>#{i + 1}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 12, background: `${game?.color || '#7c3aed'}12`, color: game?.color || '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {game ? <game.icon size={18} /> : <ArenaIcon size={18} />}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                      <strong style={{ fontSize: 14, fontWeight: 850, color: 'var(--arcade-text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {session.course_code || game?.name || 'Game'}
                                      </strong>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--arcade-text-muted)' }}>{date}</span>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--arcade-text-muted)' }}>{session.accuracy || 0}%</span>
                                  <span className="scoreboard-score-badge">{session.score}</span>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--arcade-text-muted)', fontWeight: 650, fontSize: 14 }}>
                            No games played yet. Enter the arena to start!
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'quiz-material' && (
                  <motion.div key="quiz-material" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <MaterialPickPanel
                      title="Pick a material to quiz on"
                      subtitle="Choose from your uploaded materials. Luter will open the quiz workspace for that material."
                      materials={filteredMaterials}
                      search={materialSearch}
                      onSearch={setMaterialSearch}
                      lockedFiles={lockedFiles}
                      onSelect={openMaterialQuiz}
                      emptyAction={() => navigate('/backpack')}
                    />
                  </motion.div>
                )}

                {step === 'clut-menu' && (
                  <motion.div key="clut-menu" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <div className="arcade-glass-card" style={{ padding: isMobile ? 16 : 28 }}>
                      <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, border: '3px solid #f59e0b', color: 'var(--arcade-text-primary)', fontWeight: 900 }}>
                          <Sparkle size={20} weight="fill" /> Clut Live
                        </div>
                      </div>
                      <div style={{ border: '1px solid var(--arcade-card-border)', borderRadius: 18, overflow: 'hidden' }}>
                        <ClutMenuRow icon={Folder} title="Materials" desc="Quiz on a material" onClick={() => setStep('clut-material')} />
                        <ClutMenuRow icon={Sparkle} title="Any topic" desc="Quiz on anything" onClick={() => setStep('clut-topic')} />
                        <ClutMenuRow icon={Hash} title="Have a code?" desc="Play with your friends" onClick={() => setStep('clut-code')} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'clut-material' && (
                  <motion.div key="clut-material" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <MaterialPickPanel
                      title="Pick a material for Clut"
                      subtitle="This creates a live room that friends can join with a code or link."
                      materials={filteredMaterials}
                      search={materialSearch}
                      onSearch={setMaterialSearch}
                      lockedFiles={lockedFiles}
                      onSelect={(material) => openClutLive({ material })}
                      emptyAction={() => navigate('/backpack')}
                    />
                  </motion.div>
                )}

                {step === 'clut-topic' && (
                  <motion.div key="clut-topic" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <TopicPanel
                      title="Enter a topic to play"
                      value={topicInput}
                      onChange={setTopicInput}
                      placeholder="Enter any topic"
                      buttonLabel="Play"
                      onSubmit={() => topicInput.trim() && openClutLive({ topic: topicInput.trim() })}
                    />
                  </motion.div>
                )}

                {step === 'clut-code' && (
                  <motion.div key="clut-code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <TopicPanel
                      title="Enter a game code"
                      value={joinCode}
                      onChange={(value) => setJoinCode(value.toUpperCase())}
                      placeholder="Example: 209576910"
                      buttonLabel="Join game"
                      onSubmit={() => joinCode.trim() && navigate(`/clut/live/${encodeURIComponent(joinCode.trim())}`)}
                    />
                  </motion.div>
                )}

                {step === 'content' && (
                  <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                       <h1 className="arcade-title" style={{ fontSize: 28 }}>Other Arcade Games</h1>
                       <p style={{ color: 'var(--arcade-text-muted)', fontWeight: 500, marginTop: 8 }}>Select a course to power Matching, Stacker, Term Builder, or Brain Blitz.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                      {courses.map(course => (
                        <MaterialCard 
                          key={course.id} 
                          course={course} 
                          selected={selectedMaterial?.id === course.id}
                          onSelect={() => {
                            setSelectedMaterial(course)
                            setStep('game')
                          }} 
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'game' && (
                  <motion.div key="game" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <h2 className="arcade-title" style={{ fontSize: 24, textAlign: 'center', marginBottom: 32 }}>Choose Your Game</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
                      {PLAYGROUND_GAMES.map(game => (
                        <GameCard 
                          key={game.id} 
                          game={game} 
                          selected={selectedGame === game.id}
                          onSelect={() => {
                            if (game.isHeist) {
                              navigate('/heist')
                              return
                            }
                            setSelectedGame(game.id)
                            setStep('mode')
                          }} 
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 'mode' && (
                  <motion.div key="mode" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <h2 className="arcade-title" style={{ fontSize: 24, textAlign: 'center', marginBottom: 32 }}>How do you want to play?</h2>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <ModeCard 
                        icon={UserIcon} 
                        title="Solo Practice" 
                        desc="Sharpen your knowledge privately"
                        onSelect={() => { setPlayMode('solo'); handleStartGame('solo') }}
                        color="#7c3aed"
                        disabled={loading}
                      />
                      <ModeCard 
                        icon={TeamIcon} 
                        title={canMultiplayer ? 'Battle with Friends' : '🔒 Battle with Friends'}
                        desc={canMultiplayer ? 'Create a room and invite friends' : 'Pro & Beast feature — tap to upgrade'}
                        onSelect={() => {
                          if (!canMultiplayer) { navigate('/upgrade'); return }
                          setPlayMode('multiplayer')
                          handleStartGame('multiplayer')
                        }}
                        color={canMultiplayer ? '#16a34a' : '#94a3b8'}
                        disabled={loading || !canMultiplayer}
                      />
                    </div>
                    {loading && (
                      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                        <Loader className="animate-spin" size={32} color="#7c3aed" />
                        <p style={{ fontWeight: 700, color: '#7c3aed' }}>Luter is preparing your Arena...</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          ) : (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
              {!selectedSession ? (
                <>
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--arcade-text-primary)', marginBottom: 32 }}>Your Game History</h2>
                  {history.length === 0 ? (
                    <div className="arcade-glass-card" style={{ textAlign: 'center', padding: '80px 0' }}>
                      <div style={{ width: 64, height: 64, background: 'var(--arcade-inner-bg)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--arcade-text-muted)', margin: '0 auto 24px' }}>
                        <HistoryIcon size={32} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--arcade-text-secondary)' }}>No games played yet</h3>
                      <p style={{ color: 'var(--arcade-text-muted)', marginTop: 8 }}>Enter the Arena to start your first study session!</p>
                      <button className="arcade-btn-primary" onClick={() => setActiveTab('arena')} style={{ marginTop: 24, padding: '12px 24px' }}>
                        Go to Arena
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {history.map(session => (
                        <HistoryItem key={session.id} session={session} onClick={() => setSelectedSession(session)} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <SessionOverview session={selectedSession} onBack={() => setSelectedSession(null)} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Games Slide-Out Drawer ── */}
      <AnimatePresence>
        {showGamesDrawer && (
          <>
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGamesDrawer(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                zIndex: 100
              }}
            />
            <motion.div
              key="drawer-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: isMobile ? '100%' : 420,
                background: 'var(--arcade-card-bg)',
                borderLeft: '1px solid var(--arcade-card-border)',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
                zIndex: 101, overflowY: 'auto',
                display: 'flex', flexDirection: 'column',
                transition: 'background 0.3s ease, border-color 0.3s ease'
              }}
            >
              <div style={{ padding: '24px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--arcade-card-border)' }}>
                <h2 style={{ fontSize: 20, fontWeight: 950, color: 'var(--arcade-text-primary)', margin: 0 }}>Arcade Games</h2>
                <button onClick={() => setShowGamesDrawer(false)} style={{ background: 'var(--arcade-inner-bg)', border: '1px solid var(--arcade-border-subtle)', borderRadius: 12, width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--arcade-text-primary)' }}>
                  <X size={20} weight="bold" />
                </button>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 650, color: 'var(--arcade-text-muted)', marginBottom: 8 }}>
                  Select a game, then pick a course to start playing.
                </p>
                {PLAYGROUND_GAMES.map(game => (
                  <motion.button
                    key={game.id}
                    type="button"
                    whileHover={{ y: -2, boxShadow: `0 8px 24px ${game.color}18` }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowGamesDrawer(false)
                      if (game.isHeist) {
                        navigate('/dashboard/heist')
                      } else {
                        setStep('content')
                      }
                    }}
                    className="arcade-game-card"
                    style={{ '--card-theme-color': game.color, '--card-glow-color': `${game.color}30`, textAlign: 'left', width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
                      <div style={{ width: 50, height: 50, borderRadius: 16, background: `${game.color}12`, color: game.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <game.icon size={26} weight="duotone" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <strong style={{ fontSize: 16, fontWeight: 900, color: 'var(--arcade-text-primary)' }}>{game.name}</strong>
                          {game.tag && <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: `${game.color}12`, color: game.color }}>{game.tag}</span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--arcade-text-muted)', lineHeight: 1.4 }}>{game.desc}</span>
                      </div>
                      <CaretRight size={18} weight="bold" color="var(--arcade-text-muted)" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Sub-Components ─── */

function ArcadeHero() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <div style={{ width: 128, height: 128, margin: '0 auto 12px', borderRadius: 40, background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.12))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 18px 50px rgba(124,58,237,0.18)' }}>
        <Brain size={70} weight="duotone" color="#7c3aed" />
      </div>
      <h1 className="arcade-title">Arcade</h1>
      <p style={{ margin: '8px auto 0', color: 'var(--arcade-text-muted)', fontWeight: 650, maxWidth: 520 }}>Choose how you want to memorize today.</p>
    </div>
  )
}

function ArcadeBackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'var(--arcade-card-bg)', border: '1px solid var(--arcade-card-border)', color: 'var(--arcade-text-primary)', fontWeight: 850, cursor: 'pointer', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '10px 14px', boxShadow: '0 8px 24px rgba(15,23,42,0.06)', fontFamily: 'inherit', transition: 'background 0.3s ease, border-color 0.3s ease, color 0.3s ease' }}>
      <ArrowLeft /> Back
    </button>
  )
}

function ArcadeChoiceCard({ icon: Icon, title, desc, color, selected, onClick }) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        minHeight: 210,
        background: selected ? `${color}0f` : 'var(--arcade-card-bg)',
        border: `3px solid ${selected ? color : 'var(--arcade-card-border)'}`,
        borderRadius: 22,
        cursor: 'pointer',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontFamily: 'inherit',
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}
    >
      <div style={{ width: 76, height: 76, borderRadius: 24, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icon size={42} weight="duotone" />
      </div>
      <strong style={{ color: 'var(--arcade-text-primary)', fontSize: 18, fontWeight: 950 }}>{title}</strong>
      <span style={{ color: 'var(--arcade-text-secondary)', fontSize: 14, fontWeight: 650, marginTop: 6 }}>{desc}</span>
    </motion.button>
  )
}

function MaterialPickPanel({ title, subtitle, materials, search, onSearch, onSelect, lockedFiles = new Set(), emptyAction }) {
  return (
    <div className="arcade-glass-card" style={{ maxWidth: 860, margin: '0 auto', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: 'var(--arcade-text-primary)', fontWeight: 950 }}>{title}</h2>
        <p style={{ margin: '8px auto 0', color: 'var(--arcade-text-muted)', fontWeight: 650, maxWidth: 520 }}>{subtitle}</p>
      </div>
      <input
        className="arcade-input"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search materials"
        style={{ height: 52, padding: '0 18px', fontSize: 15, marginBottom: 18, borderRadius: 999 }}
      />
      <div style={{ border: '1px solid var(--arcade-card-border)', borderRadius: 18, overflow: 'hidden', maxHeight: 420, overflowY: 'auto' }}>
        {materials.length ? materials.map((material) => {
          const isLocked = lockedFiles.has(material.id)
          return (
            <button key={material.id} onClick={() => !isLocked && onSelect(material)} style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--arcade-card-border)', background: 'var(--arcade-card-bg)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: isLocked ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.2s ease', opacity: isLocked ? 0.6 : 1 }}>
              <span style={{ width: 46, height: 46, borderRadius: 16, background: 'var(--arcade-inner-bg)', color: 'var(--arcade-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Folder size={24} /></span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', color: 'var(--arcade-text-primary)', fontSize: 16, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{material.title || material.file_name || 'Untitled material'}</strong>
                <span style={{ color: 'var(--arcade-text-muted)', fontWeight: 650, fontSize: 13 }}>{material.type || 'material'} {material.extracted_text ? '• ready' : '• needs text'}</span>
              </span>
              {isLocked ? <Lock size={22} weight="bold" color="var(--arcade-text-muted)" /> : <CaretRight size={22} weight="bold" color="var(--arcade-text-muted)" />}
            </button>
          )
        }) : (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <Folder size={42} color="var(--arcade-text-muted)" />
            <h3 style={{ margin: '12px 0 6px', color: 'var(--arcade-text-primary)' }}>No materials found</h3>
            <p style={{ color: 'var(--arcade-text-muted)', fontWeight: 650 }}>Upload or search another material to start.</p>
            <button className="arcade-btn-primary" onClick={emptyAction} style={{ marginTop: 14, borderRadius: 999, padding: '12px 18px' }}>Open Backpack</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ClutMenuRow({ icon: Icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--arcade-card-border)', background: 'var(--arcade-card-bg)', padding: '22px 18px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'background 0.2s ease' }}>
      <span style={{ width: 52, height: 52, borderRadius: 18, background: 'var(--arcade-inner-bg)', color: 'var(--arcade-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={26} /></span>
      <span style={{ flex: 1 }}>
        <strong style={{ display: 'block', color: 'var(--arcade-text-primary)', fontSize: 17, fontWeight: 950 }}>{title}</strong>
        <span style={{ color: 'var(--arcade-text-secondary)', fontWeight: 650 }}>{desc}</span>
      </span>
      <CaretRight size={24} weight="bold" color="var(--arcade-text-muted)" />
    </button>
  )
}

function TopicPanel({ title, value, onChange, placeholder, buttonLabel, onSubmit }) {
  return (
    <div className="arcade-glass-card" style={{ padding: 28, minHeight: 360, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 }}>
        <span />
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 950, color: 'var(--arcade-text-primary)' }}>{title}</h2>
        <button type="button" onClick={() => onChange('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--arcade-text-primary)' }}><X size={24} /></button>
      </div>
      <input
        className="arcade-input"
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Enter') onSubmit() }}
        placeholder={placeholder}
        style={{ height: 54, padding: '0 18px', fontSize: 16, borderRadius: 999 }}
      />
      <button type="button" className="arcade-btn-primary" onClick={onSubmit} disabled={!value.trim()} style={{ marginTop: 'auto', width: '100%', height: 54, borderRadius: 999, fontSize: 16 }}>
        {buttonLabel}
      </button>
    </div>
  )
}

function SessionOverview({ session, onBack }) {
  const game = PLAYGROUND_GAMES.find(g => g.id === session.game_type)
  const date = new Date(session.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
      <ArcadeBackButton onClick={onBack} />

      <div className="arcade-glass-card" style={{ padding: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, background: `${game?.color || '#7c3aed'}10`, color: game?.color || '#7c3aed', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {game ? <game.icon size={32} /> : <ArenaIcon size={32} />}
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--arcade-text-primary)' }}>{session.course_code || 'General Arena'}</h2>
              <p style={{ color: 'var(--arcade-text-muted)', fontWeight: 600 }}>{session.course_name}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--arcade-text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <CalendarIcon size={16} /> {date}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
          <StatCard icon={TrophyIcon} color="#7c3aed" label="Final Score" value={session.score} sub="points" />
          <StatCard icon={StatsIcon} color="#16a34a" label="Accuracy" value={`${session.accuracy}%`} sub="correct" />
          <StatCard icon={Gamepad} color="#d97706" label="Game Mode" value={game?.name || session.game_type} sub="session" />
        </div>

        <div style={{ borderTop: '1px solid var(--arcade-card-border)', paddingTop: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--arcade-text-primary)', marginBottom: 20 }}>Participants</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {(session.participants || []).map((p, i) => (
              <div key={i} style={{ padding: '12px 20px', background: 'var(--arcade-inner-bg)', borderRadius: 16, border: '1px solid var(--arcade-border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: 'var(--arcade-card-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserIcon size={16} color="var(--arcade-text-muted)" />
                </div>
                <span style={{ fontWeight: 700, color: 'var(--arcade-text-primary)' }}>{p.guest_name || 'You'}</span>
                <span style={{ fontWeight: 800, color: '#7c3aed' }}>{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ icon: Icon, color, label, value, sub }) {
  return (
    <div style={{ background: 'var(--arcade-inner-bg)', padding: 24, borderRadius: 24, border: '1px solid var(--arcade-border-subtle)', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
      <div style={{ color, marginBottom: 12 }}><Icon size={24} /></div>
      <div style={{ fontSize: 13, color: 'var(--arcade-text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--arcade-text-primary)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--arcade-text-muted)', fontWeight: 600 }}>{sub}</div>
    </div>
  )
}

function MaterialCard({ course, selected, onSelect }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
      onClick={onSelect}
      className="arcade-glass-card"
      style={{
        padding: '28px 24px', 
        border: `2px solid ${selected ? '#7c3aed' : 'var(--arcade-card-border)'}`,
        cursor: 'pointer', 
        position: 'relative',
      }}
    >
      <div style={{ 
        width: 44, height: 44, 
        background: selected ? '#7c3aed' : 'rgba(124, 58, 237, 0.08)', 
        color: selected ? 'white' : '#7c3aed', 
        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
        transition: 'all 0.2s'
      }}>
        <BookIcon size={22} />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--arcade-text-primary)', marginBottom: 4 }}>{course.code}</h3>
      <p style={{ fontSize: 14, color: 'var(--arcade-text-muted)', fontWeight: 500 }}>{course.name}</p>
    </motion.div>
  )
}

function GameCard({ game, onSelect, selected }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className="arcade-glass-card"
      style={{
        padding: 32, 
        border: `2px solid ${selected ? game.color : 'var(--arcade-card-border)'}`,
        cursor: 'pointer', textAlign: 'center', 
      }}
    >
      <div style={{ 
        width: 64, height: 64, 
        background: selected ? game.color : `${game.color}15`, 
        color: selected ? 'white' : game.color, 
        borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
        transition: 'all 0.2s'
      }}>
        <game.icon size={32} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--arcade-text-primary)', marginBottom: 8 }}>{game.name}</h3>
      <p style={{ fontSize: 14, color: 'var(--arcade-text-muted)', fontWeight: 500, lineHeight: 1.5 }}>{game.desc}</p>
    </motion.div>
  )
}

function ModeCard({ icon: Icon, title, desc, onSelect, color, disabled }) {
  return (
    <motion.div
      whileHover={disabled ? {} : { y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? null : onSelect}
      className="arcade-glass-card"
      style={{
        padding: 28, 
        cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 24,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} />
      </div>
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--arcade-text-primary)', marginBottom: 2 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--arcade-text-muted)', fontWeight: 500 }}>{desc}</p>
      </div>
    </motion.div>
  )
}

function HistoryItem({ session, onClick }) {
  const game = PLAYGROUND_GAMES.find(g => g.id === session.game_type)
  const date = new Date(session.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
  
  return (
    <motion.div
      whileHover={{ scale: 1.01, borderColor: '#7c3aed' }}
      onClick={onClick}
      className="arcade-glass-card"
      style={{
        padding: 20,
        display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer',
      }}
    >
      <div style={{ width: 48, height: 48, background: `${game?.color || '#7c3aed'}10`, color: game?.color || '#7c3aed', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {game ? <game.icon size={24} /> : <ArenaIcon size={24} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--arcade-text-primary)' }}>{session.course_code || 'General'}</h4>
          <span style={{ fontSize: 12, color: 'var(--arcade-text-muted)', fontWeight: 600 }}>• {date}</span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--arcade-text-muted)', fontWeight: 500 }}>{game?.name || session.game_type} session</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed' }}>{session.score}</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--arcade-text-muted)', textTransform: 'uppercase' }}>Points</div>
      </div>
      <div style={{ marginLeft: 12, color: 'var(--arcade-text-muted)' }}>
        <LinkIcon size={20} />
      </div>
    </motion.div>
  )
}