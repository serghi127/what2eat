// components/ShoppingCart.tsx
'use client';

import React from 'react';
import { ChevronLeft, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { CartItem } from '../types';

interface ShoppingCartProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onNavigateToMealPlan: () => void;
}

export default function ShoppingCartComponent({ cart, setCart, onNavigateToMealPlan }: ShoppingCartProps) {
  const groupedCart = cart.reduce((acc: Record<string, CartItem>, item) => {
    if (!acc[item.name]) {
      acc[item.name] = { ...item, quantity: 0 };
    }
    acc[item.name].quantity += item.quantity;
    return acc;
  }, {});

  const cartItems = Object.values(groupedCart);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const updateQuantity = (itemName: string, change: number) => {
    if (change > 0) {
      const originalItem = cart.find(item => item.name === itemName);
      if (originalItem) {
        setCart(prev => [...prev, { ...originalItem, id: Date.now() + Math.random() }]);
      }
    } else {
      const itemIndex = cart.findIndex(item => item.name === itemName);
      if (itemIndex !== -1) {
        setCart(prev => prev.filter((_, index) => index !== itemIndex));
      }
    }
  };

  const proceedToCheckout = () => {
    const searchQuery = cartItems.map(item => item.name).join('+');
    const instacartURL = `https://www.instacart.com/store/search_v3/${encodeURIComponent(searchQuery)}`;
    window.open(instacartURL, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-4">Add ingredients from your meal plan to get started</p>
                <button
                  onClick={onNavigateToMealPlan}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  View Meal Plan
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">from {item.recipe}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.name, -1)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.name, 1)}
                          className="p-1 hover:bg-gray-100 rounded-full"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setCart(prev => prev.filter(cartItem => cartItem.name !== item.name));
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium">Total Items: {totalItems}</span>
                    <span className="text-sm text-gray-600">Estimated cost: ~${Math.round(totalItems * 3.50)}</span>
                  </div>
                  <button
                    onClick={proceedToCheckout}
                    className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
                  >
                    Checkout with Instacart
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    You'll be redirected to Instacart with your items pre-filled
                  </p>
                </div>
              </>
            )}
          </div>
    </div>
  );
}