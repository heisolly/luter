import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { supabase } from '../supabaseClient'

export const useTourStore = create(
  persist(
    (set, get) => ({
      completedTours: {}, // Local fallback
      isTourActive: false,
      currentTourId: null,
      currentStep: 0,
      currentUserId: null,
      isLoadingTours: false,

      setUserId: (userId) => set({ currentUserId: userId }),

      // Load tours from Supabase (Profile or User Metadata)
      loadCompletedTours: async (userId) => {
        if (!userId) return;
        set({ currentUserId: userId, isLoadingTours: true });
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('completed_tours')
            .eq('id', userId)
            .maybeSingle();
          
          if (profile?.completed_tours) {
            set((state) => ({
              completedTours: {
                ...state.completedTours,
                [userId]: profile.completed_tours
              }
            }));
          }
        } catch (err) {
          console.warn('Failed to load tours from DB:', err);
        } finally {
          set({ isLoadingTours: false });
        }
      },

      startTour: (tourId) => {
        const { currentUserId, hasCompletedTour } = get()
        if (!currentUserId || hasCompletedTour(tourId)) return;
        set({ 
          isTourActive: true, 
          currentTourId: tourId, 
          currentStep: 0 
        })
      },

      nextStep: () => set((state) => ({ 
        currentStep: state.currentStep + 1 
      })),

      prevStep: () => set((state) => ({ 
        currentStep: Math.max(0, state.currentStep - 1) 
      })),

      endTour: async () => {
        const { currentUserId, currentTourId, completedTours } = get()
        if (!currentUserId || !currentTourId) {
          set({ isTourActive: false, currentTourId: null, currentStep: 0 })
          return
        }

        const userCompleted = completedTours[currentUserId] || []
        if (userCompleted.includes(currentTourId)) {
          set({ isTourActive: false, currentTourId: null, currentStep: 0 })
          return
        }

        const newCompleted = [...userCompleted, currentTourId];
        
        set({ 
          isTourActive: false, 
          currentTourId: null, 
          currentStep: 0,
          completedTours: {
            ...completedTours,
            [currentUserId]: newCompleted
          }
        })

        // Sync with Database
        try {
          await supabase.from('profiles')
            .update({ completed_tours: newCompleted })
            .eq('id', currentUserId);
        } catch (err) {
          console.warn('Failed to sync tour to DB:', err);
        }
      },

      resetTours: async () => {
        const { currentUserId } = get()
        if (currentUserId) {
          set((state) => ({
            completedTours: { ...state.completedTours, [currentUserId]: [] }
          }))
          try {
            await supabase.from('profiles')
              .update({ completed_tours: [] })
              .eq('id', currentUserId);
          } catch {}
        }
      },

      hasCompletedTour: (tourId) => {
        const { currentUserId, completedTours, isLoadingTours } = get()
        // If we're still loading, act as if it's completed 
        // to prevent premature triggering before state is synced.
        if (isLoadingTours) return true;
        if (!currentUserId) return false;
        
        const userTours = completedTours[currentUserId] || [];
        return userTours.includes(tourId);
      }
    }),
    {
      name: 'luter-tour-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)

export default useTourStore
