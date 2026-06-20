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
import GameLobby from './playground/GameLobby'
import MatchingGame from './playground/MatchingGame'
import StackerGame from './playground/StackerGame'
import TermBuilderGame from './playground/TermBuilderGame'
import BrainBlitzGame from './playground/BrainBlitzGame'

import { Cards, Stack, PuzzlePiece, Lightning, Brain, Keyboard, Folder, Hash, Sparkle, CaretRight, X } from '@phosphor-icons/react'

const PLAYGROUND_GAMES = [
  { id: 'matching', name: 'Matching', icon: Cards, color: '#7c3aed', desc: 'Match terms with definitions as fast as you can.' },
  { id: 'stacker', name: 'Stacker', icon: Stack, color: '#16a34a', desc: 'Build a tower by picking the correct definitions.' },
  { id: 'term-builder', name: 'Term Builder', icon: PuzzlePiece, color: '#d97706', desc: 'Construct terms from scrambled letters.' },
  { id: 'brain-blitz', name: 'Brain Blitz', icon: Lightning, color: '#ef4444', desc: 'Rapid-fire Yes/No study challenge.' },
  { id: 'knowledge-heist', name: 'Knowledge Heist', icon: Brain, color: '#ef4444', desc: 'Social deduction learning game. Find the thieves!', isHeist: true }
]

