/* eslint-disable no-unused-vars */
import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useReadingSpace } from './ReadingSpaceContext'
import {
  Sparkle,
  Highlighter,
  MessageCircle as ChatCircle,
  MessageCircleMore as ChatCircleText,
  Copy,
  Layers as SquareStack,
  CircleHelp as Question,
  Zap as Lightning,
  X,
} from 'lucide-react'

const SELECTION_ACTIONS = [
  { id: 'highlight', label: 'Highlight', icon: Highlighter, color: '#FFFFFF' },
  { id: 'send_to_ai', label: 'Ask Luter', icon: ChatCircle, color: '#FFFFFF' },
  { id: 'comment', label: 'Comment', icon: ChatCircleText, color: '#FFFFFF' },
  { id: 'copy', label: 'Copy', icon: Copy, color: '#FFFFFF' },
  { id: 'flashcard', label: 'Make Flashcard', icon: SquareStack, color: '#FFFFFF' },
  { id: 'quiz', label: 'Quiz this', icon: Question, color: '#FFFFFF' },
  { id: 'divider' },
  { id: 'explain', label: 'Explain instantly', icon: Lightning, color: '#A78BFA' },
]

export function SelectionActionBar({ onAction }) {
  const { selection, updateSelection } = useReadingSpace()
  const [hoveredAction, setHoveredAction] = useState(null)
  const [isExplainLoading, setIsExplainLoading] = useState(false)
  const [instantExplanation, setInstantExplanation] = useState(null)
  const hasVisibleSelection = Boolean(selection?.visible && selection?.rect)
  const selectionText = selection?.text || ''

  const actions = useMemo(() => SELECTION_ACTIONS, [])

  if (!hasVisibleSelection) return null

  const selectionLeft = selection.rect.left + (selection.rect.width / 2)
  const toolbarLeft = Math.min(Math.max(selectionLeft, 180), window.innerWidth - 180)
  const toolbarTop = Math.max(16, selection.rect.top - 52)
  const explanationTop = Math.min(window.innerHeight - 220, selection.rect.bottom + 8)
  const explanationLeft = Math.min(Math.max(selectionLeft, 176), window.innerWidth - 176)

  const closeToolbar = () => {
    updateSelection('', null, false)
    setHoveredAction(null)
  }

  const handleAction = async (actionId) => {
    if (actionId === 'explain') {
      setIsExplainLoading(true)
      setInstantExplanation('')
      const response = await onAction(actionId, selectionText)
      setInstantExplanation(response || 'Luter could not explain this selection right now.')
      setIsExplainLoading(false)
      return
    }

    await onAction(actionId, selectionText)
    if (actionId !== 'comment') {
      setInstantExplanation(null)
    }
    closeToolbar()
  }

  return (
    <>
      <motion.div
        className="selection-action-bar"
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: 1,
          y: 0,
          left: toolbarLeft,
          top: toolbarTop,
        }}
        exit={{ opacity: 0, y: 8 }}
        style={{
          position: 'fixed',
          zIndex: 1000,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '6px 10px',
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '9999px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.28)',
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
      >
        {actions.map((action) => {
          if (action.id === 'divider') {
            return (
              <div
                key="divider"
                style={{
                  width: '1px',
                  height: '16px',
                  background: 'rgba(255,255,255,0.15)',
                  margin: '0 4px',
                }}
              />
            )
          }

          return (
            <button
              key={action.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                handleAction(action.id)
              }}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction((current) => current === action.id ? null : current)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9999px',
                background: hoveredAction === action.id ? 'rgba(255,255,255,0.14)' : 'transparent',
                border: '1px solid transparent',
                color: action.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                position: 'relative',
              }}
            >
              <action.icon size={17} color={action.color} weight={action.id === 'explain' ? 'fill' : 'bold'} />
              {hoveredAction === action.id && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1F2937',
                    color: '#FFFFFF',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                  }}
                >
                  {action.label}
                </span>
              )}
            </button>
          )
        })}
      </motion.div>

      <AnimatePresence>
        {(isExplainLoading || instantExplanation) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              position: 'fixed',
              top: explanationTop,
              left: explanationLeft,
              width: '320px',
              transform: 'translateX(-50%)',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              zIndex: 1000,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: '#7C3AED' }}>
                <Sparkle size={16} color="#7C3AED" weight="fill" />
                Luter AI
              </div>
              <button
                type="button"
                onClick={() => {
                  setInstantExplanation(null)
                  setIsExplainLoading(false)
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: '#F3F4F6',
                  color: '#6B7280',
                  cursor: 'pointer',
                  fontSize: '12px',
                  lineHeight: 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div
              style={{
                background: '#F9FAFB',
                borderLeft: '3px solid #7C3AED',
                padding: '6px 10px',
                borderRadius: '0 6px 6px 0',
                fontSize: '12px',
                color: '#6B7280',
                fontStyle: 'italic',
                marginBottom: '10px',
              }}
            >
              {selectionText.length > 80 ? `${selectionText.slice(0, 80)}...` : selectionText}
            </div>

            <div style={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, minHeight: '48px' }}>
              {isExplainLoading ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', paddingTop: '8px' }}>
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '9999px',
                        background: '#7C3AED',
                        opacity: 0.8,
                        animation: `ws-dot-pulse 1s ${index * 0.16}s infinite`,
                      }}
                    />
                  ))}
                </div>
              ) : (
                instantExplanation
              )}
            </div>

            {!isExplainLoading && (
              <div style={{ marginTop: '10px', borderTop: '1px solid #F3F4F6', paddingTop: '8px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleAction('send_to_ai')}
                  style={{
                    borderRadius: '9999px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: '11px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Send to chat
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('save_note')}
                  style={{
                    borderRadius: '9999px',
                    border: '1px solid #E5E7EB',
                    background: '#FFFFFF',
                    color: '#374151',
                    fontSize: '11px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Save to notes
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
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
          <Sparkle size={12} weight="fill" color="white" />
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
