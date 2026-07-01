import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'

const CACHE_KEY = (userId) => `luter:streak_cache:${userId}`
const PENDING_KEY = (userId) => `luter:streak_pending:${userId}`

export function useStreakSync(userId, initialStats) {
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    max_streak: 0,
    last_activity_date: null,
    is_active_today: false
  })
  const [synced, setSynced] = useState(false)
  const channelRef = useRef(null)

  // 1. Initialize from props / cache
  useEffect(() => {
    if (!userId) return

    const loadInitialState = () => {
      let data = null
      
      // Try local cache first for instant load
      try {
        const cached = localStorage.getItem(CACHE_KEY(userId))
        if (cached) data = JSON.parse(cached)
      } catch (e) {}

      // If we have initial stats from prefetch, they override cache
      if (initialStats && initialStats.current_streak !== undefined) {
        data = {
          current_streak: initialStats.current_streak,
          max_streak: initialStats.max_streak,
          last_activity_date: initialStats.last_activity_date
        }
      }

      if (data) {
        updateLocalState(data)
      } else {
        // Fallback fetch if nothing is available
        fetchStreakFromDB()
      }
    }

    loadInitialState()
  }, [userId, initialStats])

  const fetchStreakFromDB = async () => {
    if (!userId || !navigator.onLine) return
    const { data, error } = await supabase
      .from('user_stats')
      .select('current_streak, max_streak, last_activity_date')
      .eq('user_id', userId)
      .maybeSingle()

    if (!error && data) {
      updateLocalState(data)
    }
  }

  // 2. Compute "is_active_today" robustly
  const updateLocalState = useCallback((data) => {
    const todayStr = new Date().toISOString().split('T')[0]
    const isActiveToday = data.last_activity_date === todayStr
    
    const newState = {
      ...data,
      is_active_today: isActiveToday
    }
    
    setStreakData(newState)
    
    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY(userId), JSON.stringify(data))
    } catch (e) {}
  }, [userId])

  // 3. Realtime Subscription
  useEffect(() => {
    if (!userId) return

    channelRef.current = supabase.channel(`public:user_stats:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_stats',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const { current_streak, max_streak, last_activity_date } = payload.new
          // Only update if it actually changed to avoid unnecessary renders
          setStreakData(prev => {
            const todayStr = new Date().toISOString().split('T')[0]
            if (
              prev.current_streak === current_streak && 
              prev.last_activity_date === last_activity_date
            ) {
              return prev
            }
            const newData = { current_streak, max_streak, last_activity_date }
            try { localStorage.setItem(CACHE_KEY(userId), JSON.stringify(newData)) } catch (e) {}
            return { ...newData, is_active_today: last_activity_date === todayStr }
          })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setSynced(true)
      })

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [userId])

  // 4. Offline / Online sync logic
  useEffect(() => {
    if (!userId) return

    const handleOnline = async () => {
      // Check if there is a pending streak update
      const pending = localStorage.getItem(PENDING_KEY(userId))
      if (pending === 'true') {
        // Sync it to DB
        await triggerStreakUpdate()
        localStorage.removeItem(PENDING_KEY(userId))
      } else {
        // Just refresh the data in case it changed on another device while offline
        fetchStreakFromDB()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [userId])

  // 5. Trigger an update (Call this when user completes a daily action)
  const triggerStreakUpdate = async () => {
    if (!userId) return
    
    const todayStr = new Date().toISOString().split('T')[0]
    
    // If already active today, no need to update
    if (streakData.is_active_today) return

    // Optimistic UI Update
    const newStreak = (streakData.current_streak || 0) + 1
    const newMax = Math.max(newStreak, streakData.max_streak || 0)
    
    updateLocalState({
      current_streak: newStreak,
      max_streak: newMax,
      last_activity_date: todayStr
    })

    if (!navigator.onLine) {
      // Mark as pending to sync when online
      try { localStorage.setItem(PENDING_KEY(userId), 'true') } catch (e) {}
      return
    }

    // Call Backend RPC
    const { error } = await supabase.rpc('update_user_streak', { target_user_id: userId })
    if (error) {
      console.error('Failed to update streak:', error.message)
      // We could revert the optimistic update here, but the backend is idempotent 
      // and Realtime will auto-correct any discrepancies eventually.
    }
  }

  return {
    streakData,
    triggerStreakUpdate,
    synced
  }
}
