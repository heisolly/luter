import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import { Sidebar, Menu, Search, Plus } from 'lucide-react'
import ThemeToggle from './ThemeToggle'


const Header = ({ 
  showSearch = true, 
  showTabs = false, 
  tabs = [], 
  activeTab = null, 
  onTabChange = null,
  pageTitle = null,
  showCreateButton = true,
  createButtonPath = '/dashboard/upload',
  sidebarCollapsed = false,
  setSidebarCollapsed = null
}) => {
  const navigate = useNavigate()
  const outletContext = useOutletContext() || {}
  const { bundle } = useDashboardPrefetch()
  const profile = bundle?.profile?.data || bundle?.profile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [searchQuery, setSearchQuery] = useState('')
  const [streak, setStreak] = useState(1)
  const [level, setLevel] = useState(1)
  const [coins, setCoins] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Load user data (you can replace this with actual user context)
    const loadUserData = () => {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setStreak(userData.streak || 1)
      setLevel(userData.level || 1)
      setCoins(userData.coins || 0)
    }
    loadUserData()
  }, [])

  return (
    <>
      {/* Header - Navbar Style */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        paddingInline: '0',
        paddingBlock: '0px',
        position: 'relative',
        marginTop: '-1px',
        justifyContent: 'space-between',
        gap: '2rem',
        transition: 'box-shadow 0.5s',
        height: 'var(--navbar-height)',
        backgroundColor: 'transparent',
        marginBottom: '16px'
      }}>
        {/* Left Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flex: '1 1 0%',
          gap: '1rem'
        }}>
          {/* Sidebar Toggle Button (Desktop) */}
          {!isMobile && setSidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderRadius: '8px',
                color: '#64748B',
                transition: 'all 0.2s',
                marginLeft: '-8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Sidebar size={20} strokeWidth={2} />
            </button>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="MuiBox-root knowt-1krzpqj"
            aria-label="open menu"
            onClick={() => {
              if (outletContext?.setMobileSidebarOpen) {
                outletContext.setMobileSidebarOpen(true)
              } else if (setSidebarCollapsed) {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
            style={{
              display: isMobile ? 'flex' : 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 8
            }}
          >
            <Menu size={18} strokeWidth={2.2} aria-hidden="true" />
          </button>

          {/* Mobile Search Button */}
          {showSearch && (
            <button 
              className="MuiBox-root knowt-1krzpqj breakpoints-module__zbexiG__mdUpDisplayNone"
              aria-label="Knowt button" 
              id="main-search-bar"
              style={{
                display: isMobile ? 'flex' : 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 8
              }}
            >
              <Search size={18} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}

          {/* Page Title */}
          {pageTitle && (
            <div style={{
              display: isMobile ? 'none' : 'block',
              fontSize: 24,
              fontWeight: 700,
              color: '#111',
              fontFamily: "'Outfit', 'Varela Round', sans-serif"
            }}>
              {pageTitle}
            </div>
          )}

          {/* Search Bar */}
          {showSearch && (
            <div 
              className="ellipsisText breakpoints-module__zbexiG__mdDownDisplayNone MuiBox-root knowt-1xgonjw"
              style={{
                display: isMobile ? 'none' : 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '8px 16px',
                fontFamily: "'Varela Round', sans-serif",
                fontSize: 15,
                color: '#94a3b8',
                minWidth: '250px'
              }}
            >
              <Search size={18} strokeWidth={2.2} aria-hidden="true" style={{ opacity: 0.5 }} />
              <input
                type="text"
                placeholder="Search for anything"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: 15,
                  fontFamily: "'Varela Round', sans-serif",
                  color: '#333',
                  opacity: searchQuery ? 1 : 0.5
                }}
              />
            </div>
          )}
        </div>

        {/* Right Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'safe flex-end',
          columnGap: '1rem'
        }}>
          {/* Create Button */}
          {showCreateButton && (
            <button
              className="MuiBox-root knowt-h58brt"
              aria-label="Knowt button" 
              id="tour-upload-btn"
              onClick={() => navigate(createButtonPath)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={40} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}

          {/* Streak Counter */}
          <button 
            className="MuiBox-root knowt-3peil5"
            onClick={() => navigate('/dashboard/streak')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 155, 56, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <title>Streak</title>
                  <path d="M9.03694 24C12.9377 24 16.4405 21.4325 17.605 17.5973C17.8514 16.7861 18.001 15.9249 18 15.0308C17.9956 11.0114 15.1454 6.96942 14.0257 5.53641C13.9171 5.39735 13.7109 5.51089 13.7502 5.6851C13.9485 6.5634 14.2372 8.07558 14.1229 9.01735C14.0429 9.67632 13.8602 10.2147 13.69 10.5989C13.6169 10.7638 13.419 10.6878 13.4381 10.5074C13.519 9.73943 13.5566 8.53444 13.1728 7.61391C12.4699 5.92867 11.1617 5.1469 10.6578 3.62953C10.2307 2.34352 10.5866 0.9032 10.8039 0.233155C10.8503 0.0901149 10.7139 -0.0482382 10.5823 0.0163087C9.75272 0.423456 7.65167 1.61661 6.03855 3.91412C4.48819 6.12226 4.66683 8.75384 4.96046 10.269C4.99816 10.4636 4.68947 10.6258 4.54898 10.491C4.41133 10.3588 4.24801 10.2141 4.05425 10.0571C3.31404 9.4571 3.25537 8.49877 3.3147 7.86695C3.33102 7.69314 3.11026 7.57011 2.99856 7.70068C2.07822 8.77657 -0.00378012 11.591 5.15456e-06 15.0309C0.00132425 16.2296 0.335763 17.4386 0.822252 18.5638C2.26078 21.8908 5.504 24 9.03694 24Z" fill="#ff9b38"></path>
                  <path d="M12.5928 18.6134C12.6732 16.5721 11.4313 15.2014 10.6589 14.323C9.72076 13.2559 9.57245 12.1251 9.57295 11.5141C9.57308 11.3565 9.38211 11.2476 9.26694 11.3504C8.48418 12.049 6.58532 13.8759 6.17231 15.4988C5.89967 16.5704 6.07799 17.3989 6.29684 17.9311C6.36614 18.0997 6.17782 18.3031 6.04821 18.1786C5.99934 18.1317 5.95247 18.0814 5.90969 18.0279C5.76303 17.8446 5.6555 17.6483 5.57895 17.4773C5.51312 17.3302 5.34697 17.3376 5.33746 17.4995C5.32088 17.782 5.32578 18.2066 5.3955 18.824C5.50894 19.8283 5.98052 20.5962 6.54672 21.1704C7.92288 22.566 10.1561 22.5299 11.5091 21.1092C12.0888 20.5006 12.5507 19.6838 12.5928 18.6134Z" fill="#FEDC29"></path>
                </svg>
              </div>
              <span className="new_bodyMBold" style={{ color: 'rgb(255, 155, 56)' }}>{streak}</span>
            </div>
          </button>

          {/* Level Badge - Hidden on mobile */}
          <div className="breakpoints-module__zbexiG__mdDownDisplayNone">
            <button 
              className="MuiBox-root knowt-3peil5"
              onClick={() => navigate('/dashboard/profile')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: 8,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(151, 110, 238, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <svg width="20" height="20" viewBox="0 0 32 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>Levels</title>
                    <path fillRule="evenodd" clipRule="evenodd" d="M14.9936 0.677492C12.8268 2.26076 10.5479 3.66886 8.91217 4.43512C6.50413 5.56309 3.60975 6.40891 0.959029 6.7591C0.611852 6.80501 0.250714 6.85849 0.156549 6.87803C-0.0147001 6.91354 -0.0147001 6.91354 0.0147078 13.244C0.0352042 17.6458 0.0712958 19.7555 0.133305 20.1688C0.552591 22.9655 1.39413 25.5485 2.58983 27.7088C5.16674 32.3646 9.24196 35.8051 14.2339 37.5394C15.7725 38.0739 15.8923 38.0894 16.6963 37.8587C20.044 36.8981 23.2063 35.0219 25.7263 32.501C29.0455 29.1808 31.0489 25.1043 31.787 20.1688C31.8487 19.7565 31.885 17.6353 31.9054 13.244C31.9348 6.91354 31.9348 6.91354 31.7635 6.87803C31.6694 6.85849 31.3082 6.80501 30.9611 6.7591C29.0555 6.50734 26.6524 5.90354 24.9136 5.23957C22.3382 4.25616 19.8307 2.81575 16.784 0.569628C16.359 0.256362 15.9909 0 15.9661 0C15.9412 0 15.5036 0.304871 14.9936 0.677492Z" fill="#6745AE"></path>
                    <path fillRule="evenodd" clipRule="evenodd" d="M15.1711 4.04622C13.3964 5.33183 11.5298 6.47521 10.1901 7.09741C8.21782 8.01332 5.84718 8.70013 3.67612 8.98448C3.39176 9.02176 3.09597 9.06519 3.01885 9.08105C2.87858 9.10989 2.87858 9.10989 2.90267 14.2502C2.91946 17.8245 2.94902 19.5376 2.99981 19.8731C3.34322 22.1441 4.03249 24.2415 5.01182 25.9957C7.12243 29.7761 10.4602 32.5698 14.5489 33.9781C15.809 34.4121 15.9072 34.4247 16.5657 34.2374C19.3076 33.4574 21.8977 31.9339 23.9617 29.8869C26.6803 27.1909 28.3212 23.8808 28.9257 19.8731C28.9762 19.5384 29.0059 17.816 29.0226 14.2502C29.0467 9.10989 29.0467 9.10989 28.9065 9.08105C28.8293 9.06519 28.5336 9.02176 28.2492 8.98448C26.6884 8.78005 24.7202 8.28977 23.2961 7.75062C21.1867 6.9521 19.1329 5.78248 16.6375 3.95863C16.2894 3.70426 15.988 3.49609 15.9676 3.49609C15.9472 3.49609 15.5888 3.74365 15.1711 4.04622Z" fill="#976EEE"></path>
                    <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontWeight="700" fill="#fff" fontSize="1.1em">LV</text>
                  </svg>
                </div>
                <span className="new_bodyMBold" style={{ color: 'rgb(151, 110, 238)' }}>{level}</span>
              </div>
            </button>
          </div>

          {/* Coins */}
          <button 
            className="MuiBox-root knowt-3peil5"
            onClick={() => navigate('/dashboard/store')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(254, 153, 35, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img alt="your coins" width="20" height="20" decoding="async" data-nimg="1" src="https://s3.amazonaws.com/knowt-generic-storage/gamification/coin-icon.svg" style={{ color: 'transparent' }} />
              <span className="new_bodyMBold" style={{ color: 'rgb(254, 153, 35)' }}>{coins}</span>
            </div>
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Profile Avatar - Links to profile page */}
          <button
            onClick={() => navigate('/dashboard/profile')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: profile?.avatar_url ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 12,
              fontWeight: 700,
              border: '2px solid var(--border)',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--tt-brand-color-500)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile?.full_name?.slice(0, 1).toUpperCase() || 'U'
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Pill Toggle Tabs - Centered */}
      {showTabs && tabs.length > 0 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          marginBottom: 48,
          marginTop: 32
        }}>
          <div style={{
            display: 'flex',
            background: '#f1f5f9', 
            borderRadius: 12, 
            padding: 4,
            gap: 4
          }}>
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => onTabChange && onTabChange(tab.id)}
                style={{
                  padding: '10px 24px',
                  background: activeTab === tab.id ? tab.activeColor || '#8b5cf6' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : '#64748b',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: "'Outfit', sans-serif"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default Header
