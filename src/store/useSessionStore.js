import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../supabaseClient'

function buildRoomId(sessionId) {
  return `luter-session-${sessionId}`
}

function buildShareCode() {
  return Math.random().toString(36).slice(2, 12)
}

async function fetchSharedSessionIds(userId) {
  try {
    const { data, error } = await supabase
      .from('deck_session_members')
      .select('session_id')
      .eq('user_id', userId)

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('Could not find')) {
        console.warn('[SessionStore] deck_session_members table not found. Shared sessions disabled.');
        return []
      }
      throw error
    }
    return (data || []).map((row) => row.session_id).filter(Boolean)
  } catch (err) {
    console.error('[SessionStore] Failed to fetch shared session IDs:', err)
    return []
  }
}

async function fetchSessionByShareCode(shareCode) {
  const normalized = (shareCode || '').trim().toLowerCase()
  if (!normalized) return null

  const rpcResult = await supabase.rpc('luter_join_shared_session', { code: normalized })
  if (!rpcResult.error && rpcResult.data) return rpcResult.data

  const { data, error } = await supabase
    .from('deck_sessions')
    .select('*')
    .eq('share_code', normalized)
    .eq('is_shared', true)
    .eq('is_active', true)
    .maybeSingle()

  if (error) throw error
  return data
}

