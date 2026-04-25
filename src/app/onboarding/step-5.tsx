import React, { useState } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { ChevronLeft } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';

const TIMELINES = [
  { label: '3 mo', value: '3 months' },
  { label: '6 mo', value: '6 months' },
  { label: '12 mo', value: '12 months' },
  { label: 'Custom', value: 'custom' },
];

export default function OnboardingStep5() {
  const params = useLocalSearchParams<{ goal: string; activity: string; sex: string; birthDate: string; heightCm: string; weightKg: string }>();
  const currentWeight = parseFloat(params.weightKg || '75');
  const goal = params.goal || 'lose';

  const defaultTargetKg = goal === 'lose' ? Math.round(currentWeight - 5) : goal === 'gain' ? Math.round(currentWeight + 5) : Math.round(currentWeight);
  const defaultTargetLb = Math.round(defaultTargetKg * 2.20462);

  // Imperial is the default unit system; users can toggle to metric.
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('lb');
  const [targetWeightKg, setTargetWeightKg] = useState<string>(String(defaultTargetKg));
  const [targetWeightLb, setTargetWeightLb] = useState<string>(String(defaultTargetLb));
  const [timeline, setTimeline] = useState<string>('6 months');
  const [customMonths, setCustomMonths] = useState<string>('');

  const handleWeightUnitToggle = () => {
    hapticLight();
    if (weightUnit === 'kg') {
      const kg = parseFloat(targetWeightKg) || defaultTargetKg;
      const lb = Math.round(kg * 2.20462);
      setTargetWeightLb(String(lb));
      setWeightUnit('lb');
    } else {
      const lb = parseFloat(targetWeightLb) || defaultTargetLb;
      const kg = Math.round(lb / 2.20462);
      setTargetWeightKg(String(kg));
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
            <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: '83%' }} />
          </View>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 20 }}>STEP 5 OF 6</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginTop: 8, marginBottom: 8 }}>Your target</Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 32 }}>Where do you want to be?</Text>

        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Target Weight</Text>
            <Pressable
              onPress={handleWeightUnitToggle}
              accessibilityLabel={`Switch to ${weightUnit === 'kg' ? 'pounds' : 'kilograms'}`}
              testID="target-weight-unit-toggle"
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
              value={weightUnit === 'kg' ? targetWeightKg : targetWeightLb}
              onChangeText={weightUnit === 'kg' ? setTargetWeightKg : setTargetWeightLb}
              keyboardType="numeric"
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="no"
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              style={{ fontSize: 48, fontWeight: '800', color: colors.primary, textAlign: 'center', letterSpacing: -1.5 }}
              accessibilityLabel={`Target weight in ${weightUnit === 'kg' ? 'kilograms' : 'pounds'}`}
              testID="target-weight-input"
            />
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>{weightUnit === 'kg' ? 'kilograms' : 'pounds'}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Timeline</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          {TIMELINES.map(t => (
            <Pressable
              key={t.value}
              onPress={() => { hapticLight(); setTimeline(t.value); }}
              accessibilityLabel={`Timeline: ${t.label}`}
              testID={`timeline-${t.value.replace(' ', '-')}`}
              style={{
                flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
                backgroundColor: timeline === t.value ? colors.primary : colors.surface,
                borderWidth: 1, borderColor: timeline === t.value ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: timeline === t.value ? '#fff' : colors.textPrimary }}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
        {timeline === 'custom' && (
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>Custom timeline (months)</Text>
            <TextInput
              value={customMonths}
              onChangeText={setCustomMonths}
              keyboardType="numeric"
              autoComplete="off"
              textContentType="none"
              autoCorrect={false}
              spellCheck={false}
              importantForAutofill="no"
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              placeholder="e.g., 9"
              placeholderTextColor={colors.textSecondary}
              style={{ fontSize: 32, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' }}
              accessibilityLabel="Custom timeline in months"
              testID="custom-months-input"
            />
          </View>
        )}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PillButton
          title="Calculate My Plan"
          onPress={() => {
            let finalWeightKg: number;
            if (weightUnit === 'kg') {
              finalWeightKg = parseFloat(targetWeightKg) || defaultTargetKg;
            } else {
              const lb = parseFloat(targetWeightLb) || defaultTargetLb;
              finalWeightKg = Math.round(lb / 2.20462);
            }

            const finalTimeline = timeline === 'custom' && customMonths ? `${customMonths} months` : timeline;

            router.push({
              pathname: '/onboarding/step-6',
              params: { ...params, targetWeightKg: String(finalWeightKg), timeline: finalTimeline },
            });
          }}
          disabled={
            (weightUnit === 'kg' && !targetWeightKg) ||
            (weightUnit === 'lb' && !targetWeightLb) ||
            (timeline === 'custom' && !customMonths)
          }
          fullWidth
        />
      </View>
    </View>
  );
}
