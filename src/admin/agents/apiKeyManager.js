/**
 * 🔑 Luter API Key Manager
 * 
 * Manages multiple API keys per provider with automatic rotation.
 * When a key hits a rate limit (429) or quota error, it transparently
 * switches to the next available key in the pool.
 * 
 * Usage:
 *   import { getKey, markKeyFailed, withKeyRotation } from './apiKeyManager'
 *   
 *   // Simple: get the current best key
 *   const key = getKey('groq')
 *   
 *   // Advanced: auto-rotate on failure
 *   const result = await withKeyRotation('tavily', async (key) => {
 *     return await callTavilyAPI(key, params)
 *   })
 */

// ─── Key Pool Definitions ─────────────────────────────────────────────────────

const KEY_POOLS = {
  groq: [
    import.meta.env.VITE_GROQ_API_KEY,
    import.meta.env.VITE_GROQ_KEY_1,
    import.meta.env.VITE_GROQ_KEY_2,
    import.meta.env.VITE_GROQ_KEY_3,
    import.meta.env.VITE_GROQ_KEY_4,
    import.meta.env.VITE_GROQ_KEY_5,
    import.meta.env.VITE_GROQ_KEY_6,
    import.meta.env.VITE_GROQ_KEY_7,
  ].filter(Boolean),

  tavily: [
    import.meta.env.VITE_TAVILY_API_KEY,
    import.meta.env.VITE_TAVILY_KEY_1,
    import.meta.env.VITE_TAVILY_KEY_2,
    import.meta.env.VITE_TAVILY_KEY_3,
    import.meta.env.VITE_TAVILY_KEY_4,
    import.meta.env.VITE_TAVILY_KEY_5,
    import.meta.env.VITE_TAVILY_KEY_6,
    import.meta.env.VITE_TAVILY_KEY_7,
  ].filter(Boolean),

  firecrawl: [
    import.meta.env.VITE_FIRECRAWL_API_KEY,
    import.meta.env.VITE_FIRECRAWL_KEY_1,
    import.meta.env.VITE_FIRECRAWL_KEY_2,
    import.meta.env.VITE_FIRECRAWL_KEY_3,
    import.meta.env.VITE_FIRECRAWL_KEY_4,
    import.meta.env.VITE_FIRECRAWL_KEY_5,
    import.meta.env.VITE_FIRECRAWL_KEY_6,
    import.meta.env.VITE_FIRECRAWL_KEY_7,
  ].filter(Boolean),

  // Single keys — no rotation needed
  e2b:        [import.meta.env.VITE_E2B_API_KEY].filter(Boolean),
  resend:     [import.meta.env.VITE_RESEND_API_KEY].filter(Boolean),
  llamaindex: [import.meta.env.VITE_LLAMAINDEX_API_KEY].filter(Boolean),
  openalex:   [import.meta.env.VITE_OPENALEX_API_KEY].filter(Boolean),
}

// ─── Runtime State ────────────────────────────────────────────────────────────

// Current index per provider (round-robin)
const currentIndex = Object.fromEntries(Object.keys(KEY_POOLS).map(k => [k, 0]))

// Failed keys per provider { provider: Set<key> }
const failedKeys = Object.fromEntries(Object.keys(KEY_POOLS).map(k => [k, new Set()]))

// Cooldown map — failed keys can be retried after 60s
const cooldowns = {}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Get the current active key for a provider.
 * Automatically skips failed keys that are still in cooldown.
 */
export function getKey(provider) {
  const pool = KEY_POOLS[provider]
  if (!pool || pool.length === 0) {
    console.warn(`[KeyManager] No keys found for provider: ${provider}`)
    return null
  }

  const now = Date.now()
  const failed = failedKeys[provider]

  // Try to find a non-failed key starting from currentIndex
  for (let i = 0; i < pool.length; i++) {
    const idx = (currentIndex[provider] + i) % pool.length
    const key = pool[idx]
    const cooldownUntil = cooldowns[`${provider}:${idx}`]

    // Skip if in cooldown
    if (failed.has(key) && cooldownUntil && now < cooldownUntil) continue

    // If cooldown expired, unfail this key
    if (failed.has(key) && cooldownUntil && now >= cooldownUntil) {
      failed.delete(key)
      delete cooldowns[`${provider}:${idx}`]
    }

    currentIndex[provider] = idx
    return key
  }

  // All keys failed — return the first one as last resort
  console.error(`[KeyManager] All keys failed for ${provider}! Using first key as fallback.`)
  return pool[0]
}

