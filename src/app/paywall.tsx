/**
 * src/app/paywall.tsx — Macr Pro paywall (RevenueCat-driven)
 * ─────────────────────────────────────────────────────────────────────────────
 * Wave 21.1 rewrite. The previous version was a mock: it showed hardcoded
 * prices, called setTimeout(1200ms), and set `isPro: true` locally. That
 * would have been instant-rejected at App Review under Guideline 3.1.1.
 *
 * This version:
 *   • Pulls live offerings from RevenueCat (Purchases.getOfferings)
 *   • Renders localized prices from each package's product.priceString
 *   • Computes the annual savings % from the real prices (SAVE XX%)
 *   • Calls Purchases.purchasePackage(pkg) for the real StoreKit flow
 *   • Handles userCancelled silently (no error banner)
 *   • Wires Restore Purchases to Purchases.restorePurchases()
 *   • Shows Terms of Service + Privacy Policy links in the footer (3.1.2)
 *   • Falls back gracefully when:
 *       – No Current offering in RC dashboard → "Subscriptions unavailable"
 *       – User on sandbox with no Paid Apps agreement → shows Apple's error
 *
 * Deeply integrates with the existing local entitlement mutation so the
 * rest of the app (which reads from local state for snappy UI) stays in
 * sync — but the server-side source of truth is RevenueCat webhooks.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Pressable, ScrollView, ActivityIndicator, Linking, Alert } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { X, Star, Shield, Sparkles, Check } from 'lucide-react-native';
import { PillButton } from '@/components/PillButton';
import { useEntitlementMutation } from '@/lib/api-hooks';
import { colors } from '@/lib/theme';
import { hapticMedium, hapticSuccess, hapticWarning } from '@/lib/haptics';
import {
  fetchOfferings,
  purchaseActivePackage,
  restorePurchases,
  annualMonthlyEquivalent,
  annualSavingsPct,
  type PaywallPackage,
} from '@/lib/purchases';

const FEATURES = [
  { icon: Sparkles, label: 'Unlimited AI food scans' },
  { icon: Star, label: 'Detailed macro breakdowns' },
  { icon: Shield, label: 'Barcode & label scanning' },
  { icon: Check, label: 'Advanced progress analytics' },
];

// Apple's Standard EULA (counts for Terms of Service per App Store rules).
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
// Macr privacy policy — served by Nova8 for each project.
const PRIVACY_URL = 'https://nova8.dev/privacy/149';

type SelectedPlan = 'annual' | 'monthly';

export default function PaywallScreen() {
  // Offerings state — null means "still loading", undefined would be typed away.
  const [offerings, setOfferings] = useState<{
    annual: PaywallPackage | null;
    monthly: PaywallPackage | null;
  } | null>(null);
  const [offeringsError, setOfferingsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedPlan>('annual');
  const [purchasing, setPurchasing] = useState<boolean>(false);
  const [restoring, setRestoring] = useState<boolean>(false);
  const entitlementMutation = useEntitlementMutation();

  const badgeScale = useSharedValue(1);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }] }));

  // Load offerings once on mount. Re-runs only if the paywall is re-mounted
  // (dismiss + re-open), which is the right cadence.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchOfferings();
      if (cancelled) return;
      if (!result) {
        setOfferings({ annual: null, monthly: null });
        setOfferingsError(
          'Subscriptions are temporarily unavailable. Please check your internet connection and try again.'
        );
        return;
      }
      setOfferings({ annual: result.annual, monthly: result.monthly });
      // Auto-pick annual if present (matches the "recommended" badge); fall back to monthly.
      if (!result.annual && result.monthly) setSelected('monthly');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClose = useCallback(() => {
    hapticMedium();
    router.back();
  }, []);

  const handlePurchase = useCallback(async () => {
    if (!offerings) return;
    const pkg = selected === 'annual' ? offerings.annual : offerings.monthly;
    if (!pkg) {
      hapticWarning();
      Alert.alert('Plan unavailable', 'This subscription plan is not currently available. Please try another plan or contact support.');
      return;
    }
    hapticMedium();
    setPurchasing(true);
    try {
      const result = await purchaseActivePackage(pkg.raw);
      if (result.ok) {
        if (result.isPro) {
          hapticSuccess();
          // Mirror entitlement state into the local server so other
          // parts of the app that read from /entitlement stay in sync.
          entitlementMutation.mutate(
            { isPro: true },
            {
              onSuccess: () => {
                router.replace('/(tabs)/home');
              },
              onError: () => {
                // Even if the local mirror fails, RC is the source of truth —
                // the app will re-sync via getCustomerInfo on next resume.
                router.replace('/(tabs)/home');
              },
            }
          );
        } else {
          // Purchase went through but entitlement didn't activate — rare,
          // usually an RC dashboard config issue (entitlement not attached
          // to product). Surface so the user can contact support.
          hapticWarning();
          Alert.alert(
            'Purchase completed, but…',
            'Your purchase went through, but we could not activate Pro yet. Please tap Restore Purchases or contact support.'
          );
        }
      } else if (!result.userCancelled) {
        hapticWarning();
        Alert.alert('Purchase failed', result.error || 'Something went wrong. Please try again.');
      }
      // userCancelled → silent (normal dismiss of the Apple sheet).
    } finally {
      setPurchasing(false);
    }
  }, [offerings, selected, entitlementMutation]);

  const handleRestore = useCallback(async () => {
    hapticMedium();
    setRestoring(true);
    try {
      const result = await restorePurchases();
      if (result.ok && result.isPro) {
        hapticSuccess();
        entitlementMutation.mutate(
          { isPro: true },
          {
            onSuccess: () => router.replace('/(tabs)/home'),
            onError: () => router.replace('/(tabs)/home'),
          }
        );
      } else if (result.ok && !result.isPro) {
        Alert.alert(
          'Nothing to restore',
          'We couldn\'t find an active Pro subscription on this Apple ID. If you believe this is a mistake, please contact support.'
        );
      } else {
        hapticWarning();
        Alert.alert('Restore failed', result.error || 'Could not restore purchases. Please try again.');
      }
    } finally {
      setRestoring(false);
    }
  }, [entitlementMutation]);

  // ── Derived UI state ───────────────────────────────────────────
  const savingsPct = annualSavingsPct(offerings?.annual ?? null, offerings?.monthly ?? null);
  const annualMonthEquiv = offerings?.annual ? annualMonthlyEquivalent(offerings.annual) : null;
  const isLoadingOfferings = offerings === null;
  const canPurchase = !!offerings && ((selected === 'annual' && offerings.annual) || (selected === 'monthly' && offerings.monthly));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingTop: 56 }}>
          {/* Close button */}
          <Pressable
            onPress={handleClose}
            accessibilityLabel="Close paywall"
            testID="close-paywall"
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: colors.surfaceElevated,
              alignItems: 'center', justifyContent: 'center',
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={18} color={colors.textSecondary} />
          </Pressable>

          {/* Header */}
          <View style={{ alignItems: 'center', marginTop: 28 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary, letterSpacing: 1.2 }}>
              MACR PRO
            </Text>
            <Text style={{ fontSize: 30, fontWeight: '800', color: colors.textPrimary, marginTop: 6, letterSpacing: -0.5, textAlign: 'center' }}>
              Unlock everything
            </Text>
            <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22, paddingHorizontal: 12 }}>
              Scan any food, get full macro breakdowns, and track your progress with precision.
            </Text>
          </View>

          {/* Feature badge */}
          <Animated.View
            style={[
              badgeStyle,
              {
                marginTop: 28, borderRadius: 20, overflow: 'hidden',
                backgroundColor: colors.primary, padding: 22, alignItems: 'center',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
              {[1, 2, 3].map(i => <Star key={i} size={14} color="#FFD700" fill="#FFD700" />)}
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)' }}>
              Trusted by thousands tracking macros daily
            </Text>
          </Animated.View>

          {/* Feature list */}
          <View style={{ marginTop: 24 }}>
            {FEATURES.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 11,
                  backgroundColor: `${colors.primary}14`,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <f.icon size={19} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.textPrimary, flex: 1 }}>
                  {f.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Plan cards */}
          <View style={{ marginTop: 10, gap: 10 }}>
            {isLoadingOfferings ? (
              <View style={{
                paddingVertical: 36, alignItems: 'center',
                backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
              }}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 10 }}>
                  Loading plans…
                </Text>
              </View>
            ) : offeringsError ? (
              <View style={{
                paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center',
                backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
              }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' }}>
                  Subscriptions unavailable
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>
                  {offeringsError}
                </Text>
              </View>
            ) : (
              <>
                {/* Annual — recommended */}
                {offerings?.annual && (
                  <Pressable
                    onPress={() => { hapticMedium(); setSelected('annual'); }}
                    testID="plan-annual"
                    style={{
                      backgroundColor: colors.surface, borderRadius: 20, padding: 18,
                      borderWidth: 2,
                      borderColor: selected === 'annual' ? colors.primary : colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                            Annual
                          </Text>
                          {savingsPct !== null && savingsPct > 0 && (
                            <View style={{
                              backgroundColor: colors.protein, borderRadius: 6,
                              paddingHorizontal: 7, paddingVertical: 2,
                            }}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 }}>
                                SAVE {savingsPct}%
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
                          <Text style={{ fontSize: 20, fontWeight: '800', color: colors.primary }}>
                            {annualMonthEquiv ?? offerings.annual.priceString}
                          </Text>
                          {annualMonthEquiv && (
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                              billed annually
                            </Text>
                          )}
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>
                          {offerings.annual.priceString} per year · 3-day free trial
                        </Text>
                      </View>
                      <View style={{
                        backgroundColor: `${colors.primary}15`, borderRadius: 10,
                        paddingHorizontal: 10, paddingVertical: 4,
                      }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 }}>
                          BEST VALUE
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}

                {/* Monthly */}
                {offerings?.monthly && (
                  <Pressable
                    onPress={() => { hapticMedium(); setSelected('monthly'); }}
                    testID="plan-monthly"
                    style={{
                      backgroundColor: colors.surface, borderRadius: 20, padding: 18,
                      borderWidth: 2,
                      borderColor: selected === 'monthly' ? colors.primary : colors.border,
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
                          Monthly
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginTop: 6 }}>
                          {offerings.monthly.priceString}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>
                          per month
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )}
              </>
            )}
          </View>

          {/* CTA */}
          <View style={{ marginTop: 22 }}>
            <PillButton
              title={selected === 'annual' ? 'Start 3-Day Free Trial' : 'Subscribe Now'}
              onPress={handlePurchase}
              loading={purchasing}
              disabled={!canPurchase || purchasing || restoring}
              fullWidth
            />
          </View>

          <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 14, lineHeight: 18 }}>
            {selected === 'annual'
              ? `After the free trial, your subscription renews automatically at ${offerings?.annual?.priceString ?? ''} per year unless cancelled at least 24 hours before the end of the trial. Cancel anytime in Settings.`
              : `Your subscription renews automatically at ${offerings?.monthly?.priceString ?? ''} per month unless cancelled at least 24 hours before the end of the current period. Cancel anytime in Settings.`}
          </Text>

          {/* Restore Purchases — App Store Guideline 3.1.1 */}
          <Pressable
            onPress={handleRestore}
            disabled={restoring || purchasing}
            accessibilityLabel="Restore purchases"
            testID="restore-purchases"
            style={{ marginTop: 16, alignItems: 'center', paddingVertical: 10 }}
          >
            {restoring ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                Restore Purchases
              </Text>
            )}
          </Pressable>

          {/* Terms + Privacy footer — App Store Guideline 3.1.2 */}
          <View style={{
            flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
            gap: 10, marginTop: 14,
          }}>
            <Pressable
              onPress={() => { hapticMedium(); Linking.openURL(TERMS_URL).catch(() => {}); }}
              testID="terms-of-service"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 12, color: colors.textSecondary, textDecorationLine: 'underline' }}>
                Terms of Service
              </Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>·</Text>
            <Pressable
              onPress={() => { hapticMedium(); Linking.openURL(PRIVACY_URL).catch(() => {}); }}
              testID="privacy-policy"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 12, color: colors.textSecondary, textDecorationLine: 'underline' }}>
                Privacy Policy
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
