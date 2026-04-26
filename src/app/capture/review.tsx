import React, { useState } from 'react';
import { View, Pressable, Image, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { hapticMedium } from '@/lib/haptics';
import { useAppStore } from '@/lib/store';
import { useSaveMeal } from '@/lib/api-hooks';

export default function ReviewScreen() {
  const pendingMeal = useAppStore(s => s.pendingMeal);
  const clearPendingMeal = useAppStore(s => s.clearPendingMeal);
  const { mutateAsync: saveMeal, isPending: isSaving } = useSaveMeal();
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!pendingMeal) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' }}>No meal to review</Text>
        <Pressable
          onPress={() => router.replace('/(tabs)/home')}
          style={{ marginTop: 16, paddingVertical: 12 }}
          accessibilityLabel="Go to home"
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Go to Home</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { name, totalCalories, proteinG, carbsG, fatG, items, photoUrl, aiConfidence } = pendingMeal;

  const handleSave = async () => {
    hapticMedium();
    setSaveError(null);
    try {
      await saveMeal({
        name: name || 'Meal',
        totalCalories: totalCalories || 0,
        proteinG: proteinG || 0,
        carbsG: carbsG || 0,
        fatG: fatG || 0,
        eatenAt: Date.now() as any,
        photoUrl,
        items: items.map((item, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          name: item.name,
          calories: item.calories,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
          quantity: 1,
          unit: item.servingSize || 'serving',
        })),
      });
      clearPendingMeal();
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('[review] save error:', err);
      setSaveError('Failed to save meal — please try again');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          testID="review-back"
          style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text }}>Review Meal</Text>
        <View style={{ width: 40 }} />
      </View>

      {saveError ? (
        <View style={{ marginHorizontal: 20, marginBottom: 8, backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '500' }}>{saveError}</Text>
        </View>
      ) : null}

      {typeof aiConfidence === 'string' && aiConfidence === 'low' && !saveError ? (
        <View style={{ marginHorizontal: 20, marginBottom: 8, backgroundColor: '#FEF3C7', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={14} color="#D97706" />
          <Text style={{ color: '#D97706', fontSize: 12, fontWeight: '500', flex: 1 }}>Estimates may vary — tap any item to edit</Text>
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        {/* Photo */}
        {photoUrl ? (
          <View style={{ marginTop: 16, borderRadius: 16, overflow: 'hidden', aspectRatio: 4 / 3, backgroundColor: colors.surface }}>
            <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          </View>
        ) : null}

        {/* Meal name */}
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 20 }}>{name || 'Meal'}</Text>

        {/* Macros summary */}
        <View style={{ marginTop: 16, backgroundColor: colors.surface, borderRadius: 16, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary }}>CALORIES</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{totalCalories || 0}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>PROTEIN</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{proteinG || 0}g</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>CARBS</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{carbsG || 0}g</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 4 }}>FAT</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>{fatG || 0}g</Text>
            </View>
          </View>
        </View>

        {/* Items breakdown */}
        {items && items.length > 0 ? (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 }}>Items</Text>
            {items.map((item, idx) => (
              <View key={idx} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, flex: 1 }}>{item.name}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>{item.calories} cal</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>P: {item.proteinG}g</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>C: {item.carbsG}g</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>F: {item.fatG}g</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Save button */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable
          onPress={handleSave}
          disabled={isSaving}
          accessibilityLabel="Save meal"
          testID="save-meal-button"
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: colors.primary, borderRadius: 999,
            paddingVertical: 16, opacity: isSaving ? 0.6 : 1,
          }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Check size={20} color="#fff" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>{isSaving ? 'Saving...' : 'Save Meal'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
