'use client';
// Web stub: drops @gorhom/bottom-sheet + motion. On web, the bottomsheet behaves like a fixed
// bottom panel that shows when its parent state says it's open.
import React from 'react';

type IBottomSheetProps = {
  isOpen?: boolean;
  onClose?: () => void;
  snapPoints?: (string | number)[];
  className?: string;
  children?: React.ReactNode;
} & React.ComponentPropsWithoutRef<'div'>;

const BottomSheetContext = React.createContext<{ onClose?: () => void; isOpen?: boolean }>({});

export const BottomSheet = ({ isOpen, onClose, className, children, ...props }: IBottomSheetProps) => {
  return (
    <BottomSheetContext.Provider value={{ onClose, isOpen }}>
      {isOpen ? (
        <div className={`fixed inset-0 z-50 flex items-end justify-center web:pointer-events-auto ${className ?? ''}`} {...props}>
          {children}
        </div>
      ) : null}
    </BottomSheetContext.Provider>
  );
};

export const BottomSheetPortal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export const BottomSheetTrigger = ({ children, onPress, onClick, className, ...props }: any) => {
  const { isOpen } = React.useContext(BottomSheetContext);
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        onClick?.(e);
        onPress?.(e);
      }}
      {...props}
    >
      {typeof children === 'function' ? children({ isOpen }) : children}
    </button>
  );
};

export const BottomSheetBackdrop = ({ className, onClick, ...props }: React.ComponentPropsWithoutRef<'div'>) => {
  const { onClose } = React.useContext(BottomSheetContext);
  return (
    <div
      className={`absolute inset-0 bg-background-dark/50 ${className ?? ''}`}
      onClick={(e) => {
        onClick?.(e);
        onClose?.();
      }}
      {...props}
    />
  );
};

export const BottomSheetDragIndicator = ({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) => (
  <div className={`w-full py-2 flex items-center justify-center ${className ?? ''}`} {...props}>
    <div className="w-12 h-1 rounded-full bg-background-300" />
  </div>
);

type IBottomSheetContent = React.ComponentPropsWithoutRef<'div'>;

export const BottomSheetContent = ({ className, ...props }: IBottomSheetContent) => (
  <div
    className={`relative z-10 w-full max-w-2xl bg-background-0 rounded-t-2xl shadow-hard-5 p-4 pb-8 flex flex-col ${className ?? ''}`}
    {...props}
  />
);

export const BottomSheetItem = ({ className, onPress, onClick, ...props }: any) => (
  <button
    type="button"
    className={`w-full flex flex-row items-center px-4 py-3 rounded hover:bg-background-100 ${className ?? ''}`}
    onClick={(e) => {
      onClick?.(e);
      onPress?.(e);
    }}
    {...props}
  />
);

export const BottomSheetItemText = ({ ...props }: React.ComponentPropsWithoutRef<'span'>) => (
  <span className="text-typography-900 text-base" {...props} />
);

export const BottomSheetScrollView = ({ className, children, ...props }: any) => (
  <div className={`flex-1 overflow-auto ${className ?? ''}`} {...props}>
    {children}
  </div>
);

export const BottomSheetFlatList: React.FC<any> = ({ data, renderItem, keyExtractor, ListHeaderComponent, ListFooterComponent, className, ...props }) => (
  <div className={`flex-1 overflow-auto ${className ?? ''}`} {...props}>
    {ListHeaderComponent && (typeof ListHeaderComponent === 'function' ? <ListHeaderComponent /> : ListHeaderComponent)}
    {(data ?? []).map((item: any, index: number) => (
      <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
        {renderItem ? renderItem({ item, index }) : null}
      </React.Fragment>
    ))}
    {ListFooterComponent && (typeof ListFooterComponent === 'function' ? <ListFooterComponent /> : ListFooterComponent)}
  </div>
);

export const BottomSheetSectionList: React.FC<any> = ({ sections, renderItem, renderSectionHeader, keyExtractor, className, ...props }) => (
  <div className={`flex-1 overflow-auto ${className ?? ''}`} {...props}>
    {(sections ?? []).map((section: any, sIdx: number) => (
      <React.Fragment key={sIdx}>
        {renderSectionHeader ? renderSectionHeader({ section }) : null}
        {(section.data ?? []).map((item: any, index: number) => (
          <React.Fragment key={keyExtractor ? keyExtractor(item, index) : `${sIdx}-${index}`}>
            {renderItem ? renderItem({ item, index, section }) : null}
          </React.Fragment>
        ))}
      </React.Fragment>
    ))}
  </div>
);

export const BottomSheetTextInput = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(
  function BottomSheetTextInput(props, ref) {
    return <input ref={ref} {...props} />;
  }
);
