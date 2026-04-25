import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { Plus, MoreVertical } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { hapticLight, hapticMedium } from '@/lib/haptics';
import { DayStrip } from '@/components/DayStrip';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroRing } from '@/components/MacroRing';
import { MealCard } from '@/components/MealCard';
import { StreakPill } from '@/components/StreakPill';
import { useMe, useMealsByDate, useDeleteMeal } from '@/lib/api-hooks';
import type { Meal } from '@/types';
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
} from '@/components/ui/actionsheet';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const [selectedDate, setSelectedDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const { data: meals = [] } = useMealsByDate(selectedDate);
  const deleteMutation = useDeleteMeal();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const dailyCalories = me?.goals?.dailyCalories ?? me?.goals?.calories ?? 2000;
  const dailyProtein = me?.goals?.protein ?? 150;
  const dailyCarbs = me?.goals?.carbs ?? 200;
  const dailyFat = me?.goals?.fat ?? 60;

  const consumed = React.useMemo(() => {
    return meals.reduce(
      (acc: { calories: number; protein: number; carbs: number; fat: number }, m: Meal) => ({
        calories: acc.calories + m.totalCalories,
        protein: acc.protein + m.proteinG,
        carbs: acc.carbs + m.carbsG,
        fat: acc.fat + m.fatG,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [meals]);

  const handleDeleteMeal = (id: string) => {
    hapticMedium();
    deleteMutation.mutate(id);
  };

  const streak = me?.streak?.currentStreak ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? insets.top + 12 : 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.textPrimary }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 2 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <StreakPill count={streak} />
        </View>

        {/* Day Strip */}
        <DayStrip selectedDate={selectedDate} onSelectDate={(date: string) => setSelectedDate(date)} />

        {/* Calorie Ring */}
        <View style={{ marginTop: 24, marginBottom: 24 }}>
          <CalorieRing consumed={consumed.calories} total={dailyCalories} />
        </View>

        {/* Macro Rings */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <MacroRing label="Protein" consumed={consumed.protein} total={dailyProtein} color={colors.protein} />
          <MacroRing label="Carbs" consumed={consumed.carbs} total={dailyCarbs} color={colors.carbs} />
          <MacroRing label="Fat" consumed={consumed.fat} total={dailyFat} color={colors.fat} />
        </View>

        {/* Recently Uploaded */}
        {meals.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>
              Recently Uploaded
            </Text>
            <View style={{ gap: 10 }}>
              {meals.map((meal: Meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onPress={() => {}}
                  onDelete={() => handleDeleteMeal(meal.id)}
                />
              ))}
            </View>
            {meals.length > 5 && (
              <Pressable
                style={{ marginTop: 8, alignItems: 'center', paddingVertical: 10 }}
                onPress={() => {
                  hapticLight();
                  // Future: navigate to a full history screen
                }}
                accessibilityLabel={`View all ${meals.length} meals`}
                testID="view-all-meals"
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                  {meals.length} meals logged today
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {meals.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>
              No meals yet today.{'\n'}Tap + to scan your first meal.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={{
          position: 'absolute',
          right: 20,
          bottom: insets.bottom + 85 + 12,
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
        }}
        onPress={() => {
          hapticMedium();
          setMenuOpen(true);
        }}
        accessibilityLabel="Add meal"
        testID="fab-add-meal" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Plus size={20} color="#fff" />
      </Pressable>

      {/* Action Sheet */}
      <Actionsheet isOpen={menuOpen} onClose={() => setMenuOpen(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent
          style={{
            position: 'absolute',
            right: 20,
            bottom: insets.bottom + 85 + 72,
            width: 200,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 8,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 12,
          }}
        >
          <ActionsheetItem
            onPress={() => {
              setMenuOpen(false);
              router.push('/capture');
            }}
          >
            <ActionsheetItemText>📸 Scan Meal</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem
            onPress={() => {
              setMenuOpen(false);
              router.push('/capture/barcode');
            }}
          >
            <ActionsheetItemText>🔍 Scan Barcode</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem
            onPress={() => {
              setMenuOpen(false);
              router.push('/capture/food-label');
            }}
          >
            <ActionsheetItemText>🏷️ Scan Food Label</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </View>
  );
}
