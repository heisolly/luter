import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { SignOut, House } from '@phosphor-icons/react'
import { LANDING_URL, DASHBOARD_URL } from '../../utils/urlUtils'

export default function AdminSettings() {
  const { email, profile } = useOutletContext()
  const navigate = useNavigate()

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = LANDING_URL
  }

  return (
    <>
      <h1 className="adm-page-title">Admin settings</h1>
      <p className="adm-page-desc">Session and quick navigation. Promote additional admins from a user’s profile page.</p>

      <div className="adm-card" style={{ padding: 24, maxWidth: 520 }}>
        <div style={{ marginBottom: 20 }}>
          <div className="adm-muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Signed in
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#111' }}>{email}</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div className="adm-muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
            Profile role
          </div>
          <span className={`adm-pill ${profile?.role === 'admin' ? 'adm-pill--warn' : ''}`}>{profile?.role || 'user'}</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <a href={`${DASHBOARD_URL}/dashboard`} className="adm-btn adm-btn--ghost">
            <House size={16} /> Open student app
          </a>
          <button type="button" className="adm-btn adm-btn--primary" onClick={signOut}>
            <SignOut size={16} /> Sign out
          </button>
        </div>
      </div>
    </>
  )
}
