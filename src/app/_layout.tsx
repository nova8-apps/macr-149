import '@/global.css';
import { Slot } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';

// Wave 23.35.5 — use the SAME QueryClient singleton that api-hooks.ts
// imperatively writes to. Previously _layout.tsx created its own client,
// so every `queryClient.setQueriesData(...)` from useSaveMeal/useDeleteMeal
// updated a cache no React component was reading from — meals saved fine
// but the home screen never showed them until a sign-out/sign-in cycle.
import { queryClient } from '@/lib/queryClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Wave 23.13 — RevenueCat configuration (auto-generated).
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const k = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
      if (k) {
        try { Purchases.configure({ apiKey: k }); }
        catch (e) { console.warn('[RC] configure failed', e); }
      }
    }
  }, []);

  // Hide splash on mount — no custom fonts are required by the app
  // (the previous SpaceMono load referenced a missing asset and blocked render).
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider mode="light">
        <SafeAreaProvider>
          <Slot />
        </SafeAreaProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}
import { Platform } from 'react-native';