import DailyIframe from '@daily-co/daily-js'

const dailyState = globalThis.__luterDailyAudioState || {
  callObject: null,
  joinPromise: null,
  leaveTimer: null,
  logs: [],
  lastError: null,
  debugListenersAttached: false,
  audioElements: new Map(),
  speakerEnabled: true,
}
dailyState.logs ||= []
dailyState.lastError ||= null
dailyState.debugListenersAttached ||= false
dailyState.audioElements ||= new Map()
dailyState.speakerEnabled ??= true
globalThis.__luterDailyAudioState = dailyState
globalThis.__luterAudioDebug = dailyState

const logDaily = (level, message, data) => {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    data,
  }
  dailyState.logs.push(entry)
  if (dailyState.logs.length > 100) dailyState.logs.shift()

  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  logger(`[Luter Audio] ${message}`, data || '')
}

const setLastError = (error, context) => {
  dailyState.lastError = {
    context,
    message: error?.message || String(error),
    stack: error?.stack,
    time: new Date().toISOString(),
  }
  logDaily('error', context, dailyState.lastError)
}

const cancelPendingLeave = () => {
  if (dailyState.leaveTimer) {
    clearTimeout(dailyState.leaveTimer)
    dailyState.leaveTimer = null
    logDaily('info', 'Cancelled pending Daily audio leave')
  }
}

const onDailyEvent = (eventName, callback) => {
  if (!dailyState.callObject) return
  if (typeof dailyState.callObject.on === 'function') {
    dailyState.callObject.on(eventName, callback)
    return
  }
  if (typeof dailyState.callObject.addEventListener === 'function') {
    dailyState.callObject.addEventListener(eventName, callback)
  }
}

const offDailyEvent = (eventName, callback) => {
  if (!dailyState.callObject) return
  if (typeof dailyState.callObject.off === 'function') {
    dailyState.callObject.off(eventName, callback)
    return
  }
  if (typeof dailyState.callObject.removeEventListener === 'function') {
    dailyState.callObject.removeEventListener(eventName, callback)
  }
}

const getParticipantAudioTrack = (participant) => {
  return participant?.tracks?.audio?.persistentTrack || participant?.tracks?.audio?.track || participant?.audioTrack || null
}

const removeRemoteAudioElement = (participantId) => {
  const audio = dailyState.audioElements.get(participantId)
  if (!audio) return

  audio.pause()
  audio.srcObject = null
  audio.remove()
  dailyState.audioElements.delete(participantId)
  logDaily('info', 'Removed remote audio sink', { participantId })
}

const syncRemoteAudioElement = (participant) => {
  if (!participant || participant.local) return

  const participantId = participant.session_id || participant.user_id
  const track = getParticipantAudioTrack(participant)
  if (!participantId || !track || track.readyState === 'ended') {
    if (participantId) removeRemoteAudioElement(participantId)
    return
  }

  let audio = dailyState.audioElements.get(participantId)
  if (!audio) {
    audio = document.createElement('audio')
    audio.autoplay = true
    audio.playsInline = true
    audio.dataset.luterDailyAudio = participantId
    audio.style.display = 'none'
    document.body.appendChild(audio)
    dailyState.audioElements.set(participantId, audio)
    logDaily('info', 'Created remote audio sink', { participantId })
  }

  const currentTrack = audio.srcObject?.getAudioTracks?.()[0]
  if (currentTrack !== track) {
    audio.srcObject = new MediaStream([track])
    logDaily('info', 'Attached remote audio track', {
      participantId,
      trackState: participant.tracks?.audio?.state,
      trackReadyState: track.readyState,
      trackEnabled: track.enabled,
    })
  }

  audio.muted = !dailyState.speakerEnabled
  audio.volume = dailyState.speakerEnabled ? 1 : 0

  audio.play().catch((error) => {
    logDaily('warn', 'Remote audio autoplay is blocked or delayed', {
      participantId,
      message: error?.message,
    })
    const retryPlay = () => {
      audio.play().catch(() => null)
      document.removeEventListener('click', retryPlay, true)
      document.removeEventListener('touchstart', retryPlay, true)
    }
    document.addEventListener('click', retryPlay, true)
    document.addEventListener('touchstart', retryPlay, true)
  })
}

