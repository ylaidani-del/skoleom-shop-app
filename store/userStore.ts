import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface StoredUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface UserState {
  user: StoredUser | null;
  token: string | null;
  hasHydrated: boolean;
  setSession: (user: StoredUser, token: string) => void;
  clearUser: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setSession: (user, token) => set({ user, token }),
      clearUser: () => set({ user: null, token: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
