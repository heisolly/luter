import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, Trophy, CaretRight, ArrowCounterClockwise, ArrowLeft, ShareNetwork } from '@phosphor-icons/react'

export const createSeededRandom = (seedString) => {
  if (!seedString) return Math.random;
  
  // Simple robust hash function for any string
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i);
    seed = ((seed << 5) - seed) + char;
    seed = seed & seed; // Convert to 32bit integer
  }
  
  let value = Math.abs(seed);
  return () => {
    // LCG algorithm
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
};

export const shuffleWithSeed = (array, seedString) => {
  const rng = createSeededRandom(seedString);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const GameStartScreen = ({ title, description, instructions, icon: Icon, onStart, color = '#7c3aed', isMultiplayer }) => {
  const [countdown, setCountdown] = React.useState(isMultiplayer ? 3 : null)

  React.useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: '900px',
          background: 'white',
          borderRadius: '32px',
          border: '3px solid #4c1d95',
          boxShadow: `8px 8px 0px ${color}`,
          display: 'flex',
          flexWrap: 'wrap',
          overflow: 'hidden'
        }}
      >
        {/* Left Side: Illustration / Brand */}
        <div style={{ 
          flex: '1 1 300px', 
          background: color, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '40px',
          borderRight: '3px solid #4c1d95',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Abstract pattern background */}
          <div style={{ position: 'absolute', opacity: 0.1, top: -20, left: -20 }}>
            <Icon size={300} weight="fill" color="white" />
          </div>
          
          <div style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '100px', 
            border: '3px solid #4c1d95',
            boxShadow: '4px 4px 0px #4c1d95',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            minWidth: 120,
            minHeight: 120
          }}>
            {countdown !== null ? (
              <motion.div
                key={countdown}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ fontSize: 60, fontWeight: 900 }}
              >
                {countdown > 0 ? countdown : "GO!"}
              </motion.div>
            ) : (
              <Icon size={80} weight="duotone" />
            )}
          </div>
        </div>

        {/* Right Side: Content */}
        <div style={{ 
          flex: '2 1 400px', 
          padding: '48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '16px', color: '#4c1d95', letterSpacing: '-0.5px' }}>{title}</h1>
          <p style={{ fontSize: '18px', color: '#4c1d95', opacity: 0.8, marginBottom: '32px', fontWeight: 500, lineHeight: 1.6 }}>{description}</p>

          <div style={{ 
            background: '#f5f3ff', 
            borderRadius: '20px', 
            border: '2px solid #ddd6fe',
            padding: '24px', 
            marginBottom: '40px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#4c1d95', fontWeight: 800, fontSize: '15px', textTransform: 'uppercase' }}>
              <Info size={20} weight="bold" /> Instructions
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {instructions.map((inst, i) => (
                <li key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '12px', 
                  marginBottom: '12px',
                  color: '#4c1d95',
                  fontWeight: 600,
                  fontSize: '16px',
                  lineHeight: '1.5'
                }}>
                  <span style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '2px', 
                    background: color, 
                    marginTop: '8px',
                    flexShrink: 0
                  }} />
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          <motion.button 
            whileHover={countdown === null ? { y: -4, boxShadow: `0px 12px 0px #4c1d95` } : {}}
            whileTap={countdown === null ? { y: 2, boxShadow: `0px 2px 0px #4c1d95` } : {}}
            onClick={onStart}
            disabled={countdown !== null}
            style={{
              width: '100%',
              padding: '24px',
              background: countdown !== null ? '#e2e8f0' : color,
              color: countdown !== null ? '#94a3b8' : 'white',
              border: '3px solid #4c1d95',
              borderRadius: '24px',
              fontSize: '20px',
              fontWeight: 900,
              cursor: countdown !== null ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: countdown !== null ? 'none' : `0px 8px 0px #4c1d95`,
              transition: 'all 0.2s ease',
              textTransform: 'uppercase'
            }}
          >
            {countdown !== null ? (
              `Arena Starting in ${countdown > 0 ? countdown : "GO!"}`
            ) : (
              <>
                <Play size={24} weight="fill" />
                Start Game
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

const GameOverScreen = ({ score, total, xp, accuracy, onRetry, onExit, color = '#7c3aed', isGuest }) => {
  const [copied, setCopied] = React.useState(false)

  const handleShare = () => {
    const text = `I just scored ${score} points in Luter Arena! 🎮 Can you beat my score?`
    if (navigator.share) {
      navigator.share({
        title: 'Luter Arena',
        text: text,
        url: window.location.href
      }).catch(() => {
        navigator.clipboard.writeText(`${text} ${window.location.href}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ 
      minHeight: '80vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute', top: 40, background: '#16a34a', color: 'white',
              padding: '12px 24px', borderRadius: 20, fontWeight: 800, fontSize: 14, zIndex: 100,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}
          >
            Link copied to clipboard! 📋
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: 'white',
          borderRadius: '40px',
          border: '3px solid #4c1d95',
          padding: '48px',
          boxShadow: `8px 8px 0px ${color}`,
          textAlign: 'center'
        }}
      >
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ 
            width: '100px', 
            height: '100px', 
            background: '#fbbf24', 
            border: '3px solid #4c1d95',
            boxShadow: '4px 4px 0px #4c1d95',
            borderRadius: '28px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white',
            margin: '0 auto 32px'
          }}>
            <Trophy size={48} weight="fill" />
          </div>
          <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '12px', color: '#4c1d95', letterSpacing: '-1px' }}>Arena Complete!</h1>
          <p style={{ color: '#4c1d95', opacity: 0.8, fontSize: '18px', fontWeight: 500, marginBottom: '40px' }}>Outstanding performance in the arena today.</p>
        </motion.div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px', 
          marginBottom: '48px' 
        }}>
          <div style={{ background: '#f5f3ff', border: '3px solid #4c1d95', padding: '24px', borderRadius: '24px', boxShadow: '4px 4px 0px #ddd6fe' }}>
            <div style={{ fontSize: '13px', color: '#6d28d9', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>SCORE</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#4c1d95' }}>{score}</div>
          </div>
          <div style={{ background: '#f5f3ff', border: '3px solid #4c1d95', padding: '24px', borderRadius: '24px', boxShadow: '4px 4px 0px #ddd6fe' }}>
            <div style={{ fontSize: '13px', color: '#6d28d9', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>ACCURACY</div>
            <div style={{ fontSize: '36px', fontWeight: 900, color: '#10b981' }}>{accuracy}%</div>
          </div>
          <div style={{ background: color, border: '3px solid #4c1d95', padding: '24px', borderRadius: '24px', gridColumn: 'span 2', boxShadow: '4px 4px 0px #4c1d95' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>XP EARNED</div>
            <div style={{ fontSize: '48px', fontWeight: 900, color: 'white' }}>+{xp} XP</div>
          </div>
        </div>

        {isGuest && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
              padding: '24px',
              borderRadius: '24px',
              color: 'white',
              marginBottom: '32px',
              border: '3px solid #4c1d95',
              boxShadow: '4px 4px 0px #ddd6fe',
              textAlign: 'left'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '8px' }}>🚀 Save Your Progress!</h3>
            <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px', lineHeight: '1.4', fontWeight: 500 }}>
              You're currently playing as a guest. Create a free account to save your scores, earn levels, and compete on global leaderboards!
            </p>
            <button 
              onClick={() => window.location.href = '/signup'}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#4c1d95',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 900,
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              Sign Up Now
            </button>
          </motion.div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <motion.button 
            whileHover={{ y: -4, boxShadow: `0px 8px 0px #4c1d95` }}
            whileTap={{ y: 0, boxShadow: `0px 0px 0px #4c1d95` }}
            onClick={onRetry}
            style={{
              padding: '24px',
              background: '#4c1d95',
              color: 'white',
              border: '3px solid #4c1d95',
              borderRadius: '24px',
              fontSize: '18px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: `0px 4px 0px #4c1d95`,
              transition: 'background-color 0.2s',
              textTransform: 'uppercase'
            }}
          >
            <ArrowCounterClockwise size={24} weight="bold" /> Play Again
          </motion.button>
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={handleShare}
            style={{
              padding: '20px',
              background: '#f5f3ff',
              color: '#4c1d95',
              border: '3px solid #ddd6fe',
              borderRadius: '24px',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ShareNetwork size={20} weight="bold" /> {copied ? 'Link Copied!' : 'Share My Score'}
          </motion.button>
          <motion.button 
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={onExit}
            style={{
              padding: '20px',
              background: 'white',
              color: '#4c1d95',
              border: '3px solid #ddd6fe',
              borderRadius: '24px',
              fontSize: '16px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <ArrowLeft size={20} weight="bold" /> Exit Arena
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export { GameStartScreen, GameOverScreen }
