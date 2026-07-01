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
import './dashboard.css'
import { DashboardPrefetchProvider } from '../../context/DashboardPrefetchContext'
import NotificationsOverlay from './NotificationsOverlay'
import { useUniversalWorkspaceStore } from '../../store/useUniversalWorkspaceStore'
import { LANDING_URL } from '../../utils/urlUtils'
import StreakWidget from './StreakWidget'



function DashboardMobileBottomNav({ pathname, navigate, onMore }) {
  const isActive = (target) => {
    if (target === '/home') return pathname === '/home' || pathname === '/'
    if (target === '/backpack') return pathname.startsWith('/backpack')
    if (target === '/notes') return pathname.startsWith('/notes')
    return pathname === target || pathname.startsWith(`${target}/`)
  }

  const items = [
    { label: 'Home', path: '/home', icon: House },
    { label: 'Folders', path: '/backpack', icon: Backpack },
    { label: 'Notes', path: '/notes', icon: NotePencil },
    { label: 'Decks', path: '/decks', icon: Cards },
  ]

  return (
    <nav className="dash-mobile-bottom-nav" aria-label="Dashboard quick navigation">
      {/* eslint-disable-next-line no-unused-vars */}
      {items.map(({ label, path, icon: Icon }) => {
        const active = isActive(path)
        return (
          <button
            key={path}
            type="button"
            className={`dash-mobile-bottom-item${active ? ' active' : ''}`}
            onClick={() => navigate(path)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={22} weight={active ? 'fill' : 'regular'} />
            <span>{label}</span>
          </button>
        )
      })}
      <button
        type="button"
        className="dash-mobile-bottom-item dash-mobile-bottom-more"
        onClick={onMore}
      >
        <DotsThree size={26} weight="bold" />
        <span>More</span>
      </button>
    </nav>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()

  const { initializeWorkspaces } = useUniversalWorkspaceStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)



  const location = useLocation()
  
  // Set initial sidebar state based on page
  useEffect(() => {
    const openPages = ['/home', '/']
    if (openPages.includes(location.pathname)) {
      setSidebarCollapsed(false)
    } else {
      setSidebarCollapsed(true)
    }
  }, [location.pathname])

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
                .select('full_name, is_university_user, role, subscription_tier, subscription_type, subscription_expires_at, is_premium')
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
                      .select('full_name, is_university_user, role, subscription_tier, subscription_type, subscription_expires_at, is_premium')
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
      const mobile = window.innerWidth <= 1024
      setIsMobile(mobile)
      if (!mobile) setMobileSidebarOpen(false)
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
              background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, var(--primary), var(--primary-light))',
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
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              profile?.full_name?.slice(0, 1).toUpperCase() || user?.user_metadata?.full_name?.slice(0, 1).toUpperCase() || 'S'
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {isMobile && mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mobile-sidebar-overlay"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

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
                onNotificationsClick={() => setNotificationsOpen(true)}
                hideToggle={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Structural Sidebar (Pushing or Hidden) */}
        <div 
          className={`dsb-container 
            ${isMobile && mobileSidebarOpen ? 'dsb-container--open' : ''} 
            ${sidebarCollapsed 
              ? (isFocusPage ? 'dsb-container--ws-hidden' : 'dsb-container--collapsed')
              : (isFocusPage ? 'dsb-container--ws-expanded' : 'dsb-container--expanded')}
          `}
        >
          {(mobileSidebarOpen || !sidebarCollapsed) && (
            <DashboardSidebar 
              user={user}
              isMobile={isMobile}
              onClose={() => {
                if (isMobile) {
                  setMobileSidebarOpen(false)
                } else {
                  setSidebarCollapsed(true)
                }
              }}
              onNavigate={() => {
                if (isMobile) setMobileSidebarOpen(false)
              }}
              onNotificationsClick={() => setNotificationsOpen(true)}
              hideToggle={isWorkstation}
            />
          )}
        </div>



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
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Outlet context={{ user, isMobile, sidebarCollapsed, setSidebarCollapsed, profile, mobileSidebarOpen, setMobileSidebarOpen, setNotificationsOpen }} />
            </motion.div>
          </AnimatePresence>
        </main>

        {isMobile && !isWorkstation && (
          <DashboardMobileBottomNav
            pathname={location.pathname}
            navigate={navigate}
            onMore={() => setMobileSidebarOpen(true)}
          />
        )}
  
        <NotificationsOverlay isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </div>
    </DashboardPrefetchProvider>
  )
}
