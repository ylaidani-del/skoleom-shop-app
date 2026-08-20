import { Tabs } from 'expo-router';
import { TabBarIcon } from '@/components/TabBarIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: 'black',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tab One',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />

      <Tabs.Screen
        name="cataloge"
        options={{
          title: 'Catalogue',
          tabBarIcon: ({ color }) => <TabBarIcon name="th-large" color={color} />,
        }}
      />

      <Tabs.Screen
        name="essayage"
        options={{
          title: 'Essayage',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
      <Tabs.Screen
        name="panier"
        options={{
          title: 'Panier',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: 'Compte',
          tabBarIcon: ({ color }) => <TabBarIcon name="user-o" color={color} />,
        }}
      />
    </Tabs>
  );
}
