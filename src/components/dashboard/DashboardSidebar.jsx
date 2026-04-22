import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { 
  Home, Book, Briefcase, User, Gamepad2, Layers, 
  Folder, ClipboardList, PenTool, CheckCircle, 
  Settings, Crown, BarChart, ChevronDown, ChevronRight,
  Monitor, Star, ShieldCheck, X, ChevronLeft,
  Users, Bell, Trash2, FlaskConical, Hash, Plus
} from 'lucide-react'
import { isAdminUser } from '../../admin/adminAuth'
import LuterLogo from '../shared/LuterLogo'

const TOP_NAV = [
  { id: 'home', label: 'Home', icon: Home, path: '/dashboard' },
  { id: 'library', label: 'Your library', icon: Book, path: '/dashboard/library' },
  { id: 'study-groups', label: 'Study groups', icon: Users, path: '/dashboard/study-groups', badge: 'New' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/dashboard/notifications', count: 3 },
]

const BOTTOM_NAV = [
  { id: 'playground', label: 'Playground', icon: Gamepad2, path: '/dashboard/compete', highlight: true },
  { id: 'trash', label: 'Trash', icon: Trash2, path: '/dashboard/trash' },
  { id: 'mock-exam', label: 'Mock Exam', icon: FlaskConical, labelAlt: 'Mock Exam', path: '/dashboard/mock-exam' },
]

function isNavActiveFixed(pathname, navPath) {
  if (navPath === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/'
  if (navPath === '/dashboard/courses') return pathname.startsWith('/dashboard/courses')
  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}

export default function DashboardSidebar({ collapsed, setCollapsed, user, isMobile, onClose, onNavigate, onNotificationsClick }) {
  const [streak, setStreak] = useState(0)
  const [expandedItems, setExpandedItems] = useState(['library', 'backpack'])
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

  const profile = bundle?.profile?.data || bundle?.profile
  const displayUsername = profile?.username ? `@${profile.username}` : (profile?.full_name?.split(' ')[0] || 'Scholar')
  const initials = (profile?.username?.slice(0, 2) || profile?.full_name?.slice(0, 2) || 'SC').toUpperCase()

  const go = (path) => {
    navigate(path)
    onNavigate?.()
  }

  const NavButton = ({ item }) => {
    const { id, path, icon: Icon, label, children, highlight, badge, count } = item
    const isActive = isNavActiveFixed(pathname, path)
    const isExpanded = expandedItems.includes(id)

    return (
      <div className="dsb-nav-group">
        <button
          className={`dsb-nav-item 
            ${isActive ? 'dsb-nav-item--active' : ''} 
            ${highlight ? 'dsb-nav-item--playground' : ''}
            ${collapsed ? 'dsb-nav-item--center' : ''}`}
          onClick={() => {
            if (id === 'notifications') {
              onNotificationsClick?.()
              return
            }
            if (children && !collapsed) {
              setExpandedItems(prev => 
                prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
              )
            } else {
              go(path)
            }
          }}
          title={collapsed ? label : ''}
        >
          <div className="dsb-nav-icon-wrap">
            <Icon size={18} />
            {count > 0 && collapsed && <div className="dsb-nav-badge dsb-nav-badge--count">{count}</div>}
          </div>
          {!collapsed && (
            <>
              <span className="dsb-nav-label-text">{label}</span>
              {badge && <span className="dsb-nav-badge-pill">{badge}</span>}
              {count > 0 && <span className="dsb-nav-badge-count">{count}</span>}
              {children && (
                <div className="dsb-nav-arrow" style={{ marginLeft: 'auto' }}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              )}
            </>
          )}
        </button>

        {children && isExpanded && !collapsed && (
          <div className="dsb-nav-children">
            {children.map((child, idx) => {
              const isChildActive = pathname.startsWith(child.path)
              const ChildIcon = child.icon
              return (
                <button
                   key={idx}
                   className={`dsb-nav-child-item ${isChildActive ? 'dsb-nav-child--active' : ''}`}
                   onClick={() => go(child.path)}
                >
                  {ChildIcon && <ChildIcon size={14} strokeWidth={3.5} style={{ marginRight: 8 }} />}
                  <span>{child.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className={`dsb ${collapsed ? 'dsb--collapsed' : ''}`}>
      <div className="dsb-logo">
        <div className="dsb-logo-inner">
          <LuterLogo size={30} fontSize={22} />
        </div>

        {isMobile ? (
          <button className="dsb-close-btn" onClick={onClose}>
            <X size={20} strokeWidth={3.8} />
          </button>
        ) : (
          <button
            className="dsb-collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      <nav className="dsb-nav">
        {/* Top Section */}
        <div className="dsb-nav-section">
          {TOP_NAV.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>

        <div className="dsb-divider" />

        {/* Middle Section - Backpack (Courses) */}
        {!collapsed && (
          <div 
            className="dsb-section-label dsb-section-label--clickable" 
            style={{ marginTop: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => go('/dashboard/courses')}>
              <div style={{ width: 4, height: 16, background: '#7a12cc', borderRadius: 2 }} />
              <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', color: '#111' }}>BACKPACK</span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setExpandedItems(prev => prev.includes('backpack') ? prev.filter(i => i !== 'backpack') : [...prev, 'backpack']);
              }}
              style={{ display: 'flex', alignItems: 'center', padding: '4px', color: '#94a3b8' }}
            >
              <ChevronDown 
                size={14} 
                strokeWidth={3} 
                style={{ 
                  transform: expandedItems.includes('backpack') ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </button>
          </div>
        )}

        {expandedItems.includes('backpack') && (
          <div className="dsb-nav-section dsb-backpack-section" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px', marginBottom: '8px', marginTop: '8px' }}>
            {bundle?.uc?.data?.length > 0 ? (
              <>
                {bundle.uc.data
                  .filter(row => row && (row.courses || row.course))
                  .map((row, idx) => {
                    const c = row.courses || row.course;
                    const isActive = pathname.includes(c?.id);
                    return (
                      <button
                        key={c?.id || `course-${idx}`}
                        className={`dsb-nav-item dsb-course-item ${isActive ? 'dsb-nav-item--active' : ''} ${collapsed ? 'dsb-nav-item--center' : ''}`}
                        onClick={() => go(`/dashboard/courses/${c?.id}`)}
                        style={{ 
                          padding: '10px 16px', 
                          marginBottom: '2px',
                          background: isActive ? 'rgba(122, 18, 204, 0.05)' : 'transparent',
                          border: 'none'
                        }}
                        title={c?.name}
                      >
                        <div className="dsb-nav-icon-wrap" style={{ color: isActive ? '#7a12cc' : '#94a3b8' }}>
                          <Hash size={16} strokeWidth={isActive ? 3 : 2} />
                        </div>
                        {!collapsed && (
                          <span className="dsb-nav-label-text" style={{ 
                            fontSize: '13px', 
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#111' : '#64748b',
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis' 
                          }}>
                            {c?.code || c?.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                <button
                  className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`}
                  onClick={() => go('/dashboard/courses')}
                  style={{ marginTop: '4px', border: '1px dashed #e2e8f0', borderRadius: '12px', margin: '8px 12px', padding: '8px' }}
                >
                  <div className="dsb-nav-icon-wrap" style={{ color: '#7a12cc' }}><Plus size={16} strokeWidth={3} /></div>
                  {!collapsed && <span className="dsb-nav-label-text" style={{ color: '#7a12cc', fontWeight: 700, fontSize: '12px' }}>Enroll More</span>}
                </button>
              </>
            ) : (
              <button
                  className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`}
                  onClick={() => go('/dashboard/courses')}
                  style={{ margin: '8px 12px', background: 'rgba(122, 18, 204, 0.05)', borderRadius: '12px', padding: '12px' }}
                >
                  <div className="dsb-nav-icon-wrap" style={{ color: '#7a12cc' }}><Plus size={20} strokeWidth={3} /></div>
                  {!collapsed && <span className="dsb-nav-label-text" style={{ color: '#7a12cc', fontWeight: 800 }}>Add Your First Course</span>}
                </button>
            )}
          </div>
        )}

        {/* Down Section (Toolbox) sits directly below Backpack */}
        <div className="dsb-nav-section" style={{ marginTop: '0px' }}>
          {BOTTOM_NAV.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
      </nav>

      <div className="dsb-bottom">
        {!collapsed && <div className="dsb-section-label" style={{ marginTop: '20px' }}>Personal</div>}
        
        <div className="dsb-personal-group">
          <button className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`} onClick={() => go('/dashboard/analytics')}>
            <div className="dsb-nav-icon-wrap"><BarChart size={18} /></div>
            {!collapsed && <span className="dsb-nav-label-text">My Progress</span>}
          </button>
          
          <button className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`} onClick={() => go('/dashboard/settings')}>
            <div className="dsb-nav-icon-wrap"><Settings size={18} /></div>
            {!collapsed && <span className="dsb-nav-label-text">Settings</span>}
          </button>

          <button className={`dsb-nav-item dsb-nav-item--pro ${collapsed ? 'dsb-nav-item--center' : ''}`} onClick={() => go('/dashboard/pricing')}>
            <div className="dsb-nav-icon-wrap"><Crown size={18} /></div>
            {!collapsed && <span className="dsb-nav-label-text">Upgrade to Pro</span>}
          </button>
        </div>

        <div className={`dsb-user-compact ${collapsed ? 'dsb-user--collapsed' : ''}`}>
          <div className="dsb-avatar-sm">{initials}</div>
          {!collapsed && (
            <div className="dsb-user-info-inner" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span className="dsb-user-name-alt">{displayUsername}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
