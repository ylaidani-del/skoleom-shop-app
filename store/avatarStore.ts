import { create } from 'zustand';
import type { AvatarData } from '../types/tryon';
interface AvatarState {
  avatar: AvatarData | null;
  ownerId: number | null;
  setAvatar: (avatar: AvatarData, ownerId: number) => void;
  clearAvatar: () => void;
}

export const useAvatarStore = create<AvatarState>((set) => ({
  avatar: null,
  ownerId: null,
  setAvatar: (avatar, ownerId) => set({ avatar, ownerId }),
  clearAvatar: () => set({ avatar: null, ownerId: null }),
}));
