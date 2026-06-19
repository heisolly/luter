import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Info, Trophy } from '@phosphor-icons/react'
import { 
  RiRestartLine, 
  RiArrowRightLine, 
  RiShareFill, 
  RiUserSmileFill,
  RiTimeLine,
  RiFireFill
} from 'react-icons/ri'
import confetti from 'canvas-confetti'

export const createSeededRandom = (seedString) => {
  if (!seedString) return Math.random;
  let h = 0;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(31, h) + seedString.charCodeAt(i) | 0;
  }
  let value = Math.abs(h);
  const next = () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
  for (let i = 0; i < 5; i++) next();
  return next;
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

export const GameStartScreen = ({ title, description, instructions, icon: Icon, onStart, color = '#7c3aed', isMultiplayer }) => {
  const [countdown, setCountdown] = React.useState(isMultiplayer ? 3 : null)

  React.useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  return (
    <div style={{ 
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '900px', background: 'white', borderRadius: '32px',
          border: '3px solid #C4B5FD', boxShadow: `8px 8px 0px ${color}`,
          display: 'flex', flexWrap: 'wrap', overflow: 'hidden'
        }}
      >
        <div style={{ 
          flex: '1 1 300px', background: color, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '40px',
          borderRight: '3px solid #C4B5FD', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', opacity: 0.1, top: -20, left: -20 }}>
            <Icon size={300} weight="fill" color="white" />
          </div>
          <div style={{ 
            background: 'white', padding: '32px', borderRadius: '100px', 
            border: '3px solid #C4B5FD', boxShadow: '4px 4px 0px #C4B5FD',
            zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color, minWidth: 120, minHeight: 120
          }}>
            {countdown !== null ? (
              <motion.div key={countdown} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ fontSize: 60, fontWeight: 900 }}>
                {countdown > 0 ? countdown : "GO!"}
              </motion.div>
            ) : (
              <Icon size={80} weight="duotone" />
            )}
          </div>
        </div>

        <div style={{ flex: '2 1 400px', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 900, marginBottom: '16px', color: '#6D28D9', letterSpacing: '-0.5px' }}>{title}</h1>
          <p style={{ fontSize: '18px', color: '#7C3AED', opacity: 0.8, marginBottom: '32px', fontWeight: 500, lineHeight: 1.6 }}>{description}</p>
          <div style={{ background: '#F5F3FF', borderRadius: '20px', border: '2px solid #DDD6FE', padding: '24px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#6D28D9', fontWeight: 800, fontSize: '15px', textTransform: 'uppercase' }}>
              <Info size={20} weight="bold" /> Instructions
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {instructions.map((inst, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px', color: '#6D28D9', fontWeight: 600, fontSize: '16px', lineHeight: '1.5' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: color, marginTop: '8px', flexShrink: 0 }} />
                  {inst}
                </li>
              ))}
            </ul>
          </div>

          <motion.button 
            whileHover={countdown === null ? { y: -4, boxShadow: `0px 12px 0px #86EFAC` } : {}}
            whileTap={countdown === null ? { y: 2, boxShadow: `0px 2px 0px #86EFAC` } : {}}
            onClick={onStart}
            disabled={countdown !== null}
            style={{
              width: '100%', padding: '24px',
              background: countdown !== null ? '#e2e8f0' : '#98FF98',
              color: countdown !== null ? '#94a3b8' : '#166534',
              border: '3px solid #86EFAC',
              borderRadius: '24px', fontSize: '20px', fontWeight: 900,
              cursor: countdown !== null ? 'default' : 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '12px',
              boxShadow: countdown !== null ? 'none' : `0px 8px 0px #86EFAC`, transition: 'all 0.2s ease',
              textTransform: 'uppercase'
            }}
          >
            {countdown !== null ? `Arena Starting in ${countdown > 0 ? countdown : "GO!"}` : (
              <><Play size={24} weight="fill" /> Start Game</>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export const MultiplayerHUD = ({ participants, user, color = '#7c3aed' }) => {
  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, display: 'flex', flexDirection: 'column',
      gap: 12, zIndex: 1000, fontFamily: "'DM Sans', sans-serif", pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {participants
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .map((p, idx) => {
            const isMe = user.id ? p.user_id === user.id : p.guest_name === user.guest_name
            return (
              <motion.div
                key={p.id} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} layout
                style={{
                  background: isMe ? color : 'white', color: isMe ? 'white' : '#1e293b',
                  padding: '10px 16px', borderRadius: 16, display: 'flex', alignItems: 'center',
                  gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: isMe ? 'none' : '2px solid #e2e8f0',
                  minWidth: 160, pointerEvents: 'auto'
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10, background: isMe ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>
                    {p.profiles?.full_name || p.guest_name || 'Player'}
                    {isMe && ' (You)'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>
                    {p.score || 0} pts
                  </div>
                </div>
                {idx === 0 && <Trophy size={20} weight="fill" color={isMe ? '#fbbf24' : '#f59e0b'} />}
              </motion.div>
            )
          })}
      </AnimatePresence>
    </div>
  )
}

export const GameOverScreen = ({ score, total, xp, accuracy, onRetry, onExit, color = '#7c3aed', isGuest, room }) => {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [color, '#fbbf24', '#ffffff'] })
    const end = Date.now() + 2000
    const frame = () => {
      confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors: [color, '#fbbf24'] })
      confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors: [color, '#fbbf24'] })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  const handleShare = () => {
    const text = `I just scored ${score} points in Luter Arena! 🎮`
    if (navigator.share) {
      navigator.share({ title: 'Luter Arena', text, url: window.location.href }).catch(() => {
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

  const handlePlayNext = () => {
    const games = ['brain-blitz', 'stacker', 'term-builder', 'matching']
    const next = games[Math.floor(Math.random() * games.length)]
    onExit?.(next)
  }

  return (
    <div style={{ 
      minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', position: 'relative', fontFamily: "'DM Sans', sans-serif"
    }}>
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
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
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '640px', background: 'white', borderRadius: '48px',
          border: '4px solid #C4B5FD', padding: 'clamp(24px, 5vw, 48px)',
          boxShadow: '12px 12px 0px #C4B5FD', textAlign: 'center', position: 'relative'
        }}
      >
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={{ 
            width: '90px', height: '90px', background: '#fbbf24', border: '4px solid #C4B5FD',
            boxShadow: '4px 4px 0px #C4B5FD', borderRadius: '24px', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', color: 'white',
            margin: '0 auto 28px', transform: 'rotate(-5deg)'
          }}>
            <Trophy size={48} weight="fill" />
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 900, marginBottom: '8px', color: '#1e293b', letterSpacing: '-1.5px' }}>Arena Cleared!</h1>
          <p style={{ color: '#64748b', fontSize: '18px', fontWeight: 600, marginBottom: '40px' }}>Outstanding performance in the arena today.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#f8fafc', border: '3px solid #e2e8f0', padding: '20px', borderRadius: '24px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px', letterSpacing: '1px' }}>TOTAL SCORE</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#1e293b' }}>{score}</div>
          </div>
          <div style={{ background: '#f8fafc', border: '3px solid #e2e8f0', padding: '20px', borderRadius: '24px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px', letterSpacing: '1px' }}>ACCURACY</div>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#10b981' }}>{accuracy}%</div>
          </div>
          <div style={{ 
            background: `linear-gradient(135deg, ${color} 0%, #4C1D95 100%)`, 
            border: '4px solid #C4B5FD', padding: '24px', borderRadius: '28px', 
            gridColumn: '1 / -1', boxShadow: `0 8px 32px ${color}33`, color: 'white'
          }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 800, marginBottom: '4px', letterSpacing: '2px' }}>EXPERIENCE EARNED</div>
            <div style={{ fontSize: '56px', fontWeight: 900 }}>+{xp} XP</div>
          </div>
        </div>

        {isGuest && (
          <div style={{
            background: '#f1f5f9', padding: '24px', borderRadius: '24px', marginBottom: '32px',
            textAlign: 'left', border: '2px dashed #cbd5e1'
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ background: color, color: 'white', padding: 8, borderRadius: 10 }}>
                <RiUserSmileFill size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b', marginBottom: '4px' }}>Save Your Progress</h3>
                <p style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, lineHeight: '1.4' }}>
                  Create an account to track your levels and compete in the global ranks!
                </p>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/signup'}
              style={{
                width: '100%', padding: '12px', background: 'white', color: color,
                border: `2px solid ${color}`, borderRadius: '12px', fontWeight: 900,
                fontSize: '14px', cursor: 'pointer', marginTop: 16
              }}
            >
              CREATE ACCOUNT
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <motion.button
            whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98, y: 0 }} onClick={onRetry}
            style={{
              padding: '18px', background: '#98FF98', color: '#166534', border: 'none',
              borderRadius: '18px', fontWeight: 900, fontSize: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            <RiRestartLine size={22} /> PLAY AGAIN
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -4, boxShadow: `0 8px 24px ${color}44` }}
            whileTap={{ scale: 0.98, y: 0 }} onClick={handlePlayNext}
            style={{
              padding: '18px', background: color, color: 'white', border: 'none',
              borderRadius: '18px', fontWeight: 900, fontSize: '16px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
            }}
          >
            PLAY NEXT <RiArrowRightLine size={22} />
          </motion.button>

          <button
            onClick={handleShare}
            style={{
              gridColumn: '1 / -1', padding: '14px', background: '#f8fafc', color: '#64748b',
              border: '2px solid #e2e8f0', borderRadius: '16px', fontWeight: 800,
              fontSize: '14px', cursor: 'pointer', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8
            }}
          >
            <RiShareFill size={18} /> {copied ? 'COPIED!' : 'SHARE SCORE'}
          </button>

          <button
            onClick={() => onExit()}
            style={{
              gridColumn: '1 / -1', padding: '12px', background: 'transparent', color: '#94a3b8',
              border: 'none', fontWeight: 700, fontSize: '13px', cursor: 'pointer'
            }}
          >
            EXIT ARENA
          </button>
        </div>
      </motion.div>
    </div>
  )
}


