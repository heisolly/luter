import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Loader2, RefreshCw } from 'lucide-react'
import { useAdminPrefetch } from '../../context/AdminPrefetchContext'

export default function AdminEnrollments() {
  const { ready, bundle, refresh } = useAdminPrefetch()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    const { data, error: e } = await supabase
      .from('user_courses')
      .select(
        `
        id,
        progress,
        target_score,
        user_id,
        course_id,
        courses (code, name, faculty)
      `
      )
      .order('id', { ascending: false })
      .limit(200)

    if (e) setError(e.message)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <h1 className="adm-page-title">Enrollments</h1>
      <p className="adm-page-desc">Latest user ↔ course links (up to 200 rows).</p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-card">
        <div className="adm-toolbar">
          <span className="adm-muted" style={{ fontWeight: 600 }}>
            {rows.length} rows
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
                  <th>Student (user id)</th>
                  <th>Course</th>
                  <th>Progress</th>
                  <th>Target</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link to={`/admin/users/${r.user_id}`} className="adm-link adm-mono">
                        {r.user_id?.slice(0, 13)}…
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.courses?.code || '—'}</div>
                      <div className="adm-muted">{r.courses?.name || ''}</div>
                    </td>
                    <td>{r.progress ?? 0}%</td>
                    <td>{r.target_score ?? '—'}</td>
                    <td>
                      <Link to={`/admin/users/${r.user_id}`} className="adm-link">
                        Profile
                      </Link>
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
