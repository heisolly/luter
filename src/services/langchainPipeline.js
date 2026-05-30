/**
 * LangChain.js RAG Pipeline for Luter — 100% Groq-powered
 * Strategy: RecursiveCharacterTextSplitter extracts chunks,
 * stored in Supabase study_vault. At query time, we do a
 * full-text search in Supabase (no vector DB needed) and feed
 * the best chunks into Groq's 128k context window for grounded answers.
 *
 * No Google API key required.
 */

import { ChatGroq } from '@langchain/groq'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { Document } from '@langchain/core/documents'
import { supabase } from '../supabaseClient'
import { GROQ_API_KEY, GROQ_MODELS, LUTER_SYSTEM_PROMPT } from '../groqClient'
import { GEMINI_API_KEY, GEMINI_MODELS } from '../geminiClient'
import { Readability } from '@mozilla/readability'

import * as pdfjsLib from 'pdfjs-dist'

// PDF Worker Initialization
const PDF_WORKER_URL = 'https://unpkg.com/pdfjs-dist@2.16.105/build/pdf.worker.min.js'

if (typeof window !== 'undefined' && pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL
}

/** Race a promise against a timeout */
function withTimeout(promise, ms, label = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    )
  ])
}

/** Trigger Supabase Edge Function to convert PPTX to PDF
 *  DEPRECATED: materialsService.js handles conversion via triggerDocumentConversion.
 *  This is kept as a no-op to avoid CORS errors from the old pptx-to-pdf endpoint.
 */
async function triggerConversion(material) {
  // Conversion is now handled by materialsService.js postUploadProcessing
  // which calls the document-processor Edge Function.
  console.log('[Conversion] Skipping legacy triggerConversion — handled by materialsService.js')
  return null
}

// ─── LangChain Groq Client ────────────────────────────────────────────────────

export const getLLM = (model = GROQ_MODELS.PROFESSOR) => {
  const isGroqConfigured = import.meta.env.VITE_GROQ_API_KEY || GROQ_API_KEY
  const isGeminiConfigured = import.meta.env.VITE_GEMINI_API_KEY || GEMINI_API_KEY

  if (!isGroqConfigured && isGeminiConfigured) {
    console.log('[LangChain] Groq API key is missing. Using Gemini model in the RAG pipeline...')
    const geminiModel = model === GROQ_MODELS.PROFESSOR ? GEMINI_MODELS.PRO : GEMINI_MODELS.FLASH
    return new ChatGoogleGenerativeAI({
      apiKey: import.meta.env.VITE_GEMINI_API_KEY || GEMINI_API_KEY,
      model: geminiModel,
      temperature: 0.2
    })
  }

  return new ChatGroq({
    apiKey: GROQ_API_KEY,
    model,
    temperature: 0.2,
    maxTokens: 3000,
  })
}

// ─── Text Splitter ────────────────────────────────────────────────────────────

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
})

// ─── Format-specific Extractors ───────────────────────────────────────────────

/** Extract pages from PDF using pdfjs-dist */
async function extractPdfText(file) {
  const fileData = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: fileData }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map(item => item.str).join(' ').trim()
    if (text) pages.push({ text, pageNumber: i })
  }
  return pages
}

/** Extract raw text from DOCX using mammoth */
async function extractDocxText(file) {
  const mammoth = await import('mammoth')
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  const raw = value.trim()
  const chunks = []
  for (let i = 0; i < raw.length; i += 2000) {
    chunks.push({ text: raw.slice(i, i + 2000), pageNumber: Math.floor(i / 2000) + 1 })
  }
  return chunks
}

/** Slide-by-slide extraction from PPTX using JSZip */
async function extractPptxText(file) {
  const JSZip = (await import('jszip')).default
  const zip = await JSZip.loadAsync(file)
  const slideFiles = Object.keys(zip.files)
    .filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)[0])
      const nb = parseInt(b.match(/\d+/)[0])
      return na - nb
    })
  const slides = []
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async('string')
    const matches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
    const text = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim()
    if (text) slides.push({ text, pageNumber: i + 1, slideNumber: i + 1 })
  }
  return slides
}

/** Row/col extraction from Excel/CSV using SheetJS */
async function extractExcelText(file) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  return workbook.SheetNames.map((sheetName, i) => ({
    text: `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])}`,
    pageNumber: i + 1,
    sheetName,
  }))
}

