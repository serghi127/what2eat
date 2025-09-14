// hooks/useMealPlan.ts
import { useState, useCallback } from 'react';
import { Recipe, CartItem, Preferences } from '../types';
import { BREAKFAST_RECIPES, LUNCH_RECIPES, DINNER_RECIPES, DAYS, MEALS } from '../constants/index';

export function useMealPlan() {
  const [mealPlan, setMealPlan] = useState<Record<string, Record<string, Recipe>>>({});

  const generateMealPlan = useCallback(() => {
    const plan: Record<string, Record<string, Recipe>> = {};
    const recipeCollections = {
      breakfast: BREAKFAST_RECIPES,
      lunch: LUNCH_RECIPES,
      dinner: DINNER_RECIPES
    };
    
    DAYS.forEach((day) => {
      plan[day] = {};
      MEALS.forEach(meal => {
        const availableRecipes = recipeCollections[meal as keyof typeof recipeCollections];
        const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        plan[day][meal] = { ...randomRecipe, id: `${day}-${meal}` };
      });
    });
    setMealPlan(plan);
    return plan;
  }, []);

  return {
    mealPlan,
    setMealPlan,
    generateMealPlan
  };
}
