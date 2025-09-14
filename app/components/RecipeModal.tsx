// components/RecipeModal.tsx
'use client';

import React from 'react';
import { Clock, Users, Target, ShoppingCart, X, Check } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onAddToCart: (recipe: Recipe) => void;
}

export default function RecipeModal({ recipe, onClose, onAddToCart }: RecipeModalProps) {
  const handleAddToCart = () => {
    onAddToCart(recipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {recipe.name}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {recipe.time} min
                </span>
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {recipe.servings} servings
                </span>
                <span className="flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  {recipe.calories} cal
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {recipe.tags.map(tag => (
              <span
                key={tag}
                className={`px-3 py-1 text-sm rounded-full ${
                  tag === 'quick' ? 'bg-green-100 text-green-800' :
                  tag === 'high-protein' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold mb-3">Ingredients</h4>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3">Instructions</h4>
              <ol className="space-y-2">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="flex">
                    <span className="bg-gray-200 text-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3 flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Nutrition: {recipe.calories} cal • {recipe.protein}g protein
            </div>
            <button
              onClick={handleAddToCart}
              className="flex items-center px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}