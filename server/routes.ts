// ─── API routes ─────────────────────────────────────────────────────────────
// All endpoints under /api. Every data-modifying route goes through
// requireAuth. Every response is plain JSON.
//
// Convention: the auth header is `x-auth-token` (plus `Authorization:
// Bearer` for flexibility). Token comes from POST /api/auth/signup or
// /api/auth/login. It's stored in the sessions table so it survives
// server restarts.

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import OpenAI from 'openai';
import { db, now } from './db';
import {
  AuthedRequest,
  requireAuth,
  newUserId,
  hashPassword,
  verifyPassword,
  normalizeEmail,
  createSession,
  destroySession,
  getUserByEmail,
  getUserById,
} from './auth';

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Auth ──────────────────────────────────────────────────────────────────
router.post('/auth/signup', (req: Request, res: Response) => {
  try {
    const emailRaw = req.body?.email;
    const passwordRaw = req.body?.password;
    const nameRaw = req.body?.name;

    const email = normalizeEmail(emailRaw);
    const password = typeof passwordRaw === 'string' ? passwordRaw : '';
    const name = typeof nameRaw === 'string' ? nameRaw.trim() : null;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const id = newUserId();
    const ts = now();
    const passwordHash = hashPassword(password);

    // Insert user + default rows in a single transaction so a failure
    // halfway leaves the database in its original state.
    const tx = db.transaction(() => {
      db.prepare(
        'INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)',
      ).run(id, email, passwordHash, name, ts);

      db.prepare(
        `INSERT INTO user_goals (user_id, updated_at) VALUES (?, ?)`,
      ).run(id, ts);

      db.prepare(
        `INSERT INTO streaks (user_id) VALUES (?)`,
      ).run(id);

      db.prepare(
        `INSERT INTO entitlements (user_id, updated_at) VALUES (?, ?)`,
      ).run(id, ts);
    });
    tx();

    const token = createSession(id);
    const user = getUserById(id)!;
    return res.json({ token, user });
  } catch (err: any) {
    console.error('[signup] error:', err?.message || err, err?.stack || '');
    return res.status(500).json({ error: 'Internal server error', detail: String(err?.message || err) });
  }
});

router.post('/auth/login', (req: Request, res: Response) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = createSession(user.id);
    const publicUser = getUserById(user.id)!;

    // Include goals, streak, and entitlement so the client can determine if onboarding is complete
    const goals = db.prepare('SELECT * FROM user_goals WHERE user_id = ?').get(user.id) || null;
    const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(user.id) || null;
    const entitlement = db.prepare('SELECT * FROM entitlements WHERE user_id = ?').get(user.id) || null;

    return res.json({ token, user: publicUser, goals, streak, entitlement });
  } catch (err: any) {
    console.error('[login] error:', err?.message || err, err?.stack || '');
    return res.status(500).json({ error: 'Internal server error', detail: String(err?.message || err) });
  }
});

router.post('/auth/logout', requireAuth, (req: AuthedRequest, res: Response) => {
  const token =
    (req.headers['x-auth-token'] as string | undefined) ||
    (req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '');
  destroySession(token);
  return res.json({ ok: true });
});

router.get('/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
  const user = getUserById(req.userId!);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const goals = db.prepare('SELECT * FROM user_goals WHERE user_id = ?').get(req.userId!) || null;
  const streak = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(req.userId!) || null;
  const entitlement = db.prepare('SELECT * FROM entitlements WHERE user_id = ?').get(req.userId!) || null;
  return res.json({ user, goals, streak, entitlement });
});

// ── User goals ────────────────────────────────────────────────────────────
router.get('/user/goals', requireAuth, (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM user_goals WHERE user_id = ?').get(req.userId!);
  return res.json({ goals: row || null });
});

