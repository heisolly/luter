import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { pauseAgent, resumeAgent } from '../agents/agentRunner'
import {
  Robot, Play, Pause, Eye, ArrowsClockwise,
  CircleNotch, Warning, CheckCircle, XCircle,
  Lightning, Skull,
} from '@phosphor-icons/react'

const STATUS_DOT = {
  idle:    '#94a3b8',
  running: '#7a12cc',
  paused:  '#d97706',
  error:   '#dc2626',
}

export default function AdminAgentMonitor() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [killing, setKilling] = useState(false)

  const load = async () => {
    setLoading(true)
    const [{ data: ag }, { data: tk }] = await Promise.all([
      supabase.from('admin_agents').select('*').order('created_at', { ascending: false }),
      supabase.from('agent_tasks').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    setAgents(ag || [])
    setTasks(tk || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000) // Auto-refresh every 10s
    return () => clearInterval(interval)
  }, [])

  // Supabase Realtime — watch agent status changes
  useEffect(() => {
    const channel = supabase
      .channel('agent-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_agents' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, () => load())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const killAll = async () => {
    if (!confirm('Pause ALL running agents?')) return
    setKilling(true)
    const running = agents.filter(a => a.status === 'running')
    await Promise.all(running.map(a => pauseAgent(a.id)))
    setKilling(false)
    load()
  }

  const totalTasks = tasks.length
  const doneTasks  = tasks.filter(t => t.status === 'done').length
  const failTasks  = tasks.filter(t => t.status === 'failed').length
  const runningAgents = agents.filter(a => a.status === 'running').length
  const successRate = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="adm-page-title" style={{ marginBottom: 4 }}>Control Room</h1>
          <p className="adm-page-desc" style={{ margin: 0 }}>Real-time oversight of all deployed agents.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="adm-btn adm-btn--ghost" onClick={load} disabled={loading}>
            <ArrowsClockwise size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={killAll}
            disabled={killing || runningAgents === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              borderRadius: 10, border: '1.5px solid #dc2626', background: '#fef2f2',
              color: '#dc2626', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              opacity: runningAgents === 0 ? 0.4 : 1,
            }}
          >
            {killing ? <CircleNotch className="animate-spin" size={14} /> : <Skull size={14} />}
            Kill All
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="adm-kpi-grid" style={{ gridTemplateColumns: 'repeat(5,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Agents', value: agents.length },
          { label: 'Running Now', value: runningAgents },
          { label: 'Tasks Run', value: totalTasks },
          { label: 'Succeeded', value: doneTasks },
          { label: 'Success Rate', value: `${successRate}%` },
        ].map(k => (
          <div key={k.label} className="adm-kpi-card">
            <div className="adm-kpi-label">{k.label}</div>
            <div className="adm-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Agent grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
        {agents.map(agent => {
          const agentTasks = tasks.filter(t => t.agent_id === agent.id)
          const done  = agentTasks.filter(t => t.status === 'done').length
          const fails = agentTasks.filter(t => t.status === 'failed').length
          const isRunning = agent.status === 'running'

          return (
            <div key={agent.id} className="adm-card" style={{
              padding: 16, border: `1.5px solid ${isRunning ? '#a78bfa' : '#e2e8f0'}`,
              background: isRunning ? '#faf5ff' : 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Robot size={18} color="#7a12cc" />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: STATUS_DOT[agent.status] || '#94a3b8',
                    border: '2px solid white',
                  }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{agent.name}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize' }}>{agent.type}</div>
                </div>
                {isRunning && <CircleNotch className="animate-spin" size={14} color="#7a12cc" />}
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, padding: '8px', background: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#059669' }}>{done}</div>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>DONE</div>
                </div>
                <div style={{ flex: 1, padding: '8px', background: fails > 0 ? '#fef2f2' : '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: fails > 0 ? '#dc2626' : '#94a3b8' }}>{fails}</div>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>FAILED</div>
                </div>
                <div style={{ flex: 1, padding: '8px', background: '#f8fafc', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#475569' }}>{agentTasks.length}</div>
                  <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>TOTAL</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button className="adm-btn adm-btn--ghost" style={{ flex: 1, fontSize: 11, justifyContent: 'center' }}
                  onClick={() => navigate(`/agents/${agent.id}`)}>
                  <Eye size={12} /> Console
                </button>
                {agent.status === 'paused'
                  ? <button className="adm-btn adm-btn--ghost" style={{ fontSize: 11 }}
                      onClick={async () => { await resumeAgent(agent.id); load() }}>
                      <Play size={12} />
                    </button>
                  : <button className="adm-btn adm-btn--ghost" style={{ fontSize: 11 }}
                      onClick={async () => { await pauseAgent(agent.id); load() }}>
                      <Pause size={12} />
                    </button>
                }
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent task feed */}
      <div className="adm-card">
        <div className="adm-toolbar">
          <span style={{ fontWeight: 800, fontSize: 14 }}>Recent Task Feed</span>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Agent</th>
                <th>Input</th>
                <th>Started</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {tasks.slice(0, 20).map(t => {
                const ag = agents.find(a => a.id === t.agent_id)
                return (
                  <tr key={t.id}>
                    <td>
                      {t.status === 'done'    && <CheckCircle size={15} color="#059669" weight="fill" />}
                      {t.status === 'failed'  && <XCircle size={15} color="#dc2626" weight="fill" />}
                      {t.status === 'running' && <CircleNotch size={15} color="#7a12cc" className="animate-spin" />}
                      {t.status === 'queued'  && <Lightning size={15} color="#d97706" />}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{ag?.name || '—'}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#475569' }}>
                      {typeof t.input?.prompt === 'string' ? t.input.prompt : JSON.stringify(t.input)}
                    </td>
                    <td style={{ fontSize: 11, color: '#94a3b8' }}>
                      {t.started_at ? new Date(t.started_at).toLocaleTimeString() : '—'}
                    </td>
                    <td style={{ fontSize: 11, color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.result?.summary || t.error || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
