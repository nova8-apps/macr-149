# Frontend App Design Skill — v2

> Load this skill when designing any frontend mobile app screen, component, or layout. The goal is Streaks / Things 3 / Copilot Money quality — not generic flat black backgrounds with purple buttons.

---

## MANDATORY RULES (read before writing any code)

1. **ALWAYS use NativeWind `className`** for all styling. NEVER use `StyleSheet.create()` unless a component explicitly cannot accept `className` (see Platform Notes below).
2. **ALWAYS use the gray scale defined here** — `bg-gray-950`, `bg-gray-900`, `bg-gray-800`, etc. NEVER use `bg-black` or `bg-[#000000]`.
3. **NEVER default to violet/purple as an accent color.** Choose from the Category-Aware Accent Palettes table based on the app type.
4. **ALWAYS include realistic mock data** — real habit names, actual dollar amounts, real timestamps. NEVER use "Lorem ipsum", "Title 1", or "Item 1".
5. **ALWAYS use `lucide-react-native` for every icon.** NEVER output inline `<svg>` elements.
6. **EVERY screen file MUST have a default export** — missing default export = blank screen.
7. **ALWAYS use `SafeAreaView` from `react-native-safe-area-context`**, not from `react-native`.
8. **ALWAYS use `Pressable` over `TouchableOpacity`**.
9. **NEVER use `Animated.View` with `className`** — it breaks under Reanimated ≥ 3.16. Use `Animated.createAnimatedComponent(View)` + `style` prop for animated styles, and `className` only on the static wrapper.
10. **ALWAYS apply `accessibilityLabel`** to every interactive element without visible text.
11. **EVERY component recipe MUST include both dark and light mode classes.** Pattern: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-gray-100`, `border-gray-200 dark:border-white/8`. No recipe should show only one mode.
12. **Gate native-only APIs with Platform.OS checks.** `expo-haptics`, `expo-camera`, `expo-sensors` must be wrapped: `if (Platform.OS !== 'web') { ... }`.
13. **Use `<ScreenWrapper>` from `@/components/ui/screen-wrapper` as the root of every screen.** It handles SafeArea, vertical scroll, and tab-bar bottom padding automatically.
    - `<ScreenWrapper>` (default) = scrollable. Use when content could exceed viewport height.
    - `<ScreenWrapper scrollable={false}>` = fixed layout. Use when content clearly fits the viewport (2-3 cards, camera, map, single modal).
    - **CONSTRAINT:** Do NOT enable scrolling when content fits. If a screen has only a few cards that fit within the viewport, use `scrollable={false}` and lay out with `flex` + `justify-between`. Add `bounces={false}` when content nearly fits to prevent rubber-band effect.
    - NEVER make the entire screen horizontally scrollable. NEVER use both horizontal and vertical scroll on the same ScrollView unless it is a canvas/map.
14. **Horizontal overflow MUST be scrollable — but only for individual rows.** Any row of cards, chips, filter tabs, or category pills that could exceed the screen width MUST be wrapped in `<ScrollView horizontal showsHorizontalScrollIndicator={false}>`. NEVER clip or hide overflowing horizontal content. NEVER make the full screen horizontally scrollable — only individual content rows (chip bars, image carousels, story rings).

---

## PLATFORM NOTES (critical runtime rules)

| Component | Supports `className`? | Correct pattern |
|-----------|----------------------|-----------------|
| `LinearGradient` from `expo-linear-gradient` | ❌ | Use inline `style` prop |
| `Animated.View` / `Animated.Text` (Reanimated ≥ 3.16) | ❌ | `Animated.createAnimatedComponent(View)` + `style` |
| `BottomSheetView` from `@gorhom/bottom-sheet` | ⚠️ (needs nativewind ≥ 4.2.1) | Fall back to `StyleSheet` for the sheet root |
| `CameraView` from `expo-camera` | ❌ | Use inline `style` |
| Regular `View`, `Text`, `Pressable`, `ScrollView` | ✅ | Use `className` freely |
| `expo-image` `Image` | Needs `cssInterop` | See Imagery System section |
| Skia `Canvas`, `Circle`, `Path` | ❌ | Use JS hex/rgba color props; no className inside Canvas |

**Empty string trap:** In React Native, `{condition ? '' : <Component />}` — the empty string `''` renders as a text node and throws. Always use `null`, never `''`.

**Spring layout animations on web:** `.springify()` on entering/exiting animations is NOT supported on React Native Web. Use `.duration(300)` with an easing curve instead.

**Shared element transitions:** `sharedTransitionTag` requires the ENABLE_SHARED_ELEMENT_TRANSITIONS flag and Old Architecture. Since Nova8's template has `newArchEnabled: true`, do NOT use shared element transitions. Use JS-based staggered entry animations instead.

**Skia inside Expo Web:** Victory Native and Skia charts require `LoadSkiaWeb()` called before mounting. Gate chart screens with `<WithSkiaWeb>` for lazy loading on web.

---

## Design Tokens

Design tokens are the single source of truth for colors, spacing, and typography. Use the semantic token pattern to make dark/light mode automatic.

### tokens.ts Pattern

```ts
// lib/tokens.ts — copy this into every project that needs theming
export const colors = {
  gray: {
    50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 300: '#d1d5db',
    400: '#9ca3af', 500: '#6b7280', 600: '#4b5563', 700: '#374151',
    800: '#1f2937', 900: '#111827', 950: '#030712',
  },
  white: '#ffffff',
  black: '#000000',
} as const;

// Semantic surface tokens — maps to dark/light equivalents automatically
export const semanticColors = {
  light: {
    'surface-primary':   '#f9fafb',  // Main screen background
    'surface-secondary': '#ffffff',  // Cards, elevated surfaces
    'surface-tertiary':  '#f3f4f6',  // Grouped sections, list backgrounds
    'content-primary':   '#111827',  // Primary text
    'content-secondary': '#6b7280',  // Labels, captions
    'content-tertiary':  '#9ca3af',  // Placeholder, disabled
    'border-primary':    '#e5e7eb',  // Cards, inputs
  },
  dark: {
    'surface-primary':   '#030712',  // gray-950
    'surface-secondary': '#111827',  // gray-900
    'surface-tertiary':  '#1f2937',  // gray-800
    'content-primary':   '#f9fafb',  // gray-50
    'content-secondary': '#9ca3af',  // gray-400
    'content-tertiary':  '#4b5563',  // gray-600
    'border-primary':    '#1f2937',  // gray-800
  },
} as const;

export const shadows = {
  // Use in light mode only — shadows are invisible on dark backgrounds
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
} as const;
```

### NativeWind CSS Variables Pipeline

```css
/* global.css */
:root {
  --color-surface-primary:   249 250 251;  /* gray-50 */
  --color-surface-secondary: 255 255 255;
  --color-content-primary:   17 24 39;     /* gray-900 */
  --color-content-secondary: 107 114 128;  /* gray-500 */
  --color-border-primary:    229 231 235;  /* gray-200 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-surface-primary:   3 7 18;       /* gray-950 */
    --color-surface-secondary: 17 24 39;     /* gray-900 */
    --color-content-primary:   249 250 251;  /* gray-50 */
    --color-content-secondary: 156 163 175;  /* gray-400 */
    --color-border-primary:    31 41 55;     /* gray-800 */
  }
}
```

```ts
// tailwind.config.ts — extend with semantic tokens
const cssVar = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

extend: {
  colors: {
    surface: {
      primary: cssVar('surface-primary'),
      secondary: cssVar('surface-secondary'),
    },
    content: {
      primary: cssVar('content-primary'),
      secondary: cssVar('content-secondary'),
    },
    border: { primary: cssVar('border-primary') },
  },
}
```

**Usage with semantic tokens — one class, handles dark mode automatically:**
```tsx
// ❌ Raw colors — requires manual dark: everywhere
<View className="bg-gray-900 dark:bg-gray-50 border border-gray-200 dark:border-gray-800">

// ✅ Semantic tokens — zero dark: variants needed
<View className="bg-surface-secondary border border-border-primary">
```

### Theme Switching

```tsx
// providers/ThemeProvider.tsx
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ColorScheme = 'light' | 'dark' | 'system';

