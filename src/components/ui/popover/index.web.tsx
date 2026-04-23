'use client';
// Web stub: drops motion + creator, keeps API + open/close behavior.
import React from 'react';

type IPopoverProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
  trigger?: (triggerProps: any, state: { isOpen: boolean }) => React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

const PopoverContext = React.createContext<{ onClose?: () => void; isOpen?: boolean; size?: string }>({});

const Popover: React.FC<IPopoverProps> = ({
  isOpen,
  onClose,
  onOpen,
  size = 'md',
  trigger,
  children,
  className,
}) => {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const open = isOpen ?? uncontrolled;

  const toggle = React.useCallback(() => {
    if (isOpen === undefined) {
      setUncontrolled((v) => {
        if (v) onClose?.();
        else onOpen?.();
        return !v;
      });
    }
  }, [isOpen, onClose, onOpen]);

  const close = React.useCallback(() => {
    if (isOpen === undefined) setUncontrolled(false);
    onClose?.();
  }, [isOpen, onClose]);

  return (
    <PopoverContext.Provider value={{ onClose: close, isOpen: open, size }}>
      <span className={`relative inline-flex ${className ?? ''}`}>
        {trigger ? trigger({ onClick: toggle, onPress: toggle }, { isOpen: open }) : null}
        {open ? children : null}
      </span>
    </PopoverContext.Provider>
  );
};

const PopoverBackdrop = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function PopoverBackdrop({ className, onClick, ...props }, ref) {
    const { onClose } = React.useContext(PopoverContext);
    return (
      <div
        ref={ref}
        className={`fixed inset-0 z-40 ${className ?? ''}`}
        onClick={(e) => {
          onClick?.(e);
          onClose?.();
        }}
        {...props}
      />
    );
  }
);
PopoverBackdrop.displayName = 'PopoverBackdrop';

const SIZE_CLASS: Record<string, string> = {
  xs: 'w-48',
  sm: 'w-56',
  md: 'w-72',
  lg: 'w-96',
  full: 'w-full',
};

const PopoverContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function PopoverContent({ className, ...props }, ref) {
    const { size = 'md' } = React.useContext(PopoverContext);
    return (
      <div
        ref={ref}
        role="dialog"
        className={`absolute z-50 top-full mt-1 ${SIZE_CLASS[size] ?? SIZE_CLASS.md} bg-background-0 rounded-lg shadow-hard-5 p-4 ${className ?? ''}`}
        {...props}
      />
    );
  }
);
PopoverContent.displayName = 'PopoverContent';

const PopoverArrow = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function PopoverArrow({ className, ...props }, ref) {
    return <div ref={ref} className={`absolute -top-1 left-4 w-2 h-2 rotate-45 bg-background-0 ${className ?? ''}`} {...props} />;
  }
);
PopoverArrow.displayName = 'PopoverArrow';

const PopoverHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function PopoverHeader({ className, ...props }, ref) {
    return <div ref={ref} className={`flex flex-row items-center justify-between mb-2 ${className ?? ''}`} {...props} />;
  }
);
PopoverHeader.displayName = 'PopoverHeader';

const PopoverBody = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function PopoverBody({ className, ...props }, ref) {
    return <div ref={ref} className={`mb-2 ${className ?? ''}`} {...props} />;
  }
);
PopoverBody.displayName = 'PopoverBody';

const PopoverFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function PopoverFooter({ className, ...props }, ref) {
    return <div ref={ref} className={`flex flex-row items-center justify-end gap-2 ${className ?? ''}`} {...props} />;
  }
);
PopoverFooter.displayName = 'PopoverFooter';

type PopoverCloseButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const PopoverCloseButton = React.forwardRef<HTMLButtonElement, PopoverCloseButtonProps>(
  function PopoverCloseButton({ className, onClick, onPress, children, ...props }, ref) {
    const { onClose } = React.useContext(PopoverContext);
    return (
      <button
        ref={ref}
        type="button"
        className={`p-1 rounded hover:bg-background-100 ${className ?? ''}`}
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
  }
);
PopoverCloseButton.displayName = 'PopoverCloseButton';

export {
  Popover,
  PopoverBackdrop,
  PopoverArrow,
  PopoverCloseButton,
  PopoverFooter,
  PopoverHeader,
  PopoverBody,
  PopoverContent,
};
