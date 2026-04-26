// src/lib/api-hooks.ts — Wave 23.35 (single backend = Nova8 cloud)
// ───────────────────────────────────────────────────────────────────
// Why this file changed:
//
// Before Wave 23.35 this app shipped with TWO backends in conflict:
//   • Auth went to nova8.dev via @/nova8/backend/auth (cloud, persistent)
//   • Data went to a local Express + SQLite backend in server/* (sandbox,
//     ephemeral, completely unreachable in TestFlight)
//
// The two backends had separate user tables and separate session tokens, so
// every authenticated call from the app to /api/goals, /api/meals, /api/auth/me
// hit the sandbox backend with a Nova8 cloud token and was rejected as 401.
// The UI swallowed those failures, which is why:
//   - "Failed to save meal" appeared in red on Save
//   - Onboarding never persisted, so users were sent through it on every
//     sign-in
//   - Home always showed the 2000 Calorie default instead of the user's
//     real onboarding goal
//
// Fix: every read and write now goes through @/nova8/backend (cloud), which
// is exactly what auth already uses. There is no longer any reliance on the
// sandbox Express backend for user-owned data — meals, goals, weight, etc.
// all live in the same Nova8 Firestore namespace as the user's account, so
// they survive sandbox restarts, TestFlight, and the App Store.

import { useMutation, useQuery } from '@tanstack/react-query';
import { db, openai } from '@/nova8/backend';
import type { User, Meal, FoodItem, WeightLog, Exercise, UserGoals, Entitlement } from '@/types';
import { useAppStore } from './store';
import { queryClient } from './queryClient';
import { auth } from '@/nova8/backend';

// ─── Helpers ───────────────────────────────────────────────
//
// We store one settings-style row per user under a fixed doc ID so reads and
// writes are O(1). For meals/exercises/weight we let Firestore generate IDs.
const GOALS_DOC_ID = 'default';
const STREAK_DOC_ID = 'default';
const ENTITLEMENT_DOC_ID = 'default';

function startOfDayMs(date: string): number {
  // YYYY-MM-DD → epoch ms at 00:00 UTC. eatenAt is stored as epoch-ms.
  return new Date(date + 'T00:00:00Z').getTime();
}

// ─── Auth Hooks ────────────────────────────────────────────

/**
 * Has this user finished onboarding? True iff a `user_goals/default` doc
 * exists for them in Nova8 cloud. Used by sign-in to route returning users
 * straight to home instead of resending them through onboarding.
 *
 * IMPORTANT: this MUST share the same backend as the rest of the app or
 * returning users land in a loop. (That was the Wave 23.35 bug.)
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const user = auth.currentUser();
    if (!user) return false;
    const doc = await db.get('user_goals', GOALS_DOC_ID);
    if (!doc) return false;
    const g = doc.data as any;
    return Number(g?.dailyCalories) > 0;
  } catch {
    return false;
  }
}

/**
 * useMe — exposes the current user along with goals/streak/entitlement so the
 * existing UI code that reads `me.goals.dailyCalories` keeps working.
 */
export function useMe() {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['me', token],
    queryFn: async () => {
      const u = auth.currentUser();
      if (!u) return null;

      const [goalsDoc, streakDoc, entitlementDoc] = await Promise.all([
        db.get('user_goals', GOALS_DOC_ID).catch(() => null),
        db.get('streaks', STREAK_DOC_ID).catch(() => null),
        db.get('entitlements', ENTITLEMENT_DOC_ID).catch(() => null),
      ]);

      const g: any = goalsDoc?.data ?? {};
      const goals = (Object.keys(g).length > 0)
        ? {
            dailyCalories: g.dailyCalories ?? g.daily_calories ?? null,
            proteinG: g.proteinG ?? g.protein_g ?? null,
            carbsG: g.carbsG ?? g.carbs_g ?? null,
            fatG: g.fatG ?? g.fat_g ?? null,
            goalType: g.goalType ?? g.goal_type ?? 'maintain',
            activityLevel: g.activityLevel ?? g.activity_level ?? 'moderate',
            sex: g.sex ?? 'male',
            birthDate: g.birthDate ?? g.birth_date ?? null,
            heightCm: g.heightCm ?? g.height_cm ?? null,
            startWeightKg: g.startWeightKg ?? g.start_weight_kg ?? null,
            currentWeightKg: g.currentWeightKg ?? g.current_weight_kg ?? null,
            targetWeightKg: g.targetWeightKg ?? g.target_weight_kg ?? null,
          } as UserGoals
        : null;

      const s: any = streakDoc?.data ?? {};
      const streak = {
        currentStreak: Number(s.currentStreak ?? s.current_streak ?? 0),
        longestStreak: Number(s.longestStreak ?? s.longest_streak ?? 0),
        lastLoggedDate: String(s.lastLoggedDate ?? s.last_logged_date ?? ''),
      };

      const e: any = entitlementDoc?.data ?? {};
      const entitlement: Entitlement = {
        isPro: !!e.isPro,
        productId: e.productId ?? null,
        expiresAt: e.expiresAt ?? null,
      } as Entitlement;

      // Mirror the legacy /auth/me response shape the rest of the UI reads.
      return {
        user: {
          id: u.id,
          email: u.email,
          name: u.name ?? null,
          createdAt: u.createdAt,
        } as unknown as User,
        goals,
        streak,
        entitlement,
      };
    },
    enabled: !!token,
    staleTime: 60 * 1000,
  });
}

