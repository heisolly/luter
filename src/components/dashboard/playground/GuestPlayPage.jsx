import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { RiUserSmileFill, RiGamepadFill, RiArrowRightLine, RiLoader4Line, RiErrorWarningFill, RiCheckFill } from 'react-icons/ri'
import { playgroundService } from '../../../services/playgroundService'
import MatchingGame from './MatchingGame'
import StackerGame from './StackerGame'
import TermBuilderGame from './TermBuilderGame'
import BrainBlitzGame from './BrainBlitzGame'
import GameLobby from './GameLobby'

export default function GuestPlayPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [room, setRoom] = useState(null)
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [toast, setToast] = useState(null) // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    let channel;
    
    const initRoom = async () => {
      setLoading(true)
      const { data, error } = await playgroundService.supabase
        .from('playground_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (data) {
        setRoom(data)
        // Subscribe to changes
        channel = playgroundService.subscribeToRoom(roomId, (type, payload) => {
          if (type === 'room') {
            console.log("Room updated:", payload)
            setRoom(prev => ({ ...prev, ...payload }))
          } else {
            fetchParticipants()
          }
        })
        fetchParticipants()
      }
      setLoading(false)
    }

    initRoom()

    return () => {
      if (channel) {
        console.log("Cleaning up room subscription")
        playgroundService.supabase.removeChannel(channel)
      }
    }
  }, [roomId])

  const fetchParticipants = async () => {
    try {
      const data = await playgroundService.getParticipants(roomId)
      setParticipants(data)
    } catch (e) {
      console.error('Failed to fetch participants', e)
    }
  }

  const refreshRoom = async () => {
    const { data } = await playgroundService.supabase
      .from('playground_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    if (data) setRoom(data)
  }

  const handleJoin = async () => {
    if (!nickname.trim()) {
      showToast('Please enter a nickname first', 'error')
      return
    }
    setJoining(true)
    try {
      await playgroundService.supabase.from('playground_participants').insert({
        room_id: roomId,
        guest_name: nickname.trim(),
        is_ready: false
      })
      setHasJoined(true)
      // ✅ KEY FIX: fetch participants after joining so our own record is in state
      await fetchParticipants()
      showToast('You joined the lobby!', 'success')
    } catch (error) {
      console.error(error)
      showToast('Failed to join room. The room may be full or already started.', 'error')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ width: 64, height: 64, background: '#f5f3ff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', margin: '0 auto 16px' }}>
            <RiLoader4Line size={32} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: '#64748b', fontSize: 16 }}>Loading game room...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        </motion.div>
      </div>
    )
  }

  if (!room) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 400, width: '100%', background: 'white', padding: 40, borderRadius: 32, textAlign: 'center', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', fontFamily: "'DM Sans', sans-serif" }}
        >
          <div style={{ width: 64, height: 64, background: '#fef2f2', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 24px' }}>
            <RiErrorWarningFill size={32} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#1e293b', marginBottom: 8 }}>Room Not Found</h2>
          <p style={{ color: '#64748b', fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
            This game room doesn't exist or has already ended. Ask your friend to send you a new invite link.
          </p>
          <button
            onClick={() => navigate('/')}
            style={{ background: '#98FF98', color: '#166534', border: 'none', padding: '14px 28px', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: 'pointer' }}          >
            Go to Luter
          </button>
        </motion.div>
      </div>
    )
  }

  if (!hasJoined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
        {/* Toast */}
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

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ maxWidth: 420, width: '100%', background: 'white', padding: 40, borderRadius: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.06)', textAlign: 'center' }}
        >
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', margin: '0 auto 24px', boxShadow: '0 8px 20px rgba(124,58,237,0.15)' }}>
            <RiGamepadFill size={36} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: '#111' }}>Join the Game!</h1>
          <p style={{ color: '#64748b', marginBottom: 8, lineHeight: 1.6, fontSize: 15 }}>
            Your friend invited you to a Luter study battle.
          </p>
          {room.metadata?.course_name && (
            <div style={{ display: 'inline-block', background: '#f5f3ff', color: '#7c3aed', padding: '4px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, marginBottom: 28, border: '1px solid #ede9fe' }}>
              📚 {room.metadata.course_name}
            </div>
          )}

          <input
            type="text"
            placeholder="Enter your nickname..."
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            maxLength={20}
            style={{
              width: '100%', padding: '16px 20px', borderRadius: 16,
              border: '2px solid #e2e8f0', marginBottom: 16, fontSize: 16,
              fontWeight: 600, outline: 'none', boxSizing: 'border-box',
              fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoin}
            disabled={joining || !nickname.trim()}
            style={{
              width: '100%', padding: '16px', background: joining ? '#86EFAC' : '#98FF98',
              color: '#166534', border: 'none', borderRadius: 16, fontSize: 16,
              fontWeight: 800, cursor: joining ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 8px 20px rgba(152,255,152,0.25)'
            }}
          >
            {joining ? <RiLoader4Line size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <RiArrowRightLine size={20} />}
            {joining ? 'Joining...' : 'Join Lobby'}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  const user = { id: null, guest_name: nickname.trim() }
  const commonProps = { room, participants, user, deck: room.metadata?.deck || [] }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      {/* Toast */}
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

      {room.status === 'waiting' ? (
        <GameLobby
          room={room}
          participants={participants}
          user={user}
          onStart={fetchParticipants}
          onRefresh={fetchParticipants}
          showToast={showToast}
        />
      ) : (
        renderGame(room.game_type, commonProps)
      )}
    </div>
  )
}

function renderGame(type, props) {
  switch (type) {
    case 'matching': return <MatchingGame {...props} />
    case 'stacker': return <StackerGame {...props} />
    case 'term-builder': return <TermBuilderGame {...props} />
    case 'brain-blitz': return <BrainBlitzGame {...props} />
    default: return (
      <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: '#64748b' }}>
        Game type not recognized.
      </div>
    )
  }
}
