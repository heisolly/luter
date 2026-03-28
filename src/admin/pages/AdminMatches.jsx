import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Loader2, RefreshCw } from 'lucide-react'
import { useAdminPrefetch } from '../../context/AdminPrefetchContext'

function formatTs(s) {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString()
  } catch {
    return String(s)
  }
}

export default function AdminMatches() {
  const { ready, bundle, refresh } = useAdminPrefetch()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('matches')
      .select('*')
      .order('id', { ascending: false })
      .limit(150)

    if (e) setError(e.message)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    if (Array.isArray(bundle?.matchesList) && !bundle.matchesError) {
      setRows(bundle.matchesList)
      setLoading(false)
      return
    }
    load()
  }, [ready, bundle])

  return (
    <>
      <h1 className="adm-page-title">Matches</h1>
      <p className="adm-page-desc">Arena / duel sessions. Inspect linkage between challenger and opponent.</p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-card">
        <div className="adm-toolbar">
          <span className="adm-muted" style={{ fontWeight: 600 }}>
            {rows.length} matches
          </span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={() => { refresh(); load() }}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        <div className="adm-table-wrap">
          {!ready || loading ? (
            <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" color="#7a12cc" />
            </div>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Challenger</th>
                  <th>Opponent</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-mono" style={{ fontSize: 12 }}>
                      {r.session_id || r.id}
                    </td>
                    <td>{r.match_type || '—'}</td>
                    <td>
                      <span className="adm-pill">{r.status || '—'}</span>
                    </td>
                    <td>
                      <Link to={`/admin/users/${r.challenger_id}`} className="adm-link adm-mono">
                        {r.challenger_id?.slice(0, 8)}…
                      </Link>
                    </td>
                    <td>
                      {r.opponent_id ? (
                        <Link to={`/admin/users/${r.opponent_id}`} className="adm-link adm-mono">
                          {r.opponent_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="adm-muted">{formatTs(r.created_at)}</td>
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
