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

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileUrl, fileName, materialId } = await req.json()

    if (!fileUrl || !materialId) {
      throw new Error('Missing required parameters: fileUrl or materialId')
    }

    console.log(`[Converter] Starting conversion for material ${materialId}: ${fileName}`)

    // 1. Fetch the original PPTX from storage (or external URL)
    const pptxRes = await fetch(fileUrl)
    if (!pptxRes.ok) throw new Error(`Failed to fetch original file: ${pptxRes.statusText}`)
    const pptxBlob = await pptxRes.blob()

    // 2. Call Cloudmersive API to convert PPTX to PDF
    console.log('[Converter] Sending to Cloudmersive API...')
    const formData = new FormData()
    formData.append('inputFile', pptxBlob, fileName || 'presentation.pptx')

    const convertRes = await fetch('https://api.cloudmersive.com/convert/pptx/to/pdf', {
      method: 'POST',
      headers: { 
        'Apikey': CLOUDMERSIVE_API_KEY || '' 
      },
      body: formData
    })

    if (!convertRes.ok) {
        const errorText = await convertRes.text()
        throw new Error(`Cloudmersive conversion failed: ${errorText}`)
    }
    
    const pdfBlob = await convertRes.blob()
    console.log('[Converter] ✓ PDF generated successfully')

    // 3. Upload the generated PDF to Supabase Storage
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    const pdfPath = `converted/${materialId}.pdf`
    console.log(`[Converter] Uploading to storage: ${pdfPath}`)
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('study-materials')
      .upload(pdfPath, pdfBlob, { 
        contentType: 'application/pdf', 
        upsert: true 
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('study-materials')
      .getPublicUrl(pdfPath)

    // 4. Update the material metadata in the database
    console.log('[Converter] Updating material metadata...')
    const { error: updateError } = await supabase
      .from('materials')
      .update({ 
        metadata: { 
          pdf_url: publicUrl, 
          converted: true,
          conversion_date: new Date().toISOString()
        } 
      })
      .eq('id', materialId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ success: true, pdfUrl: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (error: any) {
    console.error(`[Converter] Error: ${error.message || 'Unknown error'}`)
    return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), { 
        status: 500,
        headers: corsHeaders
    })
  }
})
