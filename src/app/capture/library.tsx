import React, { useState, useMemo } from 'react';
import { View, Pressable, TextInput, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ArrowLeft, Search, Plus } from 'lucide-react-native';
import { useAppStore, SEED_FOODS } from '@/lib/store';
import { useFoodSearch } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import type { FoodItem } from '@/types';

export default function LibraryScreen() {
  const [query, setQuery] = useState<string>('');
  const setPendingMeal = useAppStore(s => s.setPendingMeal);

  const { data: apiFoods } = useFoodSearch(query);

  // Use API results if available, fall back to seed data with local filter
  const filtered = useMemo(() => {
    if (apiFoods && apiFoods.length > 0) return apiFoods;
    const localFoods = SEED_FOODS;
    if (!query.trim()) return localFoods;
    const q = query.toLowerCase();
    return localFoods.filter(f => f.name.toLowerCase().includes(q));
  }, [query, apiFoods]);

  const handleSelect = (food: FoodItem) => {
    hapticSuccess();
    const servingG = parseFloat(food.servingSize || '100');
    const multiplier = servingG / 100;
    const cal = Math.round(food.caloriesPer100g * multiplier);
    const pro = Math.round(food.proteinG * multiplier);
    const carb = Math.round(food.carbsG * multiplier);
    const fat = Math.round(food.fatG * multiplier);

    setPendingMeal({
      name: food.name,
      totalCalories: cal,
      proteinG: pro,
      carbsG: carb,
      fatG: fat,
      items: [{ id: food.id, name: food.name, calories: cal, proteinG: pro, carbsG: carb, fatG: fat, quantity: servingG, unit: food.servingUnit || 'g' }],
      eatenAt: new Date().toISOString(),
    });
    router.push('/capture/review');
  };

  const renderItem = ({ item }: { item: FoodItem }) => {
    const servingG = parseFloat(item.servingSize || '100');
    const multiplier = servingG / 100;
    const cal = Math.round(item.caloriesPer100g * multiplier);

    return (
      <Pressable
        onPress={() => handleSelect(item)}
        accessibilityLabel={`Select ${item.name}`}
        testID={`food-${item.id}`}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: colors.surface, borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: colors.border, marginBottom: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{item.name}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {servingG}{item.servingUnit || 'g'} · {cal} kcal
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.protein }}>P {Math.round(item.proteinG * multiplier)}g</Text>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.carbs }}>C {Math.round(item.carbsG * multiplier)}g</Text>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.fat }}>F {Math.round(item.fatG * multiplier)}g</Text>
          </View>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} color={colors.primary} />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" testID="library-back" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Food Library</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: colors.border }}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search foods..."
            placeholderTextColor={colors.textSecondary}
            style={{ flex: 1, marginLeft: 10, fontSize: 15, color: colors.textPrimary }}
            accessibilityLabel="Search foods"
            testID="food-search-input"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false} windowSize={10} maxToRenderPerBatch={10} initialNumToRender={10} removeClippedSubviews={true} />
    </View>
  );
}
