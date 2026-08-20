import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface CartLine {
  productId: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  addItem: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  totalCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addItem: (productId, qty = 1) =>
        set((state) => {
          const existing = state.lines.find((line) => line.productId === productId);
          if (!existing) return { lines: [...state.lines, { productId, qty }] };
          return {
            lines: state.lines.map((line) =>
              line.productId === productId ? { ...line, qty: line.qty + qty } : line
            ),
          };
        }),
      setQty: (productId, qty) =>
        set((state) => ({
          lines:
            qty > 0
              ? state.lines.map((line) => (line.productId === productId ? { ...line, qty } : line))
              : state.lines.filter((line) => line.productId !== productId),
        })),
      removeItem: (productId) =>
        set((state) => ({ lines: state.lines.filter((line) => line.productId !== productId) })),
      clear: () => set({ lines: [] }),
      totalCount: () => get().lines.reduce((sum, line) => sum + line.qty, 0),
    }),
    {
      name: 'cart-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
