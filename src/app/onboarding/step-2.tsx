import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { Armchair, Footprints, Bike, Zap, ChevronLeft } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';

const LEVELS = [
  { id: 'sedentary' as const, label: 'Sedentary', desc: 'Little to no exercise, desk job', icon: Armchair, multiplier: 1.2 },
  { id: 'light' as const, label: 'Lightly Active', desc: 'Light exercise 1-3 days/week', icon: Footprints, multiplier: 1.375 },
  { id: 'moderate' as const, label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week', icon: Bike, multiplier: 1.55 },
  { id: 'very_active' as const, label: 'Very Active', desc: 'Hard exercise 6-7 days/week', icon: Zap, multiplier: 1.725 },
];

export default function OnboardingStep2() {
  const { goal = 'lose' } = useLocalSearchParams<{ goal: string }>();
  const [selected, setSelected] = useState<string | null>(null);

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
            <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: '33%' }} />
          </View>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 20 }}>STEP 2 OF 6</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginTop: 8, marginBottom: 8 }}>Activity level?</Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 32 }}>This helps calculate your daily calorie needs</Text>

        {LEVELS.map(l => {
          const isSelected = selected === l.id;
          return (
            <Pressable
              key={l.id}
              onPress={() => { hapticLight(); setSelected(l.id); }}
              accessibilityLabel={`Activity level: ${l.label}`}
              testID={`activity-${l.id}`}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20,
                backgroundColor: isSelected ? `${colors.primary}12` : colors.surface,
                borderWidth: 2, borderColor: isSelected ? colors.primary : colors.border,
                marginBottom: 12,
              }}
            >
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: isSelected ? `${colors.primary}15` : colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }}>
                <l.icon size={22} color={isSelected ? colors.primary : colors.textSecondary} />
              </View>
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>{l.label}</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{l.desc}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PillButton
          title="Continue"
          onPress={() => {
            if (selected) {
              router.push({ pathname: '/onboarding/step-3', params: { goal, activity: selected } });
            }
          }}
          disabled={!selected}
          fullWidth
        />
      </View>
    </View>
  );
}
