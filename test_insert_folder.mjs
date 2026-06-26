import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const matchUrl = env.match(/VITE_SUPABASE_URL=(.*)/);
const matchKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/);
const supabase = createClient(matchUrl[1].trim(), matchKey[1].trim());

async function run() {
  const uniqueCode = 'FOLDER_TEST_' + Date.now();
  const { data, error } = await supabase.from('courses').insert({
    code: uniqueCode, name: 'Test Folder', faculty: 'General', source_type: 'user_folder', is_active: true
  }).select();
  console.log(error ? error : data);
}
run();
