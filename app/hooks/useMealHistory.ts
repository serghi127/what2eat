import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface MealHistoryEntry {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe_id: number;
  recipe_name: string;
  completed: boolean;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface UseMealHistoryReturn {
  mealHistory: MealHistoryEntry[];
  loading: boolean;
  error: string | null;
  addMealToHistory: (date: string, mealType: string, recipeId: number, recipeName: string, completed?: boolean, rating?: number, notes?: string) => Promise<void>;
  updateMealHistory: (id: string, updates: { completed?: boolean; rating?: number; notes?: string }) => Promise<void>;
  deleteMealHistory: (id: string, onProgressRefresh?: () => Promise<void>) => Promise<void>;
  refreshMealHistory: () => Promise<void>;
}

export function useMealHistory(): UseMealHistoryReturn {
  const { user } = useAuth();
  const [mealHistory, setMealHistory] = useState<MealHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMealHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/meal-history');
      if (!response.ok) {
        throw new Error('Failed to fetch meal history');
      }

      const data = await response.json();
      setMealHistory(data.mealHistory || []);
    } catch (err) {
      console.error('Error loading meal history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load meal history');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMealToHistory = useCallback(async (
    date: string, 
    mealType: string, 
    recipeId: number, 
    recipeName: string,
    completed = true, 
    rating?: number, 
    notes?: string
  ) => {
    try {
      const response = await fetch('/api/user/meal-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date,
          mealType,
          recipeId,
          recipeName,
          completed,
          rating,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add meal to history');
      }

      const data = await response.json();
      setMealHistory(prev => [data.mealHistory, ...prev]);
    } catch (err) {
      console.error('Error adding meal to history:', err);
      setError(err instanceof Error ? err.message : 'Failed to add meal to history');
      throw err;
    }
  }, []);

  const updateMealHistory = useCallback(async (id: string, updates: { completed?: boolean; rating?: number; notes?: string }) => {
    try {
      const response = await fetch('/api/user/meal-history', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update meal history');
      }

      const data = await response.json();
      setMealHistory(prev => 
        prev.map(meal => meal.id === id ? data.mealHistory : meal)
      );
    } catch (err) {
      console.error('Error updating meal history:', err);
      setError(err instanceof Error ? err.message : 'Failed to update meal history');
      throw err;
    }
  }, []);

  const deleteMealHistory = useCallback(async (id: string, onProgressRefresh?: () => Promise<void>) => {
    try {
      const response = await fetch('/api/user/meal-history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id, 
          userId: user?.id 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete meal history');
      }

      setMealHistory(prev => prev.filter(meal => meal.id !== id));
      
      // Refresh daily progress if callback provided
      if (onProgressRefresh) {
        await onProgressRefresh();
      }
    } catch (err) {
      console.error('Error deleting meal history:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete meal history');
      throw err;
    }
  }, [user?.id]);

  const refreshMealHistory = useCallback(async () => {
    await loadMealHistory();
  }, [loadMealHistory]);

  useEffect(() => {
    loadMealHistory();
  }, [loadMealHistory]);

  return {
    mealHistory,
    loading,
    error,
    addMealToHistory,
    updateMealHistory,
    deleteMealHistory,
    refreshMealHistory,
  };
}