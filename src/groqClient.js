// groqClient.js — Groq API interface for Luter AI

// System Configuration
export const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

// Model Configuration
export const GROQ_MODELS = {
  PROFESSOR: 'llama-3.3-70b-versatile',  // For Notes, Complex Tutoring, Context Understanding
  SPEEDSTER: 'llama-3.1-8b-instant',      // For Summary, Flashcard Generation, Mock Exam MCQs
  VISION: 'llama-3.2-11b-vision-preview', // Updated vision model
  WHISPER: 'whisper-large-v3-turbo'       // Ultra-fast transcription
}

// System Prompt
export const LUTER_SYSTEM_PROMPT = `You are Luter AI, a premium, high-energy Academic Tutor for Nigerian University students. Your goal is to simplify complex departmental materials into 'First Class' quality insights.

Tone: Encouraging, sharp, and professional. Use Nigerian academic context where appropriate (e.g., referencing 'JAMB-style' or 'CBT-standard' questions).

Constraint 1 (Groundedness): Only answer based on the provided study materials. If the answer isn't there, say 'The lecturer didn't cover this in the uploaded notes, but generally speaking...'
Constraint 2 (Formatting): Always output in clean Markdown. Use bolding for key terms and bullet points for readability. No long walls of text.
Constraint 3 (The 30-Min Promise): When solving assignments, provide a 'Logic First' breakdown—show's formula, then the substitution, then the final result.
Constraint 4 (Speed & RAG): For long documents, you are provided with relevant snippets. Focus your analysis on these snippets to provide near-instant responses.`

export function buildLuterSystemPrompt(profile) {
  let prompt = LUTER_SYSTEM_PROMPT
  if (!profile) return prompt
  const uni = profile.university
  const fac = profile.faculty
  if (uni || fac) {
    prompt += `\n\nAcademic placement: The learner studies ${fac || 'their programme'}${uni ? ` at ${uni}` : ''}. Prefer Nigerian NUC/JAMB-adjacent framing for 100-level and General Studies (GST/GNS) when it helps.`
  }
  const cc = profile.curriculum_context
  if (cc && typeof cc === 'object') {
    const key = [cc.uni_slug, cc.dept_slug, cc.level, cc.semester].filter(Boolean).join('/')
    if (key) {
      prompt += ` Their syllabus is registered in Luter under "${key}" (official or crowd-mapped course list). Align examples with that curriculum slot when relevant.`
    }
  }
  return prompt
}

