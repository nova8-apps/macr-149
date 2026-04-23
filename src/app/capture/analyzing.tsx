import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScanLine, AlertCircle, RefreshCw } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { useVisionAnalyze } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticMedium } from '@/lib/haptics';

export default function AnalyzingScreen() {
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0.9);
  const pendingMeal = useAppStore(s => s.pendingMeal);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);
  const visionMutation = useVisionAnalyze();
  const didRun = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: pulse.value,
  }));

  const analyze = () => {
    const imageBase64 = (pendingMeal as Record<string, unknown> | null)?.imageBase64 as string | undefined;

    if (!imageBase64) {
      // No image to analyze — just proceed to review with existing data
      const timer = setTimeout(() => {
        router.replace('/capture/review');
      }, 1500);
      return () => clearTimeout(timer);
    }

    // Call real vision API
    visionMutation.mutate(
      { imageBase64, mode: 'food' },
      {
        onSuccess: (data) => {
          if ('meal' in data) {
            const aiConfidence = (data as any).aiConfidence || 'high';
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
              aiConfidence,
            } as any);
          }
          router.replace('/capture/review');
        },
        onError: (err: any) => {
          console.error('[analyzing] vision API error:', err);
          // Show recoverable error state with retry
          setError(err?.message || 'Network request failed');
        },
      }
    );
  };

  const handleRetry = () => {
    hapticMedium();
    setError(null);
    didRun.current = false;
    analyze();
  };

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1.1, { duration: 1000 }), -1, true);

    if (didRun.current) return;
    didRun.current = true;

    analyze();
  }, []);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}>
          <AlertCircle size={40} color="#DC2626" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: 24, textAlign: 'center' }}>Analysis failed</Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>{error}</Text>
        <Pressable
          onPress={handleRetry}
          accessibilityLabel="Retry analysis"
          testID="retry-analysis"
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: colors.primary, borderRadius: 999,
            paddingHorizontal: 24, paddingVertical: 14, marginTop: 32,
          }}
        >
          <RefreshCw size={18} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Try Again</Text>
        </Pressable>
        <Pressable
          onPress={() => router.replace('/capture/review')}
          accessibilityLabel="Continue anyway"
          testID="continue-anyway"
          style={{ marginTop: 16, paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Continue with manual entry</Text>
        </Pressable>
      </View>
    );
  }

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
