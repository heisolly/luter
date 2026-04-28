import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { CircleNotch, ArrowsClockwise, PaperPlaneTilt } from '@phosphor-icons/react'
import { useAdminPrefetch } from '../../context/AdminPrefetchContext'

function formatTs(s) {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString()
  } catch {
    return String(s)
  }
}

export default function AdminNotifications() {
  const { ready, bundle, refresh } = useAdminPrefetch()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    user_id: '',
    type: 'admin_broadcast',
    title: '',
    body: '',
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase.from('notifications').select('*').order('id', { ascending: false }).limit(100)
    if (e) setError(e.message)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    if (Array.isArray(bundle?.notificationsList) && !bundle.notificationsError) {
      setRows(bundle.notificationsList)
      setLoading(false)
      return
    }
    load()
  }, [ready, bundle])

  const send = async (e) => {
    e.preventDefault()
    if (!form.user_id.trim() || !form.title.trim()) return
    setSending(true)
    setError(null)
    const { error: err } = await supabase.from('notifications').insert({
      user_id: form.user_id.trim(),
      type: form.type.trim() || 'admin_broadcast',
      title: form.title.trim(),
      body: form.body.trim() || null,
    })
    if (err) setError(err.message)
    else {
      setForm((f) => ({ ...f, title: '', body: '' }))
      await refresh()
      await load()
    }
    setSending(false)
  }

  return (
    <>
      <h1 className="adm-page-title">Notifications</h1>
      <p className="adm-page-desc">
        Insert rows into <code className="adm-mono">notifications</code>. The student app can subscribe via Realtime (same as match invites).
      </p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Send to user</h3>
        <form onSubmit={send} style={{ display: 'grid', gap: 12 }}>
          <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
            Target user ID (UUID)
            <input
              className="adm-input"
              style={{ width: '100%', marginTop: 6, maxWidth: 480 }}
              value={form.user_id}
              onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              required
            />
          </label>
          <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
            Type
            <input
              className="adm-input"
              style={{ width: '100%', marginTop: 6, maxWidth: 320 }}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
          </label>
          <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
            Title
            <input
              className="adm-input"
              style={{ width: '100%', marginTop: 6 }}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
          </label>
          <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
            Body
            <textarea
              className="adm-input"
              style={{ width: '100%', marginTop: 6, minHeight: 88, resize: 'vertical' }}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            />
          </label>
          <div>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={sending}>
              <PaperPlaneTilt size={16} /> Insert notification
            </button>
          </div>
        </form>
      </div>

      <div className="adm-card">
        <div className="adm-toolbar">
          <span className="adm-muted" style={{ fontWeight: 600 }}>
            Recent notifications
          </span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={() => { refresh(); load() }}>
            <ArrowsClockwise size={16} /> Refresh
          </button>
        </div>
        <div className="adm-table-wrap">
          {!ready || loading ? (
            <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
              <CircleNotch className="animate-spin" color="#7a12cc" />
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Title</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-muted">{formatTs(r.created_at)}</td>
                    <td>
                      <Link to={`/admin/users/${r.user_id}`} className="adm-link adm-mono">
                        {r.user_id?.slice(0, 8)}…
                      </Link>
                    </td>
                    <td>{r.type}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.title}</div>
                      {r.body && <div className="adm-muted" style={{ fontSize: 12, marginTop: 4 }}>{r.body}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
