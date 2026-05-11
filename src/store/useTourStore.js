import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useTourStore = create(
  persist(
    (set, get) => ({
      completedTours: [], // Array of tour IDs like ['dashboard-home', 'workstation']
      isTourActive: false,
      currentTourId: null,
      currentStep: 0,

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
        const { currentTourId, completedTours } = get()
        set({ 
          isTourActive: false, 
          currentTourId: null, 
          currentStep: 0,
          completedTours: currentTourId && !completedTours.includes(currentTourId) 
            ? [...completedTours, currentTourId] 
            : completedTours
        })
      },

      resetTours: () => set({ completedTours: [] }),

      hasCompletedTour: (tourId) => get().completedTours.includes(tourId)
    }),
    {
      name: 'luter-tour-storage'
    }
  )
)

export default useTourStore
