import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import {
  Home, BookOpen, FlaskConical, BarChart3, Trophy,
  Settings, Flame, ChevronLeft, ChevronRight, Zap, X,
  Brain, Sparkles, Layers, HelpCircle, MessageSquare, ShieldCheck
} from 'lucide-react'
import { isAdminUser } from '../../admin/adminAuth'
import LuterLogo from '../shared/LuterLogo'

const NAV = [
  { id: 'home', path: '/dashboard', icon: Home, label: 'Home' },
  { id: 'courses', path: '/dashboard/courses', icon: BookOpen, label: 'Backpack' },
  { id: 'mock-exam', path: '/dashboard/mock-exam', icon: FlaskConical, label: 'Mock Exam' },
  { id: 'compete', path: '/dashboard/compete', icon: Trophy, label: 'Compete' },
  { id: 'analytics', path: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'pricing', path: '/dashboard/pricing', icon: Zap, label: 'Upgrade' },
  { id: 'requests', path: '/dashboard/requests', icon: MessageSquare, label: 'Requests' },
]

function isNavActiveFixed(pathname, navPath) {
  if (navPath === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/'
  if (navPath === '/dashboard/courses') return pathname.startsWith('/dashboard/courses')
  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}

export default function DashboardSidebar({ collapsed, setCollapsed, user, isMobile, onClose, onNavigate }) {
  const [streak, setStreak] = useState(0)
  const { ready, bundle } = useDashboardPrefetch()
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  useEffect(() => {
    if (!user) return
    if (ready && bundle?.stats?.data) {
      setStreak(bundle.stats.data.streak_days || 0)
      return
    }
    const getStreak = async () => {
      const { data } = await supabase.from('user_stats').select('streak_days').eq('user_id', user.id).maybeSingle()
      if (data) setStreak(data.streak_days || 0)
    }
    getStreak()
  }, [user, ready, bundle])

  const profileName = bundle?.profile?.full_name || user?.user_metadata?.full_name
  const firstName = profileName ? profileName.split(' ')[0] : 'Student'
  const initials = firstName.slice(0, 2).toUpperCase()

  const go = (path) => {
    navigate(path)
    onNavigate?.()
  }

  return (
    <aside className={`dsb ${collapsed ? 'dsb--collapsed' : ''}`}>
      <div className="dsb-logo">
        <div className="dsb-logo-inner">
          <LuterLogo size={30} fontSize={22} />
        </div>

        {isMobile ? (
          <button className="dsb-close-btn" onClick={onClose}>
            <X size={20} strokeWidth={2.2} />
          </button>
        ) : (
          <button
            className="dsb-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} strokeWidth={2.2} /> : <ChevronLeft size={16} strokeWidth={2.2} />}
          </button>
        )}
      </div>

      <nav className="dsb-nav">
        {NAV.map(({ id, path, icon: Icon, label }) => {
          const isActive = isNavActiveFixed(pathname, path)
          return (
            <button
              key={id}
              className={`dsb-nav-item ${isActive ? 'dsb-nav-item--active' : ''} ${collapsed ? 'dsb-nav-item--center' : ''}`}
              onClick={() => go(path)}
              title={collapsed ? label : ''}
            >
              <div className="dsb-nav-icon-wrap">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              {!collapsed && <span className="dsb-nav-label-text">{label}</span>}
            </button>
          )
        })}
      </nav>

      <div className="dsb-bottom">
        <button
          onClick={() => go('/dashboard/streak')}
          className={`dsb-streak ${collapsed ? 'dsb-streak--collapsed' : ''}`}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: 0 }}
        >
          <div className="dsb-streak-flame">
            <Flame size={20} strokeWidth={2} fill="#d97706" color="#d97706" />
          </div>
          {!collapsed && <span className="dsb-streak-count">{streak} day streak</span>}
        </button>

        <div className={`dsb-user ${collapsed ? 'dsb-user--collapsed' : ''}`}>
          <div
            className="dsb-avatar"
            style={{ background: 'linear-gradient(135deg, #9718fb, #7a12cc)', color: 'white', fontSize: 13, fontWeight: 700 }}
          >
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="dsb-user-info">
                <span className="dsb-user-name">{firstName}</span>
              </div>
              <div className="dsb-user-actions" style={{ marginLeft: 'auto' }}>
                <button
                  title="Settings"
                  onClick={() => go('/dashboard/settings')}
                  style={{
                    background: pathname.startsWith('/dashboard/settings') ? '#f0f0f0' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                  }}
                >
                  <Settings size={14} strokeWidth={2} color={pathname.startsWith('/dashboard/settings') ? '#111' : '#666'} />
                </button>
              </div>
            </>
          )}
        </div>

        {!collapsed && (
          <button className="dsb-feedback-btn">
            <div className="dsb-feedback-line" />
            <span>give feedback</span>
            <div className="dsb-feedback-line" />
          </button>
        )}

        {isAdminUser(bundle?.profile, user?.email) && (
          <button
            onClick={() => navigate('/admin')}
            className={`dsb-nav-item dsb-admin-btn ${collapsed ? 'dsb-nav-item--center' : ''}`}
            style={{ marginTop: 8, color: '#7a12cc', border: '1.2px solid #7a12cc15', background: '#7a12cc05' }}
          >
            <div className="dsb-nav-icon-wrap">
              <ShieldCheck size={20} strokeWidth={2} />
            </div>
            {!collapsed && <span className="dsb-nav-label-text">Admin Panel</span>}
          </button>
        )}
      </div>
    </aside>
  )
}
