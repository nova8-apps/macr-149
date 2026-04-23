import React from 'react';
import { config } from './config';
import { View, ViewProps } from 'react-native';

// Try to import overlay/toast providers — they may not be available on web
let OverlayProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
let ToastProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;

try {
  const overlayModule = require('@gluestack-ui/core/overlay/creator');
  OverlayProvider = overlayModule.OverlayProvider;
} catch {
  // Not available on web — skip
}

try {
  const toastModule = require('@gluestack-ui/core/toast/creator');
  ToastProvider = toastModule.ToastProvider;
} catch {
  // Not available on web — skip
}

export type ModeType = 'light' | 'dark' | 'system';

// ── Shared motion + press-feedback CSS, injected once per page ─────────────
// Every .web.tsx overlay/press stub references these custom properties and
// keyframes. Defining them here (inside GluestackUIProvider, which every
// generated app wraps its root in) guarantees they exist before any overlay
// mounts, and avoids duplicating CSS across 4+ stub files.
const NOVA8_MOTION_STYLE_ID = '__nova8_motion_styles';
const NOVA8_MOTION_CSS = `
:root {
  --nova8-ease-ios: cubic-bezier(0.32, 0.72, 0, 1);
  --nova8-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --nova8-ease-emphasized: cubic-bezier(0.2, 0, 0, 1.15);
  --nova8-duration-fast: 180ms;
  --nova8-duration-medium: 280ms;
  --nova8-duration-slow: 340ms;
  --nova8-shadow-overlay:
    0 1px 2px rgba(0,0,0,0.08),
    0 4px 8px rgba(0,0,0,0.08),
    0 12px 24px rgba(0,0,0,0.10),
    0 24px 48px rgba(0,0,0,0.10);
}

@keyframes nova8-fade-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes nova8-fade-out { from { opacity: 1 } to { opacity: 0 } }
@keyframes nova8-scale-in {
  from { opacity: 0; transform: scale(0.95) }
  to { opacity: 1; transform: scale(1) }
}
@keyframes nova8-scale-out {
  from { opacity: 1; transform: scale(1) }
  to { opacity: 0; transform: scale(0.96) }
}
@keyframes nova8-slide-up {
  from { transform: translateY(100%) }
  to { transform: translateY(0) }
}
@keyframes nova8-slide-down {
  from { transform: translateY(0) }
  to { transform: translateY(100%) }
}
@keyframes nova8-slide-in-top {
  from { transform: translateY(-100%) }
  to { transform: translateY(0) }
}
@keyframes nova8-slide-out-top {
  from { transform: translateY(0) }
  to { transform: translateY(-100%) }
}
@keyframes nova8-slide-in-left {
  from { transform: translateX(-100%) }
  to { transform: translateX(0) }
}
@keyframes nova8-slide-out-left {
  from { transform: translateX(0) }
  to { transform: translateX(-100%) }
}
@keyframes nova8-slide-in-right {
  from { transform: translateX(100%) }
  to { transform: translateX(0) }
}
@keyframes nova8-slide-out-right {
  from { transform: translateX(0) }
  to { transform: translateX(100%) }
}

/* Shared press-feedback: iOS-style opacity dim on active.
   Works on any element — uses CSS :active so there is zero JS cost. */
.nova8-press {
  transition: opacity 120ms var(--nova8-ease-standard),
              transform 120ms var(--nova8-ease-standard);
  -webkit-tap-highlight-color: transparent;
}
.nova8-press:active {
  opacity: 0.72;
}
/* Scaled press: used by FAB / prominent buttons for the "press down" feel. */
.nova8-press-scale:active {
  transform: scale(0.96);
  opacity: 0.88;
}

/* Progressive backdrop-filter fallback: browsers without support get a
   slightly darker solid overlay instead. */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .nova8-blur-backdrop { background-color: rgba(0, 0, 0, 0.55) !important; }
  .nova8-blur-vibrancy { background-color: rgba(255, 255, 255, 0.97) !important; }
  .dark .nova8-blur-vibrancy { background-color: rgba(28, 28, 30, 0.97) !important; }
}

/* ── Tab bar polish (applies to @react-navigation/bottom-tabs + expo-router) ──
   These selectors target the DOM the bottom-tabs web renderer produces:
   a fixed-position container with role="tablist" holding role="tab" items.
   We give it an iOS-feeling frosted glass + active indicator without needing
   to swap the tab library itself. If the DOM shape differs, nothing breaks. */
[role="tablist"] {
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border-top: 0.5px solid rgba(255,255,255,0.08);
}
[role="tablist"] [role="tab"] {
  transition:
    color var(--nova8-duration-fast) var(--nova8-ease-standard),
    opacity var(--nova8-duration-fast) var(--nova8-ease-standard);
}
[role="tablist"] [role="tab"][aria-selected="true"] {
  position: relative;
}
/* Active indicator: subtle pill behind the selected tab label. Uses currentColor
   so it picks up the tab's active tint automatically. */
[role="tablist"] [role="tab"][aria-selected="true"]::before {
  content: "";
  position: absolute;
  inset: 4px 8px;
  border-radius: 8px;
  background: currentColor;
  opacity: 0.12;
  pointer-events: none;
  animation: nova8-fade-in var(--nova8-duration-fast) var(--nova8-ease-standard) both;
}

/* Respect user's reduced-motion OS setting — instant state change only. */
@media (prefers-reduced-motion: reduce) {
  .nova8-anim,
  .nova8-anim * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`.trim();

function injectMotionStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(NOVA8_MOTION_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = NOVA8_MOTION_STYLE_ID;
  style.textContent = NOVA8_MOTION_CSS;
  document.head.appendChild(style);
}

export function GluestackUIProvider({
  mode = 'dark',
  ...props
}: {
  mode?: ModeType;
  children?: React.ReactNode;
  style?: ViewProps['style'];
}) {
  // Inject motion CSS on first mount. Idempotent — safe across hot reloads
  // and StrictMode double-invocations.
  React.useEffect(() => {
    injectMotionStyles();
  }, []);

  const colorScheme = mode === 'system' ? 'light' : mode;
  const colorConfig = config[colorScheme] || config.light || {};

  let content = props.children;
  if (ToastProvider) content = <ToastProvider>{content}</ToastProvider>;
  if (OverlayProvider) content = <OverlayProvider>{content}</OverlayProvider>;

  return (
    <View
      style={[
        colorConfig,
        { flex: 1, height: '100%', width: '100%' },
        props.style,
      ]}
      className={colorScheme === 'dark' ? 'dark' : ''}
    >
      {content}
    </View>
  );
}
