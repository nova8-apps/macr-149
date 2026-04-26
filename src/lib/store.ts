import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Meal, FoodItem } from '@/types';
import { queryClient } from './queryClient';

// ─── Seed Food Database (offline fallback) ───────────
export const SEED_FOODS: FoodItem[] = [
  { id: 'f1', name: 'Chicken Breast', caloriesPer100g: 165, proteinG: 31, carbsG: 0, fatG: 3.6, servingSize: '150', servingUnit: 'g' },
  { id: 'f2', name: 'Brown Rice', caloriesPer100g: 123, proteinG: 2.7, carbsG: 26, fatG: 1, servingSize: '200', servingUnit: 'g' },
  { id: 'f3', name: 'Salmon Fillet', caloriesPer100g: 208, proteinG: 20, carbsG: 0, fatG: 13, servingSize: '170', servingUnit: 'g' },
  { id: 'f4', name: 'Eggs (Large)', caloriesPer100g: 155, proteinG: 13, carbsG: 1.1, fatG: 11, servingSize: '50', servingUnit: 'g' },
  { id: 'f5', name: 'Greek Yogurt', caloriesPer100g: 59, proteinG: 10, carbsG: 3.6, fatG: 0.4, servingSize: '170', servingUnit: 'g' },
  { id: 'f6', name: 'Banana', caloriesPer100g: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, servingSize: '120', servingUnit: 'g' },
  { id: 'f7', name: 'Sweet Potato', caloriesPer100g: 86, proteinG: 1.6, carbsG: 20, fatG: 0.1, servingSize: '150', servingUnit: 'g' },
  { id: 'f8', name: 'Avocado', caloriesPer100g: 160, proteinG: 2, carbsG: 8.5, fatG: 15, servingSize: '100', servingUnit: 'g' },
  { id: 'f9', name: 'Oats', caloriesPer100g: 389, proteinG: 17, carbsG: 66, fatG: 7, servingSize: '40', servingUnit: 'g' },
  { id: 'f10', name: 'Almonds', caloriesPer100g: 579, proteinG: 21, carbsG: 22, fatG: 50, servingSize: '30', servingUnit: 'g' },
  { id: 'f11', name: 'Broccoli', caloriesPer100g: 34, proteinG: 2.8, carbsG: 7, fatG: 0.4, servingSize: '150', servingUnit: 'g' },
  { id: 'f12', name: 'Whole Wheat Bread', caloriesPer100g: 247, proteinG: 13, carbsG: 41, fatG: 4.2, servingSize: '30', servingUnit: 'g' },
  { id: 'f13', name: 'Olive Oil', caloriesPer100g: 884, proteinG: 0, carbsG: 0, fatG: 100, servingSize: '15', servingUnit: 'ml' },
  { id: 'f14', name: 'Tofu (Firm)', caloriesPer100g: 144, proteinG: 17, carbsG: 3, fatG: 9, servingSize: '120', servingUnit: 'g' },
  { id: 'f15', name: 'Blueberries', caloriesPer100g: 57, proteinG: 0.7, carbsG: 14, fatG: 0.3, servingSize: '100', servingUnit: 'g' },
  { id: 'f16', name: 'Cottage Cheese', caloriesPer100g: 98, proteinG: 11, carbsG: 3.4, fatG: 4.3, servingSize: '120', servingUnit: 'g' },
  { id: 'f17', name: 'Quinoa', caloriesPer100g: 120, proteinG: 4.4, carbsG: 21, fatG: 1.9, servingSize: '185', servingUnit: 'g' },
  { id: 'f18', name: 'Turkey Breast', caloriesPer100g: 135, proteinG: 30, carbsG: 0, fatG: 1, servingSize: '150', servingUnit: 'g' },
  { id: 'f19', name: 'Peanut Butter', caloriesPer100g: 588, proteinG: 25, carbsG: 20, fatG: 50, servingSize: '32', servingUnit: 'g' },
  { id: 'f20', name: 'Spinach', caloriesPer100g: 23, proteinG: 2.9, carbsG: 3.6, fatG: 0.4, servingSize: '85', servingUnit: 'g' },
  { id: 'f21', name: 'Lentils (Cooked)', caloriesPer100g: 116, proteinG: 9, carbsG: 20, fatG: 0.4, servingSize: '200', servingUnit: 'g' },
  { id: 'f22', name: 'Cheddar Cheese', caloriesPer100g: 403, proteinG: 25, carbsG: 1.3, fatG: 33, servingSize: '28', servingUnit: 'g' },
  { id: 'f23', name: 'Apple', caloriesPer100g: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, servingSize: '180', servingUnit: 'g' },
  { id: 'f24', name: 'White Rice', caloriesPer100g: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, servingSize: '200', servingUnit: 'g' },
  { id: 'f25', name: 'Pasta (Cooked)', caloriesPer100g: 131, proteinG: 5, carbsG: 25, fatG: 1.1, servingSize: '200', servingUnit: 'g' },
  { id: 'f26', name: 'Ground Beef (90%)', caloriesPer100g: 176, proteinG: 20, carbsG: 0, fatG: 10, servingSize: '115', servingUnit: 'g' },
  { id: 'f27', name: 'Milk (Whole)', caloriesPer100g: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, servingSize: '240', servingUnit: 'ml' },
  { id: 'f28', name: 'Orange', caloriesPer100g: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1, servingSize: '150', servingUnit: 'g' },
  { id: 'f29', name: 'Tuna (Canned)', caloriesPer100g: 132, proteinG: 29, carbsG: 0, fatG: 1, servingSize: '120', servingUnit: 'g' },
  { id: 'f30', name: 'Protein Shake', caloriesPer100g: 120, proteinG: 24, carbsG: 3, fatG: 1.5, servingSize: '350', servingUnit: 'ml' },
];

