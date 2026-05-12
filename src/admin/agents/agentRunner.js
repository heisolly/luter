/**
 * 🤖 Luter Agent Runner — ReAct Loop Engine
 * 
 * Executes an agent against a task using the ReAct (Reason + Act) pattern:
 * Think → Act → Observe → Repeat until done or max steps reached.
 * 
 * This runs client-side for now. For production, move to Supabase Edge Function.
 */

import { supabase } from '../../supabaseClient'
import { executeTool } from './toolRegistry'
import { withKeyRotation } from './apiKeyManager'

const MAX_STEPS = 20
const MAX_CONTEXT_CHARS = 48000 // ~12k tokens safe limit for Groq
const MAX_TOOL_OUTPUT_CHARS = 2000 // truncate big tool results

/**
 * Rough token estimate: ~4 chars per token for English text.
 */
function estimateChars(messages) {
  return messages.reduce((sum, m) => sum + (m.content?.length || 0), 0)
}

/**
 * Trim conversation to stay within context limits.
 * Keeps the first message (task input) and the most recent messages.
 * If still too long, summarize older messages into a single recap.
 */
function trimConversation(history) {
  if (estimateChars(history) <= MAX_CONTEXT_CHARS) return history

  // Always keep the first message (task input)
  const first = history[0]
  const rest = history.slice(1)

  // Keep removing oldest pairs until under limit
  let trimmed = [...rest]
  while (trimmed.length > 4 && estimateChars([first, ...trimmed]) > MAX_CONTEXT_CHARS) {
    trimmed = trimmed.slice(2) // remove oldest assistant+user pair
  }

  // If still too big, aggressively truncate message contents
  if (estimateChars([first, ...trimmed]) > MAX_CONTEXT_CHARS) {
    trimmed = trimmed.map(m => ({
      ...m,
      content: m.content.slice(0, 1000) + (m.content.length > 1000 ? '\n...[truncated]' : ''),
    }))
  }

  // Add a recap note so the agent knows history was trimmed
  return [
    first,
    { role: 'user', content: '[System: Earlier conversation steps were trimmed to save context. Continue from here.]' },
    ...trimmed,
  ]
}

/**
 * Truncate large tool outputs to prevent blowing the context window.
 */
function truncateOutput(output) {
  const str = typeof output === 'string' ? output : JSON.stringify(output, null, 2)
  if (str.length <= MAX_TOOL_OUTPUT_CHARS) return str
  return str.slice(0, MAX_TOOL_OUTPUT_CHARS) + `\n...[truncated ${str.length - MAX_TOOL_OUTPUT_CHARS} chars]`
}

/**
 * Core ReAct loop. Calls Groq to reason, then dispatches tool calls.
 * Logs every step to agent_logs in Supabase (streamed via Realtime).
 */
