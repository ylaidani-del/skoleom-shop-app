import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface Measurements {
  height: number;
  weight: number;
  chest: number;
  waist: number;
  footLength: number;
}

interface MeasurementsState {
  measurements: Measurements | null;
  setMeasurements: (measurements: Measurements) => void;
}

export const useMeasurementsStore = create<MeasurementsState>()(
  persist(
    (set) => ({
      measurements: null,
      setMeasurements: (measurements) => set({ measurements }),
    }),
    {
      name: 'measurements-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
