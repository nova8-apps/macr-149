import React from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, runOnJS } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Apple } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';

export default function SplashScreen() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const sessionToken = useAppStore(s => s.sessionToken);
  const isOnboarded = useAppStore(s => s.isOnboarded);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    translateY.value = withTiming(0, { duration: 800 });

    const navigate = () => {
      if (!sessionToken) {
        router.replace('/auth/sign-in');
      } else if (!isOnboarded) {
        router.replace('/onboarding/step-1');
      } else {
        router.replace('/(tabs)/home');
      }
    };

    const timer = setTimeout(navigate, 1400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[animStyle, { alignItems: 'center' }]}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Apple size={40} color="#fff" />
        </View>
        <Text style={{ fontSize: 36, fontWeight: '800', color: colors.primary, letterSpacing: -1 }}>Macr</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 6 }}>Point. Snap. Know.</Text>
      </Animated.View>
    </View>
  );
}
