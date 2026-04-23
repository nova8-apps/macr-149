import React, { useState } from 'react';
import { View, Pressable, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';

export default function FoodLabelScreen() {
  const setPendingMeal = useAppStore(s => s.setPendingMeal);
  const [productName, setProductName] = useState<string>('');
  const [servingSize, setServingSize] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');

  const handleAdd = () => {
    hapticMedium();
    const cal = parseInt(calories) || 0;
    const pro = parseInt(protein) || 0;
    const cb = parseInt(carbs) || 0;
    const ft = parseInt(fat) || 0;
    const name = productName.trim() || 'Food Label Item';

    setPendingMeal({
      name,
      totalCalories: cal,
      proteinG: pro,
      carbsG: cb,
      fatG: ft,
      items: [{ id: '1', name, calories: cal, proteinG: pro, carbsG: cb, fatG: ft, quantity: 1, unit: servingSize || 'serving' }],
      eatenAt: new Date().toISOString(),
    });
    hapticSuccess();
    router.push('/capture/review');
  };

  const fields = [
    { label: 'Product Name', value: productName, set: setProductName, placeholder: 'e.g. Protein Bar', kb: 'default' as const },
    { label: 'Serving Size', value: servingSize, set: setServingSize, placeholder: 'e.g. 1 bar (60g)', kb: 'default' as const },
    { label: 'Calories', value: calories, set: setCalories, placeholder: '0', kb: 'numeric' as const },
    { label: 'Protein (g)', value: protein, set: setProtein, placeholder: '0', kb: 'numeric' as const },
    { label: 'Carbs (g)', value: carbs, set: setCarbs, placeholder: '0', kb: 'numeric' as const },
    { label: 'Fat (g)', value: fat, set: setFat, placeholder: '0', kb: 'numeric' as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" testID="label-back" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Food Label</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={28} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 12, textAlign: 'center' }}>Enter nutrition facts from the label</Text>
        </View>

        {fields.map((f, i) => (
          <View key={i} style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>{f.label}</Text>
            <TextInput
              value={f.value}
              onChangeText={f.set}
              placeholder={f.placeholder}
              placeholderTextColor={colors.textSecondary}
              keyboardType={f.kb}
              style={{
                backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
                fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
              }}
              accessibilityLabel={f.label}
              testID={`label-${f.label.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </View>
        ))}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PillButton title="Add to Meal" onPress={handleAdd} fullWidth disabled={!calories} />
      </View>
    </View>
  );
}