router.post('/user/goals', requireAuth, (req: AuthedRequest, res: Response) => {
  try {
    const g = req.body || {};
    const ts = now();
    db.prepare(
      `UPDATE user_goals SET
         goal_type = COALESCE(?, goal_type),
         activity_level = COALESCE(?, activity_level),
         sex = COALESCE(?, sex),
         birth_date = COALESCE(?, birth_date),
         height_cm = COALESCE(?, height_cm),
         start_weight_kg = COALESCE(?, start_weight_kg),
         current_weight_kg = COALESCE(?, current_weight_kg),
         target_weight_kg = COALESCE(?, target_weight_kg),
         daily_calories = COALESCE(?, daily_calories),
         protein_g = COALESCE(?, protein_g),
         carbs_g = COALESCE(?, carbs_g),
         fat_g = COALESCE(?, fat_g),
         updated_at = ?
       WHERE user_id = ?`,
    ).run(
      g.goalType ?? null,
      g.activityLevel ?? null,
      g.sex ?? null,
      g.birthDate ?? null,
      g.heightCm ?? null,
      g.startWeightKg ?? null,
      g.currentWeightKg ?? null,
      g.targetWeightKg ?? null,
      g.dailyCalories ?? null,
      g.proteinG ?? null,
      g.carbsG ?? null,
      g.fatG ?? null,
      ts,
      req.userId!,
    );
    const row = db.prepare('SELECT * FROM user_goals WHERE user_id = ?').get(req.userId!);
    return res.json({ goals: row });
  } catch (err: any) {
    console.error('[user/goals POST] error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/user/goals', requireAuth, (req: AuthedRequest, res: Response) => {
  try {
    const g = req.body || {};
    const ts = now();
    db.prepare(
      `UPDATE user_goals SET
         goal_type = COALESCE(?, goal_type),
         activity_level = COALESCE(?, activity_level),
         sex = COALESCE(?, sex),
         birth_date = COALESCE(?, birth_date),
         height_cm = COALESCE(?, height_cm),
         start_weight_kg = COALESCE(?, start_weight_kg),
         current_weight_kg = COALESCE(?, current_weight_kg),
         target_weight_kg = COALESCE(?, target_weight_kg),
         daily_calories = COALESCE(?, daily_calories),
         protein_g = COALESCE(?, protein_g),
         carbs_g = COALESCE(?, carbs_g),
         fat_g = COALESCE(?, fat_g),
         updated_at = ?
       WHERE user_id = ?`,
    ).run(
      g.goalType ?? null,
      g.activityLevel ?? null,
      g.sex ?? null,
      g.birthDate ?? null,
      g.heightCm ?? null,
      g.startWeightKg ?? null,
      g.currentWeightKg ?? null,
      g.targetWeightKg ?? null,
      g.dailyCalories ?? null,
      g.proteinG ?? null,
      g.carbsG ?? null,
      g.fatG ?? null,
      ts,
      req.userId!,
    );
    const row = db.prepare('SELECT * FROM user_goals WHERE user_id = ?').get(req.userId!);
    return res.json({ goals: row });
  } catch (err: any) {
    console.error('[user/goals PUT] error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Meals ─────────────────────────────────────────────────────────────────
router.get('/meals', requireAuth, (req: AuthedRequest, res: Response) => {
  // Support both date (YYYY-MM-DD) and start/end (timestamp) query params
  const dateParam = req.query.date as string | undefined;
  let start: number, end: number;

  if (dateParam) {
    // Parse date string (YYYY-MM-DD) and get day boundaries
    const d = new Date(dateParam + 'T00:00:00Z');
    start = d.getTime();
    end = start + 86400000; // +24 hours
  } else {
    start = Number(req.query.start ?? 0);
    end = Number(req.query.end ?? now() + 86400000);
  }

  const rows = db
    .prepare('SELECT * FROM meals WHERE user_id = ? AND eaten_at >= ? AND eaten_at < ? ORDER BY eaten_at DESC')
    .all(req.userId!, start, end);
  return res.json(rows);
});

router.post('/meals', requireAuth, (req: AuthedRequest, res: Response) => {
  try {
    const m = req.body || {};
    const id = crypto.randomUUID();
    const ts = now();
    db.prepare(
      `INSERT INTO meals (id, user_id, name, photo_url, total_calories, protein_g, carbs_g, fat_g, eaten_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.userId!,
      String(m.name || 'Meal'),
      m.photoUrl ?? null,
      Number(m.totalCalories || 0),
      Number(m.proteinG || 0),
      Number(m.carbsG || 0),
      Number(m.fatG || 0),
      Number(m.eatenAt || ts),
      ts,
    );

    if (Array.isArray(m.items)) {
      const insertItem = db.prepare(
        `INSERT INTO meal_items (id, meal_id, name, calories, protein_g, carbs_g, fat_g, quantity, unit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      for (const it of m.items) {
        insertItem.run(
          crypto.randomUUID(),
          id,
          String(it.name || 'Item'),
          Number(it.calories || 0),
          Number(it.proteinG || 0),
          Number(it.carbsG || 0),
          Number(it.fatG || 0),
          Number(it.quantity || 1),
          String(it.unit || 'serving'),
        );
      }
    }

    const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(id);
    return res.json({ meal });
  } catch (err: any) {
    console.error('[meals POST] error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/meals/:id', requireAuth, (req: AuthedRequest, res: Response) => {
  db.prepare('DELETE FROM meals WHERE id = ? AND user_id = ?').run(req.params.id, req.userId!);
  return res.json({ ok: true });
});

// ── Exercises ─────────────────────────────────────────────────────────────
router.get('/exercises', requireAuth, (req: AuthedRequest, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM exercises WHERE user_id = ? ORDER BY logged_at DESC LIMIT 500')
    .all(req.userId!);
  return res.json({ exercises: rows });
});

router.post('/exercises', requireAuth, (req: AuthedRequest, res: Response) => {
  try {
    const e = req.body || {};
    const id = crypto.randomUUID();
    const ts = now();
    db.prepare(
      `INSERT INTO exercises (id, user_id, type, intensity, duration_min, calories_burned, logged_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      req.userId!,
      String(e.type || 'general'),
      String(e.intensity || 'moderate'),
      Number(e.durationMin || 0),
      Number(e.caloriesBurned || 0),
      Number(e.loggedAt || ts),
    );
    const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(id);
    return res.json({ exercise: ex });
  } catch (err: any) {
    console.error('[exercises POST] error:', err?.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Weight ────────────────────────────────────────────────────────────────
router.get('/weight', requireAuth, (req: AuthedRequest, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM weight_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 500')
    .all(req.userId!);
  return res.json({ logs: rows });
});

router.post('/weight', requireAuth, (req: AuthedRequest, res: Response) => {
  const w = Number(req.body?.weightKg || 0);
  if (!w) return res.status(400).json({ error: 'weightKg required' });
  const id = crypto.randomUUID();
  const ts = Number(req.body?.loggedAt || now());
  db.prepare(
    'INSERT INTO weight_logs (id, user_id, weight_kg, logged_at) VALUES (?, ?, ?, ?)',
  ).run(id, req.userId!, w, ts);
  db.prepare('UPDATE user_goals SET current_weight_kg = ?, updated_at = ? WHERE user_id = ?').run(w, now(), req.userId!);
  return res.json({ id });
});

// ── Streak ────────────────────────────────────────────────────────────────
router.get('/streak', requireAuth, (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(req.userId!);
  return res.json({ streak: row });
});

// ── Entitlement (RevenueCat will update this server-side) ─────────────────
router.get('/entitlement', requireAuth, (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM entitlements WHERE user_id = ?').get(req.userId!);
  return res.json({ entitlement: row });
});

// ── Food search (seeded table) ────────────────────────────────────────────
router.get('/foods/search', requireAuth, (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ foods: [] });
  const rows = db
    .prepare('SELECT * FROM foods WHERE name LIKE ? ORDER BY name LIMIT 40')
    .all(`%${q}%`);
  return res.json({ foods: rows });
});

// ── Stats Summary ─────────────────────────────────────────────────────────
router.get('/stats/summary', requireAuth, (req: AuthedRequest, res: Response) => {
  const dateParam = req.query.date as string | undefined;
  let start: number, end: number;

  if (dateParam) {
    const d = new Date(dateParam + 'T00:00:00Z');
    start = d.getTime();
    end = start + 86400000;
  } else {
    // Default to today
    const today = new Date().toISOString().split('T')[0];
    const d = new Date(today + 'T00:00:00Z');
    start = d.getTime();
    end = start + 86400000;
  }

  // Get all meals for the date
  const meals = db
    .prepare('SELECT total_calories, protein_g, carbs_g, fat_g FROM meals WHERE user_id = ? AND eaten_at >= ? AND eaten_at < ?')
    .all(req.userId!, start, end);

  // Sum up totals
  let caloriesConsumed = 0;
  let proteinConsumed = 0;
  let carbsConsumed = 0;
  let fatConsumed = 0;

  for (const meal of meals as any[]) {
    caloriesConsumed += meal.total_calories || 0;
    proteinConsumed += meal.protein_g || 0;
    carbsConsumed += meal.carbs_g || 0;
    fatConsumed += meal.fat_g || 0;
  }

  // Get calories burned from exercises
  const exercises = db
    .prepare('SELECT SUM(calories_burned) as total FROM exercises WHERE user_id = ? AND logged_at >= ? AND logged_at < ?')
    .get(req.userId!, start, end) as any;
  const caloriesBurned = exercises?.total || 0;

  return res.json({
    caloriesConsumed,
    proteinConsumed,
    carbsConsumed,
    fatConsumed,
    caloriesBurned,
  });
});

// ── Analytics Trends ──────────────────────────────────────────────────────
router.get('/analytics/trends', requireAuth, (req: AuthedRequest, res: Response) => {
  const range = (req.query.range as string) || 'week';
  const daysBack = range === 'week' ? 7 : range === 'month' ? 30 : 90;

  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - daysBack);

  const start = startDate.getTime();
  const end = endDate.getTime();

  // Get goals
  const goalsRow = db.prepare('SELECT * FROM user_goals WHERE user_id = ?').get(req.userId!) as any;
  const goals = {
    dailyCalories: goalsRow?.daily_calories ?? 2000,
    proteinG: goalsRow?.protein_g ?? 150,
    carbsG: goalsRow?.carbs_g ?? 250,
    fatG: goalsRow?.fat_g ?? 65,
  };

  // Get all meals and exercises for the range
  const meals = db
    .prepare('SELECT eaten_at, total_calories, protein_g, carbs_g, fat_g FROM meals WHERE user_id = ? AND eaten_at >= ? AND eaten_at < ?')
    .all(req.userId!, start, end) as any[];

  const exercises = db
    .prepare('SELECT logged_at, calories_burned FROM exercises WHERE user_id = ? AND logged_at >= ? AND logged_at < ?')
    .all(req.userId!, start, end) as any[];

  // Build trends by day
  const trendsByDay: Record<string, any> = {};

  for (const meal of meals) {
    const date = new Date(meal.eaten_at).toISOString().split('T')[0];
    if (!trendsByDay[date]) {
      trendsByDay[date] = { date, calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, mealCount: 0 };
    }
    trendsByDay[date].calories += meal.total_calories || 0;
    trendsByDay[date].protein += meal.protein_g || 0;
    trendsByDay[date].carbs += meal.carbs_g || 0;
    trendsByDay[date].fat += meal.fat_g || 0;
    trendsByDay[date].mealCount += 1;
  }

  for (const ex of exercises) {
    const date = new Date(ex.logged_at).toISOString().split('T')[0];
    if (!trendsByDay[date]) {
      trendsByDay[date] = { date, calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, mealCount: 0 };
    }
    trendsByDay[date].burned += ex.calories_burned || 0;
  }

  const trends = Object.values(trendsByDay).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate averages
  const totalDays = trends.length || 1;
  const averages = {
    calories: trends.reduce((sum, t) => sum + t.calories, 0) / totalDays,
    protein: trends.reduce((sum, t) => sum + t.protein, 0) / totalDays,
    carbs: trends.reduce((sum, t) => sum + t.carbs, 0) / totalDays,
    fat: trends.reduce((sum, t) => sum + t.fat, 0) / totalDays,
    burned: trends.reduce((sum, t) => sum + t.burned, 0) / totalDays,
    meals: trends.reduce((sum, t) => sum + t.mealCount, 0) / totalDays,
  };

  const daysOnTrack = trends.filter(t => t.calories >= goals.dailyCalories * 0.9 && t.calories <= goals.dailyCalories * 1.1).length;

  return res.json({
    trends,
    averages,
    daysOnTrack,
    totalDays: trends.length,
    goals,
  });
});

// ── Vision (OpenAI GPT-4o image analysis) ─────────────────────────────────
router.post('/vision/analyze', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { imageBase64, mode } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.warn('[vision] OPENAI_API_KEY not set — returning mock data');
      // Fallback to mock data when no API key
      if (mode === 'label') {
        return res.json({
          servingSize: '1 serving (100g)',
          caloriesPerServing: 200,
          proteinG: 8,
          carbsG: 30,
          fatG: 5,
          sodiumMg: 300,
        });
      }
      return res.json({
        meal: {
          name: 'Analyzed Meal',
          totalCalories: 520,
          proteinG: 38,
          carbsG: 45,
          fatG: 18,
          items: [
            { name: 'Protein', calories: 280, proteinG: 35, carbsG: 2, fatG: 8, quantity: 200, unit: 'g' },
            { name: 'Carbs', calories: 160, proteinG: 3, carbsG: 35, fatG: 1, quantity: 150, unit: 'g' },
            { name: 'Vegetables', calories: 80, proteinG: 0, carbsG: 8, fatG: 9, quantity: 100, unit: 'g' },
          ],
        },
      });
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    if (mode === 'label') {
      // Analyze nutrition label
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract nutrition facts from this food label image. Return JSON only with this exact structure:
{
  "servingSize": "serving size text",
  "caloriesPerServing": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "sodiumMg": number
}`,
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const content = completion.choices[0]?.message?.content?.trim() || '{}';
      const parsed = JSON.parse(content);
      return res.json(parsed);
    }

    // Default: analyze food meal
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this food image and identify all food items with their nutritional content. Return JSON only with this exact structure:
{
  "meal": {
    "name": "brief meal name",
    "totalCalories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "items": [
      {
        "name": "food item name",
        "calories": number,
        "proteinG": number,
        "carbsG": number,
        "fatG": number,
        "quantity": number,
        "unit": "g or ml or serving"
      }
    ]
  }
}
Be accurate with nutritional values. Include all visible food items.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '{}';
    const parsed = JSON.parse(content);
    return res.json(parsed);
  } catch (err: any) {
    console.error('[vision] error:', err?.message || err);
    return res.status(500).json({ error: 'Vision analysis failed', detail: String(err?.message || err) });
  }
});

export default router;
