import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '../../../store/useTourStore'
import { TOURS } from './tourData'
import { X, ArrowRight, ArrowLeft } from '@phosphor-icons/react'

export const LuterTourGuide = () => {
  const { isTourActive, currentTourId, currentStep, nextStep, prevStep, endTour } = useTourStore()
  const [targetRect, setTargetRect] = useState(null)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const tooltipRef = useRef(null)

  const tour = TOURS[currentTourId]
  const step = tour?.steps[currentStep]

  // Update target position
  const updateTargetRect = () => {
    if (!step?.target) return
    const el = document.querySelector(step.target)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
      // Scroll into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  useLayoutEffect(() => {
    if (isTourActive && step) {
      // Small delay to allow for page transitions or layout shifts
      const timer = setTimeout(updateTargetRect, 300)
      return () => clearTimeout(timer)
    }
  }, [isTourActive, currentTourId, currentStep])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      updateTargetRect()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [step])

  if (!isTourActive || !tour || !step) return null

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    
    const padding = 24
    const tooltipWidth = 460
    let top = targetRect.bottom + padding
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)

    // Keep within window bounds
    if (left < 20) left = 20
    if (left + tooltipWidth > windowSize.width - 20) left = windowSize.width - tooltipWidth - 20
    
    // Position above if there's not enough room below
    if (top + 400 > windowSize.height) {
      top = targetRect.top - 400 - padding
    }

    return { top, left, width: tooltipWidth }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      {/* Background Mask / Spotlight */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'auto' }} onClick={endTour}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <motion.rect
                initial={false}
                animate={{
                  x: targetRect.left - 8,
                  y: targetRect.top - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                  rx: 12
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentTourId}-${currentStep}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            position: 'absolute',
            pointerEvents: 'auto',
            background: 'white',
            borderRadius: '32px',
            padding: '32px',
            boxShadow: '0 30px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            ...getTooltipStyle()
          }}
        >
          {/* Close Button */}
          <button 
            onClick={endTour}
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              background: '#F1F5F9', 
              border: 'none', 
              padding: '8px', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              color: '#64748B',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} weight="bold" />
          </button>
          {/* Header Image/Mascot */}
          {step.image ? (
            <div style={{ width: '100%', height: '220px', background: '#F8FAFC', borderRadius: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '20px' }}>
              <motion.img 
                src={step.image} 
                alt={step.title} 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{ height: '100%', width: 'auto', objectFit: 'contain' }} 
              />
            </div>
          ) : step.icon ? (
            <div style={{ 
              width: '64px', height: '64px', 
              borderRadius: '20px', 
              background: 'rgba(122, 18, 204, 0.1)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#7a12cc', marginBottom: '24px'
            }}>
              <step.icon size={32} weight="duotone" />
            </div>
          ) : null}

          <h3 style={{ fontSize: '26px', fontWeight: 900, color: '#111', marginBottom: '12px', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {step.title}
          </h3>

          <p style={{ fontSize: '16px', color: '#64748B', lineHeight: 1.6, marginBottom: '32px', fontFamily: 'var(--font-varela)', maxWidth: '90%' }}>
            {step.content}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginTop: 'auto' }}>
            {currentStep > 0 && (
              <button onClick={prevStep} style={{ flex: 1, background: '#F1F5F9', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#475569' }}>
                <ArrowLeft size={20} /> Back
              </button>
            )}
            <button onClick={nextStep} style={{ flex: 1, background: '#7a12cc', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: 'white' }}>
              {currentStep === tour.steps.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={20} />
            </button>
          </div>

          {/* Arrow / Pointer Tip */}
          <div style={{
            position: 'absolute',
            top: targetRect && (targetRect.bottom + 200 > windowSize.height) ? '100%' : '-10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: targetRect && (targetRect.bottom + 200 > windowSize.height) ? 'none' : '10px solid white',
            borderTop: targetRect && (targetRect.bottom + 200 > windowSize.height) ? '10px solid white' : 'none',
          }} />
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  )
}
