/**
 * @nova8/backend/auth — Authentication for generated Nova8 apps
 * ─────────────────────────────────────────────────────────────────────────
 * Real native-first auth. Works in TestFlight, App Store, and Expo Go.
 *
 * What you get, out of the box:
 *   - signUpWithEmail(email, password, name?)       — email/password
 *   - signInWithEmail(email, password)              — email/password
 *   - signInWithApple()                             — native Sign in with Apple (iOS)
 *   - signInWithGoogle()                            — native Google via AuthSession
 *   - signOut()                                     — revokes the current session
 *   - currentUser()                                 — returns the cached user, or null
 *   - onAuthStateChanged(cb) => unsub               — subscribe to auth state
 *   - getToken()                                    — returns the session token (for your own fetch calls)
 *   - deleteAccount()                               — Apple 5.1.1(v) account deletion
 *
 * Where state lives:
 *   All session tokens are persisted in AsyncStorage under a stable key so the
 *   user stays signed in across app launches. `onAuthStateChanged` fires on
 *   every sign-in / sign-out in the process.
 *
 * Backend endpoints (auto-wired, no setup):
 *   POST /api/app/:projectId/auth/signup
 *   POST /api/app/:projectId/auth/signin
 *   POST /api/app/:projectId/auth/apple
 *   POST /api/app/:projectId/auth/google
 *   POST /api/app/:projectId/auth/logout
 *   GET  /api/app/:projectId/auth/me
 *   DELETE /api/app/:projectId/auth/me
 */

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";

// Required by AuthSession on iOS for the OAuth redirect to close the browser
WebBrowser.maybeCompleteAuthSession();

// ── Types ─────────────────────────────────────────────────────────────────

export interface Nova8User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export type AuthStateCallback = (user: Nova8User | null) => void;

// ── Config ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "nova8.auth.session";

function getProjectId(): string {
  const id =
    (Constants.expoConfig as any)?.extra?.nova8ProjectId ??
    process.env.EXPO_PUBLIC_NOVA8_PROJECT_ID;
  if (!id) {
    throw new Error(
      "[nova8/auth] Missing Nova8 project id. Expected `expo.extra.nova8ProjectId` in app.json.",
    );
  }
  return String(id);
}

function getApiBase(): string {
  const configured =
    (Constants.expoConfig as any)?.extra?.apiBaseUrl ??
    process.env.EXPO_PUBLIC_API_BASE_URL;
  if (configured) return String(configured).replace(/\/$/, "");

  // Web (Expo Go / preview) fallback — same-origin.
  if (typeof window !== "undefined" && (window as any).location?.origin) {
    const origin = (window as any).location.origin.replace(/\/$/, "");
    // Nova8 preview runs the app on 8081-<id>.e2b.app and the API on 3000-<id>.e2b.app
    const mapped = origin.replace(/^https?:\/\/8081-/, "https://3000-");
    return mapped;
  }
  throw new Error(
    "[nova8/auth] No API base URL. Set `expo.extra.apiBaseUrl` in app.json.",
  );
}

function getProjectApiKey(): string {
  const key =
    (Constants.expoConfig as any)?.extra?.nova8ProjectApiKey ??
    process.env.EXPO_PUBLIC_NOVA8_PROJECT_API_KEY;
  if (!key) {
    throw new Error(
      "[nova8/auth] Missing project API key. Expected `expo.extra.nova8ProjectApiKey` in app.json.",
    );
  }
  return String(key);
}

// ── Session cache + listener fan-out ─────────────────────────────────────

let cachedUser: Nova8User | null = null;
let cachedToken: string | null = null;
let hydrated = false;
const listeners = new Set<AuthStateCallback>();

async function hydrate(): Promise<void> {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { token?: string; user?: Nova8User };
    if (parsed?.token && parsed?.user) {
      cachedToken = parsed.token;
      cachedUser = parsed.user;
      // Kick off a background refresh so we drop the session early if it's
      // been revoked. Don't await — we don't want to block app startup.
      void refreshFromServer();
    }
  } catch {
    /* ignore */
  }
}

async function persist(token: string, user: Nova8User): Promise<void> {
  cachedToken = token;
  cachedUser = user;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  notify();
}

