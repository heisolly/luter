import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const CACHE_VER = 'v4' // Incremented for schema changes
const storageKey = (userId) => `luter:dashboard_prefetch:${CACHE_VER}:${userId}`

function readCachedBundle(userId) {
  if (!userId || typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeCachedBundle(userId, bundle) {
  if (!userId || typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(bundle))
  } catch {
    /* quota or private mode */
  }
}

const DashboardPrefetchContext = createContext(null)

export function useDashboardPrefetch() {
  return useContext(DashboardPrefetchContext)
}

export function clearPrefetchCache(userId) {
  if (!userId || typeof localStorage === 'undefined') return
  localStorage.removeItem(storageKey(userId))
}

/**
 * Fetches the dashboard data individually to avoid cascading failures.
 */
async function fetchDashboardBundle(userId) {
  const [uc, stats, leaderboard, profile, materials, studySessions, materialAnalysis] = await Promise.all([
    supabase
      .from('user_courses')
      .select('id, progress, last_studied_at, target_score, custom_name, is_archived, semester, created_at, courses(id, code, name, faculty)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(res => res),
      
    supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle().then(res => res),
    
    supabase
      .from('user_stats')
      .select('total_xp, streak_days, current_streak, user_id, ai_credits_monthly, ai_credits_used, arena_battles_monthly, arena_battles_used, claimed_tasks, daily_goal_minutes')
      .order('total_xp', { ascending: false })
      .limit(10)
      .then(res => res),
      
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle().then(res => res),

    supabase
      .from('materials')
      .select('id, title, type, source_url, processing_status, created_at, updated_at, course_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(res => res),

    Promise.resolve({ data: [], error: null }),

    supabase
      .from('material_analysis')
      .select('material_id, flashcards, quiz, summary, updated_at')
      .eq('user_id', userId)
      .then(res => res)
  ])

  return { uc, stats, leaderboard, profile, materials, studySessions, materialAnalysis }
}

export function DashboardPrefetchProvider({ userId, children }) {
  const [bundle, setBundle] = useState(null)
  const [ready, setReady] = useState(false)
  const [servingCached, setServingCached] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId) return

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = readCachedBundle(userId)
      if (cached) {
        setBundle(cached)
        setServingCached(true)
        setReady(true)
      }
      return
    }

    try {
      const b = await fetchDashboardBundle(userId)
      setBundle(b)
      writeCachedBundle(userId, b)
      setServingCached(false)
      setReady(true)
    } catch (e) {
      console.error('Prefetch Refresh Error:', e)
      const cached = readCachedBundle(userId)
      if (cached) {
        setBundle(cached)
        setServingCached(true)
      }
      setReady(true)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    const run = async () => {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine
      const cached = readCachedBundle(userId)

      if (offline) {
        if (cached && !cancelled) {
          setBundle(cached)
          setServingCached(true)
          setReady(true)
        } else if (!cancelled) {
          setServingCached(false)
          setReady(true)
        }
        return
      }

      setReady(false)
      // Only reset bundle if we don't have a cache to show immediately
      if (!cached) setBundle(null)
      
      try {
        const b = await fetchDashboardBundle(userId)
        if (cancelled) return
        setBundle(b)
        writeCachedBundle(userId, b)
        setServingCached(false)
        setReady(true)
      } catch (e) {
        console.error('Prefetch Run Error:', e)
        if (cancelled) return
        if (cached) {
          setBundle(cached)
          setServingCached(true)
        }
        setReady(true)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const onOnline = () => {
      refresh()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [userId, refresh])

  const value = useMemo(
    () => ({ bundle, ready, refresh, servingCached }),
    [bundle, ready, refresh, servingCached],
  )

  return <DashboardPrefetchContext.Provider value={value}>{children}</DashboardPrefetchContext.Provider>
}
