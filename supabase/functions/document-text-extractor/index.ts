// Document Text Extractor — Converts uploaded files to clean Markdown for AI
// Runs as a Supabase Edge Function (Deno)
//
// Supported formats: PDF, DOCX, PPTX, XLSX, CSV, TXT, HTML
//
// Environment secrets needed:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "npm:@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { materialId, fileType, fileName } = await req.json()

    if (!materialId) {
      throw new Error("Missing required: materialId")
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const ext = (fileType || fileName?.split(".").pop() || "").toLowerCase()

    console.log(`[TextExtractor] Processing ${materialId} (${ext})`)

    // Look up the material to get the storage path
    const { data: material, error: lookupError } = await supabase
      .from("materials")
      .select("source_url")
      .eq("id", materialId)
      .single()

    if (lookupError || !material?.source_url) {
      throw new Error(`Material not found or missing source_url: ${lookupError?.message || "unknown"}`)
    }

    // Extract storage path from source_url and download via service role client
    const urlObj = new URL(material.source_url)
    const pathParts = urlObj.pathname.split("/")
    // URL format: /storage/v1/object/public/materials/<user_id>/<file_name>
    // path is everything after /public/materials/
    const publicIdx = pathParts.indexOf("public")
    let storagePath: string
    if (publicIdx !== -1 && pathParts.length > publicIdx + 2) {
      storagePath = pathParts.slice(publicIdx + 2).join("/")
    } else {
      // Fallback: use the userId/fileName convention
      throw new Error("Could not derive storage path from source_url")
    }

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from("materials")
      .download(storagePath)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file from storage: ${downloadError?.message || "no data"}`)
    }

    const fileBuffer = await fileData.arrayBuffer()

    // Extract text based on format
    let markdown: string

    if (ext === "pdf") {
      markdown = await extractPdfText(fileBuffer)
    } else if (["docx", "doc"].includes(ext)) {
      markdown = await extractDocxText(fileBuffer)
    } else if (["pptx", "ppt"].includes(ext)) {
      markdown = await extractPptxText(fileBuffer)
    } else if (["xlsx", "xls"].includes(ext)) {
      markdown = await extractExcelText(fileBuffer)
    } else if (ext === "csv") {
      markdown = await extractCsvText(fileBuffer)
    } else if (["html", "htm"].includes(ext)) {
      markdown = await extractHtmlText(new TextDecoder().decode(fileBuffer))
    } else if (ext === "txt" || ext === "md") {
      markdown = new TextDecoder().decode(fileBuffer)
    } else {
      // Try as text
      markdown = new TextDecoder().decode(fileBuffer)
    }

    if (!markdown?.trim()) {
      throw new Error("No text could be extracted from this file")
    }

    // Chunk the text
    const chunks = chunkText(markdown, 1000, 200)

    // Save extracted text to materials table
    const { error: updateError } = await supabase
      .from("materials")
      .update({
        extracted_text: markdown,
        processing_status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", materialId)

    if (updateError) {
      throw new Error(`Failed to update material: ${updateError.message}`)
    }

    // Insert chunks into study_vault (in batches of 100)
    if (chunks.length > 0) {
      for (let i = 0; i < chunks.length; i += 100) {
        const batch = chunks.slice(i, i + 100).map((chunk, idx) => ({
          material_id: materialId,
          content: chunk,
          chunk_index: i + idx,
          user_id: null,
          course_id: null,
          created_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase
          .from("study_vault")
          .insert(batch)

        if (insertError) {
          console.error(`[TextExtractor] Chunk insert failed:`, insertError.message)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        materialId,
        word_count: markdown.split(/\s+/).length,
        chunk_count: chunks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("[TextExtractor] Error:", err.message)
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: corsHeaders }
    )
  }
})

// ─── Format Extractors ─────────────────────────────────────────────────────────

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  // Use pdfjs-dist in Deno-compatible mode
  const mod = await import("npm:pdfjs-dist@2.16.105")
  const doc = await mod.getDocument({ data: new Uint8Array(buffer) }).promise
  const pages: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item: any) => item.str).join(" ")
    if (text.trim()) {
      pages.push(`## Page ${i}\n\n${text.trim()}`)
    }
  }

  return pages.join("\n\n---\n\n")
}

async function extractDocxText(buffer: ArrayBuffer): Promise<string> {
  // mammoth returns HTML — we convert to Markdown-like output
  const mammoth = await import("npm:mammoth@1.8.0")
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value?.trim() || ""
}

async function extractPptxText(buffer: ArrayBuffer): Promise<string> {
  const JSZip = await import("npm:jszip@3.10.1")
  const zip = await JSZip.loadAsync(new Uint8Array(buffer))
  const slideFiles = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)![0])
      const nb = parseInt(b.match(/\d+/)![0])
      return na - nb
    })

  const slides: string[] = []
  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async("string")
    const matches = xml.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
    const text = matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ").trim()
    if (text) {
      slides.push(`## Slide ${i + 1}\n\n${text}`)
    }
  }

  return slides.join("\n\n---\n\n")
}

async function extractExcelText(buffer: ArrayBuffer): Promise<string> {
  const XLSX = await import("npm:xlsx@0.18.5")
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" })
  const sheets = workbook.SheetNames.map((name: string, i: number) => {
    const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[name])
    return `## Sheet: ${name}\n\n\`\`\`\n${csv}\n\`\`\``
  })
  return sheets.join("\n\n---\n\n")
}

async function extractCsvText(buffer: ArrayBuffer): Promise<string> {
  const text = new TextDecoder().decode(buffer)
  return `\`\`\`csv\n${text}\n\`\`\``
}

function extractHtmlText(html: string): string {
  // Strip HTML tags, keep structure
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/td>/gi, " ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

  return text
}

// ─── Text Chunking ────────────────────────────────────────────────────────────

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []

  if (words.length <= chunkSize) {
    return [text]
  }

  let i = 0
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ")
    chunks.push(chunk)
    i += chunkSize - overlap
  }

  return chunks
}
