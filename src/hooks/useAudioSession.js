import { useState, useEffect, useCallback, useRef } from 'react'
import { ConnectionState } from 'livekit-client'
import { livekitService, normalizeLiveKitRoomName } from '../services/livekitService'

const statusFromLiveKitState = (state) => {
  if (state === ConnectionState.Connected) return 'connected'
  if (state === ConnectionState.Connecting) return 'connecting'
  if (state === ConnectionState.Reconnecting) return 'reconnecting'
  return 'idle'
}

export const useAudioSession = (roomId, userInfo = {}) => {
  const userId = typeof userInfo === 'object' ? userInfo.userId : null
  const userName = typeof userInfo === 'object' ? userInfo.userName : userInfo
  const [isJoined, setIsJoined] = useState(false)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [participantCount, setParticipantCount] = useState(0)
  const [participants, setParticipants] = useState([])
  const [activeSpeakers, setActiveSpeakers] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('idle') // idle, connecting, connected, reconnecting, failed
  const [error, setError] = useState(null)
  const isJoinedRef = useRef(false)
  const joinPromiseRef = useRef(null)
  const removeListenersRef = useRef(null)
  const activeSpeakersRef = useRef([])

  const setJoinedState = useCallback((joined) => {
    isJoinedRef.current = joined
    setIsJoined(joined)
  }, [])

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
  const updateParticipants = useCallback((speakers = activeSpeakersRef.current) => {
    try {
      const nextParticipants = livekitService.getParticipants(speakers)
      setParticipantCount(nextParticipants.length)
      setParticipants(nextParticipants)
    } catch (err) {
      console.error('Failed to update participant count:', err)
    }
  }, [])

  const removeEventListeners = useCallback(() => {
    removeListenersRef.current?.()
    removeListenersRef.current = null
  }, [])

  /**
   * Join the audio session
   */
  const joinSession = useCallback(async () => {
    const roomName = normalizeLiveKitRoomName(roomId)
    if (!roomName) {
      logAudioHook('warn', 'Skipping audio join: no workspace room id yet', { roomId, userName })
      return
    }
    if (!userId || !userName) {
      logAudioHook('warn', 'Skipping audio join: no user identity yet', { roomName, userId, userName })
      return
    }
    if (isJoinedRef.current) {
      logAudioHook('info', 'Skipping audio join: already joined', { roomName, userName })
      return
    }
    if (joinPromiseRef.current) return joinPromiseRef.current

    const joinPromise = (async () => {
      logAudioHook('info', 'Starting LiveKit audio join', { roomName, userName })
      setConnectionStatus('connecting')
      setError(null)

      const { token, livekitUrl } = await livekitService.getToken({ roomName, userId, username: userName })
      const room = await livekitService.connect({ livekitUrl, token, userName })

      removeEventListeners()

      removeListenersRef.current = livekitService.addAudioEventListeners({
        onParticipantsChanged: () => updateParticipants(),
        onActiveSpeakersChanged: (speakers) => {
          activeSpeakersRef.current = speakers || []
          setActiveSpeakers(activeSpeakersRef.current.map((speaker) => ({
            id: speaker.sid || speaker.identity,
            identity: speaker.identity,
            name: speaker.name || speaker.identity || 'Peer',
          })))
          updateParticipants(activeSpeakersRef.current)
        },
        onConnectionStateChanged: (state) => {
          setConnectionStatus(statusFromLiveKitState(state))
        },
        onDisconnected: () => {
          setJoinedState(false)
          setConnectionStatus('idle')
          setParticipantCount(0)
          setParticipants([])
          setActiveSpeakers([])
          activeSpeakersRef.current = []
        },
        onReconnecting: () => {
          setConnectionStatus('reconnecting')
        },
        onReconnected: () => {
          setConnectionStatus('connected')
          updateParticipants()
        },
      })

      setJoinedState(true)
      setConnectionStatus(statusFromLiveKitState(room.state))
      setIsMicEnabled(Boolean(room.localParticipant.isMicrophoneEnabled))
      setIsSpeakerEnabled(true)
      updateParticipants()
      logAudioHook('info', 'LiveKit audio connected', { roomName })
    })()

    joinPromiseRef.current = joinPromise

    try {
      await joinPromise
    } catch (err) {
      logAudioHook('error', 'Failed to join audio session', {
        message: err?.message,
        stack: err?.stack,
        roomId,
      })
      const permissionDenied = /permission|notallowed|denied/i.test(err?.message || '')
      setError(permissionDenied ? 'Microphone permission denied. Please allow microphone access.' : (err.message || 'Failed to join audio session'))
      setConnectionStatus('failed')
      setJoinedState(false)
    } finally {
      joinPromiseRef.current = null
    }
  }, [roomId, userId, userName, updateParticipants, logAudioHook, removeEventListeners, setJoinedState])

  /**
   * Leave the audio session
   */
  const leaveSession = useCallback(async () => {
    try {
      removeEventListeners()

      await livekitService.disconnect()
      setJoinedState(false)
      setConnectionStatus('idle')
      setParticipantCount(0)
      setParticipants([])
      setActiveSpeakers([])
      activeSpeakersRef.current = []
    } catch (err) {
      console.error('Failed to leave audio session:', err)
    }
  }, [removeEventListeners, setJoinedState])

  /**
   * Toggle microphone
   */
  const toggleMicrophone = useCallback(async () => {
    if (!isJoinedRef.current) return
    try {
      const newState = !isMicEnabled
      await livekitService.setMicrophoneEnabled(newState)
      setIsMicEnabled(newState)
      updateParticipants()
    } catch (err) {
      console.error('Failed to toggle microphone:', err)
      setError('Failed to toggle microphone')
    }
  }, [isMicEnabled, updateParticipants])

  /**
   * Toggle speaker
   */
  const toggleSpeaker = useCallback(async () => {
    if (!isJoinedRef.current) return
    try {
      const newState = !isSpeakerEnabled
      livekitService.setSpeakerEnabled(newState)
      setIsSpeakerEnabled(newState)
    } catch (err) {
      console.error('Failed to toggle speaker:', err)
      setError('Failed to toggle speaker')
    }
  }, [isSpeakerEnabled])

  useEffect(() => {
    setJoinedState(false)
    setConnectionStatus('idle')
    setError(null)
    setParticipantCount(0)
    setParticipants([])
    setActiveSpeakers([])
    activeSpeakersRef.current = []

    return () => {
      removeEventListeners()
      if (isJoinedRef.current || joinPromiseRef.current) {
        livekitService.disconnect()
      }
      isJoinedRef.current = false
    }
  }, [roomId, removeEventListeners, setJoinedState])

  return {
    isJoined,
    isMicEnabled,
    isSpeakerEnabled,
    participantCount,
    participants,
    activeSpeakers,
    connectionStatus,
    error,
    joinSession,
    leaveSession,
    toggleMicrophone,
    toggleSpeaker,
  }
}
