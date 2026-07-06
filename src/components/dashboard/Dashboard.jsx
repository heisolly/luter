import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import DashboardSidebar from './DashboardSidebar'
import { Loader2, Sword, X, ArrowRight, Sidebar as SidebarSimple } from 'lucide-react'
import { Backpack, DotsThree, House, NotePencil, Cards } from '@phosphor-icons/react'
import { LuterPageLoader } from '../shared/LuterPageLoader'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import LuterLogo from '../shared/LuterLogo'
import UserAvatar from '../shared/UserAvatar'
import './dashboard.css'
import { DashboardPrefetchProvider } from '../../context/DashboardPrefetchContext'
import NotificationsOverlay from './NotificationsOverlay'
import { useUniversalWorkspaceStore } from '../../store/useUniversalWorkspaceStore'
import { LANDING_URL } from '../../utils/urlUtils'
import StreakWidget from './StreakWidget'
import NotificationListener from '../NotificationListener'
import MobileMoreMenu from './MobileMoreMenu'
import { useTheme } from '../../contexts/ThemeContext'
import { useNetwork } from '../../hooks/useNetwork'
import { useTaskManager } from '../../hooks/useTaskManager.jsx' // Forced extension for HMR

function DashboardMobileBottomNav({ pathname, navigate, onMore, isDark }) {
  const isActive = (target) => {
    if (target === '/home') return pathname === '/home' || pathname === '/'
    if (target === '/backpack') return pathname.startsWith('/backpack')
    if (target === '/notes') return pathname.startsWith('/notes')
    if (target === '/decks') return pathname.startsWith('/decks')
    return pathname === target || pathname.startsWith(`${target}/`)
  }

  const items = [
    { label: 'Home', path: '/home', icon: House },
    { label: 'Decks', path: '/decks', icon: Cards },
    { label: 'Notes', path: '/notes', icon: NotePencil },
    { label: 'Backpack', path: '/backpack', icon: Backpack },
  ]

  const bg = isDark ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const activeBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const activeColor = isDark ? '#98FF98' : '#111827';
  const inactiveColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
      left: 16,
      right: 16,
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <nav 
        aria-label="Dashboard quick navigation"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: bg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: `1px solid ${border}`,
          borderRadius: 999,
          padding: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          pointerEvents: 'auto',
          maxWidth: 400,
          width: '100%',
          justifyContent: 'space-between'
        }}
      >
        {items.map(({ label, path, icon: Icon }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: active ? '10px 16px' : '10px',
                border: 'none',
                background: 'transparent',
                borderRadius: 999,
                cursor: 'pointer',
                color: active ? activeColor : inactiveColor,
                transition: 'color 0.2s',
                outline: 'none',
                flex: active ? 2 : 1,
              }}
            >
              {active && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: activeBg,
                    borderRadius: 999,
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon size={24} weight={active ? 'fill' : 'regular'} />
              <AnimatePresence>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
        <button
          onClick={onMore}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: inactiveColor,
            flex: 1,
            outline: 'none',
          }}
        >
          <DotsThree size={28} weight="bold" />
        </button>
      </nav>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { initializeWorkspaces } = useUniversalWorkspaceStore()
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Check if this is a brand new user who just signed up
    const isNewUser = localStorage.getItem('luter_is_new_user')
    if (isNewUser) {
      // Remove the flag so it only stays open on their very first visit
      setTimeout(() => localStorage.removeItem('luter_is_new_user'), 2000)
      return false // Keep it open for them
    }
    
    // Closed by default for everyone else
    return true;
  })
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)
  const isOnline = useNetwork()
  useTaskManager(user?.id)
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  
  // Unified Notifications Global State
  const [unreadCount, setUnreadCount] = useState(0)

  const location = useLocation()
  
  const { isDark } = useTheme()
  
  // Note: sidebar collapsed state is user-controlled; however, for deep focus pages 
  // (like workstation), we want to automatically collapse it.
  useEffect(() => {
    const isFocus = location.pathname.includes('/workstation') || 
                    location.pathname.includes('/notes/editor') || 
                    location.pathname.includes('/ai-chat') || 
                    location.pathname.includes('/mock-exam');
    
    if (isFocus && !isMobile) {
      setSidebarCollapsed(true);
    }
  }, [location.pathname, isMobile]);

  // Handle join query parameter for study sessions
  useEffect(() => {
    if (loading || !user?.id) return

    const params = new URLSearchParams(window.location.search)
    const joinCode = params.get('join')
    
    if (joinCode) {
      const handleJoin = async () => {
        try {
          console.log('[Dashboard] Auto-joining shared session with code:', joinCode)
          const { useSessionStore } = await import('../../store/useSessionStore')
          const result = await useSessionStore.getState().joinSharedSession(joinCode)
          
          if (result.success && result.session) {
            console.log('[Dashboard] Joined session successfully:', result.session.id)
            const materialId = params.get('materialId')
            
            // Navigate to the appropriate workspace page
            if (materialId) {
              navigate(`/workstation/${materialId}?sessionId=${result.session.id}`)
            } else {
              navigate(`/session/${result.session.id}`)
            }
          } else {
            alert(result.error || 'Failed to join shared session')
          }
        } catch (err) {
          console.error('[Dashboard] Error auto-joining session:', err)
        } finally {
          // Remove the join parameters from URL bar to prevent re-join loop on reload
          const url = new URL(window.location.href)
          url.searchParams.delete('join')
          url.searchParams.delete('materialId')
          window.history.replaceState({}, document.title, url.pathname + url.search)
        }
      }
      handleJoin()
    }
  }, [user?.id, loading, navigate])

  useEffect(() => {
    let hb
    let channel

    const fetchUser = async () => {
      try {
        console.log('🔄 Dashboard fetchUser started, URL:', window.location.href)
        // Give Supabase a moment to recover session from storage
        const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession()
        console.log('🔄 Dashboard initialSession:', initialSession ? 'EXISTS' : 'NULL', 'Error:', initialSessionError?.message)
        
        const handleSession = async (session) => {
          console.log('🔄 Dashboard handleSession called with session:', session ? 'EXISTS' : 'NULL')
          if (session?.user) {
            setUser(session.user)
            
            const profileCacheKey = `luter:profile:${session.user.id}`

            // Fast boot: load cache first regardless of network status
            try {
              const raw = localStorage.getItem(profileCacheKey)
              if (raw) setProfile(JSON.parse(raw))
            } catch { /* ignore cache parse errors */ }

            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('full_name, is_university_user, role, subscription_tier, subscription_type, subscription_expires_at, is_premium, avatar_url')
                .eq('id', session.user.id)
                .maybeSingle()
              
              if (error) throw error
              
              if (data) {
                setProfile(data)
                try { localStorage.setItem(profileCacheKey, JSON.stringify(data)) } catch { /* ignore cache write errors */ }
              }
            } catch (error) {
              console.warn('Profile fetch failed:', error.message)
              const isUnauthorized = 
                error.status === 401 || 
                error.status === '401' || 
                error.code === '401' || 
                (error.message && error.message.includes('JWT expired')) ||
                (error.message && error.message.includes('invalid jwt'))
                
              if (isUnauthorized) {
                console.log('🔄 Session appears stale (401), attempting refresh...')
                try {
                  const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
                  if (!refreshError && refreshedSession) {
                    const { data: retryP } = await supabase
                      .from('profiles')
                      .select('full_name, is_university_user, role, subscription_tier, subscription_type, subscription_expires_at, is_premium, avatar_url')
                      .eq('id', refreshedSession.user.id)
                      .maybeSingle()
                    if (retryP) setProfile(retryP)
                  } else {
                    throw refreshError || new Error('No session returned after refresh')
                  }
                } catch (refreshErr) {
                  console.error('❌ Token refresh failed, logging out...', refreshErr.message)
                  try {
                    await supabase.auth.signOut()
                  } catch (e) {
                    console.warn('SignOut failed:', e.message)
                  }
                  try { localStorage.removeItem(profileCacheKey) } catch {}
                  
                  const url = new URL(window.location.href)
                  url.searchParams.delete('code')
                  url.searchParams.delete('error')
                  const cleanPath = url.pathname + url.search
                  window.location.href = `${LANDING_URL}/signin?redirect=${encodeURIComponent(cleanPath)}`
                  return;
                }
              }
            }

            try {
              await initializeWorkspaces()
            } catch { /* ignore workspace init errors */ }

            const updateHeartbeat = async () => {
              if (typeof navigator !== 'undefined' && !navigator.onLine) return
              try {
                await supabase.from('profiles')
                  .update({ last_active_at: new Date().toISOString() })
                  .eq('id', session.user.id)
              } catch { /* ignore heartbeat update errors */ }
            }
            updateHeartbeat()
            hb = setInterval(updateHeartbeat, 30000)
            
            // Clean up auth tokens from URL for a cleaner address bar
            const url = new URL(window.location.href)
            if (url.searchParams.has('code') || url.searchParams.has('error')) {
              url.searchParams.delete('code')
              url.searchParams.delete('error')
              url.searchParams.delete('error_code')
              url.searchParams.delete('error_description')
              window.history.replaceState({}, document.title, url.pathname + url.search)
            }
            
            setLoading(false)
          } else {
            setTimeout(async () => {
              const { data: { session: finalCheck } } = await supabase.auth.getSession()
              console.log('🔄 Dashboard finalCheck inside handleSession(null):', finalCheck ? 'EXISTS' : 'NULL')
              if (!finalCheck) {
                console.log('❌ No session found after wait, redirecting to signin')
                const url = new URL(window.location.href)
                url.searchParams.delete('code')
                url.searchParams.delete('error')
                url.searchParams.delete('error_code')
                url.searchParams.delete('error_description')
                const cleanPath = url.pathname + url.search
                window.location.href = `${LANDING_URL}/signin?redirect=${encodeURIComponent(cleanPath)}`
              } else {
                handleSession(finalCheck)
              }
            }, 1500)
          }
        }

        if (initialSession) {
          await handleSession(initialSession)
        } else {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('🔄 Dashboard onAuthStateChange event:', event, 'session:', session ? 'EXISTS' : 'NULL')
            if (session) {
              await handleSession(session)
              subscription.unsubscribe()
            } else if (event === 'INITIAL_SESSION' && !session) {
              // Wait for the timeout in handleSession(null)
              await handleSession(null)
              subscription.unsubscribe()
            }
          })
          
          // Absolute safety timeout - redirect if no user
          setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession()
            console.log('🔄 Dashboard 4000ms safety timeout check, session:', session ? 'EXISTS' : 'NULL')
            if (!session) {
              console.log('❌ 4000ms safety timeout redirecting to signin')
              const url = new URL(window.location.href)
              url.searchParams.delete('code')
              url.searchParams.delete('error')
              const cleanPath = url.pathname + url.search
              window.location.href = `${LANDING_URL}/signin?redirect=${encodeURIComponent(cleanPath)}`
            }
          }, 4000)
        }
      } catch (error) {
        console.error('❌ Dashboard session bootstrap failed:', error.message, error)
        const url = new URL(window.location.href)
        if (url.searchParams.has('code') || url.searchParams.has('error')) {
          url.searchParams.delete('code')
          url.searchParams.delete('error')
          url.searchParams.delete('error_code')
          url.searchParams.delete('error_description')
          window.history.replaceState({}, document.title, url.pathname + url.search)
          try {
            // Retry without the problematic code
            const { data: { session }, error: retryErrorDetail } = await supabase.auth.getSession()
            console.log('🔄 Dashboard retry after error, session:', session ? 'EXISTS' : 'NULL', 'error:', retryErrorDetail?.message)
            if (session?.user) {
              // We successfully recovered by stripping the stale code
              setUser(session.user)
              setLoading(false)
              return
            }
          } catch (retryError) {
            console.warn('Retry also failed:', retryError.message)
          }
        }
        setLoading(false)
      }
    }

    const handleResize = () => {
      const width = window.innerWidth
      const mobile = width <= 1024
      setIsMobile(mobile)
      if (!mobile) setMobileSidebarOpen(false)
      
      // Auto-manage sidebar on resize based on screen breakpoints
      if (width < 1000 && !sidebarCollapsed) {
        setSidebarCollapsed(true)
      }
    }

    window.addEventListener('resize', handleResize)
    fetchUser()

    const handleDeepLink = (e) => {
      if (e.detail?.page === 'mock-exam') {
        navigate('/mock-exam', { state: { preselectedCourse: e.detail.course || null } })
      }
    }
    window.addEventListener('DEEP_LINK_DASH', handleDeepLink)

    return () => {
      console.log('🔄 Dashboard useEffect cleanup called, URL:', window.location.href)
      if (hb) clearInterval(hb)
      if (channel) supabase.removeChannel(channel)
      window.removeEventListener('DEEP_LINK_DASH', handleDeepLink)
      window.removeEventListener('resize', handleResize)
    }
  }, [])


  const isWorkstation = location.pathname.includes('/workstation') || location.pathname.includes('/notes/editor') || location.pathname.includes('/ai-chat')
  const isFocusPage = isWorkstation || location.pathname.includes('/mock-exam') || location.pathname.includes('/profile') || location.pathname.includes('/trash') || location.pathname.includes('/analytics')
  // Classroom room view has its own sidebar — suppress the hover-peek trigger there
  const isClassroomView = location.pathname.startsWith('/classrooms/c/')
  const [sidebarHovered, setSidebarHovered] = useState(false)

  // Subscription tier display for mobile topbar
  const subscriptionTier = profile?.subscription_tier?.toLowerCase() || 'free'
  const subscriptionType = profile?.subscription_type?.toLowerCase() || 'free'
  const getTierBadge = () => {
    if (subscriptionTier === 'premium' || subscriptionType === 'premium') {
      return { label: 'Executive', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' }
    }
    if (subscriptionTier === 'pro' || subscriptionType === 'pro') {
      return { label: 'Pro', color: '#7a12cc', bg: 'rgba(122, 18, 204, 0.15)' }
    }
    return null
  }
  const tierBadge = getTierBadge()

  if (loading) {
    return <LuterPageLoader message="Resuming your session..." minHeight="100vh" />
  }

  // Redirect if no user after loading
  if (!user) {
    const url = new URL(window.location.href)
    url.searchParams.delete('code')
    url.searchParams.delete('error')
    url.searchParams.delete('error_code')
    url.searchParams.delete('error_description')
    const cleanPath = url.pathname + url.search
    window.location.href = `${LANDING_URL}/signin?redirect=${encodeURIComponent(cleanPath)}`
    return null
  }

  return (
    <DashboardPrefetchProvider userId={user?.id}>
      <NotificationListener userId={user?.id} onUnreadCountChange={setUnreadCount}>
        {!isOnline && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99999,
            backgroundColor: '#f59e0b',
            color: 'white',
            textAlign: 'center',
            padding: '8px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"></path>
            </svg>
            You are offline. Showing cached data.
          </div>
        )}
        <div className={`dash-root ${isMobile ? 'dash-root--mobile' : ''} ${isFocusPage ? 'ws-mode' : ''}`}>
          {isMobile && !isWorkstation && (
        <div
          className="mobile-topbar"
          style={{
            height: 64,
            padding: '0 20px',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        >
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <div className="menu-icon-bars" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="menu-bar" style={{ width: 18, height: 2, background: '#111', borderRadius: 1 }} />
              <div className="menu-bar" style={{ width: 14, height: 2, background: '#111', borderRadius: 1 }} />
              <div className="menu-bar" style={{ width: 18, height: 2, background: '#111', borderRadius: 1 }} />
            </div>
          </button>

          <div className="mobile-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LuterLogo size={22} fontSize={17} />
            {tierBadge && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                background: tierBadge.bg,
                borderRadius: 12,
                fontSize: 10,
                fontWeight: 700,
                color: tierBadge.color,
                border: `1px solid ${tierBadge.color}40`
              }}>
                {tierBadge.label}
              </div>
            )}
          </div>

          <div className="mobile-right-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <StreakWidget userId={user?.id} />
            <div
              className="mobile-user-avatar"
            onClick={() => navigate('/profile')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--primary-glow)',
              overflow: 'hidden'
            }}
          >
            <UserAvatar 
              url={profile?.avatar_url} 
              name={profile?.full_name || 'U'}
              size={56}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      </div>
      )}

      <MobileMoreMenu 
        isOpen={isMobile && mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
        user={user} 
        profile={profile} 
        isDark={isDark} 
      />

      {!isMobile && sidebarCollapsed && !isClassroomView && (
        <div 
          className="ws-sidebar-trigger" 
          onMouseEnter={() => setSidebarHovered(true)}
          style={{
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            width: '20px',
            zIndex: 10002,  // above AI panel (9999) and floating dock (10001)
          }}
        />
      )}
        <AnimatePresence>
          {sidebarHovered && sidebarCollapsed && !isMobile && !isClassroomView && (
            <motion.div
              initial={{ x: -290, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -290, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 32,
                mass: 0.8
              }}
              className="floating-sidebar-dock"
              onMouseLeave={() => setSidebarHovered(false)}
            >
              <DashboardSidebar
                collapsed={false}
                setCollapsed={setSidebarCollapsed}
                user={user}
                isMobile={isMobile}
                onClose={() => setSidebarHovered(false)}
                onNavigate={() => {
                  setSidebarHovered(false)
                }}
                hideToggle={true}
                unreadCount={unreadCount}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Structural Sidebar (Pushing or Hidden) */}
        {!isMobile && (
          <div 
            className={`dsb-container 
              ${sidebarCollapsed 
                ? (isFocusPage ? 'dsb-container--ws-hidden' : 'dsb-container--collapsed')
                : (isFocusPage ? 'dsb-container--ws-expanded' : 'dsb-container--expanded')}
            `}
          >
            {/* Always mounted - visibility controlled via CSS to avoid remount lag on every navigation */}
            <DashboardSidebar 
              user={user}
              isMobile={isMobile}
              collapsed={sidebarCollapsed}
              onClose={() => setSidebarCollapsed(true)}
              onNavigate={() => {}}
              hideToggle={isWorkstation}
              unreadCount={unreadCount}
            />
          </div>
        )}



        <main
          className={`dash-main 
            ${sidebarCollapsed ? 'collapsed' : ''} 
            ${isMobile ? 'dash-main--mobile' : ''} 
            ${isFocusPage ? 'ws-mode' : ''}
          `}
          style={{
            paddingBottom: isMobile && !isWorkstation ? 'calc(92px + env(safe-area-inset-bottom, 0px))' : 0,
          }}
        >
          {/* No AnimatePresence mode='wait' — that blocks every navigation until exit is done */}
          <AnimatePresence>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.08, ease: 'easeOut' }}
              style={{ minHeight: '100%' }}
            >
              <Outlet context={{ user, isMobile, sidebarCollapsed, setSidebarCollapsed, profile, mobileSidebarOpen, setMobileSidebarOpen, setNotificationsOpen, unreadCount }} />
            </motion.div>
          </AnimatePresence>
        </main>

        {isMobile && !isWorkstation && (
          <DashboardMobileBottomNav
            pathname={location.pathname}
            navigate={navigate}
            onMore={() => setMobileSidebarOpen(true)}
            isDark={isDark}
          />
        )}
  
        <NotificationsOverlay isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} userId={user?.id} />
        </div>
      </NotificationListener>
    </DashboardPrefetchProvider>
  )
}
