import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ArrowLeft, Share2, Pencil, Flame, Trash2, Plus, Check } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { useAppStore } from '@/lib/store';
import { useCreateMeal } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticLight, hapticSuccess, hapticMedium } from '@/lib/haptics';
import type { MealItem } from '@/types';

export default function ReviewScreen() {
  const pendingMeal = useAppStore(s => s.pendingMeal);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);
  const createMealMutation = useCreateMeal();

  const defaultItems: MealItem[] = [
    { id: '1', name: 'Grilled Chicken', calories: 250, proteinG: 35, carbsG: 0, fatG: 8, quantity: 180, unit: 'g' },
    { id: '2', name: 'Brown Rice', calories: 150, proteinG: 3, carbsG: 32, fatG: 1, quantity: 120, unit: 'g' },
    { id: '3', name: 'Mixed Vegetables', calories: 55, proteinG: 3, carbsG: 6, fatG: 2, quantity: 100, unit: 'g' },
  ];

  const [mealName, setMealName] = useState<string>(pendingMeal?.name ?? 'Grilled Chicken Bowl');
  const [editing, setEditing] = useState<boolean>(false);
  const [items, setItems] = useState<MealItem[]>((pendingMeal?.items ?? defaultItems) as MealItem[]);
  const [loading, setLoading] = useState<boolean>(false);

  const totals = useMemo(() => ({
    calories: items.reduce((s, i) => s + i.calories, 0),
    protein: items.reduce((s, i) => s + i.proteinG, 0),
    carbs: items.reduce((s, i) => s + i.carbsG, 0),
    fat: items.reduce((s, i) => s + i.fatG, 0),
  }), [items]);

  const deleteItem = (id: string) => {
    hapticLight();
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    setLoading(true);
    hapticMedium();

    createMealMutation.mutate(
      {
        name: mealName,
        photoUrl: pendingMeal?.photoUrl ?? undefined,
        totalCalories: totals.calories,
        proteinG: totals.protein,
        carbsG: totals.carbs,
        fatG: totals.fat,
        items: items.map(i => ({
          name: i.name,
          calories: i.calories,
          proteinG: i.proteinG,
          carbsG: i.carbsG,
          fatG: i.fatG,
          quantity: i.quantity,
          unit: i.unit,
        })),
        eatenAt: pendingMeal?.eatenAt ?? new Date().toISOString(),
      },
      {
        onSuccess: () => {
          hapticSuccess();
          setPendingMeal(null);
          setLoading(false);
          router.replace('/(tabs)/home');
        },
        onError: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" testID="review-back" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Create Meal</Text>
        <Pressable accessibilityLabel="Share" testID="review-share" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Share2 size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        {/* Meal Name */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 20 }}>
          {editing ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceElevated, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.border }}>
              <TextInput
                value={mealName}
                onChangeText={setMealName}
                style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.textPrimary }}
                autoFocus
                accessibilityLabel="Edit meal name"
                testID="meal-name-input"
              />
              <Pressable onPress={() => setEditing(false)} accessibilityLabel="Done editing" testID="done-editing" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Check size={20} color={colors.primary} />
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary, flex: 1 }}>{mealName}</Text>
              <Pressable onPress={() => setEditing(true)} accessibilityLabel="Edit meal name" testID="edit-name">
                <Pencil size={18} color={colors.textSecondary} />
              </Pressable>
            </>
          )}
        </View>

        {/* Calories Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 16 }}>
          <Flame size={24} color={colors.primary} />
          <Text style={{ fontSize: 48, fontWeight: '800', color: colors.textPrimary, letterSpacing: -2, marginTop: 4 }}>{totals.calories}</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Calories</Text>
        </View>

        {/* Macro Chips */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <View style={{ flex: 1, backgroundColor: `${colors.protein}15`, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.protein }}>{totals.protein}g</Text>
            <Text style={{ fontSize: 11, color: colors.protein, fontWeight: '500' }}>Protein</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: `${colors.carbs}15`, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.carbs }}>{totals.carbs}g</Text>
            <Text style={{ fontSize: 11, color: colors.carbs, fontWeight: '500' }}>Carbs</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: `${colors.fat}15`, borderRadius: 14, paddingVertical: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.fat }}>{totals.fat}g</Text>
            <Text style={{ fontSize: 11, color: colors.fat, fontWeight: '500' }}>Fat</Text>
          </View>
        </View>

        {/* Meal Items */}
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>Meal Items</Text>
        {items.map(item => (
          <View key={item.id} style={{
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
            borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 8,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{item.quantity}{item.unit} · {item.calories} kcal</Text>
            </View>
            <Pressable onPress={() => deleteItem(item.id)} accessibilityLabel={`Delete ${item.name}`} testID={`delete-item-${item.id}`} style={{ padding: 8 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Trash2 size={16} color="#E05555" />
            </Pressable>
          </View>
        ))}

        {/* Add items */}
        <Pressable
          onPress={() => { hapticLight(); router.push('/capture/library'); }}
          accessibilityLabel="Add items to meal"
          testID="add-items"
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
            borderRadius: 16, paddingVertical: 14, marginTop: 4,
          }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Plus size={18} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Add items to this meal</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PillButton title="Create Meal" onPress={handleSave} variant="dark" loading={loading} fullWidth />
      </View>
    </View>
  );
}
