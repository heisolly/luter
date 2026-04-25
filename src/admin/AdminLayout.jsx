import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { RiLoader4Line as Loader2, RiMenuLine as Menu, RiCloseLine as X, RiShieldFlashFill as ShieldAlert } from 'react-icons/ri'
import { isAdminUser } from './adminAuth'
import AdminSidebar from './AdminSidebar'
import { AdminPrefetchProvider } from '../context/AdminPrefetchContext'
import './admin.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [email, setEmail] = useState('')
  const [allowed, setAllowed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState(false)
  const [passVerified, setPassVerified] = useState(sessionStorage.getItem('luter_admin_session') === '242424')

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        setLoading(false)
        navigate(`/signin?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true })
        return
      }

      const u = session.user
      const em = u.email || ''
      setUser(u)
      setEmail(em)

      const { data: prof } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()

      if (cancelled) return
      setProfile(prof || {})

      const ok = isAdminUser(prof, em)
      setAllowed(ok)
      setLoading(false)

      if (!ok) {
        navigate('/dashboard', { replace: true })
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate, location.pathname, location.search])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <Loader2 className="animate-spin" size={32} color="#7a12cc" />
      </div>
    )
  }

  if (!allowed) {
    return null
  }

  // Password gate
  if (!passVerified) {
    const handleVerify = (e) => {
      e.preventDefault()
      if (passInput === '242424') {
        setPassVerified(true)
        sessionStorage.setItem('luter_admin_session', '242424')
      } else {
        setPassError(true)
      }
    }

    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f5', padding: 20 }}>
        <form onSubmit={handleVerify} style={{ background: '#fff', padding: '32px', borderRadius: 12, border: '1px solid #e4e4e7', width: '100%', maxWidth: 400, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ background: '#fef2f2', padding: 12, borderRadius: '50%' }}>
              <ShieldAlert size={32} color="#dc2626" />
            </div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: '#18181b' }}>Admin Access</h2>
          <p style={{ fontSize: 14, color: '#71717a', textAlign: 'center', marginBottom: 24 }}>Enter the restricted password to continue</p>
          
          <input
            type="password"
            autoFocus
            placeholder="••••••"
            value={passInput}
            onChange={(e) => {
              setPassInput(e.target.value)
              setPassError(false)
            }}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: `2px solid ${passError ? '#dc2626' : '#e4e4e7'}`,
              fontSize: 16,
              marginBottom: 16,
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />

          {passError && (
            <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', marginBottom: 16, fontWeight: 600 }}>Incorrect password. Try again.</p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              background: '#18181b',
              color: '#fff',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
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
          style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', display: 'flex' }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>Luter Admin</span>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? 'auto' : 'none' }}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      <main className="adm-main">
        <div className="adm-main-inner">
          <AdminPrefetchProvider>
            <Outlet context={{ user, profile, email }} />
          </AdminPrefetchProvider>
        </div>
      </main>
    </div>
  )
}
