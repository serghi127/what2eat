'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfileUpdate } from '../types';

export function useUserProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (profileData: UserProfileUpdate) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': user.id,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update profile');
      }

      const data = await response.json();
      return data.user;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return { updateProfile, loading, error };
}