/**
 * Mark a key as failed (rate-limited or quota exceeded).
 * It will be placed in a 60-second cooldown before being retried.
 */
export function markKeyFailed(provider, key, cooldownMs = 60000) {
  const pool = KEY_POOLS[provider]
  if (!pool) return

  const idx = pool.indexOf(key)
  if (idx === -1) return

  failedKeys[provider].add(key)
  cooldowns[`${provider}:${idx}`] = Date.now() + cooldownMs

  // Advance to next key
  currentIndex[provider] = (idx + 1) % pool.length

  console.warn(`[KeyManager] Key #${idx} for ${provider} marked failed. Switching to key #${currentIndex[provider]}. Cooldown: ${cooldownMs / 1000}s`)
}

/**
 * Rotate to the next key for a provider (manual rotation for load distribution).
 */
export function rotateKey(provider) {
  const pool = KEY_POOLS[provider]
  if (!pool) return
  currentIndex[provider] = (currentIndex[provider] + 1) % pool.length
}

/**
 * Get pool stats for a provider — useful for the admin dashboard.
 */
export function getPoolStats(provider) {
  const pool = KEY_POOLS[provider]
  if (!pool) return null
  const now = Date.now()
  const failed = failedKeys[provider]

  return {
    provider,
    total: pool.length,
    active: pool.filter(k => !failed.has(k)).length,
    failed: failed.size,
    currentIndex: currentIndex[provider],
    keys: pool.map((key, i) => ({
      index: i,
      preview: key.slice(0, 12) + '...',
      status: failed.has(key)
        ? (cooldowns[`${provider}:${i}`] > now ? 'cooldown' : 'recovering')
        : (currentIndex[provider] === i ? 'active' : 'standby'),
      cooldownRemaining: cooldowns[`${provider}:${i}`]
        ? Math.max(0, Math.round((cooldowns[`${provider}:${i}`] - now) / 1000))
        : 0,
    })),
  }
}

/**
 * Get stats for ALL providers.
 */
export function getAllPoolStats() {
  return Object.keys(KEY_POOLS).map(getPoolStats).filter(Boolean)
}

/**
 * High-level wrapper: execute a function with automatic key rotation on rate limit.
 * 
 * @param {string}   provider  - 'groq' | 'tavily' | 'firecrawl' | etc.
 * @param {Function} fn        - async (key: string) => result
 * @param {number}   maxRetries - how many keys to try before giving up
 */
export async function withKeyRotation(provider, fn, maxRetries = null) {
  const pool = KEY_POOLS[provider]
  if (!pool) throw new Error(`Unknown provider: ${provider}`)

  const maxTries = maxRetries ?? pool.length

  for (let attempt = 0; attempt < maxTries; attempt++) {
    const key = getKey(provider)
    if (!key) throw new Error(`No valid key available for ${provider}`)

    try {
      return await fn(key)
    } catch (err) {
      const msg = err.message || ''

      // 413 = payload too large — rotating keys won't fix this
      // 400 = bad request, 401 = unauthorized, 403 = forbidden
      const isNonRetryable =
        msg.includes('413') ||
        msg.includes('Content Too Large') ||
        msg.includes('400:') ||
        msg.includes('401:') ||
        msg.includes('403:')

      if (isNonRetryable) {
        console.error(`[KeyManager] Non-retryable error for ${provider}: ${msg.slice(0, 100)}`)
        throw err
      }

      // Only rotate on actual rate limits
      const isRateLimit =
        msg.includes('429') ||
        msg.toLowerCase().includes('rate limit') ||
        msg.toLowerCase().includes('quota') ||
        msg.toLowerCase().includes('too many requests') ||
        err.status === 429

      if (isRateLimit && attempt < maxTries - 1) {
        console.warn(`[KeyManager] Rate limit (429) for ${provider}, rotating key... (attempt ${attempt + 1}/${maxTries})`)
        markKeyFailed(provider, key)
        // Wait 3s before trying next key to let rate limits cool down
        await new Promise(r => setTimeout(r, 3000))
        continue
      }

      throw err
    }
  }

  throw new Error(`All ${maxTries} keys exhausted for ${provider}`)
}

// Export pool sizes for reference
export const POOL_SIZES = Object.fromEntries(
  Object.entries(KEY_POOLS).map(([k, v]) => [k, v.length])
)
