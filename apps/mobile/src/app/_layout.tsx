// apps/mobile/src/app/_layout.tsx
// Root Expo Router layout — initialises stores, enforcement bus, and tab navigator.

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StatusBar } from 'react-native';
import { tokens } from '../ui/tokens.js';
import { t } from '../i18n/index.js';
import { startBlockScheduler } from '../core/enforcement/blockScheduler.js';
import { initDatabase } from '../core/storage/sqlite.js';
import { trustedNow } from '../core/time/trustedNow.js';
import { useProtectionStore } from '../features/protection/store.js';
import { useAppBlockingStore } from '../features/appBlocking/store.js';
import { useWebsiteBlockerStore } from '../features/websiteBlocker/store.js';
import { useNotificationsStore } from '../features/notifications/store.js';

export default function RootLayout(): React.JSX.Element {
  // Bootstrap the app on first render
  useEffect(() => {
    const bootstrap = async (): Promise<void> => {
      // Init database schema
      await initDatabase();

      // Get trusted time for hydration
      const timeResult = await trustedNow();
      const epochMs = timeResult.ok ? timeResult.value.epochMs : Date.now();

      // Hydrate all stores
      await Promise.all([
        useProtectionStore.getState().hydrate(epochMs),
        useAppBlockingStore.getState().hydrate(epochMs),
        useWebsiteBlockerStore.getState().hydrate(epochMs),
        useNotificationsStore.getState().hydrate(epochMs),
      ]);

      // Start enforcement
      startBlockScheduler();
    };

    void bootstrap();

    return () => {
      // Cleanup on unmount (e.g. hot reload in dev)
      // stopBlockScheduler() — imported lazily to avoid circular deps
    };
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={tokens.color.bg} />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: tokens.color.surface },
          headerTintColor: tokens.color.text,
          headerTitleStyle: { fontWeight: '700' },
          tabBarStyle: {
            backgroundColor: tokens.color.surface,
            borderTopColor: tokens.color.surface2,
          },
          tabBarActiveTintColor: tokens.color.primary,
          tabBarInactiveTintColor: tokens.color.muted,
        }}
      >
        <Tabs.Screen
          name="(tabs)/dashboard"
          options={{
            title: t('tabs.dashboard'),
            tabBarLabel: t('tabs.dashboard'),
            tabBarIcon: ({ color }) => <TabIcon emoji="🛡" color={color} />,
          }}
        />
        <Tabs.Screen
          name="(tabs)/analytics"
          options={{
            title: t('tabs.analytics'),
            tabBarLabel: t('tabs.analytics'),
            tabBarIcon: ({ color }) => <TabIcon emoji="📊" color={color} />,
          }}
        />
        <Tabs.Screen
          name="(tabs)/notifications"
          options={{
            title: t('tabs.notifications'),
            tabBarLabel: t('tabs.notifications'),
            tabBarIcon: ({ color }) => <TabIcon emoji="🔔" color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }): React.JSX.Element {
  return (
    <View>
      <Text style={{ fontSize: 20, color }}>{emoji}</Text>
    </View>
  );
}
