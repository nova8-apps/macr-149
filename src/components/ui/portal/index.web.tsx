'use client';
// Web stub: drops @gorhom/portal. On web we just use ReactDOM.createPortal to document.body.
import React from 'react';
import { createPortal } from 'react-dom';

type IPortalProps = {
  children?: React.ReactNode;
  hostName?: string;
};

const Portal: React.FC<IPortalProps> = ({ children }) => {
  if (typeof document === 'undefined') return <>{children}</>;
  return createPortal(<>{children}</>, document.body);
};

export { Portal };
