import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { pauseAgent, resumeAgent } from '../agents/agentRunner'
import {
  Robot, Plus, Play, Pause, Trash, Copy, CircleNotch,
  ArrowsClockwise, Warning, CheckCircle, Clock, Lightning,
  Eye, Factory, MonitorPlay, MagnifyingGlass,
} from '@phosphor-icons/react'

const STATUS_CONFIG = {
  idle:    { color: '#64748b', bg: '#f1f5f9', label: 'Idle' },
  running: { color: '#7a12cc', bg: '#f5f3ff', label: 'Running' },
  paused:  { color: '#d97706', bg: '#fffbeb', label: 'Paused' },
  error:   { color: '#dc2626', bg: '#fef2f2', label: 'Error' },
}

const TYPE_ICONS = {
  curriculum: '📚',
  content:    '📝',
  web:        '🌐',
  platform:   '🏛️',
  meta:       '🏭',
}

export default function AdminAgents() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [q, setQ] = useState('')

  const filteredAgents = agents.filter(agent => {
    const term = q.toLowerCase().trim()
    if (!term) return true
    return (
      agent.name?.toLowerCase().includes(term) ||
      agent.type?.toLowerCase().includes(term) ||
      agent.instruction?.toLowerCase().includes(term)
    )
  })

  const load = async () => {
    setLoading(true)
    setError(null)
    const { data, error: e } = await supabase
      .from('admin_agents')
      .select('*, agent_tasks(count)')
      .order('created_at', { ascending: false })
    if (e) setError(e.message)
    else setAgents(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this agent and all its task history?')) return
    setActionLoading(id + '_delete')
    await supabase.from('admin_agents').delete().eq('id', id)
    setActionLoading(null)
    load()
  }

  const handleClone = async (agent) => {
    setActionLoading(agent.id + '_clone')
    await supabase.from('admin_agents').insert({
      name: `${agent.name} (copy)`,
      type: agent.type,
      instruction: agent.instruction,
      tools: agent.tools,
      status: 'idle',
    })
    setActionLoading(null)
    load()
  }

  const handleTogglePause = async (agent) => {
    setActionLoading(agent.id + '_pause')
    if (agent.status === 'paused') await resumeAgent(agent.id)
    else await pauseAgent(agent.id)
    setActionLoading(null)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 className="adm-page-title" style={{ marginBottom: 4 }}>Agent Directory</h1>
          <p className="adm-page-desc" style={{ margin: 0 }}>
            Deploy autonomous AI workers to manage your platform at scale.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/agents/monitor" className="adm-btn adm-btn--ghost">
            <MonitorPlay size={16} /> Control Room
          </Link>
          <Link to="/agents/factory" className="adm-btn adm-btn--ghost">
            <Factory size={16} /> Agent Factory
          </Link>
          <Link to="/agents/new" className="adm-btn adm-btn--primary">
            <Plus size={16} /> New Agent
          </Link>
        </div>
      </div>

      {error && <div className="adm-error-banner">{error}</div>}

      {/* KPI strip */}
      <div className="adm-kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        {[
          { label: 'Total Agents', value: agents.length },
          { label: 'Running Now', value: agents.filter(a => a.status === 'running').length },
          { label: 'Paused', value: agents.filter(a => a.status === 'paused').length },
          { label: 'Error State', value: agents.filter(a => a.status === 'error').length },
        ].map(k => (
          <div key={k.label} className="adm-kpi-card">
            <div className="adm-kpi-label">{k.label}</div>
            <div className="adm-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <MagnifyingGlass size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          type="text"
          className="adm-input"
          placeholder="Search agents by name, type, instruction..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ width: '100%', paddingLeft: 36, height: 42 }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <CircleNotch className="animate-spin" size={36} color="#7a12cc" />
        </div>
      ) : filteredAgents.length === 0 ? (
        <div className="adm-card" style={{ padding: 80, textAlign: 'center' }}>
          <Robot size={64} color="#e2e8f0" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
            {q ? 'No matching agents' : 'No agents yet'}
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: 24 }}>
            {q ? 'Try updating your search query.' : 'Create your first agent to start automating your admin workflow.'}
          </p>
          {!q && (
            <Link to="/agents/new" className="adm-btn adm-btn--primary">
              <Plus size={16} /> Create First Agent
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredAgents.map(agent => {
            const sc = STATUS_CONFIG[agent.status] || STATUS_CONFIG.idle
            const taskCount = agent.agent_tasks?.[0]?.count ?? 0
            return (
              <div key={agent.id} className="adm-card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Header bar */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'linear-gradient(135deg, #7a12cc20, #9718fb15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>
                    {TYPE_ICONS[agent.type] || '🤖'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 2 }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{agent.type} Agent</div>
                  </div>
                  <div style={{
                    padding: '4px 10px', borderRadius: 99,
                    background: sc.bg, color: sc.color,
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {agent.status === 'running' && <CircleNotch className="animate-spin" size={10} />}
                    {sc.label}
                  </div>
                </div>

                {/* Instruction preview */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <p style={{
                    fontSize: 12, color: '#64748b', lineHeight: 1.6,
                    margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {agent.instruction}
                  </p>
                </div>

                {/* Tools strip */}
                <div style={{ padding: '10px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(agent.tools || []).slice(0, 5).map(t => (
                    <span key={t} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 99,
                      background: '#f8fafc', border: '1px solid #e2e8f0',
                      color: '#475569', fontWeight: 600, fontFamily: 'monospace',
                    }}>{t}</span>
                  ))}
                  {agent.tools?.length > 5 && (
                    <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, padding: '2px 4px' }}>
                      +{agent.tools.length - 5} more
                    </span>
                  )}
                </div>

                {/* Footer actions */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => navigate(`/agents/${agent.id}`)}
                    className="adm-btn adm-btn--ghost"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                  >
                    <Eye size={14} /> Console
                  </button>

                  <button
                    onClick={() => handleTogglePause(agent)}
                    className="adm-btn adm-btn--ghost"
                    style={{ fontSize: 12 }}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === agent.id + '_pause'
                      ? <CircleNotch className="animate-spin" size={14} />
                      : agent.status === 'paused' ? <Play size={14} /> : <Pause size={14} />
                    }
                  </button>

                  <button
                    onClick={() => handleClone(agent)}
                    className="adm-btn adm-btn--ghost"
                    style={{ fontSize: 12 }}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === agent.id + '_clone'
                      ? <CircleNotch className="animate-spin" size={14} />
                      : <Copy size={14} />
                    }
                  </button>

                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="adm-btn adm-btn--ghost"
                    style={{ fontSize: 12, color: '#dc2626' }}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === agent.id + '_delete'
                      ? <CircleNotch className="animate-spin" size={14} />
                      : <Trash size={14} />
                    }
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="adm-btn adm-btn--ghost" onClick={load}>
          <ArrowsClockwise size={14} /> Refresh
        </button>
      </div>
    </div>
  )
}
