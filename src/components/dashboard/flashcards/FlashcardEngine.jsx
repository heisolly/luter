import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, ArrowRight, Check, ArrowsClockwise, 
  ShareNetwork, Gear, Plus, Play, Shuffle, 
  Star, PencilLine, X, Sparkle, ArrowUp, FloppyDisk, 
  Trash, LinkSimple, CaretDown, ArrowSquareOut
} from '@phosphor-icons/react'
import { supabase } from '../../../supabaseClient'

// --- GLOBAL STYLES & DEFINITIONS ---

const primaryPill = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  background: '#C4B5FD',
  color: '#3B0764',
  border: 'none',
  borderRadius: '9999px',
  padding: '13px 32px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
}

const ghostPill = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  background: 'white',
  color: '#374151',
  border: '1.5px solid #E5E7EB',
  borderRadius: '9999px',
  padding: '13px 32px',
  fontSize: '15px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 150ms ease',
  fontFamily: 'inherit',
}

const darkPill = {
  ...primaryPill,
  background: '#7C3AED',
  color: 'white',
}

const primaryBadge = {
  background: 'rgba(109,40,217,0.15)',
  color: '#5B21B6',
  borderRadius: '6px',
  padding: '2px 8px',
  fontSize: '12px',
  fontFamily: 'monospace',
  fontWeight: '700',
  lineHeight: '1.4',
}

const ghostBadge = {
  background: '#F3F4F6',
  color: '#6B7280',
  borderRadius: '6px',
  padding: '2px 8px',
  fontSize: '12px',
  fontFamily: 'monospace',
  fontWeight: '700',
  lineHeight: '1.4',
}

const darkBadge = {
  background: 'rgba(255,255,255,0.2)',
  color: 'white',
  borderRadius: '6px',
  padding: '2px 7px',
  fontSize: '11px',
  fontFamily: 'monospace',
  fontWeight: '700',
}

const CARD_STYLES = [
  { id: 'classic', name: 'Classic' },
  { id: 'gradient', name: 'Gradient' },
  { id: 'illustrated', name: 'Illustrated' },
  { id: 'dark', name: 'Dark' },
  { id: 'pastel', name: 'Pastel' },
  { id: 'doodle', name: 'Doodle' }
]

const getCardBackground = (styleId) => {
  switch (styleId) {
    case 'gradient': return 'linear-gradient(135deg, #7C3AED, #A78BFA)'
    case 'illustrated': return '#F5F3FF'
    case 'dark': return '#111827'
    case 'pastel': return 'linear-gradient(135deg, #FEF9C3, #FEE2E2)'
    case 'doodle': return 'white'
    case 'classic':
    default: return 'white'
  }
}

const getCardBorder = (styleId) => {
  switch (styleId) {
    case 'classic': return '1px solid #E5E7EB'
    case 'illustrated': return '1px solid #DDD6FE'
    case 'doodle': return '2px dashed #D1D5DB'
    default: return 'none'
  }
}

const getCardColor = (styleId) => {
  if (styleId === 'gradient' || styleId === 'dark') return 'white'
  return '#111827'
}

const getCardBackBackground = (styleId) => {
  switch (styleId) {
    case 'gradient': return 'linear-gradient(135deg, #059669, #34D399)'
    case 'illustrated': return '#F0FDF4'
    case 'dark': return '#1F2937'
    case 'pastel': return '#DCFCE7'
    case 'doodle': return 'white' // But dashed border becomes mint tinted later
    case 'classic':
    default: return '#FAFAFA'
  }
}

// --- MAIN COMPONENT ---