// ─── Store Types ──────────────────────────────────────

interface AppStore {
  // Auth
  user: User | null;
  sessionToken: string | null;
  isOnboarded: boolean;
  setAuth: (user: User, token: string) => void;
  setOnboarded: (val: boolean) => void;
  signOut: () => void;

  // Preferences (local only)
  useMetric: boolean;
  toggleUnits: () => void;

  // Pending meal (transient, for capture → review flow)
  pendingMeal: Partial<Meal> | null;
  setPendingMeal: (meal: Partial<Meal> | null) => void;
  clearPendingMeal: () => void;

  // Hydration gate — Wave 23.2.1. Splash screen waits for this flag
  // to flip true before navigating, so we never route a "signed-out"
  // user to sign-in when they actually have a persisted session.
  _hasHydrated: boolean;
  _setHasHydrated: (v: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // ─── Auth ─────────────────────────────
      user: null,
      sessionToken: null,
      isOnboarded: false,

      setAuth: (user, token) => {
        // Wave 23.2 — if a different user is signing in on the same
        // device, wipe the previous user's cached React Query data so
        // it can't leak across accounts.
        try {
          const prev = useAppStore.getState().user;
          if (prev?.id && user?.id && prev.id !== user.id) {
            try { queryClient.clear(); } catch {}
            try { queryClient.removeQueries(); } catch {}
          }
        } catch {}
        set({ user, sessionToken: token });
      },
      setOnboarded: (val) => set({ isOnboarded: val }),

      signOut: () => {
        set({ user: null, sessionToken: null });
        // Wave 23.2 — clear React Query cache so next account never
        // sees this account's data. See src/lib/queryClient.ts.
        try { queryClient.clear(); } catch {}
        try { queryClient.removeQueries(); } catch {}
        try { queryClient.cancelQueries(); } catch {}
        try {
          // Best-effort: wipe the persisted slice too, so a hard
          // refresh also starts from a clean auth state.
          AsyncStorage.removeItem('macr-store').catch(() => {});
        } catch {}
      },

      // ─── Preferences ─────────────────────
      // Imperial (lbs/ft-in) is the default unit system. Users can
      // switch to metric in Settings → Preferences.
      useMetric: false,
      toggleUnits: () => set((s) => ({ useMetric: !s.useMetric })),

      // ─── Pending Meal ─────────────────────
      pendingMeal: null,
      setPendingMeal: (meal) => set({ pendingMeal: meal }),
      clearPendingMeal: () => set({ pendingMeal: null }),

      // ─── Hydration gate ───────────────────
      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'macr-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        sessionToken: state.sessionToken,
        isOnboarded: state.isOnboarded,
        useMetric: state.useMetric,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          // eslint-disable-next-line no-console
          console.warn('[store] rehydrate error:', error);
        }
        try {
          useAppStore.getState()._setHasHydrated(true);
        } catch {}
      },
    }
  )
);

// Safety net — if rehydrate never fires (e.g. storage unavailable in
// a preview sandbox), flip the hydration flag after 2.5s so the UI
// can still move past the splash screen instead of hanging forever.
if (typeof setTimeout !== 'undefined') {
  setTimeout(() => {
    try {
      if (!useAppStore.getState()._hasHydrated) {
        useAppStore.getState()._setHasHydrated(true);
      }
    } catch {}
  }, 2500);
}
