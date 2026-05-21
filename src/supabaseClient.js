import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a single Supabase client instance with better error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',

    lock: false,
    debug: false
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  // Add retry configuration for better reliability
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Export a singleton instance to prevent multiple clients
let supabaseInstance = null
export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = supabase
  }
  return supabaseInstance
}
