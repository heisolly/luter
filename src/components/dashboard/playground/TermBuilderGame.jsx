import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiTimeLine, RiTrophyLine, RiLightbulbFill, RiCloseFill, RiDeleteBack2Fill, RiFireFill, RiStarFill } from 'react-icons/ri'
import { PuzzlePiece } from '@phosphor-icons/react'
import { GameStartScreen, GameOverScreen, createSeededRandom, shuffleWithSeed, MultiplayerHUD } from './GameShared'
import { playgroundService } from '../../../services/playgroundService'
import confetti from 'canvas-confetti'

export default function TermBuilderGame({ room, participants, user, deck, onExit }) {
  const [gameState, setGameState] = useState('start')
  const [targetItem, setTargetItem] = useState(null)
  const [scrambled, setScrambled] = useState([])
  const [currentGuess, setCurrentGuess] = useState([])
  const [score, setScore] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [round, setRound] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [unplayedDeck, setUnplayedDeck] = useState([])
  const [totalTerms, setTotalTerms] = useState(0)
  const [completedTerms, setCompletedTerms] = useState(0)
  const [streak, setStreak] = useState(0)
  const [speedBonus, setSpeedBonus] = useState(null) // { amount, id }
  const roundStartTimeRef = useRef(null)
  const [wrongCount, setWrongCount] = useState(0)

  useEffect(() => {
    if (gameState === 'start' && deck.length > 0) {
      setUnplayedDeck(shuffleWithSeed(deck, room.id))
      setTotalTerms(deck.length)
    }
  }, [gameState, deck, room.id])

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

  // Auto-start for multiplayer
  useEffect(() => {
    if (gameState === 'start' && room.created_by) {
      const timer = setTimeout(() => {
        const shuffled = shuffleWithSeed(deck, room.id)
        setUnplayedDeck(shuffled)
        setTotalTerms(deck.length)
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
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
      // ✅ Multiplayer: First one to finish sets the room to finished
      if (room.id && room.status !== 'finished') {
        playgroundService.supabase.from('playground_rooms').update({ status: 'finished' }).eq('id', room.id).then(() => {})
      }
      return
    }

    const item = list[0]
    setUnplayedDeck(list.slice(1))
    setTargetItem(item)
    setCurrentGuess([])
    setFailedAttempts(0)
    setRound(r => r + 1)
    roundStartTimeRef.current = Date.now()

    const roundSeed = room.id + "_round_" + (deck.length - list.length)
    const rng = createSeededRandom(roundSeed)
    const words = item.term.trim().split(/\s+/).filter(Boolean)
    const allOtherWords = deck
      .filter(x => x.term !== item.term)
      .flatMap(x => x.term.trim().split(/\s+/).filter(Boolean))

    const uniqueDistractors = [...new Set(allOtherWords)]
    const distractorCount = Math.min(4, Math.max(2, words.length + 2))
    
    // Use seeded shuffle for distractors
    const shuffledUnique = shuffleWithSeed(uniqueDistractors, roundSeed + "_dist")
    const distractors = shuffledUnique.slice(0, distractorCount)

    const fallbacks = ['Concept', 'Theory', 'System', 'Data', 'Model', 'Value', 'Method']
    while (distractors.length < distractorCount) {
      const fb = fallbacks[Math.floor(rng() * fallbacks.length)]
      if (!distractors.includes(fb) && !words.includes(fb)) {
        distractors.push(fb)
      }
    }

    setScrambled(shuffleWithSeed([...words, ...distractors], roundSeed + "_all"))
  }

  // ✅ Listen for room status changing to finished (someone else finished first)
  useEffect(() => {
    if (room.status === 'finished' && gameState === 'playing') {
      setGameState('finished')
    }
  }, [room.status, gameState])

  const addWord = (word, index) => {
    if (feedback || gameState !== 'playing' || !targetItem) return

    const targetWords = targetItem.term.trim().split(/\s+/).filter(Boolean)
    const currentWordIndex = currentGuess.length
    const expectedWord = targetWords[currentWordIndex]?.toLowerCase()

    // Immediate validation: if the word picked doesn't match the word at this position
    if (!expectedWord || word.toLowerCase() !== expectedWord) {
      setFeedback('wrong')
      setFailedAttempts(f => f + 1)
      setStreak(0)
      setWrongCount(w => w + 1)
      
      setTimeout(() => {
        setFeedback(null)
        setCurrentGuess([])
        // Seeded reshuffle for retry
        const retrySeed = `${room.id}_retry_${failedAttempts}_${Date.now()}`
        setScrambled(prev => shuffleWithSeed([...prev], retrySeed))
      }, 800)
      return
    }

    // Correct word picked for this position
    const newGuess = [...currentGuess, { word, originalIndex: index }]
    setCurrentGuess(newGuess)

    // Only if the entire term is built correctly
    if (newGuess.length === targetWords.length) {
      setFeedback('correct')
      setStreak(s => s + 1)
      setCompletedTerms(c => c + 1)

      // Speed bonus: answered within 5s of round start
      const elapsed = (Date.now() - roundStartTimeRef.current) / 1000
      let bonus = 25
      let bonusLabel = null
      if (elapsed <= 5) {
        bonus += 15
        bonusLabel = { amount: '+15 Speed Bonus!', id: Date.now() }
      }
      
      if (streak >= 2) bonus += 10

      const newScore = score + bonus
      setScore(newScore)
      if (bonusLabel) setSpeedBonus(bonusLabel)

      const pId = participants.find(p => user.id ? p.user_id === user.id : p.guest_name === user.guest_name)?.id
      if (pId) playgroundService.updateParticipantScore(pId, newScore)

      setTimeout(() => {
        setFeedback(null)
        setSpeedBonus(null)
        nextRound()
      }, 900)
    }
  }

  const removeWord = () => {
    setCurrentGuess(prev => prev.slice(0, -1))
  }

  // Star rating for game over
  const getStarRating = () => {
    const accuracy = completedTerms / Math.max(1, completedTerms + wrongCount)
    const avgTime = timeElapsed / Math.max(1, completedTerms)
    if (accuracy >= 0.85 && avgTime <= 8) return 3
    if (accuracy >= 0.6 && avgTime <= 15) return 2
    return 1
  }

  if (gameState === 'start') {
    return (
      <GameStartScreen
        title="Term Builder"
        icon={PuzzlePiece}
        description="Reconstruct terms piece by piece based on their definitions."
        instructions={[
          "Read the definition shown at the top.",
          "Click the words in the correct order to build the term.",
          "Beware! There are some distractor words mixed in.",
          "Answer fast for a Speed Bonus ⚡ and keep a streak going 🔥"
        ]}
        onStart={() => {
          const shuffled = [...deck].sort(() => Math.random() - 0.5)
          setUnplayedDeck(shuffled)
          setTotalTerms(deck.length)
          setGameState('playing')
          setTimeout(() => nextRound(shuffled), 0)
        }}
        color="#16a34a"
        isMultiplayer={!!room.created_by}
      />
    )
  }

  if (gameState === 'finished') {
    const stars = getStarRating()
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        {/* Star Rating */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          style={{ fontSize: 56, marginBottom: 16 }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 300 }}
              style={{ color: i < stars ? '#f59e0b' : '#e2e8f0' }}
            >
              ★
            </motion.span>
          ))}
        </motion.div>
        <GameOverScreen
          score={score}
          total={round}
          xp={score * 4}
          accuracy={Math.round((completedTerms / totalTerms) * 100)}
          onRetry={() => {
            setGameState('start')
            setScore(0)
            setTimeElapsed(0)
            setRound(0)
            setCompletedTerms(0)
            setStreak(0)
          }}
          onExit={(nextGame) => onExit(nextGame)}
          isGuest={!user.id}
          color="#7c3aed"
          room={room}
        />
      </div>
    )
  }

  const progress = totalTerms > 0 ? completedTerms / totalTerms : 0

  return (
    <div style={{ 
      width: '100%',
      maxWidth: 800, 
      margin: '0 auto', 
      padding: '12px', 
      fontFamily: "'DM Sans', sans-serif",
      boxSizing: 'border-box'
    }}>
      {room.created_by && (
        <MultiplayerHUD 
          participants={participants} 
          user={user} 
          color="#7c3aed" 
        />
      )}
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        background: 'white',
        padding: '10px 24px',
        borderRadius: '24px',
        border: '3px solid #e2e8f0',
      }}>
        {/* Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'white', padding: 8, borderRadius: 12, color: '#16a34a', border: '2px solid #bbf7d0' }}>
            <RiTimeLine size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', fontVariantNumeric: 'tabular-nums', fontFamily: "'DM Sans', sans-serif" }}>{timeElapsed.toFixed(1)}s</div>
          </div>
        </div>

        {/* Streak badge */}
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div
              key={streak}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, #ff6b35, #f59e0b)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: 20,
                fontWeight: 800,
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
              }}
            >
              <RiFireFill size={18} />
              {streak}x Streak!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score</div>
            <motion.div
              key={score}
              initial={{ scale: 1.3, color: '#16a34a' }}
              animate={{ scale: 1, color: '#16a34a' }}
              style={{ fontSize: 20, fontWeight: 900 }}
            >
              {score}
            </motion.div>
          </div>
          <div style={{ background: 'white', padding: 8, borderRadius: 12, color: '#fbbf24', border: '2px solid #fde68a' }}>
            <RiTrophyLine size={20} />
          </div>
          <button onClick={onExit} style={{ background: 'white', border: '2px solid #e2e8f0', padding: 8, borderRadius: 12, cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Close">
            <RiCloseFill size={20} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 16, background: '#f1f5f9', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: 'spring', stiffness: 80 }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #16a34a, #4ade80)',
            borderRadius: 99
          }}
        />
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>
        {completedTerms} / {totalTerms} terms
      </div>

      {/* Game Card */}
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: 32,
        textAlign: 'center',
        border: `3px solid ${feedback === 'correct' ? '#10b981' : feedback === 'wrong' ? '#ef4444' : '#e2e8f0'}`,
        transition: 'border-color 0.3s',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Speed Bonus popup */}
        <AnimatePresence>
          {speedBonus && (
            <motion.div
              key={speedBonus.id}
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: -10, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0 }}
              style={{
                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: 20,
                fontWeight: 800,
                fontSize: 14,
                zIndex: 10,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)'
              }}
            >
              ⚡ {speedBonus.amount}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '1px' }}>DEFINITION</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', lineHeight: '1.4', maxWidth: 700, margin: '0 auto 24px' }}>
          {targetItem?.definition}
        </h2>

        {/* Hint */}
        <AnimatePresence>
          {failedAttempts >= 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#fef08a', color: '#854d0e',
                padding: '8px 16px', borderRadius: 12,
                fontWeight: 700, marginBottom: 20, fontSize: 14
              }}
            >
              <RiLightbulbFill size={18} />
              Hint: The term is "{targetItem?.term}"
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guess Area */}
        <div style={{
          display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
          gap: 10, minHeight: 64,
          background: '#f8fafc', padding: 20, borderRadius: 20,
          border: '3px solid #f1f5f9', marginBottom: 24
        }}>
          {currentGuess.map((g, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              style={{
                width: 'auto', minWidth: 80, height: 44, padding: '0 16px',
                background: feedback === 'correct' ? '#16a34a' : feedback === 'wrong' ? '#ef4444' : 'white',
                color: feedback === null ? '#16a34a' : 'white',
                border: feedback === null ? '3px solid #16a34a' : 'none',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800,
                boxShadow: feedback === null ? '0 2px 8px rgba(22,163,74,0.15)' : 'none'
              }}
            >
              {g.word}
            </motion.div>
          ))}
          {targetItem && Array.from({ length: targetItem.term.trim().split(/\s+/).filter(Boolean).length - currentGuess.length }).map((_, i) => (
            <div key={`empty-${i}`} style={{ width: 90, height: 44, border: '3px dashed #cbd5e1', borderRadius: 12 }} />
          ))}
        </div>

        {/* Word Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          {scrambled.map((word, i) => {
            const isUsed = currentGuess.some(g => g.originalIndex === i)
            return (
              <motion.button
                key={i}
                disabled={isUsed || !!feedback}
                whileHover={{ y: isUsed ? 0 : -4, boxShadow: isUsed ? 'none' : '0px 6px 0px #cbd5e1' }}
                whileTap={{ scale: 0.95, y: 0, boxShadow: '0px 0px 0px transparent' }}
                onClick={() => addWord(word, i)}
                style={{
                  width: 'auto', minWidth: 80, height: 52, padding: '0 18px',
                  background: isUsed ? '#f1f5f9' : 'white',
                  border: isUsed ? '3px solid #e2e8f0' : '3px solid #94a3b8',
                  borderRadius: 14,
                  fontSize: 16, fontWeight: 800,
                  color: isUsed ? '#cbd5e1' : '#1e293b',
                  cursor: isUsed ? 'default' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {word}
              </motion.button>
            )
          })}
        </div>

        {/* Undo */}
        <button
          onClick={removeWord}
          disabled={currentGuess.length === 0 || feedback !== null}
          style={{
            background: 'white', border: '3px solid #cbd5e1',
            color: currentGuess.length === 0 ? '#cbd5e1' : '#64748b',
            cursor: currentGuess.length === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
            margin: '0 auto', fontSize: 15, fontWeight: 800,
            padding: '10px 22px', borderRadius: 16, transition: 'all 0.2s'
          }}
          onMouseEnter={e => { if (currentGuess.length > 0) e.currentTarget.style.background = '#f8fafc' }}
          onMouseLeave={e => e.currentTarget.style.background = 'white'}
        >
          <RiDeleteBack2Fill size={18} /> Undo Last Word
        </button>
      </div>
    </div>
  )
}
