import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { Sparkles, Flame, Beef, Wheat, Droplets, ChevronLeft } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { useAppStore } from '@/lib/store';
import { useGoalsMutation } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticSuccess, hapticLight } from '@/lib/haptics';

function calculateGoals(params: Record<string, string>): { calories: number; protein: number; carbs: number; fat: number } {
  const sex = params.sex || 'male';
  const heightCm = parseFloat(params.heightCm || '175');
  const weightKg = parseFloat(params.weightKg || '75');
  const targetWeightKg = parseFloat(params.targetWeightKg || '70');
  const birthDate = params.birthDate || '1990-06-15';
  const activity = params.activity || 'moderate';
  const goal = params.goal || 'lose';

  const age = new Date().getFullYear() - parseInt(birthDate.split('-')[0]);
  // Mifflin-St Jeor
  let bmr = sex === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const multipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, very_active: 1.725 };
  let tdee = bmr * (multipliers[activity] || 1.55);

  if (goal === 'lose') tdee -= 500;
  else if (goal === 'gain') tdee += 300;

  const calories = Math.round(tdee);
  const protein = Math.round(weightKg * 2); // 2g per kg
  const fat = Math.round(calories * 0.25 / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return { calories, protein, carbs, fat };
}

export default function OnboardingStep6() {
  const params = useLocalSearchParams<Record<string, string>>();
  const [calculating, setCalculating] = useState<boolean>(true);
  const [targets, setTargets] = useState<{ calories: number; protein: number; carbs: number; fat: number } | null>(null);
  const setOnboarded = useAppStore(s => s.setOnboarded);
  const goalsMutation = useGoalsMutation();
  const queryClient = useQueryClient();

  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  useEffect(() => {
    const timer = setTimeout(() => {
      const computed = calculateGoals(params as Record<string, string>);
      setTargets(computed);
      setCalculating(false);
      hapticSuccess();
      cardOpacity.value = withTiming(1, { duration: 500 });
      cardScale.value = withSpring(1, { damping: 15, stiffness: 120 });
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleLetsGo = async () => {
    if (!targets) return;
    try {
      // Save ALL onboarding data + calculated targets to the backend
      await goalsMutation.mutateAsync({
        goalType: (params.goal || 'maintain') as 'lose' | 'maintain' | 'gain',
        activityLevel: (params.activity || 'moderate') as 'sedentary' | 'light' | 'moderate' | 'very_active',
        sex: (params.sex || 'male') as 'male' | 'female',
        birthDate: params.birthDate || '1990-01-01',
        heightCm: parseFloat(params.heightCm || '175'),
        startWeightKg: parseFloat(params.weightKg || '75'),
        currentWeightKg: parseFloat(params.weightKg || '75'),
        targetWeightKg: parseFloat(params.targetWeightKg || '70'),
        dailyCalories: targets.calories,
        proteinG: targets.protein,
        carbsG: targets.carbs,
        fatG: targets.fat,
      });
      // Force an immediate refetch of the /auth/me endpoint so the home screen sees fresh goals
      await queryClient.invalidateQueries({ queryKey: ['me'], refetchType: 'all' });
      // Wait for the refetch to complete before navigating
      await new Promise(resolve => setTimeout(resolve, 200));
      setOnboarded(true);
      // Route to paywall after onboarding — Macr is a paid app with no
      // free scans. Users can dismiss the paywall (X button routes back to
      // /(tabs)/home) and the app will continue to gate scans at the + FAB.
      router.replace('/paywall');
    } catch (error) {
      // If API call fails, still proceed to the paywall (goals are optional
      // and the user can retry goal-setting from Settings).
      console.warn('Goals API failed, proceeding anyway:', error);
      setOnboarded(true);
      router.replace('/paywall');
    }
  };

  const macroCards = targets ? [
    { label: 'Protein', value: `${targets.protein}g`, icon: Beef, color: colors.protein },
    { label: 'Carbs', value: `${targets.carbs}g`, icon: Wheat, color: colors.carbs },
    { label: 'Fat', value: `${targets.fat}g`, icon: Droplets, color: colors.fat },
  ] : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {!calculating && (
        <Pressable
          onPress={() => { hapticLight(); router.back(); }}
          accessibilityLabel="Go back"
          testID="back-button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ position: 'absolute', top: 50, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Pressable>
      )}
      {calculating ? (
        <View style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 24, paddingTop: 70, marginBottom: 8 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: '100%' }} />
            </View>
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <Sparkles size={36} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Calculating your plan...</Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>Crunching the numbers for your{'\n'}personalized targets</Text>
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 32 }} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
            <View style={{ paddingTop: 70, marginBottom: 8 }}>
              <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border }}>
                <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: '100%' }} />
              </View>
            </View>

            <Animated.View style={cardStyle}>
              <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 32 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>Your Daily Targets</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>Personalized just for you</Text>
              </View>

              <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 28, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 20 }}>
                <Flame size={28} color={colors.primary} />
                <Text style={{ fontSize: 56, fontWeight: '800', color: colors.primary, letterSpacing: -2, marginTop: 8 }}>{targets?.calories}</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textSecondary }}>Calories per day</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {macroCards.map(m => (
                  <View key={m.label} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                    <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${m.color}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                      <m.icon size={18} color={m.color} />
                    </View>
                    <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary }}>{m.value}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{m.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </ScrollView>

          <Animated.View style={[cardStyle, { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }]}>
            <PillButton
              title={goalsMutation.isPending ? "Saving..." : "Let's Go!"}
              onPress={handleLetsGo}
              disabled={goalsMutation.isPending}
              fullWidth
            />
          </Animated.View>
        </>
      )}
    </View>
  );
}
