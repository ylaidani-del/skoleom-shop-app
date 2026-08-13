import '../global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../translation';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';

const vexoApiKey = process.env.EXPO_PUBLIC_VEXO_API_KEY;
if (vexoApiKey) {
  const { vexo } = require('vexo-analytics');
  vexo(vexoApiKey);
}

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(drawer)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