// Service Prompts
export const GROQ_PROMPTS = {
  AI_NOTES: `Act as a world-class academic tutor. Create highly detailed, structured, and comprehensive study notes from the provided text.
  
  Structure:
  1. **Topic Overview**: A brief 2-3 sentence introduction.
  2. **Core Concepts & Definitions**: Use bolding for key terms.
  3. **Detailed Breakdown**: Deep dive into the main arguments, mechanisms, or theories.
  4. **Formulas/Equations** (if applicable): Use LaTeX-style or clear formatting.
  5. **Key Takeaways**: A bulleted list of the most critical points.
  6. **Self-Review Questions**: 3 questions to test understanding.
  
  Use clean Markdown, H2/H3 headings, and professional academic language.`,
  
  FLASHCARDS: `Convert this material into a JSON array of flashcards. Each object must have a 'front' (question/term) and a 'back' (concise answer). 
  Focus on 'Active Recall'—ask questions that test deep understanding, not just rote memorization.
  
  Return ONLY the JSON array: [{"front": "...", "back": "..."}]`,
  
  MOCK_EXAM: `Generate challenging multiple-choice questions suitable for Nigerian university students. Each question must have exactly 4 distinct options (A, B, C, D) with only one correct answer.
  
  Questions should test understanding, not just memorization. Use clear, unambiguous language appropriate for university level.
  
  Return ONLY a JSON array with this exact structure:
  [{"question": "question text here", "type": "multiple", "options": ["option A", "option B", "option C", "option D"], "correct_answer": 1, "explanation": "detailed explanation of why this answer is correct"}]
  
  Note: correct_answer should be 1, 2, 3, or 4 (not 0-indexed). All options must be plausible but only one should be correct.`,

  SUMMARY: `Create a concise executive summary of the following document. 
  Focus on:
  - The core thesis or objective.
  - The main supporting arguments or data points.
  - Final conclusions or implications.
  
  Keep it professional, academic, and extremely high-signal.`,
  
  TUTOR: `You are Luter Tutor helping a student understand this course material. Be encouraging, use examples relevant to Nigerian university context, and provide clear, concise explanations.`,

  RAG_CONTEXT: `You are provided with several document snippets relevant to the student's query. Use them to provide a grounded, accurate answer. If the snippets don't contain the answer, synthesize based on general academic principles but state your source is external.`,

  VISION_ANALYSIS: `Analyze these video frames/images. Describe the visual content in the context of an academic lecture. Identify key diagrams, text on slides, or physical demonstrations.`,
  
  CURRICULUM_BASELINE: `You are Luter's Curriculum Navigator for Nigerian universities. Build a plausible semester course list.

Hard rules:
- Match the STUDENT'S LEVEL in both course CODES and TITLES. Example: 300L Computer Science should use CSC3xx-style codes (CSC301, CSC303…) and titles like "Design & Analysis of Algorithms", "Systems Programming" — NOT "Introduction to Computer Science I" (that is 100L).
- 200L = intermediate (CSC2xx, data structures, OS I, etc.). 400L = project, electives, advanced topics (CSC4xx).
- 100L may include GST/GNS and broad intros. Higher levels: include departmental cores, labs, electives, and GST only if typical for that semester.
- Minimum 20 courses for a full semester load unless the department is tiny; prefer 24–36.
- Use compact codes without spaces (CSC301, MTH301).

Return ONLY a JSON array (no markdown, no backticks). Each object: {"code":"CSC301","name":"Full course title"}.`,

  ADMIN_SYLLABUS_PARSE: `You convert messy syllabus text (copied from PDFs, WhatsApp, or bullet lists) into structured data for a Nigerian university registry.

Rules:
- Extract every course code and title you can infer. Codes may look like "CSC 101", "MTH-102", "GST111" — normalize to compact uppercase without spaces.
- Mark is_elective true only when the text clearly says elective, optional, or general elective.
- Skip headers, page numbers, and lecturer names.
Return ONLY valid JSON: {"courses":[{"code":"CSC101","title":"Introduction to Computing","is_elective":false}]}
No markdown, no backticks, no commentary.`,

  ADMIN_WEB_ASSIST: `You assist admins by proposing a plausible official-style semester course list for Nigerian universities. You do not have live web access—use general knowledge of NUC-style programmes, departmental norms, JAMB 100L paths, and GST/GNS naming. Be conservative: note uncertainty in your head but output only the JSON requested.

Return ONLY a JSON array (no markdown). Each object: {"code":"ABC101","title":"Full title","is_elective":false}.
Use 10–18 courses unless the query clearly implies a smaller set.`,

  SYLLABUS_JAMB_LAYER: `You list courses aligned with JAMB UTME / DE patterns and national GST/GNS requirements for Nigerian universities.

Match the student's LEVEL and SEMESTER. 100L: GST, GNS, broad science/math. 200L+: departmental codes. Never use 100L-only titles for 300L.

Return ONLY a JSON array (no markdown). Each object: {"code":"GST111","name":"Communication in English I"}.
Include every relevant GST/GNS and typical UTME science pairings for the level. Minimum 12 entries when level is 100; fewer for higher levels if only GST cross-registration applies.`,

  SYLLABUS_HANDBOOK_WEB: `You synthesize a semester course list as if compiled from Nigerian university faculty handbooks, department websites, and NUC BMAS-style expectations (you do not browse the web—use consolidated public knowledge).

Match university name, department, level, and semester. Use plausible departmental course codes (e.g. CSC3xx for 300L CS). Include labs, electives, and GST where typical.

Return ONLY a JSON array (no markdown). Each object: {"code":"CSC301","name":"Full title"}.
Minimum 14 courses; prefer 18–28 for a full semester load.`,

  LIVE_COURSE_SEARCH: `You help Nigerian university students find courses as they type a search box.

Rules:
- You receive programme, level, semester, university context plus a SHORT partial query (code fragment, acronym, or keywords).
- Return courses that plausibly match the query for THAT programme and level (e.g. 300L Mechanical Engineering → MCE3xx codes, not 100L intros unless query suggests GST/GNS).
- Prefer real Nigerian-style codes (MCE303, MTH301, GST111, CSC301, etc.).
- If query is a prefix like "MCE" or "MTH", return multiple matching courses for that prefix at the correct level (8–18 items).
- If query is a topic like "THERMO" or "HEAT", return courses whose titles match.
- No markdown, no commentary. Return ONLY a JSON array: [{"code":"MCE301","name":"Full official-style title"}, ...]`,

  MANUAL_COURSE_ENRICH: `You summarize one university course for a study app. Use Nigerian university norms. If web snippets are provided, ground the summary in them; otherwise use careful general knowledge and say when typical titles vary by school.

Return ONLY valid JSON (no markdown):
{"canonical_title":"string","short_description":"2-4 sentences for a student","learning_topics":["topic1","topic2","topic3"],"typical_credits":"e.g. 2 or 3","notes":"optional caveats or empty string"}`,
}

