import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors } from '@/lib/theme';

interface StreakPillProps {
  count: number;
}

export function StreakPill({ count }: StreakPillProps) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${colors.primary}15`,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      gap: 4,
    }}>
      <Text style={{ fontSize: 16 }}>🔥</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>{count}</Text>
    </View>
  );
}
