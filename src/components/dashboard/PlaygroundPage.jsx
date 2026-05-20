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
import GameLobby from './playground/GameLobby'
import MatchingGame from './playground/MatchingGame'
import StackerGame from './playground/StackerGame'
import TermBuilderGame from './playground/TermBuilderGame'
import BrainBlitzGame from './playground/BrainBlitzGame'

import { Cards, Stack, PuzzlePiece, Lightning, Brain, Keyboard } from '@phosphor-icons/react'

const PLAYGROUND_GAMES = [
  { id: 'matching', name: 'Matching', icon: Cards, color: '#7c3aed', desc: 'Match terms with definitions as fast as you can.' },
  { id: 'stacker', name: 'Stacker', icon: Stack, color: '#16a34a', desc: 'Build a tower by picking the correct definitions.' },
  { id: 'term-builder', name: 'Term Builder', icon: PuzzlePiece, color: '#d97706', desc: 'Construct terms from scrambled letters.' },
  { id: 'brain-blitz', name: 'Brain Blitz', icon: Lightning, color: '#ef4444', desc: 'Rapid-fire Yes/No study challenge.' }
]

export default function PlaygroundPage() {
  const { isMobile, user } = useOutletContext()
  const navigate = useNavigate()
  const { roomId } = useParams()
  
  const [activeTab, setActiveTab] = useState('arena') // arena | history
  const [step, setStep] = useState('content') // content | game | mode | play
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [selectedGame, setSelectedGame] = useState(null)
  const [playMode, setPlayMode] = useState(null) // solo | multiplayer
  
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
      fetchHistory()
    }
  }, [user])

  // Handle roomId from URL
  useEffect(() => {
    if (roomId && user) {
      resumeSession(roomId)
    } else if (!roomId) {
      setRoom(null)
      setStep('content')
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
        navigate('/dashboard/compete')
        return
      }

      setRoom(roomData)
      setStep('play')
      // Join if not already in (guest or user)
      await playgroundService.joinRoom(id, user.id)
      fetchParticipants(id)
    } catch (e) {
      navigate('/dashboard/compete')
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
      navigate(`/dashboard/playground/${newRoom.id}`)
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
      navigate('/dashboard/compete')
    } else if (step === 'mode') setStep('game')
    else if (step === 'game') setStep('content')
    else setStep('content')
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
                {step === 'content' && (
                  <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div style={{ textAlign: 'center', marginBottom: 40 }}>
                       <h1 style={{ fontSize: 32, fontWeight: 900, color: '#111', marginBottom: 8 }}>Study Arena</h1>
                       <p style={{ color: '#64748b', fontWeight: 500 }}>Select a course to start your study session</p>
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
                      <button onClick={() => setActiveTab('arena')} style={{ marginTop: 24, padding: '12px 24px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>
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
