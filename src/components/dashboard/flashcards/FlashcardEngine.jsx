import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkle, 
  Palette, 
  Layout, 
  TextT, 
  Image as ImageIcon, 
  FileText,
  Columns,
  ShareNetwork, 
  ArrowLeft, 
  ArrowRight, 
  ArrowsClockwise,
  CheckCircle,
  Trophy,
  Lightning,
  Clock,
  Play,
  PencilSimple,
  Download,
  CornersOut,
  Sticker,
  Confetti,
  MusicNotes,
  User,
  Share,
  DotsThreeVertical,
  Plus,
  Upload,
  Eraser,
  Pencil,
  Crop,
  X
} from '@phosphor-icons/react'
import { 
  RiStarFill as Star, 
  RiFlashlightFill as Zap,
  RiStackFill as Layers,
  RiInformationFill as Info
} from 'react-icons/ri'
import canvasConfetti from 'canvas-confetti'

// --- CONSTANTS & THEMES ---

export const FLASHCARD_THEMES = {
  minimal: [
    { id: 'clean-white', name: 'Clean White', bg: '#FFFFFF', text: '#1E293B', border: '1px solid #E2E8F0', shadow: '0 4px 20px rgba(0,0,0,0.05)', accent: '#6D28D9' },
    { id: 'soft-gray', name: 'Soft Gray', bg: '#F8FAFC', text: '#334155', border: '1px solid #E2E8F0', shadow: '0 4px 20px rgba(0,0,0,0.03)', accent: '#475569' },
    { id: 'black-glass', name: 'Black Glass', bg: 'rgba(15, 23, 42, 0.9)', text: '#F8FAFC', blur: '20px', border: '1px solid rgba(255,255,255,0.1)', shadow: '0 20px 50px rgba(0,0,0,0.3)', accent: '#F8FAFC' },
    { id: 'nordic', name: 'Nordic Notes', bg: '#ECEFF4', text: '#2E3440', border: '1px solid #D8DEE9', shadow: 'none', accent: '#88C0D0' }
  ],
  fun: [
    { id: 'bubblegum', name: 'Bubblegum', bg: 'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)', text: '#D81B60', shadow: '0 10px 25px rgba(216, 27, 96, 0.15)', accent: '#D81B60', font: 'var(--font-outfit)' },
    { id: 'candy-neon', name: 'Candy Neon', bg: 'linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 100%)', text: '#4A0082', shadow: '0 10px 30px rgba(74, 0, 130, 0.2)', accent: '#4A0082' },
    { id: 'kawaii', name: 'Kawaii', bg: '#FFF1F2', text: '#FB7185', border: '4px solid #FECDD3', shadow: '8px 8px 0px #FFE4E6', accent: '#FB7185' }
  ],
  gaming: [
    { id: 'cyberpunk', name: 'Cyberpunk', bg: '#000000', text: '#00FF41', border: '2px solid #00FF41', shadow: '0 0 20px rgba(0,255,65,0.4)', glow: '0 0 10px rgba(0,255,65,0.5)', accent: '#00FF41', font: 'monospace' },
    { id: 'pixel-terminal', name: 'Retro Arcade', bg: '#1A1A1A', text: '#FFD700', border: '4px double #FFD700', shadow: '4px 4px 0px #000', accent: '#FFD700', font: 'monospace' },
    { id: 'matrix', name: 'Matrix Hacker', bg: 'linear-gradient(180deg, #0D0208 0%, #003B00 100%)', text: '#00FF41', accent: '#00FF41', font: 'monospace' }
  ],
  premium: [
    { 
      id: 'glass-pro', 
      name: 'Glassmorphism Pro', 
      bg: 'rgba(255, 255, 255, 0.1)', 
      text: '#FFFFFF', 
      blur: '40px', 
      border: '1px solid rgba(255,255,255,0.2)', 
      shadow: '0 25px 50px rgba(0,0,0,0.2)', 
      accent: '#FFFFFF',
      containerBg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    { 
      id: 'holographic', 
      name: 'Holo-Sticker', 
      bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', 
      text: '#2D3748', 
      border: 'none', 
      shadow: '0 10px 30px rgba(142, 197, 252, 0.5)', 
      accent: '#6D28D9',
      isHolo: true
    },
    { 
      id: 'midnight-gold', 
      name: 'Midnight Gold', 
      bg: '#0F172A', 
      text: '#FCD34D', 
      border: '2px solid #FCD34D', 
      shadow: '0 0 30px rgba(252, 211, 77, 0.2)', 
      accent: '#FCD34D',
      font: 'serif'
    },
    { 
      id: 'sunset-vibes', 
      name: 'Sunset Vibes', 
      bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', 
      text: '#431407', 
      shadow: '0 15px 35px rgba(255, 154, 158, 0.3)', 
      accent: '#991B1B' 
    },
    { 
      id: 'stealth-black', 
      name: 'Carbon Stealth', 
      bg: '#111111', 
      text: '#EDEDED', 
      border: '1px solid #333333', 
      shadow: '0 20px 40px rgba(0,0,0,0.5)', 
      accent: '#6D28D9',
      texture: 'carbon'
    }
  ],
  study: [
    { id: 'brown-notes', name: 'Brown Notes', bg: '#FDFCF0', text: '#451A03', border: '1px solid #E7E5E4', shadow: '0 2px 10px rgba(0,0,0,0.05)', accent: '#78350F' },
    { id: 'library', name: 'Library', bg: '#F5F5F4', text: '#1C1917', border: '1.5px solid #D6D3D1', shadow: '0 10px 30px rgba(0,0,0,0.05)', accent: '#1C1917' },
    { id: 'dark-academia', name: 'Dark Academia', bg: '#1C1917', text: '#F5F5F4', border: '1px solid #44403C', accent: '#A8A29E' }
  ],
  cinematic: [
    { id: 'galaxy', name: 'Galaxy', bg: 'linear-gradient(135deg, #0F0C29 0%, #302B63 50%, #24243E 100%)', text: '#FFFFFF', shadow: '0 10px 40px rgba(48, 43, 99, 0.4)', accent: '#FFFFFF' },
    { id: 'aurora', name: 'Aurora', bg: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', text: '#FFFFFF', shadow: '0 10px 30px rgba(0, 114, 255, 0.3)', accent: '#FFFFFF' },
    { id: 'midnight', name: 'Midnight Blue', bg: '#0F172A', text: '#F8FAFC', border: '1px solid rgba(255,255,255,0.1)', shadow: '0 20px 50px rgba(0,0,0,0.4)', accent: '#38BDF8' }
  ]
}

export const FLASHCARD_LAYOUTS = [
  { id: 'centered', name: 'Centered', icon: Layout },
  { id: 'split', name: 'Split View', icon: Columns },
  { id: 'classic', name: 'Classic', icon: FileText },
  { id: 'polaroid', name: 'Polaroid', icon: ImageIcon }
]

// --- COMPONENTS ---

export function FlashcardEngine({ material, items = [], user }) {
  const [activeMode, setActiveMode] = useState('study') // study | design
  const [selectedTheme, setSelectedTheme] = useState(FLASHCARD_THEMES.minimal[0])
  const [selectedLayout, setSelectedLayout] = useState('classic')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredIds, setMasteredIds] = useState(new Set())
  const [isFinished, setIsFinished] = useState(false)
  
  // New States for Phase 2
  const [cardDecorations, setCardDecorations] = useState({}) // { cardIndex: { front: { stickers: [], image: null, doodles: [] }, back: {...} } }
  const [activeTool, setActiveTool] = useState(null) // 'image' | 'sticker' | 'doodle'
  const [activeFilter, setActiveFilter] = useState('none')
  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const socketRef = useRef(null)

  const cards = React.useMemo(() => {
    if (!items) return []
    const baseItems = Array.isArray(items) ? items : (items.flashcards || items.items || [])
    return baseItems.map(card => ({
      ...card,
      front: card.front || card.question || 'No content available',
      back: card.back || card.answer || 'No content available'
    }))
  }, [items])

  const currentCard = cards[currentIndex] || { front: 'No content', back: 'No content' }
  const progress = cards.length > 0 ? (masteredIds.size / cards.length) * 100 : 0

  if (cards.length === 0) {
    return (
      <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#F8FAFC' }}>
        <div style={{ width: '80px', height: '80px', background: '#F5F3FF', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <Layers size={40} color="#A78BFA" />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1A102D', marginBottom: '8px', fontFamily: 'var(--font-outfit)' }}>Ready for recall?</h3>
        <p style={{ color: '#64748B', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Generate your first study deck from the material analysis to begin.</p>
      </div>
    )
  }

  // Multiplayer Logic
  useEffect(() => {
    if (isMultiplayer && !socketRef.current) {
      // Connect to the battle server (reusing existing infra)
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
        query: { userId: user?.id, type: 'flashcards' }
      })

      const roomId = `flashcards_${material?.id}`
      socketRef.current.emit('join_battle', { sessionId: roomId, userId: user?.id })

      socketRef.current.on('opponent_progress', (data) => {
        if (data.currentIndex !== undefined) setCurrentIndex(data.currentIndex)
        if (data.isFlipped !== undefined) setIsFlipped(data.isFlipped)
        if (data.decorations) setCardDecorations(data.decorations)
        if (data.themeId) {
          const allThemes = Object.values(FLASHCARD_THEMES).flat()
          const theme = allThemes.find(t => t.id === data.themeId)
          if (theme) setSelectedTheme(theme)
        }
      })
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [isMultiplayer, material?.id, user?.id])

  // Broadcaster for Multiplayer
  const broadcastUpdate = (updates) => {
    if (isMultiplayer && socketRef.current) {
      socketRef.current.emit('submit_answer', {
        sessionId: `flashcards_${material?.id}`,
        userId: user?.id,
        ...updates
      })
    }
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      const nextIdx = currentIndex + 1
      setCurrentIndex(nextIdx)
      setIsFlipped(false)
      broadcastUpdate({ currentIndex: nextIdx, isFlipped: false })
    } else {
      setIsFinished(true)
      triggerConfetti()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1
      setCurrentIndex(prevIdx)
      setIsFlipped(false)
      broadcastUpdate({ currentIndex: prevIdx, isFlipped: false })
    }
  }

  const handleFlip = () => {
    if (!activeTool) {
      const nextFlipped = !isFlipped
      setIsFlipped(nextFlipped)
      broadcastUpdate({ isFlipped: nextFlipped })
    }
  }

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme)
    broadcastUpdate({ themeId: theme.id })
  }

  const handleDecorationChange = (newDecorations) => {
    setCardDecorations(newDecorations)
    broadcastUpdate({ decorations: newDecorations })
  }

  const triggerConfetti = () => {
    canvasConfetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6D28D9', '#EC4899', '#3B82F6']
    })
  }

  if (isFinished) {
    return <FlashcardMastery cardsCount={cards.length} masteredCount={masteredIds.size} onReset={() => {
      setCurrentIndex(0)
      setMasteredIds(new Set())
      setIsFinished(false)
      setIsFlipped(false)
    }} />
  }

  return (
    <div className="flashcard-engine" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      background: selectedTheme.containerBg || 'transparent',
      transition: 'background 0.5s ease'
    }}>
      {/* Engine Header / Toolbar */}
      <div style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A102D', margin: 0, fontFamily: 'var(--font-outfit)' }}>
            {activeMode === 'study' ? 'Recall Master' : 'Designer Engine'}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', margin: 0 }}>{material?.title || 'Study Session'}</p>
        </div>
        
        <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <button 
            onClick={() => setActiveMode('study')}
            style={{ 
              padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', transition: '0.2s',
              background: activeMode === 'study' ? 'white' : 'transparent',
              color: activeMode === 'study' ? '#6D28D9' : '#64748B',
              boxShadow: activeMode === 'study' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Study
          </button>
          <button 
            onClick={() => setActiveMode('design')}
            style={{ 
              padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', transition: '0.2s',
              background: activeMode === 'design' ? 'white' : 'transparent',
              color: activeMode === 'design' ? '#6D28D9' : '#64748B',
              boxShadow: activeMode === 'design' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
            }}
          >
            Design
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main Canvas */}
        <div style={{ flex: 1, padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', position: 'relative' }}>
          
          {/* Background Decorative Blobs */}
          <div style={{ position: 'absolute', top: '10%', left: '10%', width: '300px', height: '300px', background: 'rgba(109, 40, 217, 0.03)', filter: 'blur(80px)', borderRadius: '50%' }}></div>
          <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'rgba(236, 72, 153, 0.03)', filter: 'blur(100px)', borderRadius: '50%' }}></div>

          {/* Flashcard Area */}
          <div style={{ width: '100%', maxWidth: '560px', perspective: '2000px', zIndex: 10 }}>
            <motion.div
              key={currentIndex}
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              style={{ width: '100%', height: '400px', position: 'relative' }}
            >
              <Flashcard 
                card={currentCard} 
                isFlipped={isFlipped} 
                onFlip={handleFlip} 
                theme={selectedTheme}
                layout={selectedLayout}
                decorations={cardDecorations[currentIndex]}
                filter={activeFilter}
                isDrawing={activeTool === 'doodle'}
              />
            </motion.div>
          </div>

          {/* Controls */}
          {activeMode === 'study' && (
            <div style={{ marginTop: '48px', display: 'flex', alignItems: 'center', gap: '24px', zIndex: 10 }}>
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', opacity: currentIndex === 0 ? 0.3 : 1, transition: 'all 0.2s' }}
                onMouseEnter={(e) => { if (currentIndex !== 0) e.currentTarget.style.borderColor = '#6D28D9'; }}
                onMouseLeave={(e) => { if (currentIndex !== 0) e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <ArrowLeft weight="bold" size={18} />
              </button>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                 <button 
                  onClick={() => { setMasteredIds(prev => new Set(prev).add(currentIndex)); handleNext(); }}
                  style={{ 
                    padding: '14px 32px', borderRadius: '14px', background: '#A78BFA', color: 'white', 
                    border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', 
                    alignItems: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(167, 139, 250, 0.3)', 
                    fontFamily: 'var(--font-outfit)', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#8B5CF6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#A78BFA'; e.currentTarget.style.transform = 'translateY(0)'; }}
                 >
                   <CheckCircle weight="fill" size={20} /> I Got It 
                 </button>
                 <button 
                  onClick={handleNext}
                  style={{ 
                    padding: '14px 24px', borderRadius: '14px', background: 'white', color: '#64748B', 
                    border: '1px solid #E2E8F0', fontWeight: 600, fontSize: '14px', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                    fontFamily: 'var(--font-outfit)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#64748B'; e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'white'; }}
                 >
                   Skip Card <ArrowsClockwise weight="bold" size={20} />
                 </button>
              </div>

              <button 
                onClick={handleNext}
                style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'white', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6D28D9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; }}
              >
                <ArrowRight weight="bold" size={18} />
              </button>
            </div>
          )}

          {/* Progress Indicator */}
          <div style={{ marginTop: '40px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
               <span>Card {currentIndex + 1} of {cards.length}</span>
               <span>{Math.round(progress)}% Mastered</span>
             </div>
             <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
                 style={{ height: '100%', background: '#A78BFA', borderRadius: '10px' }}
                />
             </div>
          </div>
        </div>

        {/* Sidebar / Designer Panel */}
        {activeMode === 'design' && (
          <aside style={{ width: '360px', background: 'white', borderLeft: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ marginBottom: '32px' }}>
                <SectionHeader icon={Palette} title="Themes" />
                <ThemeGrid selectedId={selectedTheme.id} onSelect={setSelectedTheme} />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <SectionHeader icon={Layout} title="Layouts" />
                <LayoutGrid selectedId={selectedLayout} onSelect={setSelectedLayout} />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <SectionHeader icon={TextT} title="Typography" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <TypographyItem label="Outfit (Modern)" active />
                  <TypographyItem label="Varela Round (Soft)" />
                  <TypographyItem label="JetBrains (Mono)" />
                  <TypographyItem label="Playfair (Classic)" />
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <SectionHeader icon={ImageIcon} title="Image System" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#F8FAFC', 
                    borderRadius: '12px', border: '1.5px dashed #E2E8F0', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                  }}>
                    <Upload size={18} /> Upload Background
                    <input type="file" hidden accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const url = e.target.result;
                          const side = isFlipped ? 'back' : 'front';
                          const newDecorations = {
                            ...cardDecorations,
                            [currentIndex]: {
                              ...(cardDecorations[currentIndex] || {}),
                              [side]: {
                                ...(cardDecorations[currentIndex]?.[side] || {}),
                                image: url
                              }
                            }
                          };
                          handleDecorationChange(newDecorations);
                        };
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {['none', 'grayscale(1)', 'sepia(1)', 'blur(4px)', 'brightness(1.5)', 'invert(1)'].map(f => (
                      <button 
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        style={{ 
                          padding: '8px', fontSize: '10px', borderRadius: '8px', border: activeFilter === f ? '2px solid #6D28D9' : '1px solid #E2E8F0',
                          background: 'white', cursor: 'pointer', textTransform: 'capitalize'
                        }}
                      >
                        {f.split('(')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <SectionHeader icon={Sticker} title="Stickers" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {['✨', '🔥', '💡', '✅', '❌', '📚', '🎯', '🧠'].map(s => (
                    <button 
                      key={s}
                      onClick={() => {
                        const side = isFlipped ? 'back' : 'front';
                        const newDecorations = {
                          ...cardDecorations,
                          [currentIndex]: {
                            ...(cardDecorations[currentIndex] || {}),
                            [side]: {
                              ...(cardDecorations[currentIndex]?.[side] || {}),
                              stickers: [...(cardDecorations[currentIndex]?.[side]?.stickers || []), { id: Date.now(), emoji: s, x: 50, y: 50 }]
                            }
                          }
                        };
                        handleDecorationChange(newDecorations);
                      }}
                      style={{ 
                        fontSize: '24px', padding: '8px', background: 'white', border: '1px solid #F1F5F9', 
                        borderRadius: '12px', cursor: 'pointer' 
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <SectionHeader icon={Pencil} title="Doodles" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setActiveTool(activeTool === 'doodle' ? null : 'doodle')}
                    style={{ 
                      flex: 1, padding: '12px', borderRadius: '12px', border: activeTool === 'doodle' ? '2px solid #6D28D9' : '1px solid #E2E8F0',
                      background: activeTool === 'doodle' ? '#F5F3FF' : 'white', color: activeTool === 'doodle' ? '#6D28D9' : '#1A102D',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                  >
                    <Pencil size={18} /> {activeTool === 'doodle' ? 'Stop Drawing' : 'Start Doodle'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <SectionHeader icon={User} title="Multiplayer" />
                <button 
                  onClick={() => setIsMultiplayer(!isMultiplayer)}
                  style={{ 
                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                    background: isMultiplayer ? '#10B981' : '#F1F5F9', color: isMultiplayer ? 'white' : '#64748B',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <Lightning size={18} weight="fill" /> {isMultiplayer ? 'Sync Active' : 'Go Live (Sync)'}
                </button>
              </div>
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid #F1F5F9' }}>
              <button style={{ width: '100%', padding: '14px', borderRadius: '16px', background: '#000', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                <ShareNetwork weight="bold" size={20} /> Share Deck
              </button>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function Flashcard({ card, isFlipped, onFlip, theme, layout, decorations, filter, isDrawing }) {
  const isMinimal = theme.id === 'clean-white' || theme.id === 'soft-gray'
  const isDark = theme.id === 'black-glass' || theme.id === 'cyberpunk' || theme.id === 'matrix' || theme.id === 'dark-academia' || theme.id.includes('midnight') || theme.id === 'galaxy'

  return (
    <motion.div
      onClick={onFlip}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      style={{ 
        width: '100%', 
        height: '100%', 
        transformStyle: 'preserve-3d', 
        cursor: isDrawing ? 'crosshair' : 'pointer',
        position: 'relative'
      }}
    >
      {/* Front */}
      <CardFace 
        side="front" 
        content={card.front} 
        theme={theme} 
        isDark={isDark} 
        isMinimal={isMinimal}
        layout={layout}
        decorations={decorations?.front}
        filter={filter}
        isDrawing={isDrawing && !isFlipped}
      />

      {/* Back */}
      <CardFace 
        side="back" 
        content={card.back} 
        theme={theme} 
        isDark={isDark} 
        isMinimal={isMinimal}
        layout={layout}
        decorations={decorations?.back}
        filter={filter}
        isDrawing={isDrawing && isFlipped}
        style={{ transform: 'rotateY(180deg)' }}
      />
    </motion.div>
  )
}

function CardFace({ side, content, theme, isDark, isMinimal, layout, decorations, filter, isDrawing, style = {} }) {
  const canvasRef = useRef(null)
  const [isHoloHover, setIsHoloHover] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    if (!theme.isHolo) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setIsHoloHover({ x, y })
  }
  
  return (
    <div 
      onMouseMove={handleMouseMove}
      style={{ 
      position: 'absolute', 
      inset: 0, 
      backfaceVisibility: 'hidden', 
      borderRadius: theme.borderRadius || '32px', 
      background: theme.bg, 
      color: theme.text,
      border: theme.border || 'none',
      boxShadow: theme.shadow || '0 20px 40px rgba(0,0,0,0.1)',
      backdropFilter: theme.blur ? `blur(${theme.blur})` : 'none',
      display: 'flex',
      flexDirection: 'column',
      padding: '48px',
      overflow: 'hidden',
      ...style
    }}>
      {/* Holographic Overlay */}
      {theme.isHolo && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${isHoloHover.x}% ${isHoloHover.y}%, rgba(255,255,255,0.4) 0%, transparent 50%)`,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 5
        }} />
      )}

      {/* Carbon Texture */}
      {theme.texture === 'carbon' && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(#333 1px, transparent 1px)`,
          backgroundSize: '4px 4px',
          opacity: 0.2,
          pointerEvents: 'none'
        }} />
      )}
      {/* Background Image System */}
      {decorations?.image && (
        <div style={{ 
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: `url(${decorations.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: filter || 'none', opacity: 0.4
        }} />
      )}

      {/* Stickers System */}
      {decorations?.stickers?.map(s => (
        <motion.div 
          key={s.id}
          drag
          dragMomentum={false}
          style={{ position: 'absolute', top: `${s.y}%`, left: `${s.x}%`, fontSize: '40px', cursor: 'grab', zIndex: 20 }}
        >
          {s.emoji}
        </motion.div>
      ))}

      {/* Doodle Layer (Phase 2 Simplified) */}
      {isDrawing && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 15, background: 'rgba(255,255,255,0.05)' }}>
          <p style={{ position: 'absolute', top: 10, right: 10, fontSize: '10px', background: '#000', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>Doodle Mode ON</p>
        </div>
      )}

      {/* Texture Overlays */}
      {theme.id === 'black-glass' && <div style={{ position: 'absolute', inset: 0, background: 'url("https://www.transparenttextures.com/patterns/dark-matter.png")', opacity: 0.05, pointerEvents: 'none' }}></div>}
      
      {/* Side Label */}
      <div style={{ position: 'absolute', top: '32px', left: '48px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4, color: theme.accent, zIndex: 10 }}>
        {side === 'front' ? 'Question' : 'Answer'}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: layout === 'centered' ? 'center' : 'flex-start', textAlign: layout === 'centered' ? 'center' : 'left', zIndex: 10 }}>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 700, 
          lineHeight: 1.4, 
          fontFamily: theme.font || 'var(--font-outfit)',
          textShadow: theme.glow ? theme.glow : 'none',
        }}>
          {content}
        </div>
      </div>

      {/* Footer / Interaction Hint */}
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ fontSize: '12px', opacity: 0.3, fontWeight: 600 }}>Tap to flip</div>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          <ArrowsClockwise size={16} />
        </div>
      </div>
    </div>
  )
}

// --- SUB-COMPONENTS ---

function SectionHeader({ icon: Icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', color: '#6D28D9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} weight="bold" />
      </div>
      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1A102D', margin: 0, fontFamily: 'var(--font-outfit)' }}>{title}</h3>
    </div>
  )
}

function ThemeGrid({ selectedId, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
      {Object.entries(FLASHCARD_THEMES).flatMap(([cat, themes]) => themes).map(theme => (
        <button
          key={theme.id}
          onClick={() => onSelect(theme)}
          style={{ 
            padding: '12px', borderRadius: '14px', border: selectedId === theme.id ? '2px solid #6D28D9' : '1.5px solid #F1F5F9',
            background: theme.bg, color: theme.text, cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
            height: '80px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{theme.name}</span>
          {selectedId === theme.id && <div style={{ position: 'absolute', top: '8px', right: '8px', width: '6px', height: '6px', borderRadius: '50%', background: '#6D28D9' }}></div>}
        </button>
      ))}
    </div>
  )
}

function LayoutGrid({ selectedId, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
      {FLASHCARD_LAYOUTS.map(layout => (
        <button
          key={layout.id}
          onClick={() => onSelect(layout.id)}
          style={{ 
            aspectRatio: '1', borderRadius: '12px', border: selectedId === layout.id ? '2px solid #6D28D9' : '1.5px solid #F1F5F9',
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s'
          }}
        >
          <layout.icon size={20} weight={selectedId === layout.id ? "fill" : "bold"} color={selectedId === layout.id ? "#6D28D9" : "#64748B"} />
        </button>
      ))}
    </div>
  )
}

function TypographyItem({ label, active }) {
  return (
    <button style={{ 
      width: '100%', padding: '12px 16px', borderRadius: '12px', border: active ? '1.5px solid #6D28D9' : '1px solid #F1F5F9',
      background: active ? '#F5F3FF' : 'white', color: active ? '#6D28D9' : '#1A102D', textAlign: 'left',
      fontSize: '13px', fontWeight: 600, cursor: 'pointer'
    }}>
      {label}
    </button>
  )
}

function FlashcardMastery({ cardsCount, masteredCount, onReset }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}
    >
      <div style={{ width: '120px', height: '120px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
        <Trophy size={64} weight="fill" color="#6D28D9" />
      </div>
      <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1A102D', marginBottom: '12px', fontFamily: 'var(--font-outfit)' }}>Session Complete!</h2>
      <p style={{ color: '#64748B', fontSize: '16px', marginBottom: '40px', maxWidth: '300px' }}>You've reviewed all cards and mastered {masteredCount} of them. Ready to go again?</p>
      
      <div style={{ display: 'flex', gap: '16px' }}>
        <button 
          onClick={onReset}
          style={{ padding: '14px 32px', borderRadius: '16px', background: '#6D28D9', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <ArrowsClockwise size={20} weight="bold" /> Restart Deck
        </button>
        <button style={{ padding: '14px 32px', borderRadius: '16px', background: 'white', color: '#1A102D', border: '1.5px solid #E2E8F0', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShareNetwork size={20} weight="bold" /> Share Stats
        </button>
      </div>
    </motion.div>
  )
}


