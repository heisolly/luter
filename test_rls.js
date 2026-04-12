import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knnfgyedoxtywwlhazqg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubmZneWVkb3h0eXd3bGhhenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTc0NDgsImV4cCI6MjA4OTk5MzQ0OH0.9vYZ070VLlYWIDcImJZukJWxoxMjoav1RhBW5fEfY90'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('courses').select('*').limit(1)
  console.log('Courses:', data, error)
  
  // Test upserting a course to see if RLS blocks it for anon or pseudo-user
  const { data: qData, error: qError } = await supabase.from('courses').upsert([{ 
    code: 'TEST101', 
    name: 'Test Course', 
    faculty: 'Science' 
  }]).select()
  
  console.log('Upsert result:', qData, qError)
}

test()
