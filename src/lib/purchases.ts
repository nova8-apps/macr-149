/**
 * src/lib/purchases.ts — RevenueCat SDK wrapper for Macr
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin, typed facade over `react-native-purchases`. Keeps the SDK surface in
 * one place so screens can import strongly-typed helpers instead of touching
 * the raw SDK. Also gives us a single spot to update the entitlement
 * identifier if the RevenueCat dashboard config ever drifts.
 *
 *   configurePurchases(apiKey)  → Purchases.configure at app boot
 *   fetchOfferings()            → current offering + annual/monthly packages
 *   purchaseActivePackage(pkg)  → purchasePackage with userCancelled handling
 *   restorePurchases()          → restorePurchases + entitlement recheck
 *   getEntitlementState()       → probes Purchases.getCustomerInfo and returns isPro
 *
 * Entitlement identifier comes from a single constant (PRO_ENTITLEMENT_ID) so
 * any drift between the dashboard and code is caught by the Nova8 audit.
 */

import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

/** Must match the Entitlement identifier set in the RevenueCat dashboard. */
export const PRO_ENTITLEMENT_ID = 'pro';

/** Offering identifier. 'default' = whatever is marked "Current" in RC. */
export const DEFAULT_OFFERING_ID = 'default';

/**
 * The minimal shape we expose to the UI. Hides the SDK's noisy Product type
 * behind the three fields the paywall actually renders.
 */
export interface PaywallPackage {
  /** RevenueCat package identifier (e.g. $rc_annual, $rc_monthly) */
  identifier: string;
  /** Localized price string already formatted for the user's locale. */
  priceString: string;
  /** Underlying price as a number (for discount math). */
  priceAmount: number;
  /** 3-letter ISO currency code, e.g. USD. */
  currencyCode: string;
  /** Machine-readable billing period: P1Y, P1M, etc. */
  period: string;
  /** Underlying SDK package — pass back to purchaseActivePackage. */
  raw: PurchasesPackage;
}

/**
 * Call ONCE at app boot — safe to call multiple times (subsequent calls
 * short-circuit inside the SDK). Accepts null/undefined keys and silently
 * no-ops; callers shouldn't have to branch on env-var presence.
 */
export function configurePurchases(apiKey: string | undefined | null): void {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        '[purchases] configurePurchases called without an API key — ' +
        'paywall will be unable to fetch offerings. ' +
        'Set EXPO_PUBLIC_REVENUECAT_IOS_KEY in Nova8 project env vars.'
      );
    }
    return;
  }

  try {
    // LOG_LEVEL.DEBUG in dev, WARN in prod keeps console noise manageable.
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
    // RevenueCat's API key is platform-scoped (appl_ for iOS, goog_ for Android).
    // Macr is iOS-first; if we later add Android, wire EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
    // here with a Platform.OS branch.
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey });
    }
  } catch (err) {
    // NativeEventEmitter crash usually means the Expo plugin entry is
    // missing from app.json — the SDK code ran before Prebuild wired it.
    // Surface as a warn, not a crash, so the app still boots on builds
    // where RC isn't wired yet.
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases] configure failed:', err);
    }
  }
}

/**
 * Fetch the current offering and expose its annual + monthly packages in
 * the simplified PaywallPackage shape.
 *
 * Returns null if:
 *   • No offering is marked as Current in RevenueCat, OR
 *   • The current offering has zero available packages, OR
 *   • The SDK call throws (network error / invalid API key)
 *
 * The paywall should render a "subscriptions unavailable" state when this
 * returns null rather than crashing.
 */
