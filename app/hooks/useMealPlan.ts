import { useState, useEffect, useCallback } from 'react';
import { Recipe } from '../types';
import { ALL_RECIPES } from '../constants';

interface UseMealPlanReturn {
  mealPlans: Record<string, Record<string, Recipe>>;
  loading: boolean;
  error: string | null;
  addToMealPlan: (recipe: Recipe, day: string, meal: string) => Promise<void>;
  removeFromMealPlan: (day: string, meal: string) => Promise<void>;
  refreshMealPlans: () => Promise<void>;
}

export function useMealPlan(userEmail: string | null): UseMealPlanReturn {
  const [mealPlans, setMealPlans] = useState<Record<string, Record<string, Recipe>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadMealPlans = useCallback(async () => {
    if (!userEmail) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/meal-plans', {
        headers: {
          'Authorization': `Bearer ${userEmail}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load meal plans');
      }

      const data = await response.json();
      
      console.log('useMealPlan: Raw API response:', data);
      console.log('useMealPlan: Raw mealPlan data:', data.mealPlan);
      
      // Transform the data from recipe IDs to full recipe objects
      const transformedMealPlans: Record<string, Record<string, Recipe>> = {};
      
      Object.entries(data.mealPlan).forEach(([day, meals]: [string, any]) => {
        console.log(`useMealPlan: Processing day "${day}" with meals:`, meals);
        transformedMealPlans[day] = {};
        Object.entries(meals).forEach(([mealType, recipeId]: [string, any]) => {
          console.log(`useMealPlan: Processing ${mealType} with recipeId:`, recipeId);
          // Find the recipe by ID from ALL_RECIPES
          const recipe = ALL_RECIPES.find(r => r.id === recipeId);
          if (recipe) {
            console.log(`useMealPlan: Found recipe for ${mealType}:`, recipe.name);
            transformedMealPlans[day][mealType] = recipe;
          } else {
            console.log(`useMealPlan: No recipe found for ID ${recipeId}`);
          }
        });
      });

      console.log('useMealPlan: Final transformed meal plans:', transformedMealPlans);
      console.log('useMealPlan: Setting mealPlans state...');
      setMealPlans(transformedMealPlans);
      console.log('useMealPlan: mealPlans state updated');
    } catch (err) {
      console.error('Error loading meal plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const addToMealPlan = useCallback(async (recipe: Recipe, day: string, meal: string) => {
    if (!userEmail) return;

    try {
      const response = await fetch('/api/user/meal-plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userEmail}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayOfWeek: day,
          mealType: meal,
          recipeId: recipe.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add recipe to meal plan');
      }

      // Refresh meal plans after adding
      await loadMealPlans();
    } catch (err) {
      console.error('Error adding to meal plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to add recipe to meal plan');
    }
  }, [userEmail, loadMealPlans]);

  const removeFromMealPlan = useCallback(async (day: string, meal: string) => {
    if (!userEmail) return;

    try {
      const response = await fetch('/api/user/meal-plans', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userEmail}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayOfWeek: day,
          mealType: meal,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove recipe from meal plan');
      }

      // Refresh meal plans after removing
      await loadMealPlans();
    } catch (err) {
      console.error('Error removing from meal plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove recipe from meal plan');
    }
  }, [userEmail, loadMealPlans]);

  const refreshMealPlans = useCallback(async () => {
    console.log('useMealPlan: refreshMealPlans called');
    setRefreshTrigger(prev => prev + 1); // Force refresh
    await loadMealPlans();
    console.log('useMealPlan: refreshMealPlans completed');
  }, [loadMealPlans]);

  useEffect(() => {
    loadMealPlans();
  }, [loadMealPlans]);

  return {
    mealPlans,
    loading,
    error,
    addToMealPlan,
    removeFromMealPlan,
    refreshMealPlans,
  };
}