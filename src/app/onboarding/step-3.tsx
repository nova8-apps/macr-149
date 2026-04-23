import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { ChevronLeft } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';

export default function OnboardingStep3() {
  const params = useLocalSearchParams<{ goal: string; activity: string }>();
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [birthMonth, setBirthMonth] = useState<number>(6);

  const years = Array.from({ length: 60 }, (_, i) => 2006 - i);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
            <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: '50%' }} />
          </View>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 20 }}>STEP 3 OF 6</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginTop: 8, marginBottom: 8 }}>About you</Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 32 }}>We need this to calculate your BMR accurately</Text>

        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Sex</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
          {(['male', 'female'] as const).map(s => (
            <Pressable
              key={s}
              onPress={() => { hapticLight(); setSex(s); }}
              accessibilityLabel={`Sex: ${s}`}
              testID={`sex-${s}`}
              style={{
                flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                backgroundColor: sex === s ? `${colors.primary}12` : colors.surface,
                borderWidth: 2, borderColor: sex === s ? colors.primary : colors.border,
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 4 }}>{s === 'male' ? '♂' : '♀'}</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: sex === s ? colors.primary : colors.textPrimary }}>
                {s === 'male' ? 'Male' : 'Female'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>Date of birth</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 4, height: 200, overflow: 'hidden' }}>
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Month</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
              {months.map((m, i) => (
                <Pressable
                  key={m}
                  onPress={() => { hapticLight(); setBirthMonth(i + 1); }}
                  accessibilityLabel={`Month: ${m}`}
                  testID={`month-${m}`}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
                    backgroundColor: birthMonth === i + 1 ? colors.primary : 'transparent',
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: birthMonth === i + 1 ? '#fff' : colors.textPrimary, textAlign: 'center' }}>{m}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 4, height: 200, overflow: 'hidden' }}>
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Year</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
              {years.map(y => (
                <Pressable
                  key={y}
                  onPress={() => { hapticLight(); setBirthYear(y); }}
                  accessibilityLabel={`Year: ${y}`}
                  testID={`year-${y}`}
                  style={{
                    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
                    backgroundColor: birthYear === y ? colors.primary : 'transparent',
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: birthYear === y ? '#fff' : colors.textPrimary, textAlign: 'center' }}>{y}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PillButton
          title="Continue"
          onPress={() => {
            if (sex) {
              router.push({
                pathname: '/onboarding/step-4',
                params: { ...params, sex, birthDate: `${birthYear}-${String(birthMonth).padStart(2, '0')}-15` },
              });
            }
          }}
          disabled={!sex}
          fullWidth
        />
      </View>
    </View>
  );
}
