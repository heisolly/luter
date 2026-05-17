import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { CircleNotch, ArrowsClockwise, Pulse } from '@phosphor-icons/react'

function formatTs(s) {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString()
  } catch {
    return String(s)
  }
}

export default function AdminActivity() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const fiveAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data, error: e } = await supabase
      .from('profiles')
      .select('id, full_name, university, last_active_at')
      .gt('last_active_at', fiveAgo)
      .order('last_active_at', { ascending: false })
      .limit(100)

    if (e) setError(e.message)
    setRows(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [load])

  return (
    <>
      <h1 className="adm-page-title">Live activity</h1>
      <p className="adm-page-desc">Profiles with heartbeat in the last 5 minutes. Refreshes every 30s.</p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-card">
        <div className="adm-toolbar">
          <span className="adm-muted" style={{ fontWeight: 600 }}>
            {rows.length} active
          </span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={load}>
            <ArrowsClockwise size={16} /> Refresh now
          </button>
        </div>
        <div className="adm-table-wrap">
          {loading ? (
            <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
              <CircleNotch className="animate-spin" color="#7a12cc" />
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Scholar</th>
                  <th>University</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/users/${r.id}`} className="adm-link" style={{ fontWeight: 700 }}>
                        {r.full_name || '—'}
                      </Link>
                    </td>
                    <td>{r.university || '—'}</td>
                    <td className="adm-pill adm-pill--ok">{formatTs(r.last_active_at)}</td>
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
