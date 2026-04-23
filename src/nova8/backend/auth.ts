/**
 * Nova8 Backend Auth SDK
 *
 * Provides real Apple Sign In for TestFlight/App Store.
 * All auth flows persist to Nova8's backend at https://nova8.dev/api/app/{projectId}/auth
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const extra = (Constants?.expoConfig?.extra ?? {}) as Record<string, any>;
const API_BASE = String(extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'https://nova8.dev').replace(/\/+$/, '');
const PROJECT_ID = Number(extra.nova8ProjectId || extra.projectId || process.env.EXPO_PUBLIC_PROJECT_ID || 0);
const PROJECT_API_KEY = String(extra.nova8ProjectApiKey || extra.projectApiKey || process.env.EXPO_PUBLIC_PROJECT_API_KEY || '');
const AUTH_PREFIX = `/api/app/${PROJECT_ID}/auth`;

type AuthUser = { id: string; email: string; name: string; createdAt: string };
type AuthResponse = { token: string; user: AuthUser; expiresAt: string };

async function call<T>(path: string, init: RequestInit = {}, opts: { authed?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-nova8-project-key': PROJECT_API_KEY,
    ...(init.headers as Record<string, string> || {}),
  };
  if (opts.authed) {
    const tok = await AsyncStorage.getItem('app_token');
    if (tok) headers['x-nova8-app-token'] = tok;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`API returned non-JSON (status ${res.status}). Check PROJECT_API_KEY.`);
  }
  const body = await res.json();
  if (!res.ok) throw Object.assign(new Error(body?.message || body?.error || `HTTP ${res.status}`), { status: res.status, body });
  return body as T;
}

/**
 * Check if Apple Sign In is available (iOS only)
 */
export async function isAppleAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Sign in with Apple
 * iOS only — redirects to Apple's native sign-in flow
 */
export async function signInWithApple(): Promise<AuthResponse> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign In is only available on iOS');
  }

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  // Call Nova8 backend to exchange Apple credential for app session
  const r = await call<AuthResponse>(
    `${AUTH_PREFIX}/apple`,
    {
      method: 'POST',
      body: JSON.stringify({
        identityToken: credential.identityToken,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : null,
      }),
    }
  );

  await AsyncStorage.setItem('app_token', r.token);
  return r;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  const r = await call<AuthResponse>(
    `${AUTH_PREFIX}/signin`,
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
  await AsyncStorage.setItem('app_token', r.token);
  return r;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string, name?: string): Promise<AuthResponse> {
  const r = await call<AuthResponse>(
    `${AUTH_PREFIX}/signup`,
    { method: 'POST', body: JSON.stringify({ email, password, name }) }
  );
  await AsyncStorage.setItem('app_token', r.token);
  return r;
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  try {
    await call(`${AUTH_PREFIX}/logout`, { method: 'POST' }, { authed: true });
  } catch {}
  await AsyncStorage.removeItem('app_token');
}

/**
 * Get current user
 */
export async function currentUser(): Promise<AuthUser | null> {
  try {
    const r = await call<{ user: AuthUser }>(`${AUTH_PREFIX}/me`, { method: 'GET' }, { authed: true });
    return r.user;
  } catch {
    return null;
  }
}

/**
 * Auth state change listener
 * Returns unsubscribe function
 */
export function onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
  let mounted = true;

  (async () => {
    const user = await currentUser();
    if (mounted) callback(user);
  })();

  return () => {
    mounted = false;
  };
}

/**
 * Delete account
 */
export async function deleteAccount(): Promise<void> {
  await call(`${AUTH_PREFIX}/me`, { method: 'DELETE' }, { authed: true });
  await AsyncStorage.removeItem('app_token');
}
