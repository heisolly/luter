import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { Factory, Sparkle, CircleNotch, CheckCircle, ArrowRight } from '@phosphor-icons/react'

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY

const ALL_TOOLS = [
  'db.select','db.insert','db.update','db.delete','db.upsert','db.count','db.rpc',
  'web.search','web.scrape','web.crawl','web.fetch',
  'ai.generate','ai.summarize','ai.extractJson','ai.classify',
  'admin.sendNotification','admin.broadcastAll','admin.setAppConfig','admin.getAppConfig','admin.flagUser','admin.createAgent',
]

const EXAMPLES = [
  'An agent that scrapes all UNILAG department pages and saves their course listings',
  'An agent that monitors new user signups daily and sends them a welcome notification',
  'An agent that finds and inserts 100-level Computer Science courses for Nigerian universities',
  'An agent that reviews all study materials and flags ones with less than 3 weeks of content',
  'An agent that generates weekly flashcards from existing course notes in the database',
]

export default function AdminAgentFactory() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(null)
  const [error, setError] = useState(null)

  const generate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)
    setPreview(null)

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          temperature: 0.3,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an Agent Factory. Given a description of an agent to build, generate a complete agent configuration.

Available tools: ${ALL_TOOLS.join(', ')}

Respond with ONLY this JSON:
{
  "name": "short agent name",
  "type": "curriculum|content|web|platform|meta",
  "tools": ["tool1", "tool2"],
  "instruction": "full step-by-step system prompt for the agent"
}

Rules:
- Only include tools from the allowed list
- The instruction must be detailed with numbered steps
- type must be one of: curriculum, content, web, platform, meta`
            },
            { role: 'user', content: `Build an agent for this task: ${prompt}` }
          ],
        }),
      })

      if (!res.ok) throw new Error(`Groq error: ${res.status}`)
      const json = await res.json()
      const parsed = JSON.parse(json.choices[0].message.content)
      setPreview(parsed)
    } catch (e) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const deployAgent = async () => {
    if (!preview) return
    setSaving(true)
    const { data, error: e } = await supabase.from('admin_agents').insert({
      name: preview.name,
      type: preview.type,
      instruction: preview.instruction,
      tools: preview.tools,
      status: 'idle',
    }).select().single()
    setSaving(false)
    if (e) { setError(e.message); return }
    setSaved(data)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'linear-gradient(135deg, #7a12cc, #9718fb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Factory size={26} color="white" />
        </div>
        <div>
          <h1 className="adm-page-title" style={{ margin: 0 }}>Agent Factory</h1>
          <p className="adm-page-desc" style={{ margin: 0 }}>Describe an agent in plain English — AI builds it for you.</p>
        </div>
      </div>

      {error && <div className="adm-error-banner" style={{ margin: '16px 0' }}>{error}</div>}

      {saved ? (
        <div className="adm-card" style={{ padding: 40, textAlign: 'center' }}>
          <CheckCircle size={56} color="#059669" weight="fill" style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Agent Deployed!</h2>
          <p style={{ color: '#64748b', marginBottom: 24 }}>
            <strong>{saved.name}</strong> is ready in your Agent Directory.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="adm-btn adm-btn--ghost" onClick={() => { setSaved(null); setPreview(null); setPrompt('') }}>
              Build Another
            </button>
            <button className="adm-btn adm-btn--primary" onClick={() => navigate(`/admin/agents/${saved.id}`)}>
              Open Console <ArrowRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Input */}
          <div className="adm-card" style={{ padding: 20, marginBottom: 20, marginTop: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Describe Your Agent
            </label>
            <textarea
              className="adm-input"
              style={{ width: '100%', minHeight: 100, resize: 'vertical', fontSize: 14, lineHeight: 1.7 }}
              placeholder="e.g. An agent that searches the web for UNIBEN Computer Science syllabi and saves them to the database..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Examples:
                {EXAMPLES.slice(0, 2).map((ex, i) => (
                  <button key={i} onClick={() => setPrompt(ex)} style={{ marginLeft: 8, fontSize: 11, color: '#7a12cc', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>
                    Example {i + 1}
                  </button>
                ))}
              </div>
              <button className="adm-btn adm-btn--primary" onClick={generate} disabled={generating || !prompt.trim()}>
                {generating
                  ? <><CircleNotch className="animate-spin" size={16} /> Generating...</>
                  : <><Sparkle size={16} /> Generate Agent</>}
              </button>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="adm-card" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7a12cc', textTransform: 'uppercase', marginBottom: 16 }}>
                Generated Agent Preview
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Name</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{preview.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 4 }}>Type</div>
                  <div style={{ fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{preview.type}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                  Tools ({preview.tools?.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {preview.tools?.map(t => (
                    <span key={t} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#f5f3ff', border: '1px solid #a78bfa', fontFamily: 'monospace', color: '#7a12cc', fontWeight: 600 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8 }}>
                  Mission / Instruction
                </div>
                <pre style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7, background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', whiteSpace: 'pre-wrap', margin: 0, color: '#334155' }}>
                  {preview.instruction}
                </pre>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="adm-btn adm-btn--ghost" onClick={() => setPreview(null)}>
                  Regenerate
                </button>
                <button className="adm-btn adm-btn--primary" onClick={deployAgent} disabled={saving}>
                  {saving
                    ? <><CircleNotch className="animate-spin" size={16} /> Deploying...</>
                    : <><Factory size={16} /> Deploy This Agent</>}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
