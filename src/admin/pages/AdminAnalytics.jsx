import { useEffect, useState } from 'react'
import { supabase } from '../../supabaseClient'
import { getAllPoolStats } from '../agents/apiKeyManager'
import { ArrowsClockwise, CheckCircle, Warning, CircleNotch } from '@phosphor-icons/react'

// Simple bar chart — no external library needed
function MiniBarChart({ data, color = '#7a12cc' }) {
  if (!data?.length) return <div style={{ color: '#94a3b8', fontSize: 12 }}>No data</div>
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{
            width: '100%', borderRadius: '3px 3px 0 0',
            background: color,
            height: `${(d.value / max) * 52}px`,
            minHeight: d.value > 0 ? 4 : 0,
            transition: 'height 0.4s ease',
            opacity: 0.85,
          }} />
          <div style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', lineHeight: 1 }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

// Mini line sparkline
function Sparkline({ values, color = '#7a12cc' }) {
  if (!values?.length) return null
  const max = Math.max(...values, 1)
  const w = 120, h = 40, pad = 4
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v / max) * (h - pad * 2))
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.split(' ').pop().split(',')[0]} cy={points.split(' ').pop().split(',')[1]} r="3" fill={color} />
    </svg>
  )
}

function KeyPoolCard({ pool }) {
  const statusColor = {
    active:     '#059669',
    standby:    '#64748b',
    cooldown:   '#dc2626',
    recovering: '#d97706',
  }

  return (
    <div className="adm-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 14, textTransform: 'capitalize' }}>{pool.provider}</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>{pool.active} active</span>
          {pool.failed > 0 && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>{pool.failed} down</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {pool.keys.map(k => (
          <div key={k.index} style={{
            padding: '4px 8px', borderRadius: 8,
            background: statusColor[k.status] + '15',
            border: `1.5px solid ${statusColor[k.status]}40`,
            fontSize: 10, fontWeight: 700,
            color: statusColor[k.status],
          }}>
            #{k.index}
            {k.status === 'active' && ' ●'}
            {k.status === 'cooldown' && ` ${k.cooldownRemaining}s`}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(pool.active / pool.total) * 100}%`,
            background: pool.active === pool.total ? '#059669' : pool.active > 0 ? '#d97706' : '#dc2626',
            borderRadius: 99,
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
          {pool.active}/{pool.total} keys available
        </div>
      </div>
    </div>
  )
}

export default function AdminAnalytics() {
  const [stats, setStats] = useState(null)
  const [agentStats, setAgentStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [keyPools, setKeyPools] = useState([])

  const load = async () => {
    setLoading(true)

    // Load platform stats
    const [users, courses, tasks, agents] = await Promise.all([
      supabase.from('profiles').select('created_at, university').order('created_at', { ascending: false }).limit(200),
      supabase.from('courses').select('created_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('agent_tasks').select('status, created_at').order('created_at', { ascending: false }).limit(500),
      supabase.from('admin_agents').select('status, type').limit(50),
    ])

    // Users per day (last 7 days)
    const now = new Date()
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - (6 - i))
      return d.toISOString().slice(0, 10)
    })

    const usersByDay = last7.map(day => ({
      label: day.slice(5),
      value: (users.data || []).filter(u => u.created_at?.startsWith(day)).length,
    }))

    // Tasks by status
    const tasksByStatus = ['queued', 'running', 'done', 'failed'].map(s => ({
      label: s,
      value: (tasks.data || []).filter(t => t.status === s).length,
    }))

    // Agent types
    const agentTypes = ['curriculum', 'content', 'web', 'platform', 'meta'].map(t => ({
      label: t.slice(0, 4),
      value: (agents.data || []).filter(a => a.type === t).length,
    }))

    // Top universities
    const uniCount = {}
    ;(users.data || []).forEach(u => {
      if (u.university) uniCount[u.university] = (uniCount[u.university] || 0) + 1
    })
    const topUnis = Object.entries(uniCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

    setStats({ usersByDay, tasksByStatus, agentTypes, topUnis })
    setAgentStats({
      total: (agents.data || []).length,
      running: (agents.data || []).filter(a => a.status === 'running').length,
      totalTasks: (tasks.data || []).length,
      doneTasks: (tasks.data || []).filter(t => t.status === 'done').length,
    })

    // Key pool stats (from memory)
    setKeyPools(getAllPoolStats())
    setLoading(false)
  }

  useEffect(() => { load() }, [])
  // Refresh key pools every 5s (they update on rate limits)
  useEffect(() => {
    const interval = setInterval(() => setKeyPools(getAllPoolStats()), 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <CircleNotch className="animate-spin" size={36} color="#7a12cc" />
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="adm-page-title" style={{ marginBottom: 4 }}>Analytics & API Status</h1>
          <p className="adm-page-desc" style={{ margin: 0 }}>Platform growth, agent performance, and live API key health.</p>
        </div>
        <button className="adm-btn adm-btn--ghost" onClick={load}>
          <ArrowsClockwise size={14} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="adm-kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Agents', value: agentStats?.total ?? 0 },
          { label: 'Agents Running', value: agentStats?.running ?? 0 },
          { label: 'Tasks Completed', value: agentStats?.doneTasks ?? 0 },
          { label: 'Success Rate', value: agentStats?.totalTasks ? `${Math.round((agentStats.doneTasks / agentStats.totalTasks) * 100)}%` : 'N/A' },
        ].map(k => (
          <div key={k.label} className="adm-kpi-card">
            <div className="adm-kpi-label">{k.label}</div>
            <div className="adm-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 16 }}>New Users (Last 7 Days)</div>
          <MiniBarChart data={stats?.usersByDay} color="#7a12cc" />
        </div>
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 16 }}>Agent Tasks by Status</div>
          <MiniBarChart data={stats?.tasksByStatus} color="#059669" />
        </div>
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 16 }}>Agents by Type</div>
          <MiniBarChart data={stats?.agentTypes} color="#d97706" />
        </div>
      </div>

      {/* Top Universities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 16 }}>Top Universities by Users</div>
          {stats?.topUnis?.map(([uni, count], i) => (
            <div key={uni} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#7a12cc' }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{uni}</div>
                <div style={{ height: 4, background: '#f1f5f9', borderRadius: 99, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#7a12cc', width: `${(count / (stats.topUnis[0]?.[1] || 1)) * 100}%`, borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#7a12cc', flexShrink: 0 }}>{count}</div>
            </div>
          ))}
        </div>

        <div className="adm-card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 16 }}>Task Success vs Failure</div>
          {stats?.tasksByStatus && (() => {
            const done = stats.tasksByStatus.find(t => t.label === 'done')?.value || 0
            const fail = stats.tasksByStatus.find(t => t.label === 'failed')?.value || 0
            const total = done + fail || 1
            return (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, padding: 14, background: '#f0fdf4', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#059669' }}>{done}</div>
                    <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>Succeeded</div>
                  </div>
                  <div style={{ flex: 1, padding: 14, background: '#fef2f2', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#dc2626' }}>{fail}</div>
                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>Failed</div>
                  </div>
                </div>
                <div style={{ height: 12, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                  <div style={{ height: '100%', width: `${(done / total) * 100}%`, background: '#059669' }} />
                  <div style={{ height: '100%', width: `${(fail / total) * 100}%`, background: '#dc2626' }} />
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                  {Math.round((done / total) * 100)}% success rate across all agent tasks
                </div>
              </>
            )
          })()}
        </div>
      </div>

      {/* API Key Pool Status */}
      <div className="adm-card" style={{ padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>🔑 API Key Pool Status</div>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>
          Live view of all API key pools. Keys auto-rotate on rate limits with 60s cooldown.
          Updates every 5 seconds.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {keyPools.map(pool => <KeyPoolCard key={pool.provider} pool={pool} />)}
        </div>
      </div>
    </>
  )
}
