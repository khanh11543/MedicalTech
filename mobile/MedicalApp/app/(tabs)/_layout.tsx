import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { authStorage } from '@/lib/authStorage';
import { isAllowedPatientAppUser } from '@/lib/mobileAuthPolicy';

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let alive = true;
    (async () => {
      const token = await authStorage.getAccessToken();
      const user = await authStorage.getUser();
      if (!alive) return;
      if (!token) {
        router.replace('/sign-in');
        return;
      }
      if (!user || !isAllowedPatientAppUser(user.roles)) {
        await authStorage.clearSession();
        if (alive) router.replace('/sign-in');
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5b9bd5',
        tabBarInactiveTintColor: '#8a8a9e',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          height: 56 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Setting',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
