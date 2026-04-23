// src/lib/apiClient.ts — Nova8-hosted auth client (Wave 18.15)
// ─────────────────────────────────────────────────────────────────
// DO NOT EDIT BY HAND. This file is auto-generated and auto-repaired
// by the Nova8 TestFlight audit. Any change you make here will be
// reverted the next time a developer clicks "Fix all" because the
// server compares it to a canonical signature. If you need to change
// API behavior, update the callers — not this client.
//
// What this client does:
//   1. Resolves the API base URL at runtime in this priority:
//        a. Constants.expoConfig.extra.apiBaseUrl   (set by Nova8 at push)
//        b. process.env.EXPO_PUBLIC_API_BASE_URL    (fallback)
//        c. 'https://nova8.dev'                     (hard default)
//   2. Reads the per-project API key + project ID from the same
//      two sources (app.json extra / EXPO_PUBLIC_*).
//   3. Sends 'x-nova8-project-key' on EVERY request (signup, signin,
//      me, logout, delete). Without this header the persistent
//      backend returns 401 'missing_project_key'.
//   4. Stores the session token in AsyncStorage under 'app_token'
//      and replays it as 'x-nova8-app-token' on authed calls.
//      Never uses Authorization: Bearer.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const extra = (Constants?.expoConfig?.extra ?? {}) as Record<string, any>;
const API_BASE = String(
  extra.apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'https://nova8.dev'
).replace(/\/+$/, '');
const PROJECT_ID = Number(
  extra.projectId || process.env.EXPO_PUBLIC_PROJECT_ID || 0
);
const PROJECT_API_KEY = String(
  extra.projectApiKey || process.env.EXPO_PUBLIC_PROJECT_API_KEY || ''
);
const AUTH_PREFIX = `/api/app/${PROJECT_ID}/auth`;

const TOKEN_STORAGE_KEY = 'app_token';

export async function getAppToken(): Promise<string | null> {
  try { return await AsyncStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
}

export async function setAppToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {}
}

export interface ApiError extends Error {
  status: number;
  body?: any;
}

export interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean;
}

async function call<T>(path: string, init: RequestInit = {}, opts: { authed?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-nova8-project-key': PROJECT_API_KEY,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (opts.authed) {
    const tok = await getAppToken();
    if (tok) headers['x-nova8-app-token'] = tok;
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (err: any) {
    const e = new Error(`Network error — ${err?.message || 'fetch failed'}`) as ApiError;
    e.status = 0;
    throw e;
  }
  const ct = res.headers.get('content-type') || '';
  const isJson = ct.includes('application/json');
  const raw = await res.text();
  if (!isJson && raw.trim().startsWith('<')) {
    const e = new Error(
      `API returned HTML instead of JSON. Base URL (${API_BASE}) may be wrong or the project API key may be missing.`
    ) as ApiError;
    e.status = res.status;
    throw e;
  }
  const body = isJson && raw ? safeJson(raw) : raw;
  if (!res.ok) {
    const msg = (body && typeof body === 'object' && ('message' in body || 'error' in body))
      ? ((body as any).message || (body as any).error)
      : `HTTP ${res.status}`;
    const e = new Error(String(msg)) as ApiError;
    e.status = res.status;
    e.body = body;
    throw e;
  }
  return body as T;
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return s; }
}

// ─── Ergonomic shorthand ────────────────────────────────────────────
export const api = {
  get:  <T = any>(path: string, opts?: ApiClientOptions) =>
    call<T>(path, { method: 'GET', ...opts }, { authed: !opts?.skipAuth }),
  post: <T = any>(path: string, body?: unknown, opts?: ApiClientOptions) =>
    call<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...opts,
    }, { authed: !opts?.skipAuth }),
  put:  <T = any>(path: string, body?: unknown, opts?: ApiClientOptions) =>
    call<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...opts,
    }, { authed: !opts?.skipAuth }),
  del:  <T = any>(path: string, opts?: ApiClientOptions) =>
    call<T>(path, { method: 'DELETE', ...opts }, { authed: !opts?.skipAuth }),
  baseUrl: API_BASE,
};

// ─── Legacy apiClient(path, options) shape kept for compatibility ──
export async function apiClient<T = any>(
  path: string,
  options: ApiClientOptions = {},
): Promise<T> {
  const { skipAuth, ...rest } = options;
  return call<T>(path, rest, { authed: !skipAuth });
}

export default apiClient;

// ─── Auth convenience ───────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt?: number | string;
}

export async function signup(email: string, password: string, name?: string): Promise<AuthUser> {
  const { token, user } = await call<{ token: string; user: AuthUser }>(
    `${AUTH_PREFIX}/signup`,
    { method: 'POST', body: JSON.stringify({ email, password, name: name ?? null }) },
    { authed: false },
  );
  await setAppToken(token);
  return user;
}

export async function signin(email: string, password: string): Promise<AuthUser> {
  const { token, user } = await call<{ token: string; user: AuthUser }>(
    `${AUTH_PREFIX}/signin`,
    { method: 'POST', body: JSON.stringify({ email, password }) },
    { authed: false },
  );
  await setAppToken(token);
  return user;
}

// Alias kept so callers that imported 'login' keep working after the
// audit repairs their apiClient. Under the hood it's signin.
export const login = signin;

export async function logout(): Promise<void> {
  try {
    await call(`${AUTH_PREFIX}/logout`, { method: 'POST' }, { authed: true });
  } catch {}
  await setAppToken(null);
}

export async function me(): Promise<AuthUser | null> {
  try {
    const { user } = await call<{ user: AuthUser }>(
      `${AUTH_PREFIX}/me`,
      { method: 'GET' },
      { authed: true },
    );
    return user;
  } catch {
    return null;
  }
}

export async function deleteAccount(): Promise<void> {
  await call(`${AUTH_PREFIX}/me`, { method: 'DELETE' }, { authed: true });
  await setAppToken(null);
}
