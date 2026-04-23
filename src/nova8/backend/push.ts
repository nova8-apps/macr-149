/**
 * @nova8/backend/push — push notifications for generated Nova8 apps
 * ───────────────────────────────────────────────────────────────────────────
 * ⚠️  WORK IN PROGRESS — not safe to ship in production apps yet.
 *
 * The current push infrastructure is admin-only (requires a Nova8 platform
 * login), so a phone-app end user cannot register a device. Public
 * per-app-user push endpoints at /api/app/:projectId/push/* are on the
 * Wave 3 roadmap.
 *
 * For local testing you can still use `expo-notifications` directly against
 * Expo's push service. This stub throws loudly to avoid silent misrouting
 * to admin endpoints that will 401 on device.
 */

export async function registerDevice(): Promise<never> {
  throw new Error(
    "[nova8/push] Push notifications from end-user apps are not yet supported. " +
      "Use expo-notifications directly for now, or track Wave 3j on the Nova8 roadmap.",
  );
}

export async function send(): Promise<never> {
  throw new Error(
    "[nova8/push] Push notifications from end-user apps are not yet supported. " +
      "Track Wave 3j on the Nova8 roadmap.",
  );
}

export async function subscribe(): Promise<never> {
  throw new Error(
    "[nova8/push] Push notifications from end-user apps are not yet supported. " +
      "Track Wave 3j on the Nova8 roadmap.",
  );
}

export async function unsubscribe(): Promise<never> {
  throw new Error(
    "[nova8/push] Push notifications from end-user apps are not yet supported. " +
      "Track Wave 3j on the Nova8 roadmap.",
  );
}