async function clearPersisted(): Promise<void> {
  cachedToken = null;
  cachedUser = null;
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  notify();
}

function notify() {
  for (const cb of listeners) {
    try {
      cb(cachedUser);
    } catch {
      /* swallow listener errors */
    }
  }
}

async function refreshFromServer(): Promise<void> {
  if (!cachedToken) return;
  try {
    const res = await fetch(`${getApiBase()}/api/app/${getProjectId()}/auth/me`, {
      headers: {
        "x-nova8-app-token": cachedToken,
        "x-nova8-project-api-key": getProjectApiKey(),
      },
    });
    if (res.status === 401) {
      await clearPersisted();
      return;
    }
    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        cachedUser = data.user;
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ token: cachedToken, user: cachedUser }),
        );
        notify();
      }
    }
  } catch {
    /* network — keep the cached session */
  }
}

// ── Public API — email/password ──────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string,
): Promise<Nova8User> {
  await hydrate();
  const res = await fetch(
    `${getApiBase()}/api/app/${getProjectId()}/auth/signup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nova8-project-api-key": getProjectApiKey(),
      },
      body: JSON.stringify({ email, password, name }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Could not create your account.");
  }
  await persist(data.token, data.user);
  return data.user;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<Nova8User> {
  await hydrate();
  const res = await fetch(
    `${getApiBase()}/api/app/${getProjectId()}/auth/signin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nova8-project-api-key": getProjectApiKey(),
      },
      body: JSON.stringify({ email, password }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Incorrect email or password.");
  }
  await persist(data.token, data.user);
  return data.user;
}

// ── Public API — Sign in with Apple (iOS native) ─────────────────────────

/**
 * Whether Sign in with Apple is available on this device. Call before
 * rendering the Apple button — Apple's HIG says to hide the button when it
 * won't work, and this returns `false` on Android / web / older iOS.
 */
export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Trigger the native Sign in with Apple sheet and exchange the resulting
 * identity token for a Nova8 session.
 *
 * Requirements (Nova8 handles automatically when you deploy via TestFlight):
 *   - `expo.ios.usesAppleSignIn: true` in app.json
 *   - `Sign in with Apple` capability on the iOS provisioning profile
 *     (Expo Launch provisions this automatically when signing the build)
 */
export async function signInWithApple(): Promise<Nova8User> {
  await hydrate();
  if (Platform.OS !== "ios") {
    throw new Error(
      "Sign in with Apple is only available on iOS. Use signInWithGoogle() or signInWithEmail() on Android and web.",
    );
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple didn't return an identity token. Please try again.");
  }

  const res = await fetch(
    `${getApiBase()}/api/app/${getProjectId()}/auth/apple`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nova8-project-api-key": getProjectApiKey(),
      },
      body: JSON.stringify({
        identityToken: credential.identityToken,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName,
              familyName: credential.fullName.familyName,
            }
          : undefined,
      }),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "Could not complete Apple sign-in.");
  }
  await persist(data.token, data.user);
  return data.user;
}

// ── Public API — Sign in with Google ─────────────────────────────────────

/**
 * React hook that returns `{ promptAsync, request }` for the Google OAuth
 * flow. You typically call `promptAsync()` from a button handler, then on
 * success pass the returned `idToken` to `completeGoogleSignIn(idToken)`.
 *
 * Client IDs are read from the project's env vars at build time and
 * exposed via `Constants.expoConfig.extra`:
 *   - extra.googleClientIdIos      (required on iOS)
 *   - extra.googleClientIdAndroid  (required on Android)
 *   - extra.googleClientIdWeb      (required on web / Expo Go)
 */
export function useGoogleSignIn() {
  const extra = ((Constants.expoConfig as any)?.extra || {}) as Record<string, string>;
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: extra.googleClientIdIos,
    androidClientId: extra.googleClientIdAndroid,
    webClientId: extra.googleClientIdWeb,
    clientId: extra.googleClientIdExpo || extra.googleClientIdWeb,
  });
  return { request, response, promptAsync };
}

