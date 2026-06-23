import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knnfgyedoxtywwlhazqg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubmZneWVkb3h0eXd3bGhhenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTc0NDgsImV4cCI6MjA4OTk5MzQ0OH0.9vYZ070VLlYWIDcImJZukJWxoxMjoav1RhBW5fEfY90'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('heist_rooms')
    .select('id')
    .limit(1)
  
  if (error) {
    console.log('Error checking heist_rooms table:', error.message)
    console.log('Error code:', error.code)
  } else {
    console.log('heist_rooms table exists! Found items:', data)
  }
}

check()