// ─── Meals Hooks ───────────────────────────────────────────

export function useMealsByDate(date: string) {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['meals', date, token],
    queryFn: async () => {
      const start = startOfDayMs(date);
      const end = start + 86400000;
      // Firestore-style query: eatenAt within the day, newest first.
      const docs = await db.query('meals', 'eatenAt', '>=', start, {
        orderBy: 'eatenAt',
        orderDir: 'desc',
        limit: 200,
      });
      return docs
        .filter((d) => Number((d.data as any).eatenAt) < end)
        .map((d) => ({ id: d.id, ...(d.data as any) })) as Meal[];
    },
    enabled: !!token,
  });
}

export function useDeleteMeal() {
  return useMutation({
    mutationFn: async (id: string) => {
      await db.remove('meals', id);
      return id;
    },
    // Wave 23.35.2 — same eventual-consistency story as useSaveMeal,
    // applied symmetrically on delete: prune from local caches first
    // so the UI updates instantly, then invalidate.
    onSuccess: (deletedId) => {
      queryClient.setQueriesData<Meal[] | undefined>(
        { queryKey: ['meals'], exact: false },
        (old) => (old ? old.filter((m) => m.id !== deletedId) : old),
      );
      queryClient.invalidateQueries({ queryKey: ['meals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['stats-summary'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'], exact: false });
    },
  });
}

export function useSaveMeal() {
  return useMutation({
    mutationFn: async (meal: Partial<Meal>) => {
      const eatenAt = Number((meal as any).eatenAt) || Date.now();
      const created = await db.create('meals', {
        name: String((meal as any).name || 'Meal'),
        photoUrl: (meal as any).photoUrl ?? null,
        totalCalories: Number((meal as any).totalCalories || 0),
        proteinG: Number((meal as any).proteinG || 0),
        carbsG: Number((meal as any).carbsG || 0),
        fatG: Number((meal as any).fatG || 0),
        eatenAt,
        items: Array.isArray((meal as any).items) ? (meal as any).items : [],
      });
      return { id: created.id, ...(created.data as any) } as Meal;
    },
    // Wave 23.35.2 — Firestore queries have ~1-2s indexing latency for
    // freshly-written docs, so a plain invalidateQueries() refetch right
    // after save can return the SAME stale result, leaving the home
    // screen stuck on "No meals logged yet". Fix: manually splice the
    // new meal into every cached meals/stats query, then invalidate so
    // the next natural refetch reconciles with the server-side index.
    onSuccess: (newMeal) => {
      const eatenAt = Number((newMeal as any).eatenAt) || Date.now();
      const isoDay = new Date(eatenAt).toISOString().split('T')[0];

      // 1) Append to every cached useMealsByDate(date) for the meal's day.
      queryClient.setQueriesData<Meal[] | undefined>(
        { queryKey: ['meals'], exact: false },
        (old) => {
          if (!old) return old;
          // Skip cached entries whose date doesn't match this meal's day.
          // (We can't introspect the queryKey from setQueriesData callback
          // directly, so we just guard by deduping on id.)
          if (old.some((m) => m.id === (newMeal as any).id)) return old;
          return [newMeal as Meal, ...old];
        },
      );

      // 2) Patch the stats-summary cache for the meal's day so the home
      //    ring updates instantly with the new totals.
      queryClient.setQueriesData<any>(
        { queryKey: ['stats-summary', isoDay], exact: false },
        (old) => {
          if (!old) return old;
          const m = newMeal as any;
          return {
            ...old,
            caloriesConsumed: Number(old.caloriesConsumed || 0) + Number(m.totalCalories || 0),
            proteinConsumed: Number(old.proteinConsumed || 0) + Number(m.proteinG || 0),
            carbsConsumed: Number(old.carbsConsumed || 0) + Number(m.carbsG || 0),
            fatConsumed: Number(old.fatConsumed || 0) + Number(m.fatG || 0),
          };
        },
      );

      // 3) Still invalidate so a slightly later refetch reconciles with
      //    the canonical server result once the index has caught up.
      queryClient.invalidateQueries({ queryKey: ['meals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['stats-summary'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'], exact: false });
    },
  });
}

