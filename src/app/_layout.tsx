import '@/global.css';
import { Slot } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

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