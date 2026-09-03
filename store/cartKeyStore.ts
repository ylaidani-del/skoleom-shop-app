import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface CartKeyState {
  cartKey: string | null;
  setCartKey: (cartKey: string | null) => void;
  clearCartKey: () => void;
}

// Persists the CoCart session key (Sesync backend) across app restarts so the
// same server-side cart is reused instead of a new one being created each launch.
export const useCartKeyStore = create<CartKeyState>()(
  persist(
    (set) => ({
      cartKey: null,
      setCartKey: (cartKey) => set({ cartKey }),
      clearCartKey: () => set({ cartKey: null }),
    }),
    {
      name: 'cart-key-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
