import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const materialId = '45ae8a49-bfb4-423d-8895-b7ecfe3770c5';
  
  const { data: material } = await supabase.from('materials').select('extracted_text').eq('id', materialId).single();
  console.log('materials.extracted_text:', material?.extracted_text ? 'EXISTS (' + material.extracted_text.length + ' chars)' : 'EMPTY');
  
  const { data: analysis } = await supabase.from('material_analysis').select('analysis_json').eq('material_id', materialId).single();
  console.log('material_analysis.analysis_json.extracted_text:', analysis?.analysis_json?.extracted_text ? 'EXISTS (' + analysis.analysis_json.extracted_text.length + ' chars)' : 'EMPTY');

  const { data: vault } = await supabase.from('study_vault').select('content').eq('material_id', materialId);
  console.log('study_vault chunks:', vault?.length);
  if (vault?.length > 0) {
    console.log('First chunk length:', vault[0].content.length);
  }
}
check();
