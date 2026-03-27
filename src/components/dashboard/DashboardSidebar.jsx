import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import {
  Home, BookOpen, FlaskConical, BarChart3, Trophy,
  Settings, Flame, ChevronLeft, ChevronRight, Zap, X
} from 'lucide-react'
import LuterLogo from '../shared/LuterLogo'

const NAV_ITEMS = [
  { id: 'home',      icon: Home,          label: 'Home'       },
  { id: 'courses',   icon: BookOpen,      label: 'My Classes' },
  { id: 'mock-exam', icon: FlaskConical,  label: 'Mock Exam'  },
  { id: 'compete',   icon: Trophy,        label: 'Compete'   },
  { id: 'analytics', icon: BarChart3,     label: 'Analytics'  },
  { id: 'upgrade',   icon: Zap,            label: 'Upgrade'    },
]

export default function DashboardSidebar({ activePage, setActivePage, collapsed, setCollapsed, user, isMobile, onClose }) {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user) return
    const getStreak = async () => {
      const { data } = await supabase.from('user_stats').select('streak_days').eq('user_id', user.id).maybeSingle()
      if (data) setStreak(data.streak_days || 0)
    }
    getStreak()
  }, [user])

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student'
  const initials  = firstName.slice(0, 2).toUpperCase()

  return (
    <aside className={`dsb ${collapsed ? 'dsb--collapsed' : ''}`}>

      {/* ── Logo row ── */}
      <div className="dsb-logo">
        <div className="dsb-logo-inner">
          <LuterLogo size={30} fontSize={22} />
        </div>

        {/* toggle or close */}
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
            {collapsed
              ? <ChevronRight size={16} strokeWidth={2.2} />
              : <ChevronLeft  size={16} strokeWidth={2.2} />}
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="dsb-nav">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activePage === id || (activePage === 'course-workstation' && id === 'courses')
          return (
            <button
              key={id}
              className={`dsb-nav-item ${isActive ? 'dsb-nav-item--active' : ''} ${collapsed ? 'dsb-nav-item--center' : ''}`}
              onClick={() => setActivePage(id)}
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

      {/* ── Bottom ── */}
      <div className="dsb-bottom">

        {/* Streak (Clickable) */}
        <button 
          onClick={() => setActivePage('streak')}
          className={`dsb-streak ${collapsed ? 'dsb-streak--collapsed' : ''}`}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: 0 }}
        >
          <div className="dsb-streak-flame">
            <Flame size={20} strokeWidth={2} fill="#d97706" color="#d97706" />
          </div>
          {!collapsed && <span className="dsb-streak-count">{streak} day streak</span>}
        </button>

        {/* User */}
        <div className={`dsb-user ${collapsed ? 'dsb-user--collapsed' : ''}`}>
          <div className="dsb-avatar"
            style={{ background: 'linear-gradient(135deg, #9718fb, #7a12cc)', color: 'white', fontSize: 13, fontWeight: 700 }}>
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
                  onClick={() => setActivePage('settings')}
                  style={{ background: activePage === 'settings' ? '#f0f0f0' : 'transparent', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6 }}
                >
                  <Settings size={14} strokeWidth={2} color={activePage === 'settings' ? '#111' : '#666'} />
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
      </div>
    </aside>
  )
}
