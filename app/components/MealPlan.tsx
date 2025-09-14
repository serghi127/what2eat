import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Star, X, ChefHat, FileText, Heart, Wand2 } from 'lucide-react';
import { Recipe } from '../types';
import { ALL_RECIPES } from '../constants';
import MealHistoryCalendar from './MealHistoryCalendar';

interface WeeklyMeal {
  id: string;
  day: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
}

interface MealHistoryEntry {
  id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  recipe_id: number;
  recipe_name: string;
  completed: boolean;
  rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface MealPlanProps {
  weeklyMeals: WeeklyMeal[];
  mealPlans: Record<string, Record<string, Recipe>>;
  mealHistory?: MealHistoryEntry[];
  onMealClick: (recipe: Recipe) => void;
  onHideNavbar?: (hide: boolean) => void;
  onDeleteMeal?: (mealId: string) => void;
  userEmail?: string | null;
  onRefreshMealPlans?: () => Promise<void>;
  onRemoveFromMealPlan?: (day: string, mealType: string) => Promise<void>;
  mealPlansLoading?: boolean;
}

export default function MealPlan({ 
  weeklyMeals, 
  mealPlans, 
  mealHistory = [],
  onMealClick, 
  onHideNavbar,
  onDeleteMeal,
  userEmail,
  onRefreshMealPlans,
  onRemoveFromMealPlan,
  mealPlansLoading = false
}: MealPlanProps) {
  const [selectedMeal, setSelectedMeal] = useState<Recipe | null>(null);
  const [activeTab, setActiveTab] = useState<'plan' | 'history'>('plan');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Debug: Log when mealPlans prop changes
  useEffect(() => {
    console.log('MealPlan: mealPlans prop changed:', mealPlans);
    console.log('MealPlan: Number of days with meals:', Object.keys(mealPlans).length);
    Object.entries(mealPlans).forEach(([day, meals]) => {
      console.log(`MealPlan: ${day}:`, meals);
    });
  }, [mealPlans]);

  // Generate meal plan function
  const handleGenerateMealPlan = async () => {
    if (!userEmail) {
      alert('Please log in to generate a meal plan');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/user/generate-meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userEmail, // Using email as user identifier
        },
        body: JSON.stringify({
          preferences: {
            dietary_restrictions: [],
            disliked_foods: [],
            preferred_ingredients: [],
            daily_calories: 2000,
            daily_protein: 150,
            servings_per_meal: 1,
            kitchen_tools: [],
            specific_cravings: []
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Meal plan generated successfully:', result);
        // Refresh the meal plans to show the new data
        if (onRefreshMealPlans) {
          console.log('Calling onRefreshMealPlans...');
          await onRefreshMealPlans();
          console.log('onRefreshMealPlans completed');
        } else {
          console.log('onRefreshMealPlans is not available');
        }
        
        // Also try a direct refresh as a fallback
        try {
          const refreshResponse = await fetch('/api/user/meal-plans', {
            headers: {
              'Authorization': `Bearer ${userEmail}`,
            },
          });
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('Direct refresh successful:', refreshData);
            // Force a page refresh to ensure UI updates
            window.location.reload();
          }
        } catch (refreshError) {
          console.error('Direct refresh failed:', refreshError);
        }
        
        // Show success message
        alert('🎉 Weekly meal plan generated successfully! Check your meal calendar below.');
      } else {
        const error = await response.json();
        alert(`Failed to generate meal plan: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };
  const [recipeToRemove, setRecipeToRemove] = useState<{day: string, mealType: string, recipe: Recipe} | null>(null);

  // Helper function to get recipe data from recipe ID
  const getRecipeFromId = (recipeId: number): Recipe | null => {
    return ALL_RECIPES.find(recipe => recipe.id === recipeId) || null;
  };

  const handleMealClick = (day: string, mealType: string) => {
    const recipe = mealPlans[day]?.[mealType];
    if (recipe) {
      setSelectedMeal(recipe);
      if (onHideNavbar) onHideNavbar(true);
    }
  };

  const handleCloseModal = () => {
    setSelectedMeal(null);
    if (onHideNavbar) onHideNavbar(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-teal-600" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">Weekly Meal Plan</h2>
        </div>
        <button
          onClick={handleGenerateMealPlan}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-teal-100 text-teal-700 hover:bg-teal-200'
          }`}
        >
          <Wand2 size={16} />
          {isGenerating ? 'Generating...' : 'Generate Plan'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('plan')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'plan'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Meal Plan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Meal History
          </button>
        </div>

        {/* Meal Plan Tab */}
        {activeTab === 'plan' && (
          <div className="grid grid-cols-7 gap-4">
            {weeklyMeals.map((day) => (
              <div key={day.id} className="text-center">
                <div className="text-sm font-medium text-gray-800 mb-3">{day.day}</div>
                <div className="space-y-2">
                  <div 
                    className={`w-full text-xs p-3 rounded text-left cursor-pointer transition-colors ${
                      day.meals.breakfast 
                        ? 'text-gray-700 bg-teal-50 hover:bg-teal-100 border border-teal-200' 
                        : 'text-gray-400 bg-gray-50'
                    }`}
                    onClick={() => handleMealClick(day.day, 'breakfast')}
                  >
                    <div className="font-medium">Breakfast</div>
                    <div className="truncate">{day.meals.breakfast || 'No meal planned'}</div>
                  </div>
                  <div 
                    className={`w-full text-xs p-3 rounded text-left cursor-pointer transition-colors ${
                      day.meals.lunch 
                        ? 'text-gray-700 bg-teal-50 hover:bg-teal-100 border border-teal-200' 
                        : 'text-gray-400 bg-gray-50'
                    }`}
                    onClick={() => handleMealClick(day.day, 'lunch')}
                  >
                    <div className="font-medium">Lunch</div>
                    <div className="truncate">{day.meals.lunch || 'No meal planned'}</div>
                  </div>
                  <div 
                    className={`w-full text-xs p-3 rounded text-left cursor-pointer transition-colors ${
                      day.meals.dinner 
                        ? 'text-gray-700 bg-teal-50 hover:bg-teal-100 border border-teal-200' 
                        : 'text-gray-400 bg-gray-50'
                    }`}
                    onClick={() => handleMealClick(day.day, 'dinner')}
                  >
                    <div className="font-medium">Dinner</div>
                    <div className="truncate">{day.meals.dinner || 'No meal planned'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meal History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <MealHistoryCalendar 
              mealHistory={mealHistory}
              onMealClick={(meal) => {
                const recipe = getRecipeFromId(meal.recipe_id);
                if (recipe) {
                  setSelectedMeal(recipe);
                  if (onHideNavbar) onHideNavbar(true);
                }
              }}
              onDeleteMeal={onDeleteMeal}
            />
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {selectedMeal && (
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
                    <h2 className="text-3xl font-bold text-gray-900">{selectedMeal.name}</h2>
                    <button className="p-2 rounded-full bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Heart size={24} fill="none" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-lg">A delicious recipe from your meal plan</p>
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
                  <Clock className="mx-auto text-sky-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedMeal.time} min</div>
                  <div className="text-sm text-gray-600">Prep Time</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <ChefHat className="mx-auto text-emerald-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedMeal.time} min</div>
                  <div className="text-sm text-gray-600">Cook Time</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <Users className="mx-auto text-teal-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedMeal.servings}</div>
                  <div className="text-sm text-gray-600">Servings</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 rounded-lg">
                  <div className="mx-auto text-cyan-600 mb-2 font-bold text-lg">{selectedMeal.calories}</div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedMeal.tags.map((tag) => (
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
                      {selectedMeal.ingredients.map((ingredient, index) => (
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
                      {selectedMeal.steps.map((step, index) => (
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
                {(() => {
                  // Don't show button logic until meal plans are loaded
                  if (mealPlansLoading) {
                    return (
                      <button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-500 py-4 px-6 rounded-lg font-medium text-lg cursor-not-allowed"
                      >
                        Loading...
                      </button>
                    );
                  }
                  
                  // More robust check for recipe in meal plan
                  // Convert both IDs to numbers for comparison to handle any type mismatches
                  const selectedRecipeId = Number(selectedMeal.id);
                  
                  // Check if this recipe is already in the meal plan
                  const dayEntry = Object.entries(mealPlans).find(([day, meals]) => 
                    Object.entries(meals).some(([mealType, recipe]) => {
                      const recipeId = Number(recipe.id);
                      return recipeId === selectedRecipeId;
                    })
                  );
                  
                  if (dayEntry) {
                    // Recipe is already in meal plan - show Remove button
                    const [day, meals] = dayEntry;
                    const mealEntry = Object.entries(meals).find(([mealType, recipe]) => {
                      const recipeId = Number(recipe.id);
                      return recipeId === selectedRecipeId;
                    });
                    
                    if (mealEntry) {
                      const [mealType, recipe] = mealEntry;
                      return (
                        <button
                          onClick={() => {
                            setRecipeToRemove({ day, mealType, recipe });
                            setShowRemoveConfirm(true);
                          }}
                          className="flex-1 bg-red-500 text-white py-4 px-6 rounded-lg hover:bg-red-600 transition-colors font-medium text-lg"
                        >
                          Remove from Plan
                        </button>
                      );
                    }
                  }
                  
                  // Recipe is not in meal plan - show Add button
                  return (
                    <button
                      onClick={() => {
                        // This would open the AddToPlanModal, but for now just show a message
                        alert('Add to Plan functionality would open here');
                      }}
                      className="flex-1 bg-blue-500 text-white py-4 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium text-lg"
                    >
                      Add to Plan
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Remove from Plan - shows on top of recipe popup */}
      {showRemoveConfirm && recipeToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Remove from Meal Plan?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to remove <strong>{recipeToRemove.recipe.name}</strong> from your {recipeToRemove.day} {recipeToRemove.mealType}?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false);
                    setRecipeToRemove(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (onRemoveFromMealPlan) {
                        await onRemoveFromMealPlan(recipeToRemove.day, recipeToRemove.mealType);
                      }
                      setShowRemoveConfirm(false);
                      setRecipeToRemove(null);
                      setSelectedMeal(null); // Close the main modal
                      if (onHideNavbar) onHideNavbar(false); // Make navbar visible again
                    } catch (error) {
                      console.error('Error removing meal:', error);
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