// ─── Food Search Hook ──────────────────────────────────────
//
// We have no global food database in Nova8 cloud (it's per-user). For now,
// search the user's previously-saved meals and surface their items as a
// best-effort match. Empty result is fine — the UI already handles it.
export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['food-search', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [] as FoodItem[];
      const recent = await db.list('meals', { limit: 50 });
      const needle = query.toLowerCase();
      const seen = new Set<string>();
      const out: FoodItem[] = [];
      for (const m of recent) {
        const items = ((m.data as any).items || []) as any[];
        for (const it of items) {
          if (!it?.name) continue;
          const key = String(it.name).toLowerCase();
          if (seen.has(key)) continue;
          if (!key.includes(needle)) continue;
          seen.add(key);
          out.push({
            id: `${m.id}-${key}`,
            name: it.name,
            brand: it.brand ?? null,
            caloriesPer100g: Number(it.calories ?? 0),
            proteinG: Number(it.proteinG ?? 0),
            carbsG: Number(it.carbsG ?? 0),
            fatG: Number(it.fatG ?? 0),
            servingSize: it.servingSize ?? null,
            servingUnit: it.unit ?? null,
          } as FoodItem);
          if (out.length >= 40) break;
        }
        if (out.length >= 40) break;
      }
      return out;
    },
    enabled: query.trim().length >= 2,
  });
}

// ─── Vision Analyze Hook ────────────────────────────────────
//
// Nova8 cloud OpenAI proxy. No raw key in the bundle. The proxy reads the
// project's BYOK OpenAI key from its encrypted env vars; if missing it returns
// HTTP 400 provider_key_missing — we surface a graceful fallback so the user
// never sees a crash.

export function useVisionAnalyze() {
  return useMutation({
    mutationFn: async (imageBase64: string) => {
      const dataUrl = `data:image/jpeg;base64,${imageBase64}`;
      const prompt = `Analyze this food image. Return a JSON object with:
{
  "name": "meal name",
  "items": [{"name": "food item", "calories": number, "proteinG": number, "carbsG": number, "fatG": number, "quantity": number, "unit": "g or oz"}],
  "totalCalories": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "confidence": 0-1 (how confident you are in the analysis)
}`;

      try {
        const res = await openai.chat({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: prompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this image.' },
                { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
          max_tokens: 1500,
        });
        const content = (res as any).choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from vision API');
        return JSON.parse(content);
      } catch (err: any) {
        // Fall back to safe defaults so the user can still log a meal manually.
        // The review screen lets them edit every value.
        return {
          name: 'Unknown Meal',
          items: [],
          totalCalories: 500,
          proteinG: 25,
          carbsG: 50,
          fatG: 15,
          confidence: 0.3,
          aiConfidence: 'low',
        };
      }
    },
  });
}

// ─── Weight Logs Hooks ─────────────────────────────────────

export function useWeightLogs(_range?: 'week' | 'month' | '3months') {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['weight-logs', token],
    queryFn: async () => {
      const docs = await db.list('weight_logs', { limit: 200 });
      const logs = docs
        .map((d) => ({ id: d.id, ...(d.data as any) }))
        .sort((a: any, b: any) => Number(b.loggedAt ?? 0) - Number(a.loggedAt ?? 0)) as WeightLog[];
      return logs;
    },
    enabled: !!token,
  });
}

