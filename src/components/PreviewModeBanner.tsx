// ─── PreviewModeBanner ──────────────────────────────────────────────────────
// Sleek, dismissable, top-of-screen pill shown only in the Nova8 preview
// sandbox. Native builds (TestFlight / App Store) never render this.
//
// Design notes (Wave 17.2):
//   - Floats at the very top of the screen (absolute), above all content,
//     instead of taking space inside auth cards.
//   - Single compact horizontal pill; shortened copy "Preview · Accounts
//     reset each session" with a "Why?" disclosure that reveals the full
//     explanation on tap.
//   - Closeable via × button. Dismissal persists via sessionStorage so it
//     doesn't pop back after every HMR/render cycle, but it DOES reset on a
//     fresh browser session so users are still warned once per sandbox spin.
//   - Uses react-native's native Text (not the gluestack wrapper) to avoid
//     web-side class-based styles that break word-wrap.

import React, { useEffect, useState } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { Info, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors } from '@/lib/theme';

const SS_KEY = 'nova8:preview-banner-dismissed';

function isPreview(): boolean {
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined') return false;
  const host = window.location?.hostname || '';
  return host.endsWith('.e2b.app') || host === 'localhost' || host === '127.0.0.1';
}

export function PreviewModeBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(true); // hidden until we read storage to avoid SSR flash
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const was =
        typeof window !== 'undefined' &&
        window.sessionStorage?.getItem(SS_KEY) === '1';
      setDismissed(!!was);
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!mounted || !isPreview() || dismissed) return null;

  const dismiss = () => {
    try {
      window.sessionStorage?.setItem(SS_KEY, '1');
    } catch {}
    setDismissed(true);
  };

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: Platform.OS === 'web' ? 8 : 44,
        left: 12,
        right: 12,
        zIndex: 9999,
        alignItems: 'center',
      }}
      testID="preview-mode-banner"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceElevated,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 3,
          paddingLeft: 8,
          paddingRight: 3,
          maxWidth: 300,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 4,
        }}
      >
        <Info size={10} color={colors.primary} style={{ marginRight: 5 }} />
        <Text
          style={{ fontSize: 9.5, color: colors.textSecondary, flexShrink: 1 }}
          numberOfLines={1}
        >
          <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
            Preview
          </Text>
          <Text> · Resets each session</Text>
        </Text>
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          hitSlop={8}
          style={{
            marginLeft: 5,
            paddingHorizontal: 4,
            paddingVertical: 1,
            borderRadius: 999,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Hide details' : 'Why?'}
        >
          <Text
            style={{
              fontSize: 9,
              color: colors.primary,
              fontWeight: '600',
              marginRight: 1,
            }}
          >
            Why?
          </Text>
          {expanded ? (
            <ChevronUp size={9} color={colors.primary} />
          ) : (
            <ChevronDown size={9} color={colors.primary} />
          )}
        </Pressable>
        <Pressable
          onPress={dismiss}
          hitSlop={10}
          style={{
            marginLeft: 1,
            width: 18,
            height: 18,
            borderRadius: 9,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss preview notice"
          testID="preview-mode-banner-close"
        >
          <X size={10} color={colors.textSecondary} />
        </Pressable>
      </View>
      {expanded && (
        <View
          style={{
            marginTop: 5,
            maxWidth: 300,
            backgroundColor: colors.surfaceElevated,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 6,
            paddingHorizontal: 10,
          }}
        >
          <Text
            style={{ fontSize: 10, lineHeight: 14, color: colors.textSecondary }}
          >
            This notice only shows in preview. TestFlight and App Store
            builds keep data forever.
          </Text>
        </View>
      )}
    </View>
  );
}

export default PreviewModeBanner;
