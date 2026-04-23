// Macr — React Query hooks for all API endpoints

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { User, UserGoals, Meal, MealItem, Exercise, WeightLog, Streak, Entitlement, FoodItem, DaySummary } from '@/types';

// ─── Types ────────────────────────────────────────────

interface MeResponse {
  user: User;
  goals: UserGoals | null;
  streak: Streak;
  entitlement: Entitlement;
}

interface AuthResponse {
  token: string;
  user: User;
  goals?: UserGoals | null;
  streak?: Streak;
  entitlement?: Entitlement;
}

interface MealWithItems extends Meal {
  userId?: string;
}

interface StatsSummary extends DaySummary {
  caloriesBurned: number;
  streak: Streak;
}

interface VisionMealResult {
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
}

interface VisionLabelResult {
  servingSize: string;
  caloriesPerServing: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  sodiumMg: number;
}

// ─── Auth (not hooks — called directly) ───────────────

import { setAppToken } from './apiClient';

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient<AuthResponse>('/api/app/149/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    skipAuth: true,
  });
  // Store the token in AsyncStorage so API calls work on app restart
  await setAppToken(response.token);
  return response;
}

export async function signupApi(email: string, password: string, name?: string): Promise<AuthResponse> {
  const response = await apiClient<AuthResponse>('/api/app/149/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password, name }),
    skipAuth: true,
  });
  // Store the token in AsyncStorage so API calls work on app restart
  await setAppToken(response.token);
  return response;
}

export async function logoutApi(): Promise<void> {
  await apiClient('/api/app/149/auth/logout', { method: 'POST' });
  // Clear the token from AsyncStorage
  await setAppToken(null);
}

// ─── User / Me ────────────────────────────────────────

export function useMe() {
  return useQuery<MeResponse>({
    queryKey: ['me'],
    queryFn: () => apiClient<MeResponse>('/api/app/149/auth/me'),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ─── Goals ────────────────────────────────────────────

export function useGoalsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (goals: Partial<UserGoals> & Record<string, unknown>) =>
      apiClient('/api/user/goals', {
        method: 'POST',
        body: JSON.stringify(goals),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// ─── Meals ────────────────────────────────────────────

export function useMealsByDate(date: string) {
  return useQuery<MealWithItems[]>({
    queryKey: ['meals', date],
    queryFn: () => apiClient<MealWithItems[]>(`/api/meals?date=${date}`),
    staleTime: 30 * 1000,
  });
}

export function useCreateMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meal: {
      name: string;
      photoUrl?: string;
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
      eatenAt: string;
    }) => apiClient<MealWithItems>('/api/meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mealId: string) => apiClient(`/api/meals/${mealId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meals'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// ─── Exercises ────────────────────────────────────────

export function useExercisesByDate(date: string) {
  return useQuery<Exercise[]>({
    queryKey: ['exercises', date],
    queryFn: () => apiClient<Exercise[]>(`/api/exercises?date=${date}`),
    staleTime: 30 * 1000,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (exercise: {
      type: string;
      intensity: string;
      durationMin: number;
      caloriesBurned: number;
      loggedAt: string;
    }) => apiClient<Exercise>('/api/exercises', {
      method: 'POST',
      body: JSON.stringify(exercise),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

// ─── Weight ───────────────────────────────────────────

export function useWeightLogs(range: 'week' | 'month' | '3m' = 'month') {
  return useQuery<WeightLog[]>({
    queryKey: ['weight', range],
    queryFn: () => apiClient<WeightLog[]>(`/api/weight?range=${range}`),
    staleTime: 60 * 1000,
  });
}

export function useLogWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weightKg: number) => apiClient('/api/weight', {
      method: 'POST',
      body: JSON.stringify({ weightKg }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

// ─── Stats ────────────────────────────────────────────

export function useStatsSummary(date: string) {
  return useQuery<StatsSummary>({
    queryKey: ['stats', date],
    queryFn: () => apiClient<StatsSummary>(`/api/stats/summary?date=${date}`),
    staleTime: 30 * 1000,
  });
}

interface AnalyticsTrends {
  trends: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    burned: number;
    mealCount: number;
  }>;
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    burned: number;
    meals: number;
  };
  daysOnTrack: number;
  totalDays: number;
  goals: {
    dailyCalories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

export function useAnalyticsTrends(range: 'week' | 'month' | '3m' = 'week') {
  return useQuery<AnalyticsTrends>({
    queryKey: ['analytics', range],
    queryFn: () => apiClient<AnalyticsTrends>(`/api/analytics/trends?range=${range}`),
    staleTime: 60 * 1000,
  });
}

// ─── Foods ────────────────────────────────────────────

export function useFoodSearch(query: string) {
  return useQuery<FoodItem[]>({
    queryKey: ['foods', query],
    queryFn: () => apiClient<FoodItem[]>(`/api/foods/search?q=${encodeURIComponent(query)}`),
    enabled: true, // always fetch, empty query returns all
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Vision ───────────────────────────────────────────

export function useVisionAnalyze() {
  return useMutation({
    mutationFn: ({ imageBase64, mode }: { imageBase64: string; mode?: 'food' | 'label' }) =>
      apiClient<VisionMealResult | VisionLabelResult>('/api/vision/analyze', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mode: mode || 'food' }),
      }),
  });
}

// ─── Entitlement ──────────────────────────────────────

export function useEntitlementMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { isPro: boolean; productId?: string; expiresAt?: string }) =>
      apiClient('/api/user/entitlement', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
