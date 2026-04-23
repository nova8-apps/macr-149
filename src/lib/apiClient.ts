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
const AUTH_PREFIX = `/api/app/${PROJECT_ID}/auth\