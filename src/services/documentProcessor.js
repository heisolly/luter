/**
 * Client-side document text extraction service.
 * Handles PDF, DOCX, PPT, images, and YouTube transcripts via Groq Whisper.
 */

import { GROQ_API_KEY, GROQ_BASE_URL, GROQ_MODELS } from '../groqClient'

// ─── PDF ─────────────────────────────────────────────────────────────────────

export async function extractPdfText(file) {
  const pdfjsLib = await import('pdfjs-dist')
  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items.map(item => item.str).join(' ')
    pages.push(pageText)
  }

  return pages.join('\n\n').trim()
}

// ─── DOCX ─────────────────────────────────────────────────────────────────────

export async function extractDocxText(file) {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value.trim()
}

// ─── PPT/PPTX — use Groq to summarize since no browser PPT parser ─────────────

export async function extractPptText(file) {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(file)
    const slideFiles = Object.keys(zip.files).filter(name =>
      name.match(/^ppt\/slides\/slide\d+\.xml$/)
    ).sort()

    const texts = []
    for (const slideName of slideFiles) {
      const xml = await zip.files[slideName].async('string')
      const matches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
      const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ')
      if (slideText.trim()) texts.push(slideText.trim())
    }

    return texts.join('\n\n').trim() || 'Could not extract text from this PowerPoint file.'
  } catch {
    return 'Could not extract text from this PowerPoint file. Try converting it to PDF first.'
  }
}

// ─── Image/Video OCR — Groq Vision ──────────────────────────────────────────

export async function extractImageText(file) {
  const base64 = await fileToBase64(file)
  const mimeType = file.type || 'image/jpeg'

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODELS.VISION,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: 'Extract and transcribe all text visible in this image. If it contains diagrams or charts, describe them briefly. Output plain text only.',
            },
          ],
        },
      ],
      temperature: 0.1,
    }),
  })

  if (!response.ok) throw new Error(`Vision API error: ${response.status}`)
  const data = await response.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

// ─── Audio/Video Speech-to-Text — Groq Whisper ───────────────────────────────

export async function transcribeMedia(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('model', GROQ_MODELS.WHISPER)
  formData.append('response_format', 'verbose_json')
  formData.append('language', 'en')

  const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) throw new Error(`Whisper API error: ${response.status}`)
  const data = await response.json()
  return data.text.trim()
}

// ─── YouTube — fetch transcript via a public proxy ────────────────────────────

export async function extractYoutubeTranscript(url) {
  const videoId = extractYoutubeId(url)
  if (!videoId) return ''

  try {
    const proxyUrl = `https://yt-transcript-proxy.vercel.app/api/transcript?videoId=${videoId}`
    const res = await fetch(proxyUrl)
    if (!res.ok) throw new Error('Proxy failed')
    const data = await res.json()
    if (Array.isArray(data)) {
      return data.map(item => item.text).join(' ').trim()
    }
  } catch {
    // Proxy unavailable
  }

  return ''
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractYoutubeId(url) {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] || null
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Main entry point — detects file type and runs the right extractor.
 * Returns extracted text string.
 */
export async function extractTextFromFile(file, type) {
  // Support for audio/video files via Whisper
  if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
    return transcribeMedia(file)
  }

  switch (type) {
    case 'pdf':
      return extractPdfText(file)
    case 'docx':
      return extractDocxText(file)
    case 'ppt':
      return extractPptText(file)
    case 'image':
      return extractImageText(file)
    default:
      return file.text()
  }
}
