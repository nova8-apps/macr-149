import React, { useState, useMemo } from 'react';
import { View, Pressable, ScrollView, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui/text';
import { ArrowLeft, Dumbbell, Footprints, Bike, Waves, Flower2, Zap } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { useMe, useCreateExercise } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';

const EXERCISE_DATA: Record<string, { name: string; icon: any; met: number; color: string }> = {
  'weight-lifting': { name: 'Weight Lifting', icon: Dumbbell, met: 6.0, color: '#E8735C' },
  'running': { name: 'Running', icon: Footprints, met: 9.8, color: '#F2A65A' },
  'cycling': { name: 'Cycling', icon: Bike, met: 7.5, color: '#5B8DEF' },
  'walking': { name: 'Walking', icon: Footprints, met: 3.8, color: '#7FB77E' },
  'swimming': { name: 'Swimming', icon: Waves, met: 8.0, color: '#5B8DEF' },
  'yoga': { name: 'Yoga', icon: Flower2, met: 3.0, color: '#C085FC' },
  'hiit': { name: 'HIIT', icon: Zap, met: 12.0, color: '#E8735C' },
};

const INTENSITIES = [
  { id: 'high' as const, label: 'High', desc: 'All-out effort, max heart rate', multiplier: 1.3 },
  { id: 'medium' as const, label: 'Medium', desc: 'Moderate effort, steady pace', multiplier: 1.0 },
  { id: 'low' as const, label: 'Low', desc: 'Light effort, comfortable pace', multiplier: 0.7 },
];

const DURATIONS = [15, 30, 45, 60, 90];

export default function ExerciseDetailScreen() {
  const { type = 'weight-lifting' } = useLocalSearchParams<{ type: string }>();
  const exerciseInfo = EXERCISE_DATA[type] || EXERCISE_DATA['weight-lifting'];
  const IconComp = exerciseInfo.icon;

  const [intensity, setIntensity] = useState<'high' | 'medium' | 'low'>('medium');
  const [duration, setDuration] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const { data: meData } = useMe();
  const createExerciseMutation = useCreateExercise();
  const goals = meData?.goals;

  const actualDuration = customDuration ? parseInt(customDuration) || duration : duration;
  const weightKg = goals?.currentWeightKg ?? 75;

  const caloriesBurned = useMemo(() => {
    const intensityMult = INTENSITIES.find(i => i.id === intensity)?.multiplier ?? 1;
    return Math.round(exerciseInfo.met * intensityMult * weightKg * (actualDuration / 60));
  }, [intensity, actualDuration, weightKg, exerciseInfo.met]);

  const handleSave = async () => {
    setLoading(true);
    hapticMedium();

    createExerciseMutation.mutate(
      {
        type: exerciseInfo.name,
        intensity,
        durationMin: actualDuration,
        caloriesBurned,
        loggedAt: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          hapticSuccess();
          setLoading(false);
          router.replace('/(tabs)/home');
        },
        onError: () => {
          setLoading(false);
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" testID="exercise-detail-back" style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconComp size={22} color={exerciseInfo.color} />
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>{exerciseInfo.name}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Calories Preview */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 42, fontWeight: '800', color: exerciseInfo.color, letterSpacing: -1.5 }}>{caloriesBurned}</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>estimated calories burned</Text>
        </View>

        {/* Intensity */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>Intensity</Text>
        {INTENSITIES.map(i => (
          <Pressable
            key={i.id}
            onPress={() => { hapticLight(); setIntensity(i.id); }}
            accessibilityLabel={`Intensity: ${i.label}`}
            testID={`intensity-${i.id}`}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: intensity === i.id ? `${exerciseInfo.color}12` : colors.surface,
              borderRadius: 16, padding: 16, marginBottom: 8,
              borderWidth: 1.5, borderColor: intensity === i.id ? exerciseInfo.color : colors.border,
            }}
          >
            <View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{i.label}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{i.desc}</Text>
            </View>
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: intensity === i.id ? exerciseInfo.color : colors.border, alignItems: 'center', justifyContent: 'center' }}>
              {intensity === i.id && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: exerciseInfo.color }} />}
            </View>
          </Pressable>
        ))}

        {/* Duration */}
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 20, marginBottom: 12 }}>Duration (minutes)</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {DURATIONS.map(d => (
            <Pressable
              key={d}
              onPress={() => { hapticLight(); setDuration(d); setCustomDuration(''); }}
              accessibilityLabel={`${d} minutes`}
              testID={`duration-${d}`}
              style={{
                paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14,
                backgroundColor: duration === d && !customDuration ? exerciseInfo.color : colors.surface,
                borderWidth: 1, borderColor: duration === d && !customDuration ? exerciseInfo.color : colors.border,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: duration === d && !customDuration ? '#fff' : colors.textPrimary }}>{d}</Text>
            </Pressable>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: customDuration ? exerciseInfo.color : colors.border, paddingHorizontal: 14 }}>
            <TextInput
              value={customDuration}
              onChangeText={setCustomDuration}
              placeholder="Custom"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              style={{ fontSize: 15, color: colors.textPrimary, paddingVertical: 12, width: 70 }}
              accessibilityLabel="Custom duration"
              testID="custom-duration"
            />
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.bg, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36, borderTopWidth: 1, borderTopColor: colors.border }}>
        <PillButton title="Log Exercise" onPress={handleSave} variant="dark" loading={loading} fullWidth />
      </View>
    </View>
  );
}
