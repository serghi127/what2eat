// hooks/useMealPlan.ts
import { useState, useCallback } from 'react';
import { Recipe, CartItem, Preferences } from '../types';
import { SAMPLE_RECIPES, DAYS, MEALS } from '../constants/index';

export function useMealPlan() {
  const [mealPlan, setMealPlan] = useState<Record<string, Record<string, Recipe>>>({});

  const generateMealPlan = useCallback(() => {
    const plan: Record<string, Record<string, Recipe>> = {};
    DAYS.forEach((day) => {
      plan[day] = {};
      MEALS.forEach(meal => {
        const availableRecipes = SAMPLE_RECIPES[meal as keyof typeof SAMPLE_RECIPES];
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