// Request Queue for Rate Limit Handling
class RequestQueue {
  constructor() {
    this.queue = []
    this.processing = false
  }

  async add(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject, retryCount: 0 })
      this.processQueue()
    })
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    
    while (this.queue.length > 0) {
      const { request, resolve, reject, retryCount } = this.queue.shift()
      
      try {
        const result = await this.executeRequest(request)
        resolve(result)
        
        // Anti-Burst Delay: Small cool-down to keep Rate Limits (TPD/RPM) healthy
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        // If rate limited, use exponential backoff and retry
        if (error.status === 429 && retryCount < 3) {
          const delay = Math.min(2000 * Math.pow(2, retryCount), 30000) // 2s, 4s, 8s max 30s
          console.log(`Rate limited. Waiting ${delay/1000} seconds before retry... (attempt ${retryCount + 1}/3)`)
          await new Promise(resolve => setTimeout(resolve, delay))
          // Add back to front of queue to retry with increased count
          this.queue.unshift({ request, resolve, reject, retryCount: retryCount + 1 })
          continue // Skip to next iteration
        } else {
          reject(error)
        }
      }
    }
    
    this.processing = false
  }

  async executeRequest(request) {
    const { messages, model, temperature = 0.7, responseFormat } = request
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        ...(responseFormat && { response_format: responseFormat })
      })
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      const error = new Error(`HTTP error! status: ${response.status} - ${errorBody?.error?.message || 'Unknown error'}`)
      error.status = response.status
      error.details = errorBody
      throw error
    }

    return response.json()
  }
}

export const groqQueue = new RequestQueue()

// Main Groq API Function
export async function callGroqAPI(messages, model = GROQ_MODELS.PROFESSOR, options = {}) {
  const {
    temperature = 0.7,
    responseFormat = null,
    useQueue = true,
    profile = null,
    systemPromptOverride = null,
  } = options
  const systemContent =
    systemPromptOverride ??
    (profile ? buildLuterSystemPrompt(profile) : LUTER_SYSTEM_PROMPT)

  const request = {
    messages: [
      { role: 'system', content: systemContent },
      ...messages
    ],
    model,
    temperature,
    ...(responseFormat && { response_format: responseFormat })
  }

  if (useQueue) {
    return await groqQueue.add(request)
  }
  return await groqQueue.executeRequest(request)
}

/**
 * Method C — GPT baseline syllabus (JAMB / departmental template style).
 * Returns normalized [{ code, name }] or [] on failure.
 */
export async function fetchCurriculumBaselineList({
  country,
  university,
  department,
  level,
  semester,
}) {
  if (!GROQ_API_KEY) {
    console.warn('VITE_GROQ_API_KEY missing; skipping AI syllabus baseline')
    return []
  }
  const userMsg = `Country: ${country || 'Nigeria'}
University: ${university || 'Unknown'}
Department / programme: ${department || 'General'}
Level: ${level || '100'} Level (codes and titles MUST reflect this level — no 100L-style "Introduction to…" titles for 200L+ unless it is a named remedial course)
Semester: ${semester || '1st'} semester

Generate a complete semester timetable-style list: at least 20 courses, ideally 24–36 distinct courses, as specified in your system rules.`

  try {
    const data = await callGroqAPI([{ role: 'user', content: userMsg }], GROQ_MODELS.PROFESSOR, {
      temperature: 0.35,
      systemPromptOverride: GROQ_PROMPTS.CURRICULUM_BASELINE,
    })
    let raw = data?.choices?.[0]?.message?.content?.trim() || ''
    if (raw.startsWith('```json')) raw = raw.slice(7)
    if (raw.startsWith('```')) raw = raw.slice(3)
    if (raw.endsWith('```')) raw = raw.slice(0, -3)
    const parsed = JSON.parse(raw.trim())
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((c) => ({
        code: String(c.code || c.course_code || '')
          .replace(/\s+/g, '')
          .toUpperCase()
          .slice(0, 16),
        name: String(c.name || c.course_title || 'Course').trim(),
      }))
      .filter((c) => c.code && c.name)
  } catch (e) {
    console.warn('fetchCurriculumBaselineList failed', e)
    return []
  }
}

