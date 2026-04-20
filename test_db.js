import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knnfgyedoxtywwlhazqg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubmZneWVkb3h0eXd3bGhhenFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTc0NDgsImV4cCI6MjA4OTk5MzQ0OH0.9vYZ070VLlYWIDcImJZukJWxoxMjoav1RhBW5fEfY90'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, onboarding_complete')
    .eq('username', 'michaeloluwayanmi')
    .maybeSingle()
  console.log('Profile:', data, error)
}

async function testUserCourses() {
  // We need a user ID. Let's try to find Michael's ID.
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'michaeloluwayanmi')
    .maybeSingle()
  
  if (profile) {
    const { data, error } = await supabase
      .from('user_courses')
      .select('id, progress, courses(id, code, name, faculty)')
      .eq('user_id', profile.id)
    console.log('User Courses Logic:', JSON.stringify(data, null, 2), error)
  } else {
    console.log('Profile not found')
    // Get any user courses to check structure
    const { data, error } = await supabase
      .from('user_courses')
      .select('id, progress, courses(id, code, name, faculty)')
      .limit(1)
    console.log('Sample User Course:', JSON.stringify(data, null, 2), error)
  }
}

async function run() {
  await testProfiles()
  await testUserCourses()
}

run()
