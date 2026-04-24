// HMR nudge 1776805407650
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PreviewErrorReporter } from '@/components/PreviewErrorReporter';
import { PreviewModeBanner } from '@/components/PreviewModeBanner';
import { configurePurchases } from '@/lib/purchases';

const queryClient = new QueryClient();

export default function RootLayout() {
  // Wave 21.1 — RevenueCat SDK must be configured ONCE at app start, before
  // any screen calls Purchases.getOfferings / purchasePackage / restore.
  // Calling inside a useEffect ensures we only run client-side after mount
  // (not during SSR web render where native modules don't exist).
  useEffect(() => {
    configurePurchases(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY);
  }, []);

  return (
    <PreviewErrorReporter>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GluestackUIProvider mode="light">
            <View style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false, contentStyle: { flex: 1, backgroundColor: '#FFFAF5' } }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth/sign-in" />
                <Stack.Screen name="auth/sign-up" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
                <Stack.Screen name="delete-account" options={{ presentation: 'modal' }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="capture" />
                <Stack.Screen name="exercise" />
              </Stack>
              <PreviewModeBanner />
            </View>
          </GluestackUIProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </PreviewErrorReporter>
  );
}