export function stripJsonFence(raw) {
  let s = (raw || '').trim()
  if (s.startsWith('```json')) s = s.slice(7)
  if (s.startsWith('```')) s = s.slice(3)
  if (s.endsWith('```')) s = s.slice(0, -3)
  return s.trim()
}

/** Admin wizard: parse pasted syllabus text → { code, title, is_elective }[] */
export async function parseSyllabusPasteWithGroq(rawText) {
  if (!GROQ_API_KEY || !rawText?.trim()) return []
  try {
    const data = await callGroqAPI(
      [{ role: 'user', content: `Parse this syllabus text:\n\n${rawText.slice(0, 12000)}` }],
      GROQ_MODELS.PROFESSOR,
      { temperature: 0.2, systemPromptOverride: GROQ_PROMPTS.ADMIN_SYLLABUS_PARSE },
    )
    const raw = stripJsonFence(data?.choices?.[0]?.message?.content || '')
    const parsed = JSON.parse(raw)
    const arr = Array.isArray(parsed) ? parsed : parsed?.courses
    if (!Array.isArray(arr)) return []
    return arr
      .map((c) => ({
        code: String(c.code || c.course_code || '')
          .replace(/\s+/g, '')
          .toUpperCase()
          .slice(0, 16),
        title: String(c.title || c.name || c.course_title || '').trim(),
        is_elective: Boolean(c.is_elective),
      }))
      .filter((c) => c.code && c.title)
  } catch (e) {
    console.warn('parseSyllabusPasteWithGroq', e)
    return []
  }
}

/** "Fetch from web" (assistant): freeform query → suggested courses (no real browsing). */
export async function suggestSyllabusFromAiQuery(query) {
  if (!GROQ_API_KEY || !query?.trim()) return []
  try {
    const data = await callGroqAPI(
      [
        {
          role: 'user',
          content: `Admin query (infer university, faculty if mentioned, department, level, semester, and propose courses):\n${query.trim().slice(0, 2000)}`,
        },
      ],
      GROQ_MODELS.PROFESSOR,
      { temperature: 0.35, systemPromptOverride: GROQ_PROMPTS.ADMIN_WEB_ASSIST },
    )
    const raw = stripJsonFence(data?.choices?.[0]?.message?.content || '')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((c) => ({
        code: String(c.code || '')
          .replace(/\s+/g, '')
          .toUpperCase()
          .slice(0, 16),
        title: String(c.title || c.name || '').trim(),
        is_elective: Boolean(c.is_elective),
      }))
      .filter((c) => c.code && c.title)
  } catch (e) {
    console.warn('suggestSyllabusFromAiQuery', e)
    return []
  }
}

function mapGroqCourseArray(parsed) {
  if (!Array.isArray(parsed)) return []
  return parsed
    .map((c) => ({
      code: String(c.code || c.course_code || '')
        .replace(/\s+/g, '')
        .toUpperCase()
        .slice(0, 16),
      name: String(c.name || c.title || c.course_title || 'Course').trim(),
    }))
    .filter((c) => c.code && c.name)
}

