// Shared pointer-drag hook for web overlay stubs (Drawer edge-swipe,
// Actionsheet drag-to-dismiss, BottomSheet pull-down, etc.). Pure React +
// Pointer Events — works on mouse, touch, and stylus without a gesture lib.
//
// Usage:
//   const drag = usePointerDrag({
//     axis: 'x',          // 'x' | 'y' — which axis to track
//     onEnd: ({ delta, velocity }) => {
//       if (delta < -50 && velocity < -0.4) onClose();
//     },
//   });
//   <div {...drag.handlers} style={{ transform: `translateX(${drag.delta}px)` }} />
//
// Design notes:
//   • Tracks delta from the initial pointer-down position (not the element's
//     current transform). Lets consumers apply the delta as a live transform.
//   • Velocity is computed as (lastDelta - prevDelta) / elapsedMs * 1000 in
//     px/sec; sign matches axis direction.
//   • Clamps are opt-in via minDelta / maxDelta so consumers can e.g. only
//     allow drag in one direction (iOS sheets only drag down).
//   • Captures pointer so drag continues even if the finger leaves the
//     element — matches native gesture behavior.

import React from 'react';

export type Axis = 'x' | 'y';

export interface PointerDragEndInfo {
  delta: number;       // final delta in px (signed)
  velocity: number;    // px/sec (signed)
  duration: number;    // ms from pointerdown to pointerup
}

export interface UsePointerDragOptions {
  axis?: Axis;
  minDelta?: number;   // clamp: delta will not go below this
  maxDelta?: number;   // clamp: delta will not go above this
  disabled?: boolean;
  // Minimum pixels the pointer must move before we consider this a drag.
  // Below this threshold, the pointer stream is passed through to the browser
  // so clicks on nested buttons/links still fire. Default 8px.
  activationThreshold?: number;
  onStart?: () => void;
  onMove?: (delta: number) => void;
  onEnd?: (info: PointerDragEndInfo) => void;
}

export interface UsePointerDragResult {
  delta: number;
  isDragging: boolean;
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

export function usePointerDrag({
  axis = 'y',
  minDelta = -Infinity,
  maxDelta = Infinity,
  disabled = false,
  activationThreshold = 8,
  onStart,
  onMove,
  onEnd,
}: UsePointerDragOptions = {}): UsePointerDragResult {
  const [delta, setDelta] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);

  // Refs keep transient tracking state without causing re-renders.
  const startRef = React.useRef({ x: 0, y: 0, t: 0 });
  const lastRef = React.useRef({ delta: 0, t: 0 });
  const velocityRef = React.useRef(0);
  const activePointerRef = React.useRef<number | null>(null);
  // Tracks whether we've crossed the activation threshold. Until we do,
  // pointer events pass through so nested buttons/links still fire their
  // click handlers. Once crossed, we acquire pointer capture to steal the
  // stream for drag tracking.
  const activatedRef = React.useRef(false);
  const trackingRef = React.useRef(false);

  const clamp = React.useCallback(
    (v: number) => Math.max(minDelta, Math.min(maxDelta, v)),
    [minDelta, maxDelta],
  );

  const handlers = React.useMemo(
    () => ({
      onPointerDown: (e: React.PointerEvent) => {
        if (disabled) return;
        // Only handle primary pointer (mouse left button / first finger).
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        // Do NOT setPointerCapture yet — doing so at pointerdown steals the
        // click from nested interactive descendants (buttons, links). We wait
        // until the pointer moves past activationThreshold before capturing.
        activePointerRef.current = e.pointerId;
        const now = performance.now();
        startRef.current = { x: e.clientX, y: e.clientY, t: now };
        lastRef.current = { delta: 0, t: now };
        velocityRef.current = 0;
        activatedRef.current = false;
        trackingRef.current = true;
        setDelta(0);
        // isDragging stays false until activation — callers that gate work
        // on isDragging (e.g. suppressing click) won't fire for taps.
      },
      onPointerMove: (e: React.PointerEvent) => {
        if (!trackingRef.current || activePointerRef.current !== e.pointerId) return;
        const raw = axis === 'x'
          ? e.clientX - startRef.current.x
          : e.clientY - startRef.current.y;
        // Lazy activation: only acquire pointer capture once the user has
        // moved enough to indicate drag intent. This preserves click-through
        // for nested interactive elements (e.g. ActionsheetItem buttons).
        if (!activatedRef.current) {
          if (Math.abs(raw) < activationThreshold) return;
          activatedRef.current = true;
          try {
            (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
          } catch { /* element detached — ignore */ }
          setIsDragging(true);
          onStart?.();
        }
        const next = clamp(raw);
        const now = performance.now();
        const dt = Math.max(1, now - lastRef.current.t);
        velocityRef.current = ((next - lastRef.current.delta) / dt) * 1000;
        lastRef.current = { delta: next, t: now };
        setDelta(next);
        onMove?.(next);
      },
      onPointerUp: (e: React.PointerEvent) => {
        if (activePointerRef.current !== e.pointerId) return;
        const wasActive = activatedRef.current;
        if (wasActive) {
          try {
            (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
          } catch { /* ignore */ }
        }
        const info: PointerDragEndInfo = {
          delta: lastRef.current.delta,
          velocity: velocityRef.current,
          duration: performance.now() - startRef.current.t,
        };
        activePointerRef.current = null;
        trackingRef.current = false;
        activatedRef.current = false;
        setIsDragging(false);
        setDelta(0);
        // Only fire onEnd if a real drag occurred — taps that never crossed
        // the activation threshold should be allowed to propagate as clicks
        // to nested elements, not trigger drag-end side effects.
        if (wasActive) onEnd?.(info);
      },
      onPointerCancel: (e: React.PointerEvent) => {
        if (activePointerRef.current !== e.pointerId) return;
        if (activatedRef.current) {
          try {
            (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
          } catch { /* ignore */ }
        }
        activePointerRef.current = null;
        trackingRef.current = false;
        activatedRef.current = false;
        setIsDragging(false);
        setDelta(0);
      },
    }),
    [axis, clamp, disabled, activationThreshold, onEnd, onMove, onStart],
  );

  return { delta, isDragging, handlers };
}
