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

  // Update target position with more robustness
  const updateTargetRect = () => {
    if (!step?.target) {
      setTargetRect(null)
      return
    }
    
    // Try finding the element
    const el = document.querySelector(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      // Ensure element is visible and has size
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect)
        // Scroll into view if needed
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      } else {
        setTargetRect(null)
      }
    } else {
      setTargetRect(null)
    }
  }

  useLayoutEffect(() => {
    if (isTourActive && step) {
      // Small delay to allow for page transitions or layout shifts
      const timer = setTimeout(updateTargetRect, 500)
      return () => clearTimeout(timer)
    }
  }, [isTourActive, currentTourId, currentStep, step?.target])

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      updateTargetRect()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [step])

  if (!isTourActive || !tour || !step) return null

  const isSmallScreen = windowSize.width <= 768

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect || isSmallScreen) {
      // Centered for mobile or when no target found
      return { 
        position: 'fixed',
        bottom: isSmallScreen ? '24px' : '50%', 
        left: '50%', 
        transform: isSmallScreen ? 'translateX(-50%)' : 'translate(-50%, -50%)',
        width: isSmallScreen ? 'calc(100% - 32px)' : '360px',
        maxWidth: '400px'
      }
    }
    
    const padding = 20
    const tooltipWidth = 360
    const estHeight = 380 // Reduced height estimate
    
    let top = targetRect.bottom + padding
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)

    // Keep within horizontal window bounds
    if (left < 20) left = 20
    if (left + tooltipWidth > windowSize.width - 20) left = windowSize.width - tooltipWidth - 20
    
    // Position above if there's not enough room below
    if (top + estHeight > windowSize.height - 20) {
      top = targetRect.top - estHeight - padding
    }

    // Final safety check for top
    if (top < 20) top = 20

    return { 
      position: 'absolute',
      top: `${top}px`, 
      left: `${left}px`, 
      width: `${tooltipWidth}px` 
    }
  }

  const tooltipStyle = getTooltipStyle()
  const isAbove = targetRect && tooltipStyle.top && parseInt(tooltipStyle.top) < targetRect.top

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
                  x: targetRect.left - 6,
                  y: targetRect.top - 6,
                  width: targetRect.width + 12,
                  height: targetRect.height + 12,
                  rx: 12
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentTourId}-${currentStep}`}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: '28px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 10000,
            ...tooltipStyle
          }}
        >
          {/* Progress Indicator Dots */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
            {tour.steps.map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  width: idx === currentStep ? '20px' : '6px', 
                  height: '6px', 
                  borderRadius: '10px', 
                  background: idx === currentStep ? '#7a12cc' : '#E2E8F0',
                  transition: 'all 0.3s ease'
                }} 
              />
            ))}
          </div>

          {/* Close Button */}
          <button 
            onClick={endTour}
            style={{ 
              position: 'absolute', 
              top: '16px', 
              right: '16px', 
              background: 'rgba(0,0,0,0.05)', 
              border: 'none', 
              width: '32px',
              height: '32px',
              borderRadius: '50%', 
              cursor: 'pointer', 
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={16} weight="bold" />
          </button>

          {/* Content Header - Image or Icon */}
          <div style={{ position: 'relative', width: '100%', marginBottom: '24px' }}>
             {step.image ? (
                <div style={{ 
                  width: '100%', 
                  height: isSmallScreen ? '130px' : '150px', 
                  background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', 
                  borderRadius: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'visible',
                  padding: '10px'
                }}>
                  <motion.img 
                    src={step.image} 
                    alt={step.title} 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ height: '120%', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }} 
                  />
                </div>
              ) : step.icon ? (
                <div style={{ 
                  width: '64px', height: '64px', 
                  borderRadius: '20px', 
                  background: 'linear-gradient(135deg, #7a12cc 0%, #9333ea 100%)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', margin: '0 auto',
                  boxShadow: '0 10px 20px rgba(122, 18, 204, 0.25)'
                }}>
                  <step.icon size={32} weight="duotone" />
                </div>
              ) : null}
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#1e1b4b', marginBottom: '8px', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {step.title}
          </h3>

          <p style={{ fontSize: '14.5px', color: '#4b5563', lineHeight: 1.6, marginBottom: '28px', fontFamily: 'var(--font-varela)', fontWeight: 500 }}>
            {step.content}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            {currentStep > 0 && (
              <button 
                onClick={prevStep} 
                style={{ 
                  flex: 1, 
                  background: '#F1F5F9', 
                  border: 'none', 
                  padding: '14px', 
                  borderRadius: '16px', 
                  fontWeight: 700, 
                  fontSize: '14px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  color: '#475569',
                  transition: 'all 0.2s'
                }}
              >
                <ArrowLeft size={18} weight="bold" /> Back
              </button>
            )}
            <button 
              onClick={() => {
                if (currentStep === tour.steps.length - 1) {
                  endTour()
                } else {
                  nextStep()
                }
              }} 
              style={{ 
                flex: 2, 
                background: 'linear-gradient(135deg, #7a12cc 0%, #6366f1 100%)', 
                border: 'none', 
                padding: '14px', 
                borderRadius: '16px', 
                fontWeight: 800, 
                fontSize: '14px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                cursor: 'pointer', 
                color: 'white',
                boxShadow: '0 8px 20px rgba(122, 18, 204, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {currentStep === tour.steps.length - 1 ? 'Finish Journey' : 'Got it, Next'} <ArrowRight size={18} weight="bold" />
            </button>
          </div>

          {/* Premium Pointer Arrow - Desktop Only */}
          {!isSmallScreen && targetRect && (
            <div style={{
              position: 'absolute',
              top: isAbove ? '100%' : '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderBottom: isAbove ? 'none' : '12px solid rgba(255, 255, 255, 0.95)',
              borderTop: isAbove ? '12px solid rgba(255, 255, 255, 0.95)' : 'none',
              filter: 'drop-shadow(0 -2px 1px rgba(0,0,0,0.02))'
            }} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  )
}
