import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { AlertCircle } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { useVisionAnalyze } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';

// Wave 3o — CRITICAL FIX: infinite-loop OOM crash on capture.
//
// The previous version listed `visionMutation` in the useEffect dependency
// array. TanStack Query returns a NEW mutation object on every render, so
// the effect re-fired every render. Each fire called `.mutate()` with a
// large base64 image, which triggered state updates, which re-rendered,
// which re-fired the effect... until the JS thread was overwhelmed and the
// app was OOM-killed by iOS.
//
// Fix: use a `useRef` boolean that starts `true` (must-run) and flips to
// `false` after the first invocation, and remove `visionMutation` /
// `setPendingMeal` from the dep array. The effect now runs exactly once
// per screen mount, which is the correct semantics for a one-shot analyze.
export default function AnalyzingScreen() {
  const pendingMeal = useAppStore(s => s.pendingMeal);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);
  const visionMutation = useVisionAnalyze();
  const [error, setError] = useState<string | null>(null);
  const didRunRef = useRef<boolean>(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    const imageBase64 = (pendingMeal as Record<string, unknown> | null)?.imageBase64 as string | undefined;

    // Pre-flight guard — no photo captured
    if (!imageBase64) {
      setError('No photo captured — go back and try again');
      return;
    }

    // Call real vision API. We intentionally don't put the mutation in the
    // dep array because (a) it changes identity every render and (b) we
    // only ever want this to fire once per mount.
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
          const status = err?.status as number | undefined;
          const msg = typeof err?.message === 'string' ? err.message : '';
          if (status === 401 || /No signed-in user|Not signed in|token/i.test(msg)) {
            setError('Please sign in again to analyze meals');
          } else if (status === 429 || /cap_exceeded|rate limit/i.test(msg)) {
            setError('Too many requests today — try again later');
          } else if (status === 413 || /too large|payload/i.test(msg)) {
            setError('Photo too large — try a smaller image');
          } else {
            setError('Analysis failed — please try again');
          }
        },
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-6 bg-gray-950">
        <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.15)' }}>
          <AlertCircle size={32} color="#DC2626" />
        </View>
        <Text className="text-xl font-semibold text-white mb-2">Analysis failed</Text>
        <Text className="text-gray-400 text-center mb-6">{error}</Text>
        <Pressable
          className="px-6 py-3 rounded-full"
          style={{ backgroundColor: colors.carbs }}
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold text-center">
            Go back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center bg-gray-950">
      <ActivityIndicator size="large" color={colors.carbs} />
      <Text className="text-white text-lg mt-4">Analyzing your meal...</Text>
      <Text className="text-gray-400 text-sm mt-2">This may take a few seconds</Text>
    </View>
  );
}
