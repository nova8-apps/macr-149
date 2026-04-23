// HMR nudge 1776805407650
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PreviewErrorReporter } from '@/components/PreviewErrorReporter';
import { PreviewModeBanner } from '@/components/PreviewModeBanner';

const queryClient = new QueryClient();

export default function RootLayout() {
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
