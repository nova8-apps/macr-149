import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { ChevronLeft } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';

export default function OnboardingStep4() {
  const params = useLocalSearchParams<{ goal: string; activity: string; sex: string; birthDate: string }>();
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightCm, setHeightCm] = useState<string>('175');
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<string>('9');

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [weightKg, setWeightKg] = useState<string>('75');
  const [weightLb, setWeightLb] = useState<string>('165');

  const handleHeightUnitToggle = () => {
    hapticLight();
    if (heightUnit === 'cm') {
      const cm = parseFloat(heightCm) || 175;
      const totalInches = cm / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      setHeightFt(String(ft));
      setHeightIn(String(inches));
      setHeightUnit('ft');
    } else {
      const ft = parseFloat(heightFt) || 5;
      const inches = parseFloat(heightIn) || 9;
      const totalCm = Math.round((ft * 12 + inches) * 2.54);
      setHeightCm(String(totalCm));
      setHeightUnit('cm');
    }
  };

  const handleWeightUnitToggle = () => {
    hapticLight();
    if (weightUnit === 'kg') {
      const kg = parseFloat(weightKg) || 75;
      const lb = Math.round(kg * 2.20462);
      setWeightLb(String(lb));
      setWeightUnit('lb');
    } else {
      const lb = parseFloat(weightLb) || 165;
      const kg = Math.round(lb / 2.20462);
      setWeightKg(String(kg));
      setWeightUnit('kg');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Pressable
        onPress={() => { hapticLight(); router.back(); }}
        accessibilityLabel="Go back"
        testID="back-button"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{ position: 'absolute', top: 50, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
      >
        <ChevronLeft size={24} color={colors.textPrimary} />
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <View style={{ paddingTop: 70, marginBottom: 8 }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: '66%' }} />
          </View>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 20 }}>STEP 4 OF 6</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginTop: 8, marginBottom: 8 }}>Your measurements</Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 32 }}>Used to calculate your metabolism</Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Height</Text>
            <Pressable
              onPress={handleHeightUnitToggle}
              accessibilityLabel={`Switch to ${heightUnit === 'cm' ? 'feet/inches' : 'centimeters'}`}
              testID="height-unit-toggle"
              style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 10, padding: 4 }}
            >
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: heightUnit === 'cm' ? colors.primary : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: heightUnit === 'cm' ? '#fff' : colors.textSecondary }}>cm</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: heightUnit === 'ft' ? colors.primary : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: heightUnit === 'ft' ? '#fff' : colors.textSecondary }}>ft/in</Text>
              </View>
            </Pressable>
          </View>
          {heightUnit === 'cm' ? (
            <View style={{ alignItems: 'center' }}>
              <TextInput
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                style={{ fontSize: 48, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', letterSpacing: -1.5 }}
                accessibilityLabel="Height in centimeters"
                testID="height-input-cm"
              />
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>centimeters</Text>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ alignItems: 'center' }}>
                  <TextInput
                    value={heightFt}
                    onChangeText={setHeightFt}
                    keyboardType="numeric"
                    style={{ fontSize: 48, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', letterSpacing: -1.5, width: 80 }}
                    accessibilityLabel="Height in feet"
                    testID="height-input-ft"
                  />
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>feet</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <TextInput
                    value={heightIn}
                    onChangeText={setHeightIn}
                    keyboardType="numeric"
                    style={{ fontSize: 48, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', letterSpacing: -1.5, width: 80 }}
                    accessibilityLabel="Height in inches"
                    testID="height-input-in"
                  />
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>inches</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Current Weight</Text>
            <Pressable
              onPress={handleWeightUnitToggle}
              accessibilityLabel={`Switch to ${weightUnit === 'kg' ? 'pounds' : 'kilograms'}`}
              testID="weight-unit-toggle"
              style={{ flexDirection: 'row', backgroundColor: colors.bg, borderRadius: 10, padding: 4 }}
            >
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: weightUnit === 'kg' ? colors.primary : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: weightUnit === 'kg' ? '#fff' : colors.textSecondary }}>kg</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, backgroundColor: weightUnit === 'lb' ? colors.primary : 'transparent' }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: weightUnit === 'lb' ? '#fff' : colors.textSecondary }}>lb</Text>
              </View>
            </Pressable>
          </View>
          <View style={{ alignItems: 'center' }}>
            <TextInput
              value={weightUnit === 'kg' ? weightKg : weightLb}
              onChangeText={weightUnit === 'kg' ? setWeightKg : setWeightLb}
              keyboardType="numeric"
              style={{ fontSize: 48, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', letterSpacing: -1.5 }}
              accessibilityLabel={`Weight in ${weightUnit === 'kg' ? 'kilograms' : 'pounds'}`}
              testID="weight-input"
            />
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{weightUnit === 'kg' ? 'kilograms' : 'pounds'}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PillButton
          title="Continue"
          onPress={() => {
            let finalHeightCm: number;
            if (heightUnit === 'cm') {
              finalHeightCm = parseFloat(heightCm) || 175;
            } else {
              const ft = parseFloat(heightFt) || 5;
              const inches = parseFloat(heightIn) || 9;
              finalHeightCm = Math.round((ft * 12 + inches) * 2.54);
            }

            let finalWeightKg: number;
            if (weightUnit === 'kg') {
              finalWeightKg = parseFloat(weightKg) || 75;
            } else {
              const lb = parseFloat(weightLb) || 165;
              finalWeightKg = Math.round(lb / 2.20462);
            }

            router.push({
              pathname: '/onboarding/step-5',
              params: { ...params, heightCm: String(finalHeightCm), weightKg: String(finalWeightKg) },
            });
          }}
          disabled={(heightUnit === 'cm' && !heightCm) || (heightUnit === 'ft' && (!heightFt || !heightIn)) || (weightUnit === 'kg' && !weightKg) || (weightUnit === 'lb' && !weightLb)}
          fullWidth
        />
      </View>
    </View>
  );
}
