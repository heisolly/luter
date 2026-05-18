import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { CircleNotch, Plus, ArrowsClockwise, MagnifyingGlass } from '@phosphor-icons/react'

export default function AdminCourses() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
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
    load()
  }, [])

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
      await load()
    }
    setSaving(false)
  }

  const filtered = rows.filter((r) => {
    const term = q.toLowerCase().trim()
    if (!term) return true
    return (
      r.code?.toLowerCase().includes(term) ||
      r.name?.toLowerCase().includes(term) ||
      (r.faculty && r.faculty.toLowerCase().includes(term))
    )
  })

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
        <div className="adm-toolbar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: '280px' }}>
            <span className="adm-muted" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
              {filtered.length !== rows.length ? `${filtered.length} of ${rows.length} courses` : `${rows.length} courses`}
            </span>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <MagnifyingGlass size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                type="text"
                className="adm-input"
                placeholder="Search code, name, faculty..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ width: '100%', paddingLeft: 36, height: 38 }}
              />
            </div>
          </div>
          <button type="button" className="adm-btn adm-btn--ghost" onClick={load}>
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
                  <th>Code</th>
                  <th>Name</th>
                  <th>Faculty</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700 }}>{r.code}</td>
                    <td>{r.name}</td>
                    <td>{r.faculty || '—'}</td>
                    <td className="adm-mono">{r.id?.slice(0, 8)}…</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#9ca3af' }}>
                      No courses match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
