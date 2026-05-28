import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import DashboardSidebar from './DashboardSidebar'
import { RiLoader4Line as Loader2, RiSwordFill as Sword, RiCloseLine as X, RiArrowRightLine as ArrowRight } from 'react-icons/ri'
import { SidebarSimple } from '@phosphor-icons/react'
import { LuterPageLoader } from '../shared/LuterPageLoader'
import { motion, AnimatePresence } from 'framer-motion'
import LuterLogo from '../shared/LuterLogo'
import './dashboard.css'
import { DashboardPrefetchProvider } from '../../context/DashboardPrefetchContext'
import NotificationsOverlay from './NotificationsOverlay'
import FloatingDock from './FloatingDock'
import { useUniversalWorkspaceStore } from '../../store/useUniversalWorkspaceStore'
import { preloadingService } from '../../services/preloadingService'
import { LANDING_URL } from '../../utils/urlUtils'

import { LuterTourGuide } from '../shared/tour/LuterTourGuide'
import { useTourStore } from '../../store/useTourStore'

export default function Dashboard() {
  const navigate = useNavigate()
  const { isTourActive, currentTourId, startTour, hasCompletedTour, setUserId, completedTours, currentUserId, isLoadingTours } = useTourStore()
  const { initializeWorkspaces } = useUniversalWorkspaceStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Trigger tour for new users on dashboard home
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id)
    }
  }, [user?.id, setUserId])

  useEffect(() => {
    if (!loading && !isLoadingTours && user && currentUserId === user.id && window.location.pathname === '/dashboard') {
      if (!hasCompletedTour('dashboard-home')) {
        const timer = setTimeout(() => startTour('dashboard-home'), 2000)
        return () => clearTimeout(timer)
      }
      
      // Trigger nav tour after home tour is done
      if (hasCompletedTour('dashboard-home') && !hasCompletedTour('dashboard-nav')) {
        const timer = setTimeout(() => startTour('dashboard-nav'), 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [loading, isLoadingTours, user, currentUserId, completedTours, window.location.pathname, hasCompletedTour, startTour])

  // Force sidebar open during nav tour
  useEffect(() => {
    if (isTourActive && currentTourId === 'dashboard-nav') {
      setSidebarCollapsed(false)
      if (isMobile) setMobileSidebarOpen(true)
    }
  }, [isTourActive, currentTourId, isMobile])

  const location = useLocation()
  
  // Set initial sidebar state based on page
  useEffect(() => {
    const openPages = ['/dashboard', '/dashboard/']
    if (openPages.includes(location.pathname)) {
      setSidebarCollapsed(false)
    } else {
      setSidebarCollapsed(true)
    }
  }, [location.pathname])

  useEffect(() => {
    let hb
    let channel

    const fetchUser = async () => {
      try {
        // Give Supabase a moment to recover session from storage
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        const handleSession = async (session) => {
          if (session?.user) {
            setUser(session.user)
            setUserId(session.user.id)
            // Pre-load tours even before profile is fetched to set currentUserId
            useTourStore.getState().loadCompletedTours(session.user.id)
            
            const profileCacheKey = `luter:profile:${session.user.id}`
            const offline = typeof navigator !== 'undefined' && !navigator.onLine

            if (offline) {
              try {
                const raw = localStorage.getItem(profileCacheKey)
                if (raw) setProfile(JSON.parse(raw))
              } catch {}
            }

            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('full_name, is_university_user, role, subscription_tier, subscription_type, subscription_expires_at, is_premium, completed_tours')
                .eq('id', session.user.id)
                .maybeSingle()
              
              if (error) throw error
              
              if (data) {
                setProfile(data)
                try { localStorage.setItem(profileCacheKey, JSON.stringify(data)) } catch {}
                
                // Sync tour state immediately if data is present
                useTourStore.getState().loadCompletedTours(session.user.id)
              }
            } catch (error) {
              console.warn('Profile fetch failed:', error.message)
              if (error.status === 401 || error.code === '401') {
                console.log('🔄 Session appears stale (401), attempting refresh...')
                const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
                if (!refreshError && refreshedSession) {
                  // Retry profile fetch once
                  const { data: retryP } = await supabase
                    .from('profiles')
                    .select('full_name, is_university_user, role, subscription_tier, subscription_type, subscription_expires_at, is_premium, completed_tours')
                    .eq('id', refreshedSession.user.id)
                    .maybeSingle()
                  if (retryP) setProfile(retryP)
                }
              }
            }

            try {
              await initializeWorkspaces()
            } catch {}

            const updateHeartbeat = async () => {
              if (typeof navigator !== 'undefined' && !navigator.onLine) return
              try {
                await supabase.from('profiles')
                  .update({ last_active_at: new Date().toISOString() })
                  .eq('id', session.user.id)
              } catch {}
            }
            updateHeartbeat()
            hb = setInterval(updateHeartbeat, 30000)
            setLoading(false)
          } else {
            // Wait a bit longer before redirecting - Supabase might still be initializing
            setTimeout(async () => {
              const { data: { session: finalCheck } } = await supabase.auth.getSession()
              if (!finalCheck) {
                console.log('❌ No session found after wait, redirecting to signin')
                const currentPath = window.location.pathname + window.location.search
                window.location.href = `${LANDING_URL}/signin?redirect=${encodeURIComponent(currentPath)}`
              } else {
                handleSession(finalCheck)
              }
            }, 1500)
          }
        }

        if (initialSession) {
          await handleSession(initialSession)
        } else {
          // Listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          setTimeout(() => {
            if (loading && !user) {
              const currentPath = window.location.pathname + window.location.search
              window.location.href = `${LANDING_URL}/signin?redirect=${encodeURIComponent(currentPath)}`
            }
          }, 4000)
        }
      } catch (error) {
        console.warn('Dashboard session bootstrap failed:', error.message)
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
        navigate('/dashboard/mock-exam', { state: { preselectedCourse: e.detail.course || null } })
      }
    }
    window.addEventListener('DEEP_LINK_DASH', handleDeepLink)

    return () => {
      if (hb) clearInterval(hb)
      if (channel) supabase.removeChannel(channel)
      window.removeEventListener('DEEP_LINK_DASH', handleDeepLink)
      window.removeEventListener('resize', handleResize)
    }
  }, [navigate])


  const isWorkstation = location.pathname.includes('/workstation')
  const isFocusPage = isWorkstation || location.pathname.includes('/mock-exam') || location.pathname.includes('/profile') || location.pathname.includes('/trash') || location.pathname.includes('/analytics')
  const isPlayground = location.pathname.includes('/playground')
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
    const currentPath = window.location.pathname + window.location.search
    window.location.href = `${LANDING_URL}/signin?redirect=${encodeURIComponent(currentPath)}`
    return null
  }

  return (
    <DashboardPrefetchProvider userId={user?.id}>
    <LuterTourGuide />
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

          <div
            className="mobile-user-avatar"
            onClick={() => navigate('/dashboard/profile')}
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

      {!isMobile && sidebarCollapsed && (
        <div 
          className="ws-sidebar-trigger" 
          onMouseEnter={() => setSidebarHovered(true)}
          style={{
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            width: '10px',
            zIndex: 9998,
          }}
        />
      )}
        <AnimatePresence>
          {sidebarHovered && sidebarCollapsed && !isMobile && (
            <motion.div
              initial={{ x: -280, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -280, opacity: 0, scale: 0.9 }}
              transition={{ 
                type: "spring", 
                stiffness: 450, 
                damping: 35 
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

        {/* Floating sidebar toggle when closed on desktop */}
        {!isMobile && sidebarCollapsed && !isWorkstation && !location.pathname.includes('/pricing') && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="dsb-floating-toggle"
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              zIndex: 10002,
              background: 'white',
              border: '1px solid var(--border)',
              padding: '10px',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              color: 'var(--text)'
            }}
            title="Open sidebar"
          >
            <SidebarSimple size={24} weight="bold" />
          </button>
        )}

        <main
          className={`dash-main 
            ${sidebarCollapsed ? 'collapsed' : ''} 
            ${isMobile ? 'dash-main--mobile' : ''} 
            ${isFocusPage ? 'ws-mode' : ''}
          `}
          style={{
            paddingTop: isMobile && !isWorkstation ? 64 : 0,
            paddingBottom: 0,
          }}
        >
          <Outlet context={{ user, isMobile, sidebarCollapsed, setSidebarCollapsed, profile, mobileSidebarOpen, setMobileSidebarOpen }} />
        </main>
  
        {!(isWorkstation && isMobile) && <FloatingDock user={user} isMobile={isMobile} />}
  
        <NotificationsOverlay isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      </div>
    </DashboardPrefetchProvider>
  )
}
