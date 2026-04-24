// src/lib/api-hooks.ts — Wave 3h migration to @nova8/backend
// ─────────────────────────────────────────────────────────────────
// All data lives in per-user Firestore collections under the signed-in
// user. OpenAI vision goes through the Nova8 proxy (server-side secret
// key). There are NO custom backend endpoints for this app — Nova8's
// generic /api/app/:id/* surface is the entire backend.
//
// Collections:
//   profile   : single doc id="main" holding goals, streak, entitlement.
//   weight    : [{ weightKg, loggedAt }] one doc per log.
//   meals     : [{ name, totalCalories, proteinG, carbsG, fatG, items, loggedDate, loggedAt }]
//   exercises : [{ name, caloriesBurned, durationMin, loggedDate, loggedAt }]
//
// Aggregations (stats/summary, analytics/trends) are computed client-side
// from the collections above. Food search is a curated static list for
// now (USDA requires a server endpoint we don't have yet).

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth, db, openai } from '@/nova8/backend';

// ─── Types ───────────────────────────────────────────────

export interface VisionMealResult {
  meal: {
    name: string;
    totalCalories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    items: Array<{
      name: string;
      calories: number;
      proteinG: number;
      carbsG: number;
      fatG: number;
      quantity: number;
      unit: string;
    }>;
  };
  aiConfidence?: 'high' | 'low';
}

export interface VisionLabelResult {
  servingSize: string;
  caloriesPerServing: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sodiumMg: number;
  aiConfidence?: 'high' | 'low';
}

const PROFILE_ID = 'main';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

async function ensureProfile(): Promise<{ goals?: any; streak?: any; entitlement?: any }> {
  const existing = await db.get('profile', PROFILE_ID);
  if (existing) return (existing.data as any) || {};
  const created = await db.create('profile', {}, PROFILE_ID);
  return (created.data as any) || {};
}

// Wave 3o — canonical "has this user already onboarded?" check.
//
// The bug this replaces: sign-in screens previously read
// `(authUser as any).goals.daily_calories`, but Nova8 auth.signIn* returns
// a plain Nova8User (id/email/name/createdAt) — goals are stored server-side
// on the `profile` collection, not returned by /auth/signin. The old check
// was therefore ALWAYS false and every returning user was shoved back into
// onboarding, which blew away their meal history on each launch.
//
// Now: call this right after a successful sign-in. It reads the user's
// profile doc from the server; if goals.calories is present and > 0 we
// consider onboarding complete. Safe to call on every sign-in — cheap
// single-doc read, creates the profile stub if missing.
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const profile = await ensureProfile();
    const goals = (profile as any)?.goals;
    const cal = Number(goals?.calories ?? goals?.daily_calories ?? 0);
    return Number.isFinite(cal) && cal > 0;
  } catch {
    // If the profile fetch itself fails, don't assume onboarded — better
    // to re-run onboarding (idempotent) than to dump them into a broken
    // home screen with no goals.
    return false;
  }
}

// ─── Auth ────────────────────────────────────────────────

export function loginApi(email: string, password: string) {
  return auth.signInWithEmail(email, password);
}

