import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { 
  House,
  Books,
  UsersThree,
  Bell,
  GameController,
  Trash,
  Flask,
  CaretDown,
  CaretRight,
  X,
  CaretLeft,
  ChartBar,
  GearSix,
  CrownSimple,
  HashStraight,
  Plus,
  BookOpenText,
  Clock,
  SidebarSimple,
  Sparkle,
  Rocket
} from '@phosphor-icons/react'
import { isAdminUser } from '../../admin/adminAuth'
import LuterLogo from '../shared/LuterLogo'
import { useTranslation } from 'react-i18next'

const TOP_NAV = [
  { id: 'home', labelKey: 'home', icon: House, path: '/dashboard' },
  { id: 'sessions', labelKey: 'Sessions', icon: Clock, path: '/dashboard/sessions' },
  { id: 'library', labelKey: 'library', icon: Books, path: '/dashboard/library' },
  { id: 'study-groups', labelKey: 'studyGroups', icon: UsersThree, path: '/dashboard/study-groups', badge: 'New' },
  { id: 'notifications', labelKey: 'notifications', icon: Bell, path: '/dashboard/notifications', count: 3 },
]

const BOTTOM_NAV = [
  { id: 'playground', labelKey: 'playground', icon: GameController, path: '/dashboard/compete', highlight: true },
  { id: 'trash', labelKey: 'trash', icon: Trash, path: '/dashboard/trash' },
  { id: 'mock-exam', labelKey: 'mockExam', icon: Flask, path: '/dashboard/mock-exam' },
]

function isNavActiveFixed(pathname, navPath) {
  if (navPath === '/dashboard') return pathname === '/dashboard' || pathname === '/dashboard/'
  if (navPath === '/dashboard/courses') return pathname.startsWith('/dashboard/courses')
  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}

