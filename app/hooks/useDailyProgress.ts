import { useState, useEffect, useCallback } from 'react';

interface DailyProgress {
  id: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  cholesterol?: number;
  created_at: string;
  updated_at: string;
}

interface UseDailyProgressReturn {
  progress: DailyProgress | null;
  loading: boolean;
  error: string | null;
  updateProgress: (updates: Partial<DailyProgress>) => Promise<void>;
  addMealToProgress: (meal: {
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    cholesterol?: number;
  }) => Promise<void>;
  refreshProgress: () => Promise<void>;
}

export function useDailyProgress(userId: string | null): UseDailyProgressReturn {
  const [progress, setProgress] = useState<DailyProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/progress?userId=${userId}`);

      if (!response.ok) {
        throw new Error('Failed to load daily progress');
      }

      const data = await response.json();
      setProgress(data.progress);
    } catch (err) {
      console.error('Error loading daily progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to load daily progress');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updateProgress = useCallback(async (updates: Partial<DailyProgress>) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update daily progress');
      }

      // Refresh progress after updating
      await loadProgress();
    } catch (err) {
      console.error('Error updating daily progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to update daily progress');
    }
  }, [userId, loadProgress]);

  const addMealToProgress = useCallback(async (meal: {
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    cholesterol?: number;
  }) => {
    if (!userId) return;

    try {
      // Instead of using local state, fetch current progress from API
      const response = await fetch(`/api/user/progress?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch current progress');
      }
      
      const data = await response.json();
      const currentProgress = data.progress || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        cholesterol: 0,
      };

      // Add meal values to current progress
      const updatedProgress = {
        calories: (currentProgress.calories || 0) + meal.calories,
        protein: (currentProgress.protein || 0) + (meal.protein || 0),
        carbs: (currentProgress.carbs || 0) + (meal.carbs || 0),
        fat: (currentProgress.fat || 0) + (meal.fat || 0),
        fiber: (currentProgress.fiber || 0) + (meal.fiber || 0),
        sugar: (currentProgress.sugar || 0) + (meal.sugar || 0),
        cholesterol: (currentProgress.cholesterol || 0) + (meal.cholesterol || 0),
      };

      await updateProgress(updatedProgress);
    } catch (err) {
      console.error('Error adding meal to progress:', err);
      setError(err instanceof Error ? err.message : 'Failed to add meal to progress');
    }
  }, [userId, updateProgress]);

  const refreshProgress = useCallback(async () => {
    await loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    progress,
    loading,
    error,
    updateProgress,
    addMealToProgress,
    refreshProgress,
  };
}
