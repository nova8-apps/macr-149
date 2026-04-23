'use client';
// Web stub: premium-feel Actionsheet with iOS-style spring slide-up,
// drag-to-dismiss, safe-area padding, and grouped-list chrome.
//
// Public API is IDENTICAL to the prior stub:
//   Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetItem,
//   ActionsheetItemText, ActionsheetDragIndicator,
//   ActionsheetDragIndicatorWrapper, ActionsheetScrollView,
//   ActionsheetVirtualizedList, ActionsheetFlatList, ActionsheetSectionList,
//   ActionsheetSectionHeaderText, ActionsheetIcon
// Same props: isOpen, onClose, snapPoints, closeOnOverlayClick, className, children.
//
// Motion strategy:
//   • Mount-on-open, stay-mounted-during-close: 340ms exit (actionsheets feel
//     slightly slower than modals — matches iOS UIAlertController).
//   • Sheet uses nova8-slide-up on enter with the iOS ease curve.
//   • Backdrop: 8px blur + dim. Lighter than Modal (20px) because the sheet
//     sits at the bottom and fills enough of the screen that heavy blur
//     behind it mostly just stresses GPU.
//
// Gesture:
//   • usePointerDrag on the sheet's drag indicator area AND the top chrome.
//   • Downward pan past 80px OR with 400+ px/s velocity → onClose.
//   • During drag, sheet follows finger 1:1. On release-short, snaps back
//     with 240ms spring transition.
//
// Safe-area:
//   • paddingBottom uses env(safe-area-inset-bottom) when available so the
//     sheet's bottom padding respects home-indicator devices.

import React from 'react';
import { usePointerDrag } from '../_hooks/use-pointer-drag.web';

type IActionsheetProps = {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
  snapPoints?: number[];
  closeOnOverlayClick?: boolean;
} & React.ComponentPropsWithoutRef<'div'>;

interface ActionsheetContextValue {
  onClose?: () => void;
  isExiting: boolean;
  closeOnOverlayClick: boolean;
  dragDelta: number;
  isDragging: boolean;
  dragHandlers: React.HTMLAttributes<HTMLElement>;
}
const ActionsheetContext = React.createContext<ActionsheetContextValue>({
  isExiting: false,
  closeOnOverlayClick: true,
  dragDelta: 0,
  isDragging: false,
  dragHandlers: {},
});

const EXIT_DURATION_MS = 340;
const CLOSE_DISTANCE_PX = 80;
const CLOSE_VELOCITY_PX_PER_SEC = 400;

const Actionsheet = React.forwardRef<HTMLDivElement, IActionsheetProps>(function Actionsheet(
  { isOpen, onClose, className, children, closeOnOverlayClick = true, snapPoints: _snapPoints, ...props },
  ref,
) {
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

  // Drag-to-dismiss lives on the top of the sheet (drag indicator + header).
  // We only allow downward drag (positive Y); upward is clamped.
  const drag = usePointerDrag({
    axis: 'y',
    minDelta: 0,
    maxDelta: 800,
    onEnd: ({ delta, velocity }) => {
      if (delta >= CLOSE_DISTANCE_PX || velocity >= CLOSE_VELOCITY_PX_PER_SEC) {
        onClose?.();
      }
    },
  });

  if (!mounted) return null;

  return (
    <ActionsheetContext.Provider
      value={{
        onClose,
        isExiting,
        closeOnOverlayClick,
        dragDelta: drag.delta,
        isDragging: drag.isDragging,
        dragHandlers: drag.handlers as unknown as React.HTMLAttributes<HTMLElement>,
      }}
    >
      <div
        ref={ref}
        className={`fixed inset-0 z-50 flex items-end justify-center web:pointer-events-auto nova8-anim ${className ?? ''}`}
        data-state={isExiting ? 'closed' : 'open'}
        {...props}
      >
        {children}
      </div>
    </ActionsheetContext.Provider>
  );
});
Actionsheet.displayName = 'Actionsheet';

const ActionsheetBackdrop = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ActionsheetBackdrop({ className, onClick, style, ...props }, ref) {
    const { onClose, isExiting, closeOnOverlayClick } = React.useContext(ActionsheetContext);
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={`absolute inset-0 bg-background-dark/50 nova8-blur-backdrop ${className ?? ''}`}
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: isExiting ? 0 : 1,
          animation: isExiting
            ? undefined
            : `nova8-fade-in ${EXIT_DURATION_MS}ms var(--nova8-ease-standard) both`,
          transition: `opacity ${EXIT_DURATION_MS}ms var(--nova8-ease-standard)`,
          ...style,
        }}
        onClick={(e) => {
          onClick?.(e);
          if (closeOnOverlayClick) onClose?.();
        }}
        {...props}
      />
    );
  },
);
ActionsheetBackdrop.displayName = 'ActionsheetBackdrop';

const ActionsheetContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ActionsheetContent({ className, style, ...props }, ref) {
    const { isExiting, dragDelta, isDragging, dragHandlers } = React.useContext(ActionsheetContext);
    // Live transform during drag; on exit, translate fully off screen.
    const liveTransform =
      isDragging && dragDelta > 0 ? `translateY(${dragDelta}px)` : undefined;
    return (
      <div
        ref={ref}
        className={`relative z-10 w-full max-w-2xl bg-background-0 rounded-t-2xl p-4 flex flex-col ${className ?? ''}`}
        style={{
          animation: isExiting
            ? undefined
            : `nova8-slide-up var(--nova8-duration-slow) var(--nova8-ease-ios) both`,
          transform: isExiting ? 'translateY(110%)' : liveTransform,
          transition: isExiting
            ? `transform ${EXIT_DURATION_MS}ms var(--nova8-ease-ios)`
            : isDragging
            ? undefined
            : `transform 240ms var(--nova8-ease-ios)`,
          boxShadow: 'var(--nova8-shadow-overlay)',
          // Home-indicator safe area: 8px base + env bottom-inset
          paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))',
          // Drag-to-dismiss is initiated from top chrome; vertical scroll
          // inside the sheet still works thanks to ActionsheetScrollView.
          touchAction: 'pan-x',
          ...style,
        }}
        {...dragHandlers}
        {...props}
      />
    );
  },
);
ActionsheetContent.displayName = 'ActionsheetContent';

