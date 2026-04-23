'use client';
// Web stub: drops @legendapp/motion + creator, keeps API + open/close behavior.
import React from 'react';

type IAlertDialogProps = {
  isOpen?: boolean;
  onClose?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  children?: React.ReactNode;
  closeOnOverlayClick?: boolean;
  avoidKeyboard?: boolean;
} & React.ComponentPropsWithoutRef<'div'>;

const AlertDialogContext = React.createContext<{ onClose?: () => void; size?: string }>({});

const AlertDialog = React.forwardRef<HTMLDivElement, IAlertDialogProps>(function AlertDialog(
  { isOpen, onClose, size = 'md', className, children, ...props },
  ref
) {
  if (!isOpen) return null;
  return (
    <AlertDialogContext.Provider value={{ onClose, size }}>
      <div
        ref={ref}
        className={`fixed inset-0 z-50 flex items-center justify-center web:pointer-events-auto ${className ?? ''}`}
        role="alertdialog"
        aria-modal="true"
        {...props}
      >
        {children}
      </div>
    </AlertDialogContext.Provider>
  );
});
AlertDialog.displayName = 'AlertDialog';

const AlertDialogBackdrop = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function AlertDialogBackdrop({ className, onClick, ...props }, ref) {
    const { onClose } = React.useContext(AlertDialogContext);
    return (
      <div
        ref={ref}
        className={`absolute inset-0 bg-background-dark/50 ${className ?? ''}`}
        onClick={(e) => {
          onClick?.(e);
          onClose?.();
        }}
        {...props}
      />
    );
  }
);
AlertDialogBackdrop.displayName = 'AlertDialogBackdrop';

const SIZE_CLASS: Record<string, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full w-full h-full',
};

const AlertDialogContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function AlertDialogContent({ className, ...props }, ref) {
    const { size = 'md' } = React.useContext(AlertDialogContext);
    return (
      <div
        ref={ref}
        className={`relative z-10 w-full ${SIZE_CLASS[size] ?? SIZE_CLASS.md} bg-background-0 rounded-lg shadow-hard-5 p-6 ${className ?? ''}`}
        {...props}
      />
    );
  }
);
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function AlertDialogHeader({ className, ...props }, ref) {
    return <div ref={ref} className={`flex flex-row items-center justify-between mb-4 ${className ?? ''}`} {...props} />;
  }
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogBody = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function AlertDialogBody({ className, ...props }, ref) {
    return <div ref={ref} className={`mb-4 ${className ?? ''}`} {...props} />;
  }
);
AlertDialogBody.displayName = 'AlertDialogBody';

const AlertDialogFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function AlertDialogFooter({ className, ...props }, ref) {
    return <div ref={ref} className={`flex flex-row items-center justify-end gap-2 ${className ?? ''}`} {...props} />;
  }
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

type AlertDialogCloseButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const AlertDialogCloseButton = React.forwardRef<HTMLButtonElement, AlertDialogCloseButtonProps>(
  function AlertDialogCloseButton({ className, onClick, onPress, children, ...props }, ref) {
    const { onClose } = React.useContext(AlertDialogContext);
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
AlertDialogCloseButton.displayName = 'AlertDialogCloseButton';

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogCloseButton,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogBody,
  AlertDialogBackdrop,
};
