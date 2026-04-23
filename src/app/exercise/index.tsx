import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ArrowLeft, Dumbbell, Footprints, Bike, Waves, Flower2, Zap } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';

const EXERCISES = [
  { id: 'weight-lifting', name: 'Weight Lifting', icon: Dumbbell, color: '#E8735C' },
  { id: 'running', name: 'Running', icon: Footprints, color: '#F2A65A' },
  { id: 'cycling', name: 'Cycling', icon: Bike, color: '#5B8DEF' },
  { id: 'walking', name: 'Walking', icon: Footprints, color: '#7FB77E' },
  { id: 'swimming', name: 'Swimming', icon: Waves, color: '#5B8DEF' },
  { id: 'yoga', name: 'Yoga', icon: Flower2, color: '#C085FC' },
  { id: 'hiit', name: 'HIIT', icon: Zap, color: '#E8735C' },
];

function ExerciseCard({ exercise }: { exercise: typeof EXERCISES[0] }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, { width: '48%', marginBottom: 12 }]}>
      <Pressable
        onPress={() => {
          hapticLight();
          scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
          setTimeout(() => { scale.value = withSpring(1); }, 100);
          router.push(`/exercise/${exercise.id}`);
        }}
        accessibilityLabel={`Exercise: ${exercise.name}`}
        testID={`exercise-${exercise.id}`}
        style={{
          backgroundColor: colors.surface, borderRadius: 20, padding: 20,
          borderWidth: 1, borderColor: colors.border, alignItems: 'center',
        }}
      >
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: `${exercise.color}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <exercise.icon size={28} color={exercise.color} />
        </View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{exercise.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function ExerciseIndexScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" testID="exercise-back" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>Log Exercise</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 15, color: colors.textSecondary, marginBottom: 20 }}>Choose your workout type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {EXERCISES.map(e => <ExerciseCard key={e.id} exercise={e} />)}
        </View>
      </ScrollView>
    </View>
  );
}
