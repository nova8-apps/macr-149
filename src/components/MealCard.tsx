import React from 'react';
import { View, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Flame, Trash2 } from 'lucide-react-native';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';
import type { Meal } from '@/types';

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
  onDelete?: () => void;
}

export function MealCard({ meal, onPress, onDelete }: MealCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const timeStr = React.useMemo(() => {
    const d = new Date(meal.eatenAt);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }, [meal.eatenAt]);

  return (
    <Animated.View style={animStyle}>
      <Pressable
        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => { hapticLight(); onPress?.(); }}
        accessibilityLabel={`Meal: ${meal.name}`}
        testID={`meal-card-${meal.id}`}
      >
        {meal.photoUrl ? (
          <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: colors.surfaceElevated, marginRight: 12, overflow: 'hidden' }}>
            <Animated.Image source={{ uri: meal.photoUrl }} style={{ width: 56, height: 56 }} />
          </View>
        ) : (
          <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: colors.surfaceElevated, marginRight: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Flame size={24} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }} numberOfLines={1}>{meal.name}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{timeStr}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            <View style={{ backgroundColor: `${colors.protein}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.protein }}>P {meal.proteinG}g</Text>
            </View>
            <View style={{ backgroundColor: `${colors.carbs}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.carbs }}>C {meal.carbsG}g</Text>
            </View>
            <View style={{ backgroundColor: `${colors.fat}18`, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.fat }}>F {meal.fatG}g</Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Flame size={14} color={colors.primary} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>{meal.totalCalories}</Text>
          </View>
          <Text style={{ fontSize: 11, color: colors.textSecondary }}>kcal</Text>
          {onDelete && (
            <Pressable
              style={{ marginTop: 6 }}
              onPress={() => { hapticLight(); onDelete(); }}
              accessibilityLabel={`Delete meal ${meal.name}`}
              testID={`delete-meal-${meal.id}`}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Trash2 size={18} color="#E05555" />
            </Pressable>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
