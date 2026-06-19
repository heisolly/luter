import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  Suspense,
  lazy,
} from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import "@excalidraw/excalidraw/index.css";
import {
  RoomProvider,
  useStorage,
  useMutation,
  useOthers,
  useSelf,
  useStatus,
  useUpdateMyPresence,
  LiveList,
  LiveObject
} from '../dashboard/CollaborationProvider'
import { supabase } from '../../supabaseClient'

// Lazy-load Excalidraw to keep the initial bundle small
const ExcalidrawLazy = lazy(() =>
  import('@excalidraw/excalidraw').then((m) => ({ default: m.Excalidraw }))
)

// ─── tiny debounce ────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback(
    (...args) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay]
  )
}

// ─── colour palette for avatars ───────────────────────────────
const PALETTE = [
  '#6D28D9', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6',
]
const avatarColor = (str = '') =>
  PALETTE[str.charCodeAt(0) % PALETTE.length]

// ─── Connection status dot ─────────────────────────────────────
const StatusDot = () => {
  const status = useStatus()
  const colors = {
    connected:    '#10B981',
    connecting:   '#F59E0B',
    reconnecting: '#F59E0B',
    disconnected: '#EF4444',
  }
  return (
    <div
      title={`Room: ${status}`}
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: colors[status] ?? '#94A3B8',
        boxShadow: `0 0 0 2px ${(colors[status] ?? '#94A3B8')}33`,
        flexShrink: 0,
      }}
    />
  )
}

// ─── Presence avatar strip ─────────────────────────────────────
const PresenceStrip = ({ user }) => {
  const others = useOthers()
  const self   = useSelf()

  const selfName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'You'

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginLeft: '-6px' }}>
      {/* Self */}
      <div
        title={`You (${selfName})`}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: avatarColor(selfName),
          border: '2.5px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 800, color: 'white',
          marginLeft: '6px', flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          cursor: 'default',
        }}
      >
        {selfName.charAt(0).toUpperCase()}
      </div>

      {/* Others */}
      {others.slice(0, 6).map(({ connectionId, info, presence }) => {
        const name = info?.name || `Peer`
        return (
          <div
            key={connectionId}
            title={name}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: avatarColor(name),
              border: '2.5px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 800, color: 'white',
              marginLeft: '6px', flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              cursor: 'default',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )
      })}

      {others.length > 6 && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#E2E8F0', border: '2.5px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 800, color: '#64748B',
          marginLeft: '6px', flexShrink: 0,
        }}>
          +{others.length - 6}
        </div>
      )}
    </div>
  )
}