export async function runAgent({ taskId, agentId, agentInstruction, tools, input, onStep }) {
  const conversationHistory = []
  let step = 0

  // System prompt: Autonomous, Verifying, and Staging-Focused
  const systemPrompt = `You are the Luter Autonomous Admin Agent. Your mission:

${agentInstruction}

You have access to these tools: ${tools.join(', ')}

CORE DIRECTIVES:
1. VERIFY EVERYTHING: If you are asked to find courses or data, use web.search to find multiple sources. Do NOT trust the first list you find. Cross-reference. If you find conflicting numbers (e.g. one source says 13 courses, another says 37), investigate which one is the official/current curriculum.
2. NO DIRECT DB WRITES: Do NOT use db.insert, db.update, or db.upsert to create platform data (courses, materials, etc.) unless the user explicitly tells you "Insert this into the DB now". 
3. STAGING OUTPUT: All discovered data must be returned in the "data" field of the FINISH action. This data will be reviewed by the Admin before being published.
4. BE CRITICAL: If a search result looks like a blog post or student project, do not treat it as an official curriculum. Look for university portals or official PDFs (use ai.parsePdf).

IMPORTANT — DATABASE SCHEMA (for reference only, do not write unless told):
- profiles, courses, user_courses, materials, material_analysis, curriculum_offers, app_config, admin_agents, agent_tasks, agent_logs

To use a tool, respond with EXACTLY this JSON format:
{
  "thought": "your reasoning about what to do next. explain how you are verifying the data.",
  "action": "tool_name",
  "params": { ...tool parameters }
}

When your task is fully complete, respond with:
{
  "thought": "I have found and verified the following data...",
  "action": "FINISH",
  "result": "human-readable summary including sources verified",
  "data": {
    "type": "courses", 
    "items": [
      { "code": "CS101", "name": "Intro to CS", "verified_from": "url_here", ... }
    ],
    "verification_report": "Found 3 sources. Source A and B matched. Source C was outdated."
  }
}

Rules:
- Always think step by step.
- Use at least 2 search queries for any information gathering.
- If you find 37 courses but the user mentions 13, explain WHY in your thought process.
- Always finish with FINISH and the structured data.`

  // Initial user message with task input (capped to prevent oversized first request)
  const rawInput = typeof input === 'string' ? input : JSON.stringify(input, null, 2)
  const cappedInput = rawInput.length > 4000
    ? rawInput.slice(0, 4000) + '\n...[input truncated]'
    : rawInput
  conversationHistory.push({
    role: 'user',
    content: `Task Input:\n${cappedInput}\n\nBegin.`
  })

  // Update task status to running
  await supabase.from('agent_tasks').update({
    status: 'running',
    started_at: new Date().toISOString()
  }).eq('id', taskId)

  while (step < MAX_STEPS) {
    step++

    try {
      // ── THINK: Ask Groq to reason and decide next action ──
      const thinkStart = Date.now()
      const json = await withKeyRotation('groq', async (key) => {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              ...trimConversation(conversationHistory),
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          }),
        })

        if (!res.ok) {
          const err = await res.text()
          throw new Error(`Groq API error ${res.status}: ${err}`)
        }

        return await res.json()
      })
      const raw = json.choices[0]?.message?.content || '{}'
      let parsed

      try {
        parsed = JSON.parse(raw)
      } catch {
        parsed = { thought: raw, action: 'FINISH', result: raw }
      }

      const { thought, action, params, result, data: extractedData } = parsed

      // Emit step to UI callback
      onStep?.({ step, type: 'think', thought, action, params })

      // ── FINISH: Agent is done ──
      if (action === 'FINISH') {
        await _logStep(taskId, agentId, step, 'FINISH', {}, { result, data: extractedData }, Date.now() - thinkStart)
        await supabase.from('agent_tasks').update({
          status: 'done',
          finished_at: new Date().toISOString(),
          result: { summary: result, steps: step, data: extractedData }
        }).eq('id', taskId)

        onStep?.({ step, type: 'finish', result, data: extractedData })
        return { success: true, result, steps: step, data: extractedData }
      }

      // ── ACT: Check tool is allowed ──
      if (!tools.includes(action)) {
        const errorMsg = `Tool "${action}" is not in this agent's allowed tools.`
        conversationHistory.push({ role: 'assistant', content: raw })
        conversationHistory.push({ role: 'user', content: `Error: ${errorMsg}. Choose from: ${tools.join(', ')}` })
        onStep?.({ step, type: 'error', error: errorMsg })
        continue
      }

      // ── ACT: Execute tool ──
      let toolOutput, toolError, duration
      const actStart = Date.now()
      try {
        const execResult = await executeTool(action, params || {})
        toolOutput = execResult.output
        duration = execResult.duration_ms
      } catch (e) {
        toolError = e.message
        duration = Date.now() - actStart
      }

      // Log step to Supabase (Realtime picks this up for live console)
      await _logStep(
        taskId, agentId, step, action,
        params || {},
        toolError ? { error: toolError } : toolOutput,
        duration
      )

      onStep?.({
        step,
        type: toolError ? 'error' : 'act',
        action,
        params,
        output: toolOutput,
        error: toolError,
        duration
      })

      // ── OBSERVE: Feed result back to conversation (truncated to save context) ──
      conversationHistory.push({ role: 'assistant', content: raw })
      conversationHistory.push({
        role: 'user',
        content: toolError
          ? `Tool "${action}" failed with error: ${toolError}. Try a different approach.`
          : `Tool "${action}" returned:\n${truncateOutput(toolOutput)}`
      })

      // Check if agent was paused externally
      const { data: agentRow } = await supabase
        .from('admin_agents')
        .select('status')
        .eq('id', agentId)
        .single()

      if (agentRow?.status === 'paused') {
        await supabase.from('agent_tasks').update({ status: 'queued' }).eq('id', taskId)
        return { success: false, reason: 'paused', steps: step }
      }

    } catch (err) {
      await supabase.from('agent_tasks').update({
        status: 'failed',
        finished_at: new Date().toISOString(),
        error: err.message
      }).eq('id', taskId)
      onStep?.({ step, type: 'fatal', error: err.message })
      return { success: false, error: err.message, steps: step }
    }
  }

  // Hit max steps
  await supabase.from('agent_tasks').update({
    status: 'failed',
    error: `Reached maximum steps (${MAX_STEPS}) without finishing.`
  }).eq('id', taskId)

  return { success: false, error: 'Max steps reached', steps: MAX_STEPS }
}

async function _logStep(taskId, agentId, step, tool, input, output, duration_ms) {
  await supabase.from('agent_logs').insert({
    task_id: taskId,
    agent_id: agentId,
    step,
    tool,
    input,
    output,
    duration_ms,
  })
}

/**
 * Dispatch a new task to an agent.
 * Creates the task row and immediately begins execution.
 */
export async function dispatchTask({ agentId, input, priority = 5 }) {
  const { data: taskRow, error } = await supabase
    .from('agent_tasks')
    .insert({ agent_id: agentId, input, priority, status: 'queued' })
    .select()
    .single()

  if (error) throw new Error(`Failed to create task: ${error.message}`)

  const { data: agent } = await supabase
    .from('admin_agents')
    .select('*')
    .eq('id', agentId)
    .single()

  if (!agent) throw new Error('Agent not found')

  // Mark agent as running
  await supabase.from('admin_agents').update({ status: 'running' }).eq('id', agentId)

  return { taskId: taskRow.id, agent }
}

/**
 * Pause a running agent (the runner checks this flag each step).
 */
export async function pauseAgent(agentId) {
  await supabase.from('admin_agents').update({ status: 'paused' }).eq('id', agentId)
}

/**
 * Resume a paused agent back to idle.
 */
export async function resumeAgent(agentId) {
  await supabase.from('admin_agents').update({ status: 'idle' }).eq('id', agentId)
}
