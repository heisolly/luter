import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { TOOL_CATEGORIES, TOOL_DESCRIPTIONS, DANGEROUS_TOOLS } from '../agents/toolRegistry'
import { Robot, CheckSquare, Square, CircleNotch, FloppyDisk, Warning, Lightbulb } from '@phosphor-icons/react'

const AGENT_TYPES = [
  { value: 'curriculum', label: '📚 Curriculum', desc: 'Research syllabi, create courses' },
  { value: 'content',    label: '📝 Content',    desc: 'Upload notes, generate flashcards' },
  { value: 'web',        label: '🌐 Web',        desc: 'Search, scrape, crawl the internet' },
  { value: 'platform',   label: '🏛️ Platform',   desc: 'Audit users, send notifications' },
  { value: 'meta',       label: '🏭 Meta',       desc: 'Create agents, orchestrate tasks' },
]

const TEMPLATES = [
  {
    name: 'Syllabus Researcher', type: 'curriculum',
    tools: ['web.search', 'web.scrape', 'ai.extractJson', 'db.upsert'],
    instruction: `You are a Nigerian university curriculum researcher.\nWhen given a university, department, and level:\n1. Search the web for official course syllabi\n2. Scrape the most relevant page\n3. Extract courses as JSON: { courses: [{code, title, units, description}] }\n4. Upsert each course into curriculum_offers\n5. Report how many courses were saved`,
  },
  {
    name: 'Note Uploader', type: 'content',
    tools: ['web.fetch', 'ai.summarize', 'ai.generate', 'db.insert'],
    instruction: `You are a study material processor.\nWhen given a URL or text:\n1. Fetch or receive the content\n2. Summarize it into a student-friendly format\n3. Generate 5 key learning objectives\n4. Insert into study_materials\n5. Confirm successful upload`,
  },
  {
    name: 'Global Broadcaster', type: 'platform',
    tools: ['db.count', 'admin.broadcastAll'],
    instruction: `You are a platform communication agent.\nWhen given a title and body:\n1. Count active users\n2. Broadcast the notification to all\n3. Report total sent`,
  },
  {
    name: 'User Auditor', type: 'platform',
    tools: ['db.select', 'db.count', 'ai.classify'],
    instruction: `You audit user profiles for completeness.\n1. Select profiles missing university/department/level\n2. Count incomplete profiles by field\n3. Return a structured audit summary`,
  },
  {
    name: 'Agent Factory', type: 'meta',
    tools: ['ai.generate', 'ai.extractJson', 'admin.createAgent'],
    instruction: `You create other agents from natural language descriptions.\nWhen given a description:\n1. Extract: name, type, required tools, instruction\n2. Validate tools exist in the allowed list\n3. Create the agent via admin.createAgent\n4. Report the new agent ID`,
  },
]

export default function AdminAgentBuilder() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'curriculum', instruction: '', tools: [] })

  const applyTemplate = (t) => setForm(f => ({ ...f, name: t.name, type: t.type, instruction: t.instruction, tools: t.tools }))
  const toggleTool = (tool) => setForm(f => ({
    ...f,
    tools: f.tools.includes(tool) ? f.tools.filter(t => t !== tool) : [...f.tools, tool]
  }))

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Agent name is required.')
    if (!form.instruction.trim()) return setError('Agent instruction is required.')
    if (form.tools.length === 0) return setError('Select at least one tool.')
    setSaving(true)
    setError(null)
    const { error: e } = await supabase.from('admin_agents').insert({
      name: form.name.trim(), type: form.type,
      instruction: form.instruction.trim(),
      tools: form.tools, status: 'idle',
    })
    setSaving(false)
    if (e) { setError(e.message); return }
    navigate('/admin/agents')
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      <h1 className="adm-page-title">Create New Agent</h1>
      <p className="adm-page-desc">Define a mission, grant tools, and deploy autonomously.</p>

      {error && <div className="adm-error-banner" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Templates */}
      <div className="adm-card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#7a12cc', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lightbulb size={13} /> Starter Templates
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TEMPLATES.map(t => (
            <button key={t.name} onClick={() => applyTemplate(t)} className="adm-btn adm-btn--ghost" style={{ fontSize: 12 }}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Name */}
        <div className="adm-card" style={{ padding: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Agent Name</label>
          <input className="adm-input" style={{ width: '100%' }} placeholder="e.g. UNILAG Syllabus Crawler"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        {/* Type */}
        <div className="adm-card" style={{ padding: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Agent Type</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {AGENT_TYPES.map(t => (
              <label key={t.value} style={{
                display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px',
                borderRadius: 8, background: form.type === t.value ? '#f5f3ff' : 'transparent',
                border: `1.5px solid ${form.type === t.value ? '#7a12cc' : 'transparent'}`,
              }}>
                <input type="radio" name="type" value={t.value} checked={form.type === t.value}
                  onChange={() => setForm(f => ({ ...f, type: t.value }))} style={{ accentColor: '#7a12cc' }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Instruction */}
      <div className="adm-card" style={{ padding: 20, marginBottom: 20 }}>
        <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Mission / System Prompt
        </label>
        <textarea className="adm-input" style={{ width: '100%', minHeight: 180, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}
          placeholder="You are a curriculum researcher. When given a university name and department, search the web for official course syllabi and save them to the database..."
          value={form.instruction} onChange={e => setForm(f => ({ ...f, instruction: e.target.value }))} />
        <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8', textAlign: 'right' }}>{form.instruction.length} chars</div>
      </div>

      {/* Tools */}
      <div className="adm-card" style={{ padding: 20, marginBottom: 24 }}>
        <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
          Tool Permissions ({form.tools.length} selected)
        </label>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 16px' }}>Only grant tools the agent actually needs. <span style={{ color: '#dc2626' }}>Red = dangerous</span>.</p>
        {Object.entries(TOOL_CATEGORIES).map(([category, tools]) => (
          <div key={category} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#7a12cc', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{category}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 6 }}>
              {tools.map(tool => {
                const danger = DANGEROUS_TOOLS.includes(tool)
                const selected = form.tools.includes(tool)
                return (
                  <label key={tool} onClick={() => toggleTool(tool)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer',
                    padding: '8px 10px', borderRadius: 8,
                    background: selected ? (danger ? '#fef2f2' : '#f5f3ff') : '#f8fafc',
                    border: `1.5px solid ${selected ? (danger ? '#fca5a5' : '#a78bfa') : '#e2e8f0'}`,
                  }}>
                    {selected
                      ? <CheckSquare size={15} color={danger ? '#dc2626' : '#7a12cc'} weight="fill" style={{ marginTop: 2, flexShrink: 0 }} />
                      : <Square size={15} color="#cbd5e1" style={{ marginTop: 2, flexShrink: 0 }} />}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: danger ? '#dc2626' : '#0f172a' }}>
                        {tool} {danger && <Warning size={10} />}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>{TOOL_DESCRIPTIONS[tool]}</div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button className="adm-btn adm-btn--ghost" onClick={() => navigate('/admin/agents')}>Cancel</button>
        <button className="adm-btn adm-btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? <><CircleNotch className="animate-spin" size={16} /> Saving...</> : <><FloppyDisk size={16} /> Create Agent</>}
        </button>
      </div>
    </div>
  )
}