export async function fetchOfferings(): Promise<{
  annual: PaywallPackage | null;
  monthly: PaywallPackage | null;
  all: PaywallPackage[];
} | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const current: PurchasesOffering | null = offerings.current;
    if (!current || current.availablePackages.length === 0) return null;

    const mapPkg = (pkg: PurchasesPackage | null | undefined): PaywallPackage | null => {
      if (!pkg) return null;
      const product = pkg.product;
      return {
        identifier: pkg.identifier,
        priceString: product.priceString,
        priceAmount: product.price,
        currencyCode: product.currencyCode,
        period: product.subscriptionPeriod ?? '',
        raw: pkg,
      };
    };

    return {
      annual: mapPkg(current.annual ?? null),
      monthly: mapPkg(current.monthly ?? null),
      all: current.availablePackages.map(mapPkg).filter((p): p is PaywallPackage => p !== null),
    };
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases] getOfferings failed:', err);
    }
    return null;
  }
}

/**
 * Attempt to purchase a package. Returns:
 *   { ok: true, isPro }                       — purchase completed, isPro reflects the post-purchase entitlement state
 *   { ok: false, userCancelled: true }        — user dismissed the Apple sheet (normal flow, no error to show)
 *   { ok: false, userCancelled: false, error} — real failure; show the error message to the user
 */
export async function purchaseActivePackage(pkg: PurchasesPackage): Promise<
  | { ok: true; isPro: boolean; customerInfo: CustomerInfo }
  | { ok: false; userCancelled: boolean; error: string }
> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = isEntitled(customerInfo);
    return { ok: true, isPro, customerInfo };
  } catch (e: unknown) {
    const userCancelled = Boolean((e as { userCancelled?: boolean })?.userCancelled);
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, userCancelled, error: message };
  }
}

/**
 * Restore previous purchases from the user's Apple ID. Must be triggered
 * from a user tap (App Store Guideline 3.1.1) — calling programmatically
 * may surface an OS sign-in prompt.
 */
export async function restorePurchases(): Promise<
  | { ok: true; isPro: boolean; customerInfo: CustomerInfo }
  | { ok: false; error: string }
> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { ok: true, isPro: isEntitled(customerInfo), customerInfo };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/**
 * Source-of-truth entitlement probe. Call on app resume + after
 * restore/purchase to keep local state synced with RevenueCat.
 */
export async function getEntitlementState(): Promise<{
  isPro: boolean;
  customerInfo: CustomerInfo | null;
}> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return { isPro: isEntitled(customerInfo), customerInfo };
  } catch (err) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn('[purchases] getCustomerInfo failed:', err);
    }
    return { isPro: false, customerInfo: null };
  }
}

/**
 * Pure helper — checks `customerInfo.entitlements.active[PRO_ENTITLEMENT_ID]`.
 * Kept separate so tests can construct a fake CustomerInfo.
 */
export function isEntitled(customerInfo: CustomerInfo | null | undefined): boolean {
  if (!customerInfo) return false;
  const active = customerInfo.entitlements?.active ?? {};
  return typeof active[PRO_ENTITLEMENT_ID] !== 'undefined';
}

/**
 * Convenience: compute the monthly-equivalent price of an annual package
 * for display as a "$X/mo (billed annually)" line.
 */
export function annualMonthlyEquivalent(annual: PaywallPackage): string {
  if (!annual.priceAmount || annual.priceAmount <= 0) return annual.priceString;
  const perMonth = annual.priceAmount / 12;
  // Format with the same currency/style as the original string where possible.
  const symbol = annual.priceString.replace(/[\d.,\s]/g, '').trim() || '$';
  return `${symbol}${perMonth.toFixed(2)}/mo`;
}

/**
 * Convenience: compute the savings % of annual vs monthly (e.g. 83 for
 * $19.99/yr vs $9.99/mo). Returns null if we can't compute (prices missing
 * or zero). The paywall uses this for the "SAVE X%" badge.
 */
export function annualSavingsPct(
  annual: PaywallPackage | null,
  monthly: PaywallPackage | null,
): number | null {
  if (!annual || !monthly) return null;
  if (!annual.priceAmount || !monthly.priceAmount) return null;
  const monthlyYearly = monthly.priceAmount * 12;
  if (monthlyYearly <= 0) return null;
  const pct = (1 - annual.priceAmount / monthlyYearly) * 100;
  return Math.max(0, Math.round(pct));
}
