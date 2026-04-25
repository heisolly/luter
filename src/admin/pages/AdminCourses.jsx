import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { RiLoader4Line as Loader2, RiAddLine as Plus, RiRefreshLine as RefreshCw } from 'react-icons/ri'
import { useAdminPrefetch } from '../../context/AdminPrefetchContext'

export default function AdminCourses() {
  const { ready, bundle, refresh } = useAdminPrefetch()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', faculty: '' })

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase.from('courses').select('*').order('code', { ascending: true })
    if (e) setError(e.message)
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    if (Array.isArray(bundle?.coursesList) && !bundle.coursesError) {
      setRows(bundle.coursesList)
      setLoading(false)
      return
    }
    load()
  }, [ready, bundle])

  const addCourse = async (e) => {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('courses').upsert(
      {
        code: form.code.trim(),
        name: form.name.trim(),
        faculty: form.faculty.trim() || null,
      },
      { onConflict: 'code' }
    )
    if (err) setError(err.message)
    else {
      setForm({ code: '', name: '', faculty: '' })
      await refresh()
      await load()
    }
    setSaving(false)
  }

  return (
    <>
      <h1 className="adm-page-title">Courses</h1>
      <p className="adm-page-desc">Global course catalog. Upsert uses <code className="adm-mono">code</code> as unique key (matches onboarding).</p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Add or update course</h3>
        <form onSubmit={addCourse} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
          <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
            Code
            <input className="adm-input" style={{ width: '100%', marginTop: 6 }} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="CSC 101" />
          </label>
          <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
            Name
            <input className="adm-input" style={{ width: '100%', marginTop: 6 }} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </label>
          <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
            Faculty
            <input className="adm-input" style={{ width: '100%', marginTop: 6 }} value={form.faculty} onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))} />
          </label>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
            <Plus size={16} /> Upsert course
          </button>
        </form>
      </div>

      <div className="adm-card">
        <div className="adm-toolbar">
          <span className="adm-muted" style={{ fontWeight: 600 }}>
            {rows.length} courses
          </span>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={load}>
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
                  <th>Code</th>
                  <th>Name</th>
                  <th>Faculty</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.faculty || '—'}</td>
                    <td className="adm-mono">{r.id?.slice(0, 8)}…</td>
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