// ─── Inner board — must be inside RoomProvider ─────────────────
const BoardInner = ({ roomId, boardName, user }) => {
  const navigate   = useNavigate()
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)

  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-mode'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.body.classList.contains('dark-mode'));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  const [copied, setCopied]               = useState(false)
  const boardContainerRef = useRef(null)
  const updateMyPresence = useUpdateMyPresence()

  // Liveblocks storage — serialized plain arrays/objects by useStorage
  const storedElements = useStorage((root) => root.whiteboardData)
  const storedAppState = useStorage((root) => root.whiteboardAppState)

  // Prevent infinite loop: remote update → onChange → write → remote update
  const isRemoteUpdate = useRef(false)
  const isInitialized  = useRef(false)

  // ── Write to Liveblocks ────────────────────────────────────
  const updateElements = useMutation(({ storage }, newElements) => {
    const list = storage.get('whiteboardData')
    if (!list || typeof list.push !== 'function') {
      // Self-heal: re-initialize if LiveList is missing
      storage.set('whiteboardData', new LiveList(newElements))
      return
    }
    list.clear()
    newElements.forEach((el) => list.push(el))
  }, [])

  const updateAppState = useMutation(({ storage }, newState) => {
    const obj = storage.get('whiteboardAppState')
    if (!obj || typeof obj.update !== 'function') {
      storage.set('whiteboardAppState', new LiveObject(newState))
      return
    }
    // Only persist zoom + scroll — not selection/cursor state
    obj.update({
      scrollX: newState.scrollX,
      scrollY: newState.scrollY,
      zoom:    newState.zoom,
    })
  }, [])

  // Debounce writes to Liveblocks (100ms) — avoids hammering on every pointer move
  const debouncedUpdateElements = useDebounce(updateElements, 80)
  const debouncedUpdateAppState = useDebounce(updateAppState, 300)

  // ── Sync remote changes into Excalidraw ───────────────────
  useEffect(() => {
    if (!excalidrawAPI || !storedElements) return

    // Skip the very first render (we already passed initialData)
    if (!isInitialized.current) {
      isInitialized.current = true
      return
    }

    isRemoteUpdate.current = true
    excalidrawAPI.updateScene({ elements: storedElements })
    isRemoteUpdate.current = false
  }, [excalidrawAPI, storedElements])

  // ── Live cursor presence tracking ─────────────────────────────────────
  useEffect(() => {
    const el = boardContainerRef.current
    if (!el) return
    const handlePointerMove = (e) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      updateMyPresence({ cursor: { x, y, isPresent: true } })
    }
    const handlePointerLeave = () => {
      updateMyPresence({ cursor: null })
    }
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerleave', handlePointerLeave)
    return () => {
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [updateMyPresence])


  const self = useSelf()

  // ── onChange: local drawing → Liveblocks ─────────────────
  const onChange = useCallback(
    (newElements, appState) => {
      if (isRemoteUpdate.current) return
      debouncedUpdateElements(newElements)
      debouncedUpdateAppState(appState)
    },
    [debouncedUpdateElements, debouncedUpdateAppState]
  )

  // ── Copy board link ───────────────────────────────────────
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={boardContainerRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', background: '#F8FAFC' }}>

      {/* ── Glassmorphism top bar ───────────────────────────── */}
      <div style={{
        position: 'absolute', top: 12, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '8px 16px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)',
        maxWidth: 'calc(100vw - 40px)',
        flexWrap: 'nowrap',
      }}>
        {/* Logo mark */}
        <div style={{
          width: 28, height: 28, borderRadius: '8px',
          background: 'linear-gradient(135deg, #6D28D9, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" opacity="0.9"/>
          </svg>
        </div>

        {/* Board name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <StatusDot />
          <span style={{
            fontSize: '13px', fontWeight: 700, color: '#1E293B',
            fontFamily: 'var(--font-display, system-ui)',
            maxWidth: '220px', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {boardName || 'Collaborative Board'}
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Presence avatars */}
<LiveCursors />

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Copy link */}
        <button
          onClick={copyLink}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 11px', borderRadius: '10px', border: 'none',
            background: copied ? '#ECFDF5' : '#F1F5F9',
            color:  copied ? '#059669' : '#475569',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.2s', flexShrink: 0,
            fontFamily: 'var(--font-display, system-ui)',
          }}
        >
          {copied ? (
            <> ✓ Copied!</>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Share
            </>
          )}
        </button>

        {/* Close / back */}
        <button
          onClick={() => navigate(-1)}
          title="Close board"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: '8px', border: 'none',
            background: '#F1F5F9', color: '#64748B',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#EF4444' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#64748B' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* ── Excalidraw canvas — fills the entire viewport ──── */}
      <Suspense fallback={
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', color: '#64748B', fontFamily: 'system-ui' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #E2E8F0', borderTopColor: '#6D28D9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading board…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      }>
        <ExcalidrawLazy
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={{
            elements: storedElements || [],
            appState: {
              scrollX: storedAppState?.scrollX ?? 0,
              scrollY: storedAppState?.scrollY ?? 0,
              zoom:    storedAppState?.zoom    ?? { value: 1 },
              viewBackgroundColor: '#F8FAFC',
              zenModeEnabled: false,
              viewModeEnabled: self?.presence?.role !== 'presenter',
            },
            scrollToContent: true,
          }}
          onChange={onChange}
          viewModeEnabled={self?.presence?.role !== 'presenter'}
          theme={isDark ? "dark" : "light"}
          UIOptions={{
            canvasActions: {
              loadScene:  false,
              export:     { saveFileToDisk: true },
              toggleTheme: true,
            },
          }}
        />
      </Suspense>
    </div>
  )
}

// ─── Room wrapper — provides Liveblocks context ────────────────
const BoardRoom = ({ roomId, boardName, user }) => (
  <RoomProvider
    id={roomId}
    initialPresence={{
      cursor: null,
      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guest',
      role: 'presenter',
    }}
    initialStorage={{
      whiteboardData:     new LiveList([]),
      whiteboardAppState: new LiveObject({}),
      // These are here to satisfy the shared schema from CollaborationProvider
      syncMode:      false,
      presenterId:   null,
      presenterSlide: 1,
      messages:      new LiveList([]),
      annotations:   new LiveList([]),
      quizState:     'idle',
      quizQuestions: new LiveList([]),
      quizCurrentIdx: 0,
      quizScores:    new LiveObject({}),
    }}
  >
    <BoardInner roomId={roomId} boardName={boardName} user={user} />
  </RoomProvider>
)

// ─── Public entry — auth gate + param extraction ───────────────
export default function BoardPage() {
  const { roomId }      = useParams()
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()

  const [user, setUser]   = useState(null)
  const [ready, setReady] = useState(false)

  // Board display name from ?name= query param
  const boardName = searchParams.get('name')
    ? decodeURIComponent(searchParams.get('name'))
    : roomId?.replace('luter-material-', '').replace('luter-session-', '') || 'Board'

  // Auth gate
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
        return
      }
      setUser(data.user)
      setReady(true)
    })
  }, [navigate])

  if (!ready) {
    return (
      <div style={{
        width: '100vw', height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#F8FAFC', flexDirection: 'column', gap: '12px',
      }}>
        <div style={{
          width: 36, height: 36, border: '3px solid #E2E8F0',
          borderTopColor: '#6D28D9', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!roomId) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', fontFamily: 'system-ui' }}>
        <p>No board room specified.</p>
      </div>
    )
  }

  return <BoardRoom roomId={roomId} boardName={boardName} user={user} />
}
