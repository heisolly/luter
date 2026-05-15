import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReadingSpace } from './ReadingSpaceContext'
import { RiMagicFill as Sparkles, RiChat3Fill as MessageSquare, RiBrainFill as Brain, RiLightbulbFill as Lightbulb, RiFlashlightFill as Zap, RiAddCircleFill as PlusCircle } from 'react-icons/ri'
import LuterLogo from '../shared/LuterLogo'

export function SelectionActionBar({ onAction }) {
  const { selection, updateSelection } = useReadingSpace()

  if (!selection.visible || !selection.rect) return null

  const actions = [
    { id: 'explain', label: 'Explain', icon: Brain, color: '#A78BFA' },
    { id: 'save_note', label: 'Save to Notes', icon: Note, color: '#C4B5FD' },
    { id: 'flashcard', label: 'Create Flashcard', icon: Zap, color: '#F59E0B' },
  ]

  return (
    <motion.div
      className="selection-action-bar"
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        left: selection.rect.left + (selection.rect.width / 2),
        top: Math.max(10, selection.rect.top - 70) 
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{
        position: 'fixed',
        zIndex: 1000,
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '4px',
        background: '#1A102D', // Dark brand background
        backdropFilter: 'blur(12px)',
        borderRadius: '14px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
        pointerEvents: 'auto',
        userSelect: 'none'
      }}
    >
      <div style={{ padding: '0 8px', borderRight: '1px solid rgba(255,255,255,0.1)', marginRight: '4px' }}>
        <LuterLogo size={16} showText={false} />
      </div>

      {actions.map((action) => (
        <button
          key={action.id}
          onClick={(e) => {
            e.stopPropagation()
            onAction(action.id, selection.text)
            updateSelection('', null, false)
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            borderRadius: '10px',
            color: 'white',
            fontSize: '10px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            cursor: 'pointer',
            border: 'none',
            background: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <action.icon size={16} color={action.color} />
          {action.label}
        </button>
      ))}
      
      {/* Arrow Down */}
      <div style={{
        position: 'absolute',
        bottom: '-6px',
        left: '50%',
        transform: 'translateX(-50%) rotate(45deg)',
        width: '12px',
        height: '12px',
        background: '#1A102D',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        zIndex: -1
      }} />
    </motion.div>
  )
}

export function LuterSpark() {
  const { sparkPosition } = useReadingSpace()

  return (
    <AnimatePresence>
      {sparkPosition.visible && (
        <motion.div
          className="ws-luter-spark"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: sparkPosition.x - 12, // Offset to center
            y: sparkPosition.y - 12
          }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="ws-spark-glow" />
          <Sparkles size={12} fill="white" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function SharedCanvasOverlay() {
  const { drawCommands } = useReadingSpace()

  return (
    <svg className="ws-svg-overlay">
      <AnimatePresence>
        {drawCommands.map((cmd) => (
          <motion.g 
            key={cmd.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {cmd.type === 'highlight' && cmd.rects.map((rect, idx) => (
              <motion.rect
                key={`${cmd.id}-${idx}`}
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={4}
                className="ws-highlight-path"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              />
            ))}
            
            {cmd.label && cmd.rects[0] && (
              <foreignObject
                x={cmd.rects[0].x}
                y={cmd.rects[0].y - 30}
                width="200"
                height="40"
              >
                <motion.div 
                  className="ws-live-tag"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                >
                  {cmd.label}
                </motion.div>
              </foreignObject>
            )}
          </motion.g>
        ))}
      </AnimatePresence>
    </svg>
  )
}
