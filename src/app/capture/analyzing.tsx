import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { AlertCircle } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { useVisionAnalyze } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';

export default function AnalyzingScreen() {
  const pendingMeal = useAppStore(s => s.pendingMeal);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);
  const visionMutation = useVisionAnalyze();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const imageBase64 = (pendingMeal as Record<string, unknown> | null)?.imageBase64 as string | undefined;

    // Pre-flight guard — no photo captured
    if (!imageBase64) {
      setError('No photo captured — go back and try again');
      return;
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
          // NEVER show raw error message to user — log to console only
          setError('Analysis failed — please try again');
        },
      }
    );
  }, [pendingMeal, setPendingMeal, visionMutation]);

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
