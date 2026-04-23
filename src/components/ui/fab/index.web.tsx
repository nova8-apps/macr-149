'use client';
// Web stub: premium-feel FAB that skips gluestack internals (createFab +
// withStyleContext) and produces a clean react-native Pressable with an
// iOS-style 4-layer elevation shadow and a press-scale feedback.
//
// Public API is compatible with the prior native Fab:
//   <Fab>, <FabLabel>, <FabIcon>
// Same key props: size (sm/md/lg), placement ('top right' | 'top left' |
// 'bottom right' | 'bottom left' | 'top center' | 'bottom center'),
// className. Props not in the shortlist are forwarded through.

import React from 'react';
import { Pressable, Text } from 'react-native';

type FabSize = 'sm' | 'md' | 'lg';
type FabPlacement =
  | 'top right'
  | 'top left'
  | 'bottom right'
  | 'bottom left'
  | 'top center'
  | 'bottom center';

const SIZE_CLASS: Record<FabSize, string> = {
  sm: 'px-2.5 py-2.5',
  md: 'px-3 py-3',
  lg: 'px-4 py-4',
};

const PLACEMENT_CLASS: Record<FabPlacement, string> = {
  'top right': 'top-4 right-4',
  'top left': 'top-4 left-4',
  'bottom right': 'bottom-4 right-4',
  'bottom left': 'bottom-4 left-4',
  'top center': 'top-4 self-center',
  'bottom center': 'bottom-4 self-center',
};

const FabSizeContext = React.createContext<FabSize>('md');

type IFabProps = React.ComponentProps<typeof Pressable> & {
  size?: FabSize;
  placement?: FabPlacement;
  className?: string;
  children?: React.ReactNode;
};

const Fab = React.forwardRef<React.ComponentRef<typeof Pressable>, IFabProps>(
  function Fab(
    { size = 'md', placement = 'bottom right', className, children, ...props },
    ref,
  ) {
    const sizeClass = SIZE_CLASS[size];
    const placementClass = PLACEMENT_CLASS[placement];
    // nova8-press-scale (from provider CSS) handles opacity + scale 0.96 on
    // active. We still use react-native's Pressable to preserve the full
    // gesture API (onPress, onLongPress, etc.).
    const merged =
      `nova8-press-scale group/fab bg-background-950 rounded-full z-20 flex-row items-center justify-center absolute ${sizeClass} ${placementClass} ${className ?? ''}`.trim();
    return (
      <FabSizeContext.Provider value={size}>
        <Pressable
          ref={ref}
          className={merged}
          style={{
            // iOS 4-layer elevation shadow (heavier than the overlay shadow
            // because a FAB sits above everything and needs to read clearly).
            boxShadow: 'var(--nova8-shadow-overlay)',
          } as React.CSSProperties}
          {...props}
        >
          {children}
        </Pressable>
      </FabSizeContext.Provider>
    );
  },
);
Fab.displayName = 'Fab';

type IFabLabelProps = React.ComponentProps<typeof Text> & {
  size?: FabSize;
  className?: string;
};

const FabLabel = React.forwardRef<
  React.ComponentRef<typeof Text>,
  IFabLabelProps
>(function FabLabel({ size, className, ...props }, ref) {
  const parentSize = React.useContext(FabSizeContext);
  const effective = size ?? parentSize;
  const textSizeClass =
    effective === 'sm' ? 'text-sm' : effective === 'lg' ? 'text-lg' : 'text-base';
  const merged =
    `text-typography-50 font-normal mx-2 ${textSizeClass} ${className ?? ''}`.trim();
  return <Text ref={ref} className={merged} {...props} />;
});
FabLabel.displayName = 'FabLabel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IFabIconProps = React.ComponentProps<any> & {
  size?: FabSize | number;
  className?: string;
  height?: number;
  width?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  as?: React.ComponentType<any>;
};

// The native Fab used the gluestack Icon primitive; on web we render the
// consumer-provided Icon (via `as`) directly, or fall back to a span that
// accepts children. This covers lucide-react-native icons (common in
// generated apps) since they render SVGs cross-platform.
const FabIcon = React.forwardRef<HTMLElement, IFabIconProps>(function FabIcon(
  { size, className, height, width, as: Component, children, ...props },
  ref,
) {
  const parentSize = React.useContext(FabSizeContext);
  const effective = typeof size === 'number' ? undefined : size ?? parentSize;
  const sizeClass =
    effective === 'sm'
      ? 'h-4 w-4'
      : effective === 'lg'
      ? 'h-5 w-5'
      : 'w-[18px] h-[18px]';

  const merged = `text-typography-50 fill-none ${sizeClass} ${className ?? ''}`.trim();

  if (Component) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Comp: any = Component;
    return (
      <Comp
        ref={ref}
        className={merged}
        size={typeof size === 'number' ? size : undefined}
        height={height}
        width={width}
        {...props}
      />
    );
  }
  return (
    <span
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={merged}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
    >
      {children}
    </span>
  );
});
FabIcon.displayName = 'FabIcon';

export { Fab, FabLabel, FabIcon };