export default function PlaygroundPage() {
  const { isMobile, user, profile } = useOutletContext()
  const navigate = useNavigate()
  const { roomId } = useParams()
  
  const [activeTab, setActiveTab] = useState('arena') // arena | history
  const [step, setStep] = useState('hub') // hub | quiz-material | clut-menu | clut-material | clut-topic | clut-code | content | game | mode | play
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [playMode, setPlayMode] = useState(null) // solo | multiplayer
  const [materials, setMaterials] = useState([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [joinCode, setJoinCode] = useState('')
  
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
    return !q || name.includes(q)
  })

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

  return (
    <div className="playground-root" style={{ 
      height: '100vh',
      overflow: roomId ? 'hidden' : 'auto', 
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {renderToast()}
      
      {!roomId && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 40, 
          padding: '24px 0', 
          background: 'white', 
          borderBottom: '1px solid #f1f5f9',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <button 
            onClick={() => { setActiveTab('arena'); setSelectedSession(null) }}
            style={{ 
              background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer',
              color: activeTab === 'arena' ? '#7c3aed' : '#94a3b8',
              fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
              position: 'relative'
            }}
          >
            <ArenaIcon size={18} /> Arena
            {activeTab === 'arena' && <motion.div layoutId="tab-underline" style={{ position: 'absolute', bottom: -24, left: 0, right: 0, height: 3, background: '#7c3aed', borderRadius: '3px 3px 0 0' }} />}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            style={{ 
              background: 'none', border: 'none', padding: '8px 12px', cursor: 'pointer',
              color: activeTab === 'history' ? '#7c3aed' : '#94a3b8',
              fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
              position: 'relative'
            }}
          >
            <HistoryIcon size={18} /> History
            {activeTab === 'history' && <motion.div layoutId="tab-underline" style={{ position: 'absolute', bottom: -24, left: 0, right: 0, height: 3, background: '#7c3aed', borderRadius: '3px 3px 0 0' }} />}
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
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>Initializing session...</div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'arena' ? (
            <motion.div key="arena" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              
              <AnimatePresence mode="wait">
                {step === 'hub' && (
                  <motion.div key="hub" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    <ArcadeHero />
                    <div style={{ maxWidth: 820, margin: '0 auto', background: 'white', borderRadius: 28, padding: 18, border: '1px solid #e2e8f0', boxShadow: '0 24px 80px rgba(15,23,42,0.10)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
                        <ArcadeChoiceCard
                          icon={Brain}
                          title="Memorize"
                          desc="Quiz from your materials"
                          color="#22c55e"
                          selected
                          onClick={() => setStep('quiz-material')}
                        />
                        <ArcadeChoiceCard
                          icon={Sparkle}
                          title="Clut"
                          desc="Live quiz with friends"
                          color="#f59e0b"
                          onClick={() => setStep('clut-menu')}
                        />
                        <ArcadeChoiceCard
                          icon={Gamepad}
                          title="Other games"
                          desc="Matching, Stacker, Blitz"
                          color="#7c3aed"
                          onClick={() => setStep('content')}
                        />
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
                      onSelect={openMaterialQuiz}
                      emptyAction={() => navigate('/backpack')}
                    />
                  </motion.div>
                )}

                {step === 'clut-menu' && (
                  <motion.div key="clut-menu" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>
                    <ArcadeBackButton onClick={handleBack} />
                    <div style={{ background: 'white', borderRadius: 28, border: '1px solid #e2e8f0', padding: isMobile ? 16 : 28, boxShadow: '0 24px 80px rgba(15,23,42,0.10)' }}>
                      <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, border: '3px solid #f59e0b', color: '#111827', fontWeight: 900 }}>
                          <Sparkle size={20} weight="fill" /> Clut Live
                        </div>
                      </div>
                      <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden' }}>
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
                       <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111', marginBottom: 8 }}>Other Arcade Games</h1>
                       <p style={{ color: '#64748b', fontWeight: 500 }}>Select a course to power Matching, Stacker, Term Builder, or Brain Blitz.</p>
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
                    <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ArrowLeft /> Back
                    </button>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32, textAlign: 'center' }}>Choose Your Game</h2>
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
                    <button onClick={handleBack} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ArrowLeft /> Back
                    </button>
                    <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32, textAlign: 'center' }}>How do you want to play?</h2>
                    
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
                        title="Battle with Friends" 
                        desc="Create a room and invite friends"
                        onSelect={() => { setPlayMode('multiplayer'); handleStartGame('multiplayer') }}
                        color="#16a34a"
                        disabled={loading}
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
                  <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111', marginBottom: 32 }}>Your Game History</h2>
                  {history.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', background: 'white', borderRadius: 32, border: '2px dashed #e2e8f0' }}>
                      <div style={{ width: 64, height: 64, background: '#f8fafc', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', margin: '0 auto 24px' }}>
                        <HistoryIcon size={32} />
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#64748b' }}>No games played yet</h3>
                      <p style={{ color: '#94a3b8', marginTop: 8 }}>Enter the Arena to start your first study session!</p>
                      <button onClick={() => setActiveTab('arena')} style={{ marginTop: 24, padding: '12px 24px', background: '#98FF98', color: '#166534', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
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
    </div>
  )
}

function ArcadeHero() {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <div style={{ width: 128, height: 128, margin: '0 auto 12px', borderRadius: 40, background: 'linear-gradient(135deg, #ede9fe, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 18px 50px rgba(124,58,237,0.18)' }}>
        <Brain size={70} weight="duotone" color="#7c3aed" />
      </div>
      <h1 style={{ margin: 0, color: '#0f172a', fontSize: 34, fontWeight: 950, letterSpacing: '-0.02em' }}>Arcade</h1>
      <p style={{ margin: '8px auto 0', color: '#64748b', fontWeight: 650, maxWidth: 520 }}>Choose how you want to memorize today.</p>
    </div>
  )
}

function ArcadeBackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'white', border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 850, cursor: 'pointer', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '10px 14px', boxShadow: '0 8px 24px rgba(15,23,42,0.06)' }}>
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
        background: selected ? `${color}0f` : 'white',
        border: `3px solid ${selected ? color : '#e2e8f0'}`,
        borderRadius: 22,
        cursor: 'pointer',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ width: 76, height: 76, borderRadius: 24, background: `${color}18`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icon size={42} weight="duotone" />
      </div>
      <strong style={{ color: '#0f172a', fontSize: 18, fontWeight: 950 }}>{title}</strong>
      <span style={{ color: '#475569', fontSize: 14, fontWeight: 650, marginTop: 6 }}>{desc}</span>
    </motion.button>
  )
}

function MaterialPickPanel({ title, subtitle, materials, search, onSearch, onSelect, emptyAction }) {
  return (
    <div style={{ maxWidth: 860, margin: '0 auto', background: 'white', borderRadius: 28, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 24px 80px rgba(15,23,42,0.10)' }}>
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: '#0f172a', fontWeight: 950 }}>{title}</h2>
        <p style={{ margin: '8px auto 0', color: '#64748b', fontWeight: 650, maxWidth: 520 }}>{subtitle}</p>
      </div>
      <input
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Search materials"
        style={{ width: '100%', height: 52, border: '3px solid #3b82f6', borderRadius: 999, padding: '0 18px', fontSize: 15, fontWeight: 650, outline: 'none', marginBottom: 18 }}
      />
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 18, overflow: 'hidden', maxHeight: 420, overflowY: 'auto' }}>
        {materials.length ? materials.map((material) => (
          <button key={material.id} onClick={() => onSelect(material)} style={{ width: '100%', border: 'none', borderBottom: '1px solid #e2e8f0', background: 'white', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ width: 46, height: 46, borderRadius: 16, background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Folder size={24} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', color: '#0f172a', fontSize: 16, fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{material.title || material.file_name || 'Untitled material'}</strong>
              <span style={{ color: '#64748b', fontWeight: 650, fontSize: 13 }}>{material.type || 'material'} {material.extracted_text ? '• ready' : '• needs text'}</span>
            </span>
            <CaretRight size={22} weight="bold" color="#334155" />
          </button>
        )) : (
          <div style={{ padding: 36, textAlign: 'center' }}>
            <Folder size={42} color="#94a3b8" />
            <h3 style={{ margin: '12px 0 6px', color: '#0f172a' }}>No materials found</h3>
            <p style={{ color: '#64748b', fontWeight: 650 }}>Upload or search another material to start.</p>
            <button onClick={emptyAction} style={{ marginTop: 14, border: 'none', background: '#98FF98', color: '#166534', borderRadius: 999, padding: '12px 18px', fontWeight: 900, cursor: 'pointer' }}>Open Backpack</button>
          </div>
        )}
      </div>
    </div>
  )
}

function ClutMenuRow({ icon: Icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} style={{ width: '100%', border: 'none', borderBottom: '1px solid #e2e8f0', background: 'white', padding: '22px 18px', display: 'flex', alignItems: 'center', gap: 18, cursor: 'pointer', textAlign: 'left' }}>
      <span style={{ width: 52, height: 52, borderRadius: 18, background: '#f1f5f9', color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={26} /></span>
      <span style={{ flex: 1 }}>
        <strong style={{ display: 'block', color: '#0f172a', fontSize: 17, fontWeight: 950 }}>{title}</strong>
        <span style={{ color: '#475569', fontWeight: 650 }}>{desc}</span>
      </span>
      <CaretRight size={24} weight="bold" color="#334155" />
    </button>
  )
}

function TopicPanel({ title, value, onChange, placeholder, buttonLabel, onSubmit }) {
  return (
    <div style={{ background: 'white', borderRadius: 22, border: '1px solid #e2e8f0', padding: 28, minHeight: 360, display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(15,23,42,0.10)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 34 }}>
        <span />
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 950, color: '#0f172a' }}>{title}</h2>
        <button type="button" onClick={() => onChange('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#0f172a' }}><X size={24} /></button>
      </div>
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Enter') onSubmit() }}
        placeholder={placeholder}
        style={{ width: '100%', height: 54, border: '3px solid #3b82f6', borderRadius: 999, padding: '0 18px', fontSize: 16, fontWeight: 650, outline: 'none' }}
      />
      <button type="button" onClick={onSubmit} disabled={!value.trim()} style={{ marginTop: 'auto', width: '100%', height: 54, border: 'none', borderRadius: 999, background: value.trim() ? '#98FF98' : '#94a3b8', color: value.trim() ? '#166534' : 'white', fontWeight: 950, fontSize: 16, cursor: value.trim() ? 'pointer' : 'not-allowed' }}>
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
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <ArrowLeft /> Back to History
      </button>

      <div style={{ background: 'white', borderRadius: 32, padding: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, background: `${game?.color || '#7c3aed'}10`, color: game?.color || '#7c3aed', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {game ? <game.icon size={32} /> : <ArenaIcon size={32} />}
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{session.course_code || 'General Arena'}</h2>
              <p style={{ color: '#64748b', fontWeight: 600 }}>{session.course_name}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              <CalendarIcon size={16} /> {date}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 48 }}>
          <StatCard icon={TrophyIcon} color="#7c3aed" label="Final Score" value={session.score} sub="points" />
          <StatCard icon={StatsIcon} color="#16a34a" label="Accuracy" value={`${session.accuracy}%`} sub="correct" />
          <StatCard icon={Gamepad} color="#d97706" label="Game Mode" value={game?.name || session.game_type} sub="session" />
        </div>

        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 40 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>Participants</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {(session.participants || []).map((p, i) => (
              <div key={i} style={{ padding: '12px 20px', background: '#f8fafc', borderRadius: 16, border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserIcon size={16} color="#64748b" />
                </div>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{p.guest_name || 'You'}</span>
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
    <div style={{ background: '#f8fafc', padding: 24, borderRadius: 24, border: '1px solid #f1f5f9' }}>
      <div style={{ color, marginBottom: 12 }}><Icon size={24} /></div>
      <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#111' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{sub}</div>
    </div>
  )
}

function MaterialCard({ course, selected, onSelect }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
      onClick={onSelect}
      style={{
        background: selected ? '#f5f3ff' : 'white', 
        padding: '28px 24px', 
        borderRadius: 24, 
        border: `2px solid ${selected ? '#7c3aed' : '#e2e8f0'}`,
        cursor: 'pointer', 
        transition: 'all 0.2s', 
        position: 'relative',
        boxShadow: selected ? '0 4px 12px rgba(124, 58, 237, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)'
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
      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{course.code}</h3>
      <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{course.name}</p>
    </motion.div>
  )
}

function GameCard({ game, onSelect, selected }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      style={{
        background: selected ? `${game.color}05` : 'white',
        padding: 32, 
        borderRadius: 24, 
        border: `2px solid ${selected ? game.color : '#e2e8f0'}`,
        cursor: 'pointer', textAlign: 'center', 
        boxShadow: selected ? `0 4px 12px ${game.color}20` : '0 2px 4px rgba(0,0,0,0.02)',
        transition: 'all 0.2s'
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
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>{game.name}</h3>
      <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>{game.desc}</p>
    </motion.div>
  )
}

function ModeCard({ icon: Icon, title, desc, onSelect, color, disabled }) {
  return (
    <motion.div
      whileHover={disabled ? {} : { y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.1)' }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? null : onSelect}
      style={{
        background: 'white', padding: 28, borderRadius: 24, border: '2px solid #e2e8f0',
        cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 24, transition: 'all 0.2s',
        opacity: disabled ? 0.6 : 1,
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}
    >
      <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} />
      </div>
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{desc}</p>
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
      style={{
        background: 'white', padding: 20, borderRadius: 20, border: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'all 0.2s'
      }}
    >
      <div style={{ width: 48, height: 48, background: `${game?.color || '#7c3aed'}10`, color: game?.color || '#7c3aed', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {game ? <game.icon size={24} /> : <ArenaIcon size={24} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{session.course_code || 'General'}</h4>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>• {date}</span>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{game?.name || session.game_type} session</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#7c3aed' }}>{session.score}</div>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Points</div>
      </div>
      <div style={{ marginLeft: 12, color: '#cbd5e1' }}>
        <LinkIcon size={20} />
      </div>
    </motion.div>
  )
}
