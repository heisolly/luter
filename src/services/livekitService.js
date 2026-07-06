import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client'
import { KrispNoiseFilter } from '@livekit/krisp-noise-filter'
import { supabase } from '../supabaseClient'

const livekitState = globalThis.__luterLiveKitAudioState || {
  room: null,
  audioElements: new Map(),
  speakerEnabled: true,
  logs: [],
  lastError: null,
}

livekitState.audioElements ||= new Map()
livekitState.logs ||= []
livekitState.speakerEnabled ??= true
globalThis.__luterLiveKitAudioState = livekitState
globalThis.__luterAudioDebug = livekitState

const logLiveKit = (level, message, data) => {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    data,
  }
  livekitState.logs.push(entry)
  if (livekitState.logs.length > 100) livekitState.logs.shift()

  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  logger(`[Luter LiveKit] ${message}`, data || '')
}

const setLastError = (error, context) => {
  livekitState.lastError = {
    context,
    message: error?.message || String(error),
    stack: error?.stack,
    time: new Date().toISOString(),
  }
  logLiveKit('error', context, livekitState.lastError)
}

export const normalizeLiveKitRoomName = (roomId) => {
  const cleanRoomId = String(roomId || '').trim()
  if (!cleanRoomId) return ''
  if (cleanRoomId.startsWith('luter-')) return cleanRoomId
  return `luter-session-${cleanRoomId}`
}

const getParticipantName = (participant) => (
  participant?.name ||
  participant?.metadata?.name ||
  participant?.identity ||
  'Peer'
)

const serializeParticipant = (participant, isLocal = false, activeSpeakerIds = new Set()) => ({
  id: participant?.sid || participant?.identity || 'local',
  sid: participant?.sid || null,
  identity: participant?.identity || null,
  name: getParticipantName(participant),
  isLocal,
  isSpeaking: activeSpeakerIds.has(participant?.sid) || activeSpeakerIds.has(participant?.identity),
  isMicrophoneEnabled: participant?.isMicrophoneEnabled ?? true,
})

const updateAudioElementPlayback = (audio) => {
  audio.muted = !livekitState.speakerEnabled
  audio.volume = livekitState.speakerEnabled ? 1 : 0
  if (livekitState.speakerEnabled) audio.play().catch(() => null)
}

const attachRemoteAudioTrack = (track, publication, participant) => {
  if (track.kind !== Track.Kind.Audio) return

  const key = publication?.trackSid || `${participant?.sid || participant?.identity}-${Date.now()}`
  detachRemoteAudioTrack(key)

  const audio = track.attach()
  audio.autoplay = true
  audio.playsInline = true
  audio.dataset.luterLivekitAudio = key
  audio.style.display = 'none'
  document.body.appendChild(audio)
  livekitState.audioElements.set(key, audio)
  updateAudioElementPlayback(audio)

  logLiveKit('info', 'Attached remote LiveKit audio track', {
    participant: participant?.identity,
    trackSid: publication?.trackSid,
  })
}

const detachRemoteAudioTrack = (publicationOrKey) => {
  const key = typeof publicationOrKey === 'string'
    ? publicationOrKey
    : publicationOrKey?.trackSid
  if (!key) return

  const audio = livekitState.audioElements.get(key)
  if (!audio) return

  audio.pause()
  audio.srcObject = null
  audio.remove()
  livekitState.audioElements.delete(key)
  logLiveKit('info', 'Removed remote LiveKit audio track', { trackSid: key })
}

const detachAllRemoteAudio = () => {
  livekitState.audioElements.forEach((audio, key) => {
    audio.pause()
    audio.srcObject = null
    audio.remove()
    livekitState.audioElements.delete(key)
  })
}

// Browser autoplay policy workaround: resume playback on user interaction
if (typeof document !== 'undefined') {
  const resumeBlockedAudio = () => {
    if (!livekitState.speakerEnabled) return;
    livekitState.audioElements.forEach((audio) => {
      if (audio.paused) {
        audio.play().catch(() => null);
      }
    });
  };
  document.addEventListener('click', resumeBlockedAudio, { capture: true });
  document.addEventListener('touchstart', resumeBlockedAudio, { capture: true });
}

