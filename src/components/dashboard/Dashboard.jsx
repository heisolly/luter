import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import DashboardSidebar from './DashboardSidebar'
import DashboardHome from './DashboardHome'
import CoursesPage from './CoursesPage'
import WorkstationPage from './WorkstationPage'
import MockExamPage from './MockExamPage'
import AnalyticsPage from './AnalyticsPage'
import CourseWorkstation from './CourseWorkstation'
import SettingsPage from './SettingsPage'
import UpgradePage from './UpgradePage'
import StreakPage from './StreakPage'
import ReferPage from './ReferPage'
import CompetePage from './CompetePage'
import { Loader2, Sword, X, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import './dashboard.css'

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [activePage, setActivePage] = useState('home')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCourse, setActiveCourse] = useState(null)
  const [showInviteNotify, setShowInviteNotify] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    let hb;
    let channel;

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // ── Heartbeat ──
        const updateHeartbeat = async () => {
          await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', session.user.id);
        }
        updateHeartbeat();
        hb = setInterval(updateHeartbeat, 30000);

        // ── Realtime Notifications ──
        channel = supabase
          .channel('global_notifications')
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${session.user.id}` 
          }, (payload) => {
            if (payload.new.type === 'match_request') {
              setShowInviteNotify(payload.new)
              setTimeout(() => setShowInviteNotify(null), 12000)
            }
          })
          .subscribe();
      } else {
        // Redirect to signin if no session
        const currentPath = window.location.pathname + window.location.search;
        navigate(`/signin?redirect=${encodeURIComponent(currentPath)}`);
      }
      setLoading(false);
    };

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    fetchUser();

    // ── Global Deep Link Listener ──
    const handleDeepLink = (e) => {
      if (e.detail?.page === 'mock-exam') {
        setActiveCourse(e.detail.course || null);
        setActivePage('mock-exam');
      }
    };
    window.addEventListener('DEEP_LINK_DASH', handleDeepLink);

    // ── Handle Initial Route/Params ──
    const params = new URLSearchParams(window.location.search);
    const mId = params.get('matchId');
    if (mId || window.location.pathname.includes('/compete')) {
      setActivePage('compete');
    }

    return () => {
      if (hb) clearInterval(hb);
      if (channel) supabase.removeChannel(channel);
      window.removeEventListener('DEEP_LINK_DASH', handleDeepLink);
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--primary)" />
      </div>
    );
  }

  const openCourseWorkstation = (course) => {
    setActiveCourse(course)
    setActivePage('course-workstation')
  }

  const renderPage = () => {
    switch (activePage) {
      case 'home': return <DashboardHome setActivePage={setActivePage} user={user} onOpenCourse={openCourseWorkstation} />
      case 'courses': return <CoursesPage user={user} onOpenCourse={openCourseWorkstation} />
      case 'workstation': return <WorkstationPage />
      case 'mock-exam': return <MockExamPage user={user} preselectedCourse={activeCourse} />
      case 'analytics': return <AnalyticsPage user={user} />
      case 'settings':  return <SettingsPage user={user} />
      case 'upgrade':   return <UpgradePage />
      case 'streak':    return <StreakPage user={user} />
      case 'refer':     return <ReferPage user={user} />
      case 'compete':   return <CompetePage user={user} setActivePage={setActivePage} />
      case 'course-workstation': return (
        <CourseWorkstation
          course={activeCourse}
          user={user}
          onBack={() => {
            setActiveCourse(null)
            setActivePage('courses')
          }}
          onNavigate={(page, payloadCourse) => {
            setActiveCourse(payloadCourse || null)
            setActivePage(page)
          }}
        />
      )
      default: return <DashboardHome setActivePage={setActivePage} user={user} onOpenCourse={openCourseWorkstation} />
    }
  }

  return (
    <div className={`dash-root ${isMobile ? 'dash-root--mobile' : ''}`}>
      {/* ── Mobile Top Bar ── */}
      {isMobile && (
        <div className="mobile-topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileSidebarOpen(true)}>
            <div className="menu-icon-bars">
              <div className="menu-bar" />
              <div className="menu-bar" style={{ width: '14px' }} />
              <div className="menu-bar" />
            </div>
          </button>
          
          <div className="mobile-logo-wrap">
            <LuterLogo size={24} fontSize={18} />
          </div>

          <div className="mobile-user-avatar" onClick={() => setActivePage('settings')}>
            {user?.user_metadata?.full_name?.slice(0, 1).toUpperCase() || 'S'}
          </div>
        </div>
      )}

      {/* ── Sidebar Overlay (Mobile) ── */}
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
          activePage={activePage}
          setActivePage={(page) => {
            setActiveCourse(null)
            setActivePage(page)
            if (isMobile) setMobileSidebarOpen(false)
          }}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          user={user}
          isMobile={isMobile}
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>

      <main className={`dash-main ${sidebarCollapsed ? 'collapsed' : ''} ${isMobile ? 'dash-main--mobile' : ''}`}>
        {renderPage()}
      </main>

      {/* ── Global Arena Notification Toast ── */}
      <AnimatePresence>
        {showInviteNotify && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: 30, right: 30, zIndex: 9999,
              width: 320, background: '#111', borderRadius: 24, border: '1.5px solid #7a12cc',
              padding: '20px', color: 'white', boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(122, 18, 204, 0.2)', padding: '4px 10px', borderRadius: 99 }}>
                <Sword size={12} color="#c4b5fd" fill="#c4b5fd" />
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#c4b5fd' }}>Challenge Received</span>
              </div>
              <button onClick={() => setShowInviteNotify(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            
            <h3 style={{ fontSize: 16, fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{showInviteNotify.title}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, margin: '0 0 20px', lineHeight: 1.4 }}>{showInviteNotify.body}</p>
            
            <button 
              onClick={() => { setActivePage('compete'); setShowInviteNotify(null); }}
              style={{
                width: '100%', height: 44, borderRadius: 14, background: '#7a12cc', color: 'white',
                border: 'none', fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              ACCEPT DUEL <ArrowRight size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
