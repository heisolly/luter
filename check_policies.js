import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: "select * from pg_policies where tablename = 'material_collaborators'" });
  console.log('Polices for material_collaborators:', data, error);
  
  const { data: cData, error: cErr } = await supabase.rpc('exec_sql', { sql_query: "select * from pg_policies where tablename = 'courses'" });
  console.log('Polices for courses:', cData, cErr);
}
run();
