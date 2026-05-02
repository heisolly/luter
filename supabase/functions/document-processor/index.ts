// @ts-nocheck
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "@supabase/supabase-js"

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
    const { fileUrl, materialId, fileType, fileName, userId } = await req.json()

    if (!fileUrl || !materialId || !fileType) {
      throw new Error('Missing required parameters: fileUrl, materialId, or fileType')
    }

    console.log(`[Processor] Starting conversion for material ${materialId} (${fileType}): ${fileName}`)

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // ─── 1. INSERT/UPDATE CONVERSION JOB ─────────────────────────────────────
    await supabase
      .from('conversion_jobs')
      .upsert({
        material_id: materialId,
        user_id: userId || null,
        source_url: fileUrl,
        file_type: fileType,
        status: 'processing',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'material_id' })

    // ─── 2. FETCH ORIGINAL FILE ─────────────────────────────────────────────
    const originalRes = await fetch(fileUrl)
    if (!originalRes.ok) throw new Error(`Failed to fetch original file: ${originalRes.status}`)
    const originalBlob = await originalRes.blob()

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
      .from('study-materials')
      .upload(pdfPath, convertedBlob, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('study-materials')
      .getPublicUrl(pdfPath)

    // ─── 5. UPDATE MATERIALS TABLE ───────────────────────────────────────────
    console.log(`[Processor] Updating material ${materialId} with converted URL`)
    const { error: updateError } = await supabase
      .from('materials')
      .update({
        converted_url: publicUrl,
        converted_type: outputType,
        converted_at: new Date().toISOString(),
        render_quality: 'high_fidelity',
      })
      .eq('id', materialId)

    if (updateError) throw updateError

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
