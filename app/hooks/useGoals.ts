import { useState, useEffect, useCallback } from 'react';
import { UserWithoutPassword, Goals } from '../types';

interface UserGoals {
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  cholesterol?: number;
}

export function useGoals(user: UserWithoutPassword | null) {
  const [goals, setGoals] = useState<UserGoals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
    fiber: 25,
    sugar: 50,
    cholesterol: 300
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user goals from Supabase
  const fetchGoals = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/goals?userId=${user.id}`);
      
      if (!response.ok) {
        // If Supabase is not configured, use default goals
        if (response.status === 500) {
          console.log('Supabase not configured, using default goals');
          setGoals({
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 65,
            fiber: 25,
            sugar: 50,
            cholesterol: 300
          });
          return;
        }
        throw new Error('Failed to fetch goals');
      }

      const data = await response.json();
      
      if (data.goals) {
        setGoals({
          calories: data.goals.calories || 2000,
          protein: data.goals.protein,
          carbs: data.goals.carbs,
          fat: data.goals.fat,
          fiber: data.goals.fiber,
          sugar: data.goals.sugar,
          cholesterol: data.goals.cholesterol
        });
      }
    } catch (err) {
      // If there's an error (like Supabase not configured), use default goals
      console.log('Using default goals due to error:', err);
      setGoals({
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65,
        fiber: 25,
        sugar: 50,
        cholesterol: 300
      });
      setError(null); // Don't show error for missing Supabase config
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update user goals in Supabase
  const updateGoals = useCallback(async (newGoals: Partial<UserGoals>) => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          goals: newGoals
        })
      });

      if (!response.ok) {
        // If Supabase is not configured, just update local state
        if (response.status === 500) {
          console.log('Supabase not configured, updating local goals only');
          setGoals(prev => ({
            ...prev,
            ...newGoals
          }));
          return;
        }
        throw new Error('Failed to update goals');
      }

      const data = await response.json();
      
      if (data.goals) {
        setGoals(prev => ({
          ...prev,
          ...newGoals
        }));
      }
    } catch (err) {
      // If there's an error (like Supabase not configured), just update local state
      console.log('Updating local goals due to error:', err);
      setGoals(prev => ({
        ...prev,
        ...newGoals
      }));
      setError(null); // Don't show error for missing Supabase config
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch goals when user changes
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    updateGoals,
    refetch: fetchGoals
  };
}
