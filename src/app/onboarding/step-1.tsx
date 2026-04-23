import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ScrollView } from '@/components/ui/scroll-view';
import { Target, TrendingDown, TrendingUp } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';

const GOALS = [
  { id: 'lose' as const, label: 'Lose Weight', desc: 'Shed fat and feel lighter', icon: TrendingDown, color: colors.primary },
  { id: 'maintain' as const, label: 'Maintain', desc: 'Stay at your current weight', icon: Target, color: colors.carbs },
  { id: 'gain' as const, label: 'Gain Weight', desc: 'Build muscle and mass', icon: TrendingUp, color: colors.protein },
];

function GoalCard({ goal, selected, onSelect }: { goal: typeof GOALS[0]; selected: boolean; onSelect: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={() => { hapticLight(); scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); setTimeout(() => { scale.value = withSpring(1); }, 100); onSelect(); }}
        accessibilityLabel={`Goal: ${goal.label}`}
        testID={`goal-${goal.id}`}
        style={{
          flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20,
          backgroundColor: selected ? `${goal.color}12` : colors.surface,
          borderWidth: 2, borderColor: selected ? goal.color : colors.border,
          marginBottom: 12,
        }}
      >
        <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: `${goal.color}15`, alignItems: 'center', justifyContent: 'center' }}>
          <goal.icon size={24} color={goal.color} />
        </View>
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>{goal.label}</Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>{goal.desc}</Text>
        </View>
        <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selected ? goal.color : colors.border, alignItems: 'center', justifyContent: 'center' }}>
          {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: goal.color }} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function OnboardingStep1() {
  const [selected, setSelected] = useState<'lose' | 'maintain' | 'gain' | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}>
        <View style={{ paddingTop: 70, marginBottom: 8 }}>
          <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.primary, width: '16.6%' }} />
          </View>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 20 }}>STEP 1 OF 6</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5, marginTop: 8, marginBottom: 8 }}>What's your goal?</Text>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 32 }}>We'll customize your daily targets based on this</Text>

        {GOALS.map(g => (
          <GoalCard key={g.id} goal={g} selected={selected === g.id} onSelect={() => setSelected(g.id)} />
        ))}
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PillButton
          title="Continue"
          onPress={() => {
            if (selected) {
              router.push({ pathname: '/onboarding/step-2', params: { goal: selected } });
            }
          }}
          disabled={!selected}
          fullWidth
        />
      </View>
    </View>
  );
}
