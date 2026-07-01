import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { useDashboardPrefetch } from '../../context/DashboardPrefetchContext'
import {
  House,
  Cards,
  Backpack,
  NotePencil,
  Plus,
  UploadSimple,
  GameController,
  X,
  SidebarSimple,
  ChartBar,
  GearSix,
  SignOut,
  User,
  Moon,
  Sun,
  CaretDown,
  CaretUp,
  Coin,
  ChatTeardropDots,
  Megaphone,
  Question,
  Lightning,
  ArrowRight,
} from '@phosphor-icons/react'
import './SidebarRedesign.css'
import HelperWidget from './HelperWidget'
import ArcadeOverlay from './ArcadeOverlay'
import { getCreditBalance } from '../../services/creditService'
import StreakWidget from './StreakWidget'

/* ── dark mode hook ── */
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('luter-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.body.classList.remove('dark-mode')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    
    const handleStorage = (e) => {
      if (e.key === 'luter-theme') setIsDark(e.newValue === 'dark')
    }
    const handleCustom = (e) => setIsDark(e.detail === 'dark')
    
    window.addEventListener('storage', handleStorage)
    window.addEventListener('theme-change', handleCustom)
    
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('theme-change', handleCustom)
    }
  }, [isDark])

  const setGlobalDark = (newDark) => {
    setIsDark(newDark)
    localStorage.setItem('luter-theme', newDark ? 'dark' : 'light')
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newDark ? 'dark' : 'light' }))
  }

  return [isDark, setGlobalDark]
}

/* ── active check ── */
function isNavActive(pathname, navPath) {
  if (navPath === '/home') return pathname === '/home' || pathname === '/'
  if (navPath === '/backpack') return pathname.startsWith('/backpack')
  if (navPath === '/playground') return pathname.startsWith('/playground') || pathname.startsWith('/compete')
  return pathname === navPath || pathname.startsWith(`${navPath}/`)
}

/* ── colour for course dot ── */
const COURSE_COLORS = ['#C4B5FD','#98FF98','#FFD2A6','#93C5FD','#FCA5A5','#86EFAC','#FCD34D']
const courseColor = (i) => COURSE_COLORS[i % COURSE_COLORS.length]

function toArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.data)) return value.data
  if (value && typeof value === 'object') return Object.values(value)
  return []
}

