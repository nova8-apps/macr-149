'use client';
// Web stub: premium-feel Menu with iOS-style scale-from-anchor animation,
// vibrancy-style backdrop material, viewport-flip positioning, and proper
// keyboard handling (Escape close, arrow-key movement forthcoming).
//
// Public API is IDENTICAL to the prior stub:
//   Menu, MenuItem, MenuItemLabel, MenuSeparator
// Same props: placement, trigger, isOpen, onOpen, onClose, selectionMode,
// onSelectionChange, className, children.
//
// Motion strategy:
//   • Mount-on-open / stay-mounted-during-close: 180ms exit (menus feel
//     fastest — matches iOS UIMenu).
//   • Menu panel uses transform-origin calibrated to the placement so the
//     scale-in starts from the anchor edge (top-right placement scales
//     from the top-right corner, etc.) — this is the iOS 'pop' feel.
//   • Vibrancy: menu panel itself has backdrop-filter on a mostly-opaque
//     surface. No full-screen dim — menus are local, not modal.
//
// Positioning:
//   • 'placement' prop still controls which side of the anchor the menu
//     appears. Defaults to 'bottom' if not set.
//   • After mount, we measure the panel + anchor + viewport and flip the
//     menu to the opposite side if it would overflow. This mirrors UIKit's
//     UIMenu and iOS action menu behavior.
//
// Keyboard:
//   • Escape closes.
//   • Backdrop overlay click closes (existing behavior preserved).

import React from 'react';

type Placement = 'top' | 'bottom' | 'left' | 'right';

type TriggerProps = {
  onClick: (e?: React.MouseEvent) => void;
  onPress: (e?: unknown) => void;
  ref: React.Ref<HTMLElement>;
};

type IMenuProps = {
  placement?: Placement;
  trigger?: (
    triggerProps: TriggerProps,
    state: { isOpen: boolean },
  ) => React.ReactNode;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selectionMode?: 'none' | 'single' | 'multiple';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectionChange?: (keys: any) => void;
  className?: string;
  children?: React.ReactNode;
};

interface MenuContextValue {
  onClose?: () => void;
  isOpen: boolean;
  isExiting: boolean;
}
const MenuContext = React.createContext<MenuContextValue>({
  isOpen: false,
  isExiting: false,
});

const EXIT_DURATION_MS = 180;

// Maps a placement to its transform-origin (so scale-in pops from the
// correct corner/edge relative to the anchor).
const ORIGIN_BY_PLACEMENT: Record<Placement, string> = {
  bottom: 'top right',
  top: 'bottom right',
  right: 'left top',
  left: 'right top',
};

// Pixel gap between anchor and menu.
const MENU_GAP = 6;
// Padding we keep between menu and viewport edge when flipping.
const VIEWPORT_PADDING = 8;

