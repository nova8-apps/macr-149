'use client';
// Web stub: preserves the react-native Pressable API (onPress, onLongPress,
// hitSlop, etc.) via react-native-web, but layers on the nova8 shared press-
// feedback class so every press target in generated apps gets the iOS-style
// opacity dim without any generated-code changes.
//
// We intentionally do NOT route through createPressable / withStyleContext
// (the gluestack kit internals) here — those pull in native-only utilities
// that can trip cross-platform stub chains. The public surface is identical:
// same props, same ref type, same forwardRef signature.

import React from 'react';
import { Pressable as RNPressable } from 'react-native';

type IPressableProps = React.ComponentProps<typeof RNPressable> & {
  className?: string;
};

const Pressable = React.forwardRef<
  React.ComponentRef<typeof RNPressable>,
  IPressableProps
>(function Pressable({ className, ...props }, ref) {
  // Merge our press-feedback class with any caller-supplied className.
  // The `nova8-press` class is defined by GluestackUIProvider's injected
  // CSS and provides opacity:0.72 on :active via CSS-only (zero JS cost).
  const merged = className
    ? `nova8-press ${className}`
    : 'nova8-press';
  return <RNPressable ref={ref} className={merged} {...props} />;
});

Pressable.displayName = 'Pressable';
export { Pressable };
