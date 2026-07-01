import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knnfgyedoxtywwlhazqg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubmZneWVkb3h0eXd3bGhhenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTc0NDgsImV4cCI6MjA4OTk5MzQ0OH0.9vYZ070VLlYWIDcImJZukJWxoxMjoav1RhBW5fEfY90'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testRPC(name) {
  try {
    const { data, error } = await supabase.rpc(name, { sql_query: 'SELECT 1;' })
    console.log(`RPC ${name} result:`, { data, error })
    return !error
  } catch (err) {
    console.log(`RPC ${name} failed:`, err.message)
    return false
  }
}

async function run() {
  await testRPC('exec_sql')
  await testRPC('execute_sql')
  await testRPC('run_sql')
}

run()
