import React, { useState, useMemo } from 'react';
import { View, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { useUpdateMeal } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';
import type { Meal } from '@/types';

export default function EditMealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const updateMeal = useUpdateMeal();

  // Find the meal from cache — no network fetch needed
  const meal = useMemo(() => {
    const allQueries = queryClient.getQueriesData<Meal[]>({ queryKey: ['meals'], exact: false });
    for (const [, data] of allQueries) {
      if (!data) continue;
      const found = data.find((m) => m.id === id);
      if (found) return found;
    }
    return null;
  }, [id, queryClient]);

  const [name, setName] = useState<string>(meal?.name ?? '');
  const [calories, setCalories] = useState<string>(String(meal?.totalCalories ?? meal?.calories ?? 0));
  const [protein, setProtein] = useState<string>(String(meal?.proteinG ?? 0));
  const [carbs, setCarbs] = useState<string>(String(meal?.carbsG ?? 0));
  const [fat, setFat] = useState<string>(String(meal?.fatG ?? 0));
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    hapticLight();
    setError(null);
    updateMeal.mutate(
      {
        id: id ?? '',
        name: name.trim() || 'Meal',
        totalCalories: Number(calories) || 0,
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
      },
      {
        onSuccess: () => router.back(),
        onError: (err: any) => setError(err?.message ?? 'Failed to update meal'),
      },
    );
  };

  if (!meal) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
        <Text style={{ fontSize: 15, color: colors.textSecondary }}>Meal not found</Text>
        <Pressable
          onPress={() => router.back()}
          style={{ marginTop: 16 }}
          accessibilityLabel="Go back"
          testID="edit-meal-back-fallback"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={{ fontSize: 15, color: colors.primary, fontWeight: '600' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <Pressable
          onPress={() => { hapticLight(); router.back(); }}
          accessibilityLabel="Go back"
          testID="edit-meal-back"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
          <Text style={{ fontSize: 15, color: colors.textPrimary, marginLeft: 2 }}>Back</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>Edit Meal</Text>
        <Pressable
          onPress={handleSave}
          disabled={updateMeal.isPending}
          accessibilityLabel="Save meal changes"
          testID="edit-meal-save"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ opacity: updateMeal.isPending ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>
            {updateMeal.isPending ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
        {error ? (
          <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, color: '#DC2626' }}>{error}</Text>
          </View>
        ) : null}

        {/* Name */}
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            fontSize: 16,
            color: colors.textPrimary,
            marginBottom: 20,
          }}
          placeholderTextColor={colors.textSecondary}
          placeholder="Meal name"
          testID="edit-meal-name"
        />

        {/* Macro fields */}
        <MacroInput label="Calories" value={calories} onChange={setCalories} unit="kcal" color={colors.primary} testID="edit-meal-calories" />
        <MacroInput label="Protein" value={protein} onChange={setProtein} unit="g" color={colors.protein} testID="edit-meal-protein" />
        <MacroInput label="Carbs" value={carbs} onChange={setCarbs} unit="g" color={colors.carbs} testID="edit-meal-carbs" />
        <MacroInput label="Fat" value={fat} onChange={setFat} unit="g" color={colors.fat} testID="edit-meal-fat" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MacroInput({ label, value, onChange, unit, color, testID }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  color: string;
  testID: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
        <View style={{ width: 4, height: '100%', backgroundColor: color }} />
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          style={{
            flex: 1,
            padding: 14,
            fontSize: 16,
            color: colors.textPrimary,
          }}
          placeholderTextColor={colors.textSecondary}
          testID={testID}
        />
        <Text style={{ fontSize: 14, color: colors.textSecondary, paddingRight: 14 }}>{unit}</Text>
      </View>
    </View>
  );
}
