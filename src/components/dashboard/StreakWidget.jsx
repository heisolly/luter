import React, { useState, useRef, useEffect } from 'react'
import { Fire, CheckCircle } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStreakSync } from '../../hooks/useStreakSync'
import './StreakWidget.css'

export default function StreakWidget({ userId, initialStats, isDark = false }) {
  const { streakData, triggerStreakUpdate } = useStreakSync(userId, initialStats)
  const [isOpen, setIsOpen] = useState(false)
  const widgetRef = useRef(null)

  const { current_streak, last_activity_date, is_active_today } = streakData

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Generate week view data
  const getWeekDays = () => {
    const today = new Date()
    // Find Monday of the current week
    const dayOfWeek = today.getDay()
    const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diffToMonday))
    
    const days = []
    const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dStr = d.toISOString().split('T')[0]
      const isToday = dStr === new Date().toISOString().split('T')[0]
      
      // A day is active if it's today and we are active, or if it's in the past and within the streak
      let isActive = false
      if (last_activity_date) {
        if (dStr === last_activity_date) {
          isActive = true
        } else if (dStr < last_activity_date) {
          // Check if this date falls within the current streak window
          const lastDateObj = new Date(last_activity_date)
          const dateDiff = Math.floor((lastDateObj - d) / (1000 * 60 * 60 * 24))
          if (dateDiff > 0 && dateDiff < current_streak) {
            isActive = true
          }
        }
      }

      days.push({
        label: dayNames[i],
        date: dStr,
        isToday,
        isActive,
        isFuture: dStr > new Date().toISOString().split('T')[0]
      })
    }
    return days
  }

  const weekDays = getWeekDays()
  const iconColor = is_active_today ? '#ff9600' : isDark ? '#4b5563' : '#d1d5db'
  const textColor = is_active_today ? (isDark ? '#f97316' : '#ea580c') : isDark ? '#9ca3af' : '#6b7280'

  return (
    <div className="streak-widget-container" ref={widgetRef}>
      {/* Trigger Button */}
      <motion.button 
        className={`streak-widget-btn ${isDark ? 'dark' : ''} ${is_active_today ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.95 }}
        layout
      >
        <motion.div
          animate={is_active_today ? {
            scale: [1, 1.2, 1],
            rotate: [0, -10, 10, -10, 10, 0]
          } : {}}
          transition={{ duration: 0.5 }}
        >
          <Fire size={24} weight={is_active_today ? 'fill' : 'bold'} color={iconColor} />
        </motion.div>
        <span style={{ color: textColor, fontWeight: 700, fontSize: '15px' }}>
          {current_streak}
        </span>
      </motion.button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={`streak-popover ${isDark ? 'dark' : ''}`}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="streak-popover-header">
              <h3>Streak</h3>
              <div className="streak-popover-stat">
                <Fire size={20} weight="fill" color="#ff9600" />
                <span>{current_streak}</span>
              </div>
            </div>
            
            <p className="streak-popover-desc">
              {is_active_today 
                ? "You're on a roll! Come back tomorrow to keep it going." 
                : "Complete a task or study session today to build your streak!"}
            </p>

            <div className="streak-week-view">
              {weekDays.map((day, idx) => (
                <div key={idx} className={`streak-day ${day.isToday ? 'today' : ''} ${day.isActive ? 'active' : ''}`}>
                  <span className="streak-day-label">{day.label}</span>
                  <div className="streak-day-circle">
                    {day.isActive ? (
                      <CheckCircle size={24} weight="fill" color="#ff9600" />
                    ) : (
                      <div className="streak-day-empty" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
