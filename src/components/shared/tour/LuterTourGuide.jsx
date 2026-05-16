/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTourStore } from '../../../store/useTourStore'
import { TOURS } from './tourData'
import { X, ArrowRight, ArrowLeft } from '@phosphor-icons/react'

export const LuterTourGuide = () => {
  const { isTourActive, currentTourId, currentStep, nextStep, prevStep, endTour } = useTourStore()
  const [targetRect, setTargetRect] = useState(null)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  const tour = TOURS[currentTourId]
  const step = tour?.steps[currentStep]
  const isSmallScreen = windowSize.width <= 1024

  // Update target position with more robustness
  const updateTargetRect = () => {
    if (!step?.target) {
      setTargetRect(null)
      return
    }

    const el = document.querySelector(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect)
        // Only scroll if it's really out of view
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        setTargetRect(null)
      }
    } else {
      setTargetRect(null)
    }
  }

  // Effect to handle tour state changes
  useLayoutEffect(() => {
    if (isTourActive && step) {
      // Initial check
      const initialTimer = setTimeout(updateTargetRect, 0)

      // Follow-up checks to account for animations (like sidebar sliding)
      const intervals = [100, 300, 600, 1000]
      const timers = intervals.map(ms => setTimeout(updateTargetRect, ms))

      return () => {
        clearTimeout(initialTimer)
        timers.forEach(t => clearTimeout(t))
      }
    }
  }, [isTourActive, currentTourId, currentStep, step?.target])

  // Watch for window resize and layout shifts
  useEffect(() => {
    const handleUpdate = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      updateTargetRect()
    }

    window.addEventListener('resize', handleUpdate)
    // Also watch for scroll to keep spotlight aligned
    window.addEventListener('scroll', updateTargetRect, true)

    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', updateTargetRect, true)
    }
  }, [step])

  if (!isTourActive || !tour || !step) return null

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!targetRect || isSmallScreen) {
      // Mobile styling: Flexbox will handle centering
      return {
        position: 'relative', // Relative to the flex container
        width: isSmallScreen ? '90vw' : '400px',
        maxWidth: '450px',
        margin: '20px'
      }
    }

    const padding = 20
    const tooltipWidth = 400
    const estHeight = 420

    let top = targetRect.bottom + padding
    let left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)

    if (left < 20) left = 20
    if (left + tooltipWidth > windowSize.width - 20) left = windowSize.width - tooltipWidth - 20

    if (top + estHeight > windowSize.height - 20) {
      top = targetRect.top - estHeight - padding
    }

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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      pointerEvents: 'none',
      display: isSmallScreen ? 'flex' : 'block',
      alignItems: isSmallScreen ? 'center' : 'stretch',
      justifyContent: isSmallScreen ? 'center' : 'stretch',
      boxSizing: 'border-box'
    }}>
      {/* Background Mask / Spotlight */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'auto' }} onClick={endTour}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <motion.rect
                initial={false}
                animate={{
                  x: targetRect.left - 10,
                  y: targetRect.top - 10,
                  width: targetRect.width + 20,
                  height: targetRect.height + 20,
                  rx: 20
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(10, 10, 20, 0.85)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Tooltip Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentTourId}-${currentStep}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          style={{
            pointerEvents: 'auto',
            background: 'white',
            borderRadius: isSmallScreen ? '28px' : '32px',
            padding: isSmallScreen ? '24px' : '32px',
            boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            zIndex: 1000000,
            boxSizing: 'border-box',
            ...tooltipStyle
          }}
        >
          {/* Progress Indicator */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {tour.steps.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === currentStep ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '10px',
                  background: idx === currentStep ? '#8B5CF6' : '#E2E8F0',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            ))}
          </div>

          {/* Close Action */}
          <button
            onClick={endTour}
            style={{
              position: 'absolute', top: '20px', right: '20px',
              background: '#F1F5F9', border: 'none',
              width: '36px', height: '36px', borderRadius: '50%',
              cursor: 'pointer', color: '#64748B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <X size={18} weight="bold" />
          </button>

          {/* Visual Header */}
          <div style={{ width: '100%', marginBottom: '24px' }}>
             {step.image ? (
                <div style={{
                  width: '100%', height: isSmallScreen ? '100px' : '140px',
                  background: '#F5F3FF', borderRadius: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '12px', position: 'relative', overflow: 'hidden'
                }}>
                  <motion.img
                    src={step.image}
                    alt={step.title}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                  />
                </div>
              ) : step.icon ? (
                <div style={{
                  width: '72px', height: '72px', borderRadius: '24px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', margin: '0 auto', boxShadow: '0 12px 24px rgba(139, 92, 246, 0.3)'
                }}>
                  <step.icon size={36} weight="fill" />
                </div>
              ) : null}
          </div>

          <h3 style={{ fontSize: isSmallScreen ? '20px' : '24px', fontWeight: 800, color: '#1E1B4B', marginBottom: '10px', fontFamily: 'var(--font-outfit)', letterSpacing: '-0.02em' }}>
            {step.title}
          </h3>

          <p style={{ fontSize: isSmallScreen ? '14px' : '15.5px', color: '#4B5563', lineHeight: 1.6, marginBottom: '28px', fontFamily: 'var(--font-varela)', fontWeight: 500 }}>
            {step.content}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                style={{
                  flex: 1, background: '#F1F5F9', border: 'none',
                  padding: '14px', borderRadius: '16px', fontWeight: 700,
                  fontSize: '14px', color: '#475569', cursor: 'pointer'
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={() => (currentStep === tour.steps.length - 1 ? endTour() : nextStep())}
              style={{
                flex: 2, background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
                border: 'none', padding: '14px', borderRadius: '16px',
                fontWeight: 800, fontSize: '15px', color: 'white',
                boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}
            >
              {currentStep === tour.steps.length - 1 ? 'Finish Journey' : 'Got it, Next'}
              <ArrowRight size={20} weight="bold" />
            </button>
          </div>

          {/* Pointing Arrow - Desktop only */}
          {!isSmallScreen && targetRect && (
            <div style={{
              position: 'absolute',
              top: isAbove ? '100%' : '-14px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderBottom: isAbove ? 'none' : '14px solid white',
              borderTop: isAbove ? '14px solid white' : 'none'
            }} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  )
}
