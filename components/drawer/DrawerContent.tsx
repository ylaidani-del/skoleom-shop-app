import { Ionicons } from '@expo/vector-icons';
import { type DrawerContentComponentProps } from 'expo-router/drawer';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { useMe } from '@/api/user';
import { PALETTES } from '@/constants/theme';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';

type IconName = keyof typeof Ionicons.glyphMap;

const BOUTIQUE_ITEMS: { route: string; icon: IconName; label: string }[] = [
  { route: 'index', icon: 'home-outline', label: 'Accueil' },
  { route: 'cataloge', icon: 'grid-outline', label: 'Catalogue' },
  { route: 'essayage', icon: 'scan-outline', label: "Cabine d'essayage" },
  { route: 'panier', icon: 'bag-outline', label: 'Panier' },
  { route: 'compte', icon: 'person-outline', label: 'Compte' },
];

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const { data: me } = useMe();
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const palette = PALETTES[mode];

  const go = (route: string) => {
    navigation.navigate('(tabs)', { screen: route });
    navigation.closeDrawer();
  };

  return (
    <View className="flex-1 bg-app-surface">
      <View className="pt-safe flex-row items-center gap-3 border-b border-app-border px-4 pb-4">
        <Image
          source={require('@/assets/icon.png')}
          className="h-[34px] w-[34px]"
          resizeMode="contain"
        />
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="text-[14px] font-semibold text-app-fg">
            {me?.name ?? 'Skoleom'}
          </Text>
          <Text numberOfLines={1} className="text-[11px] text-app-fg-3">
            {me?.email ?? ''}
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.closeDrawer()}
          hitSlop={8}
          className="h-[30px] w-[30px] items-center justify-center rounded-full bg-app-fill">
          <Ionicons name="close" size={15} color={palette.fg2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-1 px-3 pt-3.5"
        showsVerticalScrollIndicator={false}>
        <Text className="px-2 pb-1.5 text-[9.5px] font-bold uppercase tracking-[2px] text-app-fg-3">
          Boutique
        </Text>
        {BOUTIQUE_ITEMS.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => go(item.route)}
            className="h-11 flex-row items-center gap-3 rounded-[10px] px-2.5 active:bg-brand-green/10">
            <Ionicons name={item.icon} size={18} color={palette.fg2} />
            <Text className="flex-1 text-[13.5px] font-medium text-app-fg">{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="pb-safe gap-3 border-t border-app-border px-4 pt-3.5">
        <View className="flex-row gap-1 rounded-full bg-app-fill p-1">
          {(['light', 'dark'] as ThemeMode[]).map((option) => {
            const active = mode === option;
            return (
              <Pressable
                key={option}
                onPress={() => setMode(option)}
                className={`h-[34px] flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${active ? 'bg-app-surface' : ''}`}>
                <Ionicons
                  name={option === 'light' ? 'sunny-outline' : 'moon-outline'}
                  size={14}
                  color={active ? palette.fg : palette.fg2}
                />
                <Text
                  className={`text-[12px] font-semibold ${active ? 'text-app-fg' : 'text-app-fg-2'}`}>
                  {option === 'light' ? 'Clair' : 'Sombre'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-center text-[10px] text-app-fg-3">
          Skoleom Shop · v1.0 · Watch. Click. Buy.®
        </Text>
      </View>
    </View>
  );
}