export const useSessionStore = create(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,
      isDockExpanded: false,
      isCreating: false,
      loading: false,
      currentUserId: null,

      setDockExpanded: (expanded) => set({ isDockExpanded: expanded }),

      resetStore: () => set({
        sessions: [],
        activeSession: null,
        currentUserId: null,
      }),

      loadSessions: async (force = false) => {
        if (get().loading && !force) return

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (get().currentUserId && get().currentUserId !== user.id) {
          get().resetStore()
        }
        set({ currentUserId: user.id, loading: true })

        try {
          const sharedIds = await fetchSharedSessionIds(user.id)
          let query = supabase
            .from('deck_sessions')
            .select('*, member_count:deck_session_members(count)')
            .eq('is_active', true)
            .order('last_accessed', { ascending: false })

          if (sharedIds.length) {
            query = query.or(`user_id.eq.${user.id},id.in.(${sharedIds.join(',')})`)
          } else {
            query = query.eq('user_id', user.id)
          }

          const { data, error } = await query
          if (error) {
            if (error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('Could not find')) {
              console.warn('[SessionStore] deck_sessions table not found in database.');
              set({ sessions: [] })
              return
            }
            throw error
          }
          set({ sessions: data || [] })
        } catch (error) {
          console.error('Error loading sessions:', error)
        } finally {
          set({ loading: false })
        }
      },

      createSession: async (sessionName, items = [], options = {}) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'User not authenticated' }

        const {
          groupId = null,
          sessionType = groupId ? 'group' : 'solo',
          isShared = !!groupId,
          shareCode = isShared ? buildShareCode() : null,
        } = options

        set({ isCreating: true })
        try {
          const insertPayload = {
            user_id: user.id,
            session_name: sessionName || 'New Study Session',
            items,
            is_active: true,
            last_accessed: new Date().toISOString(),
            group_id: groupId,
            session_type: sessionType,
            is_shared: isShared,
            share_code: shareCode,
          }

          const { data, error } = await supabase
            .from('deck_sessions')
            .insert([insertPayload])
            .select()
            .single()

          if (error) throw error

          const roomId = buildRoomId(data.id)
          await supabase
            .from('deck_sessions')
            .update({ collaboration_room_id: roomId })
            .eq('id', data.id)

          await supabase
            .from('deck_session_members')
            .upsert({
              session_id: data.id,
              user_id: user.id,
              role: options.role || (sessionType === 'teacher' ? 'teacher' : 'owner'),
              last_seen_at: new Date().toISOString(),
            }, { onConflict: 'session_id,user_id' })

          const session = { ...data, collaboration_room_id: roomId }
          await get().loadSessions(true)
          set({ activeSession: session })

          return { success: true, session }
        } catch (error) {
          console.error('Error creating session:', error)
          return { success: false, error: error.message }
        } finally {
          set({ isCreating: false })
        }
      },

      updateSession: async (sessionId, updates) => {
        set({ loading: true })
        try {
          const { error } = await supabase
            .from('deck_sessions')
            .update({
              ...updates,
              last_accessed: new Date().toISOString(),
            })
            .eq('id', sessionId)

          if (error) throw error
          await get().loadSessions(true)
          return { success: true }
        } catch (error) {
          console.error('Error updating session:', error)
          return { success: false, error: error.message }
        } finally {
          set({ loading: false })
        }
      },

      shareSession: async (sessionId, options = {}) => {
        const session = get().sessions.find((item) => item.id === sessionId)
        if (!session) return { success: false, error: 'Session not found' }

        const shareCode = session.share_code || buildShareCode()
        const collaborationRoomId = session.collaboration_room_id || buildRoomId(sessionId)
        const updates = {
          is_shared: true,
          share_code: shareCode,
          collaboration_room_id: collaborationRoomId,
          session_type: options.sessionType || session.session_type || 'group',
          group_id: options.groupId ?? session.group_id ?? null,
        }

        const result = await get().updateSession(sessionId, updates)
        return result.success
          ? { success: true, shareCode, collaborationRoomId }
          : result
      },

      joinSharedSession: async (shareCode) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'User not authenticated' }

        try {
          const session = await fetchSessionByShareCode(shareCode)
          if (!session) return { success: false, error: 'Shared session not found' }

          const { error: joinError } = await supabase
            .from('deck_session_members')
            .upsert({
              session_id: session.id,
              user_id: user.id,
              role: 'peer',
              last_seen_at: new Date().toISOString(),
            }, { onConflict: 'session_id,user_id' })

          if (joinError) throw joinError

          await get().loadSessions(true)
          set({ activeSession: session })
          return { success: true, session }
        } catch (error) {
          console.error('Error joining shared session:', error)
          return { success: false, error: error.message }
        }
      },

      addItemToSession: async (sessionId, item) => {
        const { sessions } = get()
        const session = sessions.find((entry) => entry.id === sessionId)
        if (!session) return { success: false, error: 'Session not found' }

        const existingItems = session.items || []
        if (existingItems.some((entry) => entry.id === item.id)) {
          return { success: false, error: 'Item already in session' }
        }

        return get().updateSession(sessionId, { items: [...existingItems, item] })
      },

      removeItemFromSession: async (sessionId, itemId) => {
        const { sessions } = get()
        const session = sessions.find((entry) => entry.id === sessionId)
        if (!session) return { success: false, error: 'Session not found' }

        const updatedItems = (session.items || []).filter((item) => item.id !== itemId)
        return get().updateSession(sessionId, { items: updatedItems })
      },

      deleteSession: async (sessionId) => {
        set({ loading: true })
        try {
          const { error } = await supabase
            .from('deck_sessions')
            .update({ is_active: false })
            .eq('id', sessionId)

          if (error) throw error
          await get().loadSessions(true)
          return { success: true }
        } catch (error) {
          console.error('Error deleting session:', error)
          return { success: false, error: error.message }
        } finally {
          set({ loading: false })
        }
      },

      leaveSession: async (sessionId) => {
        set({ loading: true })
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('User not authenticated')

          const { error } = await supabase
            .from('deck_session_members')
            .delete()
            .eq('session_id', sessionId)
            .eq('user_id', user.id)

          if (error) throw error
          await get().loadSessions(true)
          return { success: true }
        } catch (error) {
          console.error('Error leaving session:', error)
          return { success: false, error: error.message }
        } finally {
          set({ loading: false })
        }
      },

      removeMemberFromSession: async (sessionId, targetUserId) => {
        set({ loading: true })
        try {
          const { error } = await supabase
            .from('deck_session_members')
            .delete()
            .eq('session_id', sessionId)
            .eq('user_id', targetUserId)

          if (error) throw error
          
          await get().loadSessions(true)
          return { success: true }
        } catch (error) {
          console.error('Error removing member from session:', error)
          return { success: false, error: error.message }
        } finally {
          set({ loading: false })
        }
      },

      setActiveSession: (session) => {
        set({ activeSession: session })
      },

      updateLastAccessed: async (sessionId) => {
        try {
          await supabase
            .from('deck_sessions')
            .update({ last_accessed: new Date().toISOString() })
            .eq('id', sessionId)
        } catch (error) {
          console.error('Error updating last accessed:', error)
        }
      },
    }),
    {
      name: 'luter-session-store',
      partialize: (state) => ({
        activeSession: state.activeSession,
        isDockExpanded: state.isDockExpanded,
        sessions: state.sessions,
        currentUserId: state.currentUserId,
      }),
    }
  )
)