export const livekitService = {
  async getToken({ roomName, userId, username }) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const authToken = sessionData?.session?.access_token
      if (!authToken) throw new Error('You must be signed in to join audio')

      const response = await fetch('/api/livekit/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ roomName, userId, username }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || `Failed to create LiveKit token (${response.status})`)
      }

      if (!data.token || !data.livekitUrl) {
        throw new Error('LiveKit token response was incomplete')
      }

      return data
    } catch (error) {
      setLastError(error, 'Failed to fetch LiveKit token')
      throw error
    }
  },

  createRoom() {
    if (livekitState.room) return livekitState.room

    livekitState.room = new Room({
      adaptiveStream: false,
      dynacast: false,
      stopLocalTrackOnUnpublish: true,
    })
    return livekitState.room
  },

  async connect({ livekitUrl, token, userName }) {
    try {
      const room = this.createRoom()
      if (room.state === ConnectionState.Connected) return room

      logLiveKit('info', 'Connecting to LiveKit audio room', { userName })
      await room.connect(livekitUrl, token, {
        autoSubscribe: true,
      })

      await room.localParticipant.setMicrophoneEnabled(true, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      })

      logLiveKit('info', 'LiveKit audio connected', {
        state: room.state,
        participants: room.remoteParticipants.size + 1,
      })
      return room
    } catch (error) {
      setLastError(error, 'Failed to connect to LiveKit')
      throw error
    }
  },

  on(eventName, callback) {
    livekitState.room?.on(eventName, callback)
  },

  off(eventName, callback) {
    livekitState.room?.off(eventName, callback)
  },

  addAudioEventListeners(handlers = {}) {
    const room = livekitState.room
    if (!room) return () => {}

    // Attach any tracks that were already subscribed before listeners were added
    room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (publication.track) {
          attachRemoteAudioTrack(publication.track, publication, participant)
        }
      })
    })

    const handleTrackSubscribed = (track, publication, participant) => {
      attachRemoteAudioTrack(track, publication, participant)
      handlers.onParticipantsChanged?.()
    }
    const handleTrackUnsubscribed = (_track, publication) => {
      detachRemoteAudioTrack(publication)
      handlers.onParticipantsChanged?.()
    }
    const handleParticipantConnected = () => handlers.onParticipantsChanged?.()
    const handleParticipantDisconnected = (participant) => {
      participant?.trackPublications?.forEach?.((publication) => detachRemoteAudioTrack(publication))
      handlers.onParticipantsChanged?.()
    }
    const handleActiveSpeakersChanged = (speakers) => handlers.onActiveSpeakersChanged?.(speakers)
    const handleConnectionStateChanged = (state) => handlers.onConnectionStateChanged?.(state)
    const handleDisconnected = (reason) => handlers.onDisconnected?.(reason)
    const handleReconnecting = () => handlers.onReconnecting?.()
    const handleReconnected = () => handlers.onReconnected?.()
    const handleLocalTrackPublished = () => handlers.onParticipantsChanged?.()
    const handleLocalTrackUnpublished = () => handlers.onParticipantsChanged?.()

    room
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      .on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
      .on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
      .on(RoomEvent.Disconnected, handleDisconnected)
      .on(RoomEvent.Reconnecting, handleReconnecting)
      .on(RoomEvent.Reconnected, handleReconnected)
      .on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
      .on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)

    return () => {
      room
        .off(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
        .off(RoomEvent.ParticipantConnected, handleParticipantConnected)
        .off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
        .off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
        .off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
        .off(RoomEvent.Disconnected, handleDisconnected)
        .off(RoomEvent.Reconnecting, handleReconnecting)
        .off(RoomEvent.Reconnected, handleReconnected)
        .off(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
        .off(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished)
    }
  },

  async setMicrophoneEnabled(enabled) {
    try {
      if (!livekitState.room) return
      await livekitState.room.localParticipant.setMicrophoneEnabled(enabled, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      })
      
      if (enabled) {
        // Disabled KrispNoiseFilter here because it introduces significant latency 
        // which breaks WebRTC's built-in Acoustic Echo Cancellation (AEC).
      }
    } catch (error) {
      setLastError(error, 'Failed to toggle LiveKit microphone')
      throw error
    }
  },

  setSpeakerEnabled(enabled) {
    livekitState.speakerEnabled = enabled
    livekitState.audioElements.forEach(updateAudioElementPlayback)
    logLiveKit('info', 'Updated LiveKit speaker playback', {
      enabled,
      audioElements: livekitState.audioElements.size,
    })
  },

  getParticipants(activeSpeakers = []) {
    const room = livekitState.room
    if (!room) return []

    const activeSpeakerIds = new Set(
      activeSpeakers.map((participant) => participant?.sid || participant?.identity).filter(Boolean)
    )

    return [
      serializeParticipant(room.localParticipant, true, activeSpeakerIds),
      ...Array.from(room.remoteParticipants.values()).map((participant) => (
        serializeParticipant(participant, false, activeSpeakerIds)
      )),
    ]
  },

  getRoom() {
    return livekitState.room
  },

  async disconnect() {
    try {
      if (!livekitState.room) return
      logLiveKit('info', 'Disconnecting LiveKit audio room')
      livekitState.room.disconnect()
      livekitState.room = null
      detachAllRemoteAudio()
    } catch (error) {
      setLastError(error, 'Failed to disconnect LiveKit')
    }
  },

  getDebugState() {
    return {
      state: livekitState.room?.state,
      remoteParticipants: livekitState.room?.remoteParticipants?.size || 0,
      lastError: livekitState.lastError,
      logs: livekitState.logs,
      audioElements: livekitState.audioElements.size,
      speakerEnabled: livekitState.speakerEnabled,
    }
  },
}
