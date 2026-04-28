import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { CircleNotch, ArrowsClockwise } from '@phosphor-icons/react'

function formatTs(s) {
  if (!s) return '—'
  try {
    return new Date(s).toLocaleString()
  } catch {
    return String(s)
  }
}

export default function AdminMatches() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('battles')
      .select('*')
      .order('id', { ascending: false })
      .limit(150)

    if (e) setError(e.message)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <>
      <h1 className="adm-page-title">Battles & Duels</h1>
      <p className="adm-page-desc">Arena sessions and competitive duels. Inspect linkage between scholars.</p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-card">
        <div className="adm-toolbar">
          <span className="adm-muted" style={{ fontWeight: 600 }}>
            {rows.length} sessions
          </span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={() => load()}>
            <ArrowsClockwise size={16} /> Refresh
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
                  <th>Session ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Subject</th>
                  <th>Difficulty</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-mono" style={{ fontSize: 12 }}>
                      {r.session_id || r.id.slice(0, 8)}
                    </td>
                    <td>{r.battle_type || 'duel'}</td>
                    <td>
                      <span className="adm-pill">{r.status || 'waiting'}</span>
                    </td>
                    <td>{r.subject || '—'}</td>
                    <td>{r.difficulty || '—'}</td>
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
