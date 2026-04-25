import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

export const useLuterStore = create(
  persist(
    (set) => ({
      currentLanguage: 'en',
      setCurrentLanguage: (newLang) => {
        i18n.changeLanguage(newLang);
        set({ currentLanguage: newLang });
      },
    }),
    {
      name: 'luter-global-storage',
    }
  )
);
