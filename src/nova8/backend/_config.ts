/**
 * @nova8/backend/_config — shared environment resolution for Nova8 backend
 * ──────────────────────────────────────────────────────────────────────────
 * Every @nova8/backend module (auth, db, storage, payments, push, openai,
 * anthropic, stripe) needs the same three values:
 *
 *   1. API base URL       — where nova8.dev lives (production or dev).
 *   2. Project ID         — the numeric ID assigned by Nova8 to this app.
 *   3. Project API key    — the public per-project key (starts with `nv8pk_`).
 *                           Proves the request originated from a Nova8-owned
 *                           project; does NOT identify an end user.
 *
 * These values come from `app.json → expo.extra` (native builds) or
 * `process.env.EXPO_PUBLIC_*` (Metro / web dev). Nova8 injects them at build
 * time on every GitHub push so you never have to set them by hand.
 *
 * The app-user session token lives in auth.ts (AsyncStorage-backed) and is
 * accessed through `getToken()`.
 */

import Constants from "expo-constants";

/** Base URL of the Nova8 API (no trailing slash). */
export function getApiBase(): string {
  const configured =
    (Constants.expoConfig as any)?.extra?.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured) return String(configured).replace(/\/$/, "");

  // Web preview fallback — Expo serves the app on 8081-<id>.e2b.app and the
  // Nova8 API on 3000-<id>.e2b.app. Only runs in the web preview context.
  if (typeof window !== "undefined" && (window as any).location?.origin) {
    const origin = (window as any).location.origin.replace(/\/$/, "");
    return origin.replace(/^https?:\/\/8081-/, "https://3000-");
  }

  throw new Error(
    "[nova8/backend] No API base URL. Set `expo.extra.apiBaseUrl` in app.json " +
      "or `EXPO_PUBLIC_API_BASE_URL` in .env.production.",
  );
}

/**
 * Numeric Nova8 project ID (as a string, for URL interpolation).
 * Accepts either the new `nova8ProjectId` or the legacy Wave 18.11
 * `projectId` key so existing projects keep working without an audit pass.
 */
export function getProjectId(): string {
  const extra = (Constants.expoConfig as any)?.extra ?? {};
  const id =
    extra.nova8ProjectId ??
    extra.projectId ??
    process.env.EXPO_PUBLIC_NOVA8_PROJECT_ID ??
    process.env.EXPO_PUBLIC_PROJECT_ID;
  if (!id) {
    throw new Error(
      "[nova8/backend] Missing Nova8 project id. Expected `expo.extra.nova8ProjectId` or `expo.extra.projectId` in app.json.",
    );
  }
  return String(id);
}

/**
 * Public project API key (starts with `nv8pk_`). Injected by Nova8 on every
 * GitHub push via `expo.extra.nova8ProjectApiKey` — do NOT hardcode.
 * This is NOT a secret. It identifies the project, not the end user.
 *
 * Accepts the legacy Wave 18.11 `projectApiKey` key as a fallback.
 */
export function getProjectApiKey(): string {
  const extra = (Constants.expoConfig as any)?.extra ?? {};
  const key =
    extra.nova8ProjectApiKey ??
    extra.projectApiKey ??
    process.env.EXPO_PUBLIC_NOVA8_PROJECT_API_KEY ??
    process.env.EXPO_PUBLIC_PROJECT_API_KEY;
  if (!key) {
    throw new Error(
      "[nova8/backend] Missing project API key. Expected `expo.extra.nova8ProjectApiKey` or `expo.extra.projectApiKey` in app.json.",
    );
  }
  return String(key);
}
