/**
 * @nova8/backend/payments — Stripe payments for generated Nova8 apps
 * ───────────────────────────────────────────────────────────────────────────
 * ⚠️  WORK IN PROGRESS — not safe to ship in production apps yet.
 *
 * The current payments infrastructure is admin-only (requires a Nova8 platform
 * login), so a phone-app end user cannot call it. Public per-app-user payments
 * endpoints at /api/app/:projectId/payments/* are on the Wave 3 roadmap.
 *
 * For now, if you need to accept payments from a Nova8-generated app, use
 * Stripe's server-side APIs through the proxy:
 *
 *   import { openai } from "@/nova8/backend";  // (see openai.ts for pattern)
 *   // …or roll a custom proxy-based stripe module.
 *
 * This stub throws loudly to avoid silent misrouting to admin endpoints.
 */

export async function getConfig(): Promise<never> {
  throw new Error(
    "[nova8/payments] Payments from end-user apps are not yet supported. " +
      "Track Wave 3i on the Nova8 roadmap.",
  );
}

export async function getEntitlement(): Promise<never> {
  throw new Error(
    "[nova8/payments] Payments from end-user apps are not yet supported. " +
      "Track Wave 3i on the Nova8 roadmap.",
  );
}

export async function createCheckoutSession(): Promise<never> {
  throw new Error(
    "[nova8/payments] Payments from end-user apps are not yet supported. " +
      "Track Wave 3i on the Nova8 roadmap.",
  );
}
