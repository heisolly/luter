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
  env['VITE_SUPABASE_ANON_KEY']
)

async function test() {
  const email = `test2${Date.now()}@example.com`
  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password: 'password123'
  })
  if (signUpError) return console.log('SignUp Error:', signUpError)

  const { data, error } = await supabase
    .from('profiles')
    .update({ subscription_tier: 'premium', is_premium: true })
    .eq('id', user.id)
  console.log('Update Error Premium:', error)
}
test()
