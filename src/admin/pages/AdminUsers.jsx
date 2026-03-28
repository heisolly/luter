import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Search, Loader2, Download } from 'lucide-react'
import { useAdminPrefetch } from '../../context/AdminPrefetchContext'

const PAGE = 25

function formatTs(s) {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString()
  } catch {
    return s
  }
}

export default function AdminUsers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const fetchPage = async (pageIndex) => {
    setLoading(true)
    setError(null)
    const from = pageIndex * PAGE
    const to = from + PAGE - 1

    const { data, error: err, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('last_active_at', { ascending: false })
      .range(from, to)

    if (err) {
      setError(err.message)
      setRows([])
      setTotal(0)
    } else {
      setRows(data || [])
      setTotal(count ?? 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    if (page === 0 && Array.isArray(bundle?.usersPage) && !bundle.usersError) {
      setRows(bundle.usersPage)
      setTotal(bundle.usersTotal ?? 0)
      setLoading(false)
      return
    }
    fetchPage(page)
  }, [page, ready, bundle])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter((r) => {
      const name = (r.full_name || '').toLowerCase()
      const uni = (r.university || '').toLowerCase()
      const id = (r.id || '').toLowerCase()
      return name.includes(s) || uni.includes(s) || id.includes(s)
    })
  }, [rows, q])

  const exportCsv = () => {
    const headers = ['id', 'full_name', 'university', 'faculty', 'level', 'last_active_at', 'role']
    const lines = [headers.join(',')]
    filtered.forEach((r) => {
      const line = headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')
      lines.push(line)
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `luter-users-${Date.now()}.csv`
    a.click()
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE))

  return (
    <>
      <h1 className="adm-page-title">Users</h1>
      <p className="adm-page-desc">All profiles. Open a user to edit academics, role, and linked stats.</p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-card">
        <div className="adm-toolbar">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                className="adm-input"
                style={{ paddingLeft: 38, minWidth: 260 }}
                placeholder="Search name, university, or user id…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={exportCsv}>
            <Download size={16} /> Export page CSV
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
                  <th>User</th>
                  <th>University</th>
                  <th>Level</th>
                  <th>Last active</th>
                  <th>Role</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#111' }}>{r.full_name || '—'}</div>
                      <div className="adm-mono">{r.id?.slice(0, 8)}…</div>
                    </td>
                    <td>{r.university || '—'}</td>
                    <td>{r.level || '—'}</td>
                    <td className="adm-muted">{formatTs(r.last_active_at)}</td>
                    <td>
                      <span className={`adm-pill ${r.role === 'admin' ? 'adm-pill--warn' : ''}`}>{r.role || 'user'}</span>
                    </td>
                    <td>
                      <Link to={`/admin/users/${r.id}`} className="adm-link">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-pagination">
          <span>
            Page {page + 1} of {totalPages} · {total} users
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="adm-btn adm-btn--ghost" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              Previous
            </button>
            <button
              type="button"
              className="adm-btn adm-btn--ghost"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
