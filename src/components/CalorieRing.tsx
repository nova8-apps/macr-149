import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { Skeleton } from '@/components/ui/skeleton';
import { colors } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieRingProps {
  consumed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  // Wave 23.35.4 — when the user's goals haven't loaded yet, render a
  // neutral placeholder (“—”) instead of a misleading default like 0 or
  // 2000. The ring itself stays empty until real data arrives.
  loading?: boolean;
}

export function CalorieRing({ consumed, total, size = 200, strokeWidth = 14, showLabel = true, loading = false }: CalorieRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(consumed / Math.max(total, 1), 1);
  const remaining = Math.max(0, total - consumed);

  const animatedProgress = useSharedValue(0);

  React.useEffect(() => {
    animatedProgress.value = withSpring(progress, { damping: 20, stiffness: 80 });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.carbs} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#calorieGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      {showLabel && (
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          {loading ? (
            <View style={{ width: 200, height: 200, borderRadius: 100, overflow: 'hidden' }}>
              <Skeleton variant="circular" speed={2} />
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 40, fontWeight: '800', color: colors.textPrimary, letterSpacing: -1.5 }}>
                {remaining}
              </Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: -4 }}>
                Calories left
              </Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}
