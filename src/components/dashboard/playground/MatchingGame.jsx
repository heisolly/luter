import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cards, Gear, X } from '@phosphor-icons/react'
import { GameStartScreen, GameOverScreen, shuffleWithSeed, createSeededRandom, MultiplayerHUD } from './GameShared'
import { playgroundService } from '../../../services/playgroundService'
import confetti from 'canvas-confetti'

export default function MatchingGame({ room, participants, user, deck, onExit }) {
  const [gameState, setGameState] = useState('start')
  const [cards, setCards] = useState([])
  const [selected, setSelected] = useState(null)
  const [matches, setMatches] = useState([])
  const [timeElapsed, setTimeElapsed] = useState(0) // Count UP
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState(null) // 'wrong' | 'correct' | null

  useEffect(() => {
    if (gameState === 'start' && deck.length > 0) {
      const items = []
      // Use room.id as seed for consistent random picking across clients
      const seed = room.id
      const shuffled = shuffleWithSeed(deck, seed).slice(0, 6)
      
      shuffled.forEach((item, i) => {
        items.push({ id: `term-${i}`, type: 'term', text: item.term, pairId: i })
        items.push({ id: `def-${i}`, type: 'definition', text: item.definition, pairId: i })
      })
      // Use seed + "shuffle" for consistent card placement
      setCards(shuffleWithSeed(items, seed + "_shuffle"))
    }
  }, [gameState, deck, room.id])
  // Auto-start for multiplayer
  useEffect(() => {
    if (gameState === 'start' && room.created_by) {
      const timer = setTimeout(() => {
        setGameState('playing')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState, room.created_by])

  useEffect(() => {
    let interval
    if (gameState === 'playing') {
      const isMultiplayer = !!room.created_by
      const startOffset = isMultiplayer ? 3000 : 0
      const startTime = (isMultiplayer && room.updated_at) 
        ? (new Date(room.updated_at).getTime() + startOffset) 
        : Date.now()
      
      interval = setInterval(() => {
        const now = Date.now()
        const diff = (now - startTime) / 1000
        setTimeElapsed(Math.max(0, diff))
      }, 100)
    }
    return () => clearInterval(interval)
  }, [gameState, room.updated_at, room.created_by])

  useEffect(() => {
    if (matches.length > 0 && matches.length === cards.length && gameState === 'playing') {
      setGameState('finished')
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
      // ✅ Multiplayer: First one to finish sets the room to finished
      if (room.id && room.status !== 'finished') {
        playgroundService.supabase.from('playground_rooms').update({ status: 'finished' }).eq('id', room.id).then(() => {})
      }
    }
  }, [matches, cards.length, gameState, room.id, room.status])

  // ✅ Listen for room status changing to finished (someone else finished first)
  useEffect(() => {
    if (room.status === 'finished' && gameState === 'playing') {
      setGameState('finished')
    }
  }, [room.status, gameState])

  const handleCardClick = (card) => {
    if (matches.includes(card.id) || gameState !== 'playing') return
    if (selected?.id === card.id) {
      setSelected(null)
      return
    }

    if (!selected) {
      setSelected(card)
    } else {
      if (selected.pairId === card.pairId && selected.type !== card.type) {
        // Correct match
        setMatches([...matches, selected.id, card.id])
        const newScore = score + 15
        setScore(newScore)
        
        const pId = participants.find(p => user.id ? p.user_id === user.id : p.guest_name === user.guest_name)?.id
        if (pId) playgroundService.updateParticipantScore(pId, newScore)
      } else {
        // Wrong match
        setFeedback('wrong')
        setTimeout(() => {
          setFeedback(null)
          // ✅ Reshuffle all cards (that aren't already matched)
          setCards(prev => {
            const unmatched = prev.filter(c => !matches.includes(c.id))
            const matched = prev.filter(c => matches.includes(c.id))
            return [...matched, ...unmatched.sort(() => 0.5 - Math.random())]
          })
        }, 800)
      }
      setSelected(null)
    }
  }

  if (gameState === 'start') {
    return (
      <GameStartScreen 
        title="Match"
        icon={Cards}
        description="Make everything disappear! Drag corresponding items onto each other to make them disappear."
        instructions={[
          "Click a card to reveal its term or definition.",
          "Click a second card to see if it's a match.",
          "Clear the entire board as fast as you can.",
          "Compete for the best time!"
        ]}
        onStart={() => {
          setTimeElapsed(0)
          setGameState('playing')
        }}
        color="#3b82f6"
        isMultiplayer={!!room.created_by}
      />
    )
  }

  if (gameState === 'finished') {
    // Score based on time (faster = higher score)
    const finalScore = Math.max(0, Math.round(10000 / (timeElapsed || 1)))
    return (
      <GameOverScreen 
        score={finalScore}
        total={cards.length / 2}
        xp={score * 2}
        accuracy={100}
        onRetry={async () => {
          if (room.created_by && room.created_by === user.id) {
            try {
              await playgroundService.supabase
                .from('playground_rooms')
                .update({ status: 'waiting', updated_at: new Date().toISOString() })
                .eq('id', room.id)
            } catch (e) {
              console.error("Failed to reset room:", e)
            }
          }
          setGameState('start')
          setMatches([])
          setScore(0)
          setTimeElapsed(0)
          setSelected(null)
        }}
        onExit={(nextGame) => onExit(nextGame)}
        isGuest={!user.id}
        color="#7c3aed"
        room={room}
      />
    )
  }

  return (
    <div style={{ 
      width: '100%',
      maxWidth: 1000, 
      margin: '0 auto', 
      padding: '12px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%'
    }}>
      {room.created_by && (
        <MultiplayerHUD 
          participants={participants} 
          user={user} 
          color="#7c3aed" 
        />
      )}
      
      {/* Quizlet-Style Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16,
        padding: '10px 24px',
        background: 'white',
        borderRadius: 20,
        border: '2px solid #e2e8f0',
        fontFamily: "'Outfit', sans-serif",
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Left Side: Game Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#7c3aed', fontWeight: 800 }}>
          <Cards size={28} weight="bold" /> 
          <span style={{ fontSize: 18, textTransform: 'uppercase', letterSpacing: 1 }}>Match</span>
        </div>

        <div style={{ fontSize: 24, fontWeight: 900, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
          {timeElapsed.toFixed(1)}s
        </div>

        {/* Right Side: Actions (Visual Only for Layout) */}
        <div style={{ display: 'flex', gap: 16, color: '#94a3b8' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} title="Settings">
            <Gear size={24} weight="bold" />
          </button>
          <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }} title="Close">
            <X size={24} weight="bold" />
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ 
          flex: 1,
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gridTemplateRows: 'repeat(3, 1fr)',
          gap: 20,
          minHeight: 0
        }}
      >
        <AnimatePresence>
          {cards.map(card => {
            const isMatched = matches.includes(card.id);
            const isSelected = selected?.id === card.id;

            if (isMatched) {
              return (
                <motion.div
                  key={card.id}
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )
            }

            return (
              <motion.div
                key={card.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ 
                  y: -4, 
                  backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                  boxShadow: '0 12px 20px -5px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)' 
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCardClick(card)}
                style={{
                  background: matches.includes(card.id) ? 'transparent' : 'white',
                  border: matches.includes(card.id) ? 'none' : 
                          selected?.id === card.id ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px 16px',
                  textAlign: 'center',
                  cursor: matches.includes(card.id) ? 'default' : 'pointer',
                  fontSize: 15,
                  fontWeight: 600,
                  overflow: 'hidden',
                  color: matches.includes(card.id) ? 'transparent' : '#334155',
                  height: 250,
                  boxShadow: matches.includes(card.id) ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  opacity: matches.includes(card.id) ? 0 : 1,
                  visibility: matches.includes(card.id) ? 'hidden' : 'visible',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                {/* Visual Feedback for wrong match */}
                {feedback === 'wrong' && !matches.includes(card.id) && (
                  <motion.div 
                    animate={{ x: [-2, 2, -2, 2, 0] }}
                    transition={{ duration: 0.4 }}
                    style={{ position: 'absolute', inset: 0, borderRadius: 20, border: '4px solid #fee2e2' }}
                  />
                )}
                {card.text}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
