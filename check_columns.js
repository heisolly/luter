import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkColumns() {
  console.log('Checking user_courses columns...')
  const { data, error } = await supabase
    .from('user_courses')
    .select('*')
    .limit(1)
  
  if (error) {
    if (error.code === 'PGRST116') {
      console.log('Table empty, but query ok.')
    } else {
      console.error('Error selecting from user_courses:', error)
    }
  } else {
    console.log('Sample row columns:', Object.keys(data[0] || {}))
  }

  console.log('\nChecking user_stats columns...')
  const { data: st, error: stErr } = await supabase
    .from('user_stats')
    .select('*')
    .limit(1)
  
  if (stErr) console.error('Error selecting from user_stats:', stErr)
  else console.log('Sample row columns:', Object.keys(st[0] || {}))
}

checkColumns()