/* ═══════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════ */
export default function DashboardSidebar({
  collapsed,
  user,
  isMobile,
  onClose,
  onNavigate,
  hideToggle,
}) {
  const { bundle } = useDashboardPrefetch()
  const location   = useLocation()
  const navigate   = useNavigate()
  const pathname   = location.pathname

  const [isDark, setIsDark]                 = useDarkMode()
  const [showPersonal, setShowPersonal]     = useState(false)
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [backpackOpen, setBackpackOpen]     = useState(
    () => pathname.startsWith('/backpack')
  )
  const [helperOverlay, setHelperOverlay]   = useState(null) // 'feedback' | 'changelog' | 'help' | null
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [creditsBalance, setCreditsBalance] = useState(Infinity)

  // Fetch real credit balance
  useEffect(() => {
    if (!user?.id) return
    getCreditBalance(user.id).then(b => {
      if (typeof b === 'number') setCreditsBalance(b)
    }).catch(() => {})
  }, [user?.id])

  // Close coming soon modal on Escape
  useEffect(() => {
    if (!showComingSoon) return
    const handler = (e) => { if (e.key === 'Escape') setShowComingSoon(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showComingSoon])

  const personalRef = useRef(null)
  const profileBtnRef = useRef(null)
  const quickCreateRef = useRef(null)

  /* close personal dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        personalRef.current &&
        !personalRef.current.contains(e.target) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(e.target)
      ) {
        setShowPersonal(false)
      }
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target)) {
        setShowQuickCreate(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  /* profile data */
  const profile        = bundle?.profile?.data || bundle?.profile
  const displayName    = profile?.full_name?.split(' ')[0] || 'Scholar'
  const displayUser    = profile?.username ? `@${profile.username}` : displayName
  const initials       = (profile?.username?.slice(0, 2) || profile?.full_name?.slice(0, 2) || 'SC').toUpperCase()
  const credits        = typeof creditsBalance === 'number' ? creditsBalance : profile?.credits ?? 20000

  const tier    = (profile?.subscription_tier || profile?.subscription_type || 'free').toLowerCase()
  const hasPremiumCredits = creditsBalance >= 2000;
  const isPaid  = tier === 'premium' || tier === 'pro' || tier === 'beast' || hasPremiumCredits
  const tierLabel = tier === 'premium' ? 'Executive Plan' : tier === 'pro' || hasPremiumCredits ? 'Pro Plan' : 'Free Plan'

  /* courses from prefetch */
  const userCourses = toArray(bundle?.uc)
    .filter(uc => uc && !uc.is_archived)
    .slice(0, 8) // show max 8 in sidebar

  /* helpers */
  const go = (path) => {
    navigate(path)
    onNavigate?.()
    setShowPersonal(false)
    setShowQuickCreate(false)
    setSelectedOption(null)
  }

  const CREATE_OPTIONS = [
    { id: 'note',    emoji: '📝', title: 'New Note',    desc: 'Write and organize your thoughts',  path: '/notes?new=1' },
    { id: 'upload',  emoji: '📄', title: 'Upload PDF',  desc: 'Study from any document',           path: '/upload' },
    { id: 'folder',  emoji: '📁', title: 'New Folder',  desc: 'Organize files into folders',       path: '/backpack?new=1' },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isBackpackActive = isNavActive(pathname, '/backpack')

  return (
    <aside className={`dsb-redesign${collapsed ? ' collapsed' : ''}`}>

      {/* ── Logo ── */}
      <div className="dsb-logo-area">
        <img
          src="/Header logo.png"
          alt="Luter"
          className="dsb-logo-img"
          style={{ height: collapsed ? 28 : 34 }}
          onError={(e) => {
            e.target.style.display = 'none'
            if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'
          }}
        />
        <span style={{
          display: 'none', fontWeight: 900, fontSize: 22,
          color: '#7a12cc', fontFamily: 'DM Sans, Inter, sans-serif'
        }}>
          Luter
        </span>

        {!collapsed && <StreakWidget userId={session?.user?.id} isDark={isDark} />}

        {isMobile ? (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-muted)', padding: 4 }}
            onClick={onClose}
          >
            <X size={20} weight="bold" />
          </button>
        ) : !hideToggle && !collapsed && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sb-muted)', padding: 4 }}
            onClick={onClose}
            title="Collapse sidebar"
          >
            <SidebarSimple size={20} weight="bold" />
          </button>
        )}
      </div>

      <div className="dsb-quick-create-wrap" ref={quickCreateRef}>
        <button
          className={`dsb-quick-create${showQuickCreate ? ' active' : ''}`}
          onClick={() => setShowQuickCreate(v => !v)}
          title="New"
        >
          <Plus size={18} weight="bold" />
          {!collapsed && <span>New</span>}
        </button>
      </div>

      {showQuickCreate && createPortal(
        <div className="dsb-create-overlay" onClick={() => { setShowQuickCreate(false); setSelectedOption(null) }}>
          <div className="dsb-create-modal" onClick={e => e.stopPropagation()}>
            <p className="dsb-create-modal-title">What do you want to create?</p>
            <p className="dsb-create-modal-subtitle">Pick an option to get started</p>

            <div className="dsb-create-options">
              {CREATE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`dsb-create-option${selectedOption === opt.id ? ' selected' : ''}`}
                  onClick={() => setSelectedOption(opt.id)}
                >
                  <div className="dsb-create-option-icon">{opt.emoji}</div>
                  <div className="dsb-create-option-text">
                    <span className="dsb-create-option-title">{opt.title}</span>
                    <span className="dsb-create-option-desc">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="dsb-create-continue-btn"
              disabled={!selectedOption}
              onClick={() => {
                const opt = CREATE_OPTIONS.find(o => o.id === selectedOption)
                if (opt) go(opt.path)
              }}
            >
              Continue
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ── Main Nav ── */}
      <nav className="dsb-nav-list" aria-label="Main navigation">

        {/* Home */}
        <button
          id="nav-home"
          className={`dsb-nav-pill${isNavActive(pathname, '/home') ? ' active' : ''}`}
          onClick={() => go('/home')}
        >
          <div className="dsb-icon">
            <House size={21} weight="regular" />
          </div>
          {!collapsed && <span className="dsb-nav-label">Home</span>}
        </button>



        {/* Notes */}
        <button
          id="nav-notes"
          className={`dsb-nav-pill${isNavActive(pathname, '/notes') || isNavActive(pathname, '/notes') ? ' active' : ''}`}
          onClick={() => go('/notes')}
        >
          <div className="dsb-icon">
            <NotePencil size={21} weight="regular" />
          </div>
          {!collapsed && <span className="dsb-nav-label">Notes</span>}
        </button>

        {/* AI Chat */}
        <button
          id="nav-ai-chat"
          className={`dsb-nav-pill${isNavActive(pathname, '/ai-chat') ? ' active' : ''}`}
          onClick={() => go('/ai-chat')}
          title="Luter AI Chat"
        >
          <div className="dsb-icon">
            <ChatTeardropDots size={21} weight="regular" />
          </div>
          {!collapsed && <span className="dsb-nav-label">AI Chat</span>}
        </button>

        {/* My Decks */}
        <button
          id="nav-decks"
          className={`dsb-nav-pill${isNavActive(pathname, '/decks') ? ' active' : ''}`}
          onClick={() => go('/decks')}
        >
          <div className="dsb-icon">
            <Cards size={21} weight="regular" />
          </div>
          {!collapsed && <span className="dsb-nav-label">My Decks</span>}
        </button>

        {/* ── Backpack (with inline dropdown) ── */}
        {!collapsed ? (
          <div>
            {/* Backpack pill row */}
            <div className="dsb-backpack-row">
              <button
                id="nav-backpack"
                className={`dsb-nav-pill dsb-backpack-pill${isBackpackActive ? ' active' : ''}`}
                onClick={() => go('/backpack')}
              >
                <div className="dsb-icon">
                  <Backpack size={21} weight="regular" />
                </div>
                <span className="dsb-nav-label">Backpack</span>
              </button>
              <button
                className={`dsb-backpack-caret-btn${isBackpackActive ? ' active-area' : ''}`}
                onClick={() => setBackpackOpen(o => !o)}
                title={backpackOpen ? 'Collapse folders' : 'Show folders'}
              >
                <CaretDown
                  size={14}
                  weight="bold"
                  className={`dsb-caret-icon${backpackOpen ? ' open' : ''}`}
                />
              </button>
            </div>

            {/* Folders sub-nav */}
            <div className={`dsb-subnav${backpackOpen ? ' open' : ''}`}>
              <div className="dsb-subnav-inner">
                {userCourses.length === 0 ? (
                  <span className="dsb-subnav-empty">No folders yet</span>
                ) : (
                  userCourses.map((uc, i) => {
                    const course = uc.courses || {}
                    const courseId = course.id || uc.course_id
                    const coursePath = `/backpack/${courseId}`
                    const isActive = pathname.startsWith(coursePath)
                    const name = uc.custom_name || course.name || 'Untitled'
                    const code = course.code || ''
                    const isCustomFolder = code.startsWith('FOLDER_')

                    return (
                      <button
                        key={uc.id || courseId || `${name}-${i}`}
                        className={`dsb-subnav-item${isActive ? ' active' : ''}`}
                        onClick={() => go(coursePath)}
                        title={name}
                      >
                        <span
                          className="dsb-subnav-dot"
                          style={{ 
                            background: isActive 
                              ? '#7a12cc' 
                              : isCustomFolder 
                                ? (i % 2 === 0 ? '#98FF98' : '#FFD2A6') 
                                : '#C4B5FD' 
                          }}
                        />
                        <span className="dsb-subnav-label">{name}</span>
                        {!isCustomFolder && code && <span className="dsb-subnav-code">{code}</span>}
                      </button>
                    )
                  })
                )}

                {/* View All link */}
                <button
                  className="dsb-subnav-view-all"
                  onClick={() => go('/backpack')}
                >
                  <ArrowRight size={13} weight="bold" />
                  View all
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed — just show icon */
          <button
            id="nav-backpack"
            className={`dsb-nav-pill${isBackpackActive ? ' active' : ''}`}
            onClick={() => go('/backpack')}
            title="Backpack"
          >
            <div className="dsb-icon">
              <Backpack size={21} weight="regular" />
            </div>
          </button>
        )}

        {/* Arcade */}
        <button
          id="nav-arcade"
          className={`dsb-nav-pill${showComingSoon ? ' active arcade-pill' : ''}`}
          onClick={() => setShowComingSoon(true)}
        >
          <div className="dsb-icon">
            <GameController size={21} weight={showComingSoon ? 'fill' : 'regular'} />
          </div>
          {!collapsed && <span className="dsb-nav-label">Arcade</span>}
        </button>

      </nav>

      {/* ── Helper Icons ── */}
      {!collapsed && (
        <div className="dsb-helper-row">
          <button
            className={`dsb-helper-btn${helperOverlay === 'feedback' ? ' active-helper' : ''}`}
            data-tooltip="Send Feedback"
            onClick={() => setHelperOverlay(v => v === 'feedback' ? null : 'feedback')}
          >
            <ChatTeardropDots size={21} weight={helperOverlay === 'feedback' ? 'fill' : 'regular'} />
          </button>
          <button
            className={`dsb-helper-btn${helperOverlay === 'changelog' ? ' active-helper' : ''}`}
            data-tooltip="What's New"
            onClick={() => setHelperOverlay(v => v === 'changelog' ? null : 'changelog')}
          >
            <Megaphone size={21} weight={helperOverlay === 'changelog' ? 'fill' : 'regular'} />
          </button>
          <button
            className={`dsb-helper-btn${helperOverlay === 'help' ? ' active-helper' : ''}`}
            data-tooltip="Help & Support"
            onClick={() => setHelperOverlay(v => v === 'help' ? null : 'help')}
          >
            <Question size={21} weight={helperOverlay === 'help' ? 'fill' : 'regular'} />
          </button>
        </div>
      )}

      {/* ── Personal Section ── */}
      <div className="dsb-personal-section">

        {/* Credits */}
        {!collapsed && (
          <div className="dsb-credits-row">
            <div className="dsb-credits-info">
              <span className="dsb-credits-label">AI Credits</span>
              <span className="dsb-credits-sub">Resets daily</span>
            </div>
            <div className="dsb-credits-badge">
              <Coin size={16} weight="fill" />
              {credits.toLocaleString()}
            </div>
          </div>
        )}

        {/* Upgrade */}
        {!collapsed && !isPaid && (
          <button className="dsb-upgrade-btn" onClick={() => go('/upgrade')}>
            <Lightning size={18} weight="fill" />
            <span>Upgrade</span>
          </button>
        )}

        {/* Profile Card */}
        <button
          ref={profileBtnRef}
          className="dsb-profile-card"
          onClick={() => setShowPersonal(p => !p)}
          aria-expanded={showPersonal}
        >
          <div className="dsb-avatar-circle">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : initials}
          </div>
          {!collapsed && (
            <>
              <div className="dsb-profile-info">
                <span className="dsb-profile-name">{displayUser}</span>
                <span className="dsb-profile-handle">{tierLabel}</span>
              </div>
              <CaretUp
                size={14}
                weight="bold"
                className={`dsb-profile-caret${showPersonal ? ' open' : ''}`}
              />
            </>
          )}
        </button>

        {/* ── Personal Dropdown — position:fixed, won't clip ── */}
        {showPersonal && !collapsed && (
          <div className="dsb-personal-dropdown" ref={personalRef}>

            <div className="dsb-dropdown-header">
              <span className="dsb-dropdown-tier">{tierLabel}</span>
              <div className="dsb-dropdown-credits-row">
                <div>
                  <span className="dsb-dropdown-credits-label">AI Credits</span>
                  <span className="dsb-dropdown-credits-sub">Resets daily</span>
                </div>
                <div className="dsb-dropdown-credits-badge">
                  <Coin size={14} weight="fill" />
                  {credits.toLocaleString()}
                </div>
              </div>
              {!isPaid && (
                <button className="dsb-dropdown-upgrade" onClick={() => go('/upgrade')}>
                  <Lightning size={15} weight="fill" />
                  Upgrade
                </button>
              )}
            </div>

            <div className="dsb-dropdown-body">
              <button className="dsb-dropdown-item" onClick={() => go('/profile')}>
                <span className="dsb-dropdown-item-icon"><User size={16} /></span>
                Profile
              </button>
              <button className="dsb-dropdown-item" onClick={() => go('/progress')}>
                <span className="dsb-dropdown-item-icon"><ChartBar size={16} /></span>
                My Progress
              </button>
              <button className="dsb-dropdown-item" onClick={() => go('/settings')}>
                <span className="dsb-dropdown-item-icon"><GearSix size={16} /></span>
                Settings
              </button>

              <div className="dsb-dropdown-divider" />

              {/* Dark Mode Toggle */}
              <div
                className="dsb-toggle-row"
                onClick={() => setIsDark(d => !d)}
              >
                <span className="dsb-dropdown-item-icon" style={{ color: 'var(--sb-text-muted)' }}>
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </span>
                <span className="dsb-toggle-label">Dark Mode</span>
                <label className="dsb-toggle-switch" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isDark}
                    onChange={e => setIsDark(e.target.checked)}
                  />
                  <span className="dsb-toggle-track" />
                </label>
              </div>

              <div className="dsb-dropdown-divider" />

              <button className="dsb-dropdown-item danger" onClick={handleSignOut}>
                <span className="dsb-dropdown-item-icon"><SignOut size={16} /></span>
                Sign Out
              </button>
            </div>
          </div>
        )}

      </div>
      {/* ── Help Widget ── */}
      <HelperWidget
        type={helperOverlay}
        onClose={() => setHelperOverlay(null)}
      />

      {/* ── Coming Soon Modal ── */}
      {showComingSoon && createPortal(
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            background: 'rgba(11, 9, 20, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={() => setShowComingSoon(false)}
        >
          <div 
            style={{
              width: '90%',
              maxWidth: 400,
              background: 'var(--arcade-card-bg, #ffffff)',
              border: '2px solid var(--arcade-card-border, #C4B5FD)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
              borderRadius: 24,
              padding: '32px 24px',
              textAlign: 'center',
              position: 'relative',
              fontFamily: "'Outfit', 'Inter', sans-serif"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div 
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 20px',
                borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12), rgba(59, 130, 246, 0.12))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
                boxShadow: '0 8px 24px rgba(124, 58, 237, 0.15)'
              }}
            >
              <GameController size={32} weight="duotone" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--arcade-text-primary, #0f172a)', margin: '0 0 10px 0' }}>
              Luter Arcade
            </h2>
            <div 
              style={{
                display: 'inline-block',
                background: '#f5f3ff',
                color: '#7c3aed',
                padding: '4px 14px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 800,
                marginBottom: 16,
                border: '1px solid #ede9fe'
              }}
            >
              COMING SOON
            </div>
            <p style={{ fontSize: 14, color: 'var(--arcade-text-muted, #64748b)', margin: '0 0 24px 0', lineHeight: 1.6, fontWeight: 500 }}>
              The ultimate learning arena is currently undergoing construction. Get ready for active recall battles, social deduction games, and daily quests soon!
            </p>
            <button 
              onClick={() => setShowComingSoon(false)}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 14,
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: 'white',
                fontSize: 15,
                fontWeight: 850,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.25)',
                fontFamily: 'inherit',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              Awesome
            </button>
          </div>
        </div>,
        document.body
      )}

    </aside>
  )
}