const syncRemoteAudioElements = () => {
  if (!dailyState.callObject) return

  const participants = Object.values(dailyState.callObject.participants())
  const activeRemoteIds = new Set()

  participants.forEach((participant) => {
    if (!participant?.local && (participant.session_id || participant.user_id)) {
      activeRemoteIds.add(participant.session_id || participant.user_id)
      syncRemoteAudioElement(participant)
    }
  })

  dailyState.audioElements.forEach((_, participantId) => {
    if (!activeRemoteIds.has(participantId)) removeRemoteAudioElement(participantId)
  })

  logDaily('info', 'Synced remote audio sinks', {
    remoteParticipants: activeRemoteIds.size,
    audioSinks: dailyState.audioElements.size,
  })
}

const audioOnlyCallOptions = {
  videoSource: false,
  audioSource: true,
  startVideoOff: true,
  startAudioOff: false,
  subscribeToTracksAutomatically: true,
  inputSettings: {
    video: {
      processor: {
        type: 'none',
      },
    },
  },
}

export const dailyService = {
  /**
   * Fetch or create a Daily room for the session
   */
  async getRoomUrl(sessionId) {
    try {
      cancelPendingLeave()
      logDaily('info', 'Fetching Daily audio room', { sessionId })
      const res = await fetch('/api/daily-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        throw new Error(`Failed to get room: ${res.status}${errorText ? ` ${errorText}` : ''}`)
      }
      const data = await res.json()
      logDaily('info', 'Daily audio room ready', { sessionId, roomUrl: data.roomUrl, roomName: data.roomName })
      return data.roomUrl
    } catch (error) {
      setLastError(error, 'Failed to get Daily room')
      throw error
    }
  },

  /**
   * Initialize Daily call and join room
   */
  async joinRoom(roomUrl, userName) {
    try {
      logDaily('info', 'Joining hidden Daily audio room', {
        roomUrl,
        userName,
        existingState: dailyState.callObject?.meetingState?.(),
      })

      cancelPendingLeave()

      if (dailyState.joinPromise) {
        return dailyState.joinPromise
      }

      if (dailyState.callObject && dailyState.callObject.meetingState() === 'joined') {
        return dailyState.callObject
      }

      if (!dailyState.callObject) {
        dailyState.callObject = DailyIframe.getCallInstance()
        if (dailyState.callObject) {
          logDaily('info', 'Reusing existing Daily call instance')
        }
      }

      if (!dailyState.callObject) {
        dailyState.callObject = DailyIframe.createCallObject({
          ...audioOnlyCallOptions,
          iframeStyle: {
            position: 'fixed',
            top: '-9999px',
            left: '-9999px',
            width: '1px',
            height: '1px',
            opacity: 0,
            pointerEvents: 'none',
          },
        })
        logDaily('info', 'Created hidden Daily call object')
      }

      if (!dailyState.debugListenersAttached) {
        onDailyEvent('error', (event) => {
          setLastError(event, 'Daily emitted error event')
        })
        onDailyEvent('stopped-error', (event) => {
          setLastError(event, 'Daily stopped with error')
        })
        onDailyEvent('joined-meeting', (event) => {
          logDaily('info', 'Daily joined meeting', event)
          syncRemoteAudioElements()
        })
        onDailyEvent('left-meeting', (event) => {
          logDaily('info', 'Daily left meeting', event)
        })
        onDailyEvent('participant-joined', (event) => {
          logDaily('info', 'Daily participant joined', { participant: event?.participant?.session_id })
          syncRemoteAudioElements()
        })
        onDailyEvent('participant-updated', (event) => {
          syncRemoteAudioElement(event?.participant)
        })
        onDailyEvent('participant-left', (event) => {
          removeRemoteAudioElement(event?.participant?.session_id || event?.participant?.user_id)
        })
        onDailyEvent('track-started', (event) => {
          if (event?.type === 'audio') {
            logDaily('info', 'Daily remote audio track started', { participant: event?.participant?.session_id })
            syncRemoteAudioElement(event?.participant)
          }
        })
        onDailyEvent('track-stopped', (event) => {
          if (event?.type === 'audio') {
            logDaily('info', 'Daily remote audio track stopped', { participant: event?.participant?.session_id })
            syncRemoteAudioElements()
          }
        })
        dailyState.debugListenersAttached = true
      }

      dailyState.joinPromise = dailyState.callObject.join({
        ...audioOnlyCallOptions,
        url: roomUrl,
        userName,
      }).then(() => {
        dailyState.callObject.setLocalVideo(false)
        dailyState.callObject.updateReceiveSettings({
          '*': {
            video: { layer: 0 },
            screenVideo: { layer: 0 },
          },
        }).catch((error) => {
          logDaily('warn', 'Could not disable incoming video tracks', { message: error?.message })
        })
        logDaily('info', 'Hidden Daily audio join completed', {
          meetingState: dailyState.callObject.meetingState(),
          participants: dailyState.callObject.participantCounts?.(),
        })
        syncRemoteAudioElements()
        return dailyState.callObject
      }).finally(() => {
        dailyState.joinPromise = null
      })

      return await dailyState.joinPromise
    } catch (error) {
      dailyState.joinPromise = null
      setLastError(error, 'Failed to join Daily room')
      throw error
    }
  },

  /**
   * Leave the current room
   */
  async leaveRoom() {
    try {
      if (dailyState.leaveTimer) {
        clearTimeout(dailyState.leaveTimer)
      }

      dailyState.leaveTimer = setTimeout(async () => {
        logDaily('info', 'Leaving hidden Daily audio room')
        const pendingJoin = dailyState.joinPromise
        if (pendingJoin) {
          await pendingJoin.catch(() => null)
        }

        if (dailyState.callObject) {
          dailyState.joinPromise = null
          await dailyState.callObject.leave().catch(() => null)
          await dailyState.callObject.destroy().catch(() => null)
          dailyState.callObject = null
          dailyState.debugListenersAttached = false
          dailyState.audioElements.forEach((_, participantId) => removeRemoteAudioElement(participantId))
        }

        dailyState.leaveTimer = null
      }, 750)
    } catch (error) {
      setLastError(error, 'Failed to leave Daily room')
    }
  },

  /**
   * Immediately clean up the hidden audio call.
   */
  async destroyRoom() {
    try {
      if (dailyState.leaveTimer) {
        clearTimeout(dailyState.leaveTimer)
        dailyState.leaveTimer = null
      }

      const pendingJoin = dailyState.joinPromise
      if (pendingJoin) {
        await pendingJoin.catch(() => null)
      }

      if (dailyState.callObject) {
        dailyState.joinPromise = null
        await dailyState.callObject.leave().catch(() => null)
        await dailyState.callObject.destroy().catch(() => null)
        dailyState.callObject = null
        dailyState.debugListenersAttached = false
        dailyState.audioElements.forEach((_, participantId) => removeRemoteAudioElement(participantId))
      }
    } catch (error) {
      setLastError(error, 'Failed to destroy Daily room')
    }
  },

  /**
   * Toggle microphone
   */
  async setMicrophoneEnabled(enabled) {
    try {
      if (dailyState.callObject) {
        await dailyState.callObject.setLocalAudio(enabled)
      }
    } catch (error) {
      setLastError(error, 'Failed to toggle microphone')
      throw error
    }
  },

  /**
   * Toggle speaker
   */
  async setSpeakerEnabled(enabled) {
    try {
      dailyState.speakerEnabled = enabled
      dailyState.audioElements.forEach((audio) => {
        audio.muted = !enabled
        audio.volume = enabled ? 1 : 0
        if (enabled) audio.play().catch(() => null)
      })
      logDaily('info', 'Updated speaker playback state', {
        enabled,
        audioSinks: dailyState.audioElements.size,
      })
    } catch (error) {
      setLastError(error, 'Failed to toggle speaker')
      throw error
    }
  },

  /**
   * Get current audio state
   */
  getAudioState() {
    try {
      if (!dailyState.callObject) return null

      const state = dailyState.callObject.getNetworkStats()
      const participants = dailyState.callObject.participants()

      return {
        isConnected: dailyState.callObject.meetingState() === 'joined',
        participants: Object.values(participants).length,
        state,
      }
    } catch (error) {
      setLastError(error, 'Failed to get audio state')
      return null
    }
  },

  /**
   * Get list of active participants
   */
  getParticipants() {
    try {
      if (!dailyState.callObject) return []
      return Object.values(dailyState.callObject.participants())
    } catch (error) {
      setLastError(error, 'Failed to get participants')
      return []
    }
  },

  /**
   * Register event listener
   */
  addEventListener(eventName, callback) {
    onDailyEvent(eventName, callback)
  },

  /**
   * Remove event listener
   */
  removeEventListener(eventName, callback) {
    offDailyEvent(eventName, callback)
  },

  /**
   * Get call object (advanced usage)
   */
  getCallObject() {
    return dailyState.callObject
  },

  getDebugState() {
    return {
      meetingState: dailyState.callObject?.meetingState?.(),
      participantCounts: dailyState.callObject?.participantCounts?.(),
      lastError: dailyState.lastError,
      logs: dailyState.logs,
      audioSinks: dailyState.audioElements.size,
      speakerEnabled: dailyState.speakerEnabled,
    }
  },
}
