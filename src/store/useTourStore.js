import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useTourStore = create(
  persist(
    (set, get) => ({
      completedTours: {}, // Object keyed by userId: Array of tour IDs
      isTourActive: false,
      currentTourId: null,
      currentStep: 0,
      currentUserId: null,

      setUserId: (userId) => set({ currentUserId: userId }),

      startTour: (tourId) => set({ 
        isTourActive: true, 
        currentTourId: tourId, 
        currentStep: 0 
      }),

      nextStep: () => set((state) => ({ 
        currentStep: state.currentStep + 1 
      })),

      prevStep: () => set((state) => ({ 
        currentStep: Math.max(0, state.currentStep - 1) 
      })),

      endTour: () => {
        const { currentUserId, currentTourId, completedTours } = get()
        if (!currentUserId) return

        const userCompleted = completedTours[currentUserId] || []
        
        set({ 
          isTourActive: false, 
          currentTourId: null, 
          currentStep: 0,
          completedTours: {
            ...completedTours,
            [currentUserId]: currentTourId && !userCompleted.includes(currentTourId) 
              ? [...userCompleted, currentTourId] 
              : userCompleted
          }
        })
      },

      resetTours: () => {
        const { currentUserId } = get()
        if (currentUserId) {
          set((state) => ({
            completedTours: { ...state.completedTours, [currentUserId]: [] }
          }))
        }
      },

      hasCompletedTour: (tourId) => {
        const { currentUserId, completedTours } = get()
        return currentUserId ? (completedTours[currentUserId] || []).includes(tourId) : false
      }
    }),
    {
      name: 'luter-tour-storage'
    }
  )
)

export default useTourStore
