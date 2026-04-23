'use client';
// Web stub: premium-feel Drawer with iOS-style spring slide, blur backdrop,
// edge-swipe-to-close gesture, and proper close-animation choreography.
//
// Public API is IDENTICAL to the prior stub:
//   Drawer, DrawerBackdrop, DrawerContent, DrawerCloseButton,
//   DrawerHeader, DrawerBody, DrawerFooter
// Same props (isOpen, onClose, size, anchor, className, children).
//
// Motion strategy:
//   • Mount-on-open, stay-mounted-during-close: we keep the drawer in the
//     DOM for the 300ms close animation so the slide-out is visible, then
//     unmount. This uses a local isExiting state driven by isOpen changes.
//   • Transform + opacity are GPU-composited; the drawer panel uses
//     translateX/translateY + the injected --nova8-ease-ios curve for a
//     calibrated iOS feel.
//   • Edge swipe: pointer-drag on the panel itself; if the user drags the
//     panel past a distance threshold OR with enough velocity toward the
//     closed side, we call onClose. Otherwise we snap back to 0.
//
// Gesture safety:
//   • Only primary pointers are tracked (mouse left button / first finger).
//   • `touch-action` CSS keeps vertical scroll inside the drawer working —
//     we only commandeer the axis we need (horizontal for left/right,
//     vertical for top/bottom anchors).
//   • If pointer events misbehave on a weird browser, backdrop-tap-to-close
//     still works unconditionally.

import React from 'react';
import { usePointerDrag } from '../_hooks/use-pointer-drag.web';

type DrawerAnchor = 'left' | 'right' | 'top' | 'bottom';
type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

type IDrawerProps = {
  isOpen?: boolean;
  onClose?: () => void;
  size?: DrawerSize;
  anchor?: DrawerAnchor;
  className?: string;
  children?: React.ReactNode;
} & React.ComponentPropsWithoutRef<'div'>;

interface DrawerContextValue {
  onClose?: () => void;
  size: DrawerSize;
  anchor: DrawerAnchor;
  isExiting: boolean;
}
const DrawerContext = React.createContext<DrawerContextValue>({
  size: 'sm',
  anchor: 'left',
  isExiting: false,
});

const EXIT_DURATION_MS = 300;

const Drawer = React.forwardRef<HTMLDivElement, IDrawerProps>(function Drawer(
  { isOpen, onClose, size = 'sm', anchor = 'left', className, children, ...props },
  ref,
) {
  // Mount/unmount lifecycle with exit animation:
  //   isOpen=true  → mount immediately, isExiting=false
  //   isOpen=false → keep mounted, set isExiting=true, then unmount after duration
  const [mounted, setMounted] = React.useState(!!isOpen);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setIsExiting(false);
    } else if (mounted) {
      setIsExiting(true);
      const id = setTimeout(() => {
        setMounted(false);
        setIsExiting(false);
      }, EXIT_DURATION_MS);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return (
    <DrawerContext.Provider value={{ onClose, size, anchor, isExiting }}>
      <div
        ref={ref}
        className={`fixed inset-0 z-50 flex web:pointer-events-auto nova8-anim ${className ?? ''}`}
        data-state={isExiting ? 'closed' : 'open'}
        {...props}
      >
        {children}
      </div>
    </DrawerContext.Provider>
  );
});
Drawer.displayName = 'Drawer';

const DrawerBackdrop = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function DrawerBackdrop({ className, onClick, style, ...props }, ref) {
    const { onClose, isExiting } = React.useContext(DrawerContext);
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={`absolute inset-0 bg-black/40 nova8-blur-backdrop ${className ?? ''}`}
        style={{
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: isExiting ? 0 : 1,
          animation: isExiting
            ? undefined
            : `nova8-fade-in ${EXIT_DURATION_MS}ms var(--nova8-ease-standard) both`,
          transition: `opacity ${EXIT_DURATION_MS}ms var(--nova8-ease-standard)`,
          ...style,
        }}
        onClick={(e) => {
          onClick?.(e);
          onClose?.();
        }}
        {...props}
      />
    );
  },
);
DrawerBackdrop.displayName = 'DrawerBackdrop';

const SIZE_CLASS: Record<DrawerAnchor, Record<DrawerSize, string>> = {
  left: { sm: 'w-64', md: 'w-80', lg: 'w-96', full: 'w-full' },
  right: { sm: 'w-64', md: 'w-80', lg: 'w-96', full: 'w-full' },
  top: { sm: 'h-1/4', md: 'h-1/3', lg: 'h-1/2', full: 'h-full' },
  bottom: { sm: 'h-1/4', md: 'h-1/3', lg: 'h-1/2', full: 'h-full' },
};

