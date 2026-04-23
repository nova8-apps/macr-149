import React, { useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ArrowLeft, ScanBarcode, Search } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { useAppStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import { hapticMedium, hapticSuccess } from '@/lib/haptics';

export default function BarcodeScreen() {
  const [barcode, setBarcode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const setPendingMeal = useAppStore(s => s.setPendingMeal);

  const handleLookup = async () => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError(null);
    hapticMedium();

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode.trim()}.json`);
      const data = await res.json();

      if (data.status === 1 && data.product) {
        const p = data.product;
        const nutrients = p.nutriments || {};
        const name = p.product_name || 'Scanned Product';
        const cal = Math.round(nutrients['energy-kcal_100g'] || nutrients['energy-kcal'] || 0);
        const pro = Math.round(nutrients.proteins_100g || nutrients.proteins || 0);
        const carb = Math.round(nutrients.carbohydrates_100g || nutrients.carbohydrates || 0);
        const fat = Math.round(nutrients.fat_100g || nutrients.fat || 0);

        setPendingMeal({
          name,
          totalCalories: cal,
          proteinG: pro,
          carbsG: carb,
          fatG: fat,
          items: [{ id: '1', name, calories: cal, proteinG: pro, carbsG: carb, fatG: fat, quantity: 100, unit: 'g' }],
          eatenAt: new Date().toISOString(),
          aiConfidence: 'high', // barcode database is exact
        } as any);
        hapticSuccess();
        router.push('/capture/review');
      } else {
        setError('Product not found. Try another barcode.');
      }
    } catch (err: any) {
      console.error('[barcode] lookup error:', err);
      setError('Could not look up barcode. Check your connection.');
    }

    setLoading(false);
  };

  // Demo barcodes
  const demoLookup = (name: string, cal: number, pro: number, carb: number, fat: number) => {
    hapticMedium();
    setPendingMeal({
      name,
      totalCalories: cal,
      proteinG: pro,
      carbsG: carb,
      fatG: fat,
      items: [{ id: '1', name, calories: cal, proteinG: pro, carbsG: carb, fatG: fat, quantity: 100, unit: 'g' }],
      eatenAt: new Date().toISOString(),
      aiConfidence: 'high',
    } as any);
    router.push('/capture/review');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 }}>
      <View style={{ paddingTop: 56, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" testID="barcode-back" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Barcode Scanner</Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
          <ScanBarcode size={36} color={colors.primary} />
        </View>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginTop: 16 }}>Enter barcode number</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Or use camera on a real device</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
        <Search size={18} color={colors.textSecondary} />
        <TextInput
          value={barcode}
          onChangeText={setBarcode}
          placeholder="e.g. 3017620422003"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          style={{ flex: 1, marginLeft: 12, fontSize: 15, color: colors.textPrimary }}
          accessibilityLabel="Barcode input"
          testID="barcode-input"
        />
      </View>

      {error && (
        <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ color: '#DC2626', fontSize: 13, fontWeight: '500' }}>{error}</Text>
        </View>
      )}

      <PillButton title="Look Up" onPress={handleLookup} loading={loading} fullWidth />

      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginTop: 32, marginBottom: 12 }}>Quick Add</Text>
      {[
        { name: 'Nutella (200g jar)', cal: 539, pro: 6, carb: 57, fat: 31 },
        { name: 'Coca-Cola (330ml)', cal: 139, pro: 0, carb: 35, fat: 0 },
        { name: 'Chobani Greek Yogurt', cal: 120, pro: 14, carb: 13, fat: 2 },
      ].map((item, i) => (
        <Pressable
          key={i}
          onPress={() => demoLookup(item.name, item.cal, item.pro, item.carb, item.fat)}
          accessibilityLabel={`Quick add ${item.name}`}
          testID={`quick-add-${i}`}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: colors.surface, borderRadius: 14, padding: 14,
            borderWidth: 1, borderColor: colors.border, marginBottom: 8,
          }}
        >
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{item.cal} kcal · P:{item.pro}g C:{item.carb}g F:{item.fat}g</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
