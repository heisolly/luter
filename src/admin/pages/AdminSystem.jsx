import { useOutletContext } from 'react-router-dom'

export default function AdminSystem() {
  const { email } = useOutletContext()

  const hasUrl = !!import.meta.env.VITE_SUPABASE_URL
  const hasAnon = !!import.meta.env.VITE_SUPABASE_ANON_KEY
  const hasGroq = !!import.meta.env.VITE_GROQ_API_KEY
  const adminEmails = import.meta.env.VITE_ADMIN_EMAILS || '(not set)'

  return (
    <>
      <h1 className="adm-page-title">System</h1>
      <p className="adm-page-desc">Environment checks (no secret values shown). Database policies must allow admin reads/writes.</p>

      <div className="adm-card" style={{ padding: 24, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>Client configuration</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: '#4b5563', lineHeight: 1.8, fontSize: 14 }}>
          <li>
            <strong>VITE_SUPABASE_URL</strong>:{' '}
            <span className={hasUrl ? 'adm-pill adm-pill--ok' : 'adm-pill adm-pill--warn'}>{hasUrl ? 'set' : 'missing'}</span>
          </li>
          <li>
            <strong>VITE_SUPABASE_ANON_KEY</strong>:{' '}
            <span className={hasAnon ? 'adm-pill adm-pill--ok' : 'adm-pill adm-pill--warn'}>{hasAnon ? 'set' : 'missing'}</span>
          </li>
          <li>
            <strong>VITE_GROQ_API_KEY</strong>:{' '}
            <span className={hasGroq ? 'adm-pill adm-pill--ok' : 'adm-pill adm-pill--warn'}>{hasGroq ? 'set' : 'missing'}</span>
          </li>
          <li>
            <strong>VITE_ADMIN_EMAILS</strong>: <span className="adm-mono">{adminEmails}</span>
          </li>
        </ul>
        <p className="adm-muted" style={{ marginTop: 16, marginBottom: 0 }}>
          Logged in as <strong style={{ color: '#111' }}>{email}</strong>. Bootstrap admins via allowlist until{' '}
          <code className="adm-mono">profiles.role</code> is set in the database.
        </p>
      </div>

      <div className="adm-card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800 }}>Supabase checklist</h3>
        <ol style={{ margin: 0, paddingLeft: 20, color: '#4b5563', lineHeight: 1.85, fontSize: 14 }}>
          <li>
            Run <code className="adm-mono">supabase/migrations/001_admin_rls.sql</code> in the SQL editor (adds <code className="adm-mono">role</code> column + admin policies).
          </li>
          <li>Confirm RLS policies allow your admin user to select/update rows used in this panel.</li>
          <li>Enable Realtime on <code className="adm-mono">notifications</code> if you rely on live toasts.</li>
          <li>Never expose the service role key in the browser — this admin UI uses the anon key only.</li>
        </ol>
      </div>
    </>
  )
}