const POS_CLASS: Record<DrawerAnchor, string> = {
  left: 'absolute left-0 top-0 bottom-0 h-full',
  right: 'absolute right-0 top-0 bottom-0 h-full ml-auto',
  top: 'absolute top-0 left-0 right-0 w-full',
  bottom: 'absolute bottom-0 left-0 right-0 w-full mt-auto',
};

// Maps each anchor to the keyframe name for enter/exit + the drag axis +
// the sign that means "closing" (user pulling the drawer off-screen).
const ANCHOR_MOTION: Record<
  DrawerAnchor,
  { enter: string; axis: 'x' | 'y'; closingSign: -1 | 1 }
> = {
  left: { enter: 'nova8-slide-in-left', axis: 'x', closingSign: -1 },
  right: { enter: 'nova8-slide-in-right', axis: 'x', closingSign: 1 },
  top: { enter: 'nova8-slide-in-top', axis: 'y', closingSign: -1 }, // slides in from above
  bottom: { enter: 'nova8-slide-up', axis: 'y', closingSign: 1 },
};

// Thresholds for close-on-swipe. Feel-tuned to match iOS Mail/Safari drawer.
const CLOSE_DISTANCE_PX = 60;
const CLOSE_VELOCITY_PX_PER_SEC = 350;

const DrawerContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function DrawerContent({ className, style, ...props }, ref) {
    const { size, anchor, onClose, isExiting } = React.useContext(DrawerContext);
    const motion = ANCHOR_MOTION[anchor];
    const sizeClass = SIZE_CLASS[anchor][size];
    const posClass = POS_CLASS[anchor];

    // Pointer-drag: only allow dragging toward the closed side. Clamp the
    // opposite direction so the user cannot pull the drawer past its open
    // edge (nice tactile feel).
    const clamp = motion.closingSign === -1
      ? { minDelta: -400, maxDelta: 0 }
      : { minDelta: 0, maxDelta: 400 };

    const drag = usePointerDrag({
      axis: motion.axis,
      minDelta: clamp.minDelta,
      maxDelta: clamp.maxDelta,
      onEnd: ({ delta, velocity }) => {
        const pastDistance = Math.abs(delta) >= CLOSE_DISTANCE_PX;
        const closing =
          motion.closingSign === -1
            ? velocity <= -CLOSE_VELOCITY_PX_PER_SEC
            : velocity >= CLOSE_VELOCITY_PX_PER_SEC;
        if (pastDistance || closing) onClose?.();
      },
    });

    // Live transform during drag; during exit, rely on CSS animation.
    const dragAxis = motion.axis === 'x' ? 'X' : 'Y';
    const liveTransform = drag.isDragging && drag.delta !== 0
      ? `translate${dragAxis}(${drag.delta}px)`
      : undefined;

    return (
      <div
        ref={ref}
        className={`relative z-10 ${posClass} ${sizeClass} bg-background-0 p-6 flex flex-col ${className ?? ''}`}
        style={{
          animation: isExiting
            ? undefined // exit handled by transform below
            : `${motion.enter} var(--nova8-duration-medium) var(--nova8-ease-ios) both`,
          transform: isExiting
            ? motion.axis === 'x'
              ? `translateX(${motion.closingSign * 110}%)`
              : `translateY(${motion.closingSign * 110}%)`
            : liveTransform,
          transition: isExiting
            ? `transform ${EXIT_DURATION_MS}ms var(--nova8-ease-ios)`
            : drag.isDragging
            ? undefined // follow finger 1:1 while dragging
            : `transform 220ms var(--nova8-ease-ios)`, // snap-back when released without close
          boxShadow: 'var(--nova8-shadow-overlay)',
          touchAction: motion.axis === 'x' ? 'pan-y' : 'pan-x',
          ...style,
        }}
        {...drag.handlers}
        {...props}
      />
    );
  },
);
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function DrawerHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`flex flex-row items-center justify-between mb-4 ${className ?? ''}`}
        {...props}
      />
    );
  },
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerBody = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function DrawerBody({ className, ...props }, ref) {
    return <div ref={ref} className={`flex-1 ${className ?? ''}`} {...props} />;
  },
);
DrawerBody.displayName = 'DrawerBody';

const DrawerFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function DrawerFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`flex flex-row items-center justify-end gap-2 mt-4 ${className ?? ''}`}
        {...props}
      />
    );
  },
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerCloseButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'> & { onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void }
>(function DrawerCloseButton({ className, onClick, onPress, children, ...props }, ref) {
  const { onClose } = React.useContext(DrawerContext);
  return (
    <button
      ref={ref}
      type="button"
      className={`nova8-press p-1 rounded hover:bg-background-100 ${className ?? ''}`}
      onClick={(e) => {
        onPress?.(e);
        onClick?.(e);
        onClose?.();
      }}
      {...props}
    >
      {children ?? '×'}
    </button>
  );
});
DrawerCloseButton.displayName = 'DrawerCloseButton';

export {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
};
