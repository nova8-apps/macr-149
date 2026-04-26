import { useMutation, useQuery } from '@tanstack/react-query';
import { openai } from '@/nova8/backend';
import type { User, Meal, FoodItem, WeightLog, Exercise, UserGoals, Entitlement } from '@/types';
import { useAppStore } from './store';
import { queryClient } from './queryClient';

// ─── API Base Setup ───────────────────────────────────────
// In production, this hits the Nova8 backend. In preview, it hits the sandbox.
const getApiBase = () => {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // Nova8 sandbox: 8081-<id>.e2b.app → 3000-<id>.e2b.app
    const e2bMatch = origin.match(/^https?:\/\/(\d+)-([a-z0-9]+)\.e2b\.app$/i);
    if (e2bMatch) {
      const [, port, sandboxId] = e2bMatch;
      if (parseInt(port, 10) === 8081) return `https://3000-${sandboxId}.e2b.app`;
      return origin;
    }
    // Local dev
    const localMatch = origin.match(/^(https?:\/\/(?:localhost|127\.0\.0\.1)):(\d+)$/i);
    if (localMatch) {
      const [, host, port] = localMatch;
      if (parseInt(port, 10) === 8081) return `${host}:3000`;
      return origin;
    }
  }
  return '';
};

const API_BASE = getApiBase();

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAppStore.getState().sessionToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['x-auth-token'] = token;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('text/html')) {
    throw new Error(`API returned HTML (base=${API_BASE}, path=${path}). Backend may not be running.`);
  }
  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { body = await res.text(); }
    throw Object.assign(
      new Error(`API ${res.status}: ${typeof body === 'object' && body && 'error' in body ? String((body as { error: string }).error) : 'error'}`),
      { status: res.status, body }
    );
  }
  return res.json();
}

// ─── Auth Hooks ────────────────────────────────────────────

// Deleted loginApi and signupApi — replaced with @/nova8/backend/auth module

export async function hasCompletedOnboarding(): Promise<boolean> {
  const token = useAppStore.getState().sessionToken;
  if (!token) return false;

  try {
    const data = await apiCall<{ user: User }>('/api/app/149/auth/me');
    // User completed onboarding if they have a daily calorie goal set
    const goals = data.user?.goals as any;
    return !!(goals?.daily_calories || goals?.dailyCalories);
  } catch {
    return false;
  }
}

export function useMe() {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['me', token],
    queryFn: async () => {
      if (!token) return null;
      const data = await apiCall<{ user: User }>('/api/app/149/auth/me');

      // Normalize goals field names from snake_case to camelCase
      if (data.user?.goals) {
        const g = data.user.goals as any;
        data.user.goals = {
          dailyCalories: g.dailyCalories ?? g.daily_calories ?? g.calories,
          proteinG: g.proteinG ?? g.protein_g ?? g.protein,
          carbsG: g.carbsG ?? g.carbs_g ?? g.carbs,
          fatG: g.fatG ?? g.fat_g ?? g.fat,
        } as UserGoals;
      }

      return data.user;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Meals Hooks ───────────────────────────────────────────

export function useMealsByDate(date: string) {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['meals', date, token],
    queryFn: async () => {
      const data = await apiCall<{ meals: Meal[] }>(`/api/meals?date=${date}`);
      return data.meals;
    },
    enabled: !!token,
  });
}

export function useDeleteMeal() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiCall(`/api/meals/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

export function useSaveMeal() {
  return useMutation({
    mutationFn: async (meal: Partial<Meal>) => {
      const data = await apiCall<{ meal: Meal }>('/api/meals', {
        method: 'POST',
        body: JSON.stringify(meal),
      });
      return data.meal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
    },
  });
}

// ─── Food Search Hook ──────────────────────────────────────

export function useFoodSearch(query: string) {
  return useQuery({
    queryKey: ['food-search', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];
      const data = await apiCall<{ foods: FoodItem[] }>(`/api/food/search?q=${encodeURIComponent(query)}`);
      return data.foods;
    },
    enabled: query.trim().length >= 2,
  });
}

// ─── Vision Analyze Hook ────────────────────────────────────

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

      const content = res.choices?.[0]?.message?.content;
      if (!content) throw new Error('No response from vision API');
      return JSON.parse(content);
    },
  });
}

// ─── Weight Logs Hooks ─────────────────────────────────────

export function useWeightLogs(range?: 'week' | 'month' | '3months') {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['weight-logs', range, token],
    queryFn: async () => {
      const path = range ? `/api/weight?range=${range}` : '/api/weight';
      const data = await apiCall<{ logs: WeightLog[] }>(path);
      return data;
    },
    enabled: !!token,
  });
}

export function useLogWeight() {
  return useMutation({
    mutationFn: async (weightKg: number) => {
      const data = await apiCall<{ log: WeightLog }>('/api/weight', {
        method: 'POST',
        body: JSON.stringify({ weightKg }),
      });
      return data.log;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-logs'] });
    },
  });
}

// ─── Stats & Analytics Hooks ───────────────────────────────

export function useStatsSummary(date?: string) {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['stats-summary', date, token],
    queryFn: async () => {
      const path = date ? `/api/stats/summary?date=${date}` : '/api/stats/summary';
      const data = await apiCall<{
        caloriesConsumed: number;
        caloriesLeft: number;
        proteinConsumed: number;
        proteinLeft: number;
        carbsConsumed: number;
        carbsLeft: number;
        fatConsumed: number;
        fatLeft: number;
      }>(path);
      return data;
    },
    enabled: !!token,
  });
}

export function useAnalyticsTrends(range: 'week' | 'month' | '3months' = 'week') {
  const token = useAppStore((s) => s.sessionToken);
  return useQuery({
    queryKey: ['analytics-trends', range, token],
    queryFn: async () => {
      const data = await apiCall<{
        trends: Array<{
          date: string;
          caloriesConsumed: number;
          proteinConsumed: number;
          carbsConsumed: number;
          fatConsumed: number;
        }>;
        averages?: {
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
        };
        daysOnTrack?: number;
        totalDays?: number;
      }>(`/api/analytics/trends?range=${range}`);
      return data;
    },
    enabled: !!token,
  });
}

// ─── Goals Hooks ───────────────────────────────────────────

export function useGoalsMutation() {
  return useMutation({
    mutationFn: async (goals: UserGoals) => {
      const data = await apiCall<{ goals: UserGoals }>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(goals),
      });
      return data.goals;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ─── Exercise Hooks ────────────────────────────────────────

export function useCreateExercise() {
  return useMutation({
    mutationFn: async (exercise: Omit<Exercise, 'id' | 'loggedAt'>) => {
      const data = await apiCall<{ exercise: Exercise }>('/api/exercise', {
        method: 'POST',
        body: JSON.stringify(exercise),
      });
      return data.exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

// ─── Entitlement Hooks ─────────────────────────────────────

export function useEntitlementMutation() {
  return useMutation({
    mutationFn: async (entitlement: Entitlement) => {
      const data = await apiCall<{ entitlement: Entitlement }>('/api/entitlement', {
        method: 'POST',
        body: JSON.stringify(entitlement),
      });
      return data.entitlement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
