import { useState, useEffect, useCallback } from 'react';
import { UserWithoutPassword } from '../types';

interface UserStats {
  points: number;
  cartItems: number;
  cartContents: any[];
}

export function useUserStats(user: UserWithoutPassword | null) {
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    cartItems: 0,
    cartContents: []
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load user stats from Supabase
  const loadStats = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/stats?userId=${user.id}`);
      
      if (!response.ok) {
        // If Supabase is not configured, use default stats
        if (response.status === 500) {
          console.log('Supabase not configured, using default stats');
          setStats({
            points: 0,
            cartItems: 0,
            cartContents: []
          });
          return;
        }
        throw new Error('Failed to load stats');
      }
      
      const data = await response.json();
      
      if (data.stats) {
        setStats({
          points: data.stats.points || 0,
          cartItems: data.stats.cart_items || 0,
          cartContents: data.stats.cart_contents || []
        });
      }
    } catch (error) {
      // If there's an error (like Supabase not configured), use default stats
      console.log('Using default stats due to error:', error);
      setStats({
        points: 0,
        cartItems: 0,
        cartContents: []
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Save stats to Supabase
  const saveStats = useCallback(async (newStats: Partial<UserStats>) => {
    if (!user?.id) return;

    const updatedStats = { ...stats, ...newStats };
    setStats(updatedStats);

    try {
      const response = await fetch('/api/user/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          points: updatedStats.points,
          cartItems: updatedStats.cartItems,
          cartContents: updatedStats.cartContents
        })
      });

      if (!response.ok) {
        // If Supabase is not configured, just update local state
        if (response.status === 500) {
          console.log('Supabase not configured, stats updated locally only');
          return;
        }
        throw new Error('Failed to save stats');
      }
    } catch (error) {
      // If there's an error (like Supabase not configured), just update local state
      console.log('Stats updated locally due to error:', error);
    }
  }, [user?.id, stats]);

  // Update nutrition points
  const updatePoints = useCallback((points: number) => {
    saveStats({ points });
  }, [saveStats]);

  // Add to cart
  const addToCart = useCallback((item: any) => {
    const newCartContents = [...stats.cartContents, item];
    saveStats({
      cartItems: stats.cartItems + 1,
      cartContents: newCartContents
    });
  }, [stats.cartContents, stats.cartItems, saveStats]);

  // Remove from cart
  const removeFromCart = useCallback((itemId: string) => {
    const newCartContents = stats.cartContents.filter(item => item.id !== itemId);
    saveStats({
      cartItems: Math.max(0, stats.cartItems - 1),
      cartContents: newCartContents
    });
  }, [stats.cartContents, stats.cartItems, saveStats]);

  // Clear cart
  const clearCart = useCallback(() => {
    saveStats({
      cartItems: 0,
      cartContents: []
    });
  }, [saveStats]);

  // Load stats when user changes
  useEffect(() => {
    if (user?.id) {
      loadStats();
    } else {
      // Reset stats when user logs out
      setStats({
        points: 0,
        cartItems: 0,
        cartContents: []
      });
    }
  }, [user?.id, loadStats]);

  return {
    stats,
    isLoading,
    updatePoints,
    addToCart,
    removeFromCart,
    clearCart,
    refreshStats: loadStats
  };
}