/** Fetch YouTube transcript via public proxy */
async function extractYoutubeTranscript(url) {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
  const videoId = match?.[1]
  if (!videoId) return []
  try {
    // Try the Tactiq public proxy (no auth needed)
    const res = await fetch(
      `https://tactiq-apps-prod.tactiq.io/transcript?videoUrl=https://www.youtube.com/watch?v=${videoId}&lang=en`
    )
    if (!res.ok) throw new Error('proxy failed')
    const data = await res.json()
    const items = data?.captions || []
    const chunks = []
    let current = '', startTime = 0
    for (const entry of items) {
      current += ' ' + (entry.text || '')
      if (current.length > 800) {
        chunks.push({ text: current.trim(), timestamp: Math.floor(startTime), pageNumber: chunks.length + 1 })
        current = ''
        startTime = entry.start || 0
      }
    }
    if (current.trim()) chunks.push({ text: current.trim(), timestamp: Math.floor(startTime), pageNumber: chunks.length + 1 })
    return chunks
  } catch {
    return []
  }
}

/** Groq Vision OCR for images — uses existing GROQ_API_KEY */
async function extractImageText(file) {
  const reader = new FileReader()
  const base64 = await new Promise((res, rej) => {
    reader.onload = () => res(reader.result.split(',')[1])
    reader.onerror = rej
    reader.readAsDataURL(file)
  })
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODELS.VISION,
      messages: [{ role: 'user', content: [
        { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
        { type: 'text', text: 'Transcribe all visible text from this image or slide. Output plain text only.' },
      ]}],
      temperature: 0.1,
    }),
  })
  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content?.trim() || ''
  return text ? [{ text, pageNumber: 1 }] : []
}

/** Groq Whisper for audio/video transcription */
async function transcribeMedia(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', GROQ_MODELS.WHISPER)
  formData.append('response_format', 'verbose_json')
  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
    body: formData,
  })
  if (!response.ok) throw new Error(`Whisper error: ${response.status}`)
  const data = await response.json()
  const text = data?.text?.trim() || ''
  return text ? [{ text, pageNumber: 1 }] : []
}

