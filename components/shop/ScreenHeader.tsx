import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { type DrawerNavigationProp } from 'expo-router/drawer';
import { Pressable, Text, View } from 'react-native';

import { useCart } from '@/api/cart';
import { PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

interface ScreenHeaderProps {
  title: string;
}

export function ScreenHeader({ title }: ScreenHeaderProps) {
  const router = useRouter();
  const navigation = useNavigation<DrawerNavigationProp<ReactNavigation.RootParamList>>();
  const cartCount = useCart().data?.item_count ?? 0;
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const fg = PALETTES[mode].fg;

  return (
    <View className="flex-row items-end justify-between px-4 pb-1">
      <View className="flex-1 flex-row items-center gap-3">
        <Pressable
          onPress={() => navigation.openDrawer()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-app-fill">
          <Ionicons name="menu" size={18} color={fg} />
        </Pressable>
        <View className="flex-1 gap-0.5">
          <Text className="text-[9.5px] font-bold uppercase tracking-[2px] text-app-fg-3">
            Skoleom · Watch. Click. Buy.®
          </Text>
          <Text numberOfLines={1} className="text-[22px] font-semibold tracking-tight text-app-fg">
            {title}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full bg-app-fill">
          <Ionicons
            name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={16}
            color={fg}
          />
        </Pressable>

        <Pressable
          onPress={() => router.push('/(drawer)/(tabs)/panier')}
          hitSlop={8}
          className="relative h-9 w-9 items-center justify-center rounded-full bg-app-fill">
          <Ionicons name="bag-outline" size={17} color={fg} />
          {cartCount > 0 && (
            <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-green px-1">
              <Text className="text-[9px] font-bold text-brand-black">{cartCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
