import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data, error } = await supabase.rpc('get_tables')
  if (error) {
    // If no get_tables RPC, try querying via direct select if postgrest allows, or we can just try selecting from a guess
    console.error('RPC get_tables error:', error)
    
    // Let's try executing a simple select on common tables
    const tables = ['profiles', 'payment_settings', 'payment_transactions', 'subscriptions']
    for (const t of tables) {
      const { error: err } = await supabase.from(t).select('*').limit(1)
      if (err) {
        console.log(`Table ${t}: NOT found or error: ${err.message}`)
      } else {
        console.log(`Table ${t}: EXISTS`)
      }
    }
  } else {
    console.log('Tables:', data)
  }
}

run()
