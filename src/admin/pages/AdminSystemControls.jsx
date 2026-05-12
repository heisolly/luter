import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import {
  Wrench, ShieldCheck, CircleNotch, Warning, Pulse,
  Lock, LockOpen, Megaphone, EnvelopeSimple, ArrowsClockwise,
  Gear, Database, Globe,
} from '@phosphor-icons/react'

export default function AdminSystemControls() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // which action is saving
  const [maintenance, setMaintenance] = useState({ enabled: false, message: '' })
  const [customMessage, setCustomMessage] = useState('')
  const [configs, setConfigs] = useState([])

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('app_config').select('*').order('key')
    setConfigs(data || [])

    const maint = data?.find(c => c.key === 'maintenance_mode')
    if (maint?.value) {
      const v = typeof maint.value === 'object' ? maint.value : { enabled: maint.value === true || maint.value === 'true', message: '' }
      setMaintenance(v)
      setCustomMessage(v.message || '')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleMaintenance = async () => {
    const newState = !maintenance.enabled
    setSaving('maintenance')
    const msg = customMessage.trim() || 'Luter is under scheduled maintenance. We will be back shortly.'
    await supabase.from('app_config').upsert({
      key: 'maintenance_mode',
      value: { enabled: newState, message: msg },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
    setMaintenance({ enabled: newState, message: msg })
    setSaving(null)
  }

  const setConfig = async (key, value) => {
    setSaving(key)
    await supabase.from('app_config').upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' })
    setSaving(null)
    load()
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <CircleNotch className="animate-spin" size={36} color="#7a12cc" />
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="adm-page-title" style={{ marginBottom: 4 }}>System Controls</h1>
          <p className="adm-page-desc" style={{ margin: 0 }}>Maintenance mode, global toggles, and platform configuration.</p>
        </div>
        <button className="adm-btn adm-btn--ghost" onClick={load}>
          <ArrowsClockwise size={14} /> Refresh
        </button>
      </div>

      {/* ── Maintenance Mode Hero Card ── */}
      <div className="adm-card" style={{
        padding: 0, overflow: 'hidden', marginBottom: 24,
        border: `2px solid ${maintenance.enabled ? '#dc2626' : '#059669'}`,
      }}>
        <div style={{
          padding: '24px 28px',
          background: maintenance.enabled
            ? 'linear-gradient(135deg, #fef2f2, #fff5f5)'
            : 'linear-gradient(135deg, #f0fdf4, #f5fff9)',
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: maintenance.enabled ? '#dc262620' : '#05966920',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {maintenance.enabled
              ? <Lock size={32} color="#dc2626" weight="fill" />
              : <LockOpen size={32} color="#059669" weight="fill" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: maintenance.enabled ? '#dc2626' : '#059669', marginBottom: 4 }}>
              {maintenance.enabled ? '🔴 Maintenance Mode ON' : '🟢 Platform Live'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {maintenance.enabled
                ? 'All student-facing pages are locked. Only admins can access the dashboard.'
                : 'Platform is fully operational. Students can access all features.'}
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={saving === 'maintenance'}
            style={{
              padding: '14px 28px', borderRadius: 14, border: 'none',
              background: maintenance.enabled ? '#059669' : '#dc2626',
              color: 'white', fontWeight: 800, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            {saving === 'maintenance'
              ? <CircleNotch className="animate-spin" size={18} />
              : maintenance.enabled ? <LockOpen size={18} /> : <Lock size={18} />}
            {maintenance.enabled ? 'Go Live' : 'Enable Maintenance'}
          </button>
        </div>

        <div style={{ padding: '16px 28px', borderTop: `1px solid ${maintenance.enabled ? '#fecaca' : '#bbf7d0'}` }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Maintenance Message (shown to students)
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              className="adm-input"
              style={{ flex: 1 }}
              placeholder="Luter is under scheduled maintenance. We will be back shortly."
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
            />
            <button
              className="adm-btn adm-btn--ghost"
              onClick={() => setConfig('maintenance_mode', { enabled: maintenance.enabled, message: customMessage.trim() })}
              disabled={saving === 'maintenance_mode'}
            >
              Save Message
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="adm-card" style={{ padding: 20, textAlign: 'center' }}>
          <Megaphone size={28} color="#7a12cc" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Global Broadcast</div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 14px' }}>Send an in-app notification to all users.</p>
          <button className="adm-btn adm-btn--ghost" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              const title = prompt('Notification title:')
              if (!title) return
              const body = prompt('Notification body:')
              if (!body) return
              supabase.from('profiles').select('id').then(async ({ data: users }) => {
                if (!users?.length) return alert('No users found.')
                const rows = users.map(u => ({ user_id: u.id, type: 'admin_broadcast', title, body }))
                for (let i = 0; i < rows.length; i += 100) {
                  await supabase.from('notifications').insert(rows.slice(i, i + 100))
                }
                alert(`Sent to ${users.length} users!`)
              })
            }}>
            <Megaphone size={14} /> Send Broadcast
          </button>
        </div>

        <div className="adm-card" style={{ padding: 20, textAlign: 'center' }}>
          <Database size={28} color="#059669" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Platform Stats</div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 14px' }}>Quick counts from the database.</p>
          <button className="adm-btn adm-btn--ghost" style={{ width: '100%', justifyContent: 'center' }}
            onClick={async () => {
              const [u, c, m] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('courses').select('*', { count: 'exact', head: true }),
                supabase.from('materials').select('*', { count: 'exact', head: true }),
              ])
              alert(`Users: ${u.count}\nCourses: ${c.count}\nMaterials: ${m.count}`)
            }}>
            <Pulse size={14} /> Count All
          </button>
        </div>

        <div className="adm-card" style={{ padding: 20, textAlign: 'center' }}>
          <Globe size={28} color="#d97706" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>Feature Flags</div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 14px' }}>Toggle features without redeploying.</p>
          <button className="adm-btn adm-btn--ghost" style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
              const key = prompt('Feature key (e.g. arena_enabled):')
              if (!key) return
              const val = confirm(`Enable "${key}"?`)
              setConfig(key, val)
            }}>
            <Gear size={14} /> Set Flag
          </button>
        </div>
      </div>

      {/* ── All Config Keys ── */}
      <div className="adm-card">
        <div className="adm-toolbar">
          <span style={{ fontWeight: 800, fontSize: 14 }}>All Configuration Keys</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {configs.map(c => (
                <tr key={c.key}>
                  <td style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>{c.key}</td>
                  <td style={{ fontSize: 12, color: '#475569', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {JSON.stringify(c.value)}
                  </td>
                  <td style={{ fontSize: 11, color: '#94a3b8' }}>
                    {c.updated_at ? new Date(c.updated_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {configs.length === 0 && (
                <tr><td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No configuration keys set yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
