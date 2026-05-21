import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knnfgyedoxtywwlhazqg.supabase.co'
// Using service role key or anon key to query database pg_catalog if allowed
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubmZneWVkb3h0eXd3bGhhenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTc0NDgsImV4cCI6MjA4OTk5MzQ0OH0.9vYZ070VLlYWIDcImJZukJWxoxMjoav1RhBW5fEfY90'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data, error } = await supabase.rpc('get_constraint_definition', { conname: 'profiles_subscription_type_chk' })
  console.log('RPC get_constraint_definition:', data, error)

  // Or let's just query profiles columns if they exist
  const { data: cols, error: colErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
  console.log('Sample profile data:', cols, colErr)
}

run()