/**
 * Exchange a Google ID token for a Nova8 session. Call this after
 * `useGoogleSignIn().promptAsync()` returns a successful response, passing
 * `response.params.id_token`.
 */
export async function completeGoogleSignIn(idToken: string): Promise<Nova8User> {
  await hydrate();
  if (!idToken) {
    throw new Error("Google didn't return an ID token. Please try again.");
  }

  // Wave 18.21 — pre-flight check: if no Google client IDs are set, we
  // already know the backend will reject with google_client_id_missing,
  // so surface a clear setup message before making the network call.
  const extra = ((Constants.expoConfig as any)?.extra || {}) as Record<string, string>;
  const hasAnyGoogleId = Boolean(
    extra.googleClientIdIos ||
      extra.googleClientIdAndroid ||
      extra.googleClientIdWeb ||
      extra.googleClientIdExpo,
  );
  if (!hasAnyGoogleId) {
    throw new Error(
      "Google sign-in isn't configured for this app yet. Open the Nova8 Auth tab to paste in your OAuth client IDs.",
    );
  }

  const res = await fetch(
    `${getApiBase()}/api/app/${getProjectId()}/auth/google`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-nova8-project-api-key": getProjectApiKey(),
      },
      body: JSON.stringify({ idToken }),
    },
  );
  const data = await res.json().catch(() => ({} as any));
  if (!res.ok) {
    // Translate known backend errors into actionable messages the user
    // can act on without reading logs.
    if (data?.error === "google_client_id_missing") {
      throw new Error(
        "Google sign-in isn't configured for this app yet. Open the Nova8 Auth tab to paste in your OAuth client IDs.",
      );
    }
    if (data?.error && String(data.error).startsWith("google_token_verify_failed")) {
      throw new Error(
        "We couldn't verify that Google sign-in. This usually means the iOS/Android/Web client IDs in your Nova8 Auth tab don't match the OAuth client you used to sign in. Double-check them in the Google Cloud Console.",
      );
    }
    throw new Error(data?.message || "Could not complete Google sign-in.");
  }
  await persist(data.token, data.user);
  return data.user;
}

/**
 * Convenience wrapper: run the full Google flow in one call. Only use this
 * if you don't need to render a custom button — most apps should use
 * `useGoogleSignIn()` from a Pressable's onPress so the system browser
 * trigger comes from a real user gesture.
 */
export async function signInWithGoogle(): Promise<Nova8User> {
  throw new Error(
    "signInWithGoogle() must be called from inside a component using the useGoogleSignIn() hook. " +
      "Call `const { promptAsync } = useGoogleSignIn();` then `const r = await promptAsync();` " +
      "and finally `await completeGoogleSignIn(r.params.id_token);`.",
  );
}

// ── Public API — session management ──────────────────────────────────────

export async function signOut(): Promise<void> {
  if (cachedToken) {
    // Fire-and-forget revoke — we don't want the user stuck if the server
    // is unreachable, and the session TTL will handle it anyway.
    void fetch(`${getApiBase()}/api/app/${getProjectId()}/auth/logout`, {
      method: "POST",
      headers: {
        "x-nova8-app-token": cachedToken,
        "x-nova8-project-api-key": getProjectApiKey(),
      },
    }).catch(() => {});
  }
  await clearPersisted();
}

export function currentUser(): Nova8User | null {
  return cachedUser;
}

export async function getToken(): Promise<string | null> {
  await hydrate();
  return cachedToken;
}

export function onAuthStateChanged(callback: AuthStateCallback): () => void {
  // Hydrate lazily the first time anyone subscribes so the callback gets
  // the persisted session on app startup.
  void hydrate().then(() => callback(cachedUser));
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Delete the user account AND all sessions. Required by Apple Guideline
 * 5.1.1(v) — every app that supports account creation must let the user
 * delete their account from inside the app.
 */
export async function deleteAccount(): Promise<void> {
  if (!cachedToken) return;
  const res = await fetch(`${getApiBase()}/api/app/${getProjectId()}/auth/me`, {
    method: "DELETE",
    headers: {
      "x-nova8-app-token": cachedToken,
      "x-nova8-project-api-key": getProjectApiKey(),
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || "Could not delete your account.");
  }
  await clearPersisted();
}
