import React, { useMemo, useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Header } from '@/components/Header';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroRing } from '@/components/MacroRing';
import { DayStrip } from '@/components/DayStrip';
import { MealCard } from '@/components/MealCard';
import { StreakPill } from '@/components/StreakPill';
import { useMe, useMealsByDate } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticMedium } from '@/lib/haptics';
import { localDateKey } from '@/lib/date';

export default function HomeScreen() {
  const today = useMemo(() => localDateKey(), []);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const { data: me } = useMe();
  const { data: meals = [], isFetching, refetch } = useMealsByDate(selectedDate);

  const goalsLoaded = !!me?.goals;
  const calorieGoal = me?.goals?.dailyCalories ?? 2000;
  const proteinGoal = me?.goals?.proteinG ?? 150;
  const carbGoal = me?.goals?.carbsG ?? 200;
  const fatGoal = me?.goals?.fatG ?? 70;
  const streakCount = me?.streak?.currentStreak ?? 0;

  const totals = useMemo(() => {
    return (meals as any[]).reduce(
      (acc, m) => ({
        calories: acc.calories + Number(m.totalCalories ?? m.calories ?? 0),
        protein: acc.protein + Number(m.proteinG ?? m.protein ?? 0),
        carbs: acc.carbs + Number(m.carbsG ?? m.carbs ?? 0),
        fat: acc.fat + Number(m.fatG ?? m.fat ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }, [meals]);

  const handleAddMeal = () => {
    hapticMedium();
    router.push('/capture');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <Header name={me?.user?.name?.split(' ')[0]} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} tintColor={colors.primary} />
        }
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <DayStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} today={today} />
        </View>

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <StreakPill count={streakCount} />
        </View>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <CalorieRing
            consumed={Math.round(totals.calories)}
            total={calorieGoal}
            loading={!goalsLoaded}
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 24 }}>
          <MacroRing
            label="Protein"
            consumed={Math.round(totals.protein)}
            total={proteinGoal}
            color={colors.protein}
            loading={!goalsLoaded}
          />
          <MacroRing
            label="Carbs"
            consumed={Math.round(totals.carbs)}
            total={carbGoal}
            color={colors.carbs}
            loading={!goalsLoaded}
          />
          <MacroRing
            label="Fat"
            consumed={Math.round(totals.fat)}
            total={fatGoal}
            color={colors.fat}
            loading={!goalsLoaded}
          />
        </View>

        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
            Meals
          </Text>
          {meals.length === 0 ? (
            <View style={{
              paddingVertical: 32,
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 24 }}>
                No meals yet. Tap the plus button to scan or log one.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {(meals as any[]).map((m) => (
                <MealCard
                  key={m.id}
                  meal={m}
                  onPress={() => router.push(`/meal/${m.id}` as any)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleAddMeal}
        accessibilityLabel="Add a meal"
        testID="home-fab"
        style={{
          position: 'absolute',
          right: 20,
          bottom: 32,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Plus size={28} color="#fff" strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  );
}
