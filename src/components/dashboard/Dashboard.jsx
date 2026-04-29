import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import DashboardSidebar from './DashboardSidebar'
import { RiLoader4Line as Loader2, RiSwordFill as Sword, RiCloseLine as X, RiArrowRightLine as ArrowRight } from 'react-icons/ri'
import { motion, AnimatePresence } from 'framer-motion'
import LuterLogo from '../shared/LuterLogo'
import './dashboard.css'
import { DashboardPrefetchProvider } from '../../context/DashboardPrefetchContext'
import NotificationsOverlay from './NotificationsOverlay'
import FloatingDock from './FloatingDock'
import { useUniversalWorkspaceStore } from '../../store/useUniversalWorkspaceStore'

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

          try {
            // Fetch profile to get the most up-to-date name and role type
            const { data: p } = await supabase
              .from('profiles')
              .select('full_name, is_university_user, role')
              .eq('id', session.user.id)
              .maybeSingle()
            if (p) setProfile(p)
          } catch (error) {
            console.warn('Profile fetch failed:', error.message)
          }

          try {
            // Initialize workspaces to ensure backpack shows all courses
            await initializeWorkspaces()
          } catch (error) {
            console.warn('Workspace initialization failed:', error.message)
          }

          const updateHeartbeat = async () => {
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

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    )
  }

  return (
    <DashboardPrefetchProvider userId={user.id}>
    <div className={`dash-root ${isMobile ? 'dash-root--mobile' : ''}`}>
      {isMobile && (
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
          </div>

          <div
            className="mobile-user-avatar"
            onClick={() => navigate('/dashboard/settings')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px var(--primary-glow)',
            }}
          >
            {profile?.full_name?.slice(0, 1).toUpperCase() || user?.user_metadata?.full_name?.slice(0, 1).toUpperCase() || 'S'}
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

      <div className={`dsb-container ${isMobile && mobileSidebarOpen ? 'dsb-container--open' : ''}`}>
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          user={user}
          isMobile={isMobile}
          onClose={() => setMobileSidebarOpen(false)}
          onNavigate={() => {
            if (isMobile) setMobileSidebarOpen(false)
          }}
          onNotificationsClick={() => setNotificationsOpen(true)}
        />
      </div>

      <main
        className={`dash-main ${sidebarCollapsed ? 'collapsed' : ''} ${isMobile ? 'dash-main--mobile' : ''}`}
        style={{
          paddingTop: isMobile ? 64 : 0,
          paddingBottom: 0,
        }}
      >
        <Outlet context={{ user, isMobile, sidebarCollapsed, setSidebarCollapsed, profile }} />
      </main>

      <FloatingDock user={user} isMobile={isMobile} />

      <NotificationsOverlay isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </div>
    </DashboardPrefetchProvider>
  )
}
