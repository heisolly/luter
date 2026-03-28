import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Bell, TrendingUp, Loader2 } from 'lucide-react'
import { useAdminPrefetch } from '../../context/AdminPrefetchContext'

function formatNum(n) {
  if (n == null) return '—'
  return n.toLocaleString()
}

export default function AdminOverview() {
  const { ready, bundle } = useAdminPrefetch()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    users: null,
    courses: null,
    enrollments: null,
    matches: null,
    notifications: null,
    activeNow: null,
  })

  useEffect(() => {
    if (!ready) return

    if (bundle?.counts && bundle.counts.profiles != null) {
      setStats({
        users: bundle.counts.profiles,
        courses: bundle.counts.courses,
        enrollments: bundle.counts.enrollments,
        matches: bundle.counts.matches,
        notifications: bundle.counts.notifications,
        activeNow: bundle.counts.activeNow,
      })
      setLoading(false)
      return
    }

    const load = async () => {
      setError(null)
      try {
        const fiveAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

        const [
          pRes,
          cRes,
          ucRes,
          mRes,
          nRes,
          liveRes,
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('user_courses').select('*', { count: 'exact', head: true }),
          supabase.from('matches').select('*', { count: 'exact', head: true }),
          supabase.from('notifications').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_active_at', fiveAgo),
        ])

        const err =
          pRes.error || cRes.error || ucRes.error || mRes.error || nRes.error || liveRes.error
        if (err) throw err

        setStats({
          users: pRes.count,
          courses: cRes.count,
          enrollments: ucRes.count,
          matches: mRes.count,
          notifications: nRes.count,
          activeNow: liveRes.count,
        })
      } catch (e) {
        setError(e.message || 'Failed to load metrics. Check Supabase RLS for admin access.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ready, bundle])

  if (!ready || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Loader2 className="animate-spin" size={28} color="#7a12cc" />
      </div>
    )
  }

  return (
    <>
      <h1 className="adm-page-title">Overview</h1>
      <p className="adm-page-desc">
        Platform snapshot. Counts require policies that allow admins to read aggregate data — see{' '}
        <code className="adm-mono">supabase/migrations/001_admin_rls.sql</code>.
      </p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-kpi-grid">
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Total users</div>
          <div className="adm-kpi-value">{formatNum(stats.users)}</div>
          <Link to="/admin/users" className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Manage users →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Courses (catalog)</div>
          <div className="adm-kpi-value">{formatNum(stats.courses)}</div>
          <Link to="/admin/courses" className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Catalog →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Enrollments</div>
          <div className="adm-kpi-value">{formatNum(stats.enrollments)}</div>
          <Link to="/admin/enrollments" className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            View links →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Arena matches</div>
          <div className="adm-kpi-value">{formatNum(stats.matches)}</div>
          <Link to="/admin/matches" className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Matches →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Notifications sent</div>
          <div className="adm-kpi-value">{formatNum(stats.notifications)}</div>
          <Link to="/admin/notifications" className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Composer →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={14} /> Active (5 min)
          </div>
          <div className="adm-kpi-value">{formatNum(stats.activeNow)}</div>
          <Link to="/admin/activity" className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Live feed →
          </Link>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>Quick actions</h3>
        <p className="adm-muted" style={{ margin: '0 0 16px' }}>
          Use the sidebar to moderate users, catalog courses, inspect enrollments, and push notifications to the app.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link to="/admin/notifications" className="adm-btn adm-btn--primary">
            New notification
          </Link>
          <Link to="/admin/courses" className="adm-btn adm-btn--ghost">
            Add / edit course
          </Link>
          <Link to="/admin/system" className="adm-btn adm-btn--ghost">
            System & RLS checklist
          </Link>
        </div>
      </div>
    </>
  )
}
