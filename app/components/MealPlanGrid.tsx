// components/MealPlanGrid.tsx
'use client';

import React from 'react';
import { Clock, ShoppingCart } from 'lucide-react';
import { Recipe } from '../types';
import { DAYS, MEALS } from '../constants/index';
import RecipeModal from './RecipeModal';

interface MealPlanGridProps {
  mealPlan: Record<string, Record<string, Recipe>>;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  cart: any[];
  onAddToCart: (recipe: Recipe) => void;
  onNavigateToCart: () => void;
  onNavigateToSettings: () => void;
}

export default function MealPlanGrid({
  mealPlan,
  selectedRecipe,
  setSelectedRecipe,
  cart,
  onAddToCart,
  onNavigateToCart,
  onNavigateToSettings
}: MealPlanGridProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Weekly Meal Plan</h1>
              <p className="text-gray-600">Tailored to your goals and cravings</p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={onNavigateToSettings}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Settings
              </button>
              <button
                onClick={onNavigateToCart}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Cart ({cart.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {DAYS.map(day => (
            <div key={day} className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900">{day}</h3>
              </div>
              <div className="p-2 space-y-2">
                {MEALS.map(meal => {
                  const recipe = mealPlan[day]?.[meal];
                  if (!recipe) return null;
                  
                  return (
                    <div
                      key={`${day}-${meal}`}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        {meal}
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        {recipe.name}
                      </h4>
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {recipe.time}m
                        </span>
                        <span>{recipe.calories} cal</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {recipe.tags.map(tag => (
                          <span
                            key={tag}
                            className={`px-2 py-1 text-xs rounded-full ${
                              tag === 'quick' ? 'bg-green-100 text-green-800' :
                              tag === 'high-protein' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onAddToCart={onAddToCart}
        />
      )}
    </div>
  );
}