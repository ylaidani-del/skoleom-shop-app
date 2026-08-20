import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavoritesState {
  ids: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      isFavorite: (id) => get().ids.includes(id),
      toggleFavorite: (id) =>
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((existingId) => existingId !== id)
            : [...state.ids, id],
        })),
    }),
    {
      name: 'favorites-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
