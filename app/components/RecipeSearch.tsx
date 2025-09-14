'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Heart, Clock, Users, Star, X, ChefHat, Clock as ClockIcon, FileText, Plus, FolderOpen, Sparkles } from 'lucide-react';
import { ALL_RECIPES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import AddToPlanModal from './AddToPlanModal';
import { useMealPlan } from '../hooks/useMealPlan';
import { useMealHistory } from '../hooks/useMealHistory';
import { useDailyProgress } from '../hooks/useDailyProgress';
import { Recipe } from '../types';

export default function RecipeSearch() {
  const { user } = useAuth();
  const { addToMealPlan } = useMealPlan(user?.email || null);
  const { addMealToHistory } = useMealHistory();
  const { addMealToProgress } = useDailyProgress(user?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customCategories, setCustomCategories] = useState<string[]>(['Quick Meals', 'Healthy Options', 'Comfort Food']);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [favoriteRecipeIds, setFavoriteRecipeIds] = useState<Set<string | number>>(new Set());
  const [showAddToPlanModal, setShowAddToPlanModal] = useState(false);
  const [recipeToAddToPlan, setRecipeToAddToPlan] = useState<Recipe | null>(null);
  
  // Combine all recipes from constants and add UI-specific properties
  const allRecipes = ALL_RECIPES.map((recipe, index) => ({
    ...recipe,
    image: recipe.image || '/api/placeholder/300/200',
    rating: 4.5 + (index % 5) * 0.1, // Stable rating based on index
    isFavorite: false // Start with no favorites
  }));
  
  const [recipes, setRecipes] = useState<Recipe[]>(allRecipes);

  // Load favorites from Supabase
  const loadFavorites = async () => {
    if (!user?.email) return;
    
    try {
      console.log('Fetching favorites from API...');
      const response = await fetch('/api/user/favorites', {
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Favorites loaded:', data.favoriteRecipes);
        const favoritesSet = new Set(data.favoriteRecipes || []) as Set<string | number>;
        setFavoriteRecipeIds(favoritesSet);
        
        // Update recipes state to reflect loaded favorites
        setRecipes(prev => prev.map(recipe => ({
          ...recipe,
          isFavorite: favoritesSet.has(recipe.id)
        })));
      } else {
        console.error('Failed to load favorites, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  // Save favorites to Supabase
  const saveFavorites = async (favorites: (string | number)[]) => {
    if (!user?.email) return;
    
    try {
      console.log('Saving favorites to API:', favorites);
      const response = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify({ favoriteRecipes: favorites })
      });
      
      if (response.ok) {
        console.log('Favorites saved successfully');
      } else {
        console.error('Failed to save favorites, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  // Load favorites on component mount and when user changes
  useEffect(() => {
    if (user?.email) {
      console.log('Loading favorites for user:', user.email);
      loadFavorites();
    }
  }, [user?.email]);

  // Also load favorites when component becomes visible (in case of tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.email) {
        console.log('Component visible, reloading favorites');
        loadFavorites();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user?.email]);

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

  const toggleFavorite = async (recipeId: string | number) => {
    const newFavorites = new Set(favoriteRecipeIds);
    
    if (newFavorites.has(recipeId)) {
      newFavorites.delete(recipeId);
    } else {
      newFavorites.add(recipeId);
    }
    
    setFavoriteRecipeIds(newFavorites);
    await saveFavorites(Array.from(newFavorites));
    
    // Update the recipes state to reflect the change
    setRecipes(prev => prev.map(recipe => 
      recipe.id === recipeId 
        ? { ...recipe, isFavorite: newFavorites.has(recipeId) }
        : recipe
    ));
  };

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleModalFavoriteToggle = async (recipeId: string | number) => {
    const newFavorites = new Set(favoriteRecipeIds);
    
    if (newFavorites.has(recipeId)) {
      newFavorites.delete(recipeId);
    } else {
      newFavorites.add(recipeId);
    }
    
    setFavoriteRecipeIds(newFavorites);
    await saveFavorites(Array.from(newFavorites));
    
    // Update the selected recipe in the modal to reflect the change
    setSelectedRecipe(prev => prev ? { ...prev, isFavorite: newFavorites.has(recipeId) } : null);
  };

  const handleCloseModal = () => {
    setSelectedRecipe(null);
  };

  const handleAddToPlan = (recipe: Recipe) => {
    setRecipeToAddToPlan(recipe);
    setShowAddToPlanModal(true);
  };

  const handleAddToPlanSubmit = async (recipeId: number, selections: {day: string, mealType: string}[]) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (recipe) {
        // Add the recipe to all selected day/meal combinations
        for (const selection of selections) {
          await addToMealPlan(recipe, selection.day, selection.mealType);
        }
        setShowAddToPlanModal(false);
        setRecipeToAddToPlan(null);
      }
    } catch (error) {
      console.error('Error adding recipe to meal plan:', error);
    }
  };

  const handleCloseAddToPlanModal = () => {
    setShowAddToPlanModal(false);
    setRecipeToAddToPlan(null);
  };

  const handleAddMeal = async (recipe: Recipe) => {
    try {
      // Add to daily progress
      await addMealToProgress({
        calories: recipe.calories,
        protein: recipe.protein || 0,
        carbs: recipe.carbs || 0,
        fat: recipe.fat || 0,
        fiber: recipe.fiber || 0,
        sugar: recipe.sugar || 0,
        cholesterol: recipe.cholesterol || 0,
      });
      
      // Add to meal history (as lunch by default)
      await addMealToHistory(
        new Date().toISOString().split('T')[0], // date: YYYY-MM-DD format
        'lunch', // mealType: default to lunch
        recipe.id, // recipeId
        recipe.name, // recipeName
        true, // completed
        undefined, // rating
        undefined // notes
      );

      alert(`${recipe.name} added to your daily meals and progress!`);
    } catch (error) {
      console.error('Error adding meal:', error);
      alert('Failed to add meal. Please try again.');
    }
  };

  const addCustomCategory = () => {
    if (newCategoryName.trim() && !customCategories.includes(newCategoryName.trim())) {
      setCustomCategories(prev => [...prev, newCategoryName.trim()]);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const removeCustomCategory = (category: string) => {
    setCustomCategories(prev => prev.filter(c => c !== category));
    if (selectedCategory === category) {
      setSelectedCategory('all');
    }
  };

  const getFilteredRecipesByCategory = () => {
    switch (selectedCategory) {
      case 'all':
        return recipes;
      case 'ai':
        // AI recipes category - currently empty
        return [];
      case 'favorites':
        return recipes.filter(recipe => favoriteRecipeIds.has(recipe.id));
      default:
        // Custom categories - in real app, this would filter by category tags
        return recipes.filter(recipe => 
          recipe.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase())) ||
          recipe.name.toLowerCase().includes(selectedCategory.toLowerCase())
        );
    }
  };

  const filteredRecipes = getFilteredRecipesByCategory().filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilters = selectedFilters.length === 0 || 
      selectedFilters.some(filter => recipe.tags.includes(filter));
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-teal-200 to-emerald-200 pb-20">
      <div className="flex gap-6 p-4">
        {/* Left Sidebar - Categories */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
            
            {/* Default Categories */}
            <div className="space-y-2 mb-6">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-teal-100 text-teal-700 border border-teal-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FolderOpen size={18} />
                <span>All Recipes</span>
                <span className="ml-auto text-xs text-gray-500">{recipes.length}</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('ai')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedCategory === 'ai'
                    ? 'bg-teal-100 text-teal-700 border border-teal-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Sparkles size={18} />
                <span>My AI Recipes</span>
                <span className="ml-auto text-xs text-gray-500">0</span>
              </button>
              
              <button
                onClick={() => setSelectedCategory('favorites')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedCategory === 'favorites'
                    ? 'bg-teal-100 text-teal-700 border border-teal-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart size={18} />
                <span>Favorited Recipes</span>
                <span className="ml-auto text-xs text-gray-500">{favoriteRecipeIds.size}</span>
              </button>
            </div>

            {/* Custom Categories */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Custom Categories</h3>
                <button
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              {/* Add Category Input */}
              {showAddCategory && (
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={addCustomCategory}
                      className="px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCategory(false);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {/* Custom Category List */}
              <div className="space-y-2">
                {customCategories.map(category => (
                  <div key={category} className="flex items-center group">
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category
                          ? 'bg-teal-100 text-teal-700 border border-teal-200'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <FolderOpen size={18} />
                      <span className="text-sm">{category}</span>
                      <span className="ml-auto text-xs text-gray-500">
                        {recipes.filter(r => 
                          r.tags.some(tag => tag.toLowerCase().includes(category.toLowerCase())) ||
                          r.name.toLowerCase().includes(category.toLowerCase())
                        ).length}
                      </span>
                    </button>
                    <button
                      onClick={() => removeCustomCategory(category)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                        ? 'bg-teal-600 text-white'
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
                    className={`p-2 rounded-full transition-colors ${
                      favoriteRecipeIds.has(recipe.id)
                        ? 'bg-red-500 text-white' 
                        : 'bg-white text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart size={16} fill={favoriteRecipeIds.has(recipe.id) ? 'currentColor' : 'none'} />
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
                    <span>{(recipe.rating || 4.5).toFixed(1)}</span>
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
                    className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors text-sm font-medium"
                  >
                    View Recipe
                  </button>
                  <button 
                    onClick={() => handleAddToPlan(recipe)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Add to Plan
                  </button>
                  <button 
                    onClick={() => handleAddMeal(recipe)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                    title="Add to today's meals"
                  >
                    <Plus size={16} />
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
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">{selectedRecipe.name}</h2>
                    <button
                      onClick={() => handleModalFavoriteToggle(selectedRecipe.id)}
                      className={`p-2 rounded-full transition-colors ${
                        favoriteRecipeIds.has(selectedRecipe.id)
                          ? 'bg-red-500 text-white hover:bg-red-600'
                          : 'bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart size={24} fill={favoriteRecipeIds.has(selectedRecipe.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
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
                   <button className="flex-1 bg-teal-600 text-white py-4 px-6 rounded-lg hover:bg-teal-700 transition-colors font-medium text-lg">
                     Add to Cart
                   </button>
                   <button className="flex-1 bg-sky-200 text-sky-700 py-4 px-6 rounded-lg hover:bg-sky-300 transition-colors font-medium text-lg">
                     Save Recipe
                   </button>
                   <button 
                     onClick={() => handleAddToPlan(selectedRecipe)}
                     className="flex-1 bg-emerald-500 text-white py-4 px-6 rounded-lg hover:bg-emerald-600 transition-colors font-medium text-lg"
                   >
                     Add to Plan
                   </button>
                 </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Plan Modal */}
      <AddToPlanModal
        recipe={recipeToAddToPlan}
        isOpen={showAddToPlanModal}
        onClose={handleCloseAddToPlanModal}
        onAddToPlan={handleAddToPlanSubmit}
      />
    </div>
  );
}