export async function fetchGroqJambAlignedCourses({ country, university, department, level, semester }) {
  if (!GROQ_API_KEY) return []
  const userMsg = `Country: ${country || 'Nigeria'}
University: ${university || ''}
Department: ${department || 'General'}
Level: ${level || '100'}
Semester: ${semester || '1st'}
List JAMB / GST / UTME-aligned courses for this slot.`
  try {
    const data = await callGroqAPI([{ role: 'user', content: userMsg }], GROQ_MODELS.PROFESSOR, {
      temperature: 0.25,
      systemPromptOverride: GROQ_PROMPTS.SYLLABUS_JAMB_LAYER,
    })
    let raw = data?.choices?.[0]?.message?.content?.trim() || ''
    if (raw.startsWith('```json')) raw = raw.slice(7)
    if (raw.startsWith('```')) raw = raw.slice(3)
    if (raw.endsWith('```')) raw = raw.slice(0, -3)
    return mapGroqCourseArray(JSON.parse(raw.trim()))
  } catch (e) {
    console.warn('fetchGroqJambAlignedCourses', e)
    return []
  }
}

export async function fetchGroqHandbookWebCourses({ country, university, department, level, semester }) {
  if (!GROQ_API_KEY) return []
  const userMsg = `Country: ${country || 'Nigeria'}
University: ${university || ''}
Department: ${department || 'General'}
Level: ${level || '100'}
Semester: ${semester || '1st'}
Build the semester list from typical Nigerian faculty handbook / departmental expectations (synthetic merge of public information).`
  try {
    const data = await callGroqAPI([{ role: 'user', content: userMsg }], GROQ_MODELS.PROFESSOR, {
      temperature: 0.35,
      systemPromptOverride: GROQ_PROMPTS.SYLLABUS_HANDBOOK_WEB,
    })
    let raw = data?.choices?.[0]?.message?.content?.trim() || ''
    if (raw.startsWith('```json')) raw = raw.slice(7)
    if (raw.startsWith('```')) raw = raw.slice(3)
    if (raw.endsWith('```')) raw = raw.slice(0, -3)
    return mapGroqCourseArray(JSON.parse(raw.trim()))
  } catch (e) {
    console.warn('fetchGroqHandbookWebCourses', e)
    return []
  }
}

/**
 * Realtime typeahead: programme + level + partial query → matching { code, name }[].
 */
export async function fetchGroqLiveCourseSearch({
  query,
  country,
  university,
  department,
  level,
  semester,
}) {
  if (!GROQ_API_KEY) return []
  const q = String(query || '').trim().toUpperCase()
  if (q.length < 2) return []
  const userMsg = `Country: ${country || 'Nigeria'}
University: ${university || 'Unknown'}
Programme / department: ${department || 'General'}
Level: ${level || '100'} Level
Semester: ${semester || '1st'} semester

Student search text (uppercase, may be partial): "${q}"

Return matching courses for this programme and level.`
  try {
    const data = await callGroqAPI([{ role: 'user', content: userMsg }], GROQ_MODELS.PROFESSOR, {
      temperature: 0.35,
      systemPromptOverride: GROQ_PROMPTS.LIVE_COURSE_SEARCH,
    })
    let raw = data?.choices?.[0]?.message?.content?.trim() || ''
    raw = stripJsonFence(raw)
    return mapGroqCourseArray(JSON.parse(raw))
  } catch (e) {
    console.warn('fetchGroqLiveCourseSearch', e)
    return []
  }
}

/**
 * Enrich a manually added course (optionally with web snippet from /api/v1/syllabus/web).
 */
export async function enrichManualCourseWithGroq({
  code,
  name,
  country,
  university,
  department,
  level,
  semester,
  webSnippet = '',
}) {
  if (!GROQ_API_KEY) return null
  const userMsg = `Course code: ${code}
Student-provided title: ${name}
University: ${university || 'Unknown'}
Programme: ${department || 'General'}
Level: ${level || '100'} · Semester: ${semester || '1st'}
Country: ${country || 'Nigeria'}

Web / search snippets (may be empty; not verified):
${(webSnippet || '').slice(0, 6000)}`
  try {
    const data = await callGroqAPI([{ role: 'user', content: userMsg }], GROQ_MODELS.PROFESSOR, {
      temperature: 0.25,
      systemPromptOverride: GROQ_PROMPTS.MANUAL_COURSE_ENRICH,
    })
    const raw = stripJsonFence(data?.choices?.[0]?.message?.content || '')
    return JSON.parse(raw)
  } catch (e) {
    console.warn('enrichManualCourseWithGroq', e)
    return null
  }
}
