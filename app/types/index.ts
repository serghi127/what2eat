export interface Recipe {
  id: number | string;
  name: string;
  time: number;
  servings: number;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  cholesterol?: number;
  fiber?: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
  image?: string | null;
  source?: string;
  credits?: string;
  rating?: number;
  isFavorite?: boolean;
}

export interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  recipe: string;
}

export interface Preferences {
  dietaryRestrictions: string[];
  mealType: string[];
  cookingTime: string[];
  course: string[];
  cuisine: string[];
  ingredients: string[];
  dislikes: string;
  caloriesGoal: number;
  proteinGoal: number;
  budget: number;
  timePerDay: number;
  servings: number;
  tools: string[];
  specificCravings?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_cm?: number;
  weight_kg?: number;
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
}

// Supabase Database Types based on your schema
export interface User {
  id: string; // UUID
  email: string;
  password: string;
  name?: string;
}

// User data without password for API responses
export interface UserWithoutPassword {
  id: string;
  email: string;
  name?: string;
}

export interface DailyProgress {
  id: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  cholesterol?: number;
}

export interface DietaryPrefs {
  id: number;
  restrictions: string[]; // JSONB
  allergies?: string[]; // JSONB
  tools?: string[]; // JSONB
}

export interface Goals {
  id: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  cholesterol?: number;
}

export interface MealTable {
  id: number;
  weekly_plan: any; // JSONB
  favorite_recipes?: any; // JSONB
}

export interface PlanPrefs {
  id: number;
  meals_per_day: number;
  snacks_per_day?: number;
  weekly_budget?: number;
}

export interface Stats {
  id: number;
  points: number;
  cart_items?: number;
  cart_contents?: any; // JSONB
}

// User registration data (what's sent during signup)
export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
}

// User profile update data
export interface UserProfileUpdate {
  name?: string;
}
