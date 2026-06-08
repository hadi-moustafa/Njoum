import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme    = 'light' | 'dark' | 'system';
export type Language = 'ar' | 'en';

interface AppStore {
  theme:       Theme;
  language:    Language;
  setTheme:    (t: Theme)    => void;
  setLanguage: (l: Language) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme:       'system',
      language:    'ar',
      setTheme:    (theme)    => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name:    'njoum-app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
