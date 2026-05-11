import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiTimeLine, RiTrophyLine, RiCheckFill, RiCloseFill } from 'react-icons/ri'
import { Stack } from '@phosphor-icons/react'
import { GameStartScreen, GameOverScreen, shuffleWithSeed } from './GameShared'
import { playgroundService } from '../../../services/playgroundService'
import confetti from 'canvas-confetti'

export default function StackerGame({ room, participants, user, deck, onExit }) {
  const [gameState, setGameState] = useState('start')
  const [targetTerm, setTargetTerm] = useState(null)
  const [options, setOptions] = useState([])
  const [stack, setStack] = useState([])
  const [score, setScore] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [streak, setStreak] = useState(0)
  const [unplayedDeck, setUnplayedDeck] = useState([])

  useEffect(() => {
    if (gameState === 'start' && deck.length > 0) {
      setUnplayedDeck(shuffleWithSeed(deck, room.id))
    }
  }, [gameState, deck, room.id])

  useEffect(() => {
    let interval
    if (gameState === 'playing') {
      const startTime = room.updated_at ? new Date(room.updated_at).getTime() : Date.now()
      interval = setInterval(() => {
        const now = Date.now()
        const diff = (now - startTime) / 1000
        setTimeElapsed(Math.max(0, diff))
      }, 100)
    }
    return () => clearInterval(interval)
  }, [gameState, room.updated_at])

  // Auto-start for multiplayer
  useEffect(() => {
    if (gameState === 'start' && room.created_by) {
      const timer = setTimeout(() => {
        const shuffled = shuffleWithSeed(deck, room.id)
        setUnplayedDeck(shuffled)
        setGameState('playing')
        setTimeout(() => nextRound(shuffled), 0)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState, room.created_by, deck, room.id])

  const nextRound = (currentUnplayed) => {
    const list = currentUnplayed || unplayedDeck
    if (!list || list.length === 0) {
      setGameState('finished')
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      // ✅ Multiplayer: First one to finish sets the room to finished
      if (room.id && room.status !== 'finished') {
        playgroundService.supabase.from('playground_rooms').update({ status: 'finished' }).eq('id', room.id).then(() => {})
      }
      return
    }
    const randomTerm = list[0]
    setUnplayedDeck(list.slice(1))
    setTargetTerm(randomTerm)

    // Use a round-specific seed for options to keep them synchronized if needed
    // But actually, options should be same for everyone initially.
    const roundSeed = room.id + "_round_" + (deck.length - list.length)
    
    const otherDefs = shuffleWithSeed(
      deck.filter(item => item.term !== randomTerm.term),
      roundSeed + "_others"
    ).map(item => item.definition).slice(0, 3)

    const allOptions = shuffleWithSeed([randomTerm.definition, ...otherDefs], roundSeed + "_all")
    setOptions(allOptions)
  }

  // ✅ Listen for room status changing to finished (someone else finished first)
  useEffect(() => {
    if (room.status === 'finished' && gameState === 'playing') {
      setGameState('finished')
    }
  }, [room.status, gameState])

  const handleOptionClick = (option) => {
    if (gameState !== 'playing' || feedback) return

    if (option === targetTerm.definition) {
      setFeedback('correct')
      const bonus = streak > 2 ? 10 : 0
      const newScore = score + 15 + bonus
      setScore(newScore)
      setStreak(s => s + 1)
      setStack(prev => [{ id: Date.now(), text: targetTerm.term }, ...prev].slice(0, 8))
      
      const pId = participants.find(p => user.id ? p.user_id === user.id : p.guest_name === user.guest_name)?.id
      if (pId) playgroundService.updateParticipantScore(pId, newScore)
      
      setTimeout(() => {
        setFeedback(null)
        nextRound()
      }, 800)
    } else {
      setFeedback('wrong')
      setStreak(0)
      setTimeout(() => {
        setFeedback(null)
        // ✅ Shuffling positions after error to keep user alert
        setOptions(prev => [...prev].sort(() => Math.random() - 0.5))
      }, 800)
    }
  }

  if (gameState === 'start') {
    return (
      <GameStartScreen 
        title="Stacker Arena"
        icon={Stack}
        description="Build your knowledge tower by correctly identifying definitions."
        instructions={[
          "Read the term shown in the main card.",
          "Select the correct definition from the 4 options.",
          "Each correct answer adds a block to your stack.",
          "Keep a streak going to earn bonus points!",
          "Clear all items as fast as you can!"
        ]}
        onStart={() => {
          const shuffled = shuffleWithSeed(deck, room.id)
          setUnplayedDeck(shuffled)
          setGameState('playing')
          setTimeout(() => nextRound(shuffled), 0)
        }}
        color="#0ea5e9"
        isMultiplayer={!!room.created_by}
      />
    )
  }

  if (gameState === 'finished') {
    return (
      <GameOverScreen 
        score={score}
        total={stack.length}
        xp={score * 3}
        accuracy={100} 
        onRetry={() => {
          setGameState('start')
          setStack([])
          setTimeElapsed(0)
          setScore(0)
          setStreak(0)
        }}
        onExit={onExit}
        isGuest={!user.id}
        color="#0ea5e9"
      />
    )
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px' }}>
      {/* Stats Bar */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 32,
        background: 'white',
        padding: '16px 24px',
        borderRadius: '24px',
        border: '3px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'white', padding: 10, borderRadius: 14, color: '#0ea5e9', border: '2px solid #bae6fd' }}>
            <RiTimeLine size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', fontVariantNumeric: 'tabular-nums', fontFamily: "'Outfit', sans-serif" }}>{timeElapsed.toFixed(1)}s</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0ea5e9' }}>{score}</div>
          </div>
          <div style={{ background: 'white', padding: 10, borderRadius: 14, color: '#fbbf24', border: '2px solid #fde68a' }}>
            <RiTrophyLine size={24} />
          </div>
          <button onClick={onExit} style={{ background: 'white', border: '2px solid #e2e8f0', padding: 10, borderRadius: 14, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Close">
            <RiCloseFill size={24} />
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 32 }}>
        {/* Stack Visual */}
        <div style={{ 
          background: 'white', 
          borderRadius: 32, 
          padding: 32, 
          height: 500, 
          display: 'flex', 
          flexDirection: 'column-reverse', 
          gap: 12,
          border: '3px dashed #cbd5e1',
          overflow: 'hidden'
        }}>
          <AnimatePresence>
            {stack.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ y: -200, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                style={{
                  padding: '16px',
                  background: 'white',
                  borderRadius: 16,
                  color: '#0ea5e9',
                  fontSize: 16,
                  fontWeight: 900,
                  textAlign: 'center',
                  border: '3px solid #0ea5e9',
                  boxShadow: '4px 4px 0px #bae6fd'
                }}
              >
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
          {stack.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 16, fontWeight: 800 }}>
              Correct answers stack here
            </div>
          )}
        </div>

        {/* Question Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <motion.div
            key={targetTerm?.term}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            style={{
              background: 'white',
              padding: 40,
              borderRadius: 32,
              textAlign: 'center',
              border: `4px solid ${feedback === 'correct' ? '#10b981' : feedback === 'wrong' ? '#ef4444' : '#e2e8f0'}`,
              transition: 'border-color 0.2s',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '1px' }}>Term</div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0f172a' }}>{targetTerm?.term}</h2>
            
            <AnimatePresence>
              {feedback && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  style={{ 
                    marginTop: 20, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: 8,
                    color: feedback === 'correct' ? '#10b981' : '#ef4444',
                    fontWeight: 900,
                    fontSize: 20
                  }}
                >
                  {feedback === 'correct' ? <RiCheckFill size={28} /> : <RiCloseFill size={28} />}
                  {feedback === 'correct' ? 'EXCELLENT!' : 'TRY AGAIN'}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <div style={{ display: 'grid', gap: 16 }}>
            {options.map((opt, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 8, boxShadow: '4px 6px 0px #e2e8f0' }}
                whileTap={{ scale: 0.98, x: 0, boxShadow: '0px 0px 0px transparent' }}
                onClick={() => handleOptionClick(opt)}
                style={{
                  padding: '24px',
                  background: 'white',
                  border: '3px solid #e2e8f0',
                  borderRadius: 20,
                  textAlign: 'left',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  lineHeight: '1.4',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
              >
                {opt}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
