/**
 * Lightweight per-page offline cache for dashboard data.
 * Stores raw Supabase response shapes under a user-scoped key.
 */

const PREFIX = 'luter:page-cache'
const VERSION = 'v1'

function key(userId, page) {
  return `${PREFIX}:${VERSION}:${userId}:${page}`
}

export function cachePageData(userId, page, data) {
  if (!userId || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(key(userId, page), JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    /* quota exceeded or private mode */
  }
}

export function getCachedPageData(userId, page) {
  if (!userId || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(key(userId, page))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearPageCache(userId, page) {
  if (!userId || typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(key(userId, page))
  } catch {
    /* ignore */
  }
}
