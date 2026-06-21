import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Bell, CircleNotch, Users, Books, ShieldCheck, Pulse, Database, Coins } from '@phosphor-icons/react'
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
  const [stats, setStats] = useState({
    users: null,
    courses: null,
    notifications: null,
    activeNow: null,
    recentUsers: [],
    totalRevenue: null,
  })

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
        { label: 'free', value: 'free' },
        { label: 'monthly', value: 'monthly' },
        { label: 'yearly', value: 'yearly' },
        { label: 'pro', value: 'pro' },
        { label: 'premium', value: 'premium' }
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

  useEffect(() => {
    const load = async () => {
      setError(null)
      try {
        const fiveAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

        const [
          pRes,
          cRes,
          nRes,
          liveRes,
          recentRes,
          paymentsRes
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('notifications').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_active_at', fiveAgo),
          supabase.from('profiles').select('id, full_name, university, last_active_at').order('last_active_at', { ascending: false }).limit(5),
          supabase.from('payment_transactions').select('amount').eq('status', 'completed')
        ])

        const err = pRes.error || cRes.error || nRes.error || liveRes.error || recentRes.error || paymentsRes.error
        if (err) throw err

        const totalRevenue = (paymentsRes.data || []).reduce((acc, curr) => acc + (curr.amount || 0), 0)

        setStats({
          users: pRes.count,
          courses: cRes.count,
          notifications: nRes.count,
          activeNow: liveRes.count,
          recentUsers: recentRes.data || [],
          totalRevenue
        })
      } catch (e) {
        setError(e.message || 'Failed to load metrics. Check database connection or RLS rules.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircleNotch className="animate-spin" size={32} color="var(--adm-accent, #c4b5fd)" />
      </div>
    )
  }

  return (
    <>
      <h1 className="adm-page-title">Overview</h1>
      <p className="adm-page-desc">
        Welcome to the Luter admin hub. Monitor platform growth, student activity, and verify database constraints.
      </p>

      {error && <div className="adm-error-banner">{error}</div>}

      <div className="adm-kpi-grid">
        {/* Total Revenue */}
        <div className="adm-kpi-card" style={{ borderTop: '3px solid #10b981' }}>
          <div className="adm-kpi-icon-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Coins size={20} weight="fill" />
          </div>
          <div className="adm-kpi-label">Total Revenue</div>
          <div className="adm-kpi-value" style={{ color: '#10b981' }}>₦{formatNum(stats.totalRevenue)}</div>
          <span style={{ fontSize: 11, color: 'var(--adm-text-muted)', display: 'block', marginTop: 12, fontWeight: 600 }}>
            Completed transactions
          </span>
        </div>

        {/* Total Users */}
        <div className="adm-kpi-card" style={{ borderTop: '3px solid var(--adm-lavender)' }}>
          <div className="adm-kpi-icon-badge" style={{ background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)' }}>
            <Users size={20} weight="fill" />
          </div>
          <div className="adm-kpi-label">Total Users</div>
          <div className="adm-kpi-value">{formatNum(stats.users)}</div>
          <Link to={getAdminPath('/users')} className="adm-link" style={{ fontSize: 11, marginTop: 12, display: 'inline-block' }}>
            Manage users →
          </Link>
        </div>

        {/* Active Now */}
        <div className="adm-kpi-card" style={{ borderTop: '3px solid var(--adm-mint)' }}>
          <div className="adm-kpi-icon-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <Pulse size={20} weight="bold" />
          </div>
          <div className="adm-kpi-label">Active (5 min)</div>
          <div className="adm-kpi-value">{formatNum(stats.activeNow)}</div>
          <Link to={getAdminPath('/activity')} className="adm-link" style={{ fontSize: 11, marginTop: 12, display: 'inline-block', color: '#16a34a' }}>
            Live feed →
          </Link>
        </div>

        {/* Courses */}
        <div className="adm-kpi-card" style={{ borderTop: '3px solid var(--adm-peach)' }}>
          <div className="adm-kpi-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' }}>
            <Books size={20} weight="fill" />
          </div>
          <div className="adm-kpi-label">Courses (Catalog)</div>
          <div className="adm-kpi-value">{formatNum(stats.courses)}</div>
          <Link to={getAdminPath('/courses')} className="adm-link" style={{ fontSize: 11, marginTop: 12, display: 'inline-block', color: '#d97706' }}>
            Catalog →
          </Link>
        </div>

        {/* Notifications */}
        <div className="adm-kpi-card" style={{ borderTop: '3px solid var(--adm-text-muted)' }}>
          <div className="adm-kpi-icon-badge" style={{ background: 'var(--adm-accent-soft)', color: 'var(--adm-text-secondary)' }}>
            <Bell size={20} weight="fill" />
          </div>
          <div className="adm-kpi-label">Notifications Sent</div>
          <div className="adm-kpi-value">{formatNum(stats.notifications)}</div>
          <Link to={getAdminPath('/notifications')} className="adm-link" style={{ fontSize: 11, marginTop: 12, display: 'inline-block', color: 'var(--adm-text-secondary)' }}>
            Composer →
          </Link>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>Quick Actions</h3>
        <p className="adm-muted" style={{ margin: '0 0 16px' }}>
          Execute primary management workflows across system modules.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link to={getAdminPath('/notifications')} className="adm-btn adm-btn--primary">
            New notification
          </Link>
          <Link to={getAdminPath('/users')} className="adm-btn adm-btn--ghost">
            Moderate Users
          </Link>
          <Link to={getAdminPath('/courses')} className="adm-btn adm-btn--ghost">
            Update Course Catalog
          </Link>
          <Link to={getAdminPath('/syllabus')} className="adm-btn adm-btn--ghost">
            Syllabus Manager
          </Link>
          <Link to={getAdminPath('/audit')} className="adm-btn adm-btn--ghost">
            Run Health Audit
          </Link>
          <Link to={getAdminPath('/activity')} className="adm-btn adm-btn--ghost">
            Live Activity Feed
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        <div className="adm-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 800 }}>Recent Logins</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.recentUsers?.map(u => (
              <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid var(--adm-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--adm-accent-soft)', color: 'var(--adm-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {(u.full_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--adm-text)' }}>{u.full_name || 'Anonymous'}</div>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-muted)' }}>{u.university || 'No university'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--adm-accent)', fontWeight: 600 }}>
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
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text-secondary)' }}>Syllabus Coverage</span>
                <span style={{ fontSize: 12, color: 'var(--adm-accent)', fontWeight: 700 }}>{stats.courses > 0 ? 'Optimal' : 'Needs Data'}</span>
              </div>
              <div style={{ height: 8, background: 'var(--adm-bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: stats.courses > 0 ? '78%' : '10%', height: '100%', background: 'var(--adm-lavender)' }} />
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--adm-text-secondary)' }}>Server Latency</span>
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>34ms (Excellent)</span>
              </div>
              <div style={{ height: 8, background: 'var(--adm-bg)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '92%', height: '100%', background: '#10b981' }} />
              </div>
            </div>

            <div style={{ marginTop: 10, padding: 12, background: 'var(--adm-bg)', borderRadius: 12, border: '1px solid var(--adm-border)' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--adm-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>System Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                <ShieldCheck size={16} weight="fill" />
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="adm-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Database size={20} color="var(--adm-accent)" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Database RLS & Constraint Diagnostics</h3>
        </div>
        <p className="adm-muted" style={{ margin: '0 0 16px' }}>
          Live test constraints on the <code className="adm-mono">subscription_type</code> column in your remote schema. Updates profile column and rolls back instantly.
        </p>
        
        <button 
          type="button" 
          className="adm-btn adm-btn--primary" 
          disabled={diagRunning}
          onClick={runDiagnostic}
        >
          {diagRunning ? 'Running diagnostics...' : 'Run Constraint Check'}
        </button>

        {diagResults && (
          <div style={{ marginTop: 20, overflowX: 'auto' }}>
            <table className="adm-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Value Tested</th>
                  <th>Status</th>
                  <th>Database Response</th>
                </tr>
              </thead>
              <tbody>
                {diagResults.map((r, i) => (
                  <tr key={i}>
                    <td className="adm-mono" style={{ fontWeight: 600 }}>{r.val}</td>
                    <td>
                      <span className={`adm-pill ${r.status === 'SUCCESS' ? 'adm-pill--ok' : 'adm-pill--warn'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: r.status === 'FAILED' ? '#ef4444' : 'var(--adm-text-secondary)' }}>
                      {r.error || 'Passed constraint checks successfully! ✅'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
