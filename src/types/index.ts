export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  goals?: UserGoals;
  streak?: Streak;
  entitlement?: Entitlement;
}

export interface UserGoals {
  goalType: 'lose' | 'maintain' | 'gain';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active';
  sex: 'male' | 'female';
  birthDate: string;
  heightCm: number;
  startWeightKg: number;
  currentWeightKg: number;
  targetWeightKg: number;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  protein?: number;
  carbsG: number;
  carbs?: number;
  fatG: number;
  fat?: number;
  quantity: number;
  unit: string;
}

export interface Meal {
  id: string;
  name: string;
  photoUrl?: string;
  imageBase64?: string;
  totalCalories: number;
  calories?: number;
  proteinG: number;
  protein?: number;
  carbsG: number;
  carbs?: number;
  fatG: number;
  fat?: number;
  aiConfidence?: number;
  items: MealItem[];
  eatenAt: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  type: string;
  intensity: 'high' | 'medium' | 'low';
  durationMin: number;
  caloriesBurned: number;
  loggedAt: string;
}

export interface WeightLog {
  id: string;
  weightKg: number;
  loggedAt: string;
}

export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastLoggedDate: string;
}

export interface Entitlement {
  isPro: boolean;
  productId?: string;
  expiresAt?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  caloriesPer100g: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize?: string;
  servingUnit?: string;
}

export interface DaySummary {
  caloriesConsumed: number;
  caloriesLeft: number;
  proteinConsumed: number;
  proteinLeft: number;
  carbsConsumed: number;
  carbsLeft: number;
  fatConsumed: number;
  fatLeft: number;
}
