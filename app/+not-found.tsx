import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { Container } from '@/components/Container';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Container>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text className="text-xl font-bold text-app-fg">This screen doesn&apos;t exist.</Text>
          <Link href="/">
            <Text className="text-base text-brand-green-deep">Go to home screen!</Text>
          </Link>
        </View>
      </Container>
    </>
  );
}
