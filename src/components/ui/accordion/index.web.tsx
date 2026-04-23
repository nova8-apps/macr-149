'use client';
// Web stub: drops @gluestack-ui/core/accordion/creator + @expo/html-elements, keeps API + expand/collapse.
import React from 'react';

type IAccordionProps = {
  variant?: 'filled' | 'unfilled';
  size?: 'sm' | 'md' | 'lg';
  type?: 'single' | 'multiple';
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  isCollapsible?: boolean;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue'>;

const AccordionRootContext = React.createContext<{
  openItems: string[];
  toggle: (v: string) => void;
  type: 'single' | 'multiple';
  isCollapsible: boolean;
}>({ openItems: [], toggle: () => {}, type: 'single', isCollapsible: true });

const AccordionItemContext = React.createContext<{ value: string; isOpen: boolean }>({ value: '', isOpen: false });

const Accordion = React.forwardRef<HTMLDivElement, IAccordionProps>(function Accordion(
  { type = 'single', defaultValue = [], value, onValueChange, isCollapsible = true, variant, size, className, children, ...props },
  ref
) {
  const [uncontrolled, setUncontrolled] = React.useState<string[]>(defaultValue);
  const openItems = value ?? uncontrolled;

  const toggle = React.useCallback(
    (v: string) => {
      const current = value ?? uncontrolled;
      let next: string[];
      if (current.includes(v)) {
        if (!isCollapsible && current.length === 1) return;
        next = current.filter((x) => x !== v);
      } else {
        next = type === 'single' ? [v] : [...current, v];
      }
      if (value === undefined) setUncontrolled(next);
      onValueChange?.(next);
    },
    [value, uncontrolled, type, isCollapsible, onValueChange]
  );

  return (
    <AccordionRootContext.Provider value={{ openItems, toggle, type, isCollapsible }}>
      <div
        ref={ref}
        className={`w-full ${variant === 'filled' ? 'bg-background-0 shadow-hard-2' : ''} ${className ?? ''}`}
        {...props}
      >
        {children}
      </div>
    </AccordionRootContext.Provider>
  );
});
Accordion.displayName = 'Accordion';

type IAccordionItemProps = { value: string; className?: string; children?: React.ReactNode } & React.ComponentPropsWithoutRef<'div'>;

const AccordionItem = React.forwardRef<HTMLDivElement, IAccordionItemProps>(function AccordionItem(
  { value, className, children, ...props },
  ref
) {
  const { openItems } = React.useContext(AccordionRootContext);
  const isOpen = openItems.includes(value);
  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div ref={ref} className={`w-full ${className ?? ''}`} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
});
AccordionItem.displayName = 'AccordionItem';

const AccordionHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function AccordionHeader({ className, ...props }, ref) {
    return <div ref={ref} className={`w-full ${className ?? ''}`} {...props} />;
  }
);
AccordionHeader.displayName = 'AccordionHeader';

type AccordionTriggerProps = React.ComponentPropsWithoutRef<'button'> & {
  // Accept React-Native-style onPress; without this, onPress flows through to
  // <button>, React warns "Unknown event handler property 'onPress'" and the
  // handler is ignored.
  onPress?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  function AccordionTrigger({ className, onClick, onPress, children, ...props }, ref) {
    const { toggle } = React.useContext(AccordionRootContext);
    const { value, isOpen } = React.useContext(AccordionItemContext);
    return (
      <button
        ref={ref}
        type="button"
        aria-expanded={isOpen}
        className={`w-full flex flex-row items-center justify-between px-4 py-3 text-left ${className ?? ''}`}
        onClick={(e) => {
          onPress?.(e);
          onClick?.(e);
          toggle(value);
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

const AccordionTitleText = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  function AccordionTitleText({ className, ...props }, ref) {
    return <span ref={ref} className={`text-typography-900 font-medium text-base ${className ?? ''}`} {...props} />;
  }
);
AccordionTitleText.displayName = 'AccordionTitleText';

const AccordionContentText = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function AccordionContentText({ className, ...props }, ref) {
    return <div ref={ref} className={`text-typography-700 text-sm ${className ?? ''}`} {...props} />;
  }
);
AccordionContentText.displayName = 'AccordionContentText';

const AccordionContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  function AccordionContent({ className, ...props }, ref) {
    const { isOpen } = React.useContext(AccordionItemContext);
    if (!isOpen) return null;
    return <div ref={ref} className={`px-4 pb-3 ${className ?? ''}`} {...props} />;
  }
);
AccordionContent.displayName = 'AccordionContent';

const AccordionIcon = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
  function AccordionIcon({ className, ...props }, ref) {
    return <span ref={ref} className={`inline-flex items-center justify-center ${className ?? ''}`} {...props} />;
  }
);
AccordionIcon.displayName = 'AccordionIcon';

export {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionTitleText,
  AccordionContentText,
  AccordionIcon,
  AccordionContent,
};
