// ─── Server entry ───────────────────────────────────────────────────────────
// Boots the API, then runs a SELF-TEST of the auth flow before accepting
// real traffic. If signup or login breaks for any reason (schema drift, bad
// bcrypt build, fs permission error), the test logs a loud failure — so
// bugs are caught immediately on boot instead of at 3am when a user tries
// to sign in.
//
// The self-test uses a throwaway email like `__selftest_<timestamp>@local`
// and deletes itself afterwards, so real user data is never touched.

import express from 'express';
import cors from 'cors';
import router from './routes';
import { db, now } from './db';
import { hashPassword, verifyPassword, newUserId, createSession, resolveSession } from './auth';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount the API. Every endpoint lives under /api.
app.use('/api', router);

// Legacy / convenience health at root.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler — no endpoint should ever crash the process.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[express error]', err?.message || err, err?.stack || '');
  res.status(500).json({ error: 'Internal server error', detail: String(err?.message || err) });
});

// ─── Self-test ────────────────────────────────────────────────────────────
function runSelfTest(): { ok: boolean; steps: string[]; failedAt?: string } {
  const steps: string[] = [];
  const email = `__selftest_${Date.now()}@local.invalid`;
  const password = 'selftest-pw-123';
  let userId = '';
  let token = '';

  try {
    // 1. Password hashing + verification
    const h = hashPassword(password);
    steps.push(`hash: ${h.slice(0, 7)}…`);
    if (!verifyPassword(password, h)) {
      return { ok: false, steps, failedAt: 'bcrypt verify failed on own hash' };
    }
    if (verifyPassword('wrong-password', h)) {
      return { ok: false, steps, failedAt: 'bcrypt verify accepted wrong password' };
    }
    steps.push('bcrypt OK');

    // 2. Insert a user row, then insert the default app-data rows.
    userId = newUserId();
    const ts = now();
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(userId, email, h, 'Self Test', ts);
    db.prepare('INSERT INTO user_goals (user_id, updated_at) VALUES (?, ?)').run(userId, ts);
    db.prepare('INSERT INTO streaks (user_id) VALUES (?)').run(userId);
    db.prepare('INSERT INTO entitlements (user_id, updated_at) VALUES (?, ?)').run(userId, ts);
    steps.push('user + defaults inserted');

    // 3. Round-trip read.
    const row = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
    if (!row || row.email !== email) {
      return { ok: false, steps, failedAt: 'round-trip read did not match' };
    }
    steps.push('read back OK');

    // 4. Session create + resolve.
    token = createSession(userId);
    const sess = resolveSession(token);
    if (!sess || sess.userId !== userId) {
      return { ok: false, steps, failedAt: 'session resolve failed' };
    }
    steps.push('session OK');

    return { ok: true, steps };
  } catch (err: any) {
    return { ok: false, steps, failedAt: `exception: ${err?.message || err}` };
  } finally {
    // Tidy up the throwaway user so data.db never accumulates test rows.
    try {
      if (userId) db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    } catch {}
  }
}

const result = runSelfTest();
if (result.ok) {
  console.log(`[self-test] PASS · ${result.steps.join(' · ')}`);
} else {
  console.error(`[self-test] FAIL at: ${result.failedAt}`);
  console.error(`[self-test] steps: ${result.steps.join(' · ')}`);
  // We still start the server so the UI shows a clear error instead of a
  // blank page — but the logs carry the red flag.
}

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT} (self-test ${result.ok ? 'PASS' : 'FAIL'})`);
});
