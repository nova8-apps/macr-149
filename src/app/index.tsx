import React from 'react';
import { View, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';

// Wave 3o — CRITICAL: this screen MUST NOT navigate until the persist
// middleware has finished reading AsyncStorage. Zustand rehydrates
// asynchronously after the store is created; on first render
// `sessionToken` is always `null` even for a signed-in user. Previously
// we hardcoded a 1400ms setTimeout and hoped rehydration finished first.
// It usually didn't (especially on cold start / low-end devices), which
// meant every signed-in user was bounced back to /auth/sign-in and lost
// their onboarding + meal history on every app launch.
//
// Fix: gate navigation on the `_hasHydrated` flag set by
// `onRehydrateStorage` in src/lib/store.ts. We still honour a minimum
// splash duration of 900ms so the animation doesn't feel abrupt.
export default function SplashScreen() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const sessionToken = useAppStore(s => s.sessionToken);
  const isOnboarded = useAppStore(s => s.isOnboarded);
  const hasHydrated = useAppStore(s => s._hasHydrated);
  const [minElapsed, setMinElapsed] = React.useState(false);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withTiming(0, { duration: 800 });
    const t = setTimeout(() => setMinElapsed(true), 900);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!hasHydrated || !minElapsed) return;
    if (!sessionToken) {
      router.replace('/auth/sign-in');
    } else if (!isOnboarded) {
      router.replace('/onboarding/step-1');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [hasHydrated, minElapsed, sessionToken, isOnboarded]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[animStyle, { alignItems: 'center' }]}>
        <Image source={require('../../assets/icon.png')} style={{ width: 80, height: 80, borderRadius: 24, marginBottom: 20 }} />
        <Text style={{ fontSize: 36, fontWeight: '800', color: colors.primary, letterSpacing: -1 }}>Macr</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>Point. Snap. Know.</Text>
      </Animated.View>
    </View>
  );
}
