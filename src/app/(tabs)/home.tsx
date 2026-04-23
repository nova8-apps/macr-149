import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { Apple, Plus, Camera, ScanBarcode, FileText, Image, PenLine, Dumbbell, UtensilsCrossed } from 'lucide-react-native';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroRing } from '@/components/MacroRing';
import { MealCard } from '@/components/MealCard';
import { DayStrip } from '@/components/DayStrip';
import { StreakPill } from '@/components/StreakPill';
import { useMealsByDate, useStatsSummary, useMe, useDeleteMeal } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticLight, hapticMedium } from '@/lib/haptics';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(getToday());
  const [showActions, setShowActions] = useState<boolean>(false);

  const { data: meData } = useMe();
  const { data: dayMeals } = useMealsByDate(selectedDate);
  const { data: summary } = useStatsSummary(selectedDate);
  const deleteMealMutation = useDeleteMeal();

  const goals = meData?.goals;
  const streak = meData?.streak ?? { currentStreak: 0, longestStreak: 0, lastLoggedDate: '' };
  const meals = Array.isArray(dayMeals) ? dayMeals : [];

  const dailyCal = goals?.dailyCalories ?? 2000;
  const dailyPro = goals?.proteinG ?? 150;
  const dailyCarb = goals?.carbsG ?? 250;
  const dailyFat = goals?.fatG ?? 65;

  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  const actions = [
    { icon: Camera, label: 'Scan Meal', route: '/capture' },
    { icon: ScanBarcode, label: 'Barcode', route: '/capture/barcode' },
    { icon: FileText, label: 'Food Label', route: '/capture/food-label' },
    { icon: Image, label: 'Library', route: '/capture/library' },
    { icon: PenLine, label: 'Manual Entry', route: '/capture/review' },
    { icon: Dumbbell, label: 'Log Exercise', route: '/exercise' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Apple size={22} color={colors.primary} />
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary, letterSpacing: -0.5 }}>Macr</Text>
        </View>
        <StreakPill count={streak.currentStreak} />
      </View>

      {/* Day Strip */}
      <DayStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        {/* Calorie Ring Card */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 24, padding: 24,
          borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginTop: 8,
        }}>
          <CalorieRing consumed={summary?.caloriesConsumed ?? 0} total={dailyCal} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>{summary?.caloriesConsumed ?? 0}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Consumed</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>{dailyCal}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>Target</Text>
            </View>
          </View>
        </View>

        {/* Macro Cards */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <MacroRing label="Protein" consumed={summary?.proteinConsumed ?? 0} total={dailyPro} color={colors.protein} size={70} />
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <MacroRing label="Carbs" consumed={summary?.carbsConsumed ?? 0} total={dailyCarb} color={colors.carbs} size={70} />
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <MacroRing label="Fat" consumed={summary?.fatConsumed ?? 0} total={dailyFat} color={colors.fat} size={70} />
          </View>
        </View>

        {/* Meals */}
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 }}>Recently Uploaded</Text>
          {meals.length === 0 ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 32, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
              <UtensilsCrossed size={36} color={colors.textSecondary} />
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 12 }}>No meals logged yet</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>Tap the + button to log your first meal!</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {meals.map(meal => (
                <MealCard key={meal.id} meal={meal} onDelete={() => deleteMealMutation.mutate(meal.id)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Sheet */}
      {showActions && (
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }}
          onPress={() => setShowActions(false)}
          accessibilityLabel="Close actions"
          testID="close-actions-overlay"
        >
          <View style={{ position: 'absolute', bottom: 110, right: 20, backgroundColor: colors.surface, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: colors.border, width: 200 }}>
            {actions.map((a, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  hapticLight();
                  setShowActions(false);
                  router.push(a.route as any);
                }}
                accessibilityLabel={a.label}
                testID={`action-${a.label.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12 }}
              >
                <a.icon size={20} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>{a.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      )}

      {/* FAB */}
      <Animated.View style={[fabStyle, { position: 'absolute', bottom: 100, right: 20 }]}>
        <Pressable
          onPress={() => {
            hapticMedium();
            fabScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
            setTimeout(() => { fabScale.value = withSpring(1); }, 100);
            setShowActions(!showActions);
          }}
          accessibilityLabel="Add meal or exercise"
          testID="fab-add"
          style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
            elevation: 8,
          }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Plus size={28} color="#fff" />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}
