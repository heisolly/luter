import { useState, useEffect, useCallback, useRef } from 'react'
import { dailyService } from '../services/dailyService'

export const useAudioSession = (sessionId, userName) => {
  const [isJoined, setIsJoined] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [participantCount, setParticipantCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState('idle') // idle, connecting, connected, failed
  const [error, setError] = useState(null)
  const roomUrlRef = useRef(null)
  const eventListenersRef = useRef({})

  const logAudioHook = useCallback((level, message, data) => {
    const debugState = window.__luterAudioHookDebug || { logs: [] }
    debugState.logs ||= []
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      data,
    }
    debugState.logs.push(entry)
    if (debugState.logs.length > 100) debugState.logs.shift()
    debugState.last = entry
    window.__luterAudioHookDebug = debugState

    const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
    logger(`[Luter Audio Hook] ${message}`, data || '')
  }, [])

  /**
   * Update participant count
   */
  const updateParticipantCount = useCallback(() => {
    try {
      const participants = dailyService.getParticipants()
      setParticipantCount(participants.length)
    } catch (err) {
      console.error('Failed to update participant count:', err)
    }
  }, [])

  /**
   * Join the audio session
   */
  const joinSession = useCallback(async () => {
    if (!sessionId) {
      logAudioHook('warn', 'Skipping audio auto-join: no workspace session id yet', { sessionId, userName })
      return
    }
    if (!userName) {
      logAudioHook('warn', 'Skipping audio auto-join: no user name yet', { sessionId, userName })
      return
    }
    if (isJoined) {
      logAudioHook('info', 'Skipping audio auto-join: already joined', { sessionId, userName })
      return
    }

    try {
      logAudioHook('info', 'Starting audio auto-join', { sessionId, userName })
      setConnectionStatus('connecting')
      setError(null)

      const roomUrl = await dailyService.getRoomUrl(sessionId)

      roomUrlRef.current = roomUrl

      await dailyService.joinRoom(roomUrl, userName)

      // Set up event listeners
      const handleParticipantsChange = () => {
        updateParticipantCount()
      }

      const handleError = (event) => {
        console.error('Daily.co error:', event)
        setError(event?.message || 'An error occurred')
      }

      const handleStoppedError = (event) => {
        console.error('Daily.co stopped with error:', event)
        setError('Connection lost')
        setIsJoined(false)
      }

      dailyService.addEventListener('joined-meeting', handleParticipantsChange)
      dailyService.addEventListener('participant-joined', handleParticipantsChange)
      dailyService.addEventListener('participant-left', handleParticipantsChange)
      dailyService.addEventListener('error', handleError)
      dailyService.addEventListener('stopped-error', handleStoppedError)

      eventListenersRef.current = {
        handleParticipantsChange,
        handleError,
        handleStoppedError,
      }

      setIsJoined(true)
      setConnectionStatus('connected')
      updateParticipantCount()
      logAudioHook('info', 'Audio auto-join connected', { sessionId })
    } catch (err) {
      logAudioHook('error', 'Failed to join audio session', {
        message: err?.message,
        stack: err?.stack,
        sessionId,
      })
      setError(err.message || 'Failed to join audio session')
      setConnectionStatus('failed')
      setIsJoined(false)
    }
  }, [sessionId, userName, isJoined, updateParticipantCount, logAudioHook])

  /**
   * Leave the audio session
   */
  const leaveSession = useCallback(async () => {
    try {
      // Remove event listeners
      const listeners = eventListenersRef.current
      if (listeners.handleParticipantsChange) {
        dailyService.removeEventListener('joined-meeting', listeners.handleParticipantsChange)
        dailyService.removeEventListener('participant-joined', listeners.handleParticipantsChange)
        dailyService.removeEventListener('participant-left', listeners.handleParticipantsChange)
      }
      if (listeners.handleError) {
        dailyService.removeEventListener('error', listeners.handleError)
      }
      if (listeners.handleStoppedError) {
        dailyService.removeEventListener('stopped-error', listeners.handleStoppedError)
      }
      eventListenersRef.current = {}

      await dailyService.leaveRoom()
      setIsJoined(false)
      setConnectionStatus('idle')
      setParticipantCount(0)
    } catch (err) {
      console.error('Failed to leave audio session:', err)
    }
  }, [])

  /**
   * Toggle microphone
   */
  const toggleMicrophone = useCallback(async () => {
    try {
      const newState = !isMicEnabled
      await dailyService.setMicrophoneEnabled(newState)
      setIsMicEnabled(newState)
    } catch (err) {
      console.error('Failed to toggle microphone:', err)
      setError('Failed to toggle microphone')
    }
  }, [isMicEnabled])

  /**
   * Toggle speaker
   */
  const toggleSpeaker = useCallback(async () => {
    try {
      const newState = !isSpeakerEnabled
      await dailyService.setSpeakerEnabled(newState)
      setIsSpeakerEnabled(newState)
    } catch (err) {
      console.error('Failed to toggle speaker:', err)
      setError('Failed to toggle speaker')
    }
  }, [isSpeakerEnabled])

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      joinSession()
    }, 0)

    return () => {
      clearTimeout(connectTimer)
      leaveSession()
    }
    // Auto-connect only when the backing workspace session changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return {
    isJoined,
    isMicEnabled,
    isSpeakerEnabled,
    participantCount,
    connectionStatus,
    error,
    joinSession,
    leaveSession,
    toggleMicrophone,
    toggleSpeaker,
  }
}
