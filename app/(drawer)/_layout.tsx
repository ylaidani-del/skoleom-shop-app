import { Drawer } from 'expo-router/drawer';

import { DrawerContent } from '@/components/drawer/DrawerContent';

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: 296 },
      }}>
      <Drawer.Screen name="(tabs)" />
    </Drawer>
  );
}
