import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://knnfgyedoxtywwlhazqg.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSubscription() {
  console.log('Querying existing subscription values in profiles...')
  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_type')
    .limit(20)

  if (error) {
    console.error('Error fetching profiles:', error)
  } else {
    console.log('Found profiles:', data)
    const tiers = new Set(data.map(d => d.subscription_tier))
    const types = new Set(data.map(d => d.subscription_type))
    console.log('Unique Tiers:', Array.from(tiers))
    console.log('Unique Types:', Array.from(types))
  }

  // Let's also check if we can run RPC or raw SQL or check columns/constraints if we have a function
  // Often there's an RPC or we can run a custom query, or let's try to upsert a test user and catch the constraint error to inspect it.
  console.log('Testing test upsert to see constraint...')
  const testUserId = '00000000-0000-0000-0000-000000000000'
  const { error: upsertErr } = await supabase
    .from('profiles')
    .upsert({
      id: testUserId,
      full_name: 'Test Constraint User',
      is_premium: true,
      subscription_tier: 'premium',
      subscription_type: 'monthly', // let's try this
      onboarding_complete: true,
      updated_at: new Date().toISOString()
    })
  console.log('Upsert result for monthly:', upsertErr)

  const { error: upsertErr2 } = await supabase
    .from('profiles')
    .upsert({
      id: testUserId,
      full_name: 'Test Constraint User',
      is_premium: true,
      subscription_tier: 'premium',
      subscription_type: 'starter', // let's try this
      onboarding_complete: true,
      updated_at: new Date().toISOString()
    })
  console.log('Upsert result for starter:', upsertErr2)
  
  const { error: upsertErr3 } = await supabase
    .from('profiles')
    .upsert({
      id: testUserId,
      full_name: 'Test Constraint User',
      is_premium: true,
      subscription_tier: 'premium',
      subscription_type: 'semester', // let's try this
      onboarding_complete: true,
      updated_at: new Date().toISOString()
    })
  console.log('Upsert result for semester:', upsertErr3)
}

debugSubscription()
