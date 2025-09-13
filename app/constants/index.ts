import { Recipe } from '../types';

export const SAMPLE_RECIPES: Record<string, Recipe[]> = {
  breakfast: [
    { 
      id: 1, 
      name: "Protein Overnight Oats", 
      time: 5, 
      servings: 1, 
      calories: 320, 
      protein: 18, 
      tags: ["quick", "high-protein"], 
      ingredients: ["oats", "protein powder", "almond milk", "berries"], 
      steps: ["Mix oats with protein powder", "Add almond milk", "Top with berries", "Refrigerate overnight"] 
    },
    { 
      id: 2, 
      name: "Avocado Toast with Eggs", 
      time: 10, 
      servings: 1, 
      calories: 380, 
      protein: 16, 
      tags: ["quick"], 
      ingredients: ["bread", "avocado", "eggs", "salt", "pepper"], 
      steps: ["Toast bread", "Mash avocado", "Fry eggs", "Assemble and season"] 
    },
  ],
  lunch: [
    { 
      id: 3, 
      name: "Quinoa Buddha Bowl", 
      time: 25, 
      servings: 2, 
      calories: 420, 
      protein: 14, 
      tags: ["high-protein", "cheap"], 
      ingredients: ["quinoa", "chickpeas", "vegetables", "tahini"], 
      steps: ["Cook quinoa", "Roast vegetables", "Prepare tahini dressing", "Assemble bowl"] 
    },
    { 
      id: 4, 
      name: "Chicken Caesar Wrap", 
      time: 15, 
      servings: 1, 
      calories: 450, 
      protein: 28, 
      tags: ["quick", "high-protein"], 
      ingredients: ["chicken breast", "tortilla", "romaine", "caesar dressing"], 
      steps: ["Cook chicken", "Prep lettuce", "Assemble wrap", "Roll tightly"] 
    },
  ],
  dinner: [
    { 
      id: 5, 
      name: "Spicy Tofu Stir-fry", 
      time: 20, 
      servings: 2, 
      calories: 380, 
      protein: 16, 
      tags: ["quick"], 
      ingredients: ["tofu", "bell peppers", "soy sauce", "sriracha", "rice"], 
      steps: ["Press tofu", "Heat oil in pan", "Stir-fry vegetables", "Add sauce and serve"] 
    },
    { 
      id: 6, 
      name: "Creamy Salmon Pasta", 
      time: 30, 
      servings: 2, 
      calories: 520, 
      protein: 32, 
      tags: ["high-protein"], 
      ingredients: ["salmon", "pasta", "cream", "garlic", "herbs"], 
      steps: ["Cook pasta", "Pan-sear salmon", "Make cream sauce", "Combine and serve"] 
    },
  ]
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MEALS = ['breakfast', 'lunch', 'dinner'];