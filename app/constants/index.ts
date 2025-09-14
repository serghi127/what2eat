// Auto-generated recipe data from JSON conversion
// Generated on: 2025-01-13 12:00:00
// Total recipes: 6

import { Recipe } from '../types';

export const BREAKFAST_RECIPES: Recipe[] = [
  { 
    id: 1, 
    name: "Protein Overnight Oats", 
    time: 5, 
    servings: 1, 
    calories: 320, 
    protein: 18,
    carbs: 45,
    fat: 8,
    sugar: 12,
    tags: ["quick", "high-protein", "breakfast", "meal-prep"], 
    ingredients: [
      "1/2 cup rolled oats",
      "1 scoop vanilla protein powder",
      "1 cup unsweetened almond milk",
      "1/2 cup mixed berries",
      "1 tbsp chia seeds",
      "1 tsp honey"
    ], 
    steps: [
      "Mix oats with protein powder in a mason jar",
      "Add almond milk and stir well",
      "Top with berries and chia seeds",
      "Drizzle with honey",
      "Refrigerate overnight and enjoy cold"
    ],
    source: "nutritionapp.com",
    credits: "Original recipe from: Nutrition App Recipe Collection"
  },
  { 
    id: 2, 
    name: "Avocado Toast with Eggs", 
    time: 10, 
    servings: 1, 
    calories: 380, 
    protein: 16,
    carbs: 25,
    fat: 28,
    sugar: 3,
    tags: ["quick", "breakfast", "high-fat"], 
    ingredients: [
      "2 slices whole grain bread",
      "1 ripe avocado",
      "2 large eggs",
      "Salt and pepper to taste",
      "Red pepper flakes",
      "Fresh herbs (optional)"
    ], 
    steps: [
      "Toast bread slices until golden brown",
      "Mash avocado with salt and pepper",
      "Fry eggs sunny-side up or to preference",
      "Spread avocado on toast",
      "Top with eggs and season with red pepper flakes"
    ],
    source: "nutritionapp.com",
    credits: "Original recipe from: Nutrition App Recipe Collection"
  }
];

export const LUNCH_RECIPES: Recipe[] = [
  { 
    id: 3, 
    name: "Quinoa Buddha Bowl", 
    time: 25, 
    servings: 2, 
    calories: 420, 
    protein: 14,
    carbs: 65,
    fat: 12,
    sugar: 8,
    tags: ["high-protein", "cheap", "lunch", "vegetarian"], 
    ingredients: [
      "1 cup quinoa",
      "1 can chickpeas, drained and rinsed",
      "2 cups mixed vegetables (broccoli, bell peppers, carrots)",
      "2 tbsp tahini",
      "1 lemon, juiced",
      "2 tbsp olive oil",
      "Salt and pepper to taste"
    ], 
    steps: [
      "Cook quinoa according to package directions",
      "Roast vegetables in oven at 400°F for 15 minutes",
      "Prepare tahini dressing with lemon juice and olive oil",
      "Assemble bowl with quinoa base",
      "Top with roasted vegetables and chickpeas",
      "Drizzle with tahini dressing"
    ],
    source: "nutritionapp.com",
    credits: "Original recipe from: Nutrition App Recipe Collection"
  },
  { 
    id: 4, 
    name: "Chicken Caesar Wrap", 
    time: 15, 
    servings: 1, 
    calories: 450, 
    protein: 28,
    carbs: 35,
    fat: 22,
    sugar: 4,
    tags: ["quick", "high-protein", "lunch"], 
    ingredients: [
      "1 large tortilla",
      "4 oz grilled chicken breast, sliced",
      "2 cups romaine lettuce",
      "2 tbsp Caesar dressing",
      "2 tbsp parmesan cheese",
      "1/4 cup croutons"
    ], 
    steps: [
      "Season and grill chicken breast until cooked through",
      "Slice chicken into strips",
      "Toss lettuce with Caesar dressing",
      "Lay tortilla flat and add lettuce",
      "Top with chicken, parmesan, and croutons",
      "Roll tightly and slice in half"
    ],
    source: "nutritionapp.com",
    credits: "Original recipe from: Nutrition App Recipe Collection"
  }
];

export const DINNER_RECIPES: Recipe[] = [
  { 
    id: 5, 
    name: "Spicy Tofu Stir-fry", 
    time: 20, 
    servings: 2, 
    calories: 380, 
    protein: 16,
    carbs: 45,
    fat: 14,
    sugar: 12,
    tags: ["quick", "vegetarian", "dinner"], 
    ingredients: [
      "14 oz extra-firm tofu, pressed and cubed",
      "2 bell peppers, sliced",
      "1 onion, sliced",
      "3 tbsp soy sauce",
      "2 tbsp sriracha",
      "1 tbsp sesame oil",
      "2 cups cooked brown rice",
      "Green onions for garnish"
    ], 
    steps: [
      "Press tofu for 15 minutes, then cube",
      "Heat sesame oil in large pan over medium-high",
      "Add tofu and cook until golden, about 5 minutes",
      "Add vegetables and stir-fry for 5 minutes",
      "Add soy sauce and sriracha, cook 2 more minutes",
      "Serve over rice and garnish with green onions"
    ],
    source: "nutritionapp.com",
    credits: "Original recipe from: Nutrition App Recipe Collection"
  },
  { 
    id: 6, 
    name: "Creamy Salmon Pasta", 
    time: 30, 
    servings: 2, 
    calories: 520, 
    protein: 32,
    carbs: 55,
    fat: 18,
    sugar: 6,
    tags: ["high-protein", "dinner"], 
    ingredients: [
      "8 oz whole wheat pasta",
      "2 salmon fillets (6 oz each)",
      "1 cup heavy cream",
      "3 cloves garlic, minced",
      "1/2 cup parmesan cheese",
      "Fresh herbs (dill, parsley)",
      "Salt and pepper to taste"
    ], 
    steps: [
      "Cook pasta according to package directions",
      "Season salmon with salt and pepper",
      "Pan-sear salmon for 4-5 minutes per side",
      "Remove salmon and add garlic to pan",
      "Add cream and simmer until thickened",
      "Stir in parmesan and herbs",
      "Toss pasta with sauce and top with salmon"
    ],
    source: "nutritionapp.com",
    credits: "Original recipe from: Nutrition App Recipe Collection"
  }
];

// Legacy format for backward compatibility
export const SAMPLE_RECIPES: Record<string, Recipe[]> = {
  breakfast: BREAKFAST_RECIPES,
  lunch: LUNCH_RECIPES,
  dinner: DINNER_RECIPES
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MEALS = ['breakfast', 'lunch', 'dinner'];