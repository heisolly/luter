import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = fs.readFileSync('.env', 'utf8');
const matchUrl = env.match(/VITE_SUPABASE_URL=(.*)/);
const matchKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const supabase = createClient(matchUrl[1].trim(), matchKey[1].trim());

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'select * from pg_policies where tablename IN (\'courses\', \'material_collaborators\')' });
  console.log(error ? error : data);
}
run();
