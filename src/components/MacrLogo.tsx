import React from 'react';
import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';

type MacrLogoProps = {
  size?: 'md' | 'lg';
};

export function MacrLogo({ size = 'md' }: MacrLogoProps) {
  const isLarge = size === 'lg';
  const iconSize = isLarge ? 80 : 56;
  const iconRadius = isLarge ? 20 : 14;
  const mFontSize = isLarge ? 44 : 31;
  const wordmarkFontSize = isLarge ? 32 : 22;
  const wordmarkMarginTop = isLarge ? 8 : 6;

  return (
    <View style={{ alignItems: 'center' }}>
      <Image
        source={require('../../assets/icon.png')}
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: iconRadius,
        }}
        resizeMode="contain"
      />
      {/* Remove if logo image already includes the wordmark */}
      <Text
        style={{
          fontSize: wordmarkFontSize,
          fontWeight: '700',
          color: '#1E1612',
          marginTop: wordmarkMarginTop,
        }}
      >
        MACR
      </Text>
    </View>
  );
}
