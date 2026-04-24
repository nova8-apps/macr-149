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

// Wave 3n — single source of truth for API base / project id / project API key.
// Previously this file had its own private resolvers that only checked the new
// `nova8ProjectId` / `nova8ProjectApiKey` keys. That broke every project built
// before the Wave 18.11 rename (which still uses `projectId` / `projectApiKey`
// in app.json), causing sign-in + sign-up forms to surface:
//   "[nova8/auth] Missing Nova8 project id. Expected `expo.extra.nova8ProjectId` in app.json."
// and Apple sign-in to fail with the generic "The authorization attempt failed
// for an unknown reason" (the throw happened AFTER Apple granted the token).
// Importing from _config.ts ensures both old and new key names work forever.
import { getApiBase, getProjectId, getProjectApiKey } from "./_config";

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
