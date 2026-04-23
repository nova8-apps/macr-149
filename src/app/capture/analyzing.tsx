import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScanLine } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { useVisionAnalyze } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';

export default function AnalyzingScreen() {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0.9);
  const pendingMeal = useAppStore(s => s.pendingMeal);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);
  const visionMutation = useVisionAnalyze();
  const didRun = useRef(false);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value,
  }));

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1.1, { duration: 1000 }), -1, true);

    if (didRun.current) return;
    didRun.current = true;

    const imageBase64 = (pendingMeal as Record<string, unknown> | null)?.imageBase64 as string | undefined;

    if (imageBase64) {
      // Call real vision API
      visionMutation.mutate(
        { imageBase64, mode: 'food' },
        {
          onSuccess: (data) => {
            if ('meal' in data) {
              setPendingMeal({
                name: data.meal.name,
                totalCalories: data.meal.totalCalories,
                proteinG: data.meal.proteinG,
                carbsG: data.meal.carbsG,
                fatG: data.meal.fatG,
                items: data.meal.items.map((item, idx) => ({
                  id: String(idx + 1),
                  name: item.name,
                  calories: item.calories,
                  proteinG: item.proteinG,
                  carbsG: item.carbsG,
                  fatG: item.fatG,
                  quantity: item.quantity,
                  unit: item.unit,
                })),
                photoUrl: pendingMeal?.photoUrl,
                eatenAt: pendingMeal?.eatenAt ?? new Date().toISOString(),
              });
            }
            router.replace('/capture/review');
          },
          onError: () => {
            // Fallback — go to review with existing pending meal data
            router.replace('/capture/review');
          },
        }
      );
    } else {
      // No image to analyze — just proceed to review
      const timer = setTimeout(() => {
        router.replace('/capture/review');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={pulseStyle}>
        <Animated.View style={[ringStyle, {
          width: 100, height: 100, borderRadius: 50,
          borderWidth: 3, borderColor: colors.primary,
          borderTopColor: 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }]}>
          <ScanLine size={36} color={colors.primary} />
        </Animated.View>
      </Animated.View>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 32 }}>Analyzing your meal...</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>AI is identifying food items</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
    </View>
  );
}
