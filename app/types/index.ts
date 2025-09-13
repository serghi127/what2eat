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
  tags: string[];
  ingredients: string[];
  steps: string[];
  source?: string;
  credits?: string;
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
}

// Extended User interface with all new fields
export interface User {
  id: number;
  name: string;
  email: string;
  password?: string; // Optional for security (excluded in API responses)
  
  // Personal Information
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_cm?: number;
  weight_kg?: number;
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  
  // Nutritional Goals
  daily_calories_goal?: number;
  protein_goal_g?: number;
  carbs_goal_g?: number;
  fat_goal_g?: number;
  fiber_goal_g?: number;
  sugar_goal_g?: number;
  sodium_goal_mg?: number;
  
  // Dietary Preferences & Restrictions
  dietary_restrictions?: string[];
  allergies?: string[];
  disliked_foods?: string[];
  preferred_cuisines?: string[];
  
  // Meal Planning Preferences
  meals_per_day?: number;
  snacks_per_day?: number;
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced';
  cooking_time_preference?: 'quick' | 'moderate' | 'extensive';
  budget_preference?: 'low' | 'medium' | 'high';
  
  // Weekly Meal Plan Storage
  current_meal_plan?: any; // JSON object
  meal_plan_history?: any[]; // Array of JSON objects
  favorite_recipes?: number[]; // Array of recipe IDs
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  
  // Profile Settings
  profile_completed?: boolean;
  notifications_enabled?: boolean;
  timezone?: string;
  language?: string;
}

// User registration data (what's sent during signup)
export interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_cm?: number;
  weight_kg?: number;
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
}

// User profile update data
export interface UserProfileUpdate {
  name?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height_cm?: number;
  weight_kg?: number;
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
  daily_calories_goal?: number;
  protein_goal_g?: number;
  carbs_goal_g?: number;
  fat_goal_g?: number;
  fiber_goal_g?: number;
  sugar_goal_g?: number;
  sodium_goal_mg?: number;
  dietary_restrictions?: string[];
  allergies?: string[];
  disliked_foods?: string[];
  preferred_cuisines?: string[];
  meals_per_day?: number;
  snacks_per_day?: number;
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced';
  cooking_time_preference?: 'quick' | 'moderate' | 'extensive';
  budget_preference?: 'low' | 'medium' | 'high';
  notifications_enabled?: boolean;
  timezone?: string;
  language?: string;
}
