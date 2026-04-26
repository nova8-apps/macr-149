import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, Modal, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Camera, Barcode, ScanLine } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { useMe, useMealsByDate } from '@/lib/api-hooks';
import { hapticMedium } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { CalorieRing } from '@/components/CalorieRing';
import { MacroRing } from '@/components/MacroRing';
import { DayStrip } from '@/components/DayStrip';
import { MealCard } from '@/components/MealCard';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: me, isLoading: meLoading } = useMe();
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const { data: meals = [] } = useMealsByDate(selectedDate);
  const [menuOpen, setMenuOpen] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Wave 23.35.4 — never flash a hardcoded default before the user's real
  // goals load. We treat `me` as "resolved" only once the query has finished
  // its first fetch AND we have a `goals` object on it. Until then we render
  // the calorie ring at 0/0 (the empty state) so users never see the wrong
  // number, and the (tabs) layout's onboarding redirect handles users who
  // genuinely have no goals.
  const goals = me?.goals;
  const goalsReady = !!goals && !meLoading;
  const dailyCalories = goalsReady ? (goals!.dailyCalories ?? 0) : 0;
  const dailyProtein = goalsReady ? (goals!.proteinG ?? 0) : 0;
  const dailyCarbs = goalsReady ? (goals!.carbsG ?? 0) : 0;
  const dailyFat = goalsReady ? (goals!.fatG ?? 0) : 0;

  // Calculate consumed totals from meals
  const consumed = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.proteinG || 0),
      carbs: acc.carbs + (meal.carbsG || 0),
      fat: acc.fat + (meal.fatG || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Animate menu on open
  useEffect(() => {
    if (menuOpen) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 120,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [menuOpen]);

  const handleMenuOption = (route: string) => {
    setMenuOpen(false);
    router.push(route as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 20, marginBottom: 16 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: colors.textPrimary }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Calorie & Macro Card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 24,
            paddingHorizontal: 16,
            marginHorizontal: 20,
            marginBottom: 24,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <CalorieRing consumed={consumed.calories} total={dailyCalories} loading={!goalsReady} />
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              width: '100%',
              marginTop: 20,
              marginBottom: 20,
            }}
          />
          <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-around' }}>
            <MacroRing label="Protein" consumed={consumed.protein} total={dailyProtein} color={colors.protein} loading={!goalsReady} />
            <MacroRing label="Carbs" consumed={consumed.carbs} total={dailyCarbs} color={colors.carbs} loading={!goalsReady} />
            <MacroRing label="Fat" consumed={consumed.fat} total={dailyFat} color={colors.fat} loading={!goalsReady} />
          </View>
        </View>

        {/* Day Strip */}
        <View style={{ marginBottom: 20 }}>
          <DayStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </View>

        {/* Meals List */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Today's Meals</Text>
          {meals.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 15, color: colors.textSecondary, textAlign: 'center' }}>No meals logged yet</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center', opacity: 0.7 }}>
                Tap + to scan your first meal
              </Text>
            </View>
          ) : (
            meals.map((meal) => <MealCard key={meal.id} meal={meal} />)
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => {
          hapticMedium();
          setMenuOpen(true);
        }}
        accessibilityLabel="Add meal"
        testID="fab-add-meal"
        style={{
          position: 'absolute',
          right: 20,
          bottom: insets.bottom + 85,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 8,
        }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Plus size={28} color="#fff" />
      </Pressable>

      {/* Floating Menu Modal */}
      <Modal visible={menuOpen} transparent animationType="none" onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setMenuOpen(false)}
          testID="menu-backdrop"
        >
          <Animated.View
            style={{
              position: 'absolute',
              right: 20,
              bottom: insets.bottom + 85 + 72,
              transform: [{ scale: scaleAnim }],
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              minWidth: 200,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Pressable
              onPress={() => handleMenuOption('/capture')}
              style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
              accessibilityLabel="Scan meal with camera"
              testID="menu-scan-meal"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Camera size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 15, color: colors.textPrimary }}>Scan Meal</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => handleMenuOption('/capture/barcode')}
              style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}
              accessibilityLabel="Scan barcode"
              testID="menu-scan-barcode"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Barcode size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 15, color: colors.textPrimary }}>Scan Barcode</Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => handleMenuOption('/capture/food-label')}
              style={{ paddingVertical: 12, paddingHorizontal: 16 }}
              accessibilityLabel="Scan food label"
              testID="menu-scan-food-label"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ScanLine size={20} color={colors.textPrimary} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 15, color: colors.textPrimary }}>Scan Food Label</Text>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}
