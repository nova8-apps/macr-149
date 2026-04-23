// ─── Database ───────────────────────────────────────────────────────────────
// Plain better-sqlite3. No ORM, no timestamp mode quirks, no migration tools.
// The schema is declared here as CREATE TABLE IF NOT EXISTS statements and
// run on every server boot — so you can drop this file into a fresh sandbox
// with zero data.db and it will work on the very first request.
//
// ── Why no Drizzle / Prisma? ─────────────────────────────────────────────
//   LLM-generated code often mis-matches the column types between the ORM
//   schema and the raw inserts (timestamp vs Date, boolean vs 0/1). Every
//   one of those mismatches surfaces at runtime as a "SQLITE_MISMATCH" or
//   silent 500. Plain SQL sidesteps all of it.
//
// ── What this gives you ──────────────────────────────────────────────────
//   - `db` — the better-sqlite3 instance (use .prepare / .run / .get / .all)
//   - `now()` — milliseconds-since-epoch helper (matches INTEGER ts columns)
//   - Automatic WAL mode + foreign keys + corruption recovery
//   - All tables created on boot via CREATE TABLE IF NOT EXISTS
//
// Add new tables at the bottom of SCHEMA_SQL — they will be created on the
// next boot. Never remove or rename columns in place; add a new column with
// ALTER TABLE ADD COLUMN and default-fill it in application code.

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data.db');

function openOrRecreate(p: string): Database.Database {
  // Ensure parent directory exists
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[db] created directory: ${dir}`);
    } catch (e: any) {
      console.warn(`[db] could not create directory ${dir}:`, e.message);
    }
  }

  const tryOpen = (): Database.Database => {
    const d = new Database(p);
    d.pragma('journal_mode = WAL');
    d.pragma('foreign_keys = ON');
    d.pragma('synchronous = NORMAL');
    d.prepare('SELECT 1').get(); // smoke test
    return d;
  };
  try {
    return tryOpen();
  } catch (e: any) {
    console.warn(`[db] open failed (${e.code || e.message}); recreating ${p}`);
    for (const suffix of ['', '-wal', '-shm']) {
      try { fs.unlinkSync(p + suffix); } catch {}
    }
    return tryOpen();
  }
}

export const db = openOrRecreate(DB_PATH);

// ─── Schema ─────────────────────────────────────────────────────────────────
// Every table is defined here. CREATE TABLE IF NOT EXISTS is idempotent, so
// this block runs on every boot without touching existing data.
const SCHEMA_SQL = `
-- ── auth ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE COLLATE NOCASE,
  password_hash   TEXT,
  name            TEXT,
  apple_id        TEXT UNIQUE,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id);

-- Persisted session tokens — survive server restart.
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ── app data ───────────────────────────────────────────────────────────
-- Per-user settings that drive the onboarding flow + daily targets.
CREATE TABLE IF NOT EXISTS user_goals (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  goal_type         TEXT NOT NULL DEFAULT 'maintain',
  activity_level    TEXT NOT NULL DEFAULT 'moderate',
  sex               TEXT NOT NULL DEFAULT 'male',
  birth_date        TEXT NOT NULL DEFAULT '1990-01-01',
  height_cm         REAL NOT NULL DEFAULT 175,
  start_weight_kg   REAL NOT NULL DEFAULT 75,
  current_weight_kg REAL NOT NULL DEFAULT 75,
  target_weight_kg  REAL NOT NULL DEFAULT 75,
  daily_calories    INTEGER NOT NULL DEFAULT 2000,
  protein_g         INTEGER NOT NULL DEFAULT 150,
  carbs_g           INTEGER NOT NULL DEFAULT 200,
  fat_g             INTEGER NOT NULL DEFAULT 65,
  updated_at        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meals (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  photo_url       TEXT,
  total_calories  INTEGER NOT NULL DEFAULT 0,
  protein_g       INTEGER NOT NULL DEFAULT 0,
  carbs_g         INTEGER NOT NULL DEFAULT 0,
  fat_g           INTEGER NOT NULL DEFAULT 0,
  eaten_at        INTEGER NOT NULL,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_meals_user_eaten ON meals(user_id, eaten_at);

CREATE TABLE IF NOT EXISTS meal_items (
  id          TEXT PRIMARY KEY,
  meal_id     TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  calories    INTEGER NOT NULL DEFAULT 0,
  protein_g   INTEGER NOT NULL DEFAULT 0,
  carbs_g     INTEGER NOT NULL DEFAULT 0,
  fat_g       INTEGER NOT NULL DEFAULT 0,
  quantity    REAL NOT NULL DEFAULT 1,
  unit        TEXT NOT NULL DEFAULT 'serving'
);

CREATE TABLE IF NOT EXISTS exercises (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,
  intensity       TEXT NOT NULL DEFAULT 'moderate',
  duration_min    INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  logged_at       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exercises_user_logged ON exercises(user_id, logged_at);

CREATE TABLE IF NOT EXISTS weight_logs (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg  REAL NOT NULL,
  logged_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_weight_user_logged ON weight_logs(user_id, logged_at);

CREATE TABLE IF NOT EXISTS streaks (
  user_id           TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak    INTEGER NOT NULL DEFAULT 0,
  longest_streak    INTEGER NOT NULL DEFAULT 0,
  last_logged_date  TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS entitlements (
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_pro      INTEGER NOT NULL DEFAULT 0,
  product_id  TEXT,
  expires_at  INTEGER,
  updated_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS foods (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  brand               TEXT,
  calories_per_100g   INTEGER NOT NULL DEFAULT 0,
  protein_g           REAL NOT NULL DEFAULT 0,
  carbs_g             REAL NOT NULL DEFAULT 0,
  fat_g               REAL NOT NULL DEFAULT 0,
  serving_size        TEXT,
  serving_unit        TEXT
);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);
`;

db.exec(SCHEMA_SQL);

// ─── Migrations ─────────────────────────────────────────────────────────────
// Add apple_id column if it doesn't exist (migration for existing databases)
try {
  const userTableInfo = db.pragma('table_info(users)') as any[];
  const hasAppleId = userTableInfo.some((col: any) => col.name === 'apple_id');
  if (!hasAppleId) {
    console.log('[db] adding apple_id column to users table');
    db.prepare('ALTER TABLE users ADD COLUMN apple_id TEXT').run();
    db.prepare('CREATE INDEX IF NOT EXISTS idx_users_apple_id ON users(apple_id)').run();
  }

  // Note: SQLite doesn't support ALTER TABLE ... ALTER COLUMN, so we can't change
  // existing NOT NULL constraints without recreating the table. Since we generate
  // placeholder values for Apple users (dummy email + password hash), the existing
  // schema works fine. For truly fresh databases, the CREATE TABLE IF NOT EXISTS
  // above already has nullable email/password_hash.
} catch (err: any) {
  console.warn('[db] migration warning:', err?.message || err);
}

/** Current epoch-ms. Use this anywhere you store a timestamp. */
export function now(): number {
  return Date.now();
}

/** Session TTL — 30 days. */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/** Clean up sessions past their expiry. Cheap — run on boot + periodically. */
export function purgeExpiredSessions(): void {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now());
}
purgeExpiredSessions();
