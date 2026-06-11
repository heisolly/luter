// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js"

const CLOUDMERSIVE_API_KEY = Deno.env.get('CLOUDMERSIVE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { materialId, fileType, fileName, userId } = await req.json()

    if (!materialId || !fileType) {
      throw new Error('Missing required parameters: materialId or fileType')
    }

    console.log(`[Processor] Starting conversion for material ${materialId} (${fileType}): ${fileName}`)

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // ─── 0. LOOK UP MATERIAL FOR STORAGE PATH ────────────────────────────────
    const { data: material, error: lookupError } = await supabase
      .from("materials")
      .select("source_url")
      .eq("id", materialId)
      .single()

    if (lookupError || !material?.source_url) {
      throw new Error(`Material not found or missing source_url: ${lookupError?.message || "unknown"}`)
    }

    const urlObj = new URL(material.source_url)
    const pathParts = urlObj.pathname.split("/")
    const publicIdx = pathParts.indexOf("public")
    let storagePath: string
    if (publicIdx !== -1 && pathParts.length > publicIdx + 2) {
      storagePath = pathParts.slice(publicIdx + 2).join("/")
    } else {
      throw new Error("Could not derive storage path from source_url")
    }

    // ─── 1. INSERT/UPDATE CONVERSION JOB ─────────────────────────────────────
    await supabase
      .from('conversion_jobs')
      .upsert({
        material_id: materialId,
        user_id: userId || null,
        source_url: material.source_url,
        file_type: fileType,
        status: 'processing',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'material_id' })

    // ─── 2. FETCH ORIGINAL FILE VIA SERVICE ROLE ─────────────────────────────
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from("materials")
      .download(storagePath)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file from storage: ${downloadError?.message || "no data"}`)
    }

    const originalBlob = fileData

    let convertedBlob: Blob | null = null
    let outputType = 'pdf'

    // ─── 3. CONVERT VIA CLOUDMERSIVE ────────────────────────────────────────
    if (fileType === 'docx' || fileType === 'doc') {
      console.log('[Processor] Converting DOCX → PDF via Cloudmersive...')
      const formData = new FormData()
      formData.append('inputFile', originalBlob, fileName || 'document.docx')

      const convertRes = await fetch('https://api.cloudmersive.com/convert/docx/to/pdf', {
        method: 'POST',
        headers: { 'Apikey': CLOUDMERSIVE_API_KEY || '' },
        body: formData
      })
      if (!convertRes.ok) throw new Error(`Cloudmersive DOCX→PDF failed: ${await convertRes.text()}`)
      convertedBlob = await convertRes.blob()

    } else if (fileType === 'pptx' || fileType === 'ppt') {
      console.log('[Processor] Converting PPTX → PDF via Cloudmersive...')
      const formData = new FormData()
      formData.append('inputFile', originalBlob, fileName || 'presentation.pptx')

      const convertRes = await fetch('https://api.cloudmersive.com/convert/pptx/to/pdf', {
        method: 'POST',
        headers: { 'Apikey': CLOUDMERSIVE_API_KEY || '' },
        body: formData
      })
      if (!convertRes.ok) throw new Error(`Cloudmersive PPTX→PDF failed: ${await convertRes.text()}`)
      convertedBlob = await convertRes.blob()

    } else if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'csv') {
      console.log('[Processor] Converting XLSX → PDF via Cloudmersive...')
      const formData = new FormData()
      formData.append('inputFile', originalBlob, fileName || 'spreadsheet.xlsx')

      const convertRes = await fetch('https://api.cloudmersive.com/convert/xlsx/to/pdf', {
        method: 'POST',
        headers: { 'Apikey': CLOUDMERSIVE_API_KEY || '' },
        body: formData
      })
      if (!convertRes.ok) throw new Error(`Cloudmersive XLSX→PDF failed: ${await convertRes.text()}`)
      convertedBlob = await convertRes.blob()
    } else {
      throw new Error(`Unsupported conversion type: ${fileType}`)
    }

    // ─── 4. UPLOAD CONVERTED PDF TO STORAGE ──────────────────────────────────
    const pdfPath = `converted/${materialId}.pdf`
    console.log(`[Processor] Uploading converted PDF: ${pdfPath}`)

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(pdfPath, convertedBlob, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('[EdgeFunction] Storage upload failed:', uploadError)
      throw uploadError
    }
    console.log('[EdgeFunction] Storage upload success:', pdfPath)

    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl(pdfPath)

    // ─── 5. UPDATE MATERIALS TABLE ───────────────────────────────────────────
    console.log(`[Processor] Updating material ${materialId} with converted URL`)
    const { error: updateError } = await supabase
      .from('materials')
      .update({
        converted_url: publicUrl,
        converted_type: outputType,
        converted_at: new Date().toISOString(),
      })
      .eq('id', materialId)

    if (updateError) {
      console.error('[EdgeFunction] CRITICAL: DB update failed:', updateError)
      throw new Error(`DB update failed: ${updateError.message}`)
    }
    console.log('[EdgeFunction] DB updated successfully:', publicUrl)

    // ─── 6. MARK JOB COMPLETED ───────────────────────────────────────────────
    await supabase
      .from('conversion_jobs')
      .update({
        status: 'completed',
        output_urls: { converted_url: publicUrl },
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('material_id', materialId)

    return new Response(JSON.stringify({
      success: true,
      convertedUrl: publicUrl,
      materialId,
      fileType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error(`[Processor] Error: ${error.message || 'Unknown error'}`)

    // Mark job failed if we have materialId
    try {
      const body = await req.clone().json()
      const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
      await supabase
        .from('conversion_jobs')
        .update({
          status: 'failed',
          error_message: error.message || 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('material_id', body.materialId)
    } catch (_e) { /* ignore */ }

    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
      status: 500,
      headers: corsHeaders
    })
  }
})
