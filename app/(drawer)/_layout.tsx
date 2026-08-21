import { Drawer } from 'expo-router/drawer';

import { DrawerContent } from '@/components/drawer/DrawerContent';
import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function DrawerLayout() {
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 296 },
        sceneStyle: { backgroundColor: palette.bg },
      }}>
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}
