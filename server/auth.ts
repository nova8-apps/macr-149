// ─── Auth middleware + helpers ──────────────────────────────────────────────
// All auth flows (signup, login, token verification) live here. They are
// deliberately simple: bcryptjs + random 32-byte hex tokens persisted to
// the sessions table. No JWT, no in-memory Map, no crypto.scrypt gymnastics.
//
// Every generated Nova8 app that needs accounts should use THIS module —
// it has a boot-time self-test in server/index.ts that signs up + logs in a
// throwaway user on every restart, so if the flow breaks it fails loud.

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db, now, SESSION_TTL_MS } from './db';

// ─── Types ──────────────────────────────────────────────────────────────────
export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  createdAt: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
export function newUserId(): string {
  return crypto.randomUUID();
}

export function newToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashPassword(password: string): string {
  // bcryptjs: cost 10 is the sweet spot for fast signup + strong enough
  // for a hobby/prod mobile app.
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

// ─── Session store (persisted to SQLite) ────────────────────────────────────
export function createSession(userId: string): string {
  const token = newToken();
  const ts = now();
  db.prepare(
    'INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
  ).run(token, userId, ts, ts + SESSION_TTL_MS);
  return token;
}

export function resolveSession(token: string): { userId: string } | null {
  if (!token) return null;
  const row = db
    .prepare('SELECT user_id as userId, expires_at as expiresAt FROM sessions WHERE token = ?')
    .get(token) as { userId: string; expiresAt: number } | undefined;
  if (!row) return null;
  if (row.expiresAt < now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { userId: row.userId };
}

export function destroySession(token: string): void {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// ─── Middleware ─────────────────────────────────────────────────────────────
/**
 * Require a valid session token.
 *
 * Looks at both `x-auth-token` and `Authorization: Bearer <tok>` so the
 * client can send whichever is easiest. On success, sets req.userId.
 */
export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
): void {
  const fromHeader =
    (req.headers['x-auth-token'] as string | undefined) ||
    (req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '');
  const session = resolveSession(fromHeader);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  req.userId = session.userId;
  next();
}

// ─── User helpers ───────────────────────────────────────────────────────────
export function getUserById(id: string): PublicUser | null {
  const row = db
    .prepare('SELECT id, email, name, created_at as createdAt FROM users WHERE id = ?')
    .get(id) as PublicUser | undefined;
  return row ?? null;
}

export function getUserByEmail(email: string | null): (PublicUser & { passwordHash: string }) | null {
  if (!email) return null;
  const row = db
    .prepare(
      'SELECT id, email, name, password_hash as passwordHash, created_at as createdAt FROM users WHERE email = ? COLLATE NOCASE',
    )
    .get(normalizeEmail(email)) as (PublicUser & { passwordHash: string }) | undefined;
  return row ?? null;
}

export function getUserByAppleId(appleId: string): PublicUser | null {
  const row = db
    .prepare('SELECT id, email, name, created_at as createdAt FROM users WHERE apple_id = ?')
    .get(appleId) as PublicUser | undefined;
  return row ?? null;
}
