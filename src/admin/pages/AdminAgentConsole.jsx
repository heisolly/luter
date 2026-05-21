import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../supabaseClient'
import { runAgent, pauseAgent, resumeAgent } from '../agents/agentRunner'
import {
  Robot, Play, Pause, ArrowLeft, CircleNotch,
  CheckCircle, XCircle, Terminal, ArrowsClockwise,
  PaperPlaneTilt, Clock, Database, CloudArrowUp, RocketLaunch,
  ShieldCheck, Warning, Eye, PencilSimple, Trash,
  MagnifyingGlass, ListChecks,
} from '@phosphor-icons/react'
import { getAdminPath } from '../../utils/urlUtils'

const STEP_COLORS = {
  think:  { bg: '#f5f3ff', border: '#a78bfa', icon: '💭', label: 'Thinking' },
  act:    { bg: '#f0fdf4', border: '#86efac', icon: '⚡', label: 'Action' },
  error:  { bg: '#fef2f2', border: '#fca5a5', icon: '❌', label: 'Error' },
  fatal:  { bg: '#fef2f2', border: '#dc2626', icon: '💀', label: 'Fatal' },
  finish: { bg: '#f0fdf4', border: '#059669', icon: '✅', label: 'Complete' },
}

export default function AdminAgentConsole() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const logEndRef = useRef(null)

  const [agent, setAgent] = useState(null)
  const [tasks, setTasks] = useState([])
  const [liveSteps, setLiveSteps] = useState([])
  const [taskInput, setTaskInput] = useState(location.state?.autoPrompt || '')
  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskLogs, setTaskLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(false)
  
  // Staging Area State
  const [stagedData, setStagedData] = useState(null) // { type, items, verification_report }
  const [isPublishing, setIsPublishing] = useState(false)

  // Auto-run if prompt was passed
  useEffect(() => {
    if (location.state?.autoPrompt && !loading && agent && !running) {
      handleRun()
    }
  }, [loading, agent])

  const load = async () => {
    setLoading(true)
    const { data: agentData } = await supabase.from('admin_agents').select('*').eq('id', id).single()
    const { data: tasksData } = await supabase
      .from('agent_tasks').select('*').eq('agent_id', id)
      .order('created_at', { ascending: false }).limit(10)
    setAgent(agentData)
    setTasks(tasksData || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [liveSteps])

  const loadTaskData = (task) => {
    if (task?.result?.data) {
      setStagedData(JSON.parse(JSON.stringify(task.result.data)))
    } else {
      setStagedData(null)
    }
  }

  const handleSelectTask = async (task) => {
    setSelectedTask(task.id)
    setLogsLoading(true)
    const { data } = await supabase.from('agent_logs').select('*').eq('task_id', task.id).order('step')
    setTaskLogs(data || [])
    loadTaskData(task)
    setLogsLoading(false)
  }

  const handleRun = async () => {
    if (!taskInput.trim() || running) return
    setRunning(true)
    setLiveSteps([])
    setStagedData(null)
    setSelectedTask(null)

    const { data: taskRow } = await supabase
      .from('agent_tasks')
      .insert({ agent_id: id, input: { prompt: taskInput }, priority: 5, status: 'queued' })
      .select().single()

    if (!taskRow) { setRunning(false); return }

    const result = await runAgent({
      taskId: taskRow.id,
      agentId: id,
      agentInstruction: agent.instruction,
      tools: agent.tools,
      input: { prompt: taskInput },
      onStep: (step) => {
        setLiveSteps(prev => [...prev, { ...step, ts: new Date().toISOString() }])
        if (step.type === 'finish' && step.data) {
          setStagedData(step.data)
        }
      },
    })

    setRunning(false)
    setTaskInput('')
    await supabase.from('admin_agents').update({ status: 'idle' }).eq('id', id)
    load()
  }

  const handlePublish = async () => {
    if (!stagedData || isPublishing) return
    const count = stagedData.items?.length || 0
    if (!confirm(`Publish ${count} verified courses to the Syllabus Manager?`)) return

    setIsPublishing(true)
    try {
      if (stagedData.type === 'courses') {
        const uName = stagedData.items[0]?.university || 'Unknown University'
        const uSlug = uName.toLowerCase().replace(/\s+/g, '-')
        const dLabel = stagedData.items[0]?.department || 'General'
        const dSlug = dLabel.toLowerCase().replace(/\s+/g, '-')
        const level = stagedData.items[0]?.level || '100'
        const sem = stagedData.items[0]?.semester || '1st'
        
        // Build syllabus_id exactly how the system expects: uni_slug:dept_slug:level:sem
        const syllabus_id = `${uSlug}:${dSlug}:${level}:${sem}`

        const { error } = await supabase.from('curriculum_offers').upsert({
          university_name: uName,
          university_slug: uSlug,
          department_label: dLabel,
          department_slug: dSlug,
          level,
          semester: sem,
          syllabus_id,
          courses: stagedData.items.map(item => ({
            code: item.code,
            name: item.name || item.title,
            is_elective: item.is_elective || false
          })),
          status: 'draft', // Requires admin review in Syllabus Manager
          updated_at: new Date().toISOString()
        }, { onConflict: 'syllabus_id' })

        if (error) throw error
        alert('Data successfully published as a DRAFT in Syllabus Manager!')
        setStagedData(null)
      }
    } catch (err) {
      console.error(err)
      alert('Publish failed: ' + err.message)
    } finally {
      setIsPublishing(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <CircleNotch className="animate-spin" size={36} color="#7a12cc" />
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 400px', gap: 0, height: 'calc(100vh - 64px)', background: '#f8fafc', margin: '-24px' }}>
      
      {/* ── Sidebar: History ── */}
      <div style={{ background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <button className="adm-btn adm-btn--ghost" style={{ marginBottom: 16, fontSize: 12, padding: '4px 0' }} onClick={() => navigate(getAdminPath('/agents'))}>
            <ArrowLeft size={14} /> Back to Directory
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Robot size={18} color="#7a12cc" />
            </div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{agent.name}</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 12, padding: '0 12px' }}>Task History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {tasks.map(t => (
              <button key={t.id} onClick={() => handleSelectTask(t)} style={{
                padding: '12px 16px', borderRadius: 12, border: 'none',
                background: selectedTask === t.id ? '#f5f3ff' : 'transparent',
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.2s'
              }}>
                <div style={{ position: 'relative' }}>
                  {t.status === 'done' ? <CheckCircle size={20} color="#059669" weight="fill" />
                    : t.status === 'failed' ? <XCircle size={20} color="#dc2626" weight="fill" />
                    : <CircleNotch size={20} color="#7a12cc" className={t.status === 'running' ? 'animate-spin' : ''} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: selectedTask === t.id ? '#7a12cc' : '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.input?.prompt || 'Autonomous Task'}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>{new Date(t.created_at).toLocaleTimeString()}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: Terminal ── */}
      <div style={{ background: '#0f172a', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ padding: '12px 24px', background: '#1e293b', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', flex: 1 }}>agent_console_v2.sh</div>
          {running && <div style={{ fontSize: 10, color: '#7a12cc', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CircleNotch className="animate-spin" size={12} /> EXECUTING...
          </div>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}>
          {liveSteps.length === 0 && taskLogs.length === 0 && (
            <div style={{ color: '#475569' }}>
              <span style={{ color: '#22c55e' }}>luter@admin:~$</span> agent run --target "{agent.name}"<br/>
              <span style={{ color: '#94a3b8' }}>[SYSTEM] Awaiting instruction...</span>
            </div>
          )}

          {/* Historical Logs */}
          {taskLogs.map((log, i) => (
            <div key={`hist-${i}`} style={{ marginBottom: 16 }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>[{new Date().toLocaleTimeString()}] STEP {log.step} - {log.tool}</div>
              <div style={{ color: '#cbd5e1', paddingLeft: 12, borderLeft: '2px solid #334155' }}>
                {log.output?.error ? <span style={{ color: '#ef4444' }}>ERROR: {log.output.error}</span> : JSON.stringify(log.output)?.slice(0, 500)}
              </div>
            </div>
          ))}

          {/* Live Stream */}
          {liveSteps.map((s, i) => (
            <div key={`live-${i}`} style={{ marginBottom: 16 }}>
              <div style={{ color: '#7a12cc', fontSize: 11 }}>[{s.ts?.slice(11, 19)}] {s.type.toUpperCase()}</div>
              <div style={{ color: '#f8fafc', paddingLeft: 12, borderLeft: `2px solid ${STEP_COLORS[s.type]?.border || '#334155'}` }}>
                {s.thought && <div style={{ color: '#94a3b8', fontStyle: 'italic', marginBottom: 4 }}># {s.thought}</div>}
                {s.action && s.action !== 'FINISH' && <div style={{ color: '#38bdf8' }}>{'>'} {s.action}({JSON.stringify(s.params)})</div>}
                {s.result && <div style={{ color: '#22c55e' }}>{'>'} {s.result}</div>}
              </div>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '20px 24px', background: '#1e293b', borderTop: '1px solid #334155' }}>
          <div style={{ position: 'relative', display: 'flex', gap: 12 }}>
            <input
              style={{
                flex: 1, background: '#0f172a', border: '1px solid #334155', borderRadius: 12,
                padding: '14px 18px', color: 'white', fontFamily: 'monospace', fontSize: 14, outline: 'none'
              }}
              placeholder="Enter task instruction..."
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRun()}
              disabled={running}
            />
            <button className="adm-btn adm-btn--primary" onClick={handleRun} disabled={running || !taskInput.trim()} style={{ height: 50, padding: '0 24px' }}>
              {running ? <CircleNotch className="animate-spin" size={18} /> : <PaperPlaneTilt size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Verification & Staging ── */}
      <div style={{ background: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <ShieldCheck size={20} color="#059669" weight="fill" />
            <div style={{ fontWeight: 800, fontSize: 16 }}>Verification Center</div>
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>Review and verify agent discoveries</div>
        </div>

        {!stagedData ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <MagnifyingGlass size={48} style={{ marginBottom: 16, opacity: 0.2 }} />
            <div style={{ fontWeight: 600, fontSize: 14 }}>No data staged</div>
            <p style={{ fontSize: 12, margin: '8px 0 0' }}>When an agent completes an extraction task, verified data will appear here for your review.</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Verification Report */}
            <div style={{ padding: '20px 24px', background: '#f0fdf4', borderBottom: '1px solid #dcfce7' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ListChecks size={16} color="#059669" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#065f46', textTransform: 'uppercase' }}>Verification Report</span>
              </div>
              <p style={{ fontSize: 12, color: '#065f46', margin: 0, lineHeight: 1.5 }}>
                {stagedData.verification_report || "Agent verified this data against official sources."}
              </p>
            </div>

            {/* Entity List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Staged {stagedData.type} ({stagedData.items?.length || 0})</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="adm-btn adm-btn--ghost" style={{ padding: 4 }}><PencilSimple size={14} /></button>
                  <button className="adm-btn adm-btn--ghost" style={{ padding: 4, color: '#dc2626' }}><Trash size={14} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stagedData.items?.map((item, idx) => (
                  <div key={idx} className="adm-card" style={{ padding: 16, border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 900, color: '#7a12cc', fontFamily: 'monospace' }}>{item.code}</span>
                      {item.verified_from && <a href={item.verified_from} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#94a3b8' }}><Eye size={12} /> Source</a>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 4 }}>{item.name || item.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{item.university} • {item.department}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9', background: '#fafafa' }}>
              <button
                className="adm-btn adm-btn--primary"
                style={{ width: '100%', height: 48, justifyContent: 'center', background: '#059669' }}
                onClick={handlePublish}
                disabled={isPublishing}
              >
                {isPublishing ? <CircleNotch className="animate-spin" size={20} /> : <RocketLaunch size={20} />}
                Publish to Syllabus Manager
              </button>
              <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
                This will make the data available for final publishing in the Syllabus Manager.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