const Menu: React.FC<IMenuProps> = ({
  trigger,
  isOpen,
  onOpen,
  onClose,
  children,
  className,
  placement: requestedPlacement = 'bottom',
}) => {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const controlled = isOpen !== undefined;
  const open = controlled ? (isOpen as boolean) : uncontrolled;

  const [mounted, setMounted] = React.useState(open);
  const [isExiting, setIsExiting] = React.useState(false);
  const [actualPlacement, setActualPlacement] = React.useState<Placement>(
    requestedPlacement,
  );

  // Anchor measurement: we prefer to measure the trigger element itself
  // (most accurate), but most generated apps don't wire the ref we pass
  // into trigger(). So we always fall back to measuring our wrapper
  // <span> — the trigger is its only child, so its bounding box matches
  // the trigger visually.
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const wrapperRef = React.useRef<HTMLSpanElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      setIsExiting(false);
      setActualPlacement(requestedPlacement); // reset on open; flip check runs next
    } else if (mounted) {
      setIsExiting(true);
      const id = setTimeout(() => {
        setMounted(false);
        setIsExiting(false);
      }, EXIT_DURATION_MS);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [open, mounted, requestedPlacement]);

  const toggle = React.useCallback(() => {
    if (controlled) return;
    setUncontrolled((v) => {
      if (v) onClose?.();
      else onOpen?.();
      return !v;
    });
  }, [controlled, onClose, onOpen]);

  const close = React.useCallback(() => {
    if (!controlled) setUncontrolled(false);
    onClose?.();
  }, [controlled, onClose]);

  // Escape-to-close
  React.useEffect(() => {
    if (!mounted || isExiting) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, isExiting, close]);

  // Viewport-flip: after the panel renders, measure and flip if needed.
  React.useLayoutEffect(() => {
    if (!mounted || isExiting) return;
    const panel = panelRef.current;
    const anchor = anchorRef.current;
    if (!panel) return;

    // Prefer explicit anchor ref if the caller wired it through; otherwise
    // fall back to the wrapper span which holds the trigger.
    const anchorEl = (anchor as HTMLElement | null) ?? wrapperRef.current;
    if (!anchorEl) return;
    const anchorRect = anchorEl.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let p: Placement = requestedPlacement;

    // Flip vertically if bottom placement overflows bottom
    if (
      p === 'bottom' &&
      anchorRect.bottom + MENU_GAP + panelRect.height + VIEWPORT_PADDING > vh &&
      anchorRect.top - MENU_GAP - panelRect.height - VIEWPORT_PADDING >= 0
    ) {
      p = 'top';
    }
    // Flip vertically if top placement overflows top
    else if (
      p === 'top' &&
      anchorRect.top - MENU_GAP - panelRect.height - VIEWPORT_PADDING < 0 &&
      anchorRect.bottom + MENU_GAP + panelRect.height + VIEWPORT_PADDING <= vh
    ) {
      p = 'bottom';
    }
    // Flip horizontally if right placement overflows right
    else if (
      p === 'right' &&
      anchorRect.right + MENU_GAP + panelRect.width + VIEWPORT_PADDING > vw &&
      anchorRect.left - MENU_GAP - panelRect.width - VIEWPORT_PADDING >= 0
    ) {
      p = 'left';
    }
    // Flip horizontally if left placement overflows left
    else if (
      p === 'left' &&
      anchorRect.left - MENU_GAP - panelRect.width - VIEWPORT_PADDING < 0 &&
      anchorRect.right + MENU_GAP + panelRect.width + VIEWPORT_PADDING <= vw
    ) {
      p = 'right';
    }

    if (p !== actualPlacement) setActualPlacement(p);
  }, [mounted, isExiting, requestedPlacement, actualPlacement]);

  // Map placement to panel absolute positioning relative to the anchor's
  // relative-positioned span wrapper.
  const placementPosStyle: React.CSSProperties = (() => {
    switch (actualPlacement) {
      case 'top':
        return { bottom: '100%', right: 0, marginBottom: MENU_GAP };
      case 'left':
        return { right: '100%', top: 0, marginRight: MENU_GAP };
      case 'right':
        return { left: '100%', top: 0, marginLeft: MENU_GAP };
      case 'bottom':
      default:
        return { top: '100%', right: 0, marginTop: MENU_GAP };
    }
  })();

  const transformOrigin = ORIGIN_BY_PLACEMENT[actualPlacement];

  // Trigger: give it a ref so we can measure for flipping.
  const setAnchorRef = (node: HTMLElement | null) => {
    anchorRef.current = node;
  };

  return (
    <MenuContext.Provider
      value={{ onClose: close, isOpen: open, isExiting }}
    >
      <span ref={wrapperRef} className={`relative inline-flex ${className ?? ''}`}>
        {trigger
          ? trigger(
              {
                onClick: toggle,
                onPress: toggle,
                ref: setAnchorRef,
              },
              { isOpen: open },
            )
          : null}
        {mounted ? (
          <>
            {/* Backdrop catcher — invisible, click-to-close. Menus don't dim
                the whole screen; this just catches outside taps. */}
            <div
              className="fixed inset-0 z-40"
              aria-hidden="true"
              onClick={close}
              style={{ background: 'transparent' }}
            />
            <div
              ref={panelRef}
              role="menu"
              data-state={isExiting ? 'closed' : 'open'}
              className="absolute z-50 min-w-[10rem] max-h-[80vh] overflow-auto rounded-xl py-1 nova8-anim nova8-blur-vibrancy"
              style={{
                ...placementPosStyle,
                // Vibrancy-style surface: mostly opaque background plus a
                // subtle backdrop-filter to pick up content behind. Keeps
                // text crisp.
                // Concrete fallback colors first (works even if Tailwind v4
                // color vars aren't wired as space-separated triples), then
                // let the .nova8-blur-vibrancy class from the provider CSS
                // upgrade to the tokenized surface when available.
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(16px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
                transformOrigin,
                animation: isExiting
                  ? `nova8-scale-out ${EXIT_DURATION_MS}ms var(--nova8-ease-standard) both`
                  : `nova8-scale-in var(--nova8-duration-fast) var(--nova8-ease-emphasized) both`,
                boxShadow: 'var(--nova8-shadow-overlay)',
              }}
            >
              {children}
            </div>
          </>
        ) : null}
      </span>
    </MenuContext.Provider>
  );
};

type MenuItemProps = React.ComponentPropsWithoutRef<'button'> & {
  // Accept React-Native-style onPress in addition to onClick so generated code using
  // the RN idiom fires on web. Without this shim, onPress flows through to <button>,
  // React logs "Unknown event handler property 'onPress'. It will be ignored." and
  // the handler never runs.
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  function MenuItem({ className, onClick, onPress, ...props }, ref) {
    const { onClose } = React.useContext(MenuContext);
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        className={`nova8-press w-full text-left flex flex-row items-center px-4 py-2 hover:bg-background-100 ${className ?? ''}`}
        onClick={(e) => {
          onPress?.(e);
          onClick?.(e);
          onClose?.();
        }}
        {...props}
      />
    );
  },
);
MenuItem.displayName = 'MenuItem';

const MenuItemLabel = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<'span'>
>(function MenuItemLabel({ className, ...props }, ref) {
  return (
    <span
      ref={ref}
      className={`text-typography-900 text-sm ${className ?? ''}`}
      {...props}
    />
  );
});
MenuItemLabel.displayName = 'MenuItemLabel';

const MenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(function MenuSeparator({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      role="separator"
      className={`h-px bg-background-200 my-1 ${className ?? ''}`}
      {...props}
    />
  );
});
MenuSeparator.displayName = 'MenuSeparator';

export { Menu, MenuItem, MenuItemLabel, MenuSeparator };
