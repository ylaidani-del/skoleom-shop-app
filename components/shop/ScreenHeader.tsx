import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useCartStore } from '@/store/cartStore';

interface ScreenHeaderProps {
  title: string;
}

export function ScreenHeader({ title }: ScreenHeaderProps) {
  const router = useRouter();
  const cartCount = useCartStore((state) => state.totalCount());

  return (
    <View className="flex-row items-end justify-between px-4 pb-1">
      <View className="gap-0.5">
        <Text className="text-[9.5px] font-bold uppercase tracking-[2px] text-neutral-400">
          Skoleom · Watch. Click. Buy.®
        </Text>
        <Text className="text-[22px] font-semibold tracking-tight text-neutral-900">{title}</Text>
      </View>

      <Pressable
        onPress={() => router.push('/(drawer)/(tabs)/panier')}
        hitSlop={8}
        className="relative h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
        <Ionicons name="bag-outline" size={17} color="#1a1a1a" />
        {cartCount > 0 && (
          <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-black px-1">
            <Text className="text-[9px] font-bold text-white">{cartCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
