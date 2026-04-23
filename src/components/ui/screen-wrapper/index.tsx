'use client';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenWrapperProps {
  children: React.ReactNode;
  /** Set to false for fixed-layout screens (camera, map, single modal). Default: true */
  scrollable?: boolean;
  /** Add bottom padding for tab bar clearance. Default: true */
  padBottom?: boolean;
  /** Additional className for the root container */
  className?: string;
}

export function ScreenWrapper({
  children,
  scrollable = true,
  padBottom = true,
  className,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  if (scrollable) {
    return (
      <ScrollView
        className={`flex-1 bg-gray-50 dark:bg-gray-950 ${className ?? ''}`}
        contentContainerStyle={{
          paddingBottom: padBottom ? insets.bottom + 100 : insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={true}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={`flex-1 bg-gray-50 dark:bg-gray-950 ${className ?? ''}`}>
      {children}
    </View>
  );
}
