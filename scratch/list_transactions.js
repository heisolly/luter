import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knnfgyedoxtywwlhazqg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubmZneWVkb3h0eXd3bGhhenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTc0NDgsImV4cCI6MjA4OTk5MzQ0OH0.9vYZ070VLlYWIDcImJZukJWxoxMjoav1RhBW5fEfY90'
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  const { data: txs, error: txErr } = await supabase
    .from('payment_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (txErr) {
    console.error('Error fetching transactions:', txErr)
  } else {
    console.log('Recent transactions:', txs)
  }

  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, is_premium, subscription_tier, subscription_type, subscription_expires_at')
    .eq('is_premium', true)
    .limit(10)

  if (profErr) {
    console.error('Error fetching premium profiles:', profErr)
  } else {
    console.log('Premium profiles:', profiles)
  }
}

run()
