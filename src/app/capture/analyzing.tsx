import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { useAppStore } from '@/lib/store';
import { useVisionAnalyze } from '@/lib/api-hooks';

export default function AnalyzingScreen() {
  const pendingMeal = useAppStore(s => s.pendingMeal);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);
  const { mutateAsync: analyzeImage, isPending } = useVisionAnalyze();
  const [error, setError] = useState<string | null>(null);
  const didRunRef = useRef<boolean>(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    // Pre-flight: if no image, bail early
    if (!pendingMeal?.imageBase64) {
      setError('No photo captured — go back and try again');
      return;
    }

    // Set a 12-second timeout
    const abortController = new AbortController();
    timeoutRef.current = setTimeout(() => {
      abortController.abort();
      setError('Analysis is taking too long — please try again');
    }, 12000);

    analyzeImage(pendingMeal.imageBase64)
      .then((result) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setPendingMeal({
          ...pendingMeal,
          name: result.name,
          totalCalories: result.totalCalories,
          proteinG: result.proteinG,
          carbsG: result.carbsG,
          fatG: result.fatG,
          items: result.items,
          aiConfidence: result.aiConfidence,
        } as any);
        router.replace('/capture/review');
      })
      .catch((err: any) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.error('[analyzing] vision error:', err);
        setError('Analysis failed — please try again');
      });
  }, []);

  const retry = () => {
    setError(null);
    didRunRef.current = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.error + '20', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <AlertCircle size={32} color={colors.error} />
        </View>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center', marginBottom: 8 }}>{error}</Text>
        <Pressable
          onPress={retry}
          accessibilityLabel="Retry analysis"
          testID="retry-button"
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: colors.primary, borderRadius: 999,
            paddingHorizontal: 24, paddingVertical: 12, marginTop: 16,
          }}
        >
          <RefreshCw size={16} color="#fff" />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>Retry</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 12, paddingVertical: 12 }}
          accessibilityLabel="Go back"
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 20, textAlign: 'center' }}>Analyzing your meal...</Text>
      <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>This may take a few seconds</Text>
    </View>
  );
}
