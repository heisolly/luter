import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'

const CACHE_KEY = 'luter:admin_prefetch:v1'

function readCachedBundle() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeCachedBundle(bundle) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(bundle))
  } catch {
    /* quota or private mode */
  }
}

const AdminPrefetchContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminPrefetch() {
  return useContext(AdminPrefetchContext)
}

const PAGE = 25

async function fetchAdminBundle() {
  const fiveAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const [
    cProfiles,
    cCourses,
    cEnroll,
    cMatches,
    cNotif,
    cLive,
    usersPage,
    coursesList,
    enrollments,
    matchesList,
    notificationsList,
    activityRows,
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('user_courses').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('notifications').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gt('last_active_at', fiveAgo),
    supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('last_active_at', { ascending: false })
      .range(0, PAGE - 1),
    supabase.from('courses').select('*').order('code', { ascending: true }),
    supabase
      .from('user_courses')
      .select(
        `
        id,
        progress,
        target_score,
        user_id,
        course_id,
        courses (code, name, faculty)
      `
      )
      .order('id', { ascending: false })
      .limit(200),
    supabase.from('matches').select('*').order('id', { ascending: false }).limit(150),
    supabase.from('notifications').select('*').order('id', { ascending: false }).limit(100),
    supabase
      .from('profiles')
      .select('id, full_name, university, last_active_at')
      .gt('last_active_at', fiveAgo)
      .order('last_active_at', { ascending: false })
      .limit(100),
  ])

  return {
    counts: {
      profiles: cProfiles.count,
      courses: cCourses.count,
      enrollments: cEnroll.count,
      matches: cMatches.count,
      notifications: cNotif.count,
      activeNow: cLive.count,
    },
    usersPage: usersPage.data,
    usersError: usersPage.error,
    usersTotal: usersPage.count ?? 0,
    coursesList: coursesList.data,
    coursesError: coursesList.error,
    enrollments: enrollments.data,
    enrollmentsError: enrollments.error,
    matchesList: matchesList.data,
    matchesError: matchesList.error,
    notificationsList: notificationsList.data,
    notificationsError: notificationsList.error,
    activityRows: activityRows.data,
    activityError: activityRows.error,
  }
}

export function AdminPrefetchProvider({ children }) {
  const [bundle, setBundle] = useState(null)
  const [ready, setReady] = useState(false)
  const [servingCached, setServingCached] = useState(false)

  const refresh = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      const cached = readCachedBundle()
      if (cached) {
        setBundle(cached)
        setServingCached(true)
        setReady(true)
      }
      return
    }

    try {
      const b = await fetchAdminBundle()
      setBundle(b)
      writeCachedBundle(b)
      setServingCached(false)
      setReady(true)
    } catch {
      const cached = readCachedBundle()
      if (cached) {
        setBundle(cached)
        setServingCached(true)
      }
      setReady(true)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const offline = typeof navigator !== 'undefined' && !navigator.onLine
      const cached = readCachedBundle()

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
      setBundle(null)
      setServingCached(false)

      try {
        const b = await fetchAdminBundle()
        if (cancelled) return
        setBundle(b)
        writeCachedBundle(b)
        setServingCached(false)
        setReady(true)
      } catch {
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
  }, [])

  useEffect(() => {
    const onOnline = () => {
      refresh()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [refresh])

  const value = useMemo(
    () => ({ bundle, ready, refresh, servingCached }),
    [bundle, ready, refresh, servingCached],
  )

  return <AdminPrefetchContext.Provider value={value}>{children}</AdminPrefetchContext.Provider>
}