/** Extract text from websites using Readability */
async function extractWebText(url) {
  try {
    // We use a CORS proxy for browser-side scraping if needed, 
    // but here we try direct fetch first (works for some)
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`)
    const data = await res.json()
    const html = data.contents
    
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const reader = new Readability(doc)
    const article = reader.parse()
    
    if (!article?.textContent) return []
    return [{ text: article.textContent.trim(), pageNumber: 1, isWeb: true }]
  } catch (err) {
    console.error('Web extraction failed:', err)
    return []
  }
}

/** Extract text from Anki .apkg files (simplified) */
async function extractAnkiText(file) {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(file)
    // .apkg is essentially a zip with 'collection.anki2' (sqlite)
    // For now, we look for 'media' or any text files to get a baseline
    // In a full implementation, we'd use sql.js to query the 'notes' table
    let fullText = ''
    for (const [name, entry] of Object.entries(zip.files)) {
      if (!entry.dir && (name.endsWith('.txt') || name.endsWith('.json'))) {
        fullText += await entry.async('string') + '\n'
      }
    }
    return fullText ? [{ text: fullText.trim(), pageNumber: 1 }] : []
  } catch (err) {
    console.error('Anki extraction failed:', err)
    return []
  }
}

// ─── Universal Extractor ──────────────────────────────────────────────────────

/**
 * Auto-detect format and extract structured text chunks.
 * Returns: Array<{ text, pageNumber, ...extras }>
 */
export async function extractTextChunks(file, type, url) {
  // 1. Check URL first (Web/YouTube)
  if (url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return extractYoutubeTranscript(url)
    }
    // Generic website
    const webChunks = await extractWebText(url)
    if (webChunks.length) return webChunks
  }

  if (!file) return []
  const t = (type || file?.name?.split('.').pop() || '').toLowerCase()

  // 2. Media / Whisper
  if (file.type?.startsWith('audio/') || file.type?.startsWith('video/') ||
      ['mp4', 'mp3', 'wav', 'webm', 'mov', 'ogg'].some(ext => t === ext)) {
    return transcribeMedia(file)
  }

  // 3. Images / Vision
  if (file.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].some(ext => t === ext)) {
    return extractImageText(file)
  }

  // 4. Documents
  if (t === 'pdf' || file.type?.includes('pdf')) return extractPdfText(file)
  if (t === 'docx' || t === 'doc') return extractDocxText(file)
  if (t === 'pptx' || t === 'ppt') return extractPptxText(file)
  if (t === 'xlsx' || t === 'xls' || t === 'csv') return extractExcelText(file)
  if (t === 'anki' || t === 'apkg') return extractAnkiText(file)

  // Plain text fallback
  const raw = await file.text().catch(() => '')
  return raw ? [{ text: raw, pageNumber: 1 }] : []
}

// ─── Ingestion Pipeline ───────────────────────────────────────────────────────

/**
 * Full pipeline: extract → LangChain chunk → save to Supabase study_vault + materials
 * @param {object} opts
 * @param {File|null}   opts.file
 * @param {string}      opts.type         Material type (pdf, docx, youtube, etc.)
 * @param {string|null} opts.url           Source URL (required for YouTube links)
 * @param {object}      opts.metadata      { materialId, courseId, userId, title }
 */
export async function ingestMaterial({ file, type, url, metadata }) {
  try {
    // 1. Extract raw text chunks (with timeout guard to prevent pending-forever hangs)
    const rawChunks = await withTimeout(
      extractTextChunks(file, type, url),
      45000,
      'Text extraction'
    )
    if (!rawChunks.length) throw new Error('No text could be extracted from this material.')

    // 2. Build LangChain Documents
    const langDocs = rawChunks.map(chunk =>
      new Document({
        pageContent: chunk.text,
        metadata: {
          materialId:  metadata.materialId || metadata.material_id,
          courseId:    metadata.courseId   || metadata.course_id || null,
          userId:      metadata.userId     || metadata.user_id   || null,
          title:       metadata.title      || 'Untitled',
          type:        type                || 'unknown',
          pageNumber:  chunk.pageNumber    ?? 1,
          ...(chunk.timestamp   != null ? { timestamp:   chunk.timestamp   } : {}),
          ...(chunk.slideNumber != null ? { slideNumber: chunk.slideNumber } : {}),
          ...(chunk.sheetName   != null ? { sheetName:   chunk.sheetName   } : {}),
        },
      })
    )

    // 3. Split into fine-grained chunks with LangChain
    const splitDocs = await splitter.splitDocuments(langDocs)

    // 4. Upsert chunks into study_vault (Supabase full-text, no vectors)
    const rows = splitDocs.map(doc => ({
      content:     doc.pageContent,
      metadata:    doc.metadata,
      material_id: metadata.materialId,
      course_id:   metadata.courseId  || null,
      user_id:     metadata.userId    || null,
    }))

    // Insert in batches of 100
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase
        .from('study_vault')
        .insert(rows.slice(i, i + 100))
      if (error) console.warn('[LangChain] study_vault insert error:', error.message)
    }

    // 5. Save full extracted_text back to materials table + mark ready
    const fullText = rawChunks.map(c => c.text).join('\n\n')
    const { error: updateError } = await withTimeout(
      supabase
        .from('materials')
        .update({ extracted_text: fullText, processing_status: 'ready' })
        .eq('id', metadata.materialId),
      15000,
      'Material status update'
    )

    if (updateError) {
      console.error('[LangChain] materials update failed:', updateError)
      throw new Error(`Failed to update material metadata: ${updateError.message}`)
    }

    // 6. Trigger PPTX Conversion in background (if applicable)
    // We don't await this to keep the ingest fast, or we can await it if we want the user to wait
    triggerConversion({
      id: metadata.materialId,
      type: type || 'pptx',
      source_url: url || metadata.source_url,
      title: metadata.title
    }).catch(err => console.warn('[LangChain] Conversion trigger error:', err))

    console.log(`[LangChain] ✓ Ingested ${splitDocs.length} chunks for "${metadata.title}"`)
    return { success: true, chunkCount: splitDocs.length, fullText }
  } catch (err) {
    console.error('[LangChain] Ingestion failed:', err)
    await supabase
      .from('materials')
      .update({ processing_status: 'failed' })
      .eq('id', metadata.materialId)
    return { success: false, error: err.message }
  }
}

// ─── Supabase Full-Text Chunk Retrieval ───────────────────────────────────────

/**
 * Retrieve relevant chunks from Supabase study_vault using keyword matching.
 * This is our "retrieval" layer — no vector DB needed.
 * Groq's 128k context window does the semantic reasoning.
 */
async function retrieveRelevantChunks(question, courseId, materialId, limit = 8) {
  try {
    // Build query — filter by course/material/deck, order by most recent
    let query = supabase
      .from('study_vault')
      .select('content, metadata')
      .order('created_at', { ascending: false })
      .limit(limit * 4) // Fetch more than we need, then score

    if (Array.isArray(materialId)) {
      query = query.in('material_id', materialId)
    } else if (materialId) {
      query = query.eq('material_id', materialId)
    } else if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data, error } = await query
    if (error || !data?.length) return []

    // Simple keyword relevance scoring (client-side)
    const keywords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const scored = data.map(row => {
      const text = row.content.toLowerCase()
      const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0)
      return { ...row, score }
    })

    // Return top-scoring unique chunks
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => ({
        content:    r.content,
        pageNumber: r.metadata?.pageNumber,
        timestamp:  r.metadata?.timestamp,
        title:      r.metadata?.title,
      }))
  } catch (err) {
    console.warn('[LangChain] Chunk retrieval error:', err)
    return []
  }
}

// ─── RAG Prompt ───────────────────────────────────────────────────────────────

const TUTOR_PROMPT = PromptTemplate.fromTemplate(`
You are Luter Tutor. Your mission is to provide 'Clean Clarity' — concise, direct, and academic answers.

Rules for your layout:
1. BE CONCISE: Answer the question directly in 2-3 short paragraphs maximum. Avoid fluff.
2. SIMPLE HIGHLIGHTS: Use **bolding** for only the 2-3 most critical terms.
3. MINIMAL LISTS: Use bullet points only if absolutely necessary for steps.
4. EVIDENCE: Use [View Source](source://page|X|text|SNIPPET) for 1-2 key claims only.
5. NO REPETITION: Don't repeat what the student said.

ALWAYS end your response with exactly three suggested follow-up questions formatted like this:
---SUGGESTIONS--- Question 1 | Question 2 | Question 3

Study Material Context:
{context}

Student's Question: {question}

Luter's Direct Answer:
`)

// ─── Main RAG Query ───────────────────────────────────────────────────────────

/**
 * Query study materials using LangChain + Groq.
 * Retrieves relevant chunks from Supabase, then feeds them to Groq.
 *
 * @param {string}  question         The student's question
 * @param {string}  courseId         Filter to this course
 * @param {string}  [materialId]     Optionally restrict to one material
 * @param {string}  [fallbackContext] Raw extracted_text used if no chunks found
 */
export async function queryStudyMaterials({ question, courseId, materialId, fallbackContext }) {
  try {
    const llm = getLLM(GROQ_MODELS.PROFESSOR)

    // 1. Retrieve relevant chunks from Supabase
    const chunks = await retrieveRelevantChunks(question, courseId, materialId)

    // 2. Build context string
    let contextText = ''
    if (chunks.length) {
      contextText = chunks.map(chunk => {
        const loc = chunk.pageNumber
          ? `[Page ${chunk.pageNumber}]`
          : chunk.timestamp != null
          ? `[~${Math.floor(chunk.timestamp / 60)}m${chunk.timestamp % 60}s]`
          : ''
        return `${loc} ${chunk.content}`
      }).join('\n\n')
    } else if (fallbackContext) {
      // Fallback: use raw extracted_text (fits in Groq's 128k window)
      contextText = fallbackContext.slice(0, 12000)
    } else {
      contextText = 'No study material context is available.'
    }

    // 3. LangChain chain: prompt → Groq → string
    const chain = RunnableSequence.from([
      TUTOR_PROMPT,
      llm,
      new StringOutputParser(),
    ])

    console.log(`[LangChain] Querying Luter with ${contextText.length} chars of context...`)
    return chain.invoke({ context: contextText, question })
  } catch (err) {
    console.error('[LangChain] RAG query failed, trying emergency direct fallback:', err)
    // Last-resort fallback: direct Groq call with raw context
    if (fallbackContext) {
      console.log('[LangChain] Fallback active: using raw extracted_text (8k window)')
      try {
        const response = await callGroqAPI([
          { role: 'user', content: `Context:\n${fallbackContext.slice(0, 8000)}\n\nQuestion: ${question}` }
        ], GROQ_MODELS.SPEEDSTER, { systemPromptOverride: TUTOR_PROMPT.template })
        return typeof response === 'string' ? response : response.choices[0].message.content
      } catch (fallbackErr) {
        console.error('[LangChain] Emergency fallback failed:', fallbackErr)
        throw fallbackErr
      }
    }
    throw err
  }
}

// ─── Battle Quiz Generator ────────────────────────────────────────────────────

const BATTLE_QUIZ_PROMPT = PromptTemplate.fromTemplate(`
You are an elite Academic Battle Judge for a competitive Nigerian university study game.
Generate exactly {count} multiple-choice questions using ONLY the provided study material.

Return ONLY a valid JSON array — no extra text, no markdown fence:
[
  {{
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "answer": "A",
    "explanation": "Brief explanation citing the material",
    "source": "Page X or timestamp or section name",
    "difficulty": "easy|medium|hard"
  }}
]

Study Material:
{context}

Generate {count} battle questions:
`)

/**
 * Generate battle quiz questions from Supabase study vault.
 * Falls back to extractedText if no chunks are available.
 */
export async function generateBattleQuestions({ courseId, materialId, count = 10, fallbackContext }) {
  try {
    const llm = getLLM(GROQ_MODELS.PROFESSOR)

    // Retrieve chunks or use fallback
    const chunks = await retrieveRelevantChunks('key concepts definitions important', courseId, materialId, 12)
    const context = chunks.length
      ? chunks.map(c => c.content).join('\n\n').slice(0, 10000)
      : (fallbackContext || '').slice(0, 10000)

    if (!context.trim()) {
      return { success: false, error: 'No study material available for question generation.', questions: [] }
    }

    const chain = RunnableSequence.from([BATTLE_QUIZ_PROMPT, llm, new StringOutputParser()])
    const raw = await chain.invoke({ context, count })

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('LLM did not return valid JSON')
    return { success: true, questions: JSON.parse(jsonMatch[0]) }
  } catch (err) {
    console.error('[LangChain] Battle question generation failed:', err)
    return { success: false, error: err.message, questions: [] }
  }
}

// ─── Summary Generator ────────────────────────────────────────────────────────

/**
 * Quick Groq summary for a material — used by WorkstationTools
 */
export async function summariseMaterial(extractedText, title) {
  try {
    const llm = getLLM(GROQ_MODELS.SPEEDSTER)
    const chain = RunnableSequence.from([
      PromptTemplate.fromTemplate(`Create a concise, structured academic summary of this material titled "{title}".
Focus on: core thesis, main arguments, key definitions, and conclusions.
Format in clean Markdown.

Material:
{context}

Summary:`),
      llm,
      new StringOutputParser(),
    ])
    return chain.invoke({ title: title || 'Document', context: extractedText.slice(0, 10000) })
  } catch (err) {
    console.error('[LangChain] Summary failed:', err)
    throw err
  }
}

// ─── Polling Helper ───────────────────────────────────────────────────────────

/**
 * Poll a material row until extracted_text is populated or status is 'failed'.
 * Returns a cleanup function to stop polling.
 */
export function pollMaterialUntilReady(
  materialId,
  { onReady, onFailed, intervalMs = 2000, maxAttempts = 40 } = {}
) {
  let attempts = 0
  const timer = setInterval(async () => {
    attempts++
    const { data } = await supabase
      .from('materials')
      .select('extracted_text, processing_status')
      .eq('id', materialId)
      .single()

    if (data?.extracted_text) {
      clearInterval(timer)
      onReady?.(data.extracted_text)
    } else if (data?.processing_status === 'failed' || attempts >= maxAttempts) {
      clearInterval(timer)
      onFailed?.()
    }
  }, intervalMs)

  return () => clearInterval(timer)
}

/**
 * Emergency: Reprocess a material if text extraction was missed.
 * Fetches the file from source_url and triggers ingestion.
 */
export async function reprocessMaterial(material) {
  if (!material?.source_url) return { success: false, error: 'No source URL' }
  if (material?.type === 'youtube') return { success: false, error: 'YouTube videos have no downloadable content' }
  
  try {
    console.log(`[LangChain] Triggering emergency re-processing for: ${material.title}`)
    
    // 1. Fetch the file as a Blob
    const response = await fetch(material.source_url)
    const blob = await response.blob()
    
    // 2. Create a File object (simulating a user upload)
    const fileName = material.title || 'document'
    const file = new File([blob], fileName, { type: blob.type })
    
    // 3. Call ingestMaterial
    return await ingestMaterial({
      file,
      type: material.type,
      url: null,
      metadata: {
        materialId: material.id,
        courseId: material.course_id,
        userId: material.user_id,
        title: material.title
      }
    })
  } catch (err) {
    console.error('[LangChain] Emergency re-processing failed:', err)
    return { success: false, error: err.message }
  }
}
