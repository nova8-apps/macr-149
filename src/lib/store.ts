import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { queryClient } from './queryClient';

export type User = {
  id: string;
  email: string;
  name: string | null;
};

export type Goals = {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
};

export type PendingMeal = {
  name: string;
  imageUrl?: string;
  imageBase64?: string;
  photoUrl?: string;
  aiConfidence?: number;
  totalCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  items: Array<{
    name: string;
    servingSize: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>;
};

type AppState = {
  user: User | null;
  sessionToken: string | null;
  isOnboarded: boolean;
  goals: Goals | null;
  useMetric: boolean;
  pendingMeal: PendingMeal | null;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setAuth: (user: User, token: string) => void;
  signOut: () => void;
  setOnboarded: (value: boolean) => void;
  setGoals: (goals: Goals) => void;
  toggleUnits: () => void;
  setPendingMeal: (meal: PendingMeal | null) => void;
  clearPendingMeal: () => void;
};

export const SEED_FOODS = [
  { id: '1', name: 'Chicken Breast', servingSize: '100g', caloriesPer100g: 165, proteinG: 31, carbsG: 0, fatG: 3.6 },
  { id: '2', name: 'Brown Rice', servingSize: '1 cup cooked', caloriesPer100g: 216, proteinG: 5, carbsG: 45, fatG: 1.8 },
  { id: '3', name: 'Banana', servingSize: '1 medium', caloriesPer100g: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4 },
  { id: '4', name: 'Greek Yogurt', servingSize: '1 cup', caloriesPer100g: 130, proteinG: 11, carbsG: 9, fatG: 5 },
  { id: '5', name: 'Almonds', servingSize: '1 oz (28g)', caloriesPer100g: 164, proteinG: 6, carbsG: 6, fatG: 14 },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      sessionToken: null,
      isOnboarded: false,
      goals: null,
      useMetric: false,
      pendingMeal: null,
      _hasHydrated: false,
      setHasHydrated: (value: boolean) => {
        set({ _hasHydrated: value });
      },
      setAuth: (user: User, token: string) => {
        set({ user, sessionToken: token });
      },
      signOut: () => {
        // Only clear auth fields — do NOT reset isOnboarded (it's a
        // device-level UI routing flag, not auth data). Removing the
        // AsyncStorage.removeItem call so isOnboarded persists across
        // sign-out and the user doesn't get re-routed through onboarding.
        set({ user: null, sessionToken: null });
        // Wave 23.2 — clear React Query cache so next account never
        // sees this account's data. See src/lib/queryClient.ts.
        try { queryClient.clear(); } catch {}
        try { queryClient.removeQueries(); } catch {}
        try { queryClient.cancelQueries(); } catch {}
      },
      setOnboarded: (value: boolean) => {
        set({ isOnboarded: value });
      },
      setGoals: (goals: Goals) => {
        set({ goals });
      },
      toggleUnits: () => {
        set((state) => ({ useMetric: !state.useMetric }));
      },
      setPendingMeal: (meal: PendingMeal | null) => {
        set({ pendingMeal: meal });
      },
      clearPendingMeal: () => {
        set({ pendingMeal: null });
      },
    }),
    {
      name: 'macr-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        isOnboarded: state.isOnboarded,
        goals: state.goals,
        useMetric: state.useMetric,
      }),
      onRehydrateStorage: (state) => {
        // Called immediately after rehydration completes. This callback
        // has access to the fully-hydrated state — we call setHasHydrated
        // to trigger a re-render that unblocks the splash screen.
        return (hydratedState) => {
          if (hydratedState) {
            hydratedState.setHasHydrated(true);
          }
        };
      },
    }
  )
);
