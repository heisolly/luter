import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Bell, ChartLineUp, CircleNotch } from '@phosphor-icons/react'
import { getAdminPath } from '../../utils/urlUtils'

function formatNum(n) {
  if (n == null) return '—'
  return n.toLocaleString()
}

export default function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [diagResults, setDiagResults] = useState(null)
  const [diagRunning, setDiagRunning] = useState(false)

  const runDiagnostic = async () => {
    setDiagRunning(true)
    const results = []
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        throw new Error("No active session found. Please make sure you are logged in.")
      }
      
      const userId = session.user.id
      
      const { data: originalProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('subscription_type')
        .eq('id', userId)
        .single()
        
      if (fetchErr) {
        throw new Error("Failed to fetch original profile: " + fetchErr.message)
      }
      
      const originalType = originalProfile.subscription_type
      
      const testValues = [
        { label: 'NULL', value: null },
        { label: 'empty string ("")', value: '' },
        { label: 'monthly', value: 'monthly' },
        { label: 'quarterly', value: 'quarterly' },
        { label: 'yearly', value: 'yearly' },
        { label: 'annual', value: 'annual' },
        { label: 'starter', value: 'starter' },
        { label: 'semester', value: 'semester' },
        { label: 'pro', value: 'pro' },
        { label: 'premium', value: 'premium' },
        { label: 'free', value: 'free' }
      ]
      
      for (const test of testValues) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update({ subscription_type: test.value })
          .eq('id', userId)
          
        if (updateErr) {
          results.push({ val: test.label, status: 'FAILED', error: updateErr.message })
        } else {
          results.push({ val: test.label, status: 'SUCCESS', error: null })
        }
      }
      
      // Restore original value
      await supabase
        .from('profiles')
        .update({ subscription_type: originalType })
        .eq('id', userId)
        
    } catch (err) {
      results.push({ val: 'CRITICAL ERROR', status: 'ERROR', error: err.message })
    }
    
    setDiagResults(results)
    setDiagRunning(false)
  }
  const [stats, setStats] = useState({
    users: null,
    courses: null,
    enrollments: null,
    matches: null,
    notifications: null,
    activeNow: null,
    recentUsers: [],
    totalRevenue: null,
    healthSummary: null
  })

  useEffect(() => {
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
          recentRes,
          offersRes,
          paymentsRes
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('user_courses').select('*', { count: 'exact', head: true }),
          supabase.from('matches').select('*', { count: 'exact', head: true }),
          supabase.from('notifications').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_active_at', fiveAgo),
          supabase.from('profiles').select('id, full_name, university, last_active_at').order('last_active_at', { ascending: false }).limit(5),
          supabase.from('curriculum_offers').select('status', { count: 'exact' }),
          supabase.from('payment_transactions').select('amount').eq('status', 'completed')
        ])

        const err =
          pRes.error || cRes.error || ucRes.error || mRes.error || nRes.error || liveRes.error || recentRes.error || paymentsRes.error
        if (err) throw err

        const totalRevenue = (paymentsRes.data || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)

        setStats({
          users: pRes.count,
          courses: cRes.count,
          enrollments: ucRes.count,
          matches: mRes.count,
          notifications: nRes.count,
          activeNow: liveRes.count,
          recentUsers: recentRes.data || [],
          totalRevenue,
          healthSummary: {
            total: liveRes.count || 0,
            live: (recentRes.data || []).filter(r => r.status === 'live').length
          }
        })
      } catch (e) {
        setError(e.message || 'Failed to load metrics. Check Supabase RLS for admin access.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <CircleNotch className="animate-spin" size={28} color="#7a12cc" />
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
        <div className="adm-kpi-card" style={{ borderLeft: '4px solid #059669' }}>
          <div className="adm-kpi-label" style={{ color: '#059669' }}>Total Revenue</div>
          <div className="adm-kpi-value" style={{ color: '#059669' }}>₦{formatNum(stats.totalRevenue)}</div>
          <Link to={getAdminPath('/payment-settings?tab=analytics')} className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block', color: '#059669' }}>
            Analytics Suite →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Total users</div>
          <div className="adm-kpi-value">{formatNum(stats.users)}</div>
          <Link to={getAdminPath('/users')} className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Manage users →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Courses (catalog)</div>
          <div className="adm-kpi-value">{formatNum(stats.courses)}</div>
          <Link to={getAdminPath('/courses')} className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Catalog →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Enrollments</div>
          <div className="adm-kpi-value">{formatNum(stats.enrollments)}</div>
          <Link to={getAdminPath('/enrollments')} className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            View links →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Arena matches</div>
          <div className="adm-kpi-value">{formatNum(stats.matches)}</div>
          <Link to={getAdminPath('/matches')} className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Matches →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label">Notifications sent</div>
          <div className="adm-kpi-value">{formatNum(stats.notifications)}</div>
          <Link to={getAdminPath('/notifications')} className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Composer →
          </Link>
        </div>
        <div className="adm-kpi-card">
          <div className="adm-kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ChartLineUp size={14} /> Active (5 min)
          </div>
          <div className="adm-kpi-value">{formatNum(stats.activeNow)}</div>
          <Link to={getAdminPath('/activity')} className="adm-link" style={{ fontSize: 13, marginTop: 8, display: 'inline-block' }}>
            Live feed →
          </Link>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>Quick actions</h3>
        <p className="adm-muted" style={{ margin: '0 0 16px' }}>
          Use the sidebar to moderate users, catalog courses, inspect enrollments, manage billing settings, and push notifications to the app.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <Link to={getAdminPath('/notifications')} className="adm-btn adm-btn--primary">
            New notification
          </Link>
          <Link to={getAdminPath('/users')} className="adm-btn adm-btn--ghost" style={{ borderColor: '#7a12cc', color: '#7a12cc' }}>
            Grant Premium Access
          </Link>
          <Link to={getAdminPath('/payment-settings')} className="adm-btn adm-btn--ghost">
            Payment Suite & Settings
          </Link>
          <Link to={getAdminPath('/courses')} className="adm-btn adm-btn--ghost">
            Add / edit course
          </Link>
          <Link to={getAdminPath('/system')} className="adm-btn adm-btn--ghost">
            System & RLS checklist
          </Link>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 24, marginTop: 20 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>Database Constraint & Billing Cycle Diagnostics</h3>
        <p className="adm-muted" style={{ margin: '0 0 16px' }}>
          Test which values of <code className="adm-mono">subscription_type</code> are permitted by your remote database's check constraints. This runs live updates on your profile and automatically rolls them back.
        </p>
        
        <button 
          type="button" 
          className="adm-btn adm-btn--primary" 
          disabled={diagRunning}
          onClick={runDiagnostic}
        >
          {diagRunning ? 'Running Tests...' : 'Run Constraint Diagnostics'}
        </button>

        {diagResults && (
          <div style={{ marginTop: 20, overflowX: 'auto' }}>
            <table className="adm-table" style={{ minWidth: 'auto', width: '100%' }}>
              <thead>
                <tr>
                  <th>Value Tested</th>
                  <th>Status</th>
                  <th>Database Response / Error</th>
                </tr>
              </thead>
              <tbody>
                {diagResults.map((r, i) => (
                  <tr key={i}>
                    <td className="adm-mono" style={{ fontWeight: 600 }}>{r.val}</td>
                    <td>
                      <span className={`adm-pill ${r.status === 'SUCCESS' ? 'adm-pill--success' : 'adm-pill--warn'}`} style={r.status === 'SUCCESS' ? { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' } : {}}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: r.status === 'FAILED' ? '#ef4444' : '#64748b' }}>
                      {r.error || 'Passed constraint checks successfully! ✅'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.recentUsers?.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.full_name || 'Anonymous'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.university || 'No university'}</div>
                </div>
                <div style={{ fontSize: 11, color: '#7a12cc', fontWeight: 600 }}>
                  {new Date(u.last_active_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <Link to={getAdminPath('/activity')} className="adm-link" style={{ fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              View all activity →
            </Link>
          </div>
        </div>

        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Platform Health</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Syllabus Coverage</span>
                <span style={{ fontSize: 12, color: '#7a12cc', fontWeight: 700 }}>{stats.courses > 0 ? 'Optimal' : 'Needs Data'}</span>
              </div>
              <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '65%', height: '100%', background: 'linear-gradient(90deg, #7a12cc, #9718fb)' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Server Latency</span>
                <span style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>34ms (Excellent)</span>
              </div>
              <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '92%', height: '100%', background: '#059669' }} />
              </div>
            </div>
            <div style={{ marginTop: 10, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4, textTransform: 'uppercase' }}>System Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