export function signupApi(email: string, password: string, name?: string) {
  return auth.signUpWithEmail(email, password, name);
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = auth.currentUser();
      if (!user) throw new Error('Not signed in');
      const profile = await ensureProfile();
      return {
        user: { id: user.id, email: user.email, name: user.name },
        goals: profile.goals || null,
        streak: profile.streak || null,
        entitlement: profile.entitlement || { isPro: false },
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Goals ───────────────────────────────────────────────

export function useGoalsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goals: any) => {
      await ensureProfile();
      return db.update('profile', PROFILE_ID, { goals });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ─── Weight ──────────────────────────────────────────────

export function useWeightLogs() {
  return useQuery({
    queryKey: ['weight'],
    queryFn: async () => {
      const docs = await db.list('weight', { limit: 200 });
      // Newest first.
      const logs = docs
        .map((d) => ({ id: d.id, ...(d.data as any) }))
        .sort((a: any, b: any) => (b.loggedAt || 0) - (a.loggedAt || 0));
      return { logs };
    },
  });
}

export function useLogWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { weightKg: number; loggedAt?: number }) =>
      db.create('weight', { weightKg: data.weightKg, loggedAt: data.loggedAt ?? Date.now() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ─── Meals ───────────────────────────────────────────────

export function useMealsByDate(date: string) {
  return useQuery({
    queryKey: ['meals', date],
    queryFn: async () => {
      const docs = await db.query('meals', 'loggedDate', '==', date, { limit: 100 });
      return docs.map((d) => ({ id: d.id, ...(d.data as any) }));
    },
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meal: any) =>
      db.create('meals', {
        ...meal,
        loggedDate: meal.loggedDate || today(),
        loggedAt: meal.loggedAt ?? Date.now(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => db.remove('meals', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// ─── Exercises ───────────────────────────────────────────

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exercise: any) =>
      db.create('exercises', {
        ...exercise,
        loggedDate: exercise.loggedDate || today(),
        loggedAt: exercise.loggedAt ?? Date.now(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// ─── Stats (computed client-side) ────────────────────────

export function useStatsSummary(date?: string) {
  const d = date || today();
  return useQuery({
    queryKey: ['stats', 'summary', d],
    queryFn: async () => {
      const [meals, exercises] = await Promise.all([
        db.query('meals', 'loggedDate', '==', d, { limit: 100 }),
        db.query('exercises', 'loggedDate', '==', d, { limit: 100 }),
      ]);
      let caloriesConsumed = 0, proteinConsumed = 0, carbsConsumed = 0, fatConsumed = 0;
      for (const doc of meals) {
        const m = doc.data as any;
        caloriesConsumed += Number(m.totalCalories) || 0;
        proteinConsumed += Number(m.proteinG) || 0;
        carbsConsumed += Number(m.carbsG) || 0;
        fatConsumed += Number(m.fatG) || 0;
      }
      let caloriesBurned = 0;
      for (const doc of exercises) {
        caloriesBurned += Number((doc.data as any).caloriesBurned) || 0;
      }
      return { caloriesConsumed, proteinConsumed, carbsConsumed, fatConsumed, caloriesBurned };
    },
  });
}

export function useAnalyticsTrends(range: 'week' | 'month' | '3months' = 'week') {
  return useQuery({
    queryKey: ['analytics', 'trends', range],
    queryFn: async () => {
      const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - (days - 1));
      const startStr = start.toISOString().split('T')[0];
      // Fetch all meals/exercises from the window.
      const [allMeals, allExercises] = await Promise.all([
        db.query('meals', 'loggedDate', '>=', startStr, { limit: 500, orderBy: 'loggedDate', orderDir: 'asc' }),
        db.query('exercises', 'loggedDate', '>=', startStr, { limit: 500, orderBy: 'loggedDate', orderDir: 'asc' }),
      ]);
      const profile = await ensureProfile();
      const goals = profile.goals || null;
      // Group by day.
      const byDay: Record<string, any> = {};
      for (let i = 0; i < days; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const key = day.toISOString().split('T')[0];
        byDay[key] = { date: key, caloriesConsumed: 0, proteinConsumed: 0, carbsConsumed: 0, fatConsumed: 0, caloriesBurned: 0 };
      }
      for (const doc of allMeals) {
        const m = doc.data as any;
        const key = m.loggedDate;
        if (!byDay[key]) continue;
        byDay[key].caloriesConsumed += Number(m.totalCalories) || 0;
        byDay[key].proteinConsumed += Number(m.proteinG) || 0;
        byDay[key].carbsConsumed += Number(m.carbsG) || 0;
        byDay[key].fatConsumed += Number(m.fatG) || 0;
      }
      for (const doc of allExercises) {
        const e = doc.data as any;
        const key = e.loggedDate;
        if (!byDay[key]) continue;
        byDay[key].caloriesBurned += Number(e.caloriesBurned) || 0;
      }
      const trends = Object.values(byDay);
      const avg = (field: string) =>
        trends.reduce((s: number, t: any) => s + (t[field] || 0), 0) / (trends.length || 1);
      const averages = {
        caloriesConsumed: avg('caloriesConsumed'),
        proteinConsumed: avg('proteinConsumed'),
        carbsConsumed: avg('carbsConsumed'),
        fatConsumed: avg('fatConsumed'),
        caloriesBurned: avg('caloriesBurned'),
      };
      const calorieTarget = goals?.calorieTarget ?? 2000;
      const daysOnTrack = trends.filter(
        (t: any) => Math.abs(t.caloriesConsumed - calorieTarget) <= calorieTarget * 0.1
      ).length;
      return { trends, averages, daysOnTrack, totalDays: trends.length, goals };
    },
  });
}

// ─── Food search (static curated list) ───────────────────
// USDA / Nutritionix search needs a server endpoint. Until that ships
// we return a small curated set so the search box is still useful.
const STATIC_FOODS = [
  { id: 'chicken-breast', name: 'Chicken breast (100g)', caloriesPerServing: 165, proteinG: 31, carbsG: 0, fatG: 3.6, servingSize: '100g' },
  { id: 'white-rice', name: 'White rice (1 cup cooked)', caloriesPerServing: 205, proteinG: 4.3, carbsG: 45, fatG: 0.4, servingSize: '1 cup' },
  { id: 'broccoli', name: 'Broccoli (1 cup)', caloriesPerServing: 55, proteinG: 3.7, carbsG: 11, fatG: 0.6, servingSize: '1 cup' },
  { id: 'greek-yogurt', name: 'Greek yogurt, plain (170g)', caloriesPerServing: 100, proteinG: 17, carbsG: 6, fatG: 0.4, servingSize: '170g' },
  { id: 'banana', name: 'Banana (1 medium)', caloriesPerServing: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4, servingSize: '1 medium' },
  { id: 'egg', name: 'Egg, whole (1 large)', caloriesPerServing: 72, proteinG: 6.3, carbsG: 0.4, fatG: 4.8, servingSize: '1 large' },
  { id: 'oats', name: 'Oats, dry (1/2 cup)', caloriesPerServing: 150, proteinG: 5, carbsG: 27, fatG: 3, servingSize: '1/2 cup' },
  { id: 'almonds', name: 'Almonds (1 oz)', caloriesPerServing: 164, proteinG: 6, carbsG: 6, fatG: 14, servingSize: '1 oz' },
  { id: 'salmon', name: 'Salmon (100g)', caloriesPerServing: 208, proteinG: 20, carbsG: 0, fatG: 13, servingSize: '100g' },
  { id: 'olive-oil', name: 'Olive oil (1 tbsp)', caloriesPerServing: 119, proteinG: 0, carbsG: 0, fatG: 13.5, servingSize: '1 tbsp' },
  { id: 'sweet-potato', name: 'Sweet potato, baked (1 medium)', caloriesPerServing: 103, proteinG: 2.3, carbsG: 24, fatG: 0.2, servingSize: '1 medium' },
  { id: 'peanut-butter', name: 'Peanut butter (2 tbsp)', caloriesPerServing: 188, proteinG: 8, carbsG: 6, fatG: 16, servingSize: '2 tbsp' },
];

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['foods', 'search', query],
    queryFn: async () => {
      const q = query.trim().toLowerCase();
      if (!q) return { foods: [] };
      const foods = STATIC_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 10);
      return { foods };
    },
    enabled: query.trim().length > 0,
  });
}

// ─── Entitlement (stored on profile doc) ─────────────────

export function useEntitlementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { isPro: boolean }) => {
      await ensureProfile();
      return db.update('profile', PROFILE_ID, {
        entitlement: { isPro: data.isPro, updatedAt: Date.now() },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ─── Vision (OpenAI via Nova8 proxy) ─────────────────────

const VISION_MEAL_PROMPT = `You are a nutrition analyzer. The user sends a photo of a meal. Respond with STRICT JSON matching this schema, no prose, no markdown:

{
  "meal": {
    "name": "short meal name",
    "totalCalories": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "items": [
      { "name": "string", "calories": number, "proteinG": number, "carbsG": number, "fatG": number, "quantity": number, "unit": "g|ml|oz|cup|serving" }
    ]
  },
  "aiConfidence": "high" | "low"
}

CRITICAL INSTRUCTIONS:

1. BRANDED PRODUCTS: If you recognize a branded product such as a chocolate bar, protein bar, candy, energy drink, packaged snack, or fast food item, use your training knowledge of that product's actual nutrition label rather than guessing generically. For example, if you see a Hershey's milk chocolate bar, use the real nutrition facts for that specific product.

2. RESTAURANT MEALS: For restaurant meals (Chipotle, McDonald's, Subway, etc.), decompose the meal by component — rice, protein type and portion, toppings, sauces, sides — and estimate each component individually based on typical portion sizes for that restaurant. Then sum the totals. For example, a Chipotle bowl should list: white rice (calories, macros), chicken (portion size in oz, calories, macros), black beans, cheese, sour cream, etc.

3. NEVER RETURN ZERO: If you are uncertain about any value, provide your best estimate based on typical portion sizes and common nutrition knowledge. Never return 0 for totalCalories, proteinG, carbsG, or fatG unless the item genuinely contains zero calories or zero grams of that macronutrient (like plain water or black coffee). A chocolate bar, restaurant meal, or any real food MUST have non-zero values.

4. If the image is clearly not food at all, only then return { "meal": { "name": "Unknown", "totalCalories": 0, "proteinG": 0, "carbsG": 0, "fatG": 0, "items": [] }, "aiConfidence": "low" }.`;

const VISION_LABEL_PROMPT = `You are a nutrition-label reader. The user sends a photo of a nutrition-facts label. Respond with STRICT JSON matching this schema, no prose, no markdown:

{
  "servingSize": "string (e.g. 1 cup (240g))",
  "caloriesPerServing": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "sodiumMg": number,
  "aiConfidence": "high" | "low"
}

If the image is not a nutrition label, return { "servingSize": "unknown", "caloriesPerServing": 0, "proteinG": 0, "carbsG": 0, "fatG": 0, "sodiumMg": 0, "aiConfidence": "low" }.`;

function extractJson(text: string): any {
  // Try straight JSON first, then greedy-match the largest {...} block.
  try { return JSON.parse(text); } catch {}
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  throw new Error('Vision response was not valid JSON');
}

export function useVisionAnalyze() {
  return useMutation({
    mutationFn: async ({
      imageBase64,
      mode,
    }: {
      imageBase64: string;
      mode?: 'food' | 'label';
    }): Promise<VisionMealResult | VisionLabelResult> => {
      const prompt = mode === 'label' ? VISION_LABEL_PROMPT : VISION_MEAL_PROMPT;
      // Accept both raw base64 and data-URL inputs.
      const dataUrl = imageBase64.startsWith('data:')
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
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
        max_tokens: 1200,
      });
      const text = res.choices?.[0]?.message?.content || '';
      const parsed = extractJson(typeof text === 'string' ? text : '');
      return parsed as VisionMealResult | VisionLabelResult;
    },
  });
}