export function FlashcardEngine(props) {
  const { material, items = [], user, onRegenerate } = props

  const [viewState, setViewState] = useState('overview') // 'overview' | 'study'
  const [activeStyle, setActiveStyle] = useState('classic')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [masteredIds, setMasteredIds] = useState(new Set())
  const [starredIds, setStarredIds] = useState(new Set())

  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState(null)

  const cards = useMemo(() => {
    if (!items) return []
    const baseItems = Array.isArray(items) ? items : (items.flashcards || items.items || items.cards || [])
    return baseItems.map((card, index) => {
      const front = card.front || card.question || card.term || card.q || (typeof card === 'string' ? card : null)
      const back = card.back || card.answer || card.definition || card.a || (typeof card === 'object' ? Object.values(card)[1] : 'No content available')
      return {
        id: card.id || `card_${index}`,
        front: front || 'No content available',
        back: back || 'No content available',
        ...card
      }
    })
  }, [items])

  if (cards.length === 0) {
    return (
      <div style={{ height: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: '#F9FAFB', padding: '24px' }}>
        <div style={{ width: '80px', height: '80px', background: '#F5F3FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
          <ArrowsClockwise size={40} weight="bold" color="#6D28D9" />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>No Flashcards Found</h3>
        <p style={{ color: '#6B7280', fontSize: '14px', maxWidth: '300px', marginBottom: '24px' }}>Generate your first study deck from the material analysis to start your active recall session.</p>
        
        {onRegenerate && (
          <button 
            onClick={onRegenerate}
            style={{ ...primaryPill }}
          >
            Generate Smart Cards
          </button>
        )}
      </div>
    )
  }

  const openStudyMode = (index = 0) => {
    setCurrentIndex(index)
    setViewState('study')
  }

  const handleEditCard = (card) => {
    setEditingCard(card)
    setIsCreateModalOpen(true)
  }

  const handleCreateCard = () => {
    setEditingCard(null)
    setIsCreateModalOpen(true)
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#F9FAFB', position: 'relative', overflow: 'hidden' }}>
      
      {viewState === 'overview' ? (
        <OverviewView 
          material={material} 
          cards={cards} 
          masteredIds={masteredIds}
          starredIds={starredIds}
          activeStyle={activeStyle}
          setActiveStyle={setActiveStyle}
          openStudyMode={openStudyMode}
          onShare={() => setIsShareModalOpen(true)}
          onCreate={handleCreateCard}
          onEditCard={handleEditCard}
        />
      ) : (
        <StudyView 
          material={material}
          cards={cards}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          masteredIds={masteredIds}
          setMasteredIds={setMasteredIds}
          starredIds={starredIds}
          setStarredIds={setStarredIds}
          activeStyle={activeStyle}
          onBack={() => setViewState('overview')}
        />
      )}

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateEditModal 
            card={editingCard}
            onClose={() => setIsCreateModalOpen(false)}
            activeStyle={activeStyle}
            setActiveStyle={setActiveStyle}
          />
        )}
        {isShareModalOpen && (
          <ShareModal 
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

// --- OVERVIEW VIEW ---

function OverviewView({ material, cards, masteredIds, starredIds, activeStyle, setActiveStyle, openStudyMode, onShare, onCreate, onEditCard }) {
  const progressPercent = cards.length > 0 ? (masteredIds.size / cards.length) * 100 : 0

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '32px' }} className="hide-scrollbar">
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        
        {/* Top Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
              {material?.title || 'Study Deck'}
            </h2>
            <div style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '4px' }}>
              {cards.length} cards · {Math.round(progressPercent)}% mastered
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={onCreate}
              style={{
                background: '#C4B5FD', color: '#3B0764', border: 'none', borderRadius: '9999px',
                padding: '8px 18px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 150ms'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#A78BFA'}
              onMouseLeave={e => e.currentTarget.style.background = '#C4B5FD'}
            >
              <Plus size={14} weight="bold"/> Create Card
            </button>
            <button 
              onClick={onShare}
              style={{
                border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', borderRadius: '9999px',
                padding: '8px 18px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center'
              }}
            >
              <ShareNetwork size={14} weight="bold"/> Share
            </button>
            <button 
              style={{
                width: '36px', height: '36px', border: '1.5px solid #E5E7EB', background: 'white', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <Gear size={16} color="#6B7280" weight="fill"/>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ height: '6px', background: '#F3F4F6', borderRadius: '9999px', marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ 
            height: '100%', 
            width: `${progressPercent}%`, 
            background: 'linear-gradient(90deg, #C4B5FD, #7C3AED)',
            transition: 'width 500ms ease'
          }} />
        </div>

        {/* Card Style Selector */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Card Style
            </div>
            <div style={{ fontSize: '12px', color: '#7C3AED', cursor: 'pointer' }}>Preview</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
            {CARD_STYLES.map(style => (
              <div 
                key={style.id}
                onClick={() => setActiveStyle(style.id)}
                style={{
                  flexShrink: 0, width: '108px', height: '72px', borderRadius: '12px', cursor: 'pointer',
                  transition: 'all 150ms', border: activeStyle === style.id ? '2px solid #7C3AED' : '2px solid transparent',
                  boxShadow: activeStyle === style.id ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
                  position: 'relative', overflow: 'hidden',
                  background: getCardBackground(style.id),
                  ...(style.id === 'classic' ? { border: activeStyle === style.id ? '2px solid #7C3AED' : '1px solid #E5E7EB' } : {}),
                  ...(style.id === 'doodle' ? { border: activeStyle === style.id ? '2px solid #7C3AED' : '2px dashed #D1D5DB' } : {})
                }}
              >
                {style.id === 'classic' && (
                  <div style={{ position: 'absolute', inset: '16px', border: '1px solid #E5E7EB', borderRadius: '4px' }} />
                )}
                {style.id === 'gradient' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', opacity: 0.5, fontSize: '10px' }}>Abc</div>
                )}
                {style.id === 'illustrated' && (
                  <svg viewBox="0 0 40 40" fill="none" style={{ position: 'absolute', top: '-4px', right: '-4px', width: '32px' }}>
                    <path d="M20 4 L22 14 L32 12 L24 20 L28 30 L20 24 L12 30 L16 20 L8 12 L18 14Z" fill="#DDD6FE" stroke="#A78BFA" strokeWidth="1"/>
                  </svg>
                )}
                {style.id === 'doodle' && (
                  <svg viewBox="0 0 40 40" fill="none" style={{ position: 'absolute', opacity: 0.3, top: '4px', left: '4px', width: '20px' }}>
                    <path d="M10 10 Q 15 5 20 10 T 30 10" stroke="#9CA3AF" strokeWidth="2" fill="none"/>
                  </svg>
                )}
                
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.4)',
                  color: 'white', fontSize: '9px', fontWeight: '600', textAlign: 'center', padding: '3px', letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>
                  {style.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Study Options */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => openStudyMode(0)}
            style={{
              background: '#7C3AED', color: 'white', borderRadius: '9999px', padding: '10px 24px', fontSize: '14px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '6px', border: 'none', cursor: 'pointer', transition: 'background 150ms'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#6D28D9'}
            onMouseLeave={e => e.currentTarget.style.background = '#7C3AED'}
          >
            <Play size={15} color="white" weight="fill"/> Study All
          </button>
          
          <button style={{ ...ghostPill, padding: '10px 20px', fontSize: '13px', gap: '6px' }}>
            <Shuffle size={14} weight="bold"/> Shuffle
          </button>
          <button style={{ ...ghostPill, padding: '10px 20px', fontSize: '13px', gap: '6px' }}>
            <Star size={14} weight="fill" color="#D1D5DB"/> Starred
          </button>
          <button style={{ ...ghostPill, padding: '10px 20px', fontSize: '13px', gap: '6px' }}>
            <X size={14} weight="bold" color="#D1D5DB"/> Not Mastered
          </button>
        </div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px' }}>
          {cards.map((card, idx) => (
            <div 
              key={card.id}
              onClick={() => openStudyMode(idx)}
              style={{
                aspectRatio: '3/2', borderRadius: '14px', cursor: 'pointer', transition: 'all 200ms ease',
                position: 'relative', overflow: 'hidden', padding: '14px', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between',
                background: getCardBackground(activeStyle),
                border: getCardBorder(activeStyle),
                color: getCardColor(activeStyle)
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                const pencil = e.currentTarget.querySelector('.edit-pencil')
                if (pencil) pencil.style.opacity = '1'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                const pencil = e.currentTarget.querySelector('.edit-pencil')
                if (pencil) pencil.style.opacity = '0'
              }}
            >
              {activeStyle === 'illustrated' && (
                <svg viewBox="0 0 40 40" fill="none" style={{ position: 'absolute', top: '-5px', right: '-5px', width: '60px', opacity: 0.3 }}>
                  <path d="M20 4 L22 14 L32 12 L24 20 L28 30 L20 24 L12 30 L16 20 L8 12 L18 14Z" fill="#DDD6FE" stroke="#A78BFA" strokeWidth="1"/>
                </svg>
              )}
              {activeStyle === 'doodle' && (
                <svg viewBox="0 0 40 40" fill="none" style={{ position: 'absolute', top: '8px', left: '8px', width: '30px', opacity: 0.3 }}>
                   <path d="M5 5 Q 15 20 25 5 T 35 25" stroke="#9CA3AF" strokeWidth="2" fill="none"/>
                </svg>
              )}

              <div style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '0.12em', opacity: 0.35, zIndex: 2 }}>
                QUESTION
              </div>
              
              <div style={{ 
                fontSize: '13px', fontWeight: '500', lineHeight: 1.4, flex: 1, 
                overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                marginTop: '8px', zIndex: 2
              }}>
                {card.front}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                <div style={{ background: 'rgba(0,0,0,0.06)', borderRadius: '9999px', padding: '2px 8px', fontSize: '10px', opacity: 0.5 }}>
                  #{idx + 1}
                </div>
                <div 
                  className="edit-pencil"
                  style={{ opacity: 0, transition: 'opacity 150ms', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={(e) => { e.stopPropagation(); onEditCard(card); }}
                >
                  <PencilLine size={11} />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// --- STUDY VIEW ---

function StudyView({ material, cards, currentIndex, setCurrentIndex, masteredIds, setMasteredIds, starredIds, setStarredIds, activeStyle, onBack }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [animatingCard, setAnimatingCard] = useState(null) // 'exitRight', 'exitLeft', 'enterCard'
  const [showExplain, setShowExplain] = useState(false)
  
  const currentCard = cards[currentIndex]
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return
      
      switch(e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          setIsFlipped(f => !f)
          break
        case 'arrowright':
        case 'n':
          handleNext()
          break
        case 'arrowleft':
        case 'p':
          handlePrev()
          break
        case 'g':
          handleGotIt()
          break
        case 'r':
          handleReview()
          break
        case 'e':
          if (isFlipped) setShowExplain(s => !s)
          break
        case 's':
          toggleStar()
          break
        case 'escape':
          if (showExplain) setShowExplain(false)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, isFlipped, showExplain])

  const triggerNextAnimation = () => {
    setAnimatingCard('enterCard')
    setTimeout(() => setAnimatingCard(null), 350)
  }

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setShowExplain(false)
      triggerNextAnimation()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
      setShowExplain(false)
      triggerNextAnimation()
    }
  }

  const handleGotIt = () => {
    setMasteredIds(prev => new Set(prev).add(currentCard.id))
    setAnimatingCard('exitRight')
    setTimeout(() => {
      handleNext()
    }, 280)
  }

  const handleReview = () => {
    setAnimatingCard('exitLeft')
    setTimeout(() => {
      handleNext()
    }, 280)
  }

  const toggleStar = () => {
    const next = new Set(starredIds)
    if (next.has(currentCard.id)) next.delete(currentCard.id)
    else next.add(currentCard.id)
    setStarredIds(next)
  }

  const handleSourceJump = () => {
    // Attempt to parse metadata if it exists
    const pageNum = currentCard.metadata?.pageNumber || 1
    window.dispatchEvent(new CustomEvent('luter-jump-to-page', { detail: { page: pageNum } }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F9FAFB' }}>
      
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px 0', flexShrink: 0 }}>
        <button 
          onClick={onBack}
          style={{
            border: 'none', background: 'transparent', color: '#6B7280', fontSize: '13px',
            padding: '6px 12px', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 150ms'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ArrowLeft size={14} weight="bold"/> Back to deck
        </button>

        <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>
          {currentIndex + 1} / {cards.length}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button 
            onClick={handleSourceJump}
            style={{
              border: 'none', background: 'transparent', color: '#6B7280', fontSize: '12px',
              padding: '6px 12px', borderRadius: '9999px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'background 150ms'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowSquareOut size={13} weight="bold"/> Open in doc
          </button>
          
          <button 
            onClick={toggleStar}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {starredIds.has(currentCard?.id) ? (
              <Star size={16} color="#F59E0B" weight="fill"/>
            ) : (
              <Star size={16} color="#D1D5DB" weight="bold"/>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ margin: '12px 32px 0', height: '4px', background: '#E5E7EB', borderRadius: '9999px', flexShrink: 0, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${((currentIndex) / Math.max(1, cards.length)) * 100}%`,
          background: '#A78BFA', borderRadius: '9999px', transition: 'width 300ms ease'
        }}/>
      </div>

      {/* Card Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 32px 16px', position: 'relative', perspective: '1400px' }}>
        
        {/* The Flashcard */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ width: '560px', maxWidth: '100%', height: '300px', position: 'relative', cursor: 'pointer',
            animation: animatingCard === 'exitRight' ? 'exitRight 300ms ease forwards' : 
                       animatingCard === 'exitLeft' ? 'exitLeft 300ms ease forwards' : 
                       animatingCard === 'enterCard' ? 'enterCard 250ms ease forwards' : 'none'
          }}
        >
          {/* Stack Pseudo-element */}
          <div style={{ position: 'absolute', inset: '-6px -6px -12px', background: 'rgba(0,0,0,0.03)', borderRadius: '26px', border: '1px solid #E5E7EB', transform: 'translateY(6px)', zIndex: -1 }} />

          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            
            {/* FRONT FACE */}
            <div style={{ 
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px',
              background: getCardBackground(activeStyle),
              border: getCardBorder(activeStyle),
              color: getCardColor(activeStyle),
              boxShadow: activeStyle === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.07)'
            }}>
              {activeStyle === 'illustrated' && (
                <svg viewBox="0 0 40 40" fill="none" style={{ position: 'absolute', top: '16px', right: '16px', width: '80px', opacity: 0.15 }}>
                  <path d="M20 4 L22 14 L32 12 L24 20 L28 30 L20 24 L12 30 L16 20 L8 12 L18 14Z" fill="#DDD6FE" stroke="#A78BFA" strokeWidth="1"/>
                </svg>
              )}
              {activeStyle === 'doodle' && (
                <svg viewBox="0 0 40 40" fill="none" style={{ position: 'absolute', top: '24px', left: '24px', width: '40px', opacity: 0.2 }}>
                   <path d="M5 5 Q 15 20 25 5 T 35 25" stroke="#9CA3AF" strokeWidth="2" fill="none"/>
                </svg>
              )}
              <div style={{ position: 'absolute', top: '20px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', opacity: 0.3 }}>
                QUESTION
              </div>
              <div style={{ fontSize: '20px', fontWeight: '500', textAlign: 'center', lineHeight: 1.5, maxWidth: '440px' }}>
                {currentCard?.front}
              </div>
              <div style={{ position: 'absolute', bottom: '20px', fontSize: '11px', opacity: 0.25, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowsClockwise size={11} weight="bold"/> Tap to flip
              </div>
            </div>

            {/* BACK FACE */}
            <div style={{ 
              position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: '24px', transform: 'rotateY(180deg)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px',
              background: getCardBackBackground(activeStyle),
              border: getCardBorder(activeStyle),
              color: getCardColor(activeStyle) === 'white' && activeStyle !== 'gradient' ? 'white' : '#111827',
              ...(activeStyle === 'doodle' ? { borderColor: '#A7F3D0' } : {}),
              boxShadow: activeStyle === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.07)'
            }}>
              <div style={{ position: 'absolute', top: '20px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.14em', opacity: 0.3, color: activeStyle === 'gradient' ? 'white' : 'inherit' }}>
                ANSWER
              </div>
              <div style={{ fontSize: '20px', fontWeight: '500', textAlign: 'center', lineHeight: 1.5, maxWidth: '440px', color: activeStyle === 'gradient' ? 'white' : 'inherit' }}>
                {currentCard?.back}
              </div>
              <div style={{ position: 'absolute', bottom: '20px', fontSize: '11px', opacity: 0.25, display: 'flex', alignItems: 'center', gap: '4px', color: activeStyle === 'gradient' ? 'white' : 'inherit' }}>
                <ArrowsClockwise size={11} weight="bold"/> Tap to flip
              </div>
            </div>

          </div>
        </div>

        {/* Quick Explain Button */}
        <AnimatePresence>
          {isFlipped && !showExplain && (
            <motion.button 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowExplain(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1.5px solid #E5E7EB',
                borderRadius: '9999px', padding: '8px 20px', fontSize: '13px', fontWeight: '500', color: '#374151',
                cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'all 150ms ease', marginTop: '16px'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#DDD6FE'; e.currentTarget.style.color = '#7C3AED'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#374151'; }}
            >
              <Sparkle size={15} color="#A78BFA" weight="fill"/> Quick Explain
            </motion.button>
          )}
        </AnimatePresence>

        {/* Explain Panel */}
        <AnimatePresence>
          {showExplain && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderTop: '1px solid #E5E7EB',
                borderRadius: '20px 20px 0 0', padding: '20px 24px 24px', boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
                zIndex: 20, maxHeight: '55%', overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkle size={16} color="#7C3AED" weight="fill"/>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>Quick Explain</span>
                  <span style={{ background: '#F5F3FF', color: '#7C3AED', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: '700' }}>AI</span>
                </div>
                <button 
                  onClick={() => setShowExplain(false)}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X size={14} color="#9CA3AF" weight="bold"/>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', maxHeight: '160px', overflowY: 'auto', marginBottom: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F3FF', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Sparkle size={20} color="#7C3AED" weight="fill"/>
                </div>
                <div style={{ flex: 1, background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '4px 14px 14px 14px', padding: '12px 14px', fontSize: '13px', color: '#374151', lineHeight: 1.7 }}>
                  Here is a simple breakdown of the concept: The <strong>{currentCard?.front}</strong> represents the foundational element described by the answer. Think of it as {currentCard?.back?.toLowerCase()?.substring(0, 50)}... and it applies in numerous use cases across the curriculum.
                </div>
              </div>

              <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', background: '#FAFAFA', flexShrink: 0 }}>
                <input type="text" placeholder="Ask a follow up..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13px', background: 'transparent', color: '#374151' }} />
                <button style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                  <ArrowUp size={13} color="white" weight="bold"/>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav + Action Bar */}
      <div style={{ padding: '0 32px 28px', flexShrink: 0 }}>
        
        {/* ROW 1 — Previous / Dots / Next */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            style={{
              border: 'none', background: 'transparent', color: currentIndex === 0 ? '#D1D5DB' : '#9CA3AF', fontSize: '13px',
              borderRadius: '9999px', padding: '6px 14px', cursor: currentIndex === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
            onMouseEnter={e => { if (currentIndex !== 0) { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151' } }}
            onMouseLeave={e => { if (currentIndex !== 0) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' } }}
          >
            <ArrowLeft size={14} weight="bold"/> Previous
          </button>
          
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            {cards.slice(0, Math.min(7, cards.length)).map((_, i) => (
              <div 
                key={i} 
                onClick={() => { setCurrentIndex(i); setIsFlipped(false); setShowExplain(false); }}
                style={{
                  height: '6px', borderRadius: '9999px', cursor: 'pointer', transition: 'all 250ms ease',
                  width: i === currentIndex ? '20px' : '6px',
                  background: i === currentIndex ? '#7C3AED' : (i < currentIndex ? '#C4B5FD' : '#E5E7EB')
                }}
              />
            ))}
            {cards.length > 7 && <div style={{ fontSize: '10px', color: '#9CA3AF', marginLeft: '4px' }}>+{cards.length - 7}</div>}
          </div>

          <button 
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
            style={{
              border: 'none', background: 'transparent', color: currentIndex === cards.length - 1 ? '#D1D5DB' : '#9CA3AF', fontSize: '13px',
              borderRadius: '9999px', padding: '6px 14px', cursor: currentIndex === cards.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
            onMouseEnter={e => { if (currentIndex !== cards.length - 1) { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151' } }}
            onMouseLeave={e => { if (currentIndex !== cards.length - 1) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF' } }}
          >
            {currentIndex === cards.length - 1 ? 'Finish' : 'Next'} {currentIndex === cards.length - 1 ? <Check size={14} weight="bold"/> : <ArrowRight size={14} weight="bold"/>}
          </button>
        </div>

        {/* ROW 2 — Got it / Review */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button style={{ ...ghostPill, flex: 1, maxWidth: '220px' }} onClick={handleReview}>
            <span style={ghostBadge}>R</span>
            <ArrowsClockwise size={16} color="#6B7280" weight="bold"/> Review
          </button>
          <button style={{ ...darkPill, flex: 1, maxWidth: '220px' }} onClick={handleGotIt}>
            <Check size={16} color="white" weight="bold"/> Got it
            <span style={darkBadge}>G</span>
          </button>
        </div>

        {/* ROW 3 — Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Card {currentIndex + 1} of {cards.length}</div>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{Math.round(masteredIds.size / Math.max(1, cards.length) * 100)}% mastered</div>
        </div>

        {/* KEYBOARD SHORTCUT HINT */}
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#E5E7EB', marginTop: '8px' }}>
          Space to flip · G Got it · R Review · E Explain · ← → Navigate
        </div>
      </div>

      <style>{`
        @keyframes exitRight {
          from { transform: translateX(0) rotate(0deg); opacity: 1; }
          to { transform: translateX(80px) rotate(4deg); opacity: 0; }
        }
        @keyframes exitLeft {
          from { transform: translateX(0) rotate(0deg); opacity: 1; }
          to { transform: translateX(-80px) rotate(-4deg); opacity: 0; }
        }
        @keyframes enterCard {
          from { transform: scale(0.94) translateY(12px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

// --- MODALS ---

function ModalOverlay({ children }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(6px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '24px', width: '620px', maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 48px)', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function CreateEditModal({ card, onClose, activeStyle, setActiveStyle }) {
  const isEditing = !!card
  const [front, setFront] = useState(card?.front || '')
  const [back, setBack] = useState(card?.back || '')
  const [showHint, setShowHint] = useState(false)
  const [isPreviewFlipped, setIsPreviewFlipped] = useState(false)

  return (
    <ModalOverlay>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          {isEditing ? 'Edit Flashcard' : 'Create Flashcard'}
        </div>
        <button 
          onClick={onClose}
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={16} color="#9CA3AF" weight="bold"/>
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '24px', display: 'flex', gap: '24px', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Preview */}
        <div style={{ flexShrink: 0, width: '38%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div 
            onClick={() => setIsPreviewFlipped(!isPreviewFlipped)}
            style={{
              borderRadius: '16px', overflow: 'hidden', aspectRatio: '3/2', position: 'relative', cursor: 'pointer',
              background: isPreviewFlipped ? getCardBackBackground(activeStyle) : getCardBackground(activeStyle),
              border: getCardBorder(activeStyle),
              color: (isPreviewFlipped && activeStyle === 'gradient') || (activeStyle === 'dark' || (activeStyle === 'gradient' && !isPreviewFlipped)) ? 'white' : '#111827',
              padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <div style={{ position: 'absolute', top: '12px', left: '12px', fontSize: '8px', fontWeight: '700', letterSpacing: '0.14em', opacity: 0.3 }}>
              {isPreviewFlipped ? 'ANSWER' : 'QUESTION'}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '500', textAlign: 'center', lineHeight: 1.4 }}>
              {isPreviewFlipped ? (back || 'Answer preview') : (front || 'Question preview')}
            </div>
            <button style={{ position: 'absolute', bottom: '12px', right: '12px', width: '20px', height: '20px', opacity: 0.5, border: 'none', background: 'transparent' }}>
              <ArrowsClockwise size={12}/>
            </button>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '4px' }}>Style</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {CARD_STYLES.map(style => (
                <div 
                  key={style.id}
                  onClick={() => setActiveStyle(style.id)}
                  style={{
                    width: '20px', height: '20px', borderRadius: '50%', cursor: 'pointer', transition: 'all 150ms',
                    background: getCardBackground(style.id),
                    border: activeStyle === style.id ? '2px solid #A78BFA' : '2px solid transparent',
                    boxShadow: activeStyle === style.id ? '0 0 0 2px rgba(255,255,255,1) inset' : 'none',
                    ...(style.id === 'classic' ? { border: activeStyle === style.id ? '2px solid #A78BFA' : '1px solid #D1D5DB' } : {}),
                    ...(style.id === 'doodle' ? { border: activeStyle === style.id ? '2px solid #A78BFA' : '2px dashed #D1D5DB' } : {})
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1 }} className="hide-scrollbar">
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
              QUESTION
            </label>
            <textarea 
              value={front}
              onChange={e => setFront(e.target.value)}
              placeholder="What do you want to remember?"
              style={{
                width: '100%', minHeight: '90px', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '10px 12px',
                fontSize: '14px', color: '#374151', resize: 'none', outline: 'none', lineHeight: 1.6, fontFamily: 'inherit',
                transition: 'border-color 150ms'
              }}
              onFocus={e => e.target.style.borderColor = '#A78BFA'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' }}>
              ANSWER
            </label>
            <textarea 
              value={back}
              onChange={e => setBack(e.target.value)}
              placeholder="The explanation or definition..."
              style={{
                width: '100%', minHeight: '80px', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '10px 12px',
                fontSize: '14px', color: '#374151', resize: 'none', outline: 'none', lineHeight: 1.6, fontFamily: 'inherit',
                transition: 'border-color 150ms'
              }}
              onFocus={e => e.target.style.borderColor = '#A78BFA'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>

          <div>
            <button 
              onClick={() => setShowHint(!showHint)}
              style={{ background: 'transparent', border: 'none', fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: 0 }}
            >
              Hint (optional) <CaretDown style={{ transform: showHint ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
            </button>
            {showHint && (
              <input type="text" placeholder="Add a hint..." style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', marginTop: '8px', outline: 'none', fontFamily: 'inherit' }} onFocus={e => e.target.style.borderColor = '#A78BFA'} onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <label style={{ fontSize: '11px', color: '#6B7280' }}>Source page</label>
            <input type="number" defaultValue={card?.metadata?.pageNumber || 1} style={{ width: '60px', textAlign: 'center', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '4px' }} />
            <button style={{ background: 'transparent', border: 'none', color: '#7C3AED', fontSize: '11px', cursor: 'pointer' }}>Jump to page</button>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          {isEditing && (
            <button style={{ background: 'transparent', border: '1px solid #FECACA', borderRadius: '9999px', color: '#EF4444', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', transition: 'background 150ms' }} onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Trash size={14}/> Delete Card
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ ...ghostPill, padding: '8px 20px', fontSize: '13px' }} onClick={onClose}>Cancel</button>
          <button style={{ ...primaryPill, padding: '8px 24px', fontSize: '13px' }} onClick={onClose}>
            <FloppyDisk size={14} weight="bold"/> Save Card
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

function ShareModal({ onClose }) {
  const [copied, setCopied] = useState(false)
  const [isPublic, setIsPublic] = useState(true)

  const copyLink = () => {
    navigator.clipboard.writeText("https://luter.app/cards/abc123")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ModalOverlay>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>Share Flashcards</div>
        <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={16} color="#9CA3AF" weight="bold"/>
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <LinkSimple size={16} color="#9CA3AF" weight="bold"/>
          <div style={{ fontSize: '12px', color: '#6B7280', flex: 1, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            https://luter.app/cards/abc123
          </div>
          <button onClick={copyLink} style={{ background: copied ? '#ECFDF5' : '#C4B5FD', color: copied ? '#065F46' : '#3B0764', borderRadius: '9999px', padding: '6px 16px', fontSize: '12px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'background 150ms' }}>
            {copied ? 'Copied ✓' : 'Copy link'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F3F4F6' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Anyone with link can view</div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '1px' }}>Share publicly</div>
          </div>
          <div onClick={() => setIsPublic(!isPublic)} style={{ width: '40px', height: '22px', position: 'relative', background: isPublic ? '#7C3AED' : '#D1D5DB', borderRadius: '9999px', cursor: 'pointer', transition: 'background 200ms' }}>
            <div style={{ position: 'absolute', top: '2px', left: isPublic ? '20px' : '2px', width: '18px', height: '18px', background: 'white', borderRadius: '9999px', transition: 'left 200ms ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}/>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.07em', marginBottom: '10px', textTransform: 'uppercase' }}>
            Export as
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['📄 PDF', '🗂 Anki .apkg', '📊 CSV', '🖼 Image Set'].map(lbl => (
              <button key={lbl} style={{ border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', borderRadius: '9999px', padding: '7px 16px', fontSize: '12px', fontWeight: '500', cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={e => { e.currentTarget.style.borderColor = '#DDD6FE'; e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.color = '#6D28D9'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#374151'; }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'flex-end' }}>
        <button style={{ ...ghostPill, padding: '8px 20px', fontSize: '13px' }} onClick={onClose}>Close</button>
      </div>
    </ModalOverlay>
  )
}
