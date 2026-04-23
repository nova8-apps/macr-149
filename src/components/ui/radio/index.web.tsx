'use client';
// Web stub: drops @gluestack-ui/core/radio/creator + nativewind-utils style context.
// Implements Radio/RadioGroup/RadioIndicator/RadioLabel/RadioIcon as plain DOM
// with a shared React context so all pieces stay in sync without the native
// withStyleContext / useStyleContext helpers (which are undefined on web).
import React from 'react';

type Size = 'sm' | 'md' | 'lg';

type RadioGroupContextValue = {
  value?: string;
  onChange?: (value: string) => void;
  size?: Size;
  isDisabled?: boolean;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

type RadioContextValue = {
  value?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  size?: Size;
};

const RadioContext = React.createContext<RadioContextValue>({});

// ── RadioGroup ────────────────────────────────────────────────────────────
type IRadioGroupProps = {
  value?: string;
  onChange?: (value: string) => void;
  size?: Size;
  isDisabled?: boolean;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'>;

const RadioGroup = React.forwardRef<HTMLDivElement, IRadioGroupProps>(function RadioGroup(
  { value, onChange, size = 'md', isDisabled, className, children, ...props },
  ref,
) {
  return (
    <RadioGroupContext.Provider value={{ value, onChange, size, isDisabled }}>
      <div
        ref={ref}
        role="radiogroup"
        className={`flex flex-col gap-2 ${className ?? ''}`}
        {...props}
      >
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
});
RadioGroup.displayName = 'RadioGroup';

// ── Radio ─────────────────────────────────────────────────────────────────
type IRadioProps = {
  value: string;
  size?: Size;
  isDisabled?: boolean;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<'label'>, 'onChange'>;

const SIZE_GAP: Record<Size, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2',
};

const Radio = React.forwardRef<HTMLLabelElement, IRadioProps>(function Radio(
  { value, size, isDisabled, className, children, ...props },
  ref,
) {
  const group = React.useContext(RadioGroupContext);
  const resolvedSize = size ?? group.size ?? 'md';
  const resolvedDisabled = isDisabled ?? group.isDisabled ?? false;
  const isSelected = group.value === value;

  const handleClick = () => {
    if (resolvedDisabled) return;
    group.onChange?.(value);
  };

  return (
    <RadioContext.Provider value={{ value, isSelected, isDisabled: resolvedDisabled, size: resolvedSize }}>
      <label
        ref={ref}
        className={`flex flex-row items-center justify-start ${SIZE_GAP[resolvedSize]} ${resolvedDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className ?? ''}`}
        onClick={handleClick}
        data-selected={isSelected ? 'true' : 'false'}
        data-disabled={resolvedDisabled ? 'true' : 'false'}
        {...props}
      >
        {children}
      </label>
    </RadioContext.Provider>
  );
});
Radio.displayName = 'Radio';

// ── RadioIndicator ────────────────────────────────────────────────────────
const SIZE_INDICATOR: Record<Size, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

type IRadioIndicatorProps = {
  className?: string;
  children?: React.ReactNode;
} & React.ComponentPropsWithoutRef<'div'>;

const RadioIndicator = React.forwardRef<HTMLDivElement, IRadioIndicatorProps>(function RadioIndicator(
  { className, children, ...props },
  ref,
) {
  const { isSelected, size = 'md' } = React.useContext(RadioContext);
  return (
    <div
      ref={ref}
      className={`inline-flex items-center justify-center rounded-full border-2 ${SIZE_INDICATOR[size]} ${isSelected ? 'border-primary-600' : 'border-outline-400'} ${className ?? ''}`}
      {...props}
    >
      {isSelected ? children : null}
    </div>
  );
});
RadioIndicator.displayName = 'RadioIndicator';

// ── RadioLabel ────────────────────────────────────────────────────────────
const SIZE_TEXT: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

type IRadioLabelProps = {
  className?: string;
  children?: React.ReactNode;
} & React.ComponentPropsWithoutRef<'span'>;

const RadioLabel = React.forwardRef<HTMLSpanElement, IRadioLabelProps>(function RadioLabel(
  { className, children, ...props },
  ref,
) {
  const { size = 'md' } = React.useContext(RadioContext);
  return (
    <span
      ref={ref}
      className={`text-typography-900 ${SIZE_TEXT[size]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </span>
  );
});
RadioLabel.displayName = 'RadioLabel';

// ── RadioIcon ─────────────────────────────────────────────────────────────
const SIZE_ICON: Record<Size, string> = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

type IRadioIconProps = {
  className?: string;
  size?: Size | number;
} & React.ComponentPropsWithoutRef<'div'>;

const RadioIcon = React.forwardRef<HTMLDivElement, IRadioIconProps>(function RadioIcon(
  { className, size, ...props },
  ref,
) {
  const { size: parentSize = 'md' } = React.useContext(RadioContext);
  const sizeKey: Size = typeof size === 'string' ? size : parentSize;
  return (
    <div
      ref={ref}
      className={`rounded-full bg-primary-600 ${SIZE_ICON[sizeKey]} ${className ?? ''}`}
      {...props}
    />
  );
});
RadioIcon.displayName = 'RadioIcon';

export { Radio, RadioGroup, RadioIndicator, RadioLabel, RadioIcon };
