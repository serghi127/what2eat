export interface Recipe {
  id: number | string;
  name: string;
  time: number;
  servings: number;
  calories: number;
  protein: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
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
  dislikes: string;
  caloriesGoal: number;
  proteinGoal: number;
  budget: number;
  timePerDay: number;
  servings: number;
  tools: string[];
  cravings: string[];
  specificCravings?: string;
}