type ActionsheetItemProps = React.ComponentPropsWithoutRef<'button'> & {
  // React-Native-style callback — generated code typically passes onPress, not onClick.
  // Without this explicit shim, onPress would flow through to the DOM <button>, React
  // would log "Unknown event handler property 'onPress'. It will be ignored." and the
  // handler would never fire.
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const ActionsheetItem = React.forwardRef<HTMLButtonElement, ActionsheetItemProps>(
  function ActionsheetItem({ className, onClick, onPress, ...props }, ref) {
    const { onClose } = React.useContext(ActionsheetContext);
    return (
      <button
        ref={ref}
        type="button"
        className={`nova8-press w-full flex flex-row items-center px-4 py-3 rounded-lg hover:bg-background-100 ${className ?? ''}`}
        onClick={(e) => {
          // Fire the user's handler FIRST (accept either onPress or onClick so
          // both React-Native-style and web-style callers work), then close the
          // sheet. Matches iOS UIAlertAction behavior where tapping an action
          // implicitly dismisses the sheet.
          onPress?.(e);
          onClick?.(e);
          onClose?.();
        }}
        {...props}
      />
    );
  },
);
ActionsheetItem.displayName = 'ActionsheetItem';

const ActionsheetItemText = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(function ActionsheetItemText({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      className={`text-typography-900 text-base ${className ?? ''}`}
      {...props}
    />
  );
});
ActionsheetItemText.displayName = 'ActionsheetItemText';

const ActionsheetDragIndicatorWrapper = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function ActionsheetDragIndicatorWrapper({ className, ...props }, ref) {
  // The drag indicator sits above everything inside ActionsheetContent;
  // drag handlers already live on the content, so we just provide the
  // visual affordance here.
  return (
    <div
      ref={ref}
      className={`w-full py-2 flex items-center justify-center cursor-grab active:cursor-grabbing ${className ?? ''}`}
      {...props}
    />
  );
});
ActionsheetDragIndicatorWrapper.displayName = 'ActionsheetDragIndicatorWrapper';

const ActionsheetDragIndicator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function ActionsheetDragIndicator({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={`w-12 h-1 rounded-full bg-background-300 ${className ?? ''}`}
      {...props}
    />
  );
});
ActionsheetDragIndicator.displayName = 'ActionsheetDragIndicator';

const ActionsheetSectionHeaderText = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function ActionsheetSectionHeaderText({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={`px-4 py-2 text-sm font-semibold text-typography-500 uppercase tracking-wide ${className ?? ''}`}
      {...props}
    />
  );
});
ActionsheetSectionHeaderText.displayName = 'ActionsheetSectionHeaderText';

const ActionsheetIcon = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(function ActionsheetIcon({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      className={`inline-flex items-center justify-center mr-2 ${className ?? ''}`}
      {...props}
    />
  );
});
ActionsheetIcon.displayName = 'ActionsheetIcon';

const ActionsheetScrollView = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function ActionsheetScrollView({ className, style, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={`flex-1 overflow-auto ${className ?? ''}`}
      // Vertical scroll inside the sheet; prevent drag-to-dismiss when user
      // is simply scrolling the list.
      style={{ touchAction: 'pan-y', ...style }}
      {...props}
    />
  );
});
ActionsheetScrollView.displayName = 'ActionsheetScrollView';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActionsheetFlatList: React.FC<any> = ({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  className,
  ...props
}) => {
  return (
    <div
      className={`flex-1 overflow-auto ${className ?? ''}`}
      style={{ touchAction: 'pan-y' }}
      {...props}
    >
      {ListHeaderComponent &&
        (typeof ListHeaderComponent === 'function'
          ? <ListHeaderComponent />
          : ListHeaderComponent)}
      {(data ?? []).map((item: unknown, index: number) => (
        <React.Fragment
          key={keyExtractor ? keyExtractor(item, index) : index}
        >
          {renderItem ? renderItem({ item, index }) : null}
        </React.Fragment>
      ))}
      {ListFooterComponent &&
        (typeof ListFooterComponent === 'function'
          ? <ListFooterComponent />
          : ListFooterComponent)}
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ActionsheetSectionList: React.FC<any> = ({
  sections,
  renderItem,
  renderSectionHeader,
  keyExtractor,
  className,
  ...props
}) => {
  return (
    <div
      className={`flex-1 overflow-auto ${className ?? ''}`}
      style={{ touchAction: 'pan-y' }}
      {...props}
    >
      {(sections ?? []).map((section: { data?: unknown[] }, sIdx: number) => (
        <React.Fragment key={sIdx}>
          {renderSectionHeader ? renderSectionHeader({ section }) : null}
          {(section.data ?? []).map((item: unknown, index: number) => (
            <React.Fragment
              key={keyExtractor ? keyExtractor(item, index) : `${sIdx}-${index}`}
            >
              {renderItem ? renderItem({ item, index, section }) : null}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};

const ActionsheetVirtualizedList = ActionsheetFlatList;

export {
  Actionsheet,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetBackdrop,
  ActionsheetScrollView,
  ActionsheetVirtualizedList,
  ActionsheetFlatList,
  ActionsheetSectionList,
  ActionsheetSectionHeaderText,
  ActionsheetIcon,
};
