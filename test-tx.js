import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const envFile = readFileSync('.env', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=')
  if (k && v) env[k.trim()] = v.join('=').trim()
})

const supabase = createClient(
  env['VITE_SUPABASE_URL'],
  env['VITE_SUPABASE_ANON_KEY'] // wait, anon key cannot select payment_transactions
)

async function test() {
  const { data, error } = await supabase
    .from('payment_transactions')
    .select('user_id, plan_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  console.log('Transactions:', data)
  console.log('Error:', error)
}
test()
