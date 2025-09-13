// hooks/useCart.ts
import { useState, useCallback } from 'react';
import { CartItem, Recipe } from '../types';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((recipe: Recipe) => {
    const newItems: CartItem[] = recipe.ingredients.map(ingredient => ({
      id: Date.now() + Math.random(),
      name: ingredient,
      quantity: 1,
      unit: 'item',
      recipe: recipe.name
    }));
    setCart(prev => [...prev, ...newItems]);
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  }, []);

  return {
    cart,
    setCart,
    addToCart,
    removeFromCart
  };
}