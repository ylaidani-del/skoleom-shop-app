import { Stack } from 'expo-router';

import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function AuthLayout() {
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }} />
  );
}
