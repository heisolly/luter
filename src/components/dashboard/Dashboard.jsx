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

export default function Dashboard() {
  const navigate = useNavigate()
  const { initializeWorkspaces } = useUniversalWorkspaceStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  useEffect(() => {
    let hb
    let channel

    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)

          const profileCacheKey = `luter:profile:${session.user.id}`
          const offline = typeof navigator !== 'undefined' && !navigator.onLine

          // Load from cache when offline
          if (offline) {
            try {
              const raw = localStorage.getItem(profileCacheKey)
              if (raw) setProfile(JSON.parse(raw))
            } catch {}
          }

          try {
            // Fetch profile to get the most up-to-date name, role type, and subscription
            const { data: p } = await supabase
              .from('profiles')
              .select('full_name, is_university_user, role, subscription_tier, subscription_type, subscription_expires_at')
              .eq('id', session.user.id)
              .maybeSingle()
            if (p) {
              setProfile(p)
              try { localStorage.setItem(profileCacheKey, JSON.stringify(p)) } catch {}
            }
          } catch (error) {
            console.warn('Profile fetch failed:', error.message)
            // Fallback to cache on error
            try {
              const raw = localStorage.getItem(profileCacheKey)
              if (raw) setProfile(JSON.parse(raw))
            } catch {}
          }

          try {
            // Initialize workspaces to ensure backpack shows all courses
            await initializeWorkspaces()
            
            // Start preloading all user data in background
            preloadingService.preloadUserData(session.user.id).catch(err => {
              console.warn('Background preload failed:', err.message)
            })
          } catch (error) {
            console.warn('Workspace initialization failed:', error.message)
          }

          const updateHeartbeat = async () => {
            if (typeof navigator !== 'undefined' && !navigator.onLine) return
            try {
              await supabase.from('profiles')
                .update({ last_active_at: new Date().toISOString() })
                .eq('id', session.user.id)
            } catch (error) {
              console.warn('Heartbeat update failed:', error.message)
            }
          }
          updateHeartbeat()
          hb = setInterval(updateHeartbeat, 30000)
        } else {
          const currentPath = window.location.pathname + window.location.search
          navigate(`/signin?redirect=${encodeURIComponent(currentPath)}`)
        }
      } catch (error) {
        console.warn('Dashboard session bootstrap failed:', error.message)
      }
      setLoading(false)
    }

    const handleResize = () => {
      const mobile = window.innerWidth <= 768
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

  const location = useLocation()
  const isWorkstation = location.pathname.includes('/workstation')
  const [wsSidebarHovered, setWsSidebarHovered] = useState(false)

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

  return (
    <DashboardPrefetchProvider userId={user.id}>
    <div className={`dash-root ${isMobile ? 'dash-root--mobile' : ''} ${isWorkstation ? 'ws-mode' : ''}`}>
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

      {isWorkstation && !isMobile && (
        <div 
          className="ws-sidebar-trigger" 
          onMouseEnter={() => setWsSidebarHovered(true)}
          style={{
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            width: '4px',
            zIndex: 9998,
          }}
        />
      )}

      {(!isMobile && !isWorkstation && sidebarCollapsed) ? null : (
        <motion.div 
          className={`dsb-container ${isMobile && mobileSidebarOpen ? 'dsb-container--open' : ''}`}
          initial={
            isWorkstation && !isMobile
              ? { x: '-110%', opacity: 0 }
              : isMobile
                ? { x: '-100%' }
                : { x: '-110%', opacity: 0 }
          }
          animate={
            isWorkstation && !isMobile
              ? { x: (wsSidebarHovered || !sidebarCollapsed) ? 0 : '-110%', opacity: (wsSidebarHovered || !sidebarCollapsed) ? 1 : 0 }
              : isMobile
                ? { x: mobileSidebarOpen ? 0 : '-100%' }
                : { x: 0, opacity: 1 }
          }
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          onMouseEnter={() => {
            if (isWorkstation && !isMobile) setWsSidebarHovered(true)
          }}
          onMouseLeave={() => {
            if (isWorkstation && !isMobile) setWsSidebarHovered(false)
          }}
          style={isWorkstation && !isMobile ? (sidebarCollapsed ? {
            position: 'fixed',
            top: '12px',
            left: '12px',
            bottom: '12px',
            zIndex: 150,
            width: 'var(--dsb-w)',
            borderRadius: '18px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            background: 'white',
            borderRight: '1px solid #eef2f7',
            overflow: 'hidden'
          } : {
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 150,
            width: 'var(--dsb-w)',
            background: 'white',
            borderRight: '1px solid #eef2f7',
            overflow: 'hidden'
          }) : undefined}
        >
        <DashboardSidebar
          collapsed={isWorkstation ? false : sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
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
            if (isWorkstation) setWsSidebarHovered(false)
          }}
          onNotificationsClick={() => setNotificationsOpen(true)}
        />
        </motion.div>
      )}

      {/* Floating sidebar toggle when closed on desktop */}
      {!isMobile && !isWorkstation && sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 100,
            background: 'transparent',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            color: '#111'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#7a12cc'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#111'
          }}
          title="Open sidebar"
        >
          <SidebarSimple size={24} weight="bold" mirrored={true} />
        </button>
      )}

      <main
        className={`dash-main ${sidebarCollapsed ? 'collapsed' : ''} ${isMobile ? 'dash-main--mobile' : ''} ${isWorkstation ? 'ws-mode' : ''}`}
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
