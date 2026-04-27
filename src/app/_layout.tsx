import '@/global.css';
import { Slot } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configurePurchases } from '@/lib/purchases';

// Wave 23.35.5 — use the SAME QueryClient singleton that api-hooks.ts
// imperatively writes to. Previously _layout.tsx created its own client,
// so every `queryClient.setQueriesData(...)` from useSaveMeal/useDeleteMeal
// updated a cache no React component was reading from — meals saved fine
// but the home screen never showed them until a sign-out/sign-in cycle.
import { queryClient, persister } from '@/lib/queryClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Wave 23.13 — RevenueCat configuration. Wave 23.65: route through the
  // configurePurchases() wrapper in @/lib/purchases so log-level (WARN in
  // prod, DEBUG in dev) and error handling are applied consistently.
  useEffect(() => {
    if (Platform.OS === 'ios') {
      configurePurchases(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
    }
  }, []);

  // Hide splash on mount — no custom fonts are required by the app
  // (the previous SpaceMono load referenced a missing asset and blocked render).
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 7 * 24 * 60 * 60 * 1000 }}
    >
      <GluestackUIProvider mode="light">
        <SafeAreaProvider>
          <Slot />
        </SafeAreaProvider>
      </GluestackUIProvider>
    </PersistQueryClientProvider>
  );
}
