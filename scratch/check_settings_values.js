import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Fetching all rows from payment_settings...')
  const { data, error } = await supabase.from('payment_settings').select('*')
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('payment_settings data:', JSON.stringify(data, null, 2))
  }
}

run()
