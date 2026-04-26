import React from 'react';
import { View, Pressable, Platform, Modal, Animated } from 'react-native';
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data: me } = useMe();
  const [selectedDate, setSelectedDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const { data: meals = [] } = useMealsByDate(selectedDate);
  const deleteMutation = useDeleteMeal();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;

  React.useEffect(() => {
    if (menuOpen) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0.85);
    }
  }, [menuOpen, scaleAnim]);

  const dailyCalories = me?.goals?.dailyCalories ?? 2000;
  const dailyProtein = me?.goals?.proteinG ?? 150;
  const dailyCarbs = me?.goals?.carbsG ?? 200;
  const dailyFat = me?.goals?.fatG ?? 60;

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

  const streak = 7;

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
              {meals.slice(0, 5).map((meal: Meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onPress={() => {}}
                  onDelete={() => handleDeleteMeal(meal.id)}
                />
              ))}
            </View>
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

      {/* FAB Menu Modal */}
      <Modal visible={menuOpen} transparent={true} animationType="none" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setMenuOpen(false)}>
          <Animated.View
            style={{
              position: 'absolute',
              right: 20,
              bottom: insets.bottom + 85 + 72,
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              minWidth: 200,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 12,
              elevation: 8,
              transform: [{ scale: scaleAnim }],
            }}
          >
            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
              onPress={() => {
                setMenuOpen(false);
                router.push('/capture');
              }}
            >
              <Text style={{ fontSize: 15, color: colors.textPrimary }}>📸 Scan Meal</Text>
            </Pressable>
            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
              onPress={() => {
                setMenuOpen(false);
                router.push('/capture/barcode');
              }}
            >
              <Text style={{ fontSize: 15, color: colors.textPrimary }}>🔍 Scan Barcode</Text>
            </Pressable>
            <Pressable
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
              onPress={() => {
                setMenuOpen(false);
                router.push('/capture/food-label');
              }}
            >
              <Text style={{ fontSize: 15, color: colors.textPrimary }}>🏷️ Scan Food Label</Text>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
