import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../supabaseClient'

export const useSessionStore = create(
  persist(
    (set, get) => ({
      // Session State
      sessions: [],
      activeSession: null,
      isDockExpanded: false,
      isCreating: false,
      loading: false,

      // UI Actions
      setDockExpanded: (expanded) => set({ isDockExpanded: expanded }),

      // Load user sessions from Supabase
      loadSessions: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        set({ loading: true })
        try {
          const { data, error } = await supabase
            .from('deck_sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('last_accessed', { ascending: false })

          if (error) throw error
          set({ sessions: data || [] })
        } catch (error) {
          console.error('Error loading sessions:', error)
        } finally {
          set({ loading: false })
        }
      },

      // Create a new session
      createSession: async (sessionName, items = []) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'User not authenticated' }

        set({ isCreating: true })
        try {
          const { data, error } = await supabase
            .from('deck_sessions')
            .insert([{
              user_id: user.id,
              session_name: sessionName || 'New Study Session',
              items: items,
              is_active: true,
              last_accessed: new Date().toISOString()
            }])
            .select()
            .single()

          if (error) throw error

          // Reload sessions
          await get().loadSessions()
          
          return { success: true, session: data }
        } catch (error) {
          console.error('Error creating session:', error)
          return { success: false, error: error.message }
        } finally {
          set({ isCreating: false })
        }
      },

      // Update session (add/remove items, rename)
      updateSession: async (sessionId, updates) => {
        set({ loading: true })
        try {
          const { error } = await supabase
            .from('deck_sessions')
            .update({
              ...updates,
              last_accessed: new Date().toISOString()
            })
            .eq('id', sessionId)

          if (error) throw error

          // Reload sessions
          await get().loadSessions()
          
          return { success: true }
        } catch (error) {
          console.error('Error updating session:', error)
          return { success: false, error: error.message }
        } finally {
          set({ loading: false })
        }
      },

      // Add item to session
      addItemToSession: async (sessionId, item) => {
        const { sessions } = get()
        const session = sessions.find(s => s.id === sessionId)
        if (!session) return { success: false, error: 'Session not found' }

        // Prevent duplicates
        const existingItems = session.items || []
        if (existingItems.some(i => i.id === item.id)) {
          return { success: false, error: 'Item already in session' }
        }

        const updatedItems = [...existingItems, item]
        return await get().updateSession(sessionId, { items: updatedItems })
      },

      // Remove item from session
      removeItemFromSession: async (sessionId, itemId) => {
        const { sessions } = get()
        const session = sessions.find(s => s.id === sessionId)
        if (!session) return { success: false, error: 'Session not found' }

        const updatedItems = (session.items || []).filter(i => i.id !== itemId)
        return await get().updateSession(sessionId, { items: updatedItems })
      },

      // Delete session
      deleteSession: async (sessionId) => {
        set({ loading: true })
        try {
          const { error } = await supabase
            .from('deck_sessions')
            .update({ is_active: false })
            .eq('id', sessionId)

          if (error) throw error

          // Reload sessions
          await get().loadSessions()
          
          return { success: true }
        } catch (error) {
          console.error('Error deleting session:', error)
          return { success: false, error: error.message }
        } finally {
          set({ loading: false })
        }
      },

      // Set active session
      setActiveSession: (session) => {
        set({ activeSession: session })
      },

      // Update last accessed time
      updateLastAccessed: async (sessionId) => {
        try {
          await supabase
            .from('deck_sessions')
            .update({ last_accessed: new Date().toISOString() })
            .eq('id', sessionId)
        } catch (error) {
          console.error('Error updating last accessed:', error)
        }
      }
    }),
    {
      name: 'luter-session-store',
      partialize: (state) => ({
        activeSession: state.activeSession,
        isDockExpanded: state.isDockExpanded,
        sessions: state.sessions
      })
    }
  )
)
