import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroRingProps {
  label: string;
  consumed: number;
  total: number;
  color: string;
  size?: number;
  // Wave 23.35.4 — same loading-state treatment as CalorieRing.
  loading?: boolean;
}

export function MacroRing({ label, consumed, total, color, size = 80, loading = false }: MacroRingProps) {
  const strokeWidth = 6;
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
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`${color}20`}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: loading ? colors.textSecondary : colors.textPrimary }}>
            {loading ? '—' : remaining}
          </Text>
          <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: -2 }}>{loading ? '…' : 'g left'}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 6 }}>{label}</Text>
    </View>
  );
}
