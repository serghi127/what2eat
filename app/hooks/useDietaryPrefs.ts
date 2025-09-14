import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface DietaryPrefs {
  restrictions: string[];
  allergies: string[];
  tools: string[];
}

interface UseDietaryPrefsReturn {
  dietaryPrefs: DietaryPrefs | null;
  loading: boolean;
  error: string | null;
  saveDietaryPrefs: (prefs: DietaryPrefs) => Promise<void>;
  updateRestrictions: (restrictions: string[]) => Promise<void>;
  updateAllergies: (allergies: string[]) => Promise<void>;
  updateTools: (tools: string[]) => Promise<void>;
}

export function useDietaryPrefs(): UseDietaryPrefsReturn {
  const { user } = useAuth();
  const [dietaryPrefs, setDietaryPrefs] = useState<DietaryPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDietaryPrefs = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user/dietary-prefs?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch dietary preferences');
      }

      const data = await response.json();
      
      if (data.dietaryPrefs) {
        setDietaryPrefs({
          restrictions: data.dietaryPrefs.restrictions || [],
          allergies: data.dietaryPrefs.allergies || [],
          tools: data.dietaryPrefs.tools || []
        });
      } else {
        // Initialize with empty preferences if none exist
        setDietaryPrefs({
          restrictions: [],
          allergies: [],
          tools: []
        });
      }
    } catch (err) {
      console.error('Error fetching dietary preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dietary preferences');
      // Initialize with empty preferences on error
      setDietaryPrefs({
        restrictions: [],
        allergies: [],
        tools: []
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const saveDietaryPrefs = useCallback(async (prefs: DietaryPrefs) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setError(null);

      const response = await fetch('/api/user/dietary-prefs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          restrictions: prefs.restrictions,
          allergies: prefs.allergies,
          tools: prefs.tools,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save dietary preferences');
      }

      const data = await response.json();
      setDietaryPrefs(data.dietaryPrefs);
    } catch (err) {
      console.error('Error saving dietary preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save dietary preferences');
      throw err;
    }
  }, [user?.id]);

  const updateRestrictions = useCallback(async (restrictions: string[]) => {
    if (!dietaryPrefs) return;
    
    const updatedPrefs = { ...dietaryPrefs, restrictions };
    await saveDietaryPrefs(updatedPrefs);
  }, [dietaryPrefs, saveDietaryPrefs]);

  const updateAllergies = useCallback(async (allergies: string[]) => {
    if (!dietaryPrefs) return;
    
    const updatedPrefs = { ...dietaryPrefs, allergies };
    await saveDietaryPrefs(updatedPrefs);
  }, [dietaryPrefs, saveDietaryPrefs]);

  const updateTools = useCallback(async (tools: string[]) => {
    if (!dietaryPrefs) return;
    
    const updatedPrefs = { ...dietaryPrefs, tools };
    await saveDietaryPrefs(updatedPrefs);
  }, [dietaryPrefs, saveDietaryPrefs]);

  useEffect(() => {
    fetchDietaryPrefs();
  }, [fetchDietaryPrefs]);

  return {
    dietaryPrefs,
    loading,
    error,
    saveDietaryPrefs,
    updateRestrictions,
    updateAllergies,
    updateTools,
  };
}
