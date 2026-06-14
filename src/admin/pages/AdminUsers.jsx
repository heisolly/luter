import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { MagnifyingGlass, CircleNotch, DownloadSimple, Plus, X } from '@phosphor-icons/react'

const PAGE = 25

const PLAN_CONFIG = {
  free:  { label: 'Free',  monthlyCredits: 200,   isPremium: false },
  pro:   { label: 'Pro',   monthlyCredits: 1500,  isPremium: true  },
  beast: { label: 'Beast', monthlyCredits: 999999, isPremium: true  },
}

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
  
  // Subscription filters & modal state
  const [subFilter, setSubFilter] = useState('all') // 'all', 'premium', 'free'
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUserId, setNewUserId] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [newTier, setNewTier] = useState('pro')
  const [newType, setNewType] = useState('monthly')
  const [newDuration, setNewDuration] = useState('30') // '30', '90', '365', 'lifetime'
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [changingPlan, setChangingPlan] = useState(null) // user.id being changed

  // Live user search states in modal
  const [modalSearchQ, setModalSearchQ] = useState('')
  const [modalSearchResults, setModalSearchResults] = useState([])
  const [modalSearching, setModalSearching] = useState(false)

  useEffect(() => {
    if (!modalSearchQ.trim()) {
      setModalSearchResults([])
      return
    }
    const handler = setTimeout(async () => {
      setModalSearching(true)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .or(`full_name.ilike.%${modalSearchQ}%,email.ilike.%${modalSearchQ}%`)
          .limit(5)
        if (!error && data) {
          setModalSearchResults(data)
        }
      } catch (err) {
        console.error('Error searching users in modal:', err)
      } finally {
        setModalSearching(false)
      }
    }, 300)
    return () => clearTimeout(handler)
  }, [modalSearchQ])

  const selectModalUser = (u) => {
    setNewUserId(u.id)
    setNewFullName(u.full_name || '')
    setModalSearchQ('')
    setModalSearchResults([])
  }

  const fetchPage = async (pageIndex, currentSubFilter = subFilter) => {
    setLoading(true)
    setError(null)
    const from = pageIndex * PAGE
    const to = from + PAGE - 1

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })

    if (currentSubFilter === 'premium') {
      query = query.eq('is_premium', true)
    } else if (currentSubFilter === 'free') {
      query = query.or('is_premium.is.null,is_premium.eq.false')
    }

    const { data, error: err, count } = await query
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
    fetchPage(page, subFilter)
  }, [page])

  const handleFilterChange = (val) => {
    setSubFilter(val)
    if (page !== 0) {
      setPage(0)
    } else {
      fetchPage(0, val)
    }
  }

  const changeUserPlan = async (user, planId) => {
    const plan = PLAN_CONFIG[planId]
    if (!plan) return

    setChangingPlan(user.id)
    setError(null)

    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        is_premium: plan.isPremium,
        subscription_tier: planId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileErr) {
      setError(profileErr.message)
      setChangingPlan(null)
      return
    }

    const { error: statsErr } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        ai_credits_monthly: plan.monthlyCredits,
        ai_credits_used: 0,
      }, { onConflict: 'user_id' })

    if (statsErr) {
      console.error('[AdminUsers] stats update error:', statsErr)
    }

    setRows(prev => prev.map(r =>
      r.id === user.id
        ? { ...r, is_premium: plan.isPremium, subscription_tier: planId }
        : r
    ))
    setChangingPlan(null)
  }

  const handleAddPaidUser = async (e) => {
    e.preventDefault()
    if (!newUserId.trim()) {
      setModalError('User ID is required')
      return
    }
    setModalSaving(true)
    setModalError(null)

    const plan = PLAN_CONFIG[newTier] || PLAN_CONFIG.pro

    let expiresAt = null
    if (newDuration !== 'lifetime') {
      const days = parseInt(newDuration, 10)
      const d = new Date()
      d.setDate(d.getDate() + days)
      expiresAt = d.toISOString()
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: newUserId.trim(),
        full_name: newFullName.trim() || 'Premium User',
        is_premium: plan.isPremium,
        subscription_tier: newTier,
        subscription_type: newType || null,
        subscription_expires_at: expiresAt,
        onboarding_complete: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (profileErr) {
      setModalError(profileErr.message)
      setModalSaving(false)
      return
    }

    await supabase
      .from('user_stats')
      .upsert({
        user_id: newUserId.trim(),
        ai_credits_monthly: plan.monthlyCredits,
        ai_credits_used: 0,
      }, { onConflict: 'user_id' })

    setShowAddModal(false)
    setNewUserId('')
    setNewFullName('')
    fetchPage(page, subFilter)
    setModalSaving(false)
  }

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter((r) => {
      const name = (r.full_name || '').toLowerCase()
      const uni = (r.university || '').toLowerCase()
      const id = (r.id || '').toLowerCase()
      const email = (r.email || '').toLowerCase()
      return name.includes(s) || uni.includes(s) || id.includes(s) || email.includes(s)
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
        <div className="adm-toolbar" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input
                className="adm-input"
                style={{ paddingLeft: 38, minWidth: 240 }}
                placeholder="Search name, university, or user id…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            
            <select
              className="adm-input"
              style={{ minWidth: 180 }}
              value={subFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">All Subscriptions</option>
              <option value="premium">Premium / Paid Only</option>
              <option value="free">Free Only</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="adm-btn adm-btn--primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Paid User
            </button>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={exportCsv}>
              <DownloadSimple size={16} /> Export page CSV
            </button>
          </div>
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
                  <th>User</th>
                  <th>University</th>
                  <th>Level</th>
                  <th>Last active</th>
                  <th>Role</th>
                  <th>Access</th>
                  <th>Quick Action</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#111' }}>{r.full_name || '—'}</div>
                      {r.email && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{r.email}</div>}
                      <div className="adm-mono" style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{r.id}</div>
                    </td>
                    <td>{r.university || '—'}</td>
                    <td>{r.level || '—'}</td>
                    <td className="adm-muted">{formatTs(r.last_active_at)}</td>
                    <td>
                      <span className={`adm-pill ${r.role === 'admin' ? 'adm-pill--warn' : ''}`}>{r.role || 'user'}</span>
                    </td>
                    <td>
                      {(() => {
                        const t = (r.subscription_tier || 'free').toLowerCase()
                        const cfg = PLAN_CONFIG[t]
                        if (!cfg || !r.is_premium) {
                          return (
                            <span className="adm-pill" style={{ background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e7eb', fontWeight: 500 }}>
                              Free
                            </span>
                          )
                        }
                        const colors = {
                          pro:   { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
                          beast: { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' },
                        }
                        const c = colors[t] || { bg: '#ecfdf5', color: '#065f46', border: '#a7f3d0' }
                        return (
                          <span className="adm-pill" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontWeight: 600 }}>
                            {cfg.label}
                          </span>
                        )
                      })()}
                    </td>
                    <td>
                      <select
                        value={(r.subscription_tier || 'free').toLowerCase()}
                        onChange={(e) => changeUserPlan(r, e.target.value)}
                        disabled={changingPlan === r.id}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          borderRadius: 6,
                          border: '1px solid var(--adm-border, #e2e8f0)',
                          background: changingPlan === r.id ? '#f1f5f9' : '#fff',
                          cursor: changingPlan === r.id ? 'wait' : 'pointer',
                          fontWeight: 500,
                        }}
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="beast">Beast</option>
                      </select>
                      {changingPlan === r.id && (
                        <span style={{ fontSize: 10, color: '#7a12cc', marginLeft: 6 }}>saving...</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/users/${r.id}`} className="adm-link">
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

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div className="adm-card" style={{ width: '100%', maxWidth: 450, padding: 24, position: 'relative', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <button 
              type="button" 
              onClick={() => setShowAddModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 800 }}>Add / Upgrade Paid User</h2>
            
            {modalError && (
              <div className="adm-error-banner" style={{ marginBottom: 16 }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleAddPaidUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ position: 'relative', marginBottom: 6 }}>
                <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                  Search User (by Name or Email)
                  <input
                    type="text"
                    className="adm-input"
                    style={{ width: '100%', marginTop: 6 }}
                    placeholder="Type name or email to search..."
                    value={modalSearchQ}
                    onChange={(e) => setModalSearchQ(e.target.value)}
                  />
                </label>
                {modalSearching && (
                  <div style={{ position: 'absolute', right: 12, bottom: 10 }}>
                    <CircleNotch className="animate-spin" size={16} color="#7a12cc" />
                  </div>
                )}
                {modalSearchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                    zIndex: 10,
                    maxHeight: 200,
                    overflowY: 'auto',
                    marginTop: 4
                  }}>
                    {modalSearchResults.map(u => (
                      <div
                        key={u.id}
                        onClick={() => selectModalUser(u)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          fontSize: 13,
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{u.full_name || 'Anonymous'}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{u.email || 'No email'} · <span className="adm-mono" style={{ fontSize: 10 }}>{u.id.slice(0, 8)}...</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                Supabase User ID (UUID)
                <input
                  required
                  className="adm-input"
                  style={{ width: '100%', marginTop: 6 }}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                />
              </label>

              <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                Full Name (Optional)
                <input
                  className="adm-input"
                  style={{ width: '100%', marginTop: 6 }}
                  placeholder="e.g. John Doe"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                  Tier
                  <select
                    className="adm-input"
                    style={{ width: '100%', marginTop: 6 }}
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                  >
                    <option value="pro">Pro</option>
                    <option value="beast">Beast</option>
                  </select>
                </label>

                <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                  Billing Type
                  <select
                    className="adm-input"
                    style={{ width: '100%', marginTop: 6 }}
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
              </div>

              <label className="adm-muted" style={{ fontSize: 12, fontWeight: 700 }}>
                Access Duration
                <select
                  className="adm-input"
                  style={{ width: '100%', marginTop: 6 }}
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                >
                  <option value="30">30 Days</option>
                  <option value="90">90 Days</option>
                  <option value="365">1 Year</option>
                  <option value="lifetime">Lifetime (No Expiry)</option>
                </select>
              </label>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button 
                  type="button" 
                  className="adm-btn adm-btn--ghost" 
                  onClick={() => setShowAddModal(false)}
                  disabled={modalSaving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="adm-btn adm-btn--primary"
                  disabled={modalSaving}
                >
                  {modalSaving ? 'Saving...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
