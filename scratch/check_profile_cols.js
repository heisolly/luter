import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually parse .env
const envPath = path.resolve('.env')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    const key = match[1]
    let value = match[2] || ''
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.replace(/^"|"\s*$/g, '')
    }
    env[key] = value
  }
})

const supabaseUrl = env.VITE_SUPABASE_URL
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Key length:', supabaseAnonKey?.length)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  console.log('Querying a profile from database...')
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error querying profiles:', error)
  } else {
    console.log('Profile keys:', Object.keys(data[0] || {}))
    console.log('Sample profile data:', data[0])
  }
}

check()
