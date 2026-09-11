import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { type ColorValue } from 'react-native';

import { BRAND, PALETTES } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  cataloge: { active: 'grid', inactive: 'grid-outline' },
  essayage: { active: 'scan', inactive: 'scan-outline' },
  panier: { active: 'bag', inactive: 'bag-outline' },
  compte: { active: 'person', inactive: 'person-outline' },
};

function TabIcon({
  name,
  focused,
  color,
}: {
  name: string;
  focused: boolean;
  color: ColorValue;
}) {
  const icon = ICONS[name];
  return <Ionicons name={focused ? icon.active : icon.inactive} size={21} color={color} />;
}

export default function TabLayout() {
  const { t } = useTranslation();
  const palette = PALETTES[useThemeStore((state) => state.mode)];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND.greenDeep,
        tabBarInactiveTintColor: palette.fg3,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.accueil'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="index" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cataloge"
        options={{
          title: t('tabs.catalogue'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="cataloge" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="essayage"
        options={{
          title: t('tabs.cabine'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="essayage" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="panier"
        options={{
          title: t('tabs.panier'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="panier" focused={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: t('tabs.compte'),
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="compte" focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
