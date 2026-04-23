'use client';
import React from 'react';

type SafeAreaViewProps = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
};

const SafeAreaView = React.forwardRef<HTMLDivElement, SafeAreaViewProps>(
  function SafeAreaView({ style, ...props }, ref) {
    return (
      <div
        ref={ref}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
          ...(typeof style === 'object' ? style : {}),
        }}
        {...props}
      />
    );
  }
);

SafeAreaView.displayName = 'SafeAreaView';

export { SafeAreaView };