export function useTheme() {
  const { colorScheme, setColorScheme } = useColorScheme();

  const setTheme = async (scheme: ColorScheme) => {
    await AsyncStorage.setItem('theme-preference', scheme);
    if (scheme === 'system') {
      setColorScheme(Appearance.getColorScheme() ?? 'light');
    } else {
      setColorScheme(scheme);
    }
  };

  return { colorScheme, setTheme };
}
```

---

## Color System

### Dark Mode Surface Hierarchy

iOS dark mode uses layered backgrounds for depth — never shadows. Each layer is ~10–14 luminance points brighter than the one below.

```
Layer 0 — Screen background    bg-gray-950   (#030712)   → maps to iOS systemBackground #000000
Layer 1 — Cards / surfaces     bg-gray-900   (#111827)   → maps to iOS secondarySystemBackground #1C1C1E
Layer 2 — Nested containers    bg-gray-800   (#1f2937)   → maps to iOS tertiarySystemBackground #2C2C2E
Layer 3 — Inputs / deep items  bg-gray-700   (#374151)   → maps to iOS systemGray4 #3A3A3C
Layer 4 — Active / hover state bg-gray-600   (#4b5563)   → maps to iOS systemGray3 #48484A
```

**Border / Separator colors in dark mode:**
- Subtle separator: `border-white/8` (8% white = barely visible, separates cards)
- Standard separator: `border-gray-700` (solid, within a card section)
- Strong separator: `border-gray-600` (for grouped section dividers)

### Light Mode Surface Hierarchy

```
Layer 0 — Screen background    bg-gray-50    (#f9fafb)   → maps to iOS systemGroupedBackground #F2F2F7
Layer 1 — Cards / surfaces     bg-white      (#ffffff)   → maps to iOS secondarySystemGroupedBackground #FFFFFF
Layer 2 — Nested containers    bg-gray-100   (#f3f4f6)   → maps to iOS tertiarySystemGroupedBackground #F2F2F7
Layer 3 — Inputs / deep items  bg-gray-200   (#e5e7eb)   → maps to iOS systemGray5 #E5E5EA
Layer 4 — Active / hover state bg-gray-300   (#d1d5db)
```

**Border / Separator colors in light mode:**
- Subtle separator: `border-black/5` (5% black)
- Standard separator: `border-gray-200`
- Strong separator: `border-gray-300`

**Light mode shadows (use INSTEAD of borders in light mode):**
```tsx
// In light mode, cards use a drop shadow instead of a border
<View
  className="bg-white rounded-xl p-4"
  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 }}
/>
```

### Category-Aware Accent Palettes

Pick ONE palette based on the user's prompt. Apply it app-wide.

| Category | App Examples | Accent 100% | Accent text-on-accent | Accent 15% bg | Accent 8% bg | Destructive | Success | Warning |
|----------|-------------|-------------|----------------------|---------------|--------------|-------------|---------|---------| 
| **Health / Fitness** | Streaks, Oura | `bg-orange-500` dark: `bg-orange-400` | `text-white` | `bg-orange-500/15` | `bg-orange-500/8` | `bg-red-500` | `bg-green-500` | `bg-yellow-500` |
| **Finance / Money** | Copilot, YNAB | `bg-blue-500` dark: `bg-blue-400` | `text-white` | `bg-blue-500/15` | `bg-blue-500/8` | `bg-red-500` | `bg-emerald-500` | `bg-amber-500` |
| **Productivity / Tasks** | Things 3, Todoist | `bg-sky-500` dark: `bg-sky-400` | `text-white` | `bg-sky-500/15` | `bg-sky-500/8` | `bg-red-500` | `bg-green-500` | `bg-orange-400` |
| **Social / Feed** | Threads | `bg-gray-900` dark: `bg-white` | `text-white` dark: `text-black` | `bg-gray-900/10` | `bg-gray-900/5` | `bg-red-500` | `bg-green-500` | `bg-amber-500` |
| **Food / Recipes** | Crouton, Paprika | `bg-rose-500` dark: `bg-rose-400` | `text-white` | `bg-rose-500/15` | `bg-rose-500/8` | `bg-red-600` | `bg-green-500` | `bg-orange-500` |
| **Travel / Maps** | Wanderlog | `bg-teal-500` dark: `bg-teal-400` | `text-white` | `bg-teal-500/15` | `bg-teal-500/8` | `bg-red-500` | `bg-green-500` | `bg-yellow-500` |
| **Music / Audio** | Spotify-like | `bg-green-500` dark: `bg-green-400` | `text-black` | `bg-green-500/15` | `bg-green-500/8` | `bg-red-500` | `bg-green-400` | `bg-yellow-500` |
| **Education / Learning** | Duolingo-like | `bg-indigo-500` dark: `bg-indigo-400` | `text-white` | `bg-indigo-500/15` | `bg-indigo-500/8` | `bg-red-500` | `bg-green-500` | `bg-amber-500` |
| **Shopping / Commerce** | generic store | `bg-rose-500` dark: `bg-rose-400` | `text-white` | `bg-rose-500/15` | `bg-rose-500/8` | `bg-red-500` | `bg-green-500` | `bg-orange-500` |
| **Mindfulness / Wellness** | Calm-like | `bg-cyan-500` dark: `bg-cyan-400` | `text-white` | `bg-cyan-500/15` | `bg-cyan-500/8` | `bg-red-400` | `bg-teal-500` | `bg-yellow-400` |

### Color Application Rules

**Accent at 100% opacity** — use ONLY for:
- Primary CTA buttons (one per screen maximum)
- Active/selected state of icons and tab labels
- Progress fill on progress rings or bars
- The "completion" moment (when a task is checked off, the circle fills)
- Key data values that need emphasis (a positive balance, a streak count)

**Accent at 15% opacity** — use for:
- Icon containers (the colored background behind a lucide icon in a list row)
- Selected state background on a pill/chip/filter button
- Badge/tag backgrounds
- Stat card accent zone tinting

**Accent at 8% opacity** — use for:
- Tinted card backgrounds when the whole card references the accent theme
- Hover/press state on ghost buttons
- Section background tinting (very subtle)

**Icon color conventions:**
- Interactive icons (tappable): accent color at 100%
- Decorative icons next to text (non-tappable): `text-gray-400` dark / `text-gray-500` light
- Destructive/danger icons: `text-red-500`
- Success icons: `text-green-500`
- Navigation bar icons: `text-gray-300` dark / `text-gray-600` light
- Active tab icon: accent color

**Text color hierarchy (dark mode):**
- Primary text: `text-white` (labels, titles, primary body copy)
- Secondary text: `text-gray-400` (metadata, timestamps, subtitles)
- Tertiary text: `text-gray-500` (captions, disabled, placeholders)
- Quaternary / ghost text: `text-gray-600` (very subtle labels, units)

**Text color hierarchy (light mode):**
- Primary text: `text-gray-900`
- Secondary text: `text-gray-500`
- Tertiary text: `text-gray-400`
- Quaternary: `text-gray-300`

---

## Typography Scale

Map iOS Dynamic Type to the Nova8 custom font size scale. The custom config has:
- `text-2xs` = 10px (custom, same as `xs`)
- `text-xs` = 10px (custom — tab bar labels only)
- `text-sm` = 12px (custom — captions, footnotes)
- `text-base` = 14px (custom — standard body)
- `text-lg` = 18px (custom)
- `text-xl` = 20px (custom — Title 3)
- `text-2xl` = 24px (custom — Title 2)
- `text-3xl` = 32px (custom — Title 1)
- `text-4xl` = 40px (custom)
- `text-5xl` = 48px (custom — Large Score displays)

| iOS Style | Nova8 Class | Weight | Color (dark) | Color (light) | Use for |
|-----------|-------------|--------|--------------|---------------|---------|
| Large Title (34pt) | `text-3xl font-bold` | Bold | `text-white` | `text-gray-900` | Screen title (unscrolled), hero numbers |
| Title 1 (28pt) | `text-3xl font-semibold` | Semibold | `text-white` | `text-gray-900` | Section hero text |
| Title 2 (22pt) | `text-2xl font-semibold` | Semibold | `text-white` | `text-gray-900` | Card titles, modal titles |
| Title 3 / Headline (20pt) | `text-xl font-semibold` | Semibold | `text-white` | `text-gray-900` | Section headers, list group headers |
| Body (17pt) | `text-base font-normal` | Regular | `text-white` | `text-gray-900` | List item titles, body copy, form labels |
| Headline (17pt semibold) | `text-base font-semibold` | Semibold | `text-white` | `text-gray-900` | Emphasized body — same size as Body, different weight |
| Callout (16pt) | `text-base font-normal` | Regular | `text-gray-200` | `text-gray-700` | Secondary body, callout text |
| Subhead (15pt) | `text-base font-normal` | Regular | `text-gray-400` | `text-gray-500` | Metadata, secondary line in a list row |
| Footnote (13pt) | `text-sm font-normal` | Regular | `text-gray-400` | `text-gray-500` | Timestamps, helper text, form hints |
| Caption 1 (12pt) | `text-sm font-normal` | Regular | `text-gray-500` | `text-gray-400` | Section headers (uppercase), tiny labels |
| Caption 2 / Tab label (10pt) | `text-xs font-medium` | Medium | accent or `text-gray-500` | accent or `text-gray-400` | Tab bar labels ONLY |

**Typography hierarchy rule:** Create visual hierarchy with **weight and color changes**, not font size escalation. A single screen should have at most 3 different font sizes. Differentiate body from secondary text using color (`text-white` vs `text-gray-400`), not by making one text tiny.

---

## Spacing & Layout

All spacing follows the **8pt grid**. Every margin, padding, and gap MUST be a multiple of 4.

| Token | Tailwind | px | Use for |
|-------|----------|----|---------| 
| micro | `p-1` / `gap-1` | 4px | Icon-to-label gap, badge padding |
| xs | `p-2` / `gap-2` | 8px | Between tightly related elements, within chips |
| sm | `p-3` / `gap-3` | 12px | Inner card padding vertical, compact rows |
| md | `p-4` / `gap-4` | 16px | **Standard screen edge margin**, card padding |
| lg | `p-5` / `gap-5` | 20px | Larger iPhone edge margin, modal padding |
| xl | `p-6` / `gap-6` | 24px | Section spacing, between cards |
| 2xl | `p-8` / `gap-8` | 32px | Large section spacing |
| 3xl | `p-10` / `gap-10` | 40px | Sheet top padding |

**Standard measurements:**
```
Screen horizontal padding:    px-4 (16pt) standard; px-5 (20pt) on larger layouts
Between stacked cards:        gap-3 (12pt)
Between list rows:            No gap — use a hairline divider at the bottom of each row
Card internal padding:        p-4 (16pt) horizontal, p-4 (16pt) vertical
Section header spacing:       mt-6 mb-2 (24pt top, 8pt bottom)
Between form sections:        gap-5 (20pt)
Minimum tappable height:      h-11 (44pt) — the iOS HIG minimum touch target
Avatar-to-text gap:           ml-3 (12pt)
Icon-to-text gap:             gap-2 (8pt)
```

**$1M app rule:** If any spacing value is not a multiple of 4, it is wrong. There are no 13px margins in great apps.

---

## Corner Radii

| Tailwind | px | Use for |
|----------|----|---------| 
| `rounded` | 4px | Very small chips, inline badges |
| `rounded-md` | 6px | Small buttons, tight tags |
| `rounded-lg` | 8px | Input fields, row selection background |
| `rounded-xl` | 12px | **Cards** — the standard card radius |
| `rounded-2xl` | 16px | Larger feature cards, prominent banners |
| `rounded-3xl` | 24px | **Bottom sheets**, large modal dialogs |
| `rounded-full` | 9999px | **Avatars**, pills, circular icon containers, FAB |

**Concentric radius rule:** When a rounded child sits inside a rounded parent, the parent radius = child radius + padding. Example: A button with `rounded-xl` (12px) inside a card with `p-4` (16px) padding → card uses `rounded-2xl` (16+12=28 → nearest = 24 or 28, use `rounded-3xl`). Following this prevents the "corner mismatch" that makes amateur UIs obvious.

**Zero-radius exceptions:**
- List rows on a plain background (Things 3, Threads pattern) — the rows are full-width, no card chrome
- Full-bleed image backgrounds
- Separator lines

---

## Imagery System

### expo-image Setup (cssInterop Required)

`expo-image`'s `Image` component is NOT a React Native core component — NativeWind does not automatically resolve `className` → `style`. You MUST call `cssInterop` once before using the component.

```tsx
// components/Image.tsx — create this wrapper once, import from it everywhere
import { Image as ExpoImage } from 'expo-image';
import { cssInterop } from 'nativewind';

// Wire className → style. Only needs to happen once globally.
cssInterop(ExpoImage, { className: 'style' });

export { ExpoImage as Image };
```

```tsx
// Now className works like any NativeWind component:
import { Image } from '~/components/Image';

<Image
  source={uri}
  contentFit="cover"
  transition={300}
  className="w-full aspect-video rounded-2xl"
/>
```

### Complete AppImage Component

```tsx
// components/AppImage.tsx
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';
import type { ImageContentFit } from 'expo-image';

cssInterop(Image, { className: 'style' });

interface AppImageProps {
  uri: string;
  blurhash?: string;
  contentFit?: ImageContentFit;
  className?: string;
  priority?: 'low' | 'normal' | 'high';
}

export function AppImage({
  uri,
  blurhash,
  contentFit = 'cover',
  className,
  priority = 'normal',
}: AppImageProps) {
  return (
    <Image
      source={uri}
      // Blurhash shows while the real image loads — cross-dissolves out
      placeholder={blurhash ? { blurhash, width: 16, height: 9 } : undefined}
      placeholderContentFit={contentFit}
      contentFit={contentFit}
      // 300ms cross-dissolve fade-in
      transition={300}
      cachePolicy="disk"
      priority={priority}
      className={className}
    />
  );
}
```

### expo-image Props Reference

| Prop | Values | Notes |
|------|--------|-------|
| `contentFit` | `'cover'` \| `'contain'` \| `'fill'` | Mirrors CSS `object-fit` |
| `transition` | `number` | Cross-dissolve duration in ms |
| `cachePolicy` | `'disk'` \| `'memory-disk'` \| `'none'` | `memory-disk` for avatars rendered many times |
| `priority` | `'low'` \| `'normal'` \| `'high'` | Above-fold hero images → `'high'` |
| `placeholder` | `{ blurhash }` \| `{ thumbhash }` | Native decode, no extra lib at runtime |

### Aspect Ratio Conventions

| Use case | Ratio | NativeWind class |
|----------|-------|-----------------|
| Hero / banner | 16:9 | `aspect-video` |
| Wide banner | 2:1 | `aspect-[2/1]` |
| Feed card (Instagram) | 4:5 | `aspect-[4/5]` |
| Feed card (square) | 1:1 | `aspect-square` |
| Avatar / thumbnail | 1:1 | `aspect-square` |
| Product image | 3:4 | `aspect-[3/4]` |
| Profile cover | 3:1 | `aspect-[3/1]` |

```tsx
// Hero image — 16:9 with blurhash
export function HeroImage({ uri, blurhash }: { uri: string; blurhash?: string }) {
  return (
    <View className="w-full aspect-video overflow-hidden rounded-2xl">
      <Image
        source={uri}
        placeholder={blurhash ? { blurhash, width: 16, height: 9 } : undefined}
        placeholderContentFit="cover"
        contentFit="cover"
        transition={400}
        priority="high"
        className="flex-1"
      />
    </View>
  );
}
```

### Gradient Overlays for Text-over-Image

```tsx
// components/HeroCard.tsx — image + gradient scrim + text overlay
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';

cssInterop(Image, { className: 'style' });

interface HeroCardProps {
  imageUri: string;
  blurhash?: string;
  title: string;
  subtitle?: string;
  badge?: string;
}

export function HeroCard({ imageUri, blurhash, title, subtitle, badge }: HeroCardProps) {
  return (
    <View className="w-full aspect-video rounded-2xl overflow-hidden">
      {/* Base image */}
      <Image
        source={imageUri}
        placeholder={blurhash ? { blurhash, width: 16, height: 9 } : undefined}
        placeholderContentFit="cover"
        contentFit="cover"
        transition={400}
        priority="high"
        className="absolute inset-0 w-full h-full"
      />

      {/* Bottom-to-top gradient scrim — makes text legible */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', inset: 0 }}  // LinearGradient uses style, not className
      />

      {/* Text content — sits on top of gradient */}
      <View className="absolute bottom-0 left-0 right-0 p-4 gap-1">
        {badge ? (
          <View className="self-start bg-white/20 rounded-full px-2 py-0.5 mb-1">
            <Text className="text-white text-xs font-semibold uppercase tracking-wide">
              {badge}
            </Text>
          </View>
        ) : null}
        <Text className="text-white text-xl font-bold leading-tight" numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-white/70 text-sm" numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
```

### Gradient Recipe Quick Reference

```tsx
// Bottom-to-top black scrim (most common for text readability)
colors={['transparent', 'rgba(0,0,0,0.8)']}

// Top-to-bottom (for header overlay / top badges)
colors={['rgba(0,0,0,0.6)', 'transparent']}

// Three-stop scrim (transparent middle keeps image visible in center)
colors={['transparent', 'transparent', 'rgba(0,0,0,0.9)']}
locations={[0, 0.4, 1]}

// Color wash (branded overlay)
colors={['rgba(99,102,241,0.6)', 'rgba(139,92,246,0.8)']}
```

### Image Fallback Patterns

```tsx
// Pattern A — Avatar with initials fallback (most common)
// components/AvatarImage.tsx
import { useState, useMemo } from 'react';
import { Image } from 'expo-image';
import { View, Text } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(Image, { className: 'style' });

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
];

function getColorForName(name: string): string {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
}

export function AvatarImage({ uri, name, size = 48 }: { uri?: string; name: string; size?: number }) {
  const [hasError, setHasError] = useState(!uri);
  const initials = useMemo(() => getInitials(name), [name]);
  const bgColor = useMemo(() => getColorForName(name), [name]);
  const containerStyle = { width: size, height: size, borderRadius: size / 2 };

  if (hasError || !uri) {
    return (
      <View style={[containerStyle, { backgroundColor: bgColor }]} className="items-center justify-center">
        <Text className="text-white font-bold" style={{ fontSize: size * 0.35 }}>{initials}</Text>
      </View>
    );
  }

  return (
    <View style={containerStyle} className="overflow-hidden">
      <Image
        source={uri}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onError={() => setHasError(true)}
        style={{ width: size, height: size }}
      />
    </View>
  );
}
```

### Mock Image URLs (Picsum — no API key needed)

```ts
// utils/mockImages.ts
// Deterministic seeds = same image every run = no layout shift during dev
export const picsum = (w: number, h: number, seed?: string | number) =>
  seed ? `https://picsum.photos/seed/${seed}/${w}/${h}` : `https://picsum.photos/${w}/${h}`;

// Pre-built sets — use these for realistic mock data
export const HERO_IMAGES  = Array.from({ length: 10 }, (_, i) => picsum(800, 450, `hero-${i}`));
export const FEED_IMAGES  = Array.from({ length: 20 }, (_, i) => picsum(400, 500, `feed-${i}`));
export const AVATAR_IMAGES = Array.from({ length: 50 }, (_, i) => picsum(128, 128, `avatar-${i}`));
```

---

## Component Recipes

> **Light mode parity rule:** Every recipe below includes BOTH dark and light mode classes. The pattern is: `bg-white dark:bg-gray-900`, `text-gray-900 dark:text-white`, `border-gray-200 dark:border-white/8`.

### ScreenWrapper (mandatory for every screen)

Pre-built component at `@/components/ui/screen-wrapper`. Use as the root of every screen file instead of manually combining SafeAreaView + ScrollView + padding.

```tsx
import { ScreenWrapper } from '@/components/ui/screen-wrapper';

// Scrollable screen (default) — use when content could overflow viewport
export default function DashboardScreen() {
  return (
    <ScreenWrapper>
      <View className="p-4 gap-4">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</Text>
        {/* cards, charts, lists... */}
      </View>
    </ScreenWrapper>
  );
}

// Fixed-layout screen — use when content fits within viewport
export default function CameraScreen() {
  return (
    <ScreenWrapper scrollable={false}>
      <CameraView style={{ flex: 1 }} />
    </ScreenWrapper>
  );
}

// No tab-bar padding (e.g. modal, standalone screen)
export default function ModalScreen() {
  return (
    <ScreenWrapper padBottom={false}>
      {/* ... */}
    </ScreenWrapper>
  );
}
```

**Props:**
| Prop | Type | Default | Purpose |
|---|---|---|---|
| `scrollable` | `boolean` | `true` | Wraps children in ScrollView with vertical scroll |
| `padBottom` | `boolean` | `true` | Adds bottom padding (insets + 100) for tab bar clearance |
| `className` | `string` | — | Additional className for the root container |

**Decision guide:**
- Content could overflow viewport → `<ScreenWrapper>` (default)
- Content clearly fits (2-3 cards, camera, map) → `<ScreenWrapper scrollable={false}>`
- Modal or standalone screen without tab bar → `<ScreenWrapper padBottom={false}>`
- NEVER wrap in ScreenWrapper AND also wrap children in ScrollView — that double-wraps

### Interaction Essentials

Every tappable element MUST include feedback and accessibility:

```tsx
import { Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

// Standard pressable wrapper — use for ALL interactive elements
<Pressable
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleAction();
  }}
  className="active:opacity-70"
  accessibilityRole="button"
  accessibilityLabel="Descriptive label"
>
  {children}
</Pressable>
```

**Rules:**
- `active:opacity-70` on every `<Pressable>` — non-negotiable
- `Haptics.impactAsync(Light)` for normal taps, `Medium` for destructive/important actions
- `accessibilityRole` + `accessibilityLabel` on every interactive element
- Never use `TouchableOpacity` — always `Pressable` with NativeWind classes
- Swipe-to-delete: use `react-native-gesture-handler` with `Haptics.notificationAsync(Warning)`

### Card

```tsx
// When to use: any content that floats on the background surface — stat summaries,
// featured items, grouped info. DO NOT use cards for every list item — use ListItem for lists.

import { View, Text } from 'react-native';

export function Card({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8">
      {title ? (
        <Text className="text-gray-900 dark:text-white text-base font-semibold">{title}</Text>
      ) : null}
      {subtitle ? (
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{subtitle}</Text>
      ) : null}
      {children ? <View className="mt-3">{children}</View> : null}
    </View>
  );
}

// Light mode: white card on gray-50 background — uses subtle border
// Dark mode: gray-900 card on gray-950 background — uses white/8 border
```

---

### ListItem (iOS Settings-style row with icon)

```tsx
// When to use: ANY tappable row in a list — settings rows, habit rows, transaction rows,
// menu items. This is the single most-used component in an iOS app.
// Height is min 44pt (h-11) to meet HIG touch target requirements.

import { View, Text, Pressable } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface ListItemProps {
  icon: React.ReactNode;
  iconBg?: string;    // tailwind bg class e.g. "bg-orange-500/15"
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightElement?: React.ReactNode;
}

export function ListItem({
  icon,
  iconBg = 'bg-gray-100 dark:bg-gray-700',
  label,
  sublabel,
  value,
  onPress,
  showChevron = true,
  rightElement,
}: ListItemProps) {
  return (
    <Pressable
      className="flex-row items-center px-4 py-3 min-h-[44px] active:bg-gray-100/80 dark:active:bg-gray-800/50"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {/* Icon container */}
      <View className={`w-9 h-9 rounded-lg items-center justify-center ${iconBg} mr-3`}>
        {icon}
      </View>

      {/* Label area */}
      <View className="flex-1">
        <Text className="text-gray-900 dark:text-white text-base font-normal">{label}</Text>
        {sublabel ? (
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{sublabel}</Text>
        ) : null}
      </View>

      {/* Right side */}
      {rightElement ? rightElement : null}
      {value ? (
        <Text className="text-gray-500 dark:text-gray-400 text-base mr-2">{value}</Text>
      ) : null}
      {showChevron && onPress ? (
        <ChevronRight size={16} color="#9ca3af" />
      ) : null}
    </Pressable>
  );
}

// Usage:
// import { Bell } from 'lucide-react-native';
// <ListItem
//   icon={<Bell size={18} color="#f97316" />}
//   iconBg="bg-orange-500/15"
//   label="Notifications"
//   sublabel="Reminders and alerts"
//   onPress={() => router.push('/notifications')}
// />
```

---

### ListSection (grouped section with header)

```tsx
// When to use: grouping related ListItems together, iOS Settings-style.
// The section has a header label and an optional footer note.

import { View, Text } from 'react-native';

interface ListSectionProps {
  header?: string;
  footer?: string;
  children: React.ReactNode;
}

export function ListSection({ header, footer, children }: ListSectionProps) {
  return (
    <View className="mb-6">
      {header ? (
        <Text className="text-gray-500 dark:text-gray-500 text-sm font-medium uppercase tracking-wider px-4 mb-2">
          {header}
        </Text>
      ) : null}

      {/* Card container — children separated by hairline dividers */}
      <View className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-white/8 mx-4">
        {children}
      </View>

      {footer ? (
        <Text className="text-gray-500 dark:text-gray-500 text-sm px-4 mt-2">{footer}</Text>
      ) : null}
    </View>
  );
}

// Usage with dividers between items:
// <ListSection header="Appearance" footer="Changes apply immediately.">
//   <ListItem label="Dark Mode" icon={<Moon size={18} color="#a78bfa" />} iconBg="bg-violet-500/15" showChevron={false} rightElement={<Switch />} />
//   <View className="h-px bg-gray-200 dark:bg-white/8 ml-[52px]" />
//   <ListItem label="App Icon" icon={<Smartphone size={18} color="#60a5fa" />} iconBg="bg-blue-500/15" value="Default" />
// </ListSection>
```

---

### StatCard (dashboard metric display)

```tsx
// When to use: displaying a single key metric on a dashboard — net worth, streak count,
// steps today, calories burned, transactions this month, etc.

import { View, Text, Pressable } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  sublabel?: string;
  accentClassName?: string;  // e.g. "text-orange-500 dark:text-orange-400"
  onPress?: () => void;
}

export function StatCard({
  label,
  value,
  change,
  changeType = 'neutral',
  sublabel,
  accentClassName = 'text-gray-900 dark:text-white',
  onPress,
}: StatCardProps) {
  const changeColor =
    changeType === 'positive' ? 'text-green-600 dark:text-green-400' :
    changeType === 'negative' ? 'text-red-600 dark:text-red-400' :
    'text-gray-500 dark:text-gray-400';

  const TrendIcon = changeType === 'positive' ? TrendingUp : TrendingDown;
  const trendIconColor = changeType === 'positive' ? '#16a34a' : '#dc2626';

  return (
    <Pressable
      className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8 active:bg-gray-50 dark:active:bg-gray-800"
      style={{
        // Light mode uses a drop shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }}
      onPress={onPress}
      accessible={true}
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">{label}</Text>
      <Text className={`text-3xl font-bold ${accentClassName}`}>{value}</Text>

      {change ? (
        <View className="flex-row items-center gap-1 mt-1">
          {changeType !== 'neutral' ? (
            <TrendIcon size={12} color={trendIconColor} />
          ) : null}
          <Text className={`text-sm font-medium ${changeColor}`}>{change}</Text>
          {sublabel ? (
            <Text className="text-gray-400 dark:text-gray-500 text-sm">{sublabel}</Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

// Usage:
// <StatCard label="Net Worth" value="$48,291" change="+$1,204" changeType="positive" sublabel="this month" />
// <StatCard label="Current Streak" value="23" change="days" changeType="neutral" accentClassName="text-orange-500 dark:text-orange-400" />
```

---

### EmptyState (basic)

```tsx
// When to use: every screen that can have zero items MUST have an empty state.
// NEVER show a blank screen. Every empty state needs:
//   1. An icon (large, muted)
//   2. A title (bold, 3-5 words)
//   3. A description (1-2 sentences)
//   4. An optional CTA button

import { View, Text, Pressable } from 'react-native';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {/* Large muted icon */}
      <View className="mb-4 opacity-30">
        {icon}
      </View>

      {/* Title */}
      <Text className="text-gray-900 dark:text-white text-xl font-semibold text-center mb-2">
        {title}
      </Text>

      {/* Description */}
      <Text className="text-gray-500 dark:text-gray-400 text-base text-center leading-6 mb-6">
        {description}
      </Text>

      {/* Optional CTA */}
      {ctaLabel && onCta ? (
        <Pressable
          className="bg-gray-100 dark:bg-gray-800 rounded-xl px-6 py-3 border border-gray-200 dark:border-white/10 active:bg-gray-200 dark:active:bg-gray-700"
          onPress={onCta}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
        >
          <Text className="text-gray-900 dark:text-white text-base font-semibold">{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

---

### ScreenHeader (large title with optional back button and action)

```tsx
// When to use: at the top of every main tab screen (large title pattern) OR
// pushed navigation screens (inline title + back button).

import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightIcon?: React.ReactNode;
  onRightAction?: () => void;
  rightLabel?: string;
  large?: boolean; // large = 34pt bold, false = 17pt semibold inline
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightIcon,
  onRightAction,
  rightLabel,
  large = true,
}: ScreenHeaderProps) {
  return (
    <View className="px-4 pt-2 pb-3">
      {/* Nav row */}
      <View className="flex-row items-center justify-between mb-1">
        {/* Left: back button */}
        {showBack ? (
          <Pressable
            className="flex-row items-center gap-1 -ml-1 min-w-[44px] min-h-[44px] items-center"
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={24} color="#60a5fa" />
            <Text className="text-blue-500 dark:text-blue-400 text-base">Back</Text>
          </Pressable>
        ) : (
          <View className="w-11" />
        )}

        {/* Right: action button */}
        {(rightIcon || rightLabel) && onRightAction ? (
          <Pressable
            className="min-w-[44px] min-h-[44px] items-center justify-center"
            onPress={onRightAction}
            accessibilityRole="button"
            accessibilityLabel={rightLabel ?? 'Action'}
          >
            {rightIcon ? rightIcon : null}
            {rightLabel && !rightIcon ? (
              <Text className="text-blue-500 dark:text-blue-400 text-base font-semibold">{rightLabel}</Text>
            ) : null}
          </Pressable>
        ) : (
          <View className="w-11" />
        )}
      </View>

      {/* Title */}
      {large ? (
        <Text
          className="text-gray-900 dark:text-white text-3xl font-bold mt-1"
          accessibilityRole="header"
        >
          {title}
        </Text>
      ) : (
        <Text
          className="text-gray-900 dark:text-white text-base font-semibold text-center"
          accessibilityRole="header"
        >
          {title}
        </Text>
      )}

      {subtitle ? (
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{subtitle}</Text>
      ) : null}
    </View>
  );
}
```

---

### FormInput

```tsx
// When to use: any text input in a form.
// Includes label, helper text, and error state.
// Both dark and light mode styled.

import { View, Text, TextInput } from 'react-native';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  helper?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  leftIcon?: React.ReactNode;
}

export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  helper,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  leftIcon,
}: FormInputProps) {
  const hasError = Boolean(error);

  return (
    <View className="gap-1.5">
      <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium">{label}</Text>

      <View
        className={`flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl border ${
          hasError
            ? 'border-red-500'
            : 'border-gray-200 dark:border-white/10'
        } px-4 ${multiline ? 'py-3 items-start' : 'py-0'}`}
        style={{ minHeight: 48 }}
      >
        {leftIcon ? <View className="mr-3 mt-0.5">{leftIcon}</View> : null}
        <TextInput
          className="flex-1 text-gray-900 dark:text-white text-base"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          style={{ minHeight: multiline ? 80 : 44 }}
        />
      </View>

      {error ? (
        <Text className="text-red-500 dark:text-red-400 text-sm">{error}</Text>
      ) : helper ? (
        <Text className="text-gray-500 dark:text-gray-500 text-sm">{helper}</Text>
      ) : null}
    </View>
  );
}
```

---

### PrimaryButton

```tsx
// When to use: the MAIN call-to-action on a screen. One PrimaryButton per screen max.
// Height is 52pt to feel substantial.

import { Pressable, Text, ActivityIndicator } from 'react-native';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accentClassName?: string;  // e.g. "bg-orange-500 active:bg-orange-600"
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  accentClassName = 'bg-blue-500 active:bg-blue-600',
  fullWidth = true,
  icon,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`${fullWidth ? 'w-full' : 'self-start'} h-[52px] rounded-2xl items-center justify-center flex-row gap-2
        ${accentClassName}
        ${isDisabled ? 'opacity-50' : ''}`}
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <>
          {icon ? icon : null}
          <Text className="text-white text-base font-semibold">{label}</Text>
        </>
      )}
    </Pressable>
  );
}
```

---

### SecondaryButton

```tsx
// When to use: secondary action — "Cancel", "Skip", "Learn More".
// Both dark and light mode: styled against their respective backgrounds.

import { Pressable, Text } from 'react-native';

export function SecondaryButton({
  label,
  onPress,
  disabled = false,
  fullWidth = true,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      className={`${fullWidth ? 'w-full' : 'self-start'} h-[48px] rounded-2xl items-center justify-center
        bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10
        active:bg-gray-200 dark:active:bg-gray-700
        ${disabled ? 'opacity-50' : ''}`}
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className="text-gray-900 dark:text-gray-200 text-base font-semibold">{label}</Text>
    </Pressable>
  );
}
```

---

### DestructiveButton

```tsx
// When to use: ONLY for irreversible destructive actions — delete, remove account, clear all data.
// Always put after a cancel option. Never as the primary button.

import { Pressable, Text } from 'react-native';
import { Trash2 } from 'lucide-react-native';

export function DestructiveButton({
  label,
  onPress,
  fullWidth = true,
}: {
  label: string;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      className={`${fullWidth ? 'w-full' : 'self-start'} h-[48px] rounded-2xl items-center justify-center flex-row gap-2
        bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30
        active:bg-red-100 dark:active:bg-red-500/25`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Trash2 size={18} color="#ef4444" />
      <Text className="text-red-600 dark:text-red-400 text-base font-semibold">{label}</Text>
    </Pressable>
  );
}
```

---

### Badge

```tsx
// When to use: status indicators, category tags, pill labels, counts.

import { View, Text } from 'react-native';

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'error';

const badgeStyles: Record<BadgeVariant, { container: string; text: string }> = {
  default:  { container: 'bg-gray-100 dark:bg-gray-700',     text: 'text-gray-600 dark:text-gray-300' },
  accent:   { container: 'bg-blue-100 dark:bg-blue-500/15',  text: 'text-blue-700 dark:text-blue-400' },
  success:  { container: 'bg-green-100 dark:bg-green-500/15', text: 'text-green-700 dark:text-green-400' },
  warning:  { container: 'bg-amber-100 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-400' },
  error:    { container: 'bg-red-100 dark:bg-red-500/15',    text: 'text-red-700 dark:text-red-400' },
};

export function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const styles = badgeStyles[variant];
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${styles.container}`}>
      <Text className={`text-xs font-semibold ${styles.text}`}>{label}</Text>
    </View>
  );
}
```

---

### Avatar

```tsx
// When to use: user profile photo, contact images. Has initials fallback.
// Sizes: sm (32pt), md (40pt), lg (56pt), xl (80pt).

import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { cssInterop } from 'nativewind';

cssInterop(Image, { className: 'style' });

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const avatarSizes: Record<AvatarSize, { container: string; text: string; px: number }> = {
  sm: { container: 'w-8 h-8',   text: 'text-sm',   px: 32 },
  md: { container: 'w-10 h-10', text: 'text-base',  px: 40 },
  lg: { container: 'w-14 h-14', text: 'text-xl',    px: 56 },
  xl: { container: 'w-20 h-20', text: 'text-2xl',   px: 80 },
};

export function Avatar({
  uri,
  initials = '?',
  size = 'md',
  bgClassName = 'bg-blue-100 dark:bg-blue-500/20',
}: {
  uri?: string;
  initials?: string;
  size?: AvatarSize;
  bgClassName?: string;
}) {
  const { container, text, px } = avatarSizes[size];

  return (
    <View className={`${container} rounded-full overflow-hidden ${!uri ? bgClassName : ''} items-center justify-center`}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: px, height: px }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <Text className={`text-gray-700 dark:text-white font-semibold ${text}`}>
          {initials.slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
```

---

### FAB (Floating Action Button)

```tsx
// When to use: the primary creation action on a list screen.
// Position bottom-right, above tab bar.

import { Pressable } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FAB({
  onPress,
  icon,
  accentClassName = 'bg-blue-500',
  accessibilityLabel = 'Add new item',
}: {
  onPress: () => void;
  icon?: React.ReactNode;
  accentClassName?: string;
  accessibilityLabel?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      className={`absolute right-5 w-14 h-14 rounded-full items-center justify-center ${accentClassName} active:opacity-90`}
      style={{
        bottom: insets.bottom + 24 + 49, // 49 = tab bar height
        // Shadow visible in both modes; more prominent in light
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {icon ?? <Plus size={24} color="white" strokeWidth={2.5} />}
    </Pressable>
  );
}
```

---

### TabBar (custom, used with @react-navigation/bottom-tabs)

```tsx
// When to use: pass as tabBar prop to Tab.Navigator.
// iOS pattern: icon fill state changes on active tab, no background rectangle.

import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-white/8"
      style={{ paddingBottom: insets.bottom }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <Pressable
            key={route.key}
            className="flex-1 items-center justify-center py-2 min-h-[49px]"
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
            accessibilityState={{ selected: isFocused }}
          >
            {options.tabBarIcon?.({
              focused: isFocused,
              color: isFocused ? '#60a5fa' : '#9ca3af',
              size: 24,
            })}
            <Text
              className={`text-xs mt-0.5 font-medium ${
                isFocused
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
              maxFontSizeMultiplier={1.2}
            >
              {options.tabBarLabel as string ?? route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
```

---

### BottomSheet Content

```tsx
// When to use: contextual action sheet, picker, or detailed view that slides up.
// Uses @gorhom/bottom-sheet. The BottomSheetView root needs StyleSheet (not className).

import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { View, Text, StyleSheet } from 'react-native';
import { useRef, useCallback } from 'react';

export function useHabitActionSheet() {
  const sheetRef = useRef<BottomSheet>(null);

  const open = useCallback(() => sheetRef.current?.snapToIndex(0), []);
  const close = useCallback(() => sheetRef.current?.close(), []);

  const Sheet = ({ habitName }: { habitName: string }) => (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['40%']}
      enablePanDownToClose
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
      accessibilityViewIsModal={true}
    >
      <BottomSheetView style={styles.content}>
        {/* Header */}
        <View className="items-center mb-2">
          <Text className="text-gray-900 dark:text-white text-lg font-semibold">{habitName}</Text>
        </View>

        {/* Actions */}
        <View className="gap-1 mt-2">
          <View className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
            <Text className="text-gray-900 dark:text-white text-base px-4 py-3">Edit habit</Text>
            <View className="h-px bg-gray-200 dark:bg-white/8 mx-4" />
            <Text className="text-gray-900 dark:text-white text-base px-4 py-3">View history</Text>
            <View className="h-px bg-gray-200 dark:bg-white/8 mx-4" />
            <Text className="text-red-600 dark:text-red-400 text-base px-4 py-3">Delete habit</Text>
          </View>

          <View className="bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden mt-3">
            <Text className="text-gray-700 dark:text-gray-300 text-base px-4 py-3 text-center font-semibold">Cancel</Text>
          </View>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );

  return { Sheet, open, close };
}

const styles = StyleSheet.create({
  bg: { backgroundColor: '#ffffff' }, // Light mode; override with colorScheme logic for dark
  handle: { backgroundColor: '#d1d5db', width: 36, height: 4 },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 32 },
});
```

---

### ProgressRing

```tsx
// When to use: displaying completion percentage for habits, fitness goals, budgets.
// Pure react-native-svg — works on web AND native.

import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { useEffect } from 'react';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: number;     // 0 to 1
  radius?: number;
  strokeWidth?: number;
  color?: string;       // hex string — SVG doesn't use Tailwind
  trackColor?: string;
  label?: string;       // center label e.g. "72%"
  sublabel?: string;
}

export function ProgressRing({
  progress,
  radius = 52,
  strokeWidth = 8,
  color = '#f97316',
  trackColor = '#e5e7eb', // gray-200 for light, caller should override for dark
  label,
  sublabel,
}: ProgressRingProps) {
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(progress, { duration: 800, easing: Easing.out(Easing.cubic) });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [circumference * fill.value, circumference],
  }));

  const size = radius * 2;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg style={{ position: 'absolute' }} width={size} height={size}>
        <Circle r={innerRadius} cx={radius} cy={radius} fill="transparent" stroke={trackColor} strokeWidth={strokeWidth} />
        <AnimatedCircle
          r={innerRadius} cx={radius} cy={radius}
          fill="transparent" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          rotation="-90" originX={radius} originY={radius}
          animatedProps={animatedProps}
        />
      </Svg>
      {label ? (
        <View className="items-center">
          <Text className="text-gray-900 dark:text-white font-bold text-xl">{label}</Text>
          {sublabel ? <Text className="text-gray-500 dark:text-gray-400 text-xs">{sublabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

// Usage:
// <ProgressRing progress={0.72} label="72%" sublabel="Complete" color="#f97316" trackColor="#374151" />
// In light mode, use trackColor="#e5e7eb" (gray-200)
// In dark mode, use trackColor="#374151" (gray-700)
```

---

### SkeletonLoader

```tsx
// When to use: any screen that loads data async — show skeletons during loading,
// then swap in real content. NEVER use a spinner on a content screen.

import { View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
}: {
  width?: string | number;
  height: number;
  borderRadius?: number;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1.0, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        // Light: gray-200 skeleton; Dark: gray-700 skeleton
        { height, borderRadius, width: width as any },
        animStyle,
      ]}
      className="bg-gray-200 dark:bg-gray-700"
    />
  );
}

export function ListItemSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-3 gap-3">
      <SkeletonBox width={36} height={36} borderRadius={10} />
      <View className="flex-1 gap-2">
        <SkeletonBox height={14} borderRadius={4} width="65%" />
        <SkeletonBox height={10} borderRadius={4} width="40%" />
      </View>
    </View>
  );
}

export function StatCardSkeleton() {
  return (
    <View className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8 gap-2">
      <SkeletonBox height={12} borderRadius={4} width="45%" />
      <SkeletonBox height={32} borderRadius={6} width="65%" />
      <SkeletonBox height={10} borderRadius={4} width="30%" />
    </View>
  );
}

export function ScreenSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View className="flex-1">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </View>
  );
}
```

---

### Divider

```tsx
// When to use: separating list items within a card container.

import { View } from 'react-native';

export function Divider({ inset = 52 }: { inset?: number }) {
  return (
    <View
      className="h-px bg-gray-200 dark:bg-white/8"
      style={{ marginLeft: inset }}
    />
  );
}

export function FullDivider() {
  return <View className="h-px bg-gray-200 dark:bg-gray-800 w-full" />;
}
```

---

### IconContainer (colored icon background)

```tsx
// When to use: the colored circle/square behind an icon in list rows, cards, or tabs.

import { View } from 'react-native';

type IconContainerShape = 'circle' | 'rounded';

export function IconContainer({
  children,
  bgClassName = 'bg-blue-100 dark:bg-blue-500/15',
  size = 36,
  shape = 'rounded',
}: {
  children: React.ReactNode;
  bgClassName?: string;
  size?: number;
  shape?: IconContainerShape;
}) {
  const borderRadius = shape === 'circle' ? size / 2 : 8;

  return (
    <View
      className={`items-center justify-center ${bgClassName}`}
      style={{ width: size, height: size, borderRadius }}
    >
      {children}
    </View>
  );
}
```

---

### SearchBar

```tsx
// When to use: filtering lists, finding transactions, searching habits.

import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search',
  onClear,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}) {
  return (
    <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 h-11 gap-2 border border-gray-200 dark:border-white/8">
      <Search size={16} color="#9ca3af" />
      <TextInput
        className="flex-1 text-gray-900 dark:text-white text-base"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => { onChangeText(''); onClear?.(); }}
          className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 items-center justify-center"
          accessibilityLabel="Clear search"
        >
          <X size={12} color="#6b7280" />
        </Pressable>
      ) : null}
    </View>
  );
}
```

---

### FormSection

```tsx
// When to use: grouping related form inputs.

import { View, Text } from 'react-native';

export function FormSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      {title ? (
        <Text className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 px-1">
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text className="text-gray-500 dark:text-gray-500 text-sm mb-3 px-1">{description}</Text>
      ) : null}
      <View className="gap-4">{children}</View>
    </View>
  );
}
```
## Screen Blueprints

> All blueprints now include light mode classes alongside dark mode. The pattern throughout: `bg-gray-50 dark:bg-gray-950` for screen backgrounds, `bg-white dark:bg-gray-900` for cards, `text-gray-900 dark:text-white` for primary text.

## Mock Data Initialization (CRITICAL)

> **The #1 reason AI apps look fake is empty screens.** Every app MUST render with rich, realistic data on first load. No empty states as default. No "add your first item" as the initial experience.

### Rules

1. **Initialize state directly with hardcoded seed data arrays.** Every `useState`, `useReducer`, or store MUST start with 5-8 realistic items — never an empty array.
2. **NEVER create data-fetching hooks that return empty initial state.** If you use custom hooks or stores, pre-populate them with seed data.
3. **NEVER let the default screen show an empty state.** Empty states exist for AFTER a user deletes all items — not as the first-load experience.
4. **Seed data MUST be domain-specific and varied:**
   - Real names (not "User 1"), real amounts (not "$0.00"), real dates (use relative dates like `new Date(Date.now() - 86400000 * 3)`)
   - Vary completion states: some done, some not, some in-progress
   - Vary numeric values: streaks of 3, 14, 23 — not all the same
   - Include edge cases: one item with a long name, one with max values
5. **Seed data belongs in the component file or a dedicated `data/` file** — inline constants are preferred over async fetching for demos.

### Seed Data Templates by Category

```ts
// Fitness / Habit tracking
const HABITS = [
  { id: '1', name: 'Morning run', emoji: '🏃', streak: 14, done: false, color: '#f97316' },
  { id: '2', name: 'Read 20 pages', emoji: '📚', streak: 8, done: true, color: '#60a5fa' },
  { id: '3', name: 'Meditate 10 min', emoji: '🧘', streak: 23, done: false, color: '#a78bfa' },
  { id: '4', name: 'Drink 8 glasses of water', emoji: '💧', streak: 6, done: true, color: '#22d3ee' },
  { id: '5', name: 'No social media before noon', emoji: '📵', streak: 3, done: false, color: '#4ade80' },
];

// Finance
const TRANSACTIONS = [
  { id: '1', name: 'Whole Foods Market', amount: -67.32, category: 'Groceries', date: new Date(Date.now() - 86400000), icon: '🛒' },
  { id: '2', name: 'Monthly Salary', amount: 4250.00, category: 'Income', date: new Date(Date.now() - 86400000 * 2), icon: '💰' },
  { id: '3', name: 'Netflix', amount: -15.99, category: 'Entertainment', date: new Date(Date.now() - 86400000 * 3), icon: '🎬' },
  { id: '4', name: 'Uber', amount: -23.50, category: 'Transport', date: new Date(Date.now() - 86400000 * 3), icon: '🚗' },
  { id: '5', name: 'Coffee Bean & Tea', amount: -5.75, category: 'Food & Drink', date: new Date(Date.now() - 86400000 * 4), icon: '☕' },
  { id: '6', name: 'Freelance Payment', amount: 850.00, category: 'Income', date: new Date(Date.now() - 86400000 * 5), icon: '💼' },
];

// Social
const POSTS = [
  { id: '1', user: { name: 'Sarah Chen', avatar: picsum(128, 128, 'sarah'), handle: '@sarahchen' }, image: picsum(400, 500, 'post1'), caption: 'Golden hour at the pier 🌅', likes: 234, comments: 18, timeAgo: '2h' },
  { id: '2', user: { name: 'Marcus Johnson', avatar: picsum(128, 128, 'marcus'), handle: '@marcusj' }, image: picsum(400, 500, 'post2'), caption: 'New recipe turned out amazing', likes: 89, comments: 7, timeAgo: '4h' },
  { id: '3', user: { name: 'Priya Patel', avatar: picsum(128, 128, 'priya'), handle: '@priyap' }, image: picsum(400, 500, 'post3'), caption: 'Weekend hike with the crew 🏔️', likes: 456, comments: 32, timeAgo: '6h' },
];

// E-commerce
const PRODUCTS = [
  { id: '1', name: 'Nike Air Max 270', price: 150, image: picsum(400, 400, 'shoe1'), rating: 4.8, reviews: 2341, brand: 'Nike' },
  { id: '2', name: 'Adidas Ultraboost 22', price: 190, image: picsum(400, 400, 'shoe2'), rating: 4.6, reviews: 1893, brand: 'Adidas' },
  { id: '3', name: 'New Balance 990v5', price: 175, image: picsum(400, 400, 'shoe3'), rating: 4.9, reviews: 876, brand: 'New Balance' },
  { id: '4', name: 'Converse Chuck 70', price: 85, image: picsum(400, 400, 'shoe4'), rating: 4.7, reviews: 3210, brand: 'Converse' },
  { id: '5', name: 'Vans Old Skool', price: 70, image: picsum(400, 400, 'shoe5'), rating: 4.5, reviews: 5678, brand: 'Vans' },
  { id: '6', name: 'Puma RS-X', price: 110, image: picsum(400, 400, 'shoe6'), rating: 4.3, reviews: 432, brand: 'Puma' },
];
```

### Initialization Pattern

```tsx
// ✅ CORRECT — state initialized with seed data, screens render populated immediately
const [habits, setHabits] = useState(SEED_HABITS);
const [transactions, setTransactions] = useState(SEED_TRANSACTIONS);

// ❌ WRONG — empty initial state, shows "Add your first habit" on load
const [habits, setHabits] = useState<Habit[]>([]);

// ❌ WRONG — async hook with no initial data, shows loading spinner then empty
const { data: habits = [] } = useQuery('habits', fetchHabits);

// ✅ CORRECT — if using hooks/stores, pre-populate with seed data
const useHabitStore = create<HabitStore>((set) => ({
  habits: SEED_HABITS,  // NOT: habits: []
  toggleHabit: (id) => set((s) => ({ habits: s.habits.map(h => h.id === id ? { ...h, done: !h.done } : h) })),
}));
```

### Anti-Patterns: Async Loading That Hides Data

```tsx
// ❌ WRONG — store starts empty, async loads later, first render shows loading/empty
const useFinanceStore = create((set) => ({
  transactions: [],       // ← PROBLEM: empty on first render
  isLoaded: false,        // ← PROBLEM: gates UI behind loading spinner
  init: async () => {
    const data = await AsyncStorage.getItem('transactions');
    set({ transactions: JSON.parse(data) || SEED_DATA, isLoaded: true });
  },
}));

// ❌ WRONG — screen gates all content behind isLoaded
if (!isLoaded) return <ActivityIndicator />;  // User sees spinner, then maybe empty

// ✅ CORRECT — store starts with seed data, async replaces it silently
const useFinanceStore = create((set) => ({
  transactions: SEED_TRANSACTIONS,  // ← Screens render immediately with data
  init: async () => {
    const stored = await AsyncStorage.getItem('transactions');
    if (stored) set({ transactions: JSON.parse(stored) });
    // If nothing stored, seed data is already displayed — no empty state ever
  },
}));
```

### Critical Rule: No `isLoaded` Boolean Gating

NEVER use an `isLoaded`, `isReady`, or `isInitialized` boolean to hide screen content behind a loading spinner. Instead:
1. Initialize ALL state with seed data (screens render instantly with realistic content)
2. Async operations (AsyncStorage, API calls) run in the background and replace seed data silently
3. The user NEVER sees an empty screen or a loading spinner as the first render

_

### Screen States

Every screen MUST handle all three states — build them all, not just the happy path:

```tsx
// Loading state — show skeleton, not spinner
function LoadingState() {
  return (
    <View className="gap-4 p-4">
      {[1, 2, 3].map(i => (
        <View key={i} className="h-20 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      ))}
    </View>
  );
}

// Empty state — always include illustration + CTA
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-16 h-16 rounded-full bg-blue-500/10 items-center justify-center mb-4">
        <Plus size={32} className="text-blue-500" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No items yet</Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">Tap the button below to add your first item</Text>
      <Pressable
        className="bg-blue-500 px-6 py-3 rounded-full active:opacity-70"
        onPress={onAdd}
      >
        <Text className="text-white font-semibold">Add First Item</Text>
      </Pressable>
    </View>
  );
}

// Error state — explain what happened + retry
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Something went wrong</Text>
      <Text className="text-gray-500 dark:text-gray-400 text-center mb-6">We couldn't load your data. Please try again.</Text>
      <Pressable
        className="bg-gray-200 dark:bg-gray-800 px-6 py-3 rounded-full active:opacity-70"
        onPress={onRetry}
      >
        <Text className="text-gray-900 dark:text-white font-semibold">Try Again</Text>
      </Pressable>
    </View>
  );
}
```

### Spacing & Layout Economy

Tight, intentional spacing separates polished apps from amateur ones:

```
Screen padding:     px-4 (16px) — never px-6 or px-8 on mobile
Section gap:        gap-6 (24px) between major sections
Card internal:      p-4 (16px) padding
List item height:   min-h-[56px] for tap targets
Between cards:      gap-3 (12px)
Icon-to-text:       gap-3 (12px)
Text stack:         gap-0.5 (2px) title-to-subtitle
```

**Economy rules:**
- One screen padding value — `px-4` everywhere, no exceptions
- Section gaps > card gaps > element gaps (visual hierarchy through spacing)
- Never `mb-2 mt-4` — use parent `gap-*` instead of individual margins
- Tab bar height: `h-20` (80px) with `pb-6` for home indicator

### Visual Coherence Checklist

Before finalizing any screen, verify:

- [ ] **One accent color** — not two, not three. One. Plus gray for secondary.
- [ ] **Consistent border radius** — `rounded-2xl` for cards, `rounded-full` for avatars/buttons, `rounded-xl` for smaller elements. Never mix.
- [ ] **Icon size consistency** — 20px for inline, 24px for navigation, 32px+ for empty states only.
- [ ] **Font weight hierarchy** — `font-bold` for screen title only, `font-semibold` for card titles, `font-medium` for labels, `font-normal` for body.
- [ ] **Dark + light classes on every element** — no exceptions.
- [ ] **No orphan elements** — every element belongs to a group (card, section, list).

### Surface Hierarchy

Mobile apps use exactly 3 surface levels — never more:

```
Level 0 (screen bg):  bg-gray-50 dark:bg-gray-950
Level 1 (cards):      bg-white dark:bg-gray-900
Level 2 (inset):      bg-gray-100 dark:bg-gray-800
```

**Rules:**
- Never put a card inside a card (Level 1 inside Level 1)
- Modals/sheets use Level 1 with `shadow-xl`
- Tab bar uses Level 1 with `border-t border-gray-200 dark:border-gray-800`
- Never use `bg-gray-50` (Level 0) inside a card — that creates a 4th level

### Color Differentiation

When showing categories, statuses, or types, use the semantic color set:

```tsx
// Category colors — pick from this set, never invent new ones
const CATEGORY_COLORS = {
  red:    { bg: 'bg-red-500/15',    text: 'text-red-500',    dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-500', dot: 'bg-orange-500' },
  amber:  { bg: 'bg-amber-500/15',  text: 'text-amber-500',  dot: 'bg-amber-500' },
  green:  { bg: 'bg-green-500/15',  text: 'text-green-500',  dot: 'bg-green-500' },
  blue:   { bg: 'bg-blue-500/15',   text: 'text-blue-500',   dot: 'bg-blue-500' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-500', dot: 'bg-purple-500' },
  pink:   { bg: 'bg-pink-500/15',   text: 'text-pink-500',   dot: 'bg-pink-500' },
  gray:   { bg: 'bg-gray-500/15',   text: 'text-gray-500',   dot: 'bg-gray-500' },
};

// Usage: status badges, category pills, chart segments
<View className={`px-2.5 py-1 rounded-full ${CATEGORY_COLORS.green.bg}`}>
  <Text className={`text-xs font-medium ${CATEGORY_COLORS.green.text}`}>Completed</Text>
</View>
```

### Blueprint 0: App Shell & Navigation

```tsx
// app/_layout.tsx — always the root layout
import { Stack } from 'expo-router';
import '../global.css';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

```tsx
// app/(tabs)/_layout.tsx — bottom tab bar
import { Tabs } from 'expo-router';
import { Home, Search, PlusCircle, Bell, User } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',  // Use platform detection for dark mode
          borderTopColor: '#e5e7eb',
          height: 80,
          paddingBottom: 24,  // Safe area for home indicator
        },
        tabBarActiveTintColor: '#3b82f6',  // Match app accent
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, size }) => (
            <View className="bg-blue-500 rounded-full p-2 -mt-2">
              <PlusCircle size={size} color="#ffffff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**Navigation patterns:**
- 3-5 tabs maximum. 5 is the iOS standard. Never 2 or 6+.
- Center tab can be elevated (floating action) for primary creation action
- Tab icons: 24px from `lucide-react-native`, always outlined (never filled) for inactive
- Active tab: accent color icon + label. Inactive: `gray-400`.
- Stack navigation within tabs for drill-down screens
- Modal presentation for creation flows (prevents losing tab context)

### Blueprint 1: List Screen (habit list, todo list, transaction list)

```tsx
// app/(tabs)/today.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CheckCircle2, Circle, Flame } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HABITS = [
  { id: '1', name: 'Morning run', streak: 14, done: false, color: '#f97316', bgColor: '#f9731620' },
  { id: '2', name: 'Read 20 pages', streak: 8, done: true, color: '#60a5fa', bgColor: '#60a5fa20' },
  { id: '3', name: 'Meditate 10 min', streak: 23, done: false, color: '#a78bfa', bgColor: '#a78bfa20' },
  { id: '4', name: 'Drink 8 glasses', streak: 6, done: true, color: '#22d3ee', bgColor: '#22d3ee20' },
  { id: '5', name: 'No social media', streak: 3, done: false, color: '#4ade80', bgColor: '#4ade8020' },
];

type Habit = typeof HABITS[0];

function HabitRow({ habit, onToggle }: { habit: Habit; onToggle: (id: string) => void }) {
  return (
    <Pressable
      className="flex-row items-center px-4 py-3 active:bg-gray-100 dark:active:bg-gray-800/50"
      onPress={() => onToggle(habit.id)}
      accessibilityLabel={`${habit.name}, ${habit.done ? 'completed' : 'not completed'}`}
      accessibilityRole="button"
    >
      <Pressable
        className="mr-3"
        onPress={() => onToggle(habit.id)}
        accessibilityLabel={habit.done ? 'Mark incomplete' : 'Mark complete'}
      >
        {habit.done
          ? <CheckCircle2 size={28} color={habit.color} fill={habit.color} />
          : <Circle size={28} color="#9ca3af" />}
      </Pressable>

      <View className="flex-1">
        <Text
          className={`text-base ${
            habit.done
              ? 'text-gray-400 dark:text-gray-500 line-through'
              : 'text-gray-900 dark:text-white font-normal'
          }`}
        >
          {habit.name}
        </Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          <Flame size={12} color={habit.streak > 7 ? '#f97316' : '#9ca3af'} />
          <Text className={`text-sm ${habit.streak > 7 ? 'text-orange-500 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {habit.streak} day streak
          </Text>
        </View>
      </View>

      {habit.done ? (
        <View className="bg-green-100 dark:bg-green-500/15 rounded-full px-2.5 py-0.5">
          <Text className="text-xs font-semibold text-green-700 dark:text-green-400">Done</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function TodayScreen() {
  const [habits, setHabits] = useState(HABITS);
  const insets = useSafeAreaInsets();
  const completed = habits.filter(h => h.done).length;
  const progress = completed / habits.length;
  const isEmpty = habits.length === 0;

  const toggleHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-gray-900 dark:text-white text-3xl font-bold" accessibilityRole="header">
          Today
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>

        {/* Progress bar */}
        <View className="mt-4">
          <View className="flex-row justify-between mb-1.5">
            <Text className="text-gray-500 dark:text-gray-400 text-sm">{completed} of {habits.length} complete</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">{Math.round(progress * 100)}%</Text>
          </View>
          <View className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <View
              className="h-full bg-orange-500 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </View>
        </View>
      </View>

      {/* List */}
      {isEmpty ? (
        <View className="flex-1 items-center justify-center px-8 py-16">
          <Text className="text-gray-400 dark:text-gray-600 text-xl font-semibold text-center mb-2">No habits yet</Text>
          <Text className="text-gray-500 dark:text-gray-500 text-base text-center">Add your first habit to start building streaks.</Text>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <HabitRow habit={item} onToggle={toggleHabit} />}
          ItemSeparatorComponent={() => <View className="h-px bg-gray-200 dark:bg-gray-800/80 ml-[52px]" />}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshing={false}
          onRefresh={() => {}}
        />
      )}

      {/* FAB */}
      <Pressable
        className="absolute right-5 w-14 h-14 rounded-full bg-orange-500 items-center justify-center active:bg-orange-600"
        style={{
          bottom: insets.bottom + 24 + 49,
          shadowColor: '#f97316',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
        onPress={() => {/* navigate to add */}}
        accessibilityRole="button"
        accessibilityLabel="Add new habit"
      >
        <Plus size={24} color="white" strokeWidth={2.5} />
      </Pressable>
    </SafeAreaView>
  );
}
```

---

### Blueprint 2: Detail Screen (habit detail, transaction detail)

```tsx
// app/habit/[id].tsx
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Flame, Calendar, TrendingUp, MoreHorizontal } from 'lucide-react-native';

const HABIT = {
  name: 'Morning run', streak: 14, bestStreak: 23, completionRate: 0.87,
  totalDays: 52, description: 'Run at least 2km before breakfast. No excuses.',
  color: '#f97316', daysThisWeek: [true, true, false, true, true, true, false],
};

function WeekDot({ filled, color, dayLabel }: { filled: boolean; color: string; dayLabel: string }) {
  return (
    <View className="items-center gap-1.5">
      <View
        className={`w-8 h-8 rounded-full ${filled ? '' : 'border border-gray-300 dark:border-gray-700'}`}
        style={filled ? { backgroundColor: color } : undefined}
      />
      <Text className="text-gray-400 dark:text-gray-500 text-xs">{dayLabel}</Text>
    </View>
  );
}

export default function HabitDetailScreen() {
  const router = useRouter();
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top', 'bottom']}>
      {/* Navigation bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          className="flex-row items-center gap-1 min-w-[44px] min-h-[44px]"
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#60a5fa" />
          <Text className="text-blue-500 dark:text-blue-400 text-base">Today</Text>
        </Pressable>
        <Pressable className="w-10 h-10 items-center justify-center" accessibilityRole="button" accessibilityLabel="More options">
          <MoreHorizontal size={22} color="#9ca3af" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero section */}
        <View className="px-4 pb-6">
          <View className="w-14 h-14 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: `${HABIT.color}25` }}>
            <Flame size={28} color={HABIT.color} />
          </View>
          <Text className="text-gray-900 dark:text-white text-3xl font-bold mb-1" accessibilityRole="header">
            {HABIT.name}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-base">{HABIT.description}</Text>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 px-4 mb-4">
          {[
            { label: 'Current streak', value: HABIT.streak, unit: 'days' },
            { label: 'Best streak', value: HABIT.bestStreak, unit: 'days' },
            { label: 'Completion', value: Math.round(HABIT.completionRate * 100) + '%', unit: 'all time' },
          ].map(stat => (
            <View key={stat.label} className="flex-1 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8">
              <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">{stat.label}</Text>
              <Text className="text-gray-900 dark:text-white text-2xl font-bold" style={{ color: HABIT.color }}>
                {stat.value}
              </Text>
              <Text className="text-gray-400 dark:text-gray-500 text-xs">{stat.unit}</Text>
            </View>
          ))}
        </View>

        {/* This week */}
        <View className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8">
          <Text className="text-gray-900 dark:text-white text-base font-semibold mb-4">This week</Text>
          <View className="flex-row justify-between">
            {HABIT.daysThisWeek.map((filled, i) => (
              <WeekDot key={i} filled={filled} color={HABIT.color} dayLabel={days[i]} />
            ))}
          </View>
        </View>

        {/* Progress bar */}
        <View className="mx-4 mb-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8">
          <View className="flex-row items-center gap-2 mb-3">
            <TrendingUp size={18} color={HABIT.color} />
            <Text className="text-gray-900 dark:text-white text-base font-semibold">All-time progress</Text>
          </View>
          <View className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${HABIT.completionRate * 100}%`, backgroundColor: HABIT.color }}
            />
          </View>
          <Text className="text-gray-500 dark:text-gray-500 text-sm mt-2">{HABIT.totalDays} total completions</Text>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### Blueprint 3: Dashboard / Stats Screen

```tsx
// app/(tabs)/dashboard.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, DollarSign, CreditCard, PiggyBank, ArrowUpRight } from 'lucide-react-native';

const STATS = {
  netWorth: '$48,291', netWorthChange: '+$1,204',
  income: '$6,800', expenses: '$3,247', savings: '$1,553',
};

const TRANSACTIONS = [
  { id: '1', merchant: 'Whole Foods Market', category: 'Groceries', amount: '-$94.32', date: 'Today', color: '#22c55e', positive: false },
  { id: '2', merchant: 'Stripe Inc.', category: 'Income', amount: '+$3,400.00', date: 'Yesterday', color: '#60a5fa', positive: true },
  { id: '3', merchant: 'Netflix', category: 'Subscriptions', amount: '-$15.99', date: 'Jan 12', color: '#ef4444', positive: false },
  { id: '4', merchant: 'Equinox Fitness', category: 'Health', amount: '-$210.00', date: 'Jan 11', color: '#f97316', positive: false },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="px-4 pt-2 pb-2">
          <Text className="text-gray-500 dark:text-gray-400 text-sm">January 2025</Text>
          <Text className="text-gray-900 dark:text-white text-3xl font-bold mt-0.5" accessibilityRole="header">
            Overview
          </Text>
        </View>

        {/* Hero stat */}
        <View
          className="mx-4 mt-3 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-white/8"
          accessible={true}
          accessibilityLabel={`Net Worth: ${STATS.netWorth}, up ${STATS.netWorthChange} this month`}
        >
          <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">Net Worth</Text>
          <Text className="text-gray-900 dark:text-white text-4xl font-bold mt-1">{STATS.netWorth}</Text>
          <View className="flex-row items-center gap-1 mt-1.5">
            <TrendingUp size={14} color="#16a34a" />
            <Text className="text-green-600 dark:text-green-400 text-sm font-medium">{STATS.netWorthChange}</Text>
            <Text className="text-gray-500 dark:text-gray-500 text-sm">this month</Text>
          </View>
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 mx-4 mt-3">
          {[
            { label: 'Income', value: STATS.income, icon: <ArrowUpRight size={16} color="#16a34a" />, bg: 'bg-green-100 dark:bg-green-500/15' },
            { label: 'Expenses', value: STATS.expenses, icon: <CreditCard size={16} color="#ef4444" />, bg: 'bg-red-100 dark:bg-red-500/15' },
            { label: 'Saved', value: STATS.savings, icon: <PiggyBank size={16} color="#60a5fa" />, bg: 'bg-blue-100 dark:bg-blue-500/15' },
          ].map(stat => (
            <View
              key={stat.label}
              className="flex-1 bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8"
            >
              <View className={`w-8 h-8 rounded-lg ${stat.bg} items-center justify-center mb-2`}>
                {stat.icon}
              </View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{stat.label}</Text>
              <Text className="text-gray-900 dark:text-white text-lg font-bold">{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Recent transactions */}
        <View className="mx-4 mt-4">
          <Text className="text-gray-900 dark:text-white text-base font-semibold mb-3">Recent</Text>
          <View className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-white/8">
            {TRANSACTIONS.map((tx, idx) => (
              <View key={tx.id}>
                <View className="flex-row items-center px-4 py-3">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${tx.color}25` }}>
                    <DollarSign size={16} color={tx.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-base" numberOfLines={1}>{tx.merchant}</Text>
                    <Text className="text-gray-500 dark:text-gray-500 text-sm">{tx.category} · {tx.date}</Text>
                  </View>
                  <Text className={`text-base font-semibold ${tx.positive ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                    {tx.amount}
                  </Text>
                </View>
                {idx < TRANSACTIONS.length - 1 ? (
                  <View className="h-px bg-gray-100 dark:bg-white/8 ml-[60px]" />
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### Blueprint 4: Form Screen (add item, edit settings)

```tsx
// app/add-habit.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';

const COLORS = [
  { id: 'orange', hex: '#f97316', label: 'Orange' },
  { id: 'blue', hex: '#60a5fa', label: 'Blue' },
  { id: 'green', hex: '#4ade80', label: 'Green' },
  { id: 'red', hex: '#f87171', label: 'Red' },
  { id: 'purple', hex: '#c084fc', label: 'Purple' },
  { id: 'yellow', hex: '#facc15', label: 'Yellow' },
];

const FREQUENCIES = ['Daily', 'Weekdays', 'Weekends', '3x per week', 'Weekly'];

export default function AddHabitScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('orange');
  const [selectedFreq, setSelectedFreq] = useState('Daily');
  const [nameError, setNameError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setNameError('Please enter a habit name'); return; }
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Navigation bar */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/8">
          <Pressable
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <X size={22} color="#9ca3af" />
          </Pressable>
          <Text className="text-gray-900 dark:text-white text-base font-semibold" accessibilityRole="header">
            New Habit
          </Text>
          <Pressable
            className="w-10 h-10 items-center justify-center"
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save habit"
          >
            <Check size={22} color="#60a5fa" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        >
          {/* Name input */}
          <View className="mb-5">
            <Text className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1.5">Habit name</Text>
            <TextInput
              className="bg-white dark:bg-gray-800 rounded-xl px-4 text-gray-900 dark:text-white text-base border border-gray-200 dark:border-white/10"
              style={{ height: 52 }}
              value={name}
              onChangeText={t => { setName(t); setNameError(''); }}
              placeholder="e.g. Morning run"
              placeholderTextColor="#9ca3af"
              autoFocus
              returnKeyType="next"
            />
            {nameError ? <Text className="text-red-500 dark:text-red-400 text-sm mt-1.5">{nameError}</Text> : null}
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1.5">Description</Text>
            <TextInput
              className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base border border-gray-200 dark:border-white/10"
              style={{ minHeight: 80 }}
              value={description}
              onChangeText={setDescription}
              placeholder="Why does this habit matter?"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Color picker */}
          <View className="mb-5">
            <Text className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-3">Color</Text>
            <View className="flex-row gap-3">
              {COLORS.map(c => (
                <Pressable
                  key={c.id}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: c.hex, opacity: selectedColor === c.id ? 1 : 0.4 }}
                  onPress={() => setSelectedColor(c.id)}
                  accessibilityLabel={c.label}
                  accessibilityState={{ selected: selectedColor === c.id }}
                >
                  {selectedColor === c.id ? <Check size={16} color="white" strokeWidth={3} /> : null}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Frequency */}
          <View className="mb-5">
            <Text className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-3">Frequency</Text>
            <View className="flex-row flex-wrap gap-2">
              {FREQUENCIES.map(f => (
                <Pressable
                  key={f}
                  className={`px-4 py-2 rounded-full border ${
                    selectedFreq === f
                      ? 'bg-orange-100 dark:bg-orange-500/15 border-orange-300 dark:border-orange-500/50'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-white/10'
                  }`}
                  onPress={() => setSelectedFreq(f)}
                  accessibilityLabel={f}
                  accessibilityState={{ selected: selectedFreq === f }}
                >
                  <Text className={`text-sm font-medium ${
                    selectedFreq === f
                      ? 'text-orange-700 dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Save button */}
        <View className="px-4 pb-4 pt-2 border-t border-gray-200 dark:border-white/8">
          <Pressable
            className="w-full h-[52px] rounded-2xl items-center justify-center bg-orange-500 active:bg-orange-600"
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save habit"
          >
            <Text className="text-white text-base font-semibold">Save habit</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

---

### Blueprint 5: Settings Screen (iOS Settings style)

```tsx
// app/(tabs)/settings.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Moon, Smartphone, Shield, HelpCircle, Star, ChevronRight, User, CreditCard } from 'lucide-react-native';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const SectionHeader = ({ title }: { title: string }) => (
    <Text className="text-gray-500 dark:text-gray-500 text-sm font-medium uppercase tracking-wider px-4 mb-2 mt-6">
      {title}
    </Text>
  );

  const Row = ({ icon, iconBg, label, sublabel, value, onPress, rightEl }: {
    icon: React.ReactNode; iconBg: string; label: string;
    sublabel?: string; value?: string; onPress?: () => void; rightEl?: React.ReactNode;
  }) => (
    <Pressable
      className="flex-row items-center px-4 py-3 min-h-[52px] active:bg-gray-100 dark:active:bg-gray-800/50"
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={label}
    >
      <View className={`w-9 h-9 rounded-[10px] items-center justify-center ${iconBg} mr-3`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-gray-900 dark:text-white text-base">{label}</Text>
        {sublabel ? <Text className="text-gray-500 dark:text-gray-500 text-sm mt-0.5">{sublabel}</Text> : null}
      </View>
      {rightEl ? rightEl : null}
      {value ? <Text className="text-gray-500 dark:text-gray-400 text-base mr-2">{value}</Text> : null}
      {onPress && !rightEl ? <ChevronRight size={16} color="#9ca3af" /> : null}
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-gray-900 dark:text-white text-3xl font-bold" accessibilityRole="header">
          Settings
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile card */}
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden mb-2">
          <Pressable className="flex-row items-center px-4 py-4 active:bg-gray-50 dark:active:bg-gray-800">
            <View className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-500/20 items-center justify-center mr-4">
              <User size={24} color="#f97316" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white text-base font-semibold">Sarah Mitchell</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">sarah@example.com</Text>
            </View>
            <ChevronRight size={16} color="#9ca3af" />
          </Pressable>
        </View>

        <SectionHeader title="Preferences" />
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden">
          <Row
            icon={<Bell size={18} color="#60a5fa" />} iconBg="bg-blue-100 dark:bg-blue-500/15"
            label="Notifications" sublabel="Daily reminders"
            rightEl={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#f97316' }} />}
          />
          <View className="h-px bg-gray-100 dark:bg-white/8 ml-[52px]" />
          <Row
            icon={<Moon size={18} color="#a78bfa" />} iconBg="bg-violet-100 dark:bg-violet-500/15"
            label="Dark Mode"
            rightEl={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: '#f97316' }} />}
          />
          <View className="h-px bg-gray-100 dark:bg-white/8 ml-[52px]" />
          <Row
            icon={<Smartphone size={18} color="#4ade80" />} iconBg="bg-green-100 dark:bg-green-500/15"
            label="App Icon" value="Default" onPress={() => {}}
          />
        </View>

        <SectionHeader title="Account" />
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden">
          <Row icon={<CreditCard size={18} color="#facc15" />} iconBg="bg-yellow-100 dark:bg-yellow-500/15" label="Subscription" value="Pro" onPress={() => {}} />
          <View className="h-px bg-gray-100 dark:bg-white/8 ml-[52px]" />
          <Row icon={<Shield size={18} color="#22d3ee" />} iconBg="bg-cyan-100 dark:bg-cyan-500/15" label="Privacy & Data" onPress={() => {}} />
        </View>

        <SectionHeader title="Support" />
        <View className="mx-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/8 overflow-hidden">
          <Row icon={<Star size={18} color="#f97316" />} iconBg="bg-orange-100 dark:bg-orange-500/15" label="Rate Nova8" onPress={() => {}} />
          <View className="h-px bg-gray-100 dark:bg-white/8 ml-[52px]" />
          <Row icon={<HelpCircle size={18} color="#9ca3af" />} iconBg="bg-gray-100 dark:bg-gray-700" label="Help & Support" onPress={() => {}} />
        </View>

        <Text className="text-gray-400 dark:text-gray-600 text-sm text-center mt-8">Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### Blueprint 6: Feed Screen (social, timeline)

```tsx
// app/(tabs)/feed.tsx — Threads-inspired: posts live on background, no card chrome.
import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal } from 'lucide-react-native';

const POSTS = [
  { id: '1', author: 'Alex Chen', handle: '@alexchen', time: '2m',
    content: 'Just finished day 14 of my morning run streak 🏃 The hardest part was getting out of bed on day 3. Now it\'s automatic.',
    likes: 47, comments: 8, reposts: 3, avatarColor: '#f97316' },
  { id: '2', author: 'Maya Rodriguez', handle: '@maya_r', time: '18m',
    content: 'Reading habit update: finished 4 books this month. Swapping social media time for reading time was the unlock.',
    likes: 124, comments: 21, reposts: 18, avatarColor: '#60a5fa' },
];

type Post = typeof POSTS[0];

function PostItem({ post }: { post: Post }) {
  return (
    <View className="px-4 py-4 border-b border-gray-100 dark:border-gray-800/80">
      <View className="flex-row gap-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${post.avatarColor}30` }}
        >
          <Text className="text-sm font-bold" style={{ color: post.avatarColor }}>
            {post.author.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-gray-900 dark:text-white text-base font-semibold">{post.author}</Text>
              <Text className="text-gray-500 dark:text-gray-500 text-sm">{post.time}</Text>
            </View>
            <Pressable className="w-8 h-8 items-center justify-center" accessibilityLabel="More options">
              <MoreHorizontal size={18} color="#9ca3af" />
            </Pressable>
          </View>

          <Text className="text-gray-500 dark:text-gray-500 text-sm mb-2">{post.handle}</Text>
          <Text className="text-gray-900 dark:text-white text-base leading-6 mb-3">{post.content}</Text>

          <View className="flex-row items-center gap-5">
            <Pressable className="flex-row items-center gap-1.5 min-h-[44px] items-center" accessibilityLabel={`Like, ${post.likes} likes`}>
              <Heart size={20} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-500 text-sm">{post.likes}</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-1.5 min-h-[44px] items-center" accessibilityLabel={`Reply, ${post.comments} replies`}>
              <MessageCircle size={20} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-500 text-sm">{post.comments}</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-1.5 min-h-[44px] items-center" accessibilityLabel={`Repost, ${post.reposts} reposts`}>
              <Repeat2 size={20} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-500 text-sm">{post.reposts}</Text>
            </Pressable>
            <Pressable className="flex-row items-center gap-1.5 min-h-[44px] items-center" accessibilityLabel="Share">
              <Send size={20} color="#9ca3af" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-950" edges={['top']}>
      <View className="px-4 py-3 border-b border-gray-100 dark:border-gray-800/80">
        <Text className="text-gray-900 dark:text-white text-xl font-semibold text-center" accessibilityRole="header">
          Community
        </Text>
      </View>

      <FlatList
        data={POSTS}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PostItem post={item} />}
        showsVerticalScrollIndicator={false}
        refreshing={false}
        onRefresh={() => {}}
      />
    </SafeAreaView>
  );
}
```

---

### Blueprint 7: Profile Screen

```tsx
// app/(tabs)/profile.tsx
import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, Flame, Calendar, TrendingUp, Award } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const USER = {
  name: 'Sarah Mitchell', handle: '@sarah_m', joinDate: 'Member since March 2024',
  totalHabits: 7, longestStreak: 42, completionRate: '84%', totalCompletions: 312,
};

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
          <Text className="text-gray-900 dark:text-white text-3xl font-bold" accessibilityRole="header">
            Profile
          </Text>
          <Pressable
            className="w-10 h-10 items-center justify-center"
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Settings size={22} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Profile card */}
        <View className="items-center px-4 pb-6">
          <View className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-500/20 items-center justify-center mb-3">
            <Text className="text-gray-700 dark:text-white text-2xl font-bold">SM</Text>
          </View>
          <Text className="text-gray-900 dark:text-white text-xl font-bold">{USER.name}</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-base mt-0.5">{USER.handle}</Text>
          <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1">{USER.joinDate}</Text>
        </View>

        {/* Stats grid */}
        <View className="flex-row gap-3 mx-4 mb-4">
          {[
            { label: 'Habits', value: String(USER.totalHabits), icon: <Calendar size={16} color="#60a5fa" />, bg: 'bg-blue-100 dark:bg-blue-500/15' },
            { label: 'Best Streak', value: String(USER.longestStreak), icon: <Flame size={16} color="#f97316" />, bg: 'bg-orange-100 dark:bg-orange-500/15' },
            { label: 'Rate', value: USER.completionRate, icon: <TrendingUp size={16} color="#22c55e" />, bg: 'bg-green-100 dark:bg-green-500/15' },
            { label: 'Total', value: String(USER.totalCompletions), icon: <Award size={16} color="#facc15" />, bg: 'bg-yellow-100 dark:bg-yellow-500/15' },
          ].map(s => (
            <View
              key={s.label}
              className="flex-1 bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-white/8 items-center"
              accessible={true}
              accessibilityLabel={`${s.label}: ${s.value}`}
            >
              <View className={`w-8 h-8 rounded-lg ${s.bg} items-center justify-center mb-2`}>
                {s.icon}
              </View>
              <Text className="text-gray-900 dark:text-white text-lg font-bold">{s.value}</Text>
              <Text className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

### Blueprint 8: Onboarding / Welcome Screen

```tsx
// app/onboarding.tsx — Three-slide onboarding. NO mascots. Icon + bold text + description.
import React, { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Flame, TrendingUp, Bell } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDES = [
  { id: '1', icon: <Flame size={64} color="#f97316" />, bgColor: '#f9731615',
    title: 'Build habits that stick',
    description: 'Track your daily habits with streaks, reminders, and progress insights — all in one place.' },
  { id: '2', icon: <TrendingUp size={64} color="#60a5fa" />, bgColor: '#60a5fa15',
    title: 'See your progress',
    description: 'Beautiful charts and streak calendars show you how far you\'ve come. Celebrate every win.' },
  { id: '3', icon: <Bell size={64} color="#4ade80" />, bgColor: '#4ade8015',
    title: 'Never miss a day',
    description: 'Smart reminders at the right time. Customize when and how you want to be notified.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLast = activeIndex === SLIDES.length - 1;

  const goNext = () => {
    if (isLast) {
      router.replace('/(tabs)/today');
    } else {
      const nextIndex = activeIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      setActiveIndex(nextIndex);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top', 'bottom']}>
      {/* Skip button */}
      <View className="flex-row justify-end px-4 py-2">
        {!isLast ? (
          <Pressable
            className="min-h-[44px] px-4 items-center justify-center"
            onPress={() => router.replace('/(tabs)/today')}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text className="text-gray-500 dark:text-gray-400 text-base">Skip</Text>
          </Pressable>
        ) : <View className="h-11" />}
      </View>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        scrollEnabled={false} className="flex-1"
      >
        {SLIDES.map(slide => (
          <View key={slide.id} className="items-center justify-center px-8" style={{ width: SCREEN_WIDTH }}>
            <View
              className="w-28 h-28 rounded-3xl items-center justify-center mb-8"
              style={{ backgroundColor: slide.bgColor }}
            >
              {slide.icon}
            </View>
            <Text className="text-gray-900 dark:text-white text-3xl font-bold text-center mb-4 leading-tight">
              {slide.title}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-lg text-center leading-7">
              {slide.description}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom: dots + button */}
      <View className="px-6 pb-6 gap-6">
        {/* Page dots */}
        <View className="flex-row justify-center gap-2">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              className={`rounded-full ${i === activeIndex ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-700'}`}
              style={{ width: i === activeIndex ? 24 : 8, height: 8 }}
            />
          ))}
        </View>

        {/* CTA */}
        <Pressable
          className="w-full h-[52px] rounded-2xl items-center justify-center bg-orange-500 active:bg-orange-600"
          onPress={goNext}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Get started' : 'Next'}
        >
          <Text className="text-white text-base font-semibold">{isLast ? 'Get started' : 'Next'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
```

---

## Empty States (Upgraded)

### Pattern 1: Ghost / Preview State

The Streaks pattern: show the filled state with muted/translucent sample data + CTA overlay. Users immediately understand what the screen will look like once populated.

```tsx
// components/empty-states/GhostPreviewEmptyState.tsx
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function ShimmerBone({ className, delay = 0 }: { className?: string; delay?: number }) {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1, false,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={animStyle}
      className={`bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
    />
  );
}

function GhostHabitRow() {
  return (
    <View className="flex-row items-center gap-3 py-3 px-4">
      <ShimmerBone className="w-10 h-10 rounded-full" />
      <View className="flex-1 gap-1.5">
        <ShimmerBone className="h-4 w-3/4" />
        <ShimmerBone className="h-3 w-1/2" />
      </View>
      <ShimmerBone className="w-7 h-7 rounded-full" />
    </View>
  );
}

export function GhostPreviewEmptyState({
  onGetStarted,
  title = 'Your habits live here',
  description = 'Track daily habits and build streaks that stick.',
  ctaLabel = 'Add Your First Habit',
}: {
  onGetStarted: () => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
}) {
  return (
    <View className="flex-1 relative">
      {/* Ghost rows */}
      <View className="opacity-40">
        <GhostHabitRow />
        <View className="h-px bg-gray-100 dark:bg-white/8 mx-4" />
        <GhostHabitRow />
        <View className="h-px bg-gray-100 dark:bg-white/8 mx-4" />
        <GhostHabitRow />
        <View className="h-px bg-gray-100 dark:bg-white/8 mx-4" />
        <GhostHabitRow />
        <View className="h-px bg-gray-100 dark:bg-white/8 mx-4" />
        <GhostHabitRow />
      </View>

      {/* Overlay scrim + CTA */}
      <View className="absolute inset-0 items-center justify-center">
        <View className="absolute inset-0 bg-white/85 dark:bg-gray-950/90" />
        <View className="mx-8 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-white/8 items-center gap-3">
          <Text className="text-gray-900 dark:text-white text-xl font-bold text-center">{title}</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-sm text-center leading-relaxed">{description}</Text>
          <Pressable
            onPress={onGetStarted}
            className="mt-2 bg-orange-500 active:bg-orange-600 rounded-2xl px-8 py-3.5 w-full items-center"
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Text className="text-white font-semibold text-base">{ctaLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
```

---

### Pattern 2: Suggestion Chips

Tappable cards that auto-create the first item, reducing friction from zero → populated.

```tsx
// components/empty-states/SuggestionChipsEmptyState.tsx
import { View, Text, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface Suggestion {
  id: string; label: string; emoji: string; description?: string;
}

export function SuggestionChipsEmptyState({
  title = 'Start with a habit',
  description = 'Pick one to begin, or create your own.',
  suggestions,
  onSelectSuggestion,
  onCreateCustom,
}: {
  title?: string; description?: string;
  suggestions: Suggestion[];
  onSelectSuggestion: (s: Suggestion) => void;
  onCreateCustom?: () => void;
}) {
  const handleSelect = (suggestion: Suggestion) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectSuggestion(suggestion);
  };

  return (
    <View className="flex-1 px-4 pt-8">
      <View className="items-center mb-8">
        <Text className="text-gray-900 dark:text-white text-2xl font-bold mb-2">{title}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center">{description}</Text>
      </View>

      <View className="gap-3">
        {suggestions.map(suggestion => (
          <Pressable
            key={suggestion.id}
            onPress={() => handleSelect(suggestion)}
            className="flex-row items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/8 rounded-2xl p-4 gap-3 active:bg-gray-50 dark:active:bg-gray-800"
            accessibilityRole="button"
            accessibilityLabel={suggestion.label}
          >
            <View className="w-11 h-11 bg-orange-100 dark:bg-orange-500/15 rounded-xl items-center justify-center">
              <Text className="text-2xl">{suggestion.emoji}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900 dark:text-white">{suggestion.label}</Text>
              {suggestion.description ? (
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-0.5" numberOfLines={1}>
                  {suggestion.description}
                </Text>
              ) : null}
            </View>
            <View className="bg-orange-500 rounded-xl px-3 py-1.5">
              <Text className="text-white text-xs font-semibold">Add</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {onCreateCustom ? (
        <Pressable
          onPress={onCreateCustom}
          className="mt-6 flex-row items-center justify-center gap-2 py-4"
          accessibilityRole="button"
          accessibilityLabel="Create custom habit"
        >
          <Text className="text-orange-500 dark:text-orange-400 font-medium">Create custom habit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// Example suggestions:
// const HABIT_SUGGESTIONS = [
//   { id: 'meditate', label: 'Meditate', emoji: '🧘', description: '10 minutes each morning' },
//   { id: 'exercise', label: 'Exercise', emoji: '💪', description: 'Move your body daily' },
//   { id: 'read', label: 'Read 20 pages', emoji: '📚', description: 'Build a reading habit' },
//   { id: 'journal', label: 'Journal', emoji: '✏️', description: 'Reflect on your day' },
//   { id: 'water', label: 'Drink water', emoji: '💧', description: '8 glasses per day' },
// ];
```

---

### Pattern 3: Illustrated Empty State (composed icons)

No external illustration dependencies — purely lucide icons + NativeWind.

```tsx
// components/empty-states/IllustratedEmptyState.tsx
import { View, Text, Pressable } from 'react-native';
import { CheckCircle, Circle, Star } from 'lucide-react-native';

// Compose lucide icons into an illustration-like arrangement
function HabitsIllustration() {
  return (
    <View className="w-40 h-32 relative items-center justify-center">
      {/* Background decorative circles */}
      <View className="absolute w-32 h-32 rounded-full bg-orange-50 dark:bg-orange-500/10" />
      <View className="absolute w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-500/15" />

      {/* Stacked habit rows */}
      <View className="gap-2 items-start">
        <View className="flex-row items-center gap-2">
          <CheckCircle size={20} color="#f97316" fill="#fed7aa" />
          <View className="w-16 h-2.5 bg-orange-200 dark:bg-orange-500/30 rounded-full" />
        </View>
        <View className="flex-row items-center gap-2 opacity-60">
          <Circle size={20} color="#f97316" />
          <View className="w-20 h-2.5 bg-orange-100 dark:bg-orange-500/15 rounded-full" />
        </View>
        <View className="flex-row items-center gap-2 opacity-30">
          <Circle size={20} color="#f97316" />
          <View className="w-12 h-2.5 bg-orange-100 dark:bg-orange-500/15 rounded-full" />
        </View>
      </View>

      {/* Floating star */}
      <View className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 dark:bg-yellow-500/20 rounded-full items-center justify-center">
        <Star size={14} color="#f59e0b" fill="#fcd34d" />
      </View>
    </View>
  );
}

export function IllustratedEmptyState({
  illustration,
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  illustration?: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
}) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-6">
      {illustration ? (
        <View className="items-center justify-center mb-2">{illustration}</View>
      ) : null}

      <View className="items-center gap-2">
        <Text className="text-gray-900 dark:text-white text-xl font-bold text-center">{title}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-center leading-relaxed">{description}</Text>
      </View>

      <View className="w-full gap-3">
        {primaryAction ? (
          <Pressable
            onPress={primaryAction.onPress}
            className="bg-orange-500 active:bg-orange-600 rounded-2xl py-4 items-center"
            accessibilityRole="button"
            accessibilityLabel={primaryAction.label}
          >
            <Text className="text-white font-semibold text-base">{primaryAction.label}</Text>
          </Pressable>
        ) : null}
        {secondaryAction ? (
          <Pressable
            onPress={secondaryAction.onPress}
            className="py-3 items-center"
            accessibilityRole="button"
            accessibilityLabel={secondaryAction.label}
          >
            <Text className="text-orange-500 dark:text-orange-400 font-medium">{secondaryAction.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// Usage:
// <IllustratedEmptyState
//   illustration={<HabitsIllustration />}
//   title="No habits yet"
//   description="Build your first habit and start a streak today."
//   primaryAction={{ label: "Add your first habit", onPress: () => router.push('/add-habit') }}
//   secondaryAction={{ label: "Browse suggestions", onPress: () => setShowSuggestions(true) }}
// />
```

---

### Pattern 4: Contextual Empty State

Adapts its message based on filter/search context.

```tsx
// Use inline where the content area would be

function EmptyListState({
  hasSearch,
  hasFilter,
  searchQuery,
  onClear,
  onAdd,
}: {
  hasSearch: boolean;
  hasFilter: boolean;
  searchQuery?: string;
  onClear?: () => void;
  onAdd?: () => void;
}) {
  if (hasSearch && searchQuery) {
    return (
      <View className="flex-1 items-center justify-center px-8 py-12 gap-4">
        <Text className="text-gray-900 dark:text-white text-lg font-semibold text-center">
          No results for "{searchQuery}"
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-base text-center">
          Try a different word or check your spelling.
        </Text>
        <Pressable
          onPress={onClear}
          className="bg-gray-100 dark:bg-gray-800 rounded-xl px-6 py-3 border border-gray-200 dark:border-white/10"
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text className="text-gray-900 dark:text-white font-semibold">Clear search</Text>
        </Pressable>
      </View>
    );
  }

  if (hasFilter) {
    return (
      <View className="flex-1 items-center justify-center px-8 py-12 gap-4">
        <Text className="text-gray-900 dark:text-white text-lg font-semibold text-center">
          No items match this filter
        </Text>
        <Pressable
          onPress={onClear}
          className="bg-gray-100 dark:bg-gray-800 rounded-xl px-6 py-3 border border-gray-200 dark:border-white/10"
          accessibilityRole="button"
          accessibilityLabel="Clear filter"
        >
          <Text className="text-gray-900 dark:text-white font-semibold">Clear filter</Text>
        </Pressable>
      </View>
    );
  }

  // True empty state
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-4 opacity-30">
        <CheckCircle2 size={64} color="#111827" />
      </View>
      <Text className="text-gray-900 dark:text-white text-xl font-semibold text-center mb-2">
        Nothing here yet
      </Text>
      <Text className="text-gray-500 dark:text-gray-400 text-base text-center leading-6 mb-6">
        Add your first item to get started.
      </Text>
      {onAdd ? (
        <Pressable
          onPress={onAdd}
          className="bg-orange-500 active:bg-orange-600 rounded-2xl px-6 py-3"
          accessibilityRole="button"
          accessibilityLabel="Add item"
        >
          <Text className="text-white text-base font-semibold">Add item</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
```

---

## Motion Choreography

> Skip `sharedTransitionTag` — requires Old Architecture. Use these stable patterns instead.

### Spring Config Presets

```tsx
// config/springs.ts — paste into every project that needs iOS-feel animations

/** Snappy interactive — matches iOS keyboard dismiss, card lift */
export const SPRING_SNAPPY = {
  mass: 1, stiffness: 350, damping: 28, overshootClamping: false,
} as const;

/** Standard iOS — modal present, element entrance */
export const SPRING_STANDARD = {
  mass: 1, stiffness: 200, damping: 20, overshootClamping: false,
} as const;

/** Gentle — large element settle, bottom sheet snap */
export const SPRING_GENTLE = {
  mass: 1, stiffness: 120, damping: 17, overshootClamping: false,
} as const;

/** Bouncy — playful elements, like a liked heart icon */
export const SPRING_BOUNCY = {
  mass: 1, stiffness: 180, damping: 12, overshootClamping: false,
} as const;

/** Carry gesture velocity into spring snap */
export const springFromGesture = (velocity: number) => ({
  mass: 1, stiffness: 300, damping: 25, velocity,
} as const);
```

### Haptic Feedback Map

```tsx
// utils/haptics.ts — use this everywhere, never call expo-haptics directly
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const isHapticsSupported = Platform.OS !== 'web';

export const HapticPatterns = {
  /** Button presses, navigation taps — subtle */
  buttonTap: () =>
    isHapticsSupported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Toggle ON — rigid, mechanical feel */
  toggleOn: () =>
    isHapticsSupported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid),

  /** Toggle OFF */
  toggleOff: () =>
    isHapticsSupported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft),

  /** Destructive: delete, remove, clear data */
  destructive: () =>
    isHapticsSupported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Success: form submit, save, complete */
  success: () =>
    isHapticsSupported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Error: validation failure, network error */
  error: () =>
    isHapticsSupported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Warning: recoverable issue */
  warning: () =>
    isHapticsSupported && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /** Discrete selection: tabs, pickers, segment controls */
  selection: () =>
    isHapticsSupported && Haptics.selectionAsync(),

  /** Long-press recognized — at the moment of recognition */
  longPress: () =>
    isHapticsSupported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Pull-to-refresh threshold reached */
  pullRefresh: () =>
    isHapticsSupported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Swipe-to-delete threshold crossed */
  swipeDelete: () =>
    isHapticsSupported && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
} as const;
```

**Haptic event → pattern mapping:**
| Interaction | Pattern | Notes |
|---|---|---|
| Button tap | `buttonTap` (Light) | Every primary button |
| Toggle ON | `toggleOn` (Rigid) | Crisp, mechanical |
| Toggle OFF | `toggleOff` (Soft) | Softer release |
| Delete confirm | `destructive` (Heavy) | Weighty — signals consequence |
| Swipe-delete threshold | `swipeDelete` (Heavy) | At threshold, not release |
| Pull-to-refresh threshold | `pullRefresh` (Medium) | Signal readiness |
| Long-press recognized | `longPress` (Medium) | Moment of recognition |
| Form success | `success` (Notification) | Three-tap pattern |
| Validation error | `error` (Notification) | Two-tap pattern |
| Tab change, picker | `selection` | Designed for discrete selection |

---

### Staggered Entry Animation

```tsx
// hooks/useStaggeredEntry.ts
import { useMemo } from 'react';
import { FadeInDown } from 'react-native-reanimated';

export function useStaggeredEntry(
  index: number,
  config: { baseDelay?: number; stagger?: number } = {}
) {
  const { baseDelay = 0, stagger = 60 } = config;

  return useMemo(() => {
    const delay = baseDelay + Math.min(index, 8) * stagger; // cap at 8 to avoid long waits
    return FadeInDown
      .delay(delay)
      .duration(350);
    // NOTE: .springify() is NOT used — it causes errors on React Native Web
  }, [index, baseDelay, stagger]);
}
```

```tsx
// Screen choreography: Header (0ms) → Stats (80ms) → List (160ms + 50ms per item)
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useStaggeredEntry } from '../hooks/useStaggeredEntry';

export default function HomeScreen() {
  const items = useItems();

  return (
    <View style={{ flex: 1 }}>
      {/* Header: immediate */}
      <Animated.View entering={FadeIn.delay(0).duration(300)}>
        <ScreenHeader title="Today" />
      </Animated.View>

      {/* Stats section: 80ms delay */}
      <Animated.View entering={FadeInDown.delay(80).duration(350)}>
        <StatsRow />
      </Animated.View>

      {/* List items: staggered from 160ms */}
      <FlatList
        data={items}
        renderItem={({ item, index }) => (
          <Animated.View entering={useStaggeredEntry(index, { baseDelay: 160, stagger: 50 })}>
            <ItemRow item={item} />
          </Animated.View>
        )}
      />
    </View>
  );
}
```

> **Note:** The `useStaggeredEntry` hook returns a new animation builder each render. For FlatList items, this is intentional — each item gets its own entering animation. The `Math.min(index, 8)` cap ensures items beyond index 8 all appear at the same time rather than with increasing delays.

---

### StaggerGroup Component (for non-list scenarios)

```tsx
// components/StaggerGroup.tsx — wraps children with staggered entry
import React, { Children } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

export function StaggerGroup({
  children,
  stagger = 60,
  baseDelay = 0,
}: {
  children: React.ReactNode;
  stagger?: number;
  baseDelay?: number;
}) {
  return (
    <>
      {Children.map(children, (child, index) => (
        <Animated.View
          key={index}
          entering={FadeInDown
            .delay(baseDelay + index * stagger)
            .duration(350)
          }
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
}

// Usage — wraps each direct child in staggered Animated.View:
// <StaggerGroup stagger={60} baseDelay={160}>
//   <StatCard ... />
//   <StatCard ... />
//   <StatCard ... />
// </StaggerGroup>
```

---

### Scroll-Driven Collapsing Header

```tsx
// hooks/useLargeTitleScroll.ts
import Animated, {
  useAnimatedRef,
  useScrollViewOffset,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const COLLAPSE_START = 0;
const COLLAPSE_END = 60; // scroll offset at which title fully collapses

export function useLargeTitleScroll() {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollViewOffset(scrollRef); // ✅ iOS · Android · Web

  // Large title: visible at 0, invisible at COLLAPSE_END
  const largeTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [COLLAPSE_START, COLLAPSE_END], [1, 0], Extrapolation.CLAMP),
    transform: [{
      translateY: interpolate(scrollY.value, [COLLAPSE_START, COLLAPSE_END], [0, -12], Extrapolation.CLAMP),
    }],
  }));

  // Inline nav-bar title: invisible at 0, visible at COLLAPSE_END
  const inlineTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [COLLAPSE_START, COLLAPSE_END], [0, 1], Extrapolation.CLAMP),
  }));

  return { scrollRef, largeTitleStyle, inlineTitleStyle };
}
```

```tsx
// Usage in screen:
export default function MyScreen({ title }: { title: string }) {
  const { scrollRef, largeTitleStyle, inlineTitleStyle } = useLargeTitleScroll();

  return (
    <View style={{ flex: 1 }}>
      {/* Inline title overlay — positioned at top */}
      <Animated.View
        style={[{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          paddingTop: 56, paddingBottom: 12, alignItems: 'center',
          backgroundColor: 'transparent',
        }, inlineTitleStyle]}
        pointerEvents="none"
      >
        <Text className="text-gray-900 dark:text-white text-base font-semibold">{title}</Text>
      </Animated.View>

      <Animated.ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Large title */}
        <Animated.View style={[{ paddingHorizontal: 16, paddingTop: 8 }, largeTitleStyle]}>
          <Text className="text-gray-900 dark:text-white text-3xl font-bold">{title}</Text>
        </Animated.View>

        {/* Rest of content */}
      </Animated.ScrollView>
    </View>
  );
}
```

---

### Parallax Hero Image

```tsx
// components/ParallaxHeroScrollView.tsx
import { View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedRef, useScrollViewOffset, useAnimatedStyle,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import { cssInterop } from 'nativewind';

cssInterop(Image, { className: 'style' });

const IMAGE_HEIGHT = 300;
const PARALLAX_FACTOR = 0.4;

export function ParallaxHeroScrollView({
  imageUri,
  children,
}: {
  imageUri: string;
  children: React.ReactNode;
}) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useScrollViewOffset(scrollRef);

  const imageStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-IMAGE_HEIGHT, 0, IMAGE_HEIGHT],
      [IMAGE_HEIGHT * PARALLAX_FACTOR * -1, 0, IMAGE_HEIGHT * PARALLAX_FACTOR],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-IMAGE_HEIGHT, 0],
      [1 + IMAGE_HEIGHT / (IMAGE_HEIGHT / 2), 1],
      Extrapolation.CLAMP
    );
    return { transform: [{ translateY }, { scale }] };
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      scrollEventThrottle={16}
      style={{ flex: 1 }}
    >
      {/* Hero image container — clips overflow */}
      <View style={{ height: IMAGE_HEIGHT, overflow: 'hidden' }}>
        <Animated.Image
          source={{ uri: imageUri }}
          style={[{ width: '100%', height: IMAGE_HEIGHT + 80 }, imageStyle]}
          resizeMode="cover"
        />
      </View>
      {children}
    </Animated.ScrollView>
  );
}
```

---

### Swipe-to-Delete (RNGH v2 ReanimatedSwipeable)

```tsx
// components/SwipeableRow.tsx
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  SharedValue, useAnimatedStyle, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Text, View, Platform } from 'react-native';
import { HapticPatterns } from '../utils/haptics';
import { useRef } from 'react';

const DELETE_WIDTH = 80;

function DeleteAction(prog: SharedValue<number>, drag: SharedValue<number>) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        drag.value,
        [-DELETE_WIDTH - 20, -DELETE_WIDTH, 0],
        [-20, 0, DELETE_WIDTH],
        Extrapolation.CLAMP
      ),
    }],
  }));

  return (
    <Animated.View
      style={[{ width: DELETE_WIDTH, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' }, animStyle]}
    >
      <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Delete</Text>
    </Animated.View>
  );
}

export function SwipeableRow({
  children,
  onDelete,
}: {
  children: React.ReactNode;
  onDelete: () => void;
}) {
  const swipeableRef = useRef<any>(null);

  const handleSwipeOpen = async (direction: 'left' | 'right') => {
    if (direction !== 'left') return; // 'left' means swipe from right reveals left actions — our delete is right action
    HapticPatterns.destructive();
    swipeableRef.current?.close();
    onDelete();
  };

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={DELETE_WIDTH * 0.6}
      overshootFriction={8}
      renderRightActions={DeleteAction}
      onSwipeableOpen={handleSwipeOpen}
    >
      {children}
    </ReanimatedSwipeable>
  );
}
```

---

### Long-Press Context Menu

```tsx
// components/LongPressMenu.tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';
import { HapticPatterns } from '../utils/haptics';
import { SPRING_SNAPPY } from '../config/springs';

export function LongPressMenu({
  children,
  onMenuOpen,
}: {
  children: React.ReactNode;
  onMenuOpen: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const longPress = Gesture.LongPress()
    .minDuration(350)
    .maxDistance(10)
    .onBegin(() => {
      scale.value = withTiming(0.95, { duration: 150 });
      opacity.value = withTiming(0.85, { duration: 150 });
    })
    .onStart(() => {
      scale.value = withSpring(0.92, SPRING_SNAPPY);
      runOnJS(HapticPatterns.longPress)();
      runOnJS(onMenuOpen)();
    })
    .onFinalize(() => {
      scale.value = withSpring(1, SPRING_SNAPPY);
      opacity.value = withTiming(1, { duration: 150 });
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={longPress}>
      <Animated.View style={animStyle}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
```
## Charts & Data Visualization

> **Architecture:** Victory Native XL (Skia-backed) + @shopify/react-native-skia + react-native-reanimated. NativeWind handles layout outside the canvas; Skia uses hex/rgba directly inside it.

### Web Setup (Required for Skia Charts on Expo Web)

```tsx
// index.web.tsx — load Skia before mounting app
import '@expo/metro-runtime';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb().then(async () => {
  renderRootComponent(App);
});
```

For screens that have charts, wrap with `<WithSkiaWeb>` for lazy loading:
```tsx
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

export default function ChartScreen() {
  return (
    <WithSkiaWeb
      getComponent={() => import('@/components/charts/SpendingChart')}
      fallback={<StatCardSkeleton />}
    />
  );
}
```

### Critical Gotchas

- **All Victory Native colors must be hex** (`#RRGGBB`) or `rgba(r,g,b,a)`. CSS named colors like `"gray"` will not render.
- **CartesianChart requires a non-zero height** — always wrap in `<View style={{ height: 220 }}>`.
- **`useChartPressState` initial value must match data type** — `x: 0` for numeric, `x: ''` for string keys.
- **Skia SharedValues: pass directly as props** — do NOT use `useAnimatedProps` or `createAnimatedComponent` with Skia primitives.
- **`useFont` must load before axes render** — null-check before passing to CartesianChart.
- **NativeWind className has no effect inside Skia Canvas** — use JS hex values from `useChartTheme()`.
- **Animated entry resets on re-render** — wrap chart components in `React.memo`.

### Chart Theme Hook

```tsx
// lib/chartTheme.ts
import { useColorScheme } from 'nativewind';

export interface ChartTheme {
  axisLabelColor: string;
  axisLineColor: string;
  gridLineColor: string;
  primaryColor: string;
  primaryGradient: [string, string];
  cardBackground: string;
}

const LIGHT_THEME: ChartTheme = {
  axisLabelColor: '#6B7280',       // gray-500
  axisLineColor:  '#E5E7EB',       // gray-200
  gridLineColor:  '#F3F4F6',       // gray-100
  primaryColor:   '#6366F1',       // indigo-500
  primaryGradient: ['rgba(99,102,241,0.25)', 'rgba(99,102,241,0.0)'],
  cardBackground: '#FFFFFF',
};

const DARK_THEME: ChartTheme = {
  axisLabelColor: '#9CA3AF',       // gray-400
  axisLineColor:  '#374151',       // gray-700
  gridLineColor:  '#374151',       // gray-700
  primaryColor:   '#818CF8',       // indigo-400 (brighter in dark)
  primaryGradient: ['rgba(129,140,248,0.25)', 'rgba(129,140,248,0.0)'],
  cardBackground: '#111827',       // gray-900
};

export function useChartTheme(): ChartTheme {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}
```

### ChartCard Wrapper

```tsx
// components/charts/ChartCard.tsx
import { View, Text } from 'react-native';
import { useChartTheme } from '@/lib/chartTheme';

export function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const theme = useChartTheme();
  return (
    <View
      className="rounded-2xl p-4 border border-gray-200 dark:border-white/8"
      style={{ backgroundColor: theme.cardBackground }}
    >
      <Text className="text-gray-900 dark:text-white font-semibold text-base mb-0.5">{title}</Text>
      {subtitle ? (
        <Text style={{ color: theme.axisLabelColor }} className="text-xs mb-4">{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}
```

---

### Recipe 1 — Line / Area Chart

```tsx
// components/charts/LineAreaChart.tsx
// Use cases: spending trends, weight tracking, step counts, heart rate
import React, { useEffect } from 'react';
import { View, Platform } from 'react-native';
import {
  CartesianChart, Line, Area, useChartPressState,
} from 'victory-native';
import {
  Circle, LinearGradient, Paint,
  Text as SkiaText, useFont, vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue, useDerivedValue, withTiming, Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useChartTheme } from '@/lib/chartTheme';

// Must be a local font asset
const FONT = require('@/assets/fonts/Inter-Regular.ttf');

export type LineChartDataPoint = { index: number; value: number };

interface LineAreaChartProps {
  data: LineChartDataPoint[];
  color?: string;                         // hex accent color — overridden per app
  height?: number;
  formatXLabel?: (v: number) => string;
  formatYLabel?: (v: number) => string;
}

export const LineAreaChart = React.memo(function LineAreaChart({
  data,
  color,                                   // if undefined, uses theme.primaryColor
  height = 220,
  formatXLabel = (v) => String(v),
  formatYLabel = (v) => String(v),
}: LineAreaChartProps) {
  const theme = useChartTheme();
  const accentColor = color ?? theme.primaryColor;

  const font = useFont(FONT, 11);
  const { state, isActive } = useChartPressState({ x: 0, y: { value: 0 } });

  // Null-check: font must load before rendering axes
  if (!font) return <View style={{ height }} />;

  const tooltipText = useDerivedValue(
    () => formatYLabel(state.y.value.value),
    [state]
  );
  const tooltipX = useDerivedValue(
    () => font ? state.x.position.value - font.measureText(tooltipText.value).width / 2 : state.x.position.value,
    [state, font]
  );
  const tooltipY = useDerivedValue(() => state.y.value.position.value - 16, [state]);

  return (
    <View style={{ height }}>
      <CartesianChart
        data={data}
        xKey="index"
        yKeys={['value']}
        chartPressState={state}
        domainPadding={{ top: 20, bottom: 4, left: 8, right: 8 }}
        xAxis={{
          font,
          formatXLabel,
          labelColor: theme.axisLabelColor,
          lineColor: theme.axisLineColor,
          tickCount: Math.min(data.length, 6),
        }}
        yAxis={[{
          font,
          formatYLabel,
          labelColor: theme.axisLabelColor,
          lineColor: theme.gridLineColor,
          tickCount: 4,
        }]}
      >
        {({ points, chartBounds }) => (
          <>
            {/* Gradient fill area */}
            <Area
              points={points.value}
              y0={chartBounds.bottom}
              curveType="natural"
              connectMissingData
              animate={{ type: 'timing', duration: 800 }}
            >
              <LinearGradient
                start={vec(0, chartBounds.top)}
                end={vec(0, chartBounds.bottom)}
                colors={theme.primaryGradient}
              />
            </Area>

            {/* The line */}
            <Line
              points={points.value}
              curveType="natural"
              strokeWidth={2.5}
              connectMissingData
              animate={{ type: 'timing', duration: 800 }}
              color={accentColor}
            />

            {/* Touch tooltip */}
            {isActive ? (
              <>
                {/* Vertical crosshair */}
                <Line
                  points={[
                    { x: state.x.position.value, y: chartBounds.top },
                    { x: state.x.position.value, y: chartBounds.bottom },
                  ]}
                  strokeWidth={1}
                  color="rgba(156,163,175,0.4)"
                />
                {/* Outer ring */}
                <Circle cx={state.x.position} cy={state.y.value.position} r={9} color="rgba(255,255,255,0.15)" />
                {/* Inner dot */}
                <Circle cx={state.x.position} cy={state.y.value.position} r={5} color={accentColor}>
                  <Paint color="#fff" style="stroke" strokeWidth={2} />
                </Circle>
                {/* Value label */}
                <SkiaText
                  x={tooltipX}
                  y={tooltipY}
                  text={tooltipText}
                  font={font}
                  color="#F9FAFB"
                />
              </>
            ) : null}
          </>
        )}
      </CartesianChart>
    </View>
  );
});

// Usage:
// const spendingData = Array.from({ length: 30 }, (_, i) => ({ index: i, value: Math.round(20 + Math.random() * 80) }));
// <ChartCard title="Spending trend" subtitle="Last 30 days">
//   <LineAreaChart data={spendingData} formatYLabel={(v) => `$${v}`} height={220} />
// </ChartCard>
```

---

### Recipe 2 — Vertical Bar Chart

```tsx
// components/charts/VerticalBarChart.tsx
// Use cases: spending by day of week, habits by day, monthly comparisons
import React from 'react';
import { View } from 'react-native';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';
import { useChartTheme } from '@/lib/chartTheme';

const FONT = require('@/assets/fonts/Inter-SemiBold.ttf');

export type BarDataPoint = { label: string; value: number; color?: string };

interface VerticalBarChartProps {
  data: BarDataPoint[];
  height?: number;
  formatYLabel?: (v: number) => string;
}

export const VerticalBarChart = React.memo(function VerticalBarChart({
  data,
  height = 220,
  formatYLabel = (v) => String(v),
}: VerticalBarChartProps) {
  const theme = useChartTheme();
  const font = useFont(FONT, 11);
  const { state, isActive } = useChartPressState({ x: '', y: { value: 0 } });

  if (!font) return <View style={{ height }} />;

  return (
    <View style={{ height }}>
      <CartesianChart
        data={data}
        xKey="label"
        yKeys={['value']}
        chartPressState={state}
        domainPadding={{ left: 20, right: 20, top: 24, bottom: 4 }}
        xAxis={{
          font,
          labelColor: theme.axisLabelColor,
          lineColor: 'rgba(0,0,0,0)',  // transparent
          tickCount: data.length,
        }}
        yAxis={[{
          font,
          formatYLabel,
          labelColor: theme.axisLabelColor,
          lineColor: theme.gridLineColor,
          tickCount: 4,
        }]}
      >
        {({ points, chartBounds }) =>
          points.value.map((point, i) => (
            <Bar
              key={i}
              points={[point]}
              chartBounds={chartBounds}
              barWidth={Math.min((chartBounds.right - chartBounds.left) / data.length - 8, 40)}
              barCount={data.length}
              animate={{ type: 'timing', duration: 600 }}
              roundedCorners={{ topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 }}
              color={isActive && state.x.value.value === point.xValue
                ? theme.primaryColor
                : (data[i].color ?? theme.primaryColor)}
            />
          ))
        }
      </CartesianChart>
    </View>
  );
});

// Usage:
// const weeklyData = [
//   { label: 'Mon', value: 4 },
//   { label: 'Tue', value: 7 },
//   { label: 'Wed', value: 3 },
//   { label: 'Thu', value: 6 },
//   { label: 'Fri', value: 5 },
//   { label: 'Sat', value: 2 },
//   { label: 'Sun', value: 1 },
// ];
// <ChartCard title="Habits this week">
//   <VerticalBarChart data={weeklyData} height={200} />
// </ChartCard>
```

---

### Recipe 3 — Calendar Heatmap

```tsx
// components/charts/CalendarHeatmap.tsx
// Use case: habit completion history (GitHub contribution graph style)
// No third-party dependency needed — pure React Native + NativeWind
import React, { useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

export type HeatmapDay = { date: string; value: number }; // value 0–1

function interpolateColor(empty: string, full: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(empty);
  const [r2, g2, b2] = parse(full);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface CalendarHeatmapProps {
  data: HeatmapDay[];
  weeks?: number;           // default 26 = 6 months
  cellSize?: number;
  cellGap?: number;
  baseColor?: string;       // fully complete — hex only
  emptyColor?: string;      // 0% color — hex only
  labelColor?: string;
  onDayPress?: (day: HeatmapDay | null, date: string) => void;
}

export function CalendarHeatmap({
  data,
  weeks = 26,
  cellSize = 14,
  cellGap = 3,
  baseColor = '#6366F1',
  emptyColor = '#1F2937',  // dark mode; override to '#E5E7EB' for light
  labelColor = '#6B7280',
  onDayPress,
}: CalendarHeatmapProps) {
  const scrollRef = useRef<ScrollView>(null);

  const dataMap = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach(d => { map[d.date] = d.value; });
    return map;
  }, [data]);

  const grid = useMemo(() => {
    const today = new Date();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - today.getDay());
    const columns: { date: string }[][] = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const col: { date: string }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(lastSunday);
        date.setDate(lastSunday.getDate() - w * 7 + d);
        col.push({ date: date.toISOString().slice(0, 10) });
      }
      columns.push(col);
    }
    return columns;
  }, [weeks]);

  const monthLabels = useMemo(() => {
    const labels: { text: string; colIndex: number }[] = [];
    let lastMonth = -1;
    grid.forEach((col, i) => {
      const month = new Date(col[0].date).getMonth();
      if (month !== lastMonth) {
        labels.push({ text: MONTH_NAMES[month], colIndex: i });
        lastMonth = month;
      }
    });
    return labels;
  }, [grid]);

  const stride = cellSize + cellGap;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <View>
          {/* Month labels */}
          <View style={{ height: 16, position: 'relative' }}>
            {monthLabels.map(({ text, colIndex }) => (
              <Text
                key={`${text}-${colIndex}`}
                style={{ position: 'absolute', left: colIndex * stride + 18, fontSize: 10, color: labelColor }}
              >
                {text}
              </Text>
            ))}
          </View>

          {/* Grid */}
          <View style={{ flexDirection: 'row' }}>
            {/* Day labels */}
            <View style={{ marginRight: 4, marginTop: 1 }}>
              {DAY_LABELS.map((label, i) => (
                <View key={i} style={{ height: cellSize, marginBottom: cellGap, justifyContent: 'center' }}>
                  {i % 2 === 1 ? (
                    <Text style={{ fontSize: 9, color: labelColor, width: 10 }}>{label}</Text>
                  ) : null}
                </View>
              ))}
            </View>

            {/* Columns */}
            <View style={{ flexDirection: 'row' }}>
              {grid.map((col, wi) => (
                <View key={wi} style={{ marginRight: cellGap }}>
                  {col.map(({ date }) => {
                    const rawValue = dataMap[date];
                    const isFuture = date > today;
                    const value = isFuture ? undefined : (rawValue ?? 0);
                    const bg = isFuture
                      ? 'transparent'
                      : value === 0
                      ? emptyColor
                      : interpolateColor(emptyColor, baseColor, value);

                    return (
                      <Pressable
                        key={date}
                        onPress={() => onDayPress?.(rawValue !== undefined ? { date, value: rawValue } : null, date)}
                        style={{
                          width: cellSize, height: cellSize,
                          marginBottom: cellGap, borderRadius: 3,
                          backgroundColor: bg, opacity: isFuture ? 0.2 : 1,
                        }}
                        accessibilityLabel={`${date}: ${value !== undefined ? Math.round((value ?? 0) * 100) + '% complete' : 'no data'}`}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Light mode: emptyColor="#E5E7EB" (gray-200)
// Dark mode:  emptyColor="#1F2937" (gray-800)
// Usage:
// <CalendarHeatmap
//   data={habitData}
//   weeks={26}
//   baseColor="#f97316"  // app accent
//   emptyColor={colorScheme === 'dark' ? '#1F2937' : '#E5E7EB'}
//   onDayPress={(day, date) => { if (day) showDayDetail(date); }}
// />
```

---

### Recipe 4 — Sparkline (inline trend)

```tsx
// components/charts/Sparkline.tsx
// Use case: tiny inline trend inside StatCards — 7-day or 30-day sparkline
import React, { useEffect } from 'react';
import { View } from 'react-native';
import {
  Canvas, Path, LinearGradient as SkiaLinearGradient, Skia, vec,
} from '@shopify/react-native-skia';
import {
  useSharedValue, useDerivedValue, withTiming, Easing,
} from 'react-native-reanimated';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showFill?: boolean;
  strokeWidth?: number;
  animated?: boolean;
}

export const Sparkline = React.memo(function Sparkline({
  data,
  width = 80,
  height = 32,
  color = '#6366F1',
  showFill = true,
  strokeWidth = 2,
  animated = true,
}: SparklineProps) {
  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    }
  }, [animated]);

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;
  const padding = strokeWidth;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const xStep = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const getY = (v: number) => padding + plotHeight - ((v - minVal) / range) * plotHeight;

  const buildPath = (prog: number) => {
    const path = Skia.Path.Make();
    const cutoff = Math.floor(data.length * prog);
    if (cutoff < 1) return path;
    data.slice(0, cutoff).forEach((v, i) => {
      const x = padding + i * xStep;
      const y = getY(v);
      if (i === 0) { path.moveTo(x, y); return; }
      const prevX = padding + (i - 1) * xStep;
      const cpX = prevX + xStep / 2;
      path.cubicTo(cpX, getY(data[i - 1]), cpX, y, x, y);
    });
    return path;
  };

  const buildFillPath = (prog: number) => {
    const path = buildPath(prog);
    if (path.isEmpty()) return path;
    const cutoff = Math.floor(data.length * prog);
    const lastX = padding + (cutoff - 1) * xStep;
    path.lineTo(lastX, height - padding);
    path.lineTo(padding, height - padding);
    path.close();
    return path;
  };

  const linePath = useDerivedValue(() => buildPath(progress.value));
  const fillPath = useDerivedValue(() => buildFillPath(progress.value));

  return (
    <Canvas style={{ width, height }}>
      {showFill ? (
        <Path path={fillPath} style="fill">
          <SkiaLinearGradient
            start={vec(0, 0)} end={vec(0, height)}
            colors={[`${color}40`, `${color}00`]}
          />
        </Path>
      ) : null}
      <Path
        path={linePath}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
        strokeJoin="round"
        color={color}
      />
    </Canvas>
  );
});

// Usage inside StatCard:
// <View className="bg-white dark:bg-gray-900 rounded-xl p-4 flex-row items-center justify-between">
//   <View className="flex-1">
//     <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1">Weekly Spend</Text>
//     <Text className="text-gray-900 dark:text-white text-2xl font-semibold">$342</Text>
//     <Text className="text-red-600 dark:text-red-400 text-xs mt-1">+12% vs last week</Text>
//   </View>
//   <Sparkline data={[45, 62, 38, 75, 88, 52, 91]} width={72} height={36} color="#ef4444" showFill />
// </View>
```

---

### Recipe 5 — Activity Rings (Apple style)

```tsx
// components/charts/ActivityRings.tsx
// Use case: fitness app summary, habit completion rings, health metrics
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Canvas, Path, Skia, useDerivedValue } from '@shopify/react-native-skia';
import {
  useSharedValue, withTiming, withDelay, Easing,
} from 'react-native-reanimated';

export type RingData = {
  value: number;       // 0–1 (progress)
  color: string;
  trackColor?: string;
  label?: string;
};

function Ring({
  progress, cx, cy, radius, strokeWidth, color, trackColor = 'rgba(255,255,255,0.08)',
}: {
  progress: ReturnType<typeof useSharedValue<number>>;
  cx: number; cy: number; radius: number; strokeWidth: number; color: string; trackColor?: string;
}) {
  const startAngle = -Math.PI / 2;

  const trackPath = (() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, radius);
    return p;
  })();

  const arcPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const sweep = 2 * Math.PI * Math.min(progress.value, 0.9999);
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    p.moveTo(x1, y1);
    p.addArc(
      { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 },
      (startAngle * 180) / Math.PI,
      (sweep * 180) / Math.PI
    );
    return p;
  });

  return (
    <>
      <Path path={trackPath} style="stroke" strokeWidth={strokeWidth} color={trackColor} strokeCap="round" />
      <Path path={arcPath} style="stroke" strokeWidth={strokeWidth} color={color} strokeCap="round" />
    </>
  );
}

export const ActivityRings = React.memo(function ActivityRings({
  rings,
  size = 160,
  strokeWidth = 16,
  gap = 6,
  duration = 1000,
  centerLabel,
  centerSubLabel,
}: {
  rings: RingData[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
  duration?: number;
  centerLabel?: string;
  centerSubLabel?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size / 2 - strokeWidth / 2;
  const radii = rings.map((_, i) => outerRadius - i * (strokeWidth + gap));
  const progresses = rings.map(() => useSharedValue(0));

  useEffect(() => {
    rings.forEach((ring, i) => {
      progresses[i].value = withDelay(
        i * 150,
        withTiming(ring.value, { duration, easing: Easing.out(Easing.cubic) })
      );
    });
  }, [rings.map(r => r.value).join(',')]);

  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      <Canvas style={{ width: size, height: size }}>
        {rings.map((ring, i) => (
          <Ring
            key={i}
            progress={progresses[i]}
            cx={cx} cy={cy}
            radius={radii[i]}
            strokeWidth={strokeWidth}
            color={ring.color}
            trackColor={ring.trackColor}
          />
        ))}
      </Canvas>

      {/* Center label overlay */}
      {(centerLabel || centerSubLabel) ? (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          className="items-center justify-center"
        >
          {centerLabel ? <Text className="text-gray-900 dark:text-white text-3xl font-bold">{centerLabel}</Text> : null}
          {centerSubLabel ? <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">{centerSubLabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
});

// Usage:
// <ActivityRings
//   rings={[
//     { value: 0.85, color: '#F43F5E', trackColor: 'rgba(244,63,94,0.12)', label: 'Move' },
//     { value: 0.60, color: '#22C55E', trackColor: 'rgba(34,197,94,0.12)', label: 'Exercise' },
//     { value: 0.40, color: '#3B82F6', trackColor: 'rgba(59,130,246,0.12)', label: 'Stand' },
//   ]}
//   size={180}
//   strokeWidth={18}
//   gap={8}
//   centerLabel="85%"
//   centerSubLabel="Goal"
// />
```

---

### Recipe 6 — Donut / Pie Chart

```tsx
// components/charts/DonutChart.tsx
// Use case: budget allocation, category breakdowns, expense distribution
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Canvas, Path, Skia, useDerivedValue } from '@shopify/react-native-skia';
import {
  useSharedValue, withDelay, withTiming, Easing,
} from 'react-native-reanimated';

export type DonutSegment = { value: number; color: string; label: string };

function DonutArc({
  progress, cx, cy, radius, strokeWidth, color, startAngle, sweepAngle,
}: {
  progress: ReturnType<typeof useSharedValue<number>>;
  cx: number; cy: number; radius: number; strokeWidth: number;
  color: string; startAngle: number; sweepAngle: number;
}) {
  const arcPath = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const sweep = sweepAngle * progress.value;
    if (sweep < 0.1) return p;
    p.addArc(
      { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 },
      startAngle - 90,
      sweep
    );
    return p;
  });

  return (
    <Path path={arcPath} style="stroke" strokeWidth={strokeWidth} color={color} strokeCap="butt" />
  );
}

export const DonutChart = React.memo(function DonutChart({
  segments,
  size = 200,
  strokeWidth = 28,
  centerLabel,
  centerSubLabel,
  gapAngle = 3,
  duration = 900,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSubLabel?: string;
  gapAngle?: number;
  duration?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size - strokeWidth) / 2;

  let currentAngle = 0;
  const segmentAngles = segments.map(seg => {
    const sweep = (seg.value / total) * 360 - gapAngle;
    const start = currentAngle + gapAngle / 2;
    currentAngle += (seg.value / total) * 360;
    return { start, sweep };
  });

  const progresses = segments.map(() => useSharedValue(0));

  useEffect(() => {
    segments.forEach((_, i) => {
      progresses[i].value = withDelay(
        i * 100,
        withTiming(1, { duration, easing: Easing.out(Easing.cubic) })
      );
    });
  }, [segments.map(s => s.value).join(',')]);

  return (
    <View>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Canvas style={{ width: size, height: size }}>
          {/* Background track */}
          <Path
            path={(() => { const p = Skia.Path.Make(); p.addCircle(cx, cy, radius); return p; })()}
            style="stroke"
            strokeWidth={strokeWidth}
            color="rgba(255,255,255,0.06)"
          />
          {segments.map((seg, i) => (
            <DonutArc
              key={i}
              progress={progresses[i]}
              cx={cx} cy={cy}
              radius={radius}
              strokeWidth={strokeWidth}
              color={seg.color}
              startAngle={segmentAngles[i].start}
              sweepAngle={segmentAngles[i].sweep}
            />
          ))}
        </Canvas>

        {(centerLabel || centerSubLabel) ? (
          <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            className="items-center justify-center"
          >
            {centerLabel ? <Text className="text-gray-900 dark:text-white text-2xl font-bold">{centerLabel}</Text> : null}
            {centerSubLabel ? <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">{centerSubLabel}</Text> : null}
          </View>
        ) : null}
      </View>

      {/* Legend */}
      <View className="flex-row flex-wrap mt-4 gap-3">
        {segments.map((seg, i) => (
          <View key={i} className="flex-row items-center gap-1.5">
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: seg.color }} />
            <Text className="text-gray-500 dark:text-gray-400 text-xs">
              {seg.label} ({Math.round((seg.value / total) * 100)}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
});

// Usage:
// const budget = [
//   { label: 'Housing', value: 1500, color: '#6366F1' },
//   { label: 'Food', value: 600, color: '#8B5CF6' },
//   { label: 'Transport', value: 350, color: '#22C55E' },
//   { label: 'Entertainment', value: 200, color: '#F59E0B' },
// ];
// <DonutChart
//   segments={budget}
//   size={200}
//   strokeWidth={28}
//   centerLabel="$2,650"
//   centerSubLabel="Monthly Budget"
// />
```

---

## Gesture Interactions

### Card Press Scale Animation

```tsx
// Pattern: any tappable card gets tactile scale feedback
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { SPRING_SNAPPY } from '../config/springs';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PressableCard({
  onPress,
  children,
  className = 'bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8',
}: {
  onPress: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      className={className}
      style={animatedStyle}
      onPressIn={() => { scale.value = withSpring(0.97, SPRING_SNAPPY); }}
      onPressOut={() => { scale.value = withSpring(1, SPRING_SNAPPY); }}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  );
}

// Scale guidelines:
// Cards:        0.97–0.98  (subtle)
// Buttons/CTAs: 0.95–0.96  (standard)
// Icon buttons: 0.88–0.92  (dramatic)
// List rows:    0.99        (very subtle)
```

---

### Like/Heart Button (Bouncy animation)

```tsx
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSequence, withTiming, withSpring,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { HapticPatterns } from '../utils/haptics';
import { SPRING_BOUNCY } from '../config/springs';

export function LikeButton({ count, liked }: { count: number; liked: boolean }) {
  const scale = useSharedValue(1);

  const handleLike = () => {
    scale.value = withSequence(
      withTiming(1.3, { duration: 80 }),   // fast pop up
      withSpring(1, SPRING_BOUNCY),         // bouncy settle
    );
    HapticPatterns.success();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handleLike} className="flex-row items-center gap-1.5 min-h-[44px] items-center">
      <Animated.View style={animStyle}>
        <Heart size={20} color={liked ? '#ef4444' : '#9ca3af'} fill={liked ? '#ef4444' : 'none'} />
      </Animated.View>
      <Text className="text-gray-500 dark:text-gray-500 text-sm">{count}</Text>
    </Pressable>
  );
}
```

---

## Component Composition Grammar

### Card vs ListSection — Decision Tree

```
Content to display?
│
├── Single entity with rich content (photo, heading, body, CTA)
│   └── → CARD (standalone, full-width or grid)
│
├── Multiple similar items, grouped under a header
│   └── Items are rows with consistent structure?
│       ├── Yes, 1-3 properties per row → LISTSECTION (settings-style table)
│       └── Flat feed with many items → FLATLIST with repeating Card
│
├── Single-action rows in a settings/menu context
│   └── → LISTITEM inside a container View
│
└── Flat homogeneous list (feed, search results)
    └── → FLATLIST with Card or ListItem
```

### StatCard Grid Rules

| Context | Grid | Rationale |
|---|---|---|
| Dashboard hero (2–4 key metrics) | 2-column | Maximum visual weight per stat |
| Summary section (5–8 metrics) | 2-col or 3-col | Balance density and legibility |
| Compact breakdown (6–12 small metrics) | 3-column | Information density |
| Single highlighted KPI | Full-width | Emphasis — usually at top of screen |
| Metric with sparkline/chart | Full-width | Chart needs horizontal space |

```
Character length determines column count:
  Short (≤6 chars: "$1.2K", "98%")  → 3-column works
  Medium (7-10 chars: "$12,450")     → 2-column preferred
  Long (11+ chars: "$1,245,000")     → Full-width required
```

### Avatar vs IconContainer Decision

```
What does this row represent?
├── A human user, contact, or team member → AVATAR
│   └── Has profile photo? → photo avatar
│   └── No photo? → initials avatar (deterministic color)
├── A transaction, event, or category → ICONCONTAINER
│   └── Color = semantic category color
│   └── Icon = action or type icon
└── An app, integration, or service → ICONCONTAINER with icon
```

| Category | IconContainer bg | Icon color |
|---|---|---|
| Revenue / income | `bg-green-100 dark:bg-green-500/15` | `#16a34a` dark: `#22c55e` |
| Expenses / costs | `bg-red-100 dark:bg-red-500/15` | `#dc2626` dark: `#ef4444` |
| Notifications / alerts | `bg-amber-100 dark:bg-amber-500/15` | `#d97706` dark: `#f59e0b` |
| Settings / system | `bg-gray-100 dark:bg-gray-700` | `#6b7280` dark: `#9ca3af` |

### Screen Layout Decision Tree

```
Screen content type?
│
├── Static content + form (settings, profile edit, onboarding step)
│   └── → SCROLLVIEW
│
├── Long homogeneous list (feed, search results, transactions)
│   └── → FLATLIST (not ScrollView + map)
│
├── Grouped list with section headers (contacts A-Z, grouped transactions)
│   └── → SECTIONLIST
│
├── Fixed, non-scrolling content (camera view, map)
│   └── → static VIEW (flex-1)
│
└── Hybrid (hero + tabs + list below)
    └── → FLATLIST with ListHeaderComponent for the hero/tabs
        NEVER nest FlatList inside ScrollView
```

### Navigation Pattern Decision

| Navigator | Use when | Example |
|---|---|---|
| **Stack** | Linear flow with back button | Onboarding → Home, Detail view, Checkout |
| **Bottom Tabs** | 2–5 top-level app sections accessed repeatedly | Home / Search / Notifications / Profile |
| **Top Tabs** | Same-level views within a screen (categories, filters) | All / Active / Completed |
| **BottomSheet** | Contextual actions without leaving context | Share sheet, filter panel, quick edit |
| **Modal** | Full confirmation, many-field form, media viewer | Delete confirm, new item form |

---

## Animation Recipes (v1 + New)

> All animations work in BOTH React Native Web preview AND native iOS. Never use `.springify()` on entering/exiting animations — use `.duration()` instead.

### Staggered List Entry

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

function AnimatedListItem({ item, index }: { item: any; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown
        .delay(Math.min(index, 8) * 60)  // 60ms stagger, max 8 items delay
        .duration(280)
        // NEVER .springify() — breaks on web
      }
    >
      {/* list item content */}
    </Animated.View>
  );
}
```

---

### Card Press Scale

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

<AnimatedPressable
  className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8"
  style={animatedStyle}
  onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); }}
  onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
  onPress={onPress}
>
  {children}
</AnimatedPressable>
```

---

### Screen Content Fade In

```tsx
import Animated, { FadeIn } from 'react-native-reanimated';

function MyScreenContent() {
  return (
    <Animated.View entering={FadeIn.duration(300)} className="flex-1">
      {/* Screen content */}
    </Animated.View>
  );
}
```

---

### Animated Checkmark (habit completion moment)

```tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedProps,
  withTiming, withDelay, withSpring, Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CHECK_PATH = 'M 20 52 L 38 68 L 64 36';
const CHECK_LENGTH = 58;

export function AnimatedCheckmark({
  checked,
  size = 32,
  color = '#22c55e',
}: {
  checked: boolean;
  size?: number;
  color?: string;
}) {
  const progress = useSharedValue(0);
  const circleScale = useSharedValue(0);

  useEffect(() => {
    if (checked) {
      circleScale.value = withSpring(1, { damping: 14, stiffness: 200 });
      progress.value = withDelay(150, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }));
    } else {
      progress.value = withTiming(0, { duration: 200 });
      circleScale.value = withTiming(0, { duration: 200 });
    }
  }, [checked]);

  const circleProps = useAnimatedProps(() => ({ r: 32 * circleScale.value, opacity: circleScale.value }));
  const checkProps = useAnimatedProps(() => ({
    strokeDasharray: [CHECK_LENGTH * progress.value, CHECK_LENGTH],
    strokeDashoffset: 0,
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 84 84" width={size} height={size}>
        <AnimatedCircle cx="42" cy="42" fill={color} animatedProps={circleProps} />
        <AnimatedPath
          d={CHECK_PATH} stroke="white" strokeWidth={5}
          strokeLinecap="round" strokeLinejoin="round" fill="none"
          animatedProps={checkProps}
        />
      </Svg>
    </View>
  );
}
```

---

### Toast Notification

```tsx
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { AccessibilityInfo } from 'react-native';
import { useEffect } from 'react';

export function Toast({
  message,
  type = 'success',
  visible,
}: {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
}) {
  useEffect(() => {
    if (visible && message) {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, {
        queue: type !== 'error' && type !== 'warning',
      });
    }
  }, [visible, message, type]);

  if (!visible) return null;

  const bgColor =
    type === 'error' ? 'bg-red-600' :
    type === 'success' ? 'bg-green-600' :
    type === 'warning' ? 'bg-amber-500' : 'bg-gray-800';

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      exiting={FadeOutUp.duration(250)}
      className={`mx-4 px-4 py-3 rounded-xl ${bgColor}`}
      accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'}
      accessible={true}
      accessibilityLabel={message}
    >
      <Text className="text-white font-medium text-center">{message}</Text>
    </Animated.View>
  );
}
```

---

## Anti-Patterns (NEVER DO THIS)

50 patterns the AI agent must NEVER produce. Each has ❌ wrong and ✅ correct.

---

**1. ❌ NEVER use `bg-black`**
```tsx
// WRONG
<View className="bg-black flex-1">
// CORRECT
<View className="bg-gray-50 dark:bg-gray-950 flex-1">
```

---

**2. ❌ NEVER default to violet/purple accent**
```tsx
// WRONG — violet signals "AI generated this"
<Pressable className="bg-violet-600">
// CORRECT — pick from Category-Aware Accent Palettes
<Pressable className="bg-orange-500">  // health/fitness
<Pressable className="bg-blue-500">    // finance
```

---

**3. ❌ NEVER center text on an empty dark screen as the whole UI**
```tsx
// WRONG
<View className="flex-1 bg-black items-center justify-center">
  <Text className="text-white text-xl">No habits yet</Text>
</View>
// CORRECT — EmptyState component with icon + description + CTA
<EmptyState icon={<CheckCircle2 size={64} color="#111827" />} title="No habits yet" description="Add your first habit." ctaLabel="Add habit" onCta={...} />
```

---

**4. ❌ NEVER use inline styles when `className` works**
```tsx
// WRONG
<View style={{ padding: 16, backgroundColor: '#1f2937', borderRadius: 12 }}>
// CORRECT
<View className="p-4 bg-gray-800 rounded-xl">
```

---

**5. ❌ NEVER create a tab bar with a highlighted rectangle on active tab**
```tsx
// WRONG — Material Design, not iOS
<View style={{ backgroundColor: activeIndex === i ? '#7c3aed' : 'transparent' }}>
// CORRECT — iOS: icon fill state + label color change, no bg rect
// Active: text-blue-400 icon + label. No background rectangle.
```

---

**6. ❌ NEVER ship a screen without an empty state**
```tsx
// WRONG — blank screen when data is empty
return <FlatList data={habits} renderItem={...} />;
// CORRECT
return habits.length === 0
  ? <EmptyState icon={...} title="No habits yet" description="..." ctaLabel="Add habit" onCta={...} />
  : <FlatList data={habits} renderItem={...} />;
```

---

**7. ❌ NEVER use `Animated.View` with `className` (Reanimated ≥ 3.16 bug)**
```tsx
// WRONG
<Animated.View className="bg-gray-900 p-4 rounded-xl" style={animatedStyle}>
// CORRECT — wrap pattern
<Animated.View style={animatedStyle}>
  <View className="bg-gray-900 p-4 rounded-xl">{children}</View>
</Animated.View>
// OR use createAnimatedComponent
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
<AnimatedPressable className="bg-gray-900 p-4 rounded-xl" style={animatedStyle} />
```

---

**8. ❌ NEVER use `TouchableOpacity`**
```tsx
// WRONG
<TouchableOpacity onPress={handlePress}>
// CORRECT
<Pressable className="active:opacity-80" onPress={handlePress}>
```

---

**9. ❌ NEVER forget default exports on screen files**
```tsx
// WRONG — blank screen in expo-router
function HabitScreen() { return <View>...</View> }
// CORRECT
export default function HabitScreen() { return <View>...</View> }
```

---

**10. ❌ NEVER use empty string `''` in JSX ternaries**
```tsx
// WRONG — '' renders as a text node in React Native, throws error
{condition ? '' : <View />}
// CORRECT
{condition ? null : <View />}
```

---

**11. ❌ NEVER use `SafeAreaView` from `react-native`**
```tsx
// WRONG
import { SafeAreaView } from 'react-native';
// CORRECT
import { SafeAreaView } from 'react-native-safe-area-context';
```

---

**12. ❌ NEVER use arbitrary spacing values**
```tsx
// WRONG — not on the 8pt grid
<View style={{ marginLeft: 13, paddingVertical: 7 }}>
// CORRECT — all spacing divisible by 4
<View className="ml-3 py-2">
```

---

**13. ❌ NEVER use `LinearGradient` with `className`**
```tsx
// WRONG — LinearGradient does not support className
<LinearGradient className="rounded-xl p-4" colors={[...]}>
// CORRECT — use inline style
<LinearGradient colors={[...]} style={{ borderRadius: 12, padding: 16 }}>
  <Text className="text-white font-semibold">Content</Text>
</LinearGradient>
```

---

**14. ❌ NEVER use ScrollView for a long list of data**
```tsx
// WRONG — poor performance with 50+ items
<ScrollView>{items.map(item => <ItemRow key={item.id} item={item} />)}</ScrollView>
// CORRECT
<FlatList
  data={items}
  estimatedItemSize={56}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <ItemRow item={item} />}
/>
```

---

**15. ❌ NEVER put shadows on dark-mode cards**
```tsx
// WRONG — shadows are invisible on dark backgrounds
<View className="bg-gray-900 rounded-xl shadow-lg">
// CORRECT — use border for edge definition in dark mode
<View className="bg-gray-900 rounded-xl border border-white/8">
// Shadows are appropriate ONLY in light mode:
<View className="bg-white rounded-xl border border-gray-100" style={{ shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 }}>
```

---

**16. ❌ NEVER use spring layout animations on web preview**
```tsx
// WRONG — .springify() on entering/exiting causes errors on React Native Web
<Animated.View entering={FadeInDown.springify()}>
// CORRECT
<Animated.View entering={FadeInDown.duration(280)}>
```

---

**17. ❌ NEVER ship a form without `KeyboardAvoidingView`**
```tsx
// WRONG — keyboard covers input fields
<ScrollView><TextInput /></ScrollView>
// CORRECT
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
  <ScrollView keyboardShouldPersistTaps="handled">
    <TextInput ... />
  </ScrollView>
</KeyboardAvoidingView>
```

---

**18. ❌ NEVER use 5+ different font sizes on one screen**
```tsx
// WRONG — size escalation for hierarchy
<Text style={{ fontSize: 28 }}>Title</Text>
<Text style={{ fontSize: 20 }}>Subtitle</Text>
<Text style={{ fontSize: 16 }}>Body</Text>
<Text style={{ fontSize: 13 }}>Meta</Text>
<Text style={{ fontSize: 11 }}>Footnote</Text>
// CORRECT — max 3 sizes; differentiate with weight and color
<Text className="text-2xl font-bold text-gray-900 dark:text-white">Title</Text>
<Text className="text-base font-semibold text-gray-900 dark:text-white">Subtitle</Text>
<Text className="text-base font-normal text-gray-500 dark:text-gray-400">Body and metadata</Text>
```

---

**19. ❌ NEVER use `Alert.alert()` for confirmations**
```tsx
// WRONG — can't be styled, looks non-native on modern iOS
Alert.alert("Delete?", "Are you sure?", [...])
// CORRECT — custom modal or AlertDialog from gluestack-ui
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent } from '@/components/ui/alert-dialog';
```

---

**20. ❌ NEVER leave TextInput unstyled**
```tsx
// WRONG — platform-default border looks amateur
<TextInput placeholder="Enter name" />
// CORRECT — always style fully with dark + light variants
<TextInput
  className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10"
  style={{ height: 52 }}
  placeholderTextColor="#9ca3af"
/>
```

---

**21. ❌ NEVER omit `StatusBar` configuration**
```tsx
// WRONG — no StatusBar = inconsistent appearance
// CORRECT — set at root layout
import { StatusBar } from 'expo-status-bar';
<StatusBar style="light" />  // or "dark" for light mode
```

---

**22. ❌ NEVER use `setTimeout` for animations**
```tsx
// WRONG — runs on JS thread, causes jank
setTimeout(() => setVisible(true), 300)
// CORRECT — Reanimated delay runs on UI thread
withDelay(300, withTiming(1))
```

---

**23. ❌ NEVER leave `console.log` in production**
```tsx
// WRONG
console.log("data:", items)
// CORRECT
__DEV__ && console.log("data:", items)
// or remove entirely
```

---

**24. ❌ NEVER render heavy components eagerly on app start**
```tsx
// WRONG — MapView mounted on initial render even if tab not visible
<Tab.Screen name="Map" component={MapScreen} />  // MapView inside always mounts
// CORRECT — lazy load or gate with useIsFocused
const isFocused = useIsFocused();
return isFocused ? <MapView /> : null;
```

---

**25. ❌ NEVER use FlatList without `keyExtractor`**
```tsx
// WRONG — React reconciliation issues, flickering
<FlatList data={items} renderItem={...} />
// CORRECT
<FlatList data={items} renderItem={...} keyExtractor={item => item.id} />
```

---

**26. ❌ NEVER nest ScrollViews without `nestedScrollEnabled`**
```tsx
// WRONG — inner ScrollView won't scroll on Android
<ScrollView><ScrollView horizontal>...</ScrollView></ScrollView>
// CORRECT
<ScrollView><ScrollView horizontal nestedScrollEnabled>...</ScrollView></ScrollView>
```

---

**27. ❌ NEVER ignore keyboard dismissal**
```tsx
// WRONG — tapping outside an input doesn't dismiss keyboard
// CORRECT — wrap screen root in dismissable Pressable
<Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss}>
  {/* form content */}
</Pressable>
```

---

**28. ❌ NEVER use full-width buttons in wide layouts without max-width**
```tsx
// WRONG — button stretches 100% on iPad/web
<Pressable className="w-full">
// CORRECT
<Pressable className="w-full max-w-sm self-center">
```

---

**29. ❌ NEVER mix raw hex colors with Tailwind classes**
```tsx
// WRONG — causes color drift
<View style={{ backgroundColor: '#1C1C1E' }}>
// CORRECT — always use Tailwind classes
<View className="bg-gray-900">
```

---

**30. ❌ NEVER ignore safe area in bottom sheets**
```tsx
// WRONG — content behind home indicator bar
<BottomSheet><View>...</View></BottomSheet>
// CORRECT
<BottomSheet><View style={{ paddingBottom: insets.bottom }}>...</View></BottomSheet>
```

---

**31. ❌ NEVER show a blank screen during async data loading**
```tsx
// WRONG — crashes on undefined, or shows empty white screen
const { data } = useQuery(...);
return <Text>{data.title}</Text>
// CORRECT
const { data, isLoading, isError } = useQuery(...);
if (isLoading) return <ScreenSkeleton count={6} />;
if (isError) return <ErrorState onRetry={refetch} />;
return <Text>{data.title}</Text>;
```

---

**32. ❌ NEVER ignore error states**
```tsx
// WRONG — silent failure, user sees blank screen
const { data, isLoading } = useQuery(...)  // ignoring isError
// CORRECT — always handle all three states
if (isLoading) return <LoadingSkeleton />;
if (isError) return (
  <View className="flex-1 items-center justify-center px-8">
    <Text className="text-gray-900 dark:text-white text-lg font-semibold mb-4">Failed to load</Text>
    <Pressable onPress={refetch} className="bg-orange-500 rounded-xl px-6 py-3">
      <Text className="text-white font-semibold">Try again</Text>
    </Pressable>
  </View>
);
return <RealContent data={data} />;
```

---

**33. ❌ NEVER mutate state directly**
```tsx
// WRONG — causes stale renders
items.push(newItem); setItems(items)
// CORRECT
setItems(prev => [...prev, newItem])
```

---

**34. ❌ NEVER use array index as key in dynamic lists**
```tsx
// WRONG — wrong components reused when items reorder
{items.map((item, i) => <Row key={i} {...item} />)}
// CORRECT
{items.map(item => <Row key={item.id} {...item} />)}
```

---

**35. ❌ NEVER omit haptic feedback on interactions**
```tsx
// WRONG — app feels flat and unresponsive
<Pressable onPress={handleDelete}>
// CORRECT
<Pressable onPress={() => { HapticPatterns.destructive(); handleDelete(); }}>
```

---

**36. ❌ NEVER use `Dimensions.get('window')` for layout**
```tsx
// WRONG — value is stale on rotation or split view
const { width } = Dimensions.get('window')
// CORRECT — reactive hook
const { width } = useWindowDimensions()
```

---

**37. ❌ NEVER leave long text without numberOfLines**
```tsx
// WRONG — overflows or wraps unpredictably
<Text className="text-sm">{item.title}</Text>
// CORRECT
<Text className="text-sm" numberOfLines={1}>{item.title}</Text>
```

---

**38. ❌ NEVER omit pull-to-refresh on lists**
```tsx
// WRONG
<FlatList data={...} />
// CORRECT
<FlatList
  data={...}
  refreshing={isRefreshing}
  onRefresh={refetch}
/>
```

---

**39. ❌ NEVER mix inline styles with className (for components that support className)**
```tsx
// WRONG — specificity confusion, prevents theming
<View className="p-4" style={{ backgroundColor: 'red' }}>
// CORRECT — pick one. Use className for everything except non-className-supporting components
<View className="p-4 bg-red-500">
```

---

**40. ❌ NEVER omit optimistic UI for mutations**
```tsx
// WRONG — user taps "complete" and waits 2s for server response
const { mutate } = useMutation({ mutationFn: completeHabit });
// CORRECT — instant UI, roll back on error
const { mutate } = useMutation({
  mutationFn: completeHabit,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['habits'] });
    const snapshot = queryClient.getQueryData(['habits']);
    queryClient.setQueryData(['habits'], old => old.map(h => h.id === id ? { ...h, done: true } : h));
    return { snapshot };
  },
  onError: (_, __, ctx) => queryClient.setQueryData(['habits'], ctx.snapshot),
});
```

---

**41. ❌ NEVER show no feedback on long-running operations**
```tsx
// WRONG — button looks same while processing
<Pressable onPress={handleSave}><Text>Save</Text></Pressable>
// CORRECT — loading state
<Pressable onPress={handleSave} disabled={isSaving} className={isSaving ? 'opacity-50' : ''}>
  {isSaving ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-semibold">Save</Text>}
</Pressable>
```

---

**42. ❌ NEVER forget `dark:` variants on new elements**
```tsx
// WRONG — white card in a dark-mode app
<View className="bg-white rounded-xl p-4">
// CORRECT
<View className="bg-white dark:bg-gray-900 rounded-xl p-4">
```

---

**43. ❌ NEVER render images without fixed dimensions**
```tsx
// WRONG — layout shift when image loads
<Image source={{ uri: url }} />
// CORRECT
<Image source={{ uri: url }} className="w-full aspect-video rounded-xl" />
```

---

**44. ❌ NEVER use scrollTo without animated**
```tsx
// WRONG — jarring jump
scrollViewRef.current?.scrollTo({ y: 0 })
// CORRECT
scrollViewRef.current?.scrollTo({ y: 0, animated: true })
```

---

**45. ❌ NEVER use expo-haptics on web without Platform check**
```tsx
// WRONG — crashes on web
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
// CORRECT — always guard
if (Platform.OS !== 'web') {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
// Or use HapticPatterns from utils/haptics.ts — guards are built in
```

---

**46. ❌ NEVER use Skia/Victory Native without web setup**
```tsx
// WRONG — crashes on Expo Web with "CanvasKit is not defined"
import { CartesianChart } from 'victory-native';
// CORRECT — ensure LoadSkiaWeb() is called in index.web.tsx first
// Or wrap chart screens with <WithSkiaWeb>
```

---

**47. ❌ NEVER pass CSS named colors to Victory Native**
```tsx
// WRONG — will not render
xAxis={{ labelColor: "gray", lineColor: "transparent" }}
// CORRECT — hex or rgba only
xAxis={{ labelColor: "#9CA3AF", lineColor: "rgba(0,0,0,0)" }}
```

---

**48. ❌ NEVER nest FlatList inside ScrollView**
```tsx
// WRONG — broken behavior, elements don't scroll correctly
<ScrollView>
  <HeroSection />
  <FlatList data={items} />
</ScrollView>
// CORRECT — use ListHeaderComponent
<FlatList
  data={items}
  ListHeaderComponent={() => <HeroSection />}
  renderItem={({ item }) => <ItemCard item={item} />}
/>
```

---

**49. ❌ NEVER use `accessibilityLabel` that just repeats visible text**
```tsx
// WRONG — redundant, VoiceOver reads visible text anyway
<Pressable accessibilityLabel="Settings">
  <Text>Settings</Text>
</Pressable>
// CORRECT — add context when icon-only or when label needs context
<Pressable accessibilityLabel="Open settings">   // OK to have label, or omit since text is visible
// For icon-only buttons, always provide label with context:
<Pressable accessibilityLabel="Like post, 47 likes" accessibilityRole="button">
  <Heart size={20} />
</Pressable>
```

---

**50. ❌ NEVER use `placeholder` data ("Item 1", "Lorem ipsum")**
```tsx
// WRONG — signals template/prototype quality
const ITEMS = [{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }]
// CORRECT — realistic mock data always
const HABITS = [
  { id: '1', name: 'Morning run', streak: 14, done: false, color: '#f97316' },
  { id: '2', name: 'Read 20 pages', streak: 8, done: true, color: '#60a5fa' },
  { id: '3', name: 'Meditate 10 min', streak: 23, done: false, color: '#a78bfa' },
]
```

**51. ❌ NEVER skip loading/empty/error states**
```tsx
// WRONG — only shows happy path
export default function Screen() {
  return <FlatList data={DATA} renderItem={...} />;
}
// CORRECT — all three states handled
export default function Screen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  if (loading) return <LoadingSkeleton />;
  if (data.length === 0) return <EmptyState onAdd={handleAdd} />;
  return <FlatList data={data} renderItem={...} />;
}
```

**52. ❌ NEVER use inconsistent border radius**
```tsx
// WRONG — mixed radius values look unpolished
<View className="rounded-lg">   {/* 8px */}
<View className="rounded-xl">  {/* 12px */}
<View className="rounded-md">  {/* 6px */}
// CORRECT — consistent radius hierarchy
<View className="rounded-2xl"> {/* Cards: 16px */}
<View className="rounded-xl">  {/* Smaller elements: 12px */}
<View className="rounded-full"> {/* Avatars, pills, buttons */}
```

**53. ❌ NEVER put a card inside a card**
```tsx
// WRONG — creates confusing depth
<View className="bg-white dark:bg-gray-900 rounded-2xl p-4">
  <View className="bg-white dark:bg-gray-900 rounded-xl p-3">
    {/* Nested card = visual noise */}
  </View>
</View>
// CORRECT — use inset surface (Level 2) for grouping inside cards
<View className="bg-white dark:bg-gray-900 rounded-2xl p-4">
  <View className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3">
    {/* Inset surface provides subtle grouping */}
  </View>
</View>
```

**54. ❌ NEVER leave a screen without a scroll container when content overflows**
```tsx
// WRONG — content below the fold is unreachable, user cannot scroll
export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-950">
      <View className="flex-1 p-4">
        <Text>Header</Text>
        {/* ... lots of cards, charts, lists that exceed viewport ... */}
      </View>
    </SafeAreaView>
  );
}
// CORRECT — use ScreenWrapper (scrollable by default) for overflowing content
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
export default function DashboardScreen() {
  return (
    <ScreenWrapper>
      <View className="p-4">
        <Text>Header</Text>
        {/* ... lots of cards, charts, lists ... */}
      </View>
    </ScreenWrapper>
  );
}
// ALSO CORRECT — content fits viewport, use scrollable={false}
import { ScreenWrapper } from '@/components/ui/screen-wrapper';
export default function SimpleScreen() {
  return (
    <ScreenWrapper scrollable={false}>
      <View className="flex-1 p-4 justify-between">
        <Text>Title</Text>
        <Card>{/* single card */}</Card>
        <Button>Action</Button>
      </View>
    </ScreenWrapper>
  );
}
```
**CONSTRAINT:** Scrolling should only be enabled when content overflows. If a screen has 2-3 cards that fit the viewport, use `scrollable={false}` and lay out with `flex` + `justify-between`. Add `bounces={false}` on ScrollViews where content exactly/nearly fits to prevent rubber-band.

**55. ❌ NEVER clip horizontal overflow without a scroll container**
```tsx
// WRONG — cards/chips beyond screen edge are hidden, user cannot swipe
<View className="flex-row gap-3 px-4">
  <Chip label="All" />
  <Chip label="Active" />
  <Chip label="Completed" />
  <Chip label="Archived" />
  <Chip label="Favorites" />
</View>
// CORRECT — horizontal ScrollView on the individual row
<ScrollView horizontal showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
  <Chip label="All" />
  <Chip label="Active" />
  <Chip label="Completed" />
  <Chip label="Archived" />
  <Chip label="Favorites" />
</ScrollView>
```
**CONSTRAINT:** Only use horizontal scroll for individual content rows (chip bars, carousels, story rings). NEVER make the entire screen horizontally scrollable. NEVER use both horizontal and vertical scroll on the same ScrollView unless it is a canvas/map pattern.

## Advanced Accessibility

### VoiceOver Focus Management

#### Modal / Bottom Sheet Focus Trapping

```tsx
// ✅ CORRECT: accessibilityViewIsModal on the modal's root view
const AccessibleBottomSheet = ({ visible, title, onClose, children }) => {
  const headingRef = useRef<Text>(null);

  useEffect(() => {
    if (visible) {
      // Small delay required — native layout must complete first
      const timer = setTimeout(() => {
        const node = findNodeHandle(headingRef.current);
        if (node) AccessibilityInfo.setAccessibilityFocus(node);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <>
      {/* Scrim — hidden from VoiceOver */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      />
      {/* Sheet content — traps VoiceOver focus */}
      <View
        accessibilityViewIsModal={true}    // iOS: silences all siblings
        importantForAccessibility="yes"    // Android
        accessibilityRole="dialog"
        accessibilityLabel={title}
      >
        <Text
          ref={headingRef}
          accessibilityRole="header"
          accessible={true}
        >
          {title}
        </Text>
        {children}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
      </View>
    </>
  );
};
```

#### `useAccessibilityFocus` Hook — Screen Navigation

When React Navigation pushes a new screen, VoiceOver does NOT automatically move focus. Fix this with a hook on every screen:

```tsx
// hooks/useAccessibilityFocus.ts
import { useRef, useCallback } from 'react';
import { AccessibilityInfo, findNodeHandle } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function useAccessibilityFocus<T extends any = any>() {
  const focusRef = useRef<T>(null);

  const setFocus = useCallback(() => {
    if (!focusRef.current) return;
    setTimeout(() => {
      const node = findNodeHandle(focusRef.current as any);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 200);  // Delay: navigation transition must complete first
  }, []);

  useFocusEffect(setFocus);
  return focusRef;
}

// Usage — place ref on the screen's heading:
export function MyScreen() {
  const headingRef = useAccessibilityFocus<Text>();
  return (
    <ScrollView>
      <Text
        ref={headingRef}
        accessibilityRole="header"
        accessible={true}
        className="text-gray-900 dark:text-white text-3xl font-bold"
      >
        My Screen Title
      </Text>
      {/* rest of screen */}
    </ScrollView>
  );
}
```

**Best practice:** Focus should land on the **screen heading** (`accessibilityRole="header"`), not the first interactive element. Announcing the heading confirms the navigation was successful.

---

### Semantic Grouping

Using `accessible={true}` on a parent `View` collapses all children into a **single VoiceOver element**. VoiceOver reads the parent's `accessibilityLabel` instead of traversing children individually.

```tsx
// ✅ Grouped: VoiceOver reads "Monthly Revenue, $12,450, up 8 percent"
<View
  accessible={true}
  accessibilityLabel="Monthly Revenue, $12,450, up 8 percent"
  className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8"
>
  <Text className="text-gray-500 dark:text-gray-400 text-sm">Monthly Revenue</Text>
  <Text className="text-gray-900 dark:text-white text-2xl font-bold">$12,450</Text>
  <View className="flex-row items-center">
    <TrendingUp size={14} color="#16a34a" />
    <Text className="text-green-600 dark:text-green-400 text-sm">+8%</Text>
  </View>
</View>

// ❌ Ungrouped: VoiceOver reads 3 separate items, reads icons as unknown
<View className="bg-white dark:bg-gray-900 rounded-xl p-4">
  <Text>Monthly Revenue</Text>
  <Text>$12,450</Text>
  <TrendingUp />
  <Text>+8%</Text>
</View>
```

**Rules for grouping:**
1. Group when: label + value form a single semantic unit (stat cards, profile info rows, badges)
2. Don't group when: each child has its own independent action (button groups, form fields)
3. Always compute the full label — don't let VoiceOver concatenate raw child text

```tsx
// Decorative icons should be hidden from VoiceOver
<View
  accessible={false}
  importantForAccessibility="no-hide-descendants"
  accessibilityElementsHidden={true}
>
  <TrendingUpIcon />
</View>
```

---

### Reduce Motion Support

```tsx
// hooks/useMotionValue.ts
// Returns either an animated value OR an instant static value based on system setting
import { useReducedMotion } from 'react-native-reanimated';
import {
  useSharedValue, withSpring, withTiming, runOnJS,
} from 'react-native-reanimated';

export function useMotionValue(initialValue: number) {
  const reducedMotion = useReducedMotion();
  const value = useSharedValue(initialValue);

  const animate = ({
    to,
    type = 'spring',
    duration = 300,
    onComplete,
  }: {
    from?: number;
    to: number;
    type?: 'spring' | 'timing';
    duration?: number;
    onComplete?: () => void;
  }) => {
    if (reducedMotion) {
      // Instant — no animation. Manually invoke callback (Reanimated won't fire it).
      value.value = to;
      if (onComplete) onComplete();
      return;
    }

    if (type === 'spring') {
      value.value = withSpring(to, { damping: 15, stiffness: 150 }, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      });
    } else {
      value.value = withTiming(to, { duration }, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      });
    }
  };

  return { value, animate, reducedMotion };
}
```

```tsx
// Apply at app root — respects device setting automatically
// app/_layout.tsx
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <ReducedMotionConfig mode={ReduceMotion.System} />
      <Stack />
    </>
  );
}
```

---

### Screen Reader Announcements

```tsx
// hooks/useAccessibilityAnnounce.ts
import { AccessibilityInfo } from 'react-native';
import { useCallback } from 'react';

// IMPORTANT: accessibilityLiveRegion does NOT work on iOS.
// Always use imperative announceForAccessibility for iOS.
type Priority = 'polite' | 'assertive';

export function useAccessibilityAnnounce() {
  return useCallback((message: string, priority: Priority = 'polite') => {
    AccessibilityInfo.announceForAccessibilityWithOptions(message, {
      queue: priority === 'polite',  // queue: true = polite (waits); false = assertive (interrupts)
    });
  }, []);
}

// When to use polite vs assertive:
// polite:    loading complete, item added, search results loaded, background sync done
// assertive: form validation errors, session expiry, critical errors, timer running out
```

---

### Dynamic Type Scaling

```tsx
// Scale caps per text role — prevents layout breakage at large font sizes
const FONT_SCALE_CAPS = {
  display:    1.2,  // Large display text — very constrained
  heading:    1.3,  // Section headings
  subheading: 1.4,
  body:       2.0,  // Body text — let it scale generously
  caption:    1.8,
  button:     1.3,  // Buttons have space constraints
  badge:      1.0,  // Fixed-size badges — no scaling
} as const;

// Apply maxFontSizeMultiplier on all Text in the app:
// Tab bar labels — most constrained:
<Text
  className="text-xs font-medium text-gray-400 dark:text-gray-500"
  maxFontSizeMultiplier={1.2}
>
  {label}
</Text>

// Stat values — allow more scaling:
<Text
  className="text-3xl font-bold text-gray-900 dark:text-white"
  maxFontSizeMultiplier={1.4}
>
  {value}
</Text>

// Detect large text to reflow layout:
function useIsLargeText(threshold = 1.3): boolean {
  return PixelRatio.getFontScale() >= threshold;
}

function StatRow({ label, value }) {
  const isLarge = useIsLargeText();
  return (
    <View className={isLarge ? 'flex-col gap-1' : 'flex-row justify-between'}>
      <Text className="text-gray-500 dark:text-gray-400 text-sm" maxFontSizeMultiplier={1.8}>{label}</Text>
      <Text className="text-gray-900 dark:text-white font-semibold" maxFontSizeMultiplier={1.4}>{value}</Text>
    </View>
  );
}
```

---

### Reduce Transparency Support

The `bg-orange-500/15` NativeWind pattern breaks for Reduce Transparency users. Replace translucent backgrounds with solid approximations:

```tsx
// hooks/useReduceTransparency.ts
import { useState, useEffect } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useReduceTransparency() {
  const [reduceTransparency, setReduceTransparency] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => subscription.remove();
  }, []);

  return reduceTransparency;
}

// Usage — solid fallbacks for translucent badges:
const COLOR_MAP = {
  orange: {
    normal: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
    solid:  'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  },
  blue: {
    normal: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    solid:  'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  },
};

export function TagBadge({ label, color = 'orange' }: { label: string; color?: 'orange' | 'blue' }) {
  const reduceTransparency = useReduceTransparency();
  const classes = reduceTransparency ? COLOR_MAP[color].solid : COLOR_MAP[color].normal;

  return (
    <View className={`px-2 py-0.5 rounded-full ${classes}`}>
      <Text className="text-xs font-medium">{label}</Text>
    </View>
  );
}
```

---

## Accessibility Checklist

Apply these rules to EVERY component and screen before considering it complete.

### Touch Targets
- **Minimum 44×44pt** for every tappable element — use `min-h-[44px] min-w-[44px]` or `h-11 w-11`
- Small icon-only buttons: wrap in a `Pressable` with `p-2` padding to expand the hit area
- Tab bar items: minimum 49pt height (the tab bar default height)

### Contrast Ratios
- **Text on backgrounds:** minimum 4.5:1 contrast ratio for body text
  - ✅ `text-white` on `bg-gray-900`: 15.1:1 ratio — excellent
  - ✅ `text-gray-400` on `bg-gray-900`: 5.2:1 — passes AA
  - ✅ `text-gray-500` on `bg-gray-950`: 4.8:1 — passes AA
  - ❌ `text-gray-600` on `bg-gray-950`: ~3.1:1 — fails (use for decoration only, not readable text)
- **Large text (18pt+ or 14pt+ bold):** minimum 3:1 contrast ratio
- **Light mode:** `text-gray-900` on `bg-white` — always passes. `text-gray-500` on `bg-white` — passes AA.

### Semantic Roles (required on every interactive element)
```tsx
// Pressable / button
accessibilityRole="button"
accessibilityLabel="Descriptive label for screen readers"

// Navigation links
accessibilityRole="link"

// Toggles / checkboxes
accessibilityRole="checkbox"
accessibilityState={{ checked: isChecked }}

// Tab bar items
accessibilityRole="tab"
accessibilityState={{ selected: isFocused }}

// Screen titles / section headers
accessibilityRole="header"

// Images
accessibilityLabel="Description of image content"
// OR for decorative images:
accessibilityElementsHidden={true}
importantForAccessibility="no-hide-descendants"
```

### Advanced Focus Rules
- Modals / sheets: set `accessibilityViewIsModal={true}` on sheet root AND use `setTimeout` to set focus on the heading ref (150ms delay)
- After a modal closes: return focus to the element that triggered it
- Navigation screens: `useAccessibilityFocus()` hook on the heading element
- Navigation bars: back button should always be the first focusable element

### Screen Reader Best Practices
- Use `AccessibilityInfo.announceForAccessibilityWithOptions` for toasts and success/error events (NOT `accessibilityLiveRegion` — it doesn't work on iOS)
- Group stat cards with `accessible={true}` + computed `accessibilityLabel` — don't let VoiceOver concatenate individual values
- Hide decorative icons from VoiceOver with `importantForAccessibility="no-hide-descendants"`

### Dynamic Type
- Use the custom font size scale (text-xs through text-5xl) — all map to specific pt values
- Apply `maxFontSizeMultiplier` on all `Text` nodes: display=1.2, heading=1.3, body=2.0, button=1.3, badge=1.0
- Test layout at large text sizes — use `useIsLargeText()` hook to reflow stat rows from row to column

### Empty States Accessibility
- Empty state containers: `accessibilityLiveRegion="polite"` so screen readers announce them when content changes
- CTA buttons in empty states: describe the action clearly ("Add your first habit", not "Add")

---

## Polish Pass Checklist

After generating ALL code files, run through this checklist for every screen. This is what separates "works" from "feels like a real app."

### States (every screen MUST have all three)
- [ ] **Loading state**: Shows skeleton/spinner while data is fetching. Uses skeleton components, NOT a centered `ActivityIndicator`. Skeletons have both light and dark mode.
- [ ] **Error state**: Shows inline error message with retry button when data fails. NOT a blank screen. Includes: error text + retry `Pressable` with haptic feedback.
- [ ] **Empty state**: Shows contextual empty state with icon/illustration, description, and CTA when no data exists. NOT just "No items." Must be themed for both modes.

### Interaction Polish
- [ ] **Haptic feedback**: Every button press, toggle, swipe action, and destructive action has appropriate haptic using `HapticPatterns`. Wrapped in Platform.OS !== 'web' guard.
- [ ] **Press feedback**: Every `Pressable` has visual feedback — scale down to 0.97 on press (`SPRING_SNAPPY`), or opacity change, or background color shift via `active:` class.
- [ ] **Optimistic UI**: Mutations (add, delete, toggle, update) reflect instantly in UI before server/storage confirms. Roll back on error using `onMutate`/`onError` in `useMutation`.
- [ ] **Pull-to-refresh**: Every scrollable list has `refreshing` and `onRefresh` props.
- [ ] **Long-press context menu**: List items with actions (edit, delete, share) support long-press to reveal a context menu. Use `LongPressMenu` component.
- [ ] **Swipe actions**: List items with common actions (delete, archive, complete) have swipe-to-action gestures. Use `SwipeableRow` component.
- [ ] **Destructive confirmations**: Every delete/remove action shows a confirmation dialog before executing.

### Navigation & Transitions
- [ ] **Screen entry animation**: Content fades/slides in on mount using `FadeIn.duration(300)` or staggered entry. Not just appearing instantly.
- [ ] **Staggered entry on lists**: FlatList items animate in sequence (50-80ms delay, capped at index 8). Use `useStaggeredEntry` hook.
- [ ] **Tab switch animation**: Tab content transitions smoothly via `FadeInDown.duration(200)`.
- [ ] **Back navigation**: Hardware/gesture back works correctly on every screen.

### Typography & Content
- [ ] **Realistic mock data**: Every screen shows realistic data — real names, real amounts, real dates. No "Item 1" or "Lorem ipsum."
- [ ] **Text truncation**: Long text has `numberOfLines` set. Labels: 1–2 lines. Descriptions: 2–3 lines.
- [ ] **Dynamic content**: Layout holds for 0 items, 1 item, 3 items, 50 items.
- [ ] **Number formatting**: Currency uses `$1,234.56` format. Dates use relative format ("2 hours ago", "Yesterday"). Percentages show one decimal.

### Accessibility
- [ ] **Touch targets**: Every interactive element is at least 44×44pt (`min-h-[44px] min-w-[44px]`).
- [ ] **Contrast ratio**: Text on background meets WCAG AA. Primary text passes; secondary text passes; `text-gray-600 dark:` is decoration only.
- [ ] **Labels**: Every icon button and image has `accessibilityLabel`. Description, not just the icon name.
- [ ] **Roles**: Interactive elements have `accessibilityRole` (button, link, tab, checkbox, switch).
- [ ] **Headings**: Screen titles use `accessibilityRole="header"` for VoiceOver navigation.
- [ ] **Screen focus**: `useAccessibilityFocus()` hook applied to heading ref for proper VoiceOver navigation on screen push.
- [ ] **`maxFontSizeMultiplier`**: Applied to tab labels (1.2) and display numbers (1.3) to prevent layout breakage at large text sizes.

### Dark Mode / Light Mode
- [ ] **Both modes render correctly**: Every component uses both base and `dark:` variant classes. No component is dark-mode-only.
- [ ] **Separators adapt**: Using `border-gray-200 dark:border-white/8` pattern throughout.
- [ ] **Status bar adapts**: StatusBar style matches the current color scheme.
- [ ] **Images work in both**: Image overlays and backgrounds are visible in both modes. Hero images use gradient scrims.
- [ ] **Icons adapt**: Decorative icons use `text-gray-400` dark / `text-gray-500` light. Shadows are light-mode-only.

### Performance
- [ ] **FlatList for long lists**: Any list that could have >20 items uses FlatList, not ScrollView + map.
- [ ] **`keyExtractor` on all lists**: Every FlatList has `keyExtractor` using unique IDs (never index).
- [ ] **Memoized callbacks**: Handlers passed to list items are wrapped in `useCallback`.
- [ ] **Memoized list items**: Complex list item components use `React.memo`.
- [ ] **Chart memoization**: Victory Native and Skia chart components wrapped in `React.memo`.
- [ ] **No inline object styles in render**: `style={{ flex: 1 }}` creates new object every render — move to constant or use className.

### Web Preview Compatibility
- [ ] **Platform checks on native APIs**: `expo-haptics` wrapped in `Platform.OS !== 'web'` (or use `HapticPatterns` which guards internally).
- [ ] **Animations work on web**: Using `.duration()` instead of `.springify()` for entering/exiting layout animations.
- [ ] **Skia setup**: If using charts, `LoadSkiaWeb()` is called in `index.web.tsx` OR screens with charts use `<WithSkiaWeb>`.
- [ ] **ScrollView height**: ScrollView has `contentContainerStyle={{ flexGrow: 1 }}` to prevent collapse on web.
- [ ] **No native-only imports at top level**: Any native-only import is lazy or conditional.
- [ ] **Tab position**: `tabBarPosition: "bottom"` set in Tabs screenOptions for web.

### App-Level Checks
- [ ] **Consistent accent color**: One accent color used app-wide, chosen from the Category-Aware Accent Palette based on app type.
- [ ] **Consistent spacing**: All padding/margin uses the 4px grid (multiples of Tailwind's spacing scale). No 13px margins.
- [ ] **Consistent corner radii**: Cards `rounded-xl` (12px), inputs `rounded-xl` (12px), buttons `rounded-2xl` (16px), full-round `rounded-full`.
- [ ] **Consistent icon sizing**: List row icons 18-22px, tab bar icons 24px, header actions 24px, empty state icons 56-64px.
- [ ] **Navigation structure is correct**: 2-5 tabs for tab apps, proper stack nesting, form sheets for quick actions.
- [ ] **Every screen has a default export**.
- [ ] **SafeAreaView used from `react-native-safe-area-context` everywhere**.

---

## Quick Reference: Copy-Paste Snippets

### Standard screen wrapper

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={['top']}>
      {/* content */}
    </SafeAreaView>
  );
}
```

### Standard card (dark + light)

```tsx
<View className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8">
```

### Standard card with light mode shadow

```tsx
<View
  className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-white/8"
  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
>
```

### Standard list separator (inset, dark + light)

```tsx
<View className="h-px bg-gray-100 dark:bg-white/8 ml-[52px]" />
```

### Standard section header (dark + light)

```tsx
<Text className="text-gray-500 dark:text-gray-500 text-sm font-medium uppercase tracking-wider px-4 mb-2 mt-6">
  Section Title
</Text>
```

### Standard icon container (dark + light)

```tsx
<View className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-500/15 items-center justify-center">
  <Flame size={18} color="#f97316" />
</View>
```

### Standard primary button (dark + light)

```tsx
<Pressable className="w-full h-[52px] rounded-2xl items-center justify-center bg-orange-500 active:bg-orange-600">
  <Text className="text-white text-base font-semibold">Continue</Text>
</Pressable>
```

### Standard ghost/secondary button (dark + light)

```tsx
<Pressable className="w-full h-[48px] rounded-2xl items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 active:bg-gray-200 dark:active:bg-gray-700">
  <Text className="text-gray-900 dark:text-gray-200 text-base font-semibold">Cancel</Text>
</Pressable>
```

### Standard badge (dark + light)

```tsx
<View className="bg-orange-100 dark:bg-orange-500/15 rounded-full px-2.5 py-0.5">
  <Text className="text-xs font-semibold text-orange-700 dark:text-orange-400">14 days</Text>
</View>
```

### Standard empty state

```tsx
<View className="flex-1 items-center justify-center px-8 py-16">
  <View className="mb-4 opacity-30">
    <YourIcon size={64} color="#111827" />
  </View>
  <Text className="text-gray-900 dark:text-white text-xl font-semibold text-center mb-2">Title here</Text>
  <Text className="text-gray-500 dark:text-gray-400 text-base text-center leading-6 mb-6">Description here.</Text>
  <Pressable
    className="bg-gray-100 dark:bg-gray-800 rounded-xl px-6 py-3 border border-gray-200 dark:border-white/10"
    accessibilityRole="button"
    accessibilityLabel="Action label"
  >
    <Text className="text-gray-900 dark:text-white text-base font-semibold">Action label</Text>
  </Pressable>
</View>
```

### Standard loading skeleton

```tsx
{isLoading ? (
  <View className="flex-1">
    {Array.from({ length: 6 }).map((_, i) => (
      <View key={i} className="flex-row items-center px-4 py-3 gap-3">
        <View className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <View className="flex-1 gap-2">
          <View className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: '65%' }} />
          <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: '40%' }} />
        </View>
      </View>
    ))}
  </View>
) : (
  <RealContent />
)}
```

### Haptic + press handler pattern

```tsx
import { HapticPatterns } from '@/utils/haptics';

const handleSave = async () => {
  try {
    await saveData();
    HapticPatterns.success();
  } catch {
    HapticPatterns.error();
  }
};

const handleDelete = () => {
  HapticPatterns.destructive();
  performDelete();
};

const handleTabChange = (index: number) => {
  HapticPatterns.selection();
  setActiveTab(index);
};
```

### Chart quick setup

```tsx
// In the screen that has charts — lazily load Skia on web
import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

export default function AnalyticsScreen() {
  return (
    <WithSkiaWeb
      getComponent={() => import('@/components/charts/SpendingChart')}
      fallback={<StatCardSkeleton />}
    />
  );
}
```

### Quick accent color swap (per app type)

```tsx
// Health / Fitness app
const ACCENT = {
  bg: 'bg-orange-500',
  text: 'text-orange-500 dark:text-orange-400',
  bg15: 'bg-orange-100 dark:bg-orange-500/15',
  hex: '#f97316',
  hexDark: '#fb923c',
};

// Finance app
const ACCENT = {
  bg: 'bg-blue-500',
  text: 'text-blue-500 dark:text-blue-400',
  bg15: 'bg-blue-100 dark:bg-blue-500/15',
  hex: '#3b82f6',
  hexDark: '#60a5fa',
};

// Productivity app
const ACCENT = {
  bg: 'bg-sky-500',
  text: 'text-sky-500 dark:text-sky-400',
  bg15: 'bg-sky-100 dark:bg-sky-500/15',
  hex: '#0ea5e9',
  hexDark: '#38bdf8',
};
```

### Progress bar (inline, no library)

```tsx
<View className="mt-4">
  <View className="flex-row justify-between mb-1.5">
    <Text className="text-gray-500 dark:text-gray-400 text-sm">{completed} of {total} complete</Text>
    <Text className="text-gray-500 dark:text-gray-400 text-sm">{Math.round((completed / total) * 100)}%</Text>
  </View>
  <View className="h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
    <View
      className="h-full bg-orange-500 rounded-full"
      style={{ width: `${(completed / total) * 100}%` }}
    />
  </View>
</View>
```

### Horizontal scrollable filter chips

```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}
>
  {FILTERS.map(filter => (
    <Pressable
      key={filter.id}
      className={`px-4 py-2 rounded-full border ${
        activeFilter === filter.id
          ? 'bg-orange-100 dark:bg-orange-500/15 border-orange-300 dark:border-orange-500/50'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-white/10'
      }`}
      onPress={() => {
        HapticPatterns.selection();
        setActiveFilter(filter.id);
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: activeFilter === filter.id }}
      accessibilityLabel={filter.label}
    >
      <Text className={`text-sm font-medium ${
        activeFilter === filter.id
          ? 'text-orange-700 dark:text-orange-400'
          : 'text-gray-700 dark:text-gray-300'
      }`}>
        {filter.label}
      </Text>
    </Pressable>
  ))}
</ScrollView>
```

### Section list with sticky headers

```tsx
import { SectionList } from 'react-native';

<SectionList
  sections={groupedData}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <TransactionRow item={item} />}
  renderSectionHeader={({ section }) => (
    <View className="bg-gray-50 dark:bg-gray-950 px-4 py-2">
      <Text className="text-gray-500 dark:text-gray-500 text-xs font-semibold uppercase tracking-wider">
        {section.title}
      </Text>
    </View>
  )}
  ItemSeparatorComponent={() => <View className="h-px bg-gray-100 dark:bg-white/8 ml-[60px]" />}
  stickySectionHeadersEnabled={true}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 100 }}
/>
```

### React Query + Zustand data pattern

```tsx
// Preferred data pattern in Nova8 apps
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';

// Store for optimistic/local state
const useHabitStore = create<{
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  toggleHabit: (id: string) => void;
}>((set) => ({
  habits: [],
  setHabits: (habits) => set({ habits }),
  toggleHabit: (id) => set(state => ({
    habits: state.habits.map(h => h.id === id ? { ...h, done: !h.done } : h),
  })),
}));

// Query hook with all three states handled
function useHabits() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['habits'],
    queryFn: fetchHabits,
  });

  return { habits: data ?? [], isLoading, isError, refetch };
}

// In screen:
function HabitScreen() {
  const { habits, isLoading, isError, refetch } = useHabits();

  if (isLoading) return <ScreenSkeleton count={6} />;
  if (isError) return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <Text className="text-gray-900 dark:text-white text-lg font-semibold">Failed to load habits</Text>
      <Pressable onPress={refetch} className="bg-orange-500 active:bg-orange-600 rounded-2xl px-6 py-3">
        <Text className="text-white font-semibold">Try again</Text>
      </Pressable>
    </View>
  );

  if (habits.length === 0) return (
    <EmptyState
      icon={<CheckCircle2 size={64} color="#111827" />}
      title="No habits yet"
      description="Add your first habit and start building streaks today."
      ctaLabel="Add your first habit"
      onCta={() => router.push('/add-habit')}
    />
  );

  return <FlatList data={habits} keyExtractor={h => h.id} renderItem={renderHabit} />;
}
```
