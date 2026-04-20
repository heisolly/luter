import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../supabaseClient'

export const useDeckStore = create(
  persist(
    (set, get) => ({
      activeDeckItems: [],
      currentDeckName: 'Quick Session',
      isDockExpanded: false,
      isSaving: false,

      // UI Actions
      setDockExpanded: (expanded) => set({ isDockExpanded: expanded }),
      
      // Deck Actions
      addToDeck: (item) => {
        const { activeDeckItems } = get()
        // Prevent duplicates
        if (activeDeckItems.some(i => i.content_id === item.content_id)) return
        
        set({ activeDeckItems: [...activeDeckItems, item] })
      },

      removeFromDeck: (itemId) => {
        set({
          activeDeckItems: get().activeDeckItems.filter(i => i.content_id !== itemId)
        })
      },

      clearDeck: () => set({ activeDeckItems: [], currentDeckName: 'Quick Session' }),

      saveDeckToSupabase: async (userId) => {
        const { activeDeckItems, currentDeckName } = get()
        if (activeDeckItems.length === 0) return

        set({ isSaving: true })
        try {
          // 1. Create the deck entry
          const { data: deck, error: deckErr } = await supabase
            .from('decks')
            .insert([{ user_id: userId, title: currentDeckName }])
            .select()
            .single()

          if (deckErr) throw deckErr

          // 2. Insert all items
          const itemsToInsert = activeDeckItems.map(item => ({
            deck_id: deck.id,
            content_id: item.content_id,
            content_type: item.content_type,
            metadata: item.metadata
          }))

          const { error: itemsErr } = await supabase
            .from('deck_items')
            .insert(itemsToInsert)

          if (itemsErr) throw itemsErr
          
          return { success: true, deckId: deck.id }
        } catch (err) {
          console.error('Save Deck Error:', err)
          return { success: false, error: err }
        } finally {
          set({ isSaving: false })
        }
      }
    }),
    {
      name: 'luter-active-deck', // persist state in localStorage
    }
  )
)
