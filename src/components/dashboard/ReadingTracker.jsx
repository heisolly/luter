import React, { useState, useEffect, useRef, useCallback } from 'react'
import { RiBookOpenFill as BookOpen, RiTimeFill as Clock, RiEyeFill as Eye, RiFocusFill as Target, RiLineChartFill as TrendingUp, RiCalendarFill as Calendar, RiAwardFill as Award, RiBarChartFill as BarChart3, RiPulseFill as Activity, RiFlashlightFill as Zap, RiCupFill as Coffee } from 'react-icons/ri'
import { supabase } from '../../supabaseClient'

export default function ReadingTracker({ material, activeTab, onProgressUpdate }) {
  const [trackingData, setTrackingData] = useState({
    totalTime: 0,
    currentPage: 1,
    totalPages: 1,
    readingSpeed: 0, // words per minute
    focusScore: 0, // 0-100 based on interactions
    sessionCount: 0,
    lastPosition: { scrollPercent: 0, timestamp: Date.now() },
    highlights: 0,
    notes: 0,
    bookmarks: 0,
    comprehensionScore: 0,
    streakDays: 0
  })
  
  const [sessionActive, setSessionActive] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [weeklyStats, setWeeklyStats] = useState([])
  const [achievements, setAchievements] = useState([])
  
  const trackingIntervalRef = useRef(null)
  const activityTimeoutRef = useRef(null)
  const lastActivityRef = useRef(Date.now())

  // Initialize tracking when material changes
  useEffect(() => {
    if (material && activeTab === 'content') {
      initializeTracking()
    }
  }, [material, activeTab])

  const initializeTracking = async () => {
    try {
      // Load existing tracking data
      const { data: existingData } = await supabase
        .from('reading_tracking')
        .select('*')
        .eq('material_id', material.id)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (existingData) {
        setTrackingData(prev => ({
          ...prev,
          ...existingData.tracking_data,
          currentPage: existingData.current_page || 1,
          totalPages: existingData.total_pages || 1
        }))
      }

      // Load weekly stats
      await loadWeeklyStats()
      
      // Load achievements
      await loadAchievements()

      // Start tracking session
      startReadingSession()
      
    } catch (error) {
      console.error('Error initializing tracking:', error)
    }
  }

  const startReadingSession = () => {
    setSessionActive(true)
    setSessionStartTime(Date.now())
    setIsTracking(true)
    
    // Start tracking interval
    trackingIntervalRef.current = setInterval(() => {
      updateTrackingData()
    }, 5000) // Update every 5 seconds

    // Set up activity monitoring
    setupActivityMonitoring()
  }

  const setupActivityMonitoring = () => {
    // Track user activity (mouse movement, scrolling, typing)
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      updateFocusScore(true)
    }

    document.addEventListener('mousemove', handleActivity)
    document.addEventListener('scroll', handleActivity)
    document.addEventListener('keypress', handleActivity)
    document.addEventListener('click', handleActivity)

    // Check for inactivity
    activityTimeoutRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current
      if (timeSinceActivity > 30000) { // 30 seconds of inactivity
        updateFocusScore(false)
      }
    }, 10000)

    return () => {
      document.removeEventListener('mousemove', handleActivity)
      document.removeEventListener('scroll', handleActivity)
      document.removeEventListener('keypress', handleActivity)
      document.removeEventListener('click', handleActivity)
    }
  }

  const updateTrackingData = useCallback(async () => {
    if (!sessionActive || !material) return

    const currentTime = Date.now()
    const sessionDuration = currentTime - sessionStartTime
    const totalTime = trackingData.totalTime + sessionDuration

    // Calculate reading speed (simplified - would need word count in real implementation)
    const readingSpeed = calculateReadingSpeed(totalTime)

    // Update tracking data
    const newTrackingData = {
      ...trackingData,
      totalTime,
      readingSpeed,
      lastPosition: {
        scrollPercent: trackingData.lastPosition.scrollPercent,
        timestamp: currentTime
      },
      sessionCount: trackingData.sessionCount + 1
    }

    setTrackingData(newTrackingData)

    // Notify parent component
    if (onProgressUpdate) {
      onProgressUpdate(newTrackingData)
    }

    // Save to database periodically
    if (trackingData.sessionCount % 12 === 0) { // Every minute (12 * 5 seconds)
      await saveTrackingData(newTrackingData)
    }
  }, [sessionActive, sessionStartTime, trackingData, material, onProgressUpdate])

  const calculateReadingSpeed = (totalTime) => {
    // Simplified calculation - in real implementation, you'd track actual words read
    const timeInMinutes = totalTime / 60000
    if (timeInMinutes === 0) return 0
    
    // Estimate words based on current page and total pages
    const estimatedWordsPerPage = 500
    const wordsRead = trackingData.currentPage * estimatedWordsPerPage
    return Math.round(wordsRead / timeInMinutes)
  }

  const updateFocusScore = (isActive) => {
    setTrackingData(prev => {
      const newScore = isActive 
        ? Math.min(100, prev.focusScore + 2)
        : Math.max(0, prev.focusScore - 5)
      return { ...prev, focusScore: newScore }
    })
  }

  const updatePageProgress = (currentPage, totalPages) => {
    setTrackingData(prev => ({
      ...prev,
      currentPage,
      totalPages,
      lastPosition: {
        scrollPercent: (currentPage / totalPages) * 100,
        timestamp: Date.now()
      }
    }))
  }

  const updateHighlights = (count) => {
    setTrackingData(prev => ({ ...prev, highlights: count }))
  }

  const updateNotes = (count) => {
    setTrackingData(prev => ({ ...prev, notes: count }))
  }

  const saveTrackingData = async (data) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      await supabase
        .from('reading_tracking')
        .upsert({
          user_id: user.id,
          material_id: material.id,
          current_page: data.currentPage,
          total_pages: data.totalPages,
          tracking_data: data,
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error saving tracking data:', error)
    }
  }

  const loadWeeklyStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      
      const { data } = await supabase
        .from('reading_tracking')
        .select('*')
        .eq('user_id', user.id)
        .gte('updated_at', sevenDaysAgo)
        .order('updated_at', { ascending: true })

      if (data) {
        setWeeklyStats(data)
      }
    } catch (error) {
      console.error('Error loading weekly stats:', error)
    }
  }

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('unlocked', true)

      if (data) {
        setAchievements(data)
      }
    } catch (error) {
      console.error('Error loading achievements:', error)
    }
  }

  const pauseTracking = () => {
    setSessionActive(false)
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
    }
    if (activityTimeoutRef.current) {
      clearInterval(activityTimeoutRef.current)
    }
  }

  const resumeTracking = () => {
    setSessionStartTime(Date.now())
    setSessionActive(true)
    trackingIntervalRef.current = setInterval(() => {
      updateTrackingData()
    }, 5000)
  }

  const endSession = async () => {
    pauseTracking()
    await saveTrackingData(trackingData)
  }

  // Format time display
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Get focus level color
  const getFocusColor = (score) => {
    if (score >= 80) return '#10B981' // green
    if (score >= 60) return '#F59E0B' // yellow
    return '#EF4444' // red
  }

  // Calculate weekly reading time
  const calculateWeeklyTime = () => {
    return weeklyStats.reduce((total, stat) => {
      return total + (stat.tracking_data?.totalTime || 0)
    }, 0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current)
      }
      if (activityTimeoutRef.current) {
        clearInterval(activityTimeoutRef.current)
      }
    }
  }, [])

  // Expose functions to parent components
  useEffect(() => {
    if (window) {
      window.readingTracker = {
        updatePageProgress,
        updateHighlights,
        updateNotes,
        pauseTracking,
        resumeTracking,
        endSession
      }
    }
  }, [])

  if (activeTab !== 'content' && activeTab !== 'tracker') {
    return null
  }

  // Compact mode for integrated view
  const isCompactMode = activeTab === 'content'

  if (isCompactMode) {
    // Compact integrated view
    return (
      <div style={{ 
        padding: '16px 24px', 
        fontFamily: 'Outfit, sans-serif',
        background: '#F8FAFC',
        height: '100%',
        overflow: 'auto'
      }}>
        {/* Compact Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} style={{ color: '#7a12cc' }} />
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: '#1A102D', 
              margin: 0 
            }}>
              Reading Progress
            </h3>
          </div>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            {!sessionActive ? (
              <button
                onClick={resumeTracking}
                style={{
                  padding: '6px 12px',
                  background: '#7a12cc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Resume
              </button>
            ) : (
              <button
                onClick={pauseTracking}
                style={{
                  padding: '6px 12px',
                  background: '#F59E0B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Pause
              </button>
            )}
          </div>
        </div>

        {/* Compact Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Reading Time */}
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <Clock size={16} style={{ color: '#7a12cc', marginBottom: '4px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A102D' }}>
              {formatTime(trackingData.totalTime)}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Time</div>
          </div>

          {/* Reading Speed */}
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <TrendingUp size={16} style={{ color: '#10B981', marginBottom: '4px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A102D' }}>
              {trackingData.readingSpeed}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>WPM</div>
          </div>

          {/* Focus Score */}
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <Eye size={16} style={{ color: getFocusColor(trackingData.focusScore), marginBottom: '4px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: getFocusColor(trackingData.focusScore) }}>
              {trackingData.focusScore}%
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Focus</div>
          </div>

          {/* Progress */}
          <div style={{
            background: 'white',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            textAlign: 'center'
          }}>
            <Target size={16} style={{ color: '#F59E0B', marginBottom: '4px' }} />
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A102D' }}>
              {trackingData.currentPage}/{trackingData.totalPages}
            </div>
            <div style={{ fontSize: '10px', color: '#64748B' }}>Pages</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          background: 'white',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{
            width: '100%',
            height: '6px',
            background: '#E5E7EB',
            borderRadius: '3px',
            overflow: 'hidden',
            marginBottom: '6px'
          }}>
            <div style={{
              width: `${(trackingData.currentPage / trackingData.totalPages) * 100}%`,
              height: '100%',
              background: '#7a12cc',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center' }}>
            {Math.round((trackingData.currentPage / trackingData.totalPages) * 100)}% Complete
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '24px', 
      fontFamily: 'Outfit, sans-serif',
      background: '#F8FAFC',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen size={28} style={{ color: '#7a12cc' }} />
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              color: '#1A102D', 
              margin: 0 
            }}>
              Reading Tracker
            </h1>
            <p style={{ 
              fontSize: '14px', 
              color: '#64748B', 
              margin: '4px 0 0 0' 
            }}>
              {material?.title || 'Document'}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {!sessionActive ? (
            <button
              onClick={resumeTracking}
              style={{
                padding: '8px 16px',
                background: '#7a12cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={16} />
              Resume Tracking
            </button>
          ) : (
            <button
              onClick={pauseTracking}
              style={{
                padding: '8px 16px',
                background: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Coffee size={16} />
              Pause
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Total Reading Time */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Clock size={20} style={{ color: '#7a12cc' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
              Total Reading Time
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A102D' }}>
            {formatTime(trackingData.totalTime)}
          </div>
        </div>

        {/* Reading Speed */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingUp size={20} style={{ color: '#10B981' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
              Reading Speed
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A102D' }}>
            {trackingData.readingSpeed}
            <span style={{ fontSize: '16px', color: '#64748B', fontWeight: 400 }}>
              wpm
            </span>
          </div>
        </div>

        {/* Focus Score */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Eye size={20} style={{ color: getFocusColor(trackingData.focusScore) }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
              Focus Score
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: getFocusColor(trackingData.focusScore) }}>
            {trackingData.focusScore}%
          </div>
        </div>

        {/* Progress */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Target size={20} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>
              Progress
            </span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A102D' }}>
            {trackingData.currentPage}/{trackingData.totalPages}
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            background: '#E5E7EB',
            borderRadius: '4px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(trackingData.currentPage / trackingData.totalPages) * 100}%`,
              height: '100%',
              background: '#7a12cc',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          textAlign: 'center'
        }}>
          <Activity size={20} style={{ color: '#7a12cc', marginBottom: '8px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D' }}>
            {trackingData.sessionCount}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Sessions</div>
        </div>

        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          textAlign: 'center'
        }}>
          <Award size={20} style={{ color: '#10B981', marginBottom: '8px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D' }}>
            {trackingData.highlights}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Highlights</div>
        </div>

        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          textAlign: 'center'
        }}>
          <BookOpen size={20} style={{ color: '#F59E0B', marginBottom: '8px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D' }}>
            {trackingData.notes}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Notes</div>
        </div>

        <div style={{
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          textAlign: 'center'
        }}>
          <Calendar size={20} style={{ color: '#EF4444', marginBottom: '8px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A102D' }}>
            {trackingData.streakDays}
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Day Streak</div>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <BarChart3 size={20} style={{ color: '#7a12cc' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A102D', margin: 0 }}>
            Weekly Progress
          </h2>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          height: '120px',
          marginBottom: '12px'
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
            const dayTime = Math.random() * 60 * 60 * 1000 // Random time for demo
            const height = (dayTime / (60 * 60 * 1000)) * 100 // Convert to percentage
            
            return (
              <div key={day} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1 
              }}>
                <div style={{
                  width: '24px',
                  height: `${height}%`,
                  background: '#7a12cc',
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px'
                }} />
                <span style={{ 
                  fontSize: '12px', 
                  color: '#64748B', 
                  marginTop: '8px' 
                }}>
                  {day}
                </span>
              </div>
            )
          })}
        </div>
        
        <div style={{ fontSize: '14px', color: '#64748B' }}>
          Total this week: {formatTime(calculateWeeklyTime())}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Award size={20} style={{ color: '#10B981' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A102D', margin: 0 }}>
              Recent Achievements
            </h2>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '12px'
          }}>
            {achievements.slice(0, 6).map((achievement, index) => (
              <div key={index} style={{
                background: '#F0FDF4',
                border: '1px solid #10B981',
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center'
              }}>
                <Award size={24} style={{ color: '#10B981', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#065F46' }}>
                  {achievement.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