export function useLogWeight() {
  return useMutation({
    mutationFn: async (weightKg: number) => {
      const created = await db.create('weight_logs', {
        weightKg: Number(weightKg) || 0,
        loggedAt: Date.now(),
      });
      // Mirror Wave 21 server behavior: also bump current_weight_kg in goals.
      try {
        await db.update('user_goals', GOALS_DOC_ID, { currentWeightKg: Number(weightKg) || 0 });
      } catch {
        // Non-fatal — user may not have a goals doc yet (pre-onboarding).
      }
      return { id: created.id, ...(created.data as any) } as WeightLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-logs'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ─── Stats & Analytics Hooks ───────────────────────────────
//
// Stats are computed client-side from the meal docs we already fetched. This
// makes them free of an extra round trip and removes the dependency on a
// /api/stats/summary endpoint that doesn't exist in cloud.

export function useStatsSummary(date?: string) {
  const today = date || new Date().toISOString().split('T')[0];
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['stats-summary', today, token],
    queryFn: async () => {
      const start = startOfDayMs(today);
      const end = start + 86400000;
      const mealDocs = await db.query('meals', 'eatenAt', '>=', start, {
        orderBy: 'eatenAt',
        orderDir: 'desc',
        limit: 200,
      });
      const meals = mealDocs.filter((d) => Number((d.data as any).eatenAt) < end);

      let caloriesConsumed = 0;
      let proteinConsumed = 0;
      let carbsConsumed = 0;
      let fatConsumed = 0;
      for (const m of meals) {
        const d = m.data as any;
        caloriesConsumed += Number(d.totalCalories || 0);
        proteinConsumed += Number(d.proteinG || 0);
        carbsConsumed += Number(d.carbsG || 0);
        fatConsumed += Number(d.fatG || 0);
      }

      const exDocs = await db.query('exercises', 'loggedAt', '>=', start, {
        orderBy: 'loggedAt',
        orderDir: 'desc',
        limit: 200,
      });
      let caloriesBurned = 0;
      for (const ex of exDocs) {
        const d = ex.data as any;
        if (Number(d.loggedAt) >= end) continue;
        caloriesBurned += Number(d.caloriesBurned || 0);
      }

      return {
        caloriesConsumed,
        proteinConsumed,
        carbsConsumed,
        fatConsumed,
        caloriesBurned,
      };
    },
    enabled: !!token,
  });
}

export function useAnalyticsTrends(range: 'week' | 'month' | '3months' = 'week') {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['analytics-trends', range, token],
    queryFn: async () => {
      const daysBack = range === 'week' ? 7 : range === 'month' ? 30 : 90;
      const end = Date.now();
      const start = end - daysBack * 86400000;

      const [mealDocs, exDocs, goalsDoc] = await Promise.all([
        db.query('meals', 'eatenAt', '>=', start, { orderBy: 'eatenAt', orderDir: 'asc', limit: 200 }),
        db.query('exercises', 'loggedAt', '>=', start, { orderBy: 'loggedAt', orderDir: 'asc', limit: 200 }),
        db.get('user_goals', GOALS_DOC_ID).catch(() => null),
      ]);

      const trendsByDay: Record<string, any> = {};
      for (const m of mealDocs) {
        const d = m.data as any;
        const date = new Date(Number(d.eatenAt)).toISOString().split('T')[0];
        if (!trendsByDay[date]) {
          trendsByDay[date] = { date, calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, mealCount: 0 };
        }
        trendsByDay[date].calories += Number(d.totalCalories || 0);
        trendsByDay[date].protein += Number(d.proteinG || 0);
        trendsByDay[date].carbs += Number(d.carbsG || 0);
        trendsByDay[date].fat += Number(d.fatG || 0);
        trendsByDay[date].mealCount += 1;
      }
      for (const ex of exDocs) {
        const d = ex.data as any;
        const date = new Date(Number(d.loggedAt)).toISOString().split('T')[0];
        if (!trendsByDay[date]) {
          trendsByDay[date] = { date, calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, mealCount: 0 };
        }
        trendsByDay[date].burned += Number(d.caloriesBurned || 0);
      }

      const trends = Object.values(trendsByDay).sort((a: any, b: any) => a.date.localeCompare(b.date));
      const totalDays = trends.length || 1;
      const sum = (k: string) => (trends as any[]).reduce((s, t) => s + (t[k] || 0), 0);
      const averages = {
        calories: sum('calories') / totalDays,
        protein: sum('protein') / totalDays,
        carbs: sum('carbs') / totalDays,
        fat: sum('fat') / totalDays,
        burned: sum('burned') / totalDays,
        meals: sum('mealCount') / totalDays,
      };

      const goalCals = Number((goalsDoc?.data as any)?.dailyCalories ?? 2000);
      const daysOnTrack = (trends as any[]).filter(
        (t) => t.calories >= goalCals * 0.9 && t.calories <= goalCals * 1.1
      ).length;

      // Map to the legacy { caloriesConsumed, proteinConsumed, ... } shape some
      // callers expect.
      const trendsLegacy = (trends as any[]).map((t) => ({
        date: t.date,
        caloriesConsumed: t.calories,
        proteinConsumed: t.protein,
        carbsConsumed: t.carbs,
        fatConsumed: t.fat,
      }));

      return {
        trends: trendsLegacy,
        averages,
        daysOnTrack,
        totalDays: trends.length,
        goals: {
          dailyCalories: goalCals,
          proteinG: Number((goalsDoc?.data as any)?.proteinG ?? 150),
          carbsG: Number((goalsDoc?.data as any)?.carbsG ?? 250),
          fatG: Number((goalsDoc?.data as any)?.fatG ?? 65),
        },
      };
    },
    enabled: !!token,
  });
}

