'use client';
// Web stub: premium-feel Modal with iOS-style scale-in, heavy backdrop blur,
// Escape-to-close, basic focus trap, and a 4-layer elevation shadow.
//
// Public API is IDENTICAL to the prior stub:
//   Modal, ModalBackdrop, ModalContent, ModalCloseButton,
//   ModalHeader, ModalBody, ModalFooter
// Same props: isOpen, onClose, size (xs/sm/md/lg/full), closeOnOverlayClick,
// avoidKeyboard, className, children.
//
// Motion strategy:
//   • Mount-on-open, stay-mounted-during-close: 280ms exit window so the
//     scale-out + fade-out animations finish before unmount.
//   • Content uses nova8-scale-in on enter (GPU-composited) then scales
//     back out on close.
//   • Backdrop uses a 20px backdrop-filter:blur() + dimmed background to
//     create a proper "depth" feel instead of a flat dim layer.
//
// Accessibility:
//   • role="dialog" + aria-modal="true" on the modal root.
//   • Escape key closes (respects closeOnOverlayClick=false — that flag
//     only governs overlay-tap, not keyboard; users in native TestFlight
//     always expect Escape to work on a web preview).
//   • Focus trap: when the modal mounts, we remember the previously-focused
//     element, move focus into the modal, and restore on close. A loop
//     inside the modal keeps Tab/Shift+Tab from escaping — minimal but
//     behaves like native overlay focus.

import React from 'react';

type IModalProps = {
  isOpen?: boolean;
  onClose?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  children?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  avoidKeyboard?: boolean;
} & React.ComponentPropsWithoutRef<'div'>;

interface ModalContextValue {
  onClose?: () => void;
  size: 'xs' | 'sm' | 'md' | 'lg' | 'full';
  isExiting: boolean;
  closeOnOverlayClick: boolean;
}
const ModalContext = React.createContext<ModalContextValue>({
  size: 'md',
  isExiting: false,
  closeOnOverlayClick: true,
});

const EXIT_DURATION_MS = 280;

// Tab-focusable element selectors used by the focus trap.
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
].join(',');

const Modal = React.forwardRef<HTMLDivElement, IModalProps>(function Modal(
  {
    isOpen,
    onClose,
    size = 'md',
    className,
    children,
    closeOnOverlayClick = true,
    avoidKeyboard: _avoidKeyboard,
    ...props
  },
  ref,
) {
  const [mounted, setMounted] = React.useState(!!isOpen);
  const [isExiting, setIsExiting] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const prevFocusRef = React.useRef<HTMLElement | null>(null);

  // Mount/unmount lifecycle with exit animation
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

  // Escape key + focus management
  React.useEffect(() => {
    if (!mounted || isExiting) return undefined;

    // Remember what was focused before the modal opened
    prevFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;

    // Move focus into the modal on open
    const moveFocus = () => {
      const node = containerRef.current;
      if (!node) return;
      const first = node.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      if (first) first.focus();
      else node.focus(); // fall back to the container (has tabIndex=-1)
    };
    // Defer so the first paint + layout happens before focus grabs
    const focusFrame = requestAnimationFrame(moveFocus);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key === 'Tab' && containerRef.current) {
        // Minimal focus trap
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const active = document.activeElement as HTMLElement | null;
        const idx = active ? focusables.indexOf(active) : -1;
        if (e.shiftKey) {
          if (idx <= 0) {
            e.preventDefault();
            focusables[focusables.length - 1]!.focus();
          }
        } else {
          if (idx === focusables.length - 1) {
            e.preventDefault();
            focusables[0]!.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleKeyDown, true);
      // Restore previous focus when the modal closes (fires when isOpen flips)
      const prev = prevFocusRef.current;
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus(); } catch { /* element gone */ }
      }
    };
  }, [mounted, isExiting, onClose]);

  if (!mounted) return null;

  // Merge incoming ref with our internal ref
  const setRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  return (
    <ModalContext.Provider value={{ onClose, size, isExiting, closeOnOverlayClick }}>
      <div
        ref={setRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        data-state={isExiting ? 'closed' : 'open'}
        className={`fixed inset-0 z-50 flex items-center justify-center web:pointer-events-auto nova8-anim ${className ?? ''}`}
        style={{ outline: 'none' }}
        {...props}
      >
        {children}
      </div>
    </ModalContext.Provider>
  );
});
Modal.displayName = 'Modal';

const ModalBackdrop = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ModalBackdrop({ className, onClick, style, ...props }, ref) {
    const { onClose, isExiting, closeOnOverlayClick } = React.useContext(ModalContext);
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={`absolute inset-0 bg-background-dark/50 nova8-blur-backdrop ${className ?? ''}`}
        style={{
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
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
ModalBackdrop.displayName = 'ModalBackdrop';

const SIZE_CLASS: Record<string, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full w-full h-full',
};

const ModalContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ModalContent({ className, style, ...props }, ref) {
    const { size, isExiting } = React.useContext(ModalContext);
    return (
      <div
        ref={ref}
        className={`relative z-10 w-full ${SIZE_CLASS[size] ?? SIZE_CLASS.md} bg-background-0 rounded-2xl p-6 ${className ?? ''}`}
        style={{
          animation: isExiting
            ? `nova8-scale-out ${EXIT_DURATION_MS}ms var(--nova8-ease-standard) both`
            : `nova8-scale-in var(--nova8-duration-medium) var(--nova8-ease-emphasized) both`,
          boxShadow: 'var(--nova8-shadow-overlay)',
          ...style,
        }}
        {...props}
      />
    );
  },
);
ModalContent.displayName = 'ModalContent';

const ModalHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ModalHeader({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`flex flex-row items-center justify-between mb-4 ${className ?? ''}`}
        {...props}
      />
    );
  },
);
ModalHeader.displayName = 'ModalHeader';

const ModalBody = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ModalBody({ className, ...props }, ref) {
    return <div ref={ref} className={`mb-4 ${className ?? ''}`} {...props} />;
  },
);
ModalBody.displayName = 'ModalBody';

const ModalFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function ModalFooter({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`flex flex-row items-center justify-end gap-2 ${className ?? ''}`}
        {...props}
      />
    );
  },
);
ModalFooter.displayName = 'ModalFooter';

const ModalCloseButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'> & { onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void }
>(function ModalCloseButton({ className, onClick, onPress, children, ...props }, ref) {
  const { onClose } = React.useContext(ModalContext);
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
ModalCloseButton.displayName = 'ModalCloseButton';

export {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
  ModalFooter,
};
