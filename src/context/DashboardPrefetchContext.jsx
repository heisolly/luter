import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const DashboardPrefetchContext = createContext(null)

export function useDashboardPrefetch() {
  return useContext(DashboardPrefetchContext)
}

async function fetchDashboardBundle(userId) {
  const [uc, stats, leaderboard, profile] = await Promise.all([
    supabase
      .from('user_courses')
      .select('id, progress, last_studied_at, target_score, course:courses(id, code, name, faculty)')
      .eq('user_id', userId)
      .order('created_at'),
    supabase.from('user_stats').select('total_xp, streak_days, lives, badges').eq('user_id', userId).maybeSingle(),
    supabase
      .from('user_stats')
      .select('total_xp, streak_days, profiles(full_name, level, university)')
      .order('streak_days', { ascending: false })
      .limit(10),
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
  ])

  return { uc, stats, leaderboard, profile }
}

export function DashboardPrefetchProvider({ userId, children }) {
  const [bundle, setBundle] = useState(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    if (!userId) return
    const b = await fetchDashboardBundle(userId)
    setBundle(b)
    setReady(true)
  }, [userId])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setReady(false)
    setBundle(null)
    ;(async () => {
      const b = await fetchDashboardBundle(userId)
      if (cancelled) return
      setBundle(b)
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const value = useMemo(() => ({ bundle, ready, refresh }), [bundle, ready, refresh])

  return <DashboardPrefetchContext.Provider value={value}>{children}</DashboardPrefetchContext.Provider>
}
