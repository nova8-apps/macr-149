/**
 * PreviewErrorReporter
 *
 * Bridge between the preview app and the Nova8 wizard. Communicates via
 * window.postMessage (parent is the wizard). Only active inside the Nova8
 * preview iframe (*.e2b.app); completely inert on TestFlight and App Store.
 *
 * Two signals sent to the wizard:
 *
 * 1) `nova8:error` \u2014 runtime errors caught from:
 *      - window.onerror
 *      - unhandledrejection
 *      - ErrorUtils.setGlobalHandler (React Native)
 *      - console.error interception (for React render errors the app's own
 *        ErrorBoundary may swallow)
 *    Dedupes identical errors within 2s. The wizard displays a red toast
 *    with Ignore / Fix-it actions.
 *
 * 2) `nova8:alive` \u2014 one-shot heartbeat emitted once the app's root layout
 *    mounts successfully. This tells the wizard the app is showing (not
 *    Metro's bundling placeholder) and to stop issuing safety reloads.
 *    HMR then handles code changes without page reloads.
 *
 * Never posts to any URL other than window.parent. No network traffic.
 */
import React from 'react';
import { Platform } from 'react-native';

type ErrorPayload = {
  type: 'nova8:error';
  message: string;
  stack?: string;
  source?: string;
  timestamp: number;
};

type AlivePayload = {
  type: 'nova8:alive';
  timestamp: number;
};

function isInNova8Preview(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  try {
    if (window.parent === window) return false;
    const host = window.location?.hostname || '';
    return /\.e2b\.app$/i.test(host) || host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
}

const lastSent: { key: string; at: number } = { key: '', at: 0 };

function sendError(msg: string, stack?: string, source?: string) {
  if (!isInNova8Preview()) return;
  const cleanMsg = String(msg || 'Unknown error').slice(0, 500);
  const key = `${cleanMsg}::${(stack || '').slice(0, 200)}`;
  const now = Date.now();
  if (lastSent.key === key && now - lastSent.at < 2000) return;
  lastSent.key = key;
  lastSent.at = now;

  const payload: ErrorPayload = {
    type: 'nova8:error',
    message: cleanMsg,
    stack: stack ? String(stack).slice(0, 4000) : undefined,
    source,
    timestamp: now,
  };
  try {
    window.parent.postMessage(payload, '*');
  } catch {}
}

let aliveSent = false;
function sendAlive() {
  if (aliveSent) return;
  if (!isInNova8Preview()) return;
  aliveSent = true;
  const payload: AlivePayload = { type: 'nova8:alive', timestamp: Date.now() };
  try {
    window.parent.postMessage(payload, '*');
  } catch {}
}

let installed = false;
function installGlobalHandlers() {
  if (installed) return;
  if (!isInNova8Preview()) return;
  installed = true;

  // 1) window.onerror \u2014 uncaught runtime JS errors
  const prevOnError = window.onerror;
  window.onerror = function (message, sourceFile, lineno, colno, error) {
    try {
      const msg = error?.message || (typeof message === 'string' ? message : 'Uncaught error');
      sendError(msg, error?.stack, 'window.onerror');
    } catch {}
    if (typeof prevOnError === 'function') {
      return (prevOnError as any).apply(this, arguments as any);
    }
    return false;
  };

  // 2) Unhandled promise rejections
  window.addEventListener('unhandledrejection', (evt: PromiseRejectionEvent) => {
    try {
      const reason: any = evt.reason;
      const msg = reason?.message || (typeof reason === 'string' ? reason : 'Unhandled rejection');
      sendError(msg, reason?.stack, 'unhandledrejection');
    } catch {}
  });

  // 3) React Native global error handler
  try {
    const EU: any = (global as any).ErrorUtils;
    if (EU && typeof EU.setGlobalHandler === 'function') {
      const prev = EU.getGlobalHandler?.();
      EU.setGlobalHandler((error: Error, isFatal?: boolean) => {
        try {
          sendError(error?.message || 'RN error', error?.stack, isFatal ? 'rn:fatal' : 'rn:error');
        } catch {}
        if (prev) prev(error, isFatal);
      });
    }
  } catch {}

  // 4) React render errors via console.error interception
  const prevConsoleError = console.error.bind(console);
  console.error = function (...args: any[]) {
    try {
      for (const arg of args) {
        if (arg instanceof Error) {
          const msg = arg.message || 'Render error';
          if (
            arg.stack?.includes('react') ||
            /is not (a function|defined)/i.test(msg) ||
            /cannot read (property|properties)/i.test(msg) ||
            /undefined is not an object/i.test(msg)
          ) {
            sendError(msg, arg.stack, 'console.error');
            break;
          }
        }
      }
    } catch {}
    return prevConsoleError(...args);
  };
}

export function PreviewErrorReporter({ children }: { children: React.ReactNode }) {
  // Install handlers synchronously on first render
  if (typeof window !== 'undefined' && !installed) {
    try { installGlobalHandlers(); } catch {}
  }
  // Also install on mount as belt-and-suspenders; emit the alive heartbeat
  // AFTER one paint so we know the app rendered without immediately throwing.
  React.useEffect(() => {
    installGlobalHandlers();
    // Defer by one animation frame + small settle \u2014 so if the very first
    // render would throw, window.onerror fires before we claim "alive".
    const raf = requestAnimationFrame(() => {
      const t = setTimeout(() => {
        sendAlive();
      }, 100);
      (raf as any)._t = t;
    });
    return () => {
      cancelAnimationFrame(raf);
      const t = (raf as any)?._t;
      if (t) clearTimeout(t);
    };
  }, []);

  return <>{children}</>;
}

export default PreviewErrorReporter;