export default function DashboardSidebar({ collapsed, setCollapsed, user, isMobile, onClose, onNavigate, onNotificationsClick }) {
  const { t } = useTranslation(['sidebar'])
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
  const isSoloLearner = profile?.is_university_user === false || profile?.role === 'solo_learner'
  const standaloneMaterials = (bundle?.materials?.data || []).filter((item) => !item.course_id)
  const displayUsername = profile?.username ? `@${profile.username}` : (profile?.full_name?.split(' ')[0] || 'Scholar')
  const initials = (profile?.username?.slice(0, 2) || profile?.full_name?.slice(0, 2) || 'SC').toUpperCase()
  
  // Gamification stats from bundle
  const stats = bundle?.stats?.data
  const xp = stats?.total_xp || 0
  const level = Math.floor(xp / 500) + 1
  const xpInLevel = xp % 500
  const xpProgress = (xpInLevel / 500) * 100
  const coins = stats?.coins || 100 // Default to 100 if not in stats
  
  // Subscription tier display
  const subscriptionTier = profile?.subscription_tier?.toLowerCase() || 'free'
  const subscriptionType = profile?.subscription_type?.toLowerCase() || 'free'
  const getTierBadge = () => {
    if (subscriptionTier === 'premium' || subscriptionType === 'premium') {
      return { label: 'Executive', icon: Rocket, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.15)' }
    }
    if (subscriptionTier === 'pro' || subscriptionType === 'pro') {
      return { label: 'Pro', icon: Sparkle, color: '#7a12cc', bg: 'rgba(122, 18, 204, 0.15)' }
    }
    return null
  }
  const tierBadge = getTierBadge()

  const go = (path) => {
    navigate(path)
    onNavigate?.()
  }

  const NavButton = ({ item }) => {
    const { id, path, icon: Icon, labelKey, children, highlight, badge, count } = item
    const label = t(labelKey)
    const isActive = isNavActiveFixed(pathname, path)
    const isExpanded = expandedItems.includes(id)

    return (
      <div className="dsb-nav-group">
        <button
          id={`nav-${id}`}
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
          style={{
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isActive ? 'translateX(2px)' : 'translateX(0)'
          }}
        >
          <div className="dsb-nav-icon-wrap" style={{
            transition: 'all 0.2s ease',
            transform: isActive ? 'scale(1.05)' : 'scale(1)'
          }}>
            <Icon size={20} weight={isActive ? "fill" : "regular"} />
            {count > 0 && collapsed && <div className="dsb-nav-badge dsb-nav-badge--count">{count}</div>}
          </div>
          {!collapsed && (
            <>
              <span className="dsb-nav-label-text" style={{
                fontWeight: isActive ? 600 : 500,
                transition: 'all 0.2s ease'
              }}>{label}</span>
              {badge && <span className="dsb-nav-badge-pill">{badge}</span>}
              {count > 0 && <span className="dsb-nav-badge-count">{count}</span>}
              {children && (
                <div className="dsb-nav-arrow" style={{ 
                  marginLeft: 'auto',
                  transition: 'transform 0.2s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                  <CaretDown size={16} weight="regular" />
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
                  {ChildIcon && <ChildIcon size={16} weight="regular" style={{ marginRight: 8 }} />}
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
            <X size={18} weight="regular" />
          </button>
        ) : (
          <button
            className="dsb-close-btn"
            onClick={onClose}
            title="Close sidebar"
          >
            <SidebarSimple size={20} weight="bold" />
          </button>
        )}
      </div>

      <nav className="dsb-nav">
        {/* Top Section */}
        <div className="dsb-nav-section" style={{ marginTop: '0px' }}>
          {TOP_NAV.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>

        {/* Section divider */}
        {!collapsed && (
          <div style={{
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(226, 232, 240, 0.5), transparent)',
            margin: '16px 12px 8px 12px'
          }} />
        )}

        <div className="dsb-divider" />

        {/* Middle Section - Backpack (Courses) */}
        {!collapsed && (
          <div 
            className="dsb-section-label dsb-section-label--clickable" 
            style={{ marginTop: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}
          >
            <div id="nav-backpack" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => go('/dashboard/courses')}>
              <div style={{ width: 4, height: 16, background: '#7a12cc', borderRadius: 2 }} />
              <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: '0.05em', color: '#111' }}>
                {isSoloLearner ? t('myVault') : t('backpack')}
              </span>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setExpandedItems(prev => prev.includes('backpack') ? prev.filter(i => i !== 'backpack') : [...prev, 'backpack']);
              }}
              style={{ display: 'flex', alignItems: 'center', padding: '4px', color: '#94a3b8' }}
            >
              <CaretDown 
                weight="regular"
                size={16} 
                style={{ 
                  transform: expandedItems.includes('backpack') ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }} 
              />
            </button>
          </div>
        )}

        {expandedItems.includes('backpack') && (
          <div className="dsb-nav-section dsb-backpack-section" style={{ 
            maxHeight: '380px', 
            overflowY: 'auto', 
            paddingRight: '4px', 
            marginBottom: '8px', 
            marginTop: '8px'
          }}>
            {isSoloLearner ? (
              standaloneMaterials.length > 0 ? (
                <>
                  {standaloneMaterials.map((material, idx) => {
                    const isActive = pathname === '/dashboard/workstation' && location.search.includes(material.id)
                    return (
                      <button
                        key={material.id || `material-${idx}`}
                        className={`dsb-nav-item dsb-course-item ${isActive ? 'dsb-nav-item--active' : ''} ${collapsed ? 'dsb-nav-item--center' : ''}`}
                        onClick={() => go(`/dashboard/workstation?materialId=${material.id}`)}
                        style={{
                          padding: '12px 16px',
                          marginBottom: '4px',
                          background: isActive ? 'rgba(122, 18, 204, 0.08)' : 'transparent',
                          border: isActive ? '1px solid rgba(122, 18, 204, 0.2)' : '1px solid transparent',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease'
                        }}
                        title={material.title}
                      >
                        <div className="dsb-nav-icon-wrap" style={{ color: isActive ? '#7a12cc' : '#94a3b8' }}>
                          <BookOpenText size={18} weight="regular" />
                        </div>
                        {!collapsed && (
                          <span className="dsb-nav-label-text" style={{
                            fontSize: '13px',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#111' : '#64748b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {material.title || 'Untitled material'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  <button
                    className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`}
                    onClick={() => go('/dashboard/upload')}
                    style={{ marginTop: '4px', border: '1px dashed #e2e8f0', borderRadius: '12px', margin: '8px 12px', padding: '8px' }}
                  >
                    <div className="dsb-nav-icon-wrap" style={{ color: '#7a12cc' }}><Plus size={18} weight="regular" /></div>
                    {!collapsed && <span className="dsb-nav-label-text" style={{ color: '#7a12cc', fontWeight: 700, fontSize: '12px' }}>
                      {t('addToVault')}
                    </span>}
                  </button>
                </>
              ) : (
                <button
                  className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`}
                  onClick={() => go('/dashboard/upload')}
                  style={{ margin: '8px 12px', background: 'rgba(122, 18, 204, 0.05)', borderRadius: '12px', padding: '12px' }}
                >
                  <div className="dsb-nav-icon-wrap" style={{ color: '#7a12cc' }}><Plus size={20} weight="regular" /></div>
                  {!collapsed && <span className="dsb-nav-label-text" style={{ color: '#7a12cc', fontWeight: 800 }}>
                    {t('setupVault')}
                  </span>}
                </button>
              )
            ) : bundle?.uc?.data?.length > 0 ? (
              <>
                {(() => {
                  const coursesWithData = bundle.uc.data.filter(row => row && (row.courses || row.course));
                  console.log('Courses found:', coursesWithData.length, coursesWithData);
                  return coursesWithData.map((row, idx) => {
                    const c = row.courses || row.course;
                    const isActive = pathname.includes(c?.id);
                    return (
                      <button
                        key={c?.id || `course-${idx}`}
                        className={`dsb-nav-item dsb-course-item ${isActive ? 'dsb-nav-item--active' : ''} ${collapsed ? 'dsb-nav-item--center' : ''}`}
                        onClick={() => go(`/dashboard/courses/${c?.id}`)}
                        style={{ 
                          padding: '12px 16px', 
                          marginBottom: '4px',
                          background: isActive ? 'rgba(122, 18, 204, 0.08)' : 'transparent',
                          border: isActive ? '1px solid rgba(122, 18, 204, 0.2)' : '1px solid transparent',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease'
                        }}
                        title={c?.name}
                      >
                        <div className="dsb-nav-icon-wrap" style={{ color: isActive ? '#7a12cc' : '#94a3b8' }}>
                          <HashStraight size={18} weight="regular" />
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
                  });
                })()}
                <button
                  className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`}
                  onClick={() => go(isSoloLearner ? '/dashboard/upload' : '/dashboard/courses')}
                  style={{ marginTop: '4px', border: '1px dashed #e2e8f0', borderRadius: '12px', margin: '8px 12px', padding: '8px' }}
                >
                  <div className="dsb-nav-icon-wrap" style={{ color: '#7a12cc' }}><Plus size={18} weight="regular" /></div>
                  {!collapsed && <span className="dsb-nav-label-text" style={{ color: '#7a12cc', fontWeight: 700, fontSize: '12px' }}>
                    {isSoloLearner ? t('addToVault') : t('enrollMore')}
                  </span>}
                </button>
              </>
            ) : (
              <button
                  className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`}
                  onClick={() => go(isSoloLearner ? '/dashboard/upload' : '/dashboard/courses')}
                  style={{ margin: '8px 12px', background: 'rgba(122, 18, 204, 0.05)', borderRadius: '12px', padding: '12px' }}
                >
                  <div className="dsb-nav-icon-wrap" style={{ color: '#7a12cc' }}><Plus size={20} weight="regular" /></div>
                  {!collapsed && <span className="dsb-nav-label-text" style={{ color: '#7a12cc', fontWeight: 800 }}>
                    {isSoloLearner ? t('setupVault') : t('addFirstCourse')}
                  </span>}
                </button>
            )}
          </div>
        )}

        {/* Down Section (Toolbox) sits directly below Backpack */}
        <div className="dsb-nav-section" style={{ 
          marginTop: '0px',
          paddingTop: !collapsed ? '8px' : '0'
        }}>
          {BOTTOM_NAV.map((item) => (
            <NavButton key={item.id} item={item} />
          ))}
        </div>
      </nav>

      <div className="dsb-bottom" style={{ paddingBottom: collapsed ? '12px' : '0' }}>
        {!collapsed && <div className="dsb-section-label" style={{ 
          marginTop: '8px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '0 12px'
        }}>{t('personal')}</div>}
        
        <div className="dsb-personal-group" style={{
          borderRadius: '12px',
          overflow: 'hidden',
          background: collapsed ? 'transparent' : 'rgba(248, 250, 252, 0.5)',
          border: collapsed ? 'none' : '1px solid rgba(226, 232, 240, 0.6)',
          padding: collapsed ? 0 : '4px'
        }}>
          <button id="nav-progress" className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`} onClick={() => go('/dashboard/analytics')} style={{
            borderRadius: '8px',
            margin: collapsed ? 0 : '2px'
          }}>
            <div className="dsb-nav-icon-wrap"><ChartBar size={20} weight="regular" /></div>
            {!collapsed && <span className="dsb-nav-label-text">{t('myProgress')}</span>}
          </button>
          
          <button id="nav-settings" className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`} onClick={() => go('/dashboard/settings')} style={{
            borderRadius: '8px',
            margin: collapsed ? 0 : '2px'
          }}>
            <div className="dsb-nav-icon-wrap"><GearSix size={20} weight="regular" /></div>
            {!collapsed && <span className="dsb-nav-label-text">{t('settings')}</span>}
          </button>

        </div>  
          {!tierBadge && (
            <button 
              id="nav-upgrade"
              className={`dsb-nav-item ${collapsed ? 'dsb-nav-item--center' : ''}`} 
              onClick={() => go('/dashboard/pricing')}
              style={{
                background: collapsed ? 'none' : 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.06) 100%)',
                border: collapsed ? '1px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '10px',
                padding: collapsed ? '8px' : '10px 16px',
                margin: collapsed ? '0 0 12px 0' : '8px 12px 16px 12px',
                color: '#8b5cf6',
                fontWeight: 500,
                fontSize: '14px',
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                width: collapsed ? 'auto' : 'calc(100% - 24px)'
              }}
              onMouseEnter={(e) => {
                if (!collapsed) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.08) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'
                  e.currentTarget.style.transform = 'translateX(2px)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.15)'
                }
              }}
              onMouseLeave={(e) => {
                if (!collapsed) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.06) 100%)'
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)'
                  e.currentTarget.style.transform = 'translateX(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }
              }}
            >
              <div className="dsb-nav-icon-wrap" style={{ 
                color: '#8b5cf6',
                position: 'relative'
              }}>
                <CrownSimple size={18} weight="fill" />
                {!collapsed && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '6px',
                    height: '6px',
                    background: '#f59e0b',
                    borderRadius: '50%',
                    border: '2px solid white'
                  }} />
                )}
              </div>
              {!collapsed && (
                <span className="dsb-nav-label-text" style={{ 
                  color: '#8b5cf6',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px'
                }}>
                  {t('upgradePro')}
                  <span style={{
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                    color: 'white',
                    padding: '1px 6px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.5px'
                  }}>
                    PRO
                  </span>
                </span>
              )}
            </button>
          )}
          {/* Gamified User Profile - Streak, Level, Coins */}
          <button 
            id="nav-profile-card"
            className={`dsb-user-compact ${collapsed ? 'dsb-user--collapsed' : ''}`}
            onClick={() => go('/dashboard/profile')}
            style={{
              background: collapsed ? 'none' : '#f8fafc',
              border: collapsed ? 'none' : '1px solid #e2e8f0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderRadius: '12px',
              padding: collapsed ? '8px' : '10px 14px',
              width: collapsed ? 'auto' : 'calc(100% - 24px)',
              margin: collapsed ? '0 0 12px 0' : '0 12px 16px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          onMouseEnter={(e) => {
            if (!collapsed) {
              e.currentTarget.style.borderColor = '#ff9b38'
              e.currentTarget.style.background = 'rgba(255, 155, 56, 0.08)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 155, 56, 0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (!collapsed) {
              e.currentTarget.style.borderColor = '#e2e8f0'
              e.currentTarget.style.background = '#f8fafc'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {/* Avatar - Shows profile picture or initials */}
          <div 
            className="dsb-avatar-sm" 
            style={{ 
              flexShrink: 0,
              background: profile?.avatar_url ? 'transparent' : undefined,
              overflow: 'hidden',
              padding: 0
            }}
          >
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Profile" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  borderRadius: '50%'
                }} 
              />
            ) : (
              initials
            )}
          </div>
          {!collapsed && (
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <span className="dsb-user-name-alt" style={{ 
                display: 'block', 
                marginBottom: '6px',
                fontSize: '13px',
                fontWeight: 600
              }}>{displayUsername}</span>
              
              {/* Gamification Stats - Streak, Level, Coins */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '8px'
              }}>
                {/* Streak */}
                {streak > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    background: 'rgba(255, 155, 56, 0.12)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#ff9b38',
                    whiteSpace: 'nowrap'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.07-.5-4.5 2.5-6.5 1.5 1 2.5 3 2.5 5 0 1.5-1 2.5-2 3.5" stroke="#ff9b38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 18c2 0 3.5-2 4-4" stroke="#ff9b38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8.5 14.5c1.5 1 3 1.5 4.5 1.5" stroke="#ff9b38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {streak}
                  </div>
                )}
                
                {/* Level */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  background: 'rgba(151, 110, 238, 0.12)',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#6745AE',
                  whiteSpace: 'nowrap'
                }}>
                  <svg width="14" height="14" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M14.9936 0.677492C12.8268 2.26076 10.5479 3.66886 8.91217 4.43512C6.50413 5.56309 3.60975 6.40891 0.959029 6.7591C0.611852 6.80501 0.250714 6.85849 0.156549 6.87803C-0.0147001 6.91354 -0.0147001 6.91354 0.0147078 13.244C0.0352042 17.6458 0.0712958 19.7555 0.133305 20.1688C0.552591 22.9655 1.39413 25.5485 2.58983 27.7088C5.16674 32.3646 9.24196 35.8051 14.2339 37.5394C15.7725 38.0739 15.8923 38.0894 16.6963 37.8587C20.044 36.8981 23.2063 35.0219 25.7263 32.501C29.0455 29.1808 31.0489 25.1043 31.787 20.1688C31.8487 19.7565 31.885 17.6353 31.9054 13.244C31.9348 6.91354 31.9348 6.91354 31.7635 6.87803C31.6694 6.85849 31.3082 6.80501 30.9611 6.7591C29.0555 6.50734 26.6524 5.90354 24.9136 5.23957C22.3382 4.25616 19.8307 2.81575 16.784 0.569628C16.359 0.256362 15.9909 0 15.9661 0C15.9412 0 15.5036 0.304871 14.9936 0.677492" fill="#6745AE"/>
                  </svg>
                  Lv.{level}
                </div>
                
                {/* Coins */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  background: 'rgba(254, 153, 35, 0.12)',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fe9922',
                  whiteSpace: 'nowrap'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="6" stroke="#fe9922" strokeWidth="2"/>
                    <path d="M18.09 10.37A6 6 0 1 1 10.34 18" stroke="#fe9922" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {coins}
                </div>
              </div>
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
