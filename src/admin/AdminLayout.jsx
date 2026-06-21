import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CircleNotch, List, X, ShieldWarning, Sun, Moon } from '@phosphor-icons/react'
import { isAdminUser } from './adminAuth'
import AdminSidebar from './AdminSidebar'
import AdminChatPanel from './AdminChatPanel'
import { AdminPrefetchProvider } from '../context/AdminPrefetchContext'
import './admin.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Dark mode state matching standard Luter dark theme handling
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
  }, [isDark])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('luter-theme', newDark ? 'dark' : 'light')
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newDark ? 'dark' : 'light' }))
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated')
    setIsAuthenticated(false)
    setPassword('')
  }

  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('admin_authenticated')
    if (sessionAuth === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const getCurrentPageLabel = () => {
    const path = location.pathname.replace(/^\/(admin)?\/?/, '')
    if (!path) return 'Overview'
    if (path.startsWith('users')) return 'Users'
    if (path.startsWith('courses')) return 'Courses'
    if (path.startsWith('syllabus')) return 'Syllabus Manager'
    if (path.startsWith('audit')) return 'Health Audit'
    if (path.startsWith('notifications')) return 'Notifications'
    if (path.startsWith('activity')) return 'Live Activity'
    return 'Dashboard'
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--adm-bg, #fafafa)' }}>
        <CircleNotch className="animate-spin" size={32} color="var(--adm-accent, #c4b5fd)" />
      </div>
    )
  }

  if (!isAuthenticated) {
    const handleLogin = (e) => {
      e.preventDefault()
      setAuthError(false)
      if (password === '242424') {
        setIsAuthenticated(true)
        sessionStorage.setItem('admin_authenticated', 'true')
      } else {
        setAuthError(true)
      }
    }

    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--adm-bg, #fafafa)', padding: 20, fontFamily: 'Outfit, sans-serif' }}>
        <form onSubmit={handleLogin} style={{ background: 'var(--adm-surface, #fff)', padding: '36px 32px', borderRadius: 20, border: '1px solid var(--adm-border, #e5e7eb)', width: '100%', maxWidth: 400, boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: '50%', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <ShieldWarning size={32} color="#ef4444" />
            </div>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: 'var(--adm-text, #0f172a)', letterSpacing: '-0.02em' }}>Admin Access</h2>
          <p style={{ fontSize: 14, color: 'var(--adm-text-secondary, #475569)', textAlign: 'center', marginBottom: 24 }}>Enter admin password to continue</p>
          
          <input
            type="password"
            autoFocus
            placeholder="Enter password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setAuthError(false)
            }}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: 12, 
              border: `1.5px solid ${authError ? '#ef4444' : 'var(--adm-border, #e5e7eb)'}`,
              background: 'var(--adm-bg, #fafafa)',
              color: 'var(--adm-text, #0f172a)',
              fontSize: 16,
              marginBottom: 16,
              outline: 'none',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
          />

          {authError && (
            <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 16, fontWeight: 600 }}>Invalid password. Please try again.</p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              background: 'var(--adm-mint, #98ff98)',
              color: '#14532d',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s ease'
            }}
          >
            Access Dashboard
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="adm-root">
      <div
        className={`adm-overlay ${mobileOpen ? 'adm-overlay--visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden
      />

      <aside className={`adm-sidebar ${mobileOpen ? 'adm-sidebar--open' : ''}`}>
        <AdminSidebar onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="adm-mobile-bar">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', display: 'flex', color: 'var(--adm-text)' }}
          aria-label="Open menu"
        >
          <List size={22} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--adm-text)' }}>Luter Admin</span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={toggleTheme}
            style={{ background: 'none', border: 'none', padding: 6, cursor: 'pointer', color: 'var(--adm-text-secondary)', display: 'flex' }}
            title="Toggle Theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      <div className="adm-main">
        <header className="adm-header">
          <div className="adm-header-left">
            <span className="adm-breadcrumb">Admin</span>
            <span className="adm-breadcrumb-separator">/</span>
            <span className="adm-breadcrumb-active">{getCurrentPageLabel()}</span>
          </div>
          <div className="adm-header-right">
            <div className="adm-header-status">
              <span className="adm-status-dot" />
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.01em' }}>System Live</span>
            </div>

            <button type="button" onClick={toggleTheme} className="adm-header-action" title="Toggle Theme">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <main className="adm-main-inner">
          <AdminPrefetchProvider>
            <Outlet context={{ isAuthenticated }} />
          </AdminPrefetchProvider>
        </main>
      </div>

      <AdminChatPanel />
    </div>
  )
}
