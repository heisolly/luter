import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Loader2, ArrowLeft, Save } from 'lucide-react'
import { useAdminPrefetch } from '../../context/AdminPrefetchContext'

export default function AdminUserDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { refresh } = useAdminPrefetch()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [enrollmentCount, setEnrollmentCount] = useState(0)

  const [form, setForm] = useState({
    full_name: '',
    university: '',
    faculty: '',
    level: '',
    role: 'user',
  })

  useEffect(() => {
    if (!userId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      const { data: p, error: pe } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
      if (pe || !p) {
        setError(pe?.message || 'User not found')
        setLoading(false)
        return
      }

      setProfile(p)
      setForm({
        full_name: p.full_name || '',
        university: p.university || '',
        faculty: p.faculty || '',
        level: p.level || '',
        role: p.role || 'user',
      })

      const { data: st } = await supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle()
      setStats(st || null)

      const { count } = await supabase.from('user_courses').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      setEnrollmentCount(count ?? 0)

      setLoading(false)
    }

    load()
  }, [userId])

  const saveProfile = async () => {
    if (!userId) return
    setSaving(true)
    setError(null)
    const { error: e } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        university: form.university,
        faculty: form.faculty,
        level: form.level,
        role: form.role,
      })
      .eq('id', userId)

    if (e) setError(e.message)
    else await refresh()
    setSaving(false)
  }

  const saveStats = async (patch) => {
    if (!userId) return
    setSaving(true)
    setError(null)
    const { error: e } = await supabase.from('user_stats').upsert(
      {
        user_id: userId,
        total_xp: stats?.total_xp ?? 0,
        streak_days: stats?.streak_days ?? 0,
        lives: stats?.lives ?? 3,
        badges: stats?.badges ?? [],
        ...patch,
      },
      { onConflict: 'user_id' }
    )
    if (e) setError(e.message)
    else {
      const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle()
      if (data) setStats(data)
      await refresh()
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader2 className="animate-spin" size={28} color="#7a12cc" />
      </div>
    )
  }

  if (!profile && error) {
    return (
      <>
        <div className="adm-error-banner">{error}</div>
        <Link to="/admin/users" className="adm-link">
          ← Back to users
        </Link>
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#6b7280',
          fontWeight: 600,
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        <ArrowLeft size={18} /> Back
      </button>

      <h1 className="adm-page-title">User detail</h1>
      <p className="adm-mono" style={{ marginTop: -4, marginBottom: 24 }}>
        {userId}
      </p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Profile</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Full name
              <input
                className="adm-input"
                style={{ width: '100%', marginTop: 6 }}
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </label>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              University
              <input
                className="adm-input"
                style={{ width: '100%', marginTop: 6 }}
                value={form.university}
                onChange={(e) => setForm((f) => ({ ...f, university: e.target.value }))}
              />
            </label>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Faculty / programme
              <input
                className="adm-input"
                style={{ width: '100%', marginTop: 6 }}
                value={form.faculty}
                onChange={(e) => setForm((f) => ({ ...f, faculty: e.target.value }))}
              />
            </label>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Level
              <input
                className="adm-input"
                style={{ width: '100%', marginTop: 6 }}
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              />
            </label>
            <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
              Role
              <select
                className="adm-input"
                style={{ width: '100%', marginTop: 6 }}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <button type="button" className="adm-btn adm-btn--primary" disabled={saving} onClick={saveProfile}>
              <Save size={16} /> Save profile
            </button>
          </div>
        </div>

        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Stats & enrollments</h3>
          <p className="adm-muted" style={{ marginBottom: 16 }}>
            Enrollments: <strong style={{ color: '#111' }}>{enrollmentCount}</strong>
          </p>
          {stats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                Total XP
                <input
                  type="number"
                  className="adm-input"
                  style={{ width: '100%', marginTop: 6 }}
                  value={stats.total_xp ?? 0}
                  onChange={(e) => setStats((s) => ({ ...s, total_xp: Number(e.target.value) }))}
                />
              </label>
              <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                Streak days
                <input
                  type="number"
                  className="adm-input"
                  style={{ width: '100%', marginTop: 6 }}
                  value={stats.streak_days ?? 0}
                  onChange={(e) => setStats((s) => ({ ...s, streak_days: Number(e.target.value) }))}
                />
              </label>
              <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                Lives
                <input
                  type="number"
                  className="adm-input"
                  style={{ width: '100%', marginTop: 6 }}
                  value={stats.lives ?? 3}
                  onChange={(e) => setStats((s) => ({ ...s, lives: Number(e.target.value) }))}
                />
              </label>
              <button
                type="button"
                className="adm-btn adm-btn--primary"
                disabled={saving}
                onClick={() =>
                  saveStats({
                    total_xp: stats.total_xp,
                    streak_days: stats.streak_days,
                    lives: stats.lives,
                  })
                }
              >
                Save stats
              </button>
            </div>
          ) : (
            <p className="adm-muted">No user_stats row yet.</p>
          )}
        </div>
      </div>
    </>
  )
}