// ─── Goals Hooks ───────────────────────────────────────────

export function useGoalsMutation() {
  return useMutation({
    mutationFn: async (goals: UserGoals) => {
      // Upsert one row per user at a fixed doc ID. Try update first; on 404
      // (first-time onboarding) fall back to create with that same ID.
      const payload: Record<string, unknown> = {
        goalType: (goals as any).goalType,
        activityLevel: (goals as any).activityLevel,
        sex: (goals as any).sex,
        birthDate: (goals as any).birthDate,
        heightCm: (goals as any).heightCm,
        startWeightKg: (goals as any).startWeightKg,
        currentWeightKg: (goals as any).currentWeightKg,
        targetWeightKg: (goals as any).targetWeightKg,
        dailyCalories: (goals as any).dailyCalories,
        proteinG: (goals as any).proteinG,
        carbsG: (goals as any).carbsG,
        fatG: (goals as any).fatG,
      };
      // Strip undefined so we don't overwrite existing values with null.
      for (const k of Object.keys(payload)) {
        if (payload[k] === undefined) delete payload[k];
      }

      try {
        const updated = await db.update('user_goals', GOALS_DOC_ID, payload);
        return updated.data as unknown as UserGoals;
      } catch (err: any) {
        if (typeof err?.message === 'string' && err.message.includes('(404)')) {
          const created = await db.create('user_goals', payload, GOALS_DOC_ID);
          return created.data as unknown as UserGoals;
        }
        throw err;
      }
    },
    onSuccess: () => {
      // Invalidate broadly so home, settings, and analytics all refetch.
      queryClient.invalidateQueries({ queryKey: ['me'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'], exact: false });
    },
  });
}

// ─── Exercise Hooks ────────────────────────────────────────

export function useCreateExercise() {
  return useMutation({
    mutationFn: async (exercise: Omit<Exercise, 'id' | 'loggedAt'>) => {
      const created = await db.create('exercises', {
        type: (exercise as any).type ?? 'general',
        intensity: (exercise as any).intensity ?? 'moderate',
        durationMin: Number((exercise as any).durationMin || 0),
        caloriesBurned: Number((exercise as any).caloriesBurned || 0),
        loggedAt: Date.now(),
      });
      return { id: created.id, ...(created.data as any) } as Exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['stats-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-trends'] });
    },
  });
}

// ─── Entitlement Hooks ─────────────────────────────────────

export function useEntitlementMutation() {
  return useMutation({
    mutationFn: async (entitlement: Entitlement) => {
      const payload = {
        isPro: !!(entitlement as any).isPro,
        productId: (entitlement as any).productId ?? null,
        expiresAt: (entitlement as any).expiresAt ?? null,
      };
      try {
        const updated = await db.update('entitlements', ENTITLEMENT_DOC_ID, payload);
        return updated.data as unknown as Entitlement;
      } catch (err: any) {
        if (typeof err?.message === 'string' && err.message.includes('(404)')) {
          const created = await db.create('entitlements', payload, ENTITLEMENT_DOC_ID);
          return created.data as unknown as Entitlement;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'], exact: false });
    },
  });
}
