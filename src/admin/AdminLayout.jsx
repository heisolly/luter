import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { CircleNotch, List, X, ShieldWarning, SignOut } from '@phosphor-icons/react'
import { isAdminUser } from './adminAuth'
import AdminSidebar from './AdminSidebar'
import { AdminPrefetchProvider } from '../context/AdminPrefetchContext'
import './admin.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [adminUser, setAdminUser] = useState(null)
  const [allowed, setAllowed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [credential, setCredential] = useState('')
  const [authError, setAuthError] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleLogout = async () => {
    if (adminUser) {
      // Log admin logout
      await supabase.rpc('log_standalone_admin_activity', {
        admin_user_id: adminUser.admin_id,
        action_param: 'logout',
        resource_type_param: 'admin_session',
        resource_id_param: null,
        old_values_param: null,
        new_values_param: null,
        metadata_param: null,
        ip_address_param: null,
        user_agent_param: navigator.userAgent,
        session_id_param: null
      })
    }
    
    // Clear session and state
    sessionStorage.removeItem('standalone_admin_auth')
    setAdminUser(null)
    setIsAuthenticated(false)
    setAllowed(false)
    setUsername('')
    setCredential('')
  }

  useEffect(() => {
    // Check if admin is already authenticated in this session
    const sessionAuth = sessionStorage.getItem('standalone_admin_auth')
    if (sessionAuth) {
      try {
        const authData = JSON.parse(sessionAuth)
        setAdminUser(authData)
        setIsAuthenticated(true)
        setAllowed(true)
        setLoading(false)
        return
      } catch (error) {
        sessionStorage.removeItem('standalone_admin_auth')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Cleanup effect to prevent orphaned locks
  useEffect(() => {
    return () => {
      // Cleanup any pending auth operations when component unmounts
      // This helps prevent the lock warning in React Strict Mode
    }
  }, [])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <CircleNotch className="animate-spin" size={32} color="#7a12cc" />
      </div>
    )
  }

  // Admin authentication gate
  if (!isAuthenticated) {
    const handleLogin = async (e) => {
      e.preventDefault()
      setAuthError(false)
      
      try {
        // Verify standalone admin credentials
        const { data, error } = await supabase.rpc('verify_standalone_admin_credential', {
          username_param: username,
          credential_param: credential
        })
        
        if (error) {
          console.error('Error verifying admin credentials:', error)
          setAuthError(true)
          return
        }
        
        if (data && data.length > 0 && data[0].is_valid) {
          const adminData = data[0]
          setAdminUser(adminData)
          setIsAuthenticated(true)
          setAllowed(true)
          
          // Store in session
          sessionStorage.setItem('standalone_admin_auth', JSON.stringify(adminData))
          
          // Update last login time
          await supabase.from('admin_users').update({
            last_login: new Date().toISOString()
          }).eq('id', adminData.admin_id)
          
          // Log admin login
          await supabase.rpc('log_standalone_admin_activity', {
            admin_user_id: adminData.admin_id,
            action_param: 'login',
            resource_type_param: 'admin_session',
            resource_id_param: null,
            old_values_param: null,
            new_values_param: null,
            metadata_param: null,
            ip_address_param: null,
            user_agent_param: navigator.userAgent,
            session_id_param: null
          })
        } else {
          setAuthError(true)
        }
      } catch (error) {
        console.error('Error during admin authentication:', error)
        setAuthError(true)
      }
    }

    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f4f5', padding: 20 }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '32px', borderRadius: 12, border: '1px solid #e4e4e7', width: '100%', maxWidth: 400, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{ background: '#fef2f2', padding: 12, borderRadius: '50%' }}>
              <ShieldWarning size={32} color="#dc2626" />
            </div>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, textAlign: 'center', marginBottom: 8, color: '#18181b' }}>Admin Access</h2>
          <p style={{ fontSize: 14, color: '#71717a', textAlign: 'center', marginBottom: 24 }}>Enter your admin credentials to continue</p>
          
          <input
            type="text"
            autoFocus
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value)
              setAuthError(false)
            }}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: `2px solid ${authError ? '#dc2626' : '#e4e4e7'}`,
              fontSize: 16,
              marginBottom: 12,
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />
          
          <input
            type="password"
            placeholder="Credential"
            value={credential}
            onChange={(e) => {
              setCredential(e.target.value)
              setAuthError(false)
            }}
            style={{ 
              width: '100%', 
              padding: '12px 16px', 
              borderRadius: 8, 
              border: `2px solid ${authError ? '#dc2626' : '#e4e4e7'}`,
              fontSize: 16,
              marginBottom: 16,
              outline: 'none',
              transition: 'all 0.2s'
            }}
          />

          {authError && (
            <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', marginBottom: 16, fontWeight: 600 }}>Invalid username or credential. Please try again.</p>
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
          <List size={22} />
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
          <Outlet context={{ adminUser, isAuthenticated }} />
        </div>
      </main>
    </div>
  )
}
