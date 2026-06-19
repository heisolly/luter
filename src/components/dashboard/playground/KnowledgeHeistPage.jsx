import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Skull, Users, Trophy, MessageSquare,
  ArrowLeft, Copy, CheckCircle, XCircle, Brain,
  Crown, Swords, ChevronRight, Send, Hash, AlertTriangle,
  Medal, Target
} from 'lucide-react'
import { heistService } from '../../../services/heistService'
import { supabase } from '../../../supabaseClient'
import { checkAndDeductCredits, CREDIT_COSTS } from '../../../services/creditService'

const GAME_FONT = "'Outfit','Inter',system-ui,sans-serif"
const PURPLE = '#7C3AED'
const MINT = '#98FF98'
const RED = '#EF4444'
const AMBER = '#F59E0B'
const TEXT = '#0F172A'
const MUTED = '#64748b'

/* ── Utility ── */
function getCurrentTimestamp() {
  return Date.now()
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5)
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getPlayerName(p) {
  return p?.profiles?.full_name || p?.guest_name || 'Scholar'
}

function getInitial(name) {
  return (name || 'S').charAt(0).toUpperCase()
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                       */
/* ═══════════════════════════════════════════════════════════════ */
export default function KnowledgeHeistPage() {
  const navigate = useNavigate()
  const { roomId: urlRoomId } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('menu') // menu, create, join, lobby, game
  const [room, setRoom] = useState(null)
  const [participants, setParticipants] = useState([])
  const [error, setError] = useState('')

  // Menu form state
  const [subject, setSubject] = useState('General')
  const [difficulty, setDifficulty] = useState('medium')
  const [maxPlayers, setMaxPlayers] = useState(8)
  const [joinCode, setJoinCode] = useState('')
  const [guestName] = useState(() => localStorage.getItem('luter-heist-guest') || `Scholar ${Math.floor(100 + Math.random() * 900)}`)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user || null)
      setLoading(false)
      if (urlRoomId && data?.user) {
        resumeRoom(urlRoomId)
      }
    })
  }, [urlRoomId])

  const resumeRoom = async (id) => {
    try {
      const roomData = await heistService.getRoom(id)
      if (!roomData) throw new Error('Room not found')
      setRoom(roomData)
      const parts = await heistService.getParticipants(id)
      setParticipants(parts)
      if (roomData.status === 'waiting') setView('lobby')
      else setView('game')
    } catch {
      setError('Could not find that room')
      setView('menu')
    }
  }

  const handleCreate = async () => {
    if (!user?.id) {
      setError('Please sign in to create a room')
      return
    }
    setLoading(true)
    try {
      const { ok } = await checkAndDeductCredits(user.id, CREDIT_COSTS.PLAYGROUND_QUESTIONS, false)
      if (!ok) { setError('Not enough AI credits'); setLoading(false); return }

      const newRoom = await heistService.createRoom(user.id, {
        subject,
        difficulty,
        maxPlayers
      })
      setRoom(newRoom)
      const parts = await heistService.getParticipants(newRoom.id)
      setParticipants(parts)
      setView('lobby')
    } catch (e) {
      setError(e.message || 'Failed to create room')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!joinCode.trim()) return
    setLoading(true)
    try {
      const code = joinCode.trim().toUpperCase()
      const { room: foundRoom } = await heistService.joinByCode(
        code,
        user?.id,
        user?.id ? null : guestName
      )
      setRoom(foundRoom)
      const parts = await heistService.getParticipants(foundRoom.id)
      setParticipants(parts)
      setView('lobby')
    } catch (e) {
      setError(e.message || 'Failed to join room')
    } finally {
      setLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!room || !user?.id) return
    await heistService.leaveRoom(room.id, user.id)
    setRoom(null)
    setParticipants([])
    setView('menu')
    navigate('/dashboard/compete')
  }

  const copyCode = () => {
    if (!room?.room_code) return
    navigator.clipboard.writeText(room.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [copied, setCopied] = useState(false)

  if (loading && !room) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: GAME_FONT }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: `4px solid ${PURPLE}20`, borderTopColor: PURPLE, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: MUTED, fontWeight: 700 }}>Loading Knowledge Heist...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: GAME_FONT, display: 'flex', flexDirection: 'column' }}>
      <AnimatePresence mode="wait">
        {view === 'menu' && (
          <HeistMenu
            key="menu"
            subject={subject} setSubject={setSubject}
            difficulty={difficulty} setDifficulty={setDifficulty}
            maxPlayers={maxPlayers} setMaxPlayers={setMaxPlayers}
            joinCode={joinCode} setJoinCode={setJoinCode}
            onCreate={handleCreate}
            onJoin={handleJoin}
            error={error}
            loading={loading}
            onBack={() => navigate('/dashboard/compete')}
          />
        )}
        {view === 'lobby' && room && (
          <HeistLobby
            key="lobby"
            room={room}
            participants={participants}
            user={user}
            guestName={guestName}
            onLeave={handleLeave}
            onRoomUpdate={(r, p) => { setRoom(r); setParticipants(p) }}
            onStart={() => setView('game')}
            copied={copied}
            onCopyCode={copyCode}
          />
        )}
        {view === 'game' && room && (
          <HeistGame
            key="game"
            room={room}
            participants={participants}
            user={user}
            guestName={guestName}
            onExit={() => { setRoom(null); setParticipants([]); setView('menu'); navigate('/dashboard/compete') }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MENU                                                            */
/* ═══════════════════════════════════════════════════════════════ */
function HeistMenu({ subject, setSubject, difficulty, setDifficulty, maxPlayers, setMaxPlayers, joinCode, setJoinCode, onCreate, onJoin, error, loading, onBack }) {
  const [mode, setMode] = useState('choose') // choose, create, join

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <button onClick={onBack} style={{ position: 'absolute', top: 24, left: 24, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: MUTED }}>
        <ArrowLeft size={18} /> Back
      </button>

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 96, height: 96, margin: '0 auto 20px', borderRadius: 28, background: `linear-gradient(135deg, ${PURPLE}, #A78BFA)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 12px 32px ${PURPLE}30` }}>
          <Swords size={48} color="white" />
        </div>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>Knowledge Heist</h1>
        <p style={{ margin: '10px auto 0', color: MUTED, fontWeight: 600, maxWidth: 420, lineHeight: 1.5 }}>
          A social deduction learning game. Find the Knowledge Thieves before they corrupt the team's knowledge!
        </p>
      </div>

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', padding: '12px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, marginBottom: 20, maxWidth: 480, width: '100%', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {mode === 'choose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 400, width: '100%' }}>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('create')}
            style={{
              background: `linear-gradient(135deg, ${PURPLE}, #6D28D9)`,
              color: 'white', border: 'none', borderRadius: 18, padding: '22px 28px',
              cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: `0 8px 24px ${PURPLE}35`
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Crown size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 17 }}>Create Room</div>
              <div style={{ fontWeight: 500, fontSize: 13, opacity: 0.8 }}>Host a new Knowledge Heist</div>
            </div>
            <ChevronRight size={20} style={{ marginLeft: 'auto' }} />
          </motion.button>

          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode('join')}
            style={{
              background: 'white', color: TEXT, border: '2px solid #e2e8f0', borderRadius: 18,
              padding: '22px 28px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 16
            }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PURPLE }}>
              <Hash size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 17 }}>Join with Code</div>
              <div style={{ fontWeight: 500, fontSize: 13, color: MUTED }}>Enter a 6-digit room code</div>
            </div>
            <ChevronRight size={20} style={{ marginLeft: 'auto', color: MUTED }} />
          </motion.button>
        </div>
      )}

      {mode === 'create' && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ maxWidth: 480, width: '100%', background: 'white', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
        >
          <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 900 }}>Create Room</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <FormField label="Subject">
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Biology, History" style={inputStyle} />
            </FormField>
            <FormField label="Difficulty">
              <div style={{ display: 'flex', gap: 8 }}>
                {['easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 12, border: `2px solid ${difficulty === d ? PURPLE : '#e2e8f0'}`,
                      background: difficulty === d ? `${PURPLE}10` : 'white',
                      color: difficulty === d ? PURPLE : MUTED, fontWeight: 800, cursor: 'pointer', textTransform: 'capitalize'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </FormField>
            <FormField label="Max Players (4-10)">
              <input type="number" min={4} max={10} value={maxPlayers} onChange={e => setMaxPlayers(Math.max(4, Math.min(10, Number(e.target.value))))} style={inputStyle} />
            </FormField>
            <button
              onClick={onCreate}
              disabled={loading}
              style={{
                width: '100%', padding: '16px', background: MINT, color: '#166534', border: 'none',
                borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8
              }}
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>
            <button onClick={() => setMode('choose')} style={{ background: 'none', border: 'none', color: MUTED, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {mode === 'join' && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ maxWidth: 480, width: '100%', background: 'white', borderRadius: 24, padding: 32, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.06)' }}
        >
          <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 900 }}>Join Room</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <FormField label="Room Code">
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 24, letterSpacing: '0.2em', fontWeight: 900 }}
              />
            </FormField>
            <button
              onClick={onJoin}
              disabled={loading || joinCode.length < 4}
              style={{
                width: '100%', padding: '16px', background: MINT, color: '#166534', border: 'none',
                borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: (loading || joinCode.length < 4) ? 'not-allowed' : 'pointer',
                marginTop: 8
              }}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
            <button onClick={() => setMode('choose')} style={{ background: 'none', border: 'none', color: MUTED, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function FormField({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 800, fontSize: 13, color: MUTED, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', height: 48, border: '2px solid #e2e8f0', borderRadius: 12, padding: '0 14px',
  fontSize: 15, fontWeight: 600, outline: 'none', boxSizing: 'border-box', fontFamily: GAME_FONT,
  color: TEXT, background: 'white'
}

/* ═══════════════════════════════════════════════════════════════ */
/*  LOBBY                                                           */
/* ═══════════════════════════════════════════════════════════════ */
function HeistLobby({ room, participants, user, guestName, onLeave, onRoomUpdate, onStart, copied, onCopyCode }) {
  const channelRef = useRef(null)
  const [isHost, setIsHost] = useState(false)
  const [myParticipant, setMyParticipant] = useState(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (!room?.id) return

    const init = async () => {
      const parts = await heistService.getParticipants(room.id)
      onRoomUpdate(room, parts)

      const me = parts.find(p => {
        if (user?.id && p.user_id) return p.user_id === user.id
        if (!user?.id && p.guest_name) return p.guest_name === guestName
        return false
      })
      setMyParticipant(me)
      setIsHost(room.created_by === user?.id)

      const ch = heistService.subscribeToRoom(room.id, async (type) => {
        if (type === 'room') {
          const r = await heistService.getRoom(room.id)
          const p = await heistService.getParticipants(room.id)
          onRoomUpdate(r, p)
          if (r.status === 'playing') onStart()
        } else if (type === 'participants') {
          const p = await heistService.getParticipants(room.id)
          onRoomUpdate(room, p)
        }
      })
      channelRef.current = ch
    }

    init()

    // Polling fallback: check room status every 3s in case realtime misses events
    const poll = setInterval(async () => {
      try {
        const r = await heistService.getRoom(room.id)
        if (r.status === 'playing') {
          clearInterval(poll)
          onStart()
          return
        }
        const p = await heistService.getParticipants(room.id)
        onRoomUpdate(r, p)
        const me = p.find(pt => {
          if (user?.id && pt.user_id) return pt.user_id === user.id
          if (!user?.id && pt.guest_name) return pt.guest_name === guestName
          return false
        })
        setMyParticipant(me)
      } catch (e) {
        console.error('Lobby poll error:', e)
      }
    }, 3000)

    return () => {
      clearInterval(poll)
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [room?.id])

  const handleReady = async () => {
    if (!myParticipant || toggling) return
    setToggling(true)
    try {
      await heistService.setReady(myParticipant.id, !myParticipant.is_ready)
      const p = await heistService.getParticipants(room.id)
      onRoomUpdate(room, p)
    } finally {
      setToggling(false)
    }
  }

  const handleStart = async () => {
    const others = participants.filter(p => p.user_id !== room.created_by)
    const everyoneReady = others.length === 0 || others.every(p => p.is_ready)
    if (!everyoneReady) {
      alert('Wait for all players to be ready!')
      return
    }
    try {
      await heistService.startGame(room.id)
      onStart()
    } catch (e) {
      alert(e.message || 'Failed to start game')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px' }}
    >
      <div style={{ maxWidth: 800, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: '#f5f3ff', borderRadius: 100, color: PURPLE, fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>
            <Users size={16} /> Waiting Room
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: TEXT, marginBottom: 8 }}>Knowledge Heist Lobby</h1>
          <p style={{ color: MUTED, fontWeight: 600 }}>Subject: <strong style={{ color: TEXT }}>{room.subject}</strong> • Difficulty: <strong style={{ color: TEXT }}>{room.difficulty}</strong></p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <button
            onClick={onCopyCode}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'white', border: '2px solid #e2e8f0', borderRadius: 16,
              padding: '14px 24px', cursor: 'pointer', fontFamily: GAME_FONT
            }}
          >
            <Hash size={20} color={PURPLE} />
            <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '0.15em', color: TEXT }}>{room.room_code}</span>
            {copied ? <CheckCircle size={20} color="#16A34A" /> : <Copy size={20} color={MUTED} />}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {participants.map(p => {
            const isMe = myParticipant?.id === p.id
            const isHostPlayer = p.user_id === room.created_by
            return (
              <motion.div
                key={p.id}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  background: 'white', borderRadius: 20, padding: 20,
                  border: `2px solid ${p.is_ready ? '#16A34A' : isMe ? PURPLE : '#e2e8f0'}`,
                  textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ width: 56, height: 56, borderRadius: 18, background: isMe ? PURPLE : '#f1f5f9', color: isMe ? 'white' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontWeight: 900, fontSize: 22 }}>
                  {p.profiles?.avatar_url ? (
                    <img src={p.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }} />
                  ) : (
                    getInitial(getPlayerName(p))
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>{isMe ? 'You' : getPlayerName(p)}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: p.is_ready ? '#16A34A' : '#94a3b8', marginTop: 4 }}>
                  {p.is_ready ? '✓ Ready' : 'Waiting'}
                </div>
                {isHostPlayer && (
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 800, color: AMBER }}>HOST</div>
                )}
              </motion.div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {!isHost && myParticipant && (
            <button
              onClick={handleReady}
              disabled={toggling}
              style={{
                padding: '14px 32px', borderRadius: 14, border: 'none',
                background: myParticipant.is_ready ? '#FEE2E2' : MINT,
                color: myParticipant.is_ready ? '#DC2626' : '#166534',
                fontWeight: 900, fontSize: 16, cursor: 'pointer'
              }}
            >
              {myParticipant.is_ready ? 'Not Ready' : "I'm Ready"}
            </button>
          )}
          {isHost && (
            <button
              onClick={handleStart}
              style={{
                padding: '14px 32px', borderRadius: 14, border: 'none',
                background: MINT, color: '#166534',
                fontWeight: 900, fontSize: 16, cursor: 'pointer'
              }}
            >
              Start Game
            </button>
          )}
          <button
            onClick={onLeave}
            style={{
              padding: '14px 24px', borderRadius: 14, border: '1.5px solid #e2e8f0',
              background: 'white', color: MUTED, fontWeight: 800, cursor: 'pointer'
            }}
          >
            Leave
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
          Need at least 4 players to start. Current: {participants.length}
        </p>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN GAME                                                       */
/* ═══════════════════════════════════════════════════════════════ */
function HeistGame({ room, participants, user, guestName, onExit }) {
  const [gameRoom, setGameRoom] = useState(room)
  const [gameParts, setGameParts] = useState(participants)
  const [currentRound, setCurrentRound] = useState(null)
  const [myParticipant, setMyParticipant] = useState(null)
  const [phase, setPhase] = useState('task') // task, discussion, voting, ended
  const channelRef = useRef(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState([])
  const [chat, setChat] = useState([])
  const [votes, setVotes] = useState([])
  const [roundNumber, setRoundNumber] = useState(1)
  const [integrity, setIntegrity] = useState(100)
  const [showRole, setShowRole] = useState(false)
  const [report, setReport] = useState(null)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  // Identify self
  useEffect(() => {
    const me = gameParts.find(p => {
      if (user?.id && p.user_id) return p.user_id === user.id
      if (!user?.id && p.guest_name) return p.guest_name === guestName
      return false
    })
    setMyParticipant(me)
  }, [gameParts, user, guestName])

  // Subscribe to room
  useEffect(() => {
    if (!room?.id) return

    const init = async () => {
      const r = await heistService.getRoom(room.id)
      const p = await heistService.getParticipants(room.id)
      const rnd = await heistService.getCurrentRound(room.id)
      setGameRoom(r)
      setGameParts(p)
      setIntegrity(r.integrity || 100)
      setRoundNumber(r.current_round || 1)
      setPhase(r.current_phase || 'task')
      setCurrentRound(rnd)

      const ch = heistService.subscribeToRoom(room.id, async (type) => {
        if (type === 'room') {
          const updated = await heistService.getRoom(room.id)
          setGameRoom(updated)
          setIntegrity(updated.integrity || 100)
          setRoundNumber(updated.current_round || 1)
          setPhase(updated.current_phase || 'task')

          if (updated.status === 'finished') {
            generateReport(updated)
          }
        } else if (type === 'participants') {
          const pts = await heistService.getParticipants(room.id)
          setGameParts(pts)
        } else if (type === 'rounds') {
          const rndCurrent = await heistService.getCurrentRound(room.id)
          setCurrentRound(rndCurrent)
        } else if (type === 'votes') {
          const latestRound = await heistService.getCurrentRound(room.id)
          if (latestRound?.id) {
            const vs = await heistService.getVotes(latestRound.id)
            setVotes(vs)
          }
        } else if (type === 'chat') {
          const msgs = await heistService.getChat(room.id, 50)
          setChat(msgs)
        }
      })
      channelRef.current = ch
    }

    init()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [room?.id])

  // Load questions whenever we enter the task phase
  useEffect(() => {
    if (!gameRoom || gameRoom.status !== 'playing' || phase !== 'task') return
    if (questions.length > 0 && answers.length === 0) return // Already loaded for this round

    const loadQuestions = async () => {
      setLoadingQuestions(true)
      setAnswers([])
      try {
        const qs = await heistService.generateQuestions(gameRoom.subject, gameRoom.difficulty, 5)
        setQuestions(qs)
      } catch (e) {
        console.error('Failed to load questions:', e)
      } finally {
        setLoadingQuestions(false)
      }
    }

    loadQuestions()
  }, [phase, gameRoom?.status, roundNumber])

  const generateReport = async (r) => {
    if (!user?.id || !r) return
    try {
      const rep = await heistService.generateReport(r.id, user.id)
      setReport(rep)
      if (rep) {
        await heistService.saveSession(user.id, r.id, {
          subject: r.subject,
          difficulty: r.difficulty,
          role: rep.role,
          result: rep.result,
          questionsAttempted: rep.questionsAttempted,
          correctAnswers: rep.correctAnswers,
          accuracy: rep.accuracy,
          topicsPracticed: rep.topicsPracticed,
          strengthAreas: rep.strengthAreas,
          weakAreas: rep.weakAreas,
          recommendations: rep.recommendations,
          awards: rep.awards
        })
      }
    } catch (e) {
      console.error('Report generation failed:', e)
    }
  }

  const resolveVoting = async () => {
    if (!currentRound || !gameRoom) return
    try {
      const roundVotes = await heistService.getVotes(currentRound.id)
      const voteCounts = {}
      roundVotes.forEach(v => {
        voteCounts[v.target_id] = (voteCounts[v.target_id] || 0) + 1
      })

      const aliveParts = gameParts.filter(p => p.is_alive)
      let maxVotes = 0
      let eliminatedCandidates = []

      aliveParts.forEach(p => {
        const count = voteCounts[p.id] || 0
        if (count > maxVotes) {
          maxVotes = count
          eliminatedCandidates = [p]
        } else if (count === maxVotes && count > 0) {
          eliminatedCandidates.push(p)
        }
      })

      let eliminatedPlayer = null
      if (eliminatedCandidates.length > 0) {
        eliminatedPlayer = eliminatedCandidates[Math.floor(Math.random() * eliminatedCandidates.length)]
      }

      if (eliminatedPlayer) {
        await heistService.eliminatePlayer(eliminatedPlayer.id)
        await heistService.sendChat(
          gameRoom.id,
          myParticipant?.id || null,
          `${getPlayerName(eliminatedPlayer)} was eliminated by vote. They were a ${eliminatedPlayer.role === 'thief' ? 'Knowledge Thief 🕵️' : 'Knowledge Agent 🛡️'}!`,
          true
        )
      } else {
        await heistService.sendChat(
          gameRoom.id,
          myParticipant?.id || null,
          "No one was eliminated this round due to lack of votes or a complete draw.",
          true
        )
      }

      const updatedParts = await heistService.getParticipants(gameRoom.id)
      setGameParts(updatedParts)

      const aliveAgents = updatedParts.filter(p => p.is_alive && p.role === 'agent')
      const aliveThieves = updatedParts.filter(p => p.is_alive && p.role === 'thief')

      let gameWinner = null
      if (integrity <= 0) {
        gameWinner = 'thieves'
      } else if (aliveThieves.length === 0 && aliveAgents.length > 0) {
        gameWinner = 'agents'
      } else if (aliveThieves.length >= aliveAgents.length && aliveAgents.length > 0) {
        gameWinner = 'thieves'
      }

      if (gameWinner) {
        await heistService.endGame(gameRoom.id, gameWinner)
      } else {
        await heistService.createNextRound(gameRoom.id, roundNumber + 1, integrity)
      }
    } catch (e) {
      console.error('Failed to resolve voting:', e)
    }
  }

  const handlePhaseTimeout = useCallback(async () => {
    if (!currentRound || !gameRoom) return
    try {
      if (phase === 'task') {
        await heistService.advancePhase(gameRoom.id, currentRound.id, 'discussion', integrity)
      } else if (phase === 'discussion') {
        await heistService.advancePhase(gameRoom.id, currentRound.id, 'voting', integrity)
      } else if (phase === 'voting') {
        await resolveVoting()
      }
    } catch (e) {
      console.error('Error handling phase timeout:', e)
    }
  }, [currentRound, gameRoom, phase, integrity, roundNumber, gameParts, myParticipant])

  // Timer countdown effect
  useEffect(() => {
    if (!currentRound?.phase_ends_at || gameRoom?.status !== 'playing') {
      setTimeLeft(0)
      return
    }

    const interval = setInterval(async () => {
      const endsAt = new Date(currentRound.phase_ends_at).getTime()
      const now = Date.now()
      const diff = Math.max(0, Math.floor((endsAt - now) / 1000))
      setTimeLeft(diff)

      const isHost = gameRoom.created_by === user?.id
      if (isHost && diff === 0) {
        clearInterval(interval)
        await handlePhaseTimeout()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentRound?.phase_ends_at, currentRound?.phase, gameRoom?.status, gameRoom?.created_by, user?.id, handlePhaseTimeout])

  // Host early transition check for task phase
  useEffect(() => {
    const isHost = gameRoom?.created_by === user?.id
    if (!isHost || phase !== 'task' || !currentRound || gameParts.length === 0) return

    const aliveParts = gameParts.filter(p => p.is_alive)
    if (aliveParts.length > 0 && aliveParts.every(p => p.is_ready)) {
      heistService.advancePhase(gameRoom.id, currentRound.id, 'discussion', integrity).catch(console.error)
    }
  }, [gameParts, phase, currentRound, gameRoom, user?.id, integrity])

  // Host early transition check for voting phase
  useEffect(() => {
    const isHost = gameRoom?.created_by === user?.id
    if (!isHost || phase !== 'voting' || !currentRound || gameParts.length === 0) return

    const aliveVoters = gameParts.filter(p => p.is_alive)
    const allVoted = aliveVoters.length > 0 && aliveVoters.every(voter => votes.some(v => v.voter_id === voter.id))
    if (allVoted) {
      resolveVoting().catch(console.error)
    }
  }, [votes, phase, currentRound, gameRoom, user?.id, gameParts])

  const handleAnswerQuestion = async (questionId, selectedIndex, isCorrect, timeSpentMs) => {
    if (!currentRound || !myParticipant) return

    const q = questions.find(q => q.id === questionId)
    if (!q) return

    const playerAnswer = q.options[selectedIndex]
    const correctAnswer = q.options[q.correctIndex]

    await heistService.recordAnswer(
      currentRound.id,
      myParticipant.id,
      q.question,
      correctAnswer,
      playerAnswer,
      isCorrect,
      timeSpentMs
    )

    // Update stats
    const scoreDelta = isCorrect ? 10 : 0
    await heistService.updateParticipantStats(myParticipant.id, {
      scoreDelta,
      questionsDelta: 1,
      correctDelta: isCorrect ? 1 : 0
    })

    // Update integrity
    const integrityChange = isCorrect ? 2 : -3
    const newIntegrity = Math.max(0, Math.min(100, integrity + integrityChange))

    await supabase
      .from('heist_rooms')
      .update({ integrity: newIntegrity })
      .eq('id', room.id)

    setAnswers(prev => {
      const next = [...prev, { questionId, isCorrect, selectedIndex }]
      if (next.length === questions.length) {
        heistService.setReady(myParticipant.id, true).catch(console.error)
      }
      return next
    })
  }

  const handleSendChat = async (message) => {
    if (!message.trim() || !myParticipant) return
    await heistService.sendChat(room.id, myParticipant.id, message.trim())
  }

  const handleVote = async (targetId) => {
    if (!currentRound || !myParticipant) return
    await heistService.castVote(currentRound.id, myParticipant.id, targetId)
  }

  const handleSabotage = async (targetId) => {
    if (!myParticipant || myParticipant.role !== 'thief' || myParticipant.sabotage_uses <= 0) return
    try {
      const target = gameParts.find(p => p.id === targetId)
      if (!target) return

      await heistService.sabotagePlayer(room.id, targetId, myParticipant.id)
      await heistService.sendChat(room.id, myParticipant.id, `⚠️ [SYSTEM WARNING] A Knowledge Corruptor glitch has been detected!`, true)

      // Refresh participants list to sync state
      const pts = await heistService.getParticipants(room.id)
      setGameParts(pts)
    } catch (e) {
      console.error('Sabotage failed:', e)
    }
  }

  // Check win conditions
  useEffect(() => {
    if (gameRoom?.status !== 'playing') return

    const aliveAgents = gameParts.filter(p => p.is_alive && p.role === 'agent')
    const aliveThieves = gameParts.filter(p => p.is_alive && p.role === 'thief')

    // Thieves win if integrity reaches 0
    if (integrity <= 0) {
      heistService.endGame(room.id, 'thieves')
      return
    }

    // Agents win if all thieves eliminated
    if (aliveThieves.length === 0 && aliveAgents.length > 0) {
      heistService.endGame(room.id, 'agents')
      return
    }

    // Thieves win if they equal or outnumber agents
    if (aliveThieves.length >= aliveAgents.length && aliveAgents.length > 0) {
      heistService.endGame(room.id, 'thieves')
    }
  }, [integrity, gameParts, gameRoom?.status])

  if (gameRoom?.status === 'finished' || phase === 'ended') {
    return (
      <HeistReportScreen
        room={gameRoom}
        participants={gameParts}
        myParticipant={myParticipant}
        report={report}
        onExit={onExit}
        onPlayAgain={() => window.location.reload()}
      />
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <HeistGameHeader
        room={gameRoom}
        phase={phase}
        roundNumber={roundNumber}
        integrity={integrity}
        myRole={myParticipant?.role}
        myParticipant={myParticipant}
        onShowRole={() => setShowRole(true)}
        onExit={onExit}
        timeLeft={timeLeft}
      />

      <AnimatePresence mode="wait">
        {phase === 'task' && (
          <TaskPhase
            key={`task-${roundNumber}`}
            questions={questions}
            loading={loadingQuestions}
            myParticipant={myParticipant}
            onAnswer={handleAnswerQuestion}
            answers={answers}
            onSabotage={handleSabotage}
            participants={gameParts}
            room={gameRoom}
          />
        )}
        {phase === 'discussion' && (
          <DiscussionPhase
            key="discussion"
            room={gameRoom}
            participants={gameParts}
            myParticipant={myParticipant}
            chat={chat}
            onSendChat={handleSendChat}
            roundNumber={roundNumber}
          />
        )}
        {phase === 'voting' && (
          <VotingPhase
            key="voting"
            participants={gameParts}
            myParticipant={myParticipant}
            votes={votes}
            onVote={handleVote}
            roundNumber={roundNumber}
          />
        )}
      </AnimatePresence>

      {/* Role Reveal Modal */}
      <AnimatePresence>
        {showRole && (
          <RoleRevealModal
            role={myParticipant?.role}
            onClose={() => setShowRole(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  GAME HEADER                                                     */
/* ═══════════════════════════════════════════════════════════════ */
function HeistGameHeader({ room, phase, roundNumber, integrity, myRole, myParticipant, onShowRole, onExit, timeLeft }) {
  const phaseLabels = { task: 'Task Phase', discussion: 'Discussion', voting: 'Voting', ended: 'Game Over' }
  const phaseColors = { task: '#16A34A', discussion: AMBER, voting: PURPLE, ended: RED }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onExit} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 12px', cursor: 'pointer' }}>
          <ArrowLeft size={18} color={MUTED} />
        </button>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: phaseColors[phase] || MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            {phaseLabels[phase] || phase} {timeLeft > 0 && `• ${formatTime(timeLeft)}`}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: TEXT }}>
            Round {roundNumber} • {room?.subject}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Integrity Meter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={18} color={integrity > 50 ? '#16A34A' : integrity > 25 ? AMBER : RED} />
          <div style={{ width: 120, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${integrity}%` }}
              transition={{ duration: 0.5 }}
              style={{ height: '100%', background: integrity > 50 ? '#16A34A' : integrity > 25 ? AMBER : RED, borderRadius: 4 }}
            />
          </div>
          <span style={{ fontWeight: 800, fontSize: 13, color: TEXT }}>{integrity}%</span>
        </div>

        {/* Role Badge */}
        {myParticipant && (
          <button
            onClick={onShowRole}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 10, border: 'none',
              background: myRole === 'thief' ? `${RED}15` : `${PURPLE}15`,
              color: myRole === 'thief' ? RED : PURPLE,
              fontWeight: 800, fontSize: 13, cursor: 'pointer'
            }}
          >
            {myRole === 'thief' ? <Skull size={14} /> : <Shield size={14} />}
            {myRole === 'thief' ? 'Thief' : 'Agent'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ROLE REVEAL MODAL                                               */
/* ═══════════════════════════════════════════════════════════════ */
function RoleRevealModal({ role, onClose }) {
  const isThief = role === 'thief'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 28, padding: '40px 32px',
          textAlign: 'center', maxWidth: 420, width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2)'
        }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: isThief ? `${RED}15` : `${PURPLE}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px'
        }}>
          {isThief ? <Skull size={40} color={RED} /> : <Shield size={40} color={PURPLE} />}
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 900, color: TEXT }}>
          You are a {isThief ? 'Knowledge Thief' : 'Knowledge Agent'}
        </h2>
        <p style={{ color: MUTED, fontWeight: 600, lineHeight: 1.6, marginBottom: 24 }}>
          {isThief
            ? 'Your mission: Secretly lower the team\'s knowledge integrity. Blend in. Don\'t get caught.'
            : 'Your mission: Answer questions correctly, identify the thieves, and protect the knowledge integrity.'}
        </p>
        <button
          onClick={onClose}
          style={{
            padding: '12px 32px', background: isThief ? RED : PURPLE,
            color: 'white', border: 'none', borderRadius: 14,
            fontWeight: 900, fontSize: 16, cursor: 'pointer'
          }}
        >
          Got it
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  TASK PHASE                                                      */
/* ═══════════════════════════════════════════════════════════════ */
function TaskPhase({ questions, loading, myParticipant, onAnswer, answers, onSabotage, participants = [], room }) {
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [startTime, setStartTime] = useState(() => getCurrentTimestamp())

  const q = questions[currentQ]
  const isAnswered = q ? answers.some(a => a.questionId === q.id) : false
  const isSabotaged = room?.metadata?.sabotaged_players?.[myParticipant?.id] === true

  const scrambledOptions = useMemo(() => {
    if (!q) return []
    const indexedOptions = q.options.map((opt, idx) => ({ opt, originalIndex: idx }))
    if (isSabotaged) {
      return shuffleArray(indexedOptions)
    }
    return indexedOptions
  }, [q, isSabotaged])

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${PURPLE}20`, borderTopColor: PURPLE, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: MUTED, fontWeight: 700 }}>Generating questions with AI...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!questions.length || !q) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: MUTED, fontWeight: 700 }}>No questions available. Waiting...</p>
      </div>
    )
  }

  const handleSelect = async (idx) => {
    if (showResult || isAnswered) return
    setSelected(idx)
    setShowResult(true)

    const selectedItem = scrambledOptions[idx]
    const isCorrect = selectedItem.originalIndex === q.correctIndex
    const timeSpent = getCurrentTimestamp() - startTime

    if (isSabotaged) {
      try {
        await heistService.clearSabotage(room.id, myParticipant.id)
      } catch (e) {
        console.error('Error clearing sabotage:', e)
      }
    }

    await onAnswer(q.id, selectedItem.originalIndex, isCorrect, timeSpent)
  }

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
      setSelected(null)
      setShowResult(false)
      setStartTime(getCurrentTimestamp())
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 700, margin: '0 auto', width: '100%' }}
    >
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {questions.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 6, borderRadius: 3,
            background: i < currentQ ? '#16A34A' : i === currentQ ? PURPLE : '#e2e8f0'
          }} />
        ))}
      </div>

      {/* Question Card */}
      <div style={{ background: 'white', borderRadius: 24, padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: PURPLE, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question {currentQ + 1} of {questions.length}</span>
        </div>

        {isSabotaged && (
          <div style={{ background: '#FFF5F5', border: '1.5px dashed #EF4444', color: '#B91C1C', padding: '10px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Skull size={16} color={RED} />
            WARNING: THIEF SABOTAGE DETECTED! Options have been corrupted and scrambled!
          </div>
        )}

        <h3 style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 28, lineHeight: 1.5 }}>{q.question}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {scrambledOptions.map((item, idx) => {
            const isSelected = selected === idx
            const isCorrect = item.originalIndex === q.correctIndex
            const showCorrect = showResult && isCorrect
            const showWrong = showResult && isSelected && !isCorrect

            return (
              <motion.button
                key={idx}
                whileTap={!showResult ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(idx)}
                disabled={showResult}
                style={{
                  width: '100%', padding: '16px 20px', borderRadius: 14,
                  border: `2px solid ${showCorrect ? '#16A34A' : showWrong ? RED : isSelected ? PURPLE : '#e2e8f0'}`,
                  background: showCorrect ? '#F0FDF4' : showWrong ? '#FEF2F2' : isSelected ? `${PURPLE}08` : 'white',
                  textAlign: 'left', cursor: showResult ? 'default' : 'pointer',
                  fontFamily: GAME_FONT, fontSize: 15, fontWeight: 700, color: TEXT,
                  display: 'flex', alignItems: 'center', gap: 12
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: showCorrect ? '#16A34A' : showWrong ? RED : isSelected ? PURPLE : '#f1f5f9',
                  color: (showCorrect || showWrong || isSelected) ? 'white' : MUTED,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 14, flexShrink: 0
                }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                {item.opt}
                {showCorrect && <CheckCircle size={20} color="#16A34A" style={{ marginLeft: 'auto' }} />}
                {showWrong && <XCircle size={20} color={RED} style={{ marginLeft: 'auto' }} />}
              </motion.button>
            )
          })}
        </div>

        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 20, padding: '16px 20px', background: '#F8FAFC', borderRadius: 14, border: '1px solid #e2e8f0' }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, color: scrambledOptions[selected]?.originalIndex === q.correctIndex ? '#16A34A' : RED, marginBottom: 4 }}>
              {scrambledOptions[selected]?.originalIndex === q.correctIndex ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            <div style={{ fontSize: 13, color: MUTED, fontWeight: 600, lineHeight: 1.5 }}>{q.explanation}</div>
            {currentQ < questions.length - 1 && (
              <button
                onClick={handleNext}
                style={{ marginTop: 12, padding: '10px 20px', background: PURPLE, color: 'white', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}
              >
                Next Question →
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Sabotage Control Panel for Thief */}
      {myParticipant?.role === 'thief' && myParticipant?.sabotage_uses > 0 && (
        <div style={{ marginTop: 24, background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: 20, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: RED, fontWeight: 900, fontSize: 15, marginBottom: 12 }}>
            <Skull size={18} />
            Thief Control Panel — Trigger Sabotage ({myParticipant.sabotage_uses} remaining)
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#991B1B', fontWeight: 600 }}>
            Target an Agent to corrupt their next question options, confusing them and forcing mistakes.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {participants
              .filter(p => p.id !== myParticipant.id && p.is_alive && p.role === 'agent')
              .map(p => (
                <button
                  key={p.id}
                  onClick={() => onSabotage(p.id)}
                  style={{
                    padding: '8px 16px', background: RED, color: 'white', border: 'none',
                    borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <Skull size={14} />
                  Sabotage {getPlayerName(p)}
                </button>
              ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  DISCUSSION PHASE                                                */
/* ═══════════════════════════════════════════════════════════════ */
function DiscussionPhase({ participants, myParticipant, chat, onSendChat, roundNumber }) {
  const [message, setMessage] = useState('')
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat])

  const handleSend = () => {
    if (!message.trim()) return
    onSendChat(message)
    setMessage('')
  }

  const aliveParticipants = participants.filter(p => p.is_alive)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, maxWidth: 1100, margin: '0 auto', width: '100%' }}
    >
      {/* Chat Panel */}
      <div style={{ background: 'white', borderRadius: 24, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={18} color={PURPLE} />
          <span style={{ fontWeight: 800, fontSize: 15, color: TEXT }}>Team Discussion</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: MUTED, fontWeight: 600 }}>Round {roundNumber}</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500 }}>
          {chat.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontWeight: 600 }}>
              Discussion started! Share your observations...
            </div>
          )}
          {chat.map((msg, i) => {
            const isSystem = msg.is_system
            const isMe = msg.participant_id === myParticipant?.id
            const sender = participants.find(p => p.id === msg.participant_id)

            if (isSystem) {
              return (
                <div key={i} style={{ textAlign: 'center', padding: '6px 0' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: AMBER, background: '#FFFBEB', padding: '4px 12px', borderRadius: 8 }}>
                    {msg.message}
                  </span>
                </div>
              )
            }

            return (
              <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, marginBottom: 2, marginLeft: isMe ? 0 : 8 }}>
                  {isMe ? 'You' : getPlayerName(sender)}
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: 14,
                  background: isMe ? PURPLE : '#f1f5f9',
                  color: isMe ? 'white' : TEXT,
                  fontSize: 14, fontWeight: 600, lineHeight: 1.4
                }}>
                  {msg.message}
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8 }}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            style={{ flex: 1, height: 44, border: '2px solid #e2e8f0', borderRadius: 12, padding: '0 14px', fontSize: 14, fontWeight: 600, outline: 'none', fontFamily: GAME_FONT }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            style={{ width: 44, height: 44, borderRadius: 12, background: PURPLE, color: 'white', border: 'none', cursor: message.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Evidence Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: TEXT, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color={AMBER} />
            Alive Players ({aliveParticipants.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aliveParticipants.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f8fafc', borderRadius: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, color: MUTED }}>
                  {getInitial(getPlayerName(p))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: TEXT }}>
                    {p.id === myParticipant?.id ? 'You' : getPlayerName(p)}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>
                    {p.correct_count}/{p.questions_answered} correct • {p.score} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: TEXT, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} color={RED} />
            Suspicious Activity
          </div>
          <div style={{ fontSize: 13, color: MUTED, fontWeight: 600, lineHeight: 1.6 }}>
            Look for players who:<br />
            • Missed many questions<br />
            • Have low scores<br />
            • Acted strangely in chat<br />
            • Seemed to avoid answering
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  VOTING PHASE                                                    */
/* ═══════════════════════════════════════════════════════════════ */
function VotingPhase({ participants, myParticipant, votes, onVote }) {
  const [hasVoted, setHasVoted] = useState(false)
  const aliveParticipants = participants.filter(p => p.is_alive && p.id !== myParticipant?.id)
  const voteCounts = {}

  votes.forEach(v => {
    voteCounts[v.target_id] = (voteCounts[v.target_id] || 0) + 1
  })

  const handleVote = async (targetId) => {
    if (hasVoted || !myParticipant?.is_alive) return
    await onVote(targetId)
    setHasVoted(true)
  }

  if (!myParticipant?.is_alive) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 24, border: '1px solid #e2e8f0' }}>
          <Skull size={48} color={RED} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, color: TEXT, marginBottom: 8 }}>You were eliminated</h2>
          <p style={{ color: MUTED, fontWeight: 600 }}>Watch the voting unfold...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 700, margin: '0 auto', width: '100%' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: TEXT, marginBottom: 8 }}>Vote to Eliminate</h2>
        <p style={{ color: MUTED, fontWeight: 600 }}>Who do you suspect is the Knowledge Thief?</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
        {aliveParticipants.map(p => {
          const votesFor = voteCounts[p.id] || 0
          return (
            <motion.button
              key={p.id}
              whileHover={!hasVoted ? { y: -2 } : {}}
              whileTap={!hasVoted ? { scale: 0.98 } : {}}
              onClick={() => handleVote(p.id)}
              disabled={hasVoted}
              style={{
                width: '100%', padding: '18px 24px', borderRadius: 16,
                border: `2px solid ${hasVoted ? '#e2e8f0' : PURPLE}`,
                background: 'white', textAlign: 'left', cursor: hasVoted ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 16
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: MUTED }}>
                {getInitial(getPlayerName(p))}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: 16, color: TEXT }}>{getPlayerName(p)}</div>
                <div style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}>
                  {p.correct_count}/{p.questions_answered} correct • {p.score} pts
                </div>
              </div>
              {votesFor > 0 && (
                <div style={{ padding: '4px 12px', background: `${PURPLE}15`, color: PURPLE, borderRadius: 8, fontWeight: 900, fontSize: 13 }}>
                  {votesFor} vote{votesFor !== 1 ? 's' : ''}
                </div>
              )}
              {hasVoted && votes.some(v => v.voter_id === myParticipant?.id && v.target_id === p.id) && (
                <CheckCircle size={20} color={PURPLE} />
              )}
            </motion.button>
          )
        })}
      </div>

      {hasVoted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginTop: 24, textAlign: 'center', color: MUTED, fontWeight: 700 }}
        >
          Vote cast! Waiting for others...
        </motion.div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════ */
/*  POST-GAME REPORT                                                */
/* ═══════════════════════════════════════════════════════════════ */
function HeistReportScreen({ room, participants, myParticipant, report, onExit, onPlayAgain }) {
  const isWinner = room?.winner === (myParticipant?.role === 'agent' ? 'agents' : 'thieves')

  if (!report) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${PURPLE}20`, borderTopColor: PURPLE, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: MUTED, fontWeight: 700 }}>Generating your learning report...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', overflowY: 'auto' }}
    >
      <div style={{ maxWidth: 640, width: '100%' }}>
        {/* Winner Banner */}
        <div style={{
          textAlign: 'center', padding: '32px', borderRadius: 24,
          background: isWinner ? `linear-gradient(135deg, ${MINT}, #86EFAC)` : `linear-gradient(135deg, #FEE2E2, #FECACA)`,
          marginBottom: 32
        }}>
          <Trophy size={48} color={isWinner ? '#166534' : '#DC2626'} style={{ margin: '0 auto 12px' }} />
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: isWinner ? '#166534' : '#DC2626' }}>
            {isWinner ? 'Victory!' : 'Defeat'}
          </h1>
          <p style={{ margin: '8px 0 0', fontWeight: 700, color: isWinner ? '#166534' : '#DC2626', opacity: 0.8 }}>
            The {room?.winner} protected humanity's knowledge!
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          <StatBox icon={Brain} label="Questions" value={report.questionsAttempted} color={PURPLE} />
          <StatBox icon={CheckCircle} label="Correct" value={report.correctAnswers} color="#16A34A" />
          <StatBox icon={Target} label="Accuracy" value={`${report.accuracy}%`} color={AMBER} />
        </div>

        {/* Awards */}
        {report.awards?.length > 0 && (
          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: TEXT }}>Awards</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {report.awards.map((award, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: `${PURPLE}10`, borderRadius: 10, color: PURPLE, fontWeight: 800, fontSize: 13 }}>
                  <Medal size={16} />
                  {award.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topics & Recommendations */}
        <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: TEXT }}>Learning Summary</h3>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Topics Practiced</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {report.topicsPracticed.map((t, i) => (
                <span key={i} style={{ padding: '6px 12px', background: '#F3F4F6', borderRadius: 8, fontSize: 13, fontWeight: 700, color: TEXT }}>{t}</span>
              ))}
            </div>
          </div>
          {report.recommendations?.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Recommended Review</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {report.recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: MUTED }}>
                    <ArrowLeft size={14} style={{ transform: 'rotate(180deg)', color: PURPLE }} />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Player Results */}
        <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 900, color: TEXT }}>Player Results</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {participants.sort((a, b) => b.score - a.score).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: p.id === myParticipant?.id ? `${PURPLE}08` : '#f8fafc', borderRadius: 12, border: p.id === myParticipant?.id ? `1px solid ${PURPLE}30` : '1px solid transparent' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, color: MUTED }}>
                  {getInitial(getPlayerName(p))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: TEXT }}>
                    {p.id === myParticipant?.id ? 'You' : getPlayerName(p)}
                    <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 6, background: p.role === 'thief' ? `${RED}15` : `${PURPLE}15`, color: p.role === 'thief' ? RED : PURPLE, fontWeight: 800 }}>
                      {p.role === 'thief' ? 'Thief' : 'Agent'}
                    </span>
                  </div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 14, color: PURPLE }}>{p.score} pts</div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onPlayAgain}
            style={{ flex: 1, padding: '16px', background: MINT, color: '#166534', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer' }}
          >
            Play Again
          </button>
          <button
            onClick={onExit}
            style={{ flex: 1, padding: '16px', background: 'white', color: TEXT, border: '2px solid #e2e8f0', borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: 'pointer' }}
          >
            Back to Arcade
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// eslint-disable-next-line no-unused-vars
function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #e2e8f0' }}>
      <Icon size={24} color={color} style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 22, fontWeight: 900, color: TEXT }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}