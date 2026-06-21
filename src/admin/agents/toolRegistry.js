/**
 * 🔧 Luter Agent Tool Registry v2
 * 
 * All agent tools with automatic API key rotation via apiKeyManager.
 * Every tool call transparently switches keys on rate limits.
 */

import { supabase } from '../../supabaseClient'
import { withKeyRotation } from './apiKeyManager'
import { Sandbox } from '@e2b/code-interpreter'
import { callGroqAPI } from '../../groqClient'
import { TOOL_CATEGORIES, TOOL_DESCRIPTIONS, DANGEROUS_TOOLS } from './toolMetadata'

// ─────────────────────────────────────────────
// 🗄️ DATABASE TOOLS
// ─────────────────────────────────────────────

const dbTools = {
  'db.select': async ({ table, filters = {}, limit = 50, columns = '*', orderBy = null }) => {
    let q = supabase.from(table).select(columns).limit(limit)
    for (const [key, val] of Object.entries(filters)) q = q.eq(key, val)
    if (orderBy) q = q.order(orderBy.column, { ascending: orderBy.ascending ?? false })
    const { data, error } = await q
    if (error) throw new Error(`db.select error on "${table}": ${error.message}`)
    return data
  },
  'db.insert': async ({ table, data }) => {
    const { data: result, error } = await supabase.from(table).insert(data).select()
    if (error) throw new Error(`db.insert error on "${table}": ${error.message}`)
    return result
  },
  'db.update': async ({ table, id, data }) => {
    const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select()
    if (error) throw new Error(`db.update error on "${table}": ${error.message}`)
    return result
  },
  'db.delete': async ({ table, id }) => {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw new Error(`db.delete error on "${table}": ${error.message}`)
    return { deleted: true, id }
  },
  'db.upsert': async ({ table, data, onConflict }) => {
    const { data: result, error } = await supabase.from(table).upsert(data, { onConflict }).select()
    if (error) throw new Error(`db.upsert error on "${table}": ${error.message}`)
    return result
  },
  'db.count': async ({ table, filters = {} }) => {
    let q = supabase.from(table).select('*', { count: 'exact', head: true })
    for (const [key, val] of Object.entries(filters)) q = q.eq(key, val)
    const { count, error } = await q
    if (error) throw new Error(`db.count error on "${table}": ${error.message}`)
    return { count }
  },
  'db.rpc': async ({ fn, params = {} }) => {
    const { data, error } = await supabase.rpc(fn, params)
    if (error) throw new Error(`db.rpc error "${fn}": ${error.message}`)
    return data
  },
  'db.search_syllabus': async ({ query }) => {
    const { data, error } = await supabase.from('curriculum_offers')
      .select('*')
      .or(`university_name.ilike.%${query}%,department_label.ilike.%${query}%`)
      .limit(10)
    if (error) throw new Error(`db.search_syllabus error: ${error.message}`)
    return data
  },
  'db.get_syllabus': async ({ id }) => {
    const { data, error } = await supabase.from('curriculum_offers').select('*').eq('id', id).single()
    if (error) throw new Error(`db.get_syllabus error: ${error.message}`)
    return data
  },
}

// ─────────────────────────────────────────────
// 🌐 WEB TOOLS (with key rotation)
// ─────────────────────────────────────────────

const webTools = {
  'web.search': async ({ query, numResults = 5 }) => {
    return withKeyRotation('tavily', async (key) => {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, query, num_results: numResults, include_raw_content: true }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`${res.status}: ${txt}`)
      }
      const json = await res.json()
      return json.results?.map(r => ({ title: r.title, url: r.url, content: r.content, raw: r.raw_content })) || []
    })
  },

  'web.scrape': async ({ url, formats = ['markdown'] }) => {
    return withKeyRotation('firecrawl', async (key) => {
      const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ url, formats }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const json = await res.json()
      return { markdown: json.data?.markdown, metadata: json.data?.metadata }
    })
  },

  'web.crawl': async ({ url, limit = 10, formats = ['markdown'] }) => {
    return withKeyRotation('firecrawl', async (key) => {
      const res = await fetch('https://api.firecrawl.dev/v1/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ url, limit, scrapeOptions: { formats } }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      return await res.json()
    })
  },

  'web.fetch': async ({ url }) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`web.fetch ${res.status}: ${url}`)
    return { content: (await res.text()).slice(0, 8000) }
  },

  'web.searchAcademic': async ({ query, limit = 5 }) => {
    // OpenAlex — free academic search with optional API key for polite pool
    const encoded = encodeURIComponent(query)
    const apiKey = import.meta.env.VITE_OPENALEX_API_KEY
    const keyParam = apiKey ? `&api_key=${apiKey}` : ''
    const res = await fetch(
      `https://api.openalex.org/works?search=${encoded}&per-page=${limit}&select=title,doi,publication_year,abstract_inverted_index,authorships${keyParam}`,
      { headers: { 'User-Agent': 'Luter/1.0 (mailto:support@luter.app)' } }
    )
    if (!res.ok) throw new Error(`OpenAlex ${res.status}`)
    const json = await res.json()
    return json.results?.map(w => ({
      title: w.title,
      doi: w.doi,
      year: w.publication_year,
      authors: w.authorships?.slice(0, 3).map(a => a.author?.display_name),
    })) || []
  },
}

// 🧠 AI TOOLS (with Groq key rotation & Multi-LLM Fallback)
// ─────────────────────────────────────────────

async function callGroq(messages, schema = null) {
  const responseFormat = schema ? { type: 'json_object' } : null
  const response = await callGroqAPI(
    messages.filter(m => m.role !== 'system'),
    'llama-3.3-70b-versatile',
    {
      temperature: 0.3,
      responseFormat,
      systemPromptOverride: messages.find(m => m.role === 'system')?.content || null
    }
  )
  const content = response.choices[0]?.message?.content || ''
  if (schema) {
    try {
      return JSON.parse(content)
    } catch {
      return content
    }
  }
  return content
}

const aiTools = {
  'ai.generate': async ({ prompt, systemPrompt = 'You are a helpful assistant.', schema = null }) => {
    const messages = [
      { role: 'system', content: schema ? `${systemPrompt}\n\nRespond with valid JSON matching: ${JSON.stringify(schema)}` : systemPrompt },
      { role: 'user', content: prompt },
    ]
    return callGroq(messages, schema)
  },

  'ai.summarize': async ({ text, maxLength = 500 }) => {
    const result = await callGroq([
      { role: 'system', content: 'You are a concise academic summarizer.' },
      { role: 'user', content: `Summarize in ${maxLength} characters or less:\n\n${text.slice(0, 6000)}` },
    ])
    return { summary: result }
  },

  'ai.extractJson': async ({ text, schema }) => {
    return callGroq([
      { role: 'system', content: `Extract structured data. Respond with JSON matching: ${JSON.stringify(schema)}` },
      { role: 'user', content: text.slice(0, 6000) },
    ], schema)
  },

  'ai.classify': async ({ text, categories }) => {
    const result = await callGroq([
      { role: 'system', content: 'Respond with ONLY the category name, nothing else.' },
      { role: 'user', content: `Classify into one of [${categories.join(', ')}]:\n\n${text}` },
    ])
    return { category: result.trim() }
  },

  'ai.parsePdf': async ({ url, extractionPrompt = 'Extract all course titles, codes, units, and descriptions as structured JSON.' }) => {
    // LlamaParse v2 — correct 2-step API: upload file → parse job → poll result
    const key = import.meta.env.VITE_LLAMAINDEX_API_KEY
    if (!key) throw new Error('LlamaIndex API key not configured')

    // Step 1: Download PDF as blob and upload to LlamaParse
    const pdfRes = await fetch(url)
    if (!pdfRes.ok) throw new Error(`Failed to fetch PDF from ${url}: ${pdfRes.status}`)
    const pdfBlob = await pdfRes.blob()

    const formData = new FormData()
    formData.append('file', pdfBlob, 'document.pdf')

    const uploadRes = await fetch('https://api.cloud.llamaindex.ai/api/v1/parsing/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: formData,
    })
    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      throw new Error(`LlamaParse upload failed (${uploadRes.status}): ${errText}`)
    }
    const uploadData = await uploadRes.json()
    const jobId = uploadData.id

    // Step 2: Poll for result (max 60s)
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000))

      const statusRes = await fetch(`https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}`, {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (!statusRes.ok) continue
      const statusData = await statusRes.json()

      if (statusData.status === 'SUCCESS') {
        // Get markdown result
        const resultRes = await fetch(`https://api.cloud.llamaindex.ai/api/v1/parsing/job/${jobId}/result/markdown`, {
          headers: { Authorization: `Bearer ${key}` },
        })
        if (!resultRes.ok) throw new Error(`Failed to get parse result: ${resultRes.status}`)
        const resultData = await resultRes.json()
        const markdown = resultData.markdown || resultData.text || ''

        // Use Groq to extract structured data from the parsed markdown
        return callGroq([
          { role: 'system', content: 'Extract structured academic data from this parsed document. Return valid JSON.' },
          { role: 'user', content: `${extractionPrompt}\n\nDocument:\n${markdown.slice(0, 8000)}` },
        ])
      }
      if (statusData.status === 'ERROR') {
        throw new Error(`LlamaParse job failed: ${statusData.error || 'Unknown error'}`)
      }
      // Still PENDING — keep polling
    }
    throw new Error('LlamaParse parsing timed out after 60s')
  },

  'ai.runCode': async ({ code, language = 'python' }) => {
    // E2B Code Interpreter — uses official SDK for sandboxed execution
    const apiKey = import.meta.env.VITE_E2B_API_KEY
    if (!apiKey) throw new Error('E2B API key not configured')

    let sandbox
    try {
      sandbox = await Sandbox.create({ apiKey })
      const execution = await sandbox.runCode(code, { language })
      return {
        stdout: execution.logs.stdout.join('\n'),
        stderr: execution.logs.stderr.join('\n'),
        text: execution.text,
        error: execution.error ? execution.error.value : null,
      }
    } catch (err) {
      throw new Error(`E2B execution failed: ${err.message}`)
    } finally {
      if (sandbox) await sandbox.close().catch(() => {})
    }
  },
}

// ─────────────────────────────────────────────
// 📧 COMMUNICATION TOOLS
// ─────────────────────────────────────────────

const communicationTools = {
  // NOTE: 'from' must be a verified domain in your Resend dashboard.
  // For testing, use 'onboarding@resend.dev'. For production, verify luter.app in Resend.
  'email.send': async ({ to, subject, html, from = 'Luter <onboarding@resend.dev>' }) => {
    const key = import.meta.env.VITE_RESEND_API_KEY
    if (!key) throw new Error('Resend API key not configured')
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html }),
    })
    if (!res.ok) throw new Error(`Resend failed: ${res.status} ${await res.text()}`)
    return await res.json()
  },

  'email.broadcastAll': async ({ subject, html }) => {
    const { data: users } = await supabase.from('profiles').select('id, email').not('email', 'is', null)
    if (!users?.length) return { sent: 0 }
    let sent = 0
    // Send in chunks of 50 (Resend batch limit)
    for (let i = 0; i < users.length; i += 50) {
      const chunk = users.slice(i, i + 50)
      await Promise.allSettled(chunk.map(u => communicationTools['email.send']({ to: u.email, subject, html })))
      sent += chunk.length
    }
    return { sent }
  },
}

// ─────────────────────────────────────────────
// 🛡️ ADMIN TOOLS
// ─────────────────────────────────────────────

const adminTools = {
  'admin.sendNotification': async ({ userId, title, body }) => {
    return dbTools['db.insert']({ table: 'notifications', data: { user_id: userId, type: 'admin_broadcast', title, body } })
  },

  'admin.broadcastAll': async ({ title, body }) => {
    const { data: users } = await supabase.from('profiles').select('id')
    if (!users?.length) return { sent: 0 }
    const rows = users.map(u => ({ user_id: u.id, type: 'admin_broadcast', title, body }))
    for (let i = 0; i < rows.length; i += 100) {
      await supabase.from('notifications').insert(rows.slice(i, i + 100))
    }
    return { sent: users.length }
  },

  'admin.setAppConfig': async ({ key, value }) => {
    return dbTools['db.upsert']({ table: 'app_config', data: { key, value, updated_at: new Date().toISOString() }, onConflict: 'key' })
  },

  'admin.getAppConfig': async ({ key }) => {
    const { data } = await supabase.from('app_config').select('value').eq('key', key).single()
    return { value: data?.value ?? null }
  },

  'admin.setMaintenanceMode': async ({ enabled, message = 'Luter is under scheduled maintenance. We will be back shortly.' }) => {
    await dbTools['db.upsert']({ table: 'app_config', data: { key: 'maintenance_mode', value: { enabled, message }, updated_at: new Date().toISOString() }, onConflict: 'key' })
    return { maintenanceMode: enabled, message }
  },

  'admin.flagUser': async ({ userId, reason }) => {
    return dbTools['db.update']({ table: 'profiles', id: userId, data: { flagged: true, flag_reason: reason } })
  },

  'admin.createAgent': async ({ name, type, instruction, tools }) => {
    return dbTools['db.insert']({ table: 'admin_agents', data: { name, type, instruction, tools, status: 'idle' } })
  },
}

// ─────────────────────────────────────────────
// 📦 FULL REGISTRY + METADATA
// ─────────────────────────────────────────────

export const TOOL_REGISTRY = {
  ...dbTools,
  ...webTools,
  ...aiTools,
  ...communicationTools,
  ...adminTools,
}

export { TOOL_CATEGORIES, TOOL_DESCRIPTIONS, DANGEROUS_TOOLS }

export async function executeTool(toolName, params) {
  const tool = TOOL_REGISTRY[toolName]
  if (!tool) throw new Error(`Unknown tool: "${toolName}"`)
  const start = Date.now()
  const output = await tool(params)
  return { output, duration_ms: Date.now() - start }
}
