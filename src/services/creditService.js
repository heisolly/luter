import { supabase } from '../supabaseClient'

export const CREDIT_COSTS = {
  UPLOAD_AUDIO: 20,
  OPEN_MATERIAL: 50,
  GENERATE_SUMMARY: 5,
  GENERATE_FLASHCARDS: 10,
  GENERATE_QUIZ: 10,
  GENERATE_AI_NOTES: 80,
  AI_CHAT: 20,
  EXPLAIN_TEXT: 10,
  START_MOCK_EXAM: 15,
  MOCK_TUTOR: 20,
  MOCK_WEAKNESS: 10,
  NOTES_AI_CHAT: 20,
  BATTLE_QUESTIONS: 10,
  BATTLE_HINT: 5,
  BATTLE_PERFORMANCE: 30,
  GROUP_QUIZ: 30,
  PLAYGROUND_QUESTIONS: 10,
  VOICE_AGENT: 5,
  WRITE_AI_ASSIST: 5,
  IMAGE_OCR: 0,
  AUDIO_PER_MIN: 20,
}

export const TIER_LIMITS = {
  free: 200,
  pro: 2000,
  beast: Infinity,
}

export async function loadPricingConfig() {
  try {
    const { data } = await supabase
      .from('pricing_config')
      .select('costs, limits')
      .eq('id', 1)
      .maybeSingle()
    if (data) {
      if (data.costs && Object.keys(data.costs).length > 0) {
        Object.assign(CREDIT_COSTS, data.costs)
      }
      if (data.limits && Object.keys(data.limits).length > 0) {
        Object.assign(TIER_LIMITS, data.limits)
      }
    }
  } catch (e) {
    console.warn('[creditService] Failed to load dynamic pricing config:', e)
  }
}

// Auto-run load
loadPricingConfig().catch(() => {})

export function getDailyLimit(tier = 'free') {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.free
}

export async function getCreditBalance(userId) {
  const { data, error } = await supabase
    .from('user_stats')
    .select('ai_credits_monthly, ai_credits_used')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return 0
  return (data.ai_credits_monthly || 0) - (data.ai_credits_used || 0)
}

export async function checkAndDeductCredits(userId, cost, isPremium) {
  if (!userId) return { ok: false, remaining: 0, error: 'Not authenticated' }

  let tier = 'free'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .maybeSingle()

    tier = (profile?.subscription_tier || 'free').toLowerCase()
  } catch (e) {
    console.warn('[Credits] Failed to sync user limit:', e)
  }

  if (tier === 'beast') {
    return { ok: true, remaining: Infinity }
  }

  const expectedLimit = TIER_LIMITS[tier] || TIER_LIMITS.free

  if (expectedLimit !== Infinity) {
    try {
      await supabase
        .from('user_stats')
        .update({ ai_credits_monthly: expectedLimit })
        .eq('user_id', userId)
        .neq('ai_credits_monthly', expectedLimit)
    } catch (e) {
      console.warn('[Credits] Failed to sync user limit:', e)
    }
  }

  const { data, error } = await supabase.rpc('deduct_ai_credits', {
    p_user_id: userId,
    p_cost: cost,
  })

  if (error) {
    console.error('[Credits] RPC error:', error.message)
    return { ok: false, remaining: 0, error: error.message }
  }

  if (data === -1) {
    return { ok: false, remaining: 0, error: 'Insufficient credits' }
  }

  return { ok: true, remaining: data }
}

export function getCreditCost(action) {
  return CREDIT_COSTS[action] || 0
}

export function getActionLabel(action) {
  const labels = {
    UPLOAD_AUDIO: 'Upload audio/video',
    OPEN_MATERIAL: 'Open study material',
    GENERATE_SUMMARY: 'Generate summary',
    GENERATE_FLASHCARDS: 'Generate flashcards',
    GENERATE_QUIZ: 'Generate quiz',
    GENERATE_AI_NOTES: 'Generate AI notes',
    AI_CHAT: 'AI chat message',
    EXPLAIN_TEXT: 'Explain selected text',
    START_MOCK_EXAM: 'Start mock exam',
    MOCK_TUTOR: 'Mock exam tutor',
    MOCK_WEAKNESS: 'Mock exam weakness analysis',
    NOTES_AI_CHAT: 'Notes studio AI chat',
    BATTLE_QUESTIONS: 'Battle questions',
    BATTLE_HINT: 'Battle hint',
    BATTLE_PERFORMANCE: 'Battle performance analysis',
    GROUP_QUIZ: 'Group quiz',
    PLAYGROUND_QUESTIONS: 'Playground questions',
    VOICE_AGENT: 'Voice agent query',
    WRITE_AI_ASSIST: 'AI writing assist',
    IMAGE_OCR: 'Image OCR',
    AUDIO_PER_MIN: 'Audio (per minute)',
  }
  return labels[action] || action
}
