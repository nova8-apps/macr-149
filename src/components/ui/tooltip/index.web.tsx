'use client';
// Web stub: drops motion + @gluestack-ui/core/tooltip/creator, uses title-based tooltip fallback.
import React from 'react';

type ITooltipProps = {
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: (triggerProps: any, state: { isOpen: boolean }) => React.ReactNode;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
};

const TooltipContext = React.createContext<{ isOpen?: boolean }>({});

const Tooltip: React.FC<ITooltipProps> = ({ trigger, isOpen: controlledIsOpen, onOpen, onClose, children, className }) => {
  const [uncontrolled, setUncontrolled] = React.useState(false);
  const isOpen = controlledIsOpen ?? uncontrolled;

  const open = React.useCallback(() => {
    if (controlledIsOpen === undefined) setUncontrolled(true);
    onOpen?.();
  }, [controlledIsOpen, onOpen]);
  const close = React.useCallback(() => {
    if (controlledIsOpen === undefined) setUncontrolled(false);
    onClose?.();
  }, [controlledIsOpen, onClose]);

  return (
    <TooltipContext.Provider value={{ isOpen }}>
      <span
        className={`relative inline-flex ${className ?? ''}`}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
      >
        {trigger
          ? trigger(
              { onMouseEnter: open, onMouseLeave: close, onFocus: open, onBlur: close },
              { isOpen }
            )
          : null}
        {isOpen ? children : null}
      </span>
    </TooltipContext.Provider>
  );
};

const TooltipContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function TooltipContent({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        role="tooltip"
        className={`absolute z-50 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-background-900 px-2 py-1 rounded shadow-hard-2 whitespace-nowrap ${className ?? ''}`}
        {...props}
      />
    );
  }
);
TooltipContent.displayName = 'TooltipContent';

const TooltipText = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  function TooltipText({ className, ...props }, ref) {
    return <span ref={ref} className={`text-typography-0 text-xs ${className ?? ''}`} {...props} />;
  }
);
TooltipText.displayName = 'TooltipText';

export { Tooltip, TooltipContent, TooltipText };
