import React from 'react';
import { Pressable, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme';
import { hapticLight } from '@/lib/haptics';

interface PillButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'dark' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function PillButton({ title, onPress, variant = 'primary', disabled = false, loading = false, fullWidth = false, icon }: PillButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const bgColor = variant === 'primary' ? colors.primary : variant === 'dark' ? colors.textPrimary : 'transparent';
  const textColor = variant === 'outline' ? colors.textPrimary : '#fff';
  const borderColor = variant === 'outline' ? colors.border : 'transparent';

  return (
    <Animated.View style={[animStyle, fullWidth ? { width: '100%' } : {}]}>
      <Pressable
        onPress={() => { hapticLight(); onPress(); }}
        onPressIn={() => { scale.value = withSpring(0.95, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        disabled={disabled || loading}
        accessibilityLabel={title}
        testID={`pill-btn-${title.toLowerCase().replace(/\s+/g, '-')}`}
        style={{
          backgroundColor: disabled ? '#ccc' : bgColor,
          borderRadius: 999,
          paddingVertical: 16,
          paddingHorizontal: 32,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <>
            {icon}
            <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
