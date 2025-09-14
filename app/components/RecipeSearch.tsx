'use client';

import React, { useState } from 'react';
import { Search, Filter, Heart, Clock, Users, Star, X, ChefHat, Clock as ClockIcon, FileText } from 'lucide-react';
import { BREAKFAST_RECIPES, LUNCH_RECIPES, DINNER_RECIPES } from '../constants';
import { Recipe } from '../types';

interface RecipeSearchProps {
  onAddToCart: (recipe: Recipe) => void;
}

export default function RecipeSearch({ onAddToCart }: RecipeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // Combine all recipes from constants
  const allRecipes: Recipe[] = [
    ...BREAKFAST_RECIPES,
    ...LUNCH_RECIPES,
    ...DINNER_RECIPES
  ];
  
  const [recipes] = useState<Recipe[]>(allRecipes);

  // Generate filter options from all unique tags in recipes
  const allTags = Array.from(new Set(allRecipes.flatMap(recipe => recipe.tags)));
  const filterOptions = allTags.sort();

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const toggleFavorite = (recipeId: string | number) => {
    // In a real app, this would update the database
    console.log('Toggle favorite for recipe:', recipeId);
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleCloseModal = () => {
    setSelectedRecipe(null);
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilters = selectedFilters.length === 0 || 
      selectedFilters.some(filter => recipe.tags.includes(filter));
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-teal-200 to-emerald-200 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recipe Inspiration</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Tags */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-gray-600" size={16} />
            <span className="text-sm text-gray-600">Filters:</span>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(filter => (
                <button
                  key={filter}
                  onClick={() => toggleFilter(filter)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedFilters.includes(filter)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map(recipe => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              {/* Recipe Image */}
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => toggleFavorite(recipe.id)}
                    className="p-2 rounded-full transition-colors bg-white text-gray-400 hover:text-red-500"
                  >
                    <Heart size={16} fill="none" />
                  </button>
                </div>
                <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">Recipe Image</span>
                </div>
              </div>

              {/* Recipe Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{recipe.name}</h3>
                
                {/* Recipe Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{recipe.time} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{recipe.servings} servings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-500" fill="currentColor" />
                    <span>4.8</span>
                  </div>
                </div>

                {/* Calories */}
                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">{recipe.calories} calories</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {recipe.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {recipe.tags.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{recipe.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewRecipe(recipe)}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    View Recipe
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                    Add to Plan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedRecipe.name}</h2>
                  <p className="text-gray-600 text-lg">Delicious recipe with fresh ingredients</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Recipe Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-sky-50 rounded-lg">
                  <ClockIcon className="mx-auto text-sky-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedRecipe.time} min</div>
                  <div className="text-sm text-gray-600">Prep Time</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <ChefHat className="mx-auto text-emerald-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedRecipe.time} min</div>
                  <div className="text-sm text-gray-600">Cook Time</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <Users className="mx-auto text-teal-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedRecipe.servings}</div>
                  <div className="text-sm text-gray-600">Servings</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 rounded-lg">
                  <div className="mx-auto text-cyan-600 mb-2 font-bold text-lg">{selectedRecipe.calories}</div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedRecipe.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Ingredients and Instructions - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Ingredients */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="text-sky-600" size={20} />
                    Ingredients
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <ul className="space-y-3">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-sky-600 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ChefHat className="text-emerald-600" size={20} />
                    Instructions
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <ol className="space-y-4">
                      {selectedRecipe.steps.map((step, index) => (
                        <li key={index} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    onAddToCart(selectedRecipe);
                    handleCloseModal();
                  }}
                  className="flex-1 bg-teal-600 text-white py-4 px-6 rounded-lg hover:bg-teal-700 transition-colors font-medium text-lg"
                >
                  Add to Cart
                </button>
                <button className="flex-1 bg-sky-200 text-sky-700 py-4 px-6 rounded-lg hover:bg-sky-300 transition-colors font-medium text-lg">
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
