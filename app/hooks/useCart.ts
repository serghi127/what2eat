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
    
    setCart(prev => {
      // Group existing items by name
      const existingItems = prev.reduce((acc, item) => {
        if (!acc[item.name]) {
          acc[item.name] = { ...item, quantity: 0 };
        }
        acc[item.name].quantity += item.quantity;
        return acc;
      }, {} as Record<string, CartItem>);
      
      // Add new items, aggregating quantities for existing ingredients
      const updatedItems = [...prev];
      newItems.forEach(newItem => {
        const existingItem = existingItems[newItem.name];
        if (existingItem) {
          // Find the first occurrence of this ingredient and update its quantity
          const itemIndex = updatedItems.findIndex(item => item.name === newItem.name);
          if (itemIndex !== -1) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              quantity: updatedItems[itemIndex].quantity + 1
            };
          }
        } else {
          // Add new ingredient
          updatedItems.push(newItem);
        }
      });
      
      return updatedItems;
    });
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