/**
 * usePlanGate — feature gate helper
 *
 * Returns booleans about what the current user's plan allows.
 * Usage:
 *   const { isFree, canAudio, canGroup, canMockExam, canMultiplayer } = usePlanGate(profile)
 *
 * `profile` should be the profile object from useOutletContext() or
 * the DashboardPrefetchContext bundle.
 */
export function usePlanGate(profile) {
  const raw = (
    profile?.subscription_tier ||
    profile?.subscription_type ||
    'free'
  ).toLowerCase()

  // Normalise: "premium" (old name) → beast, "executive" → beast
  const tier = raw === 'premium' || raw === 'executive' ? 'beast' : raw

  const isFree  = tier === 'free'
  const isPro   = tier === 'pro'
  const isBeast = tier === 'beast'

  // Limits
  const maxFiles = isBeast ? Infinity : isPro ? 20 : 5
  const maxFolders = isBeast ? Infinity : isPro ? 3 : 1

  /**
   * Helper: Given an array of items (materials or folders) with a `created_at` field,
   * returns a Set of IDs that should be locked because they exceed the tier's limit.
   * It sorts by created_at ASC so the oldest items are kept and the newest are locked.
   */
  const getLockedItemIds = (items, limit) => {
    if (items.length <= limit) return new Set()
    const sorted = [...items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    const lockedItems = sorted.slice(limit)
    return new Set(lockedItems.map(item => item.id))
  }

  return {
    tier,
    isFree,
    isPro,
    isBeast,
    maxFiles,
    maxFolders,
    getLockedItemIds,

    /** Audio & video upload — Pro+ only */
    canAudio: !isFree,

    /** Create / join study groups — Pro+ only */
    canGroup: !isFree,

    /** Start mock exams — Pro+ only */
    canMockExam: !isFree,

    /** Multiplayer modes in Playground & Arcade Clut-Live — Pro+ only */
    canMultiplayer: !isFree,
  }
}
