'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  DollarSign, 
  Target, 
  ShoppingCart, 
  X, 
  Check, 
  Plus, 
  Minus 
} from 'lucide-react';

// Mock data for recipes
const SAMPLE_RECIPES = {
  breakfast: [
    { id: 1, name: "Protein Overnight Oats", time: 5, servings: 1, calories: 320, protein: 18, tags: ["quick", "high-protein"], ingredients: ["oats", "protein powder", "almond milk", "berries"], steps: ["Mix oats with protein powder", "Add almond milk", "Top with berries", "Refrigerate overnight"] },
    { id: 2, name: "Avocado Toast with Eggs", time: 10, servings: 1, calories: 380, protein: 16, tags: ["quick"], ingredients: ["bread", "avocado", "eggs", "salt", "pepper"], steps: ["Toast bread", "Mash avocado", "Fry eggs", "Assemble and season"] },
  ],
  lunch: [
    { id: 3, name: "Quinoa Buddha Bowl", time: 25, servings: 2, calories: 420, protein: 14, tags: ["high-protein", "cheap"], ingredients: ["quinoa", "chickpeas", "vegetables", "tahini"], steps: ["Cook quinoa", "Roast vegetables", "Prepare tahini dressing", "Assemble bowl"] },
    { id: 4, name: "Chicken Caesar Wrap", time: 15, servings: 1, calories: 450, protein: 28, tags: ["quick", "high-protein"], ingredients: ["chicken breast", "tortilla", "romaine", "caesar dressing"], steps: ["Cook chicken", "Prep lettuce", "Assemble wrap", "Roll tightly"] },
  ],
  dinner: [
    { id: 5, name: "Spicy Tofu Stir-fry", time: 20, servings: 2, calories: 380, protein: 16, tags: ["quick"], ingredients: ["tofu", "bell peppers", "soy sauce", "sriracha", "rice"], steps: ["Press tofu", "Heat oil in pan", "Stir-fry vegetables", "Add sauce and serve"] },
    { id: 6, name: "Creamy Salmon Pasta", time: 30, servings: 2, calories: 520, protein: 32, tags: ["high-protein"], ingredients: ["salmon", "pasta", "cream", "garlic", "herbs"], steps: ["Cook pasta", "Pan-sear salmon", "Make cream sauce", "Combine and serve"] },
  ]
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];

// Type definitions for better TypeScript support
interface Recipe {
  id: number | string;
  name: string;
  time: number;
  servings: number;
  calories: number;
  protein: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
}

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  recipe: string;
}

interface Preferences {
  dietaryRestrictions: string[];
  dislikes: string;
  caloriesGoal: number;
  proteinGoal: number;
  budget: number;
  timePerDay: number;
  servings: number;
  tools: string[];
  cravings: string[];
  specificCravings?: string;
}

export default function MealPlannerPage() {
  const [currentStep, setCurrentStep] = useState<string>('onboarding');
  const [preferences, setPreferences] = useState<Preferences>({
    dietaryRestrictions: [],
    dislikes: '',
    caloriesGoal: 2000,
    proteinGoal: 150,
    budget: 50,
    timePerDay: 30,
    servings: 2,
    tools: [],
    cravings: []
  });
  const [mealPlan, setMealPlan] = useState<Record<string, Record<string, Recipe>>>({});
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pantryItems, setPantryItems] = useState<string[]>([]);

  // Generate meal plan based on preferences
  const generateMealPlan = () => {
    const plan: Record<string, Record<string, Recipe>> = {};
    DAYS.forEach((day, dayIndex) => {
      plan[day] = {};
      MEALS.forEach(meal => {
        const availableRecipes = SAMPLE_RECIPES[meal as keyof typeof SAMPLE_RECIPES];
        const randomRecipe = availableRecipes[Math.floor(Math.random() * availableRecipes.length)];
        plan[day][meal] = { ...randomRecipe, id: `${day}-${meal}` };
      });
    });
    setMealPlan(plan);
    setCurrentStep('mealPlan');
  };

  // Add ingredients to cart
  const addToCart = (recipe: Recipe) => {
    const newItems: CartItem[] = recipe.ingredients.map(ingredient => ({
      id: Date.now() + Math.random(),
      name: ingredient,
      quantity: 1,
      unit: 'item',
      recipe: recipe.name
    }));
    setCart(prev => [...prev, ...newItems]);
  };

  // Remove item from cart
  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Onboarding Component
  const OnboardingWizard = () => {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const handleNext = () => {
      if (step < totalSteps) {
        setStep(step + 1);
      } else {
        generateMealPlan();
      }
    };

    const handleBack = () => {
      if (step > 1) setStep(step - 1);
    };

    // Stable handlers to prevent re-renders
    const updateDietaryRestrictions = (diet: string) => {
      setPreferences(prev => ({
        ...prev,
        dietaryRestrictions: prev.dietaryRestrictions.includes(diet)
          ? prev.dietaryRestrictions.filter(d => d !== diet)
          : [...prev.dietaryRestrictions, diet]
      }));
    };

    const updateDislikes = (value: string) => {
      setPreferences(prev => ({...prev, dislikes: value}));
    };

    const updateCaloriesGoal = (value: string) => {
      setPreferences(prev => ({...prev, caloriesGoal: parseInt(value)}));
    };

    const updateProteinGoal = (value: string) => {
      setPreferences(prev => ({...prev, proteinGoal: parseInt(value)}));
    };

    const updateBudget = (value: string) => {
      setPreferences(prev => ({...prev, budget: parseInt(value)}));
    };

    const updateTimePerDay = (value: string) => {
      setPreferences(prev => ({...prev, timePerDay: parseInt(value)}));
    };

    const updateServings = (value: string) => {
      setPreferences(prev => ({...prev, servings: parseInt(value)}));
    };

    const updateTools = (tool: string) => {
      setPreferences(prev => ({
        ...prev,
        tools: prev.tools.includes(tool)
          ? prev.tools.filter(t => t !== tool)
          : [...prev.tools, tool]
      }));
    };

    const updateCravings = (craving: string) => {
      setPreferences(prev => ({
        ...prev,
        cravings: prev.cravings.includes(craving)
          ? prev.cravings.filter(c => c !== craving)
          : [...prev.cravings, craving]
      }));
    };

    const updateSpecificCravings = (value: string) => {
      setPreferences(prev => ({...prev, specificCravings: value}));
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800">what2eat</h1>
              <span className="text-sm text-gray-500">{step}/{totalSteps}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{width: `${(step/totalSteps) * 100}%`}}></div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Let's personalize your meal plan</h2>
              <p className="text-gray-600">Tell us about your dietary preferences</p>
              
              <div>
                <label className="block text-sm font-medium mb-2">Dietary Restrictions</label>
                <div className="flex flex-wrap gap-2">
                  {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'].map(diet => (
                    <button
                      key={diet}
                      className={`px-4 py-2 rounded-full text-sm ${
                        preferences.dietaryRestrictions.includes(diet)
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                      onClick={() => updateDietaryRestrictions(diet)}
                    >
                      {diet}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Foods you dislike</label>
                <textarea
                  className="w-full p-3 border rounded-lg"
                  placeholder="e.g., mushrooms, fish, spicy food..."
                  value={preferences.dislikes}
                  onChange={(e) => updateDislikes(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Your goals</h2>
              <p className="text-gray-600">Help us tailor your nutrition</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Daily Calories</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="1200"
                      max="3000"
                      value={preferences.caloriesGoal}
                      onChange={(e) => updateCaloriesGoal(e.target.value)}
                      className="flex-1"
                    />
                    <span className="w-20 text-right">{preferences.caloriesGoal}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Protein (g)</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={preferences.proteinGoal}
                      onChange={(e) => updateProteinGoal(e.target.value)}
                      className="flex-1"
                    />
                    <span className="w-20 text-right">{preferences.proteinGoal}g</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Weekly Budget</label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={preferences.budget}
                    onChange={(e) => updateBudget(e.target.value)}
                    className="flex-1"
                  />
                  <span className="w-20 text-right">${preferences.budget}/week</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Cooking preferences</h2>
              <p className="text-gray-600">Tell us about your kitchen and time</p>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time per day for cooking</label>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={preferences.timePerDay}
                    onChange={(e) => updateTimePerDay(e.target.value)}
                    className="flex-1"
                  />
                  <span className="w-20 text-right">{preferences.timePerDay} min</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Servings needed</label>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={preferences.servings}
                    onChange={(e) => updateServings(e.target.value)}
                    className="flex-1"
                  />
                  <span className="w-20 text-right">{preferences.servings} people</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Kitchen tools you have</label>
                <div className="flex flex-wrap gap-2">
                  {['oven', 'air-fryer', 'instant-pot', 'grill', 'blender', 'food-processor'].map(tool => (
                    <button
                      key={tool}
                      className={`px-4 py-2 rounded-full text-sm ${
                        preferences.tools.includes(tool)
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                      onClick={() => updateTools(tool)}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">What are you craving?</h2>
              <p className="text-gray-600">Tell us what sounds good this week</p>
              
              <div>
                <label className="block text-sm font-medium mb-2">Quick cravings</label>
                <div className="flex flex-wrap gap-2">
                  {['spicy', 'comfort food', 'fresh & light', 'protein-heavy', 'one-pot meals', 'international'].map(craving => (
                    <button
                      key={craving}
                      className={`px-4 py-2 rounded-full text-sm ${
                        preferences.cravings.includes(craving)
                          ? 'bg-orange-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                      onClick={() => updateCravings(craving)}
                    >
                      {craving}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Specific cravings</label>
                <textarea
                  className="w-full p-3 border rounded-lg"
                  placeholder="e.g., spicy tofu, creamy pasta, Mediterranean flavors..."
                  value={preferences.specificCravings || ''}
                  onChange={(e) => updateSpecificCravings(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center px-4 py-2 text-gray-600 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              {step === totalSteps ? 'Generate Plan' : 'Next'}
              {step !== totalSteps && <ChevronRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Meal Plan Grid Component
  const MealPlanGrid = () => {
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
                  onClick={() => setCurrentStep('settings')}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Settings
                </button>
                <button
                  onClick={() => setCurrentStep('cart')}
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

        {/* Recipe Modal */}
        {selectedRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedRecipe.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {selectedRecipe.time} min
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {selectedRecipe.servings} servings
                      </span>
                      <span className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        {selectedRecipe.calories} cal
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedRecipe.tags.map(tag => (
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
                      {selectedRecipe.ingredients.map((ingredient, index) => (
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
                      {selectedRecipe.steps.map((step, index) => (
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
                    Nutrition: {selectedRecipe.calories} cal • {selectedRecipe.protein}g protein
                  </div>
                  <button
                    onClick={() => {
                      addToCart(selectedRecipe);
                      setSelectedRecipe(null);
                    }}
                    className="flex items-center px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Shopping Cart Component
  const ShoppingCart = () => {
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
      // Mock checkout - in real app would integrate with Instacart/DoorDash API
      const searchQuery = cartItems.map(item => item.name).join('+');
      const instacartURL = `https://www.instacart.com/store/search_v3/${encodeURIComponent(searchQuery)}`;
      window.open(instacartURL, '_blank');
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentStep('mealPlan')}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                  <p className="text-gray-600">{totalItems} items from your meal plan</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-4">Add ingredients from your meal plan to get started</p>
                  <button
                    onClick={() => setCurrentStep('mealPlan')}
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
        </div>
      </div>
    );
  };

  // Settings Component
  const Settings = () => {
    const updateCaloriesSetting = (value: string) => {
      setPreferences(prev => ({...prev, caloriesGoal: parseInt(value)}));
    };

    const updateProteinSetting = (value: string) => {
      setPreferences(prev => ({...prev, proteinGoal: parseInt(value)}));
    };

    const updateServingsSetting = (value: string) => {
      setPreferences(prev => ({...prev, servings: parseInt(value)}));
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentStep('mealPlan')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600">Adjust your preferences and goals</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Nutrition Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Daily Calories</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1200"
                    max="3000"
                    value={preferences.caloriesGoal}
                    onChange={(e) => updateCaloriesSetting(e.target.value)}
                    className="flex-1"
                  />
                  <span className="w-20 text-right">{preferences.caloriesGoal}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Protein Goal (g)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={preferences.proteinGoal}
                    onChange={(e) => updateProteinSetting(e.target.value)}
                    className="flex-1"
                  />
                  <span className="w-20 text-right">{preferences.proteinGoal}g</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Meal Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Portion Size</label>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={preferences.servings}
                    onChange={(e) => updateServingsSetting(e.target.value)}
                    className="flex-1"
                  />
                  <span className="w-20 text-right">{preferences.servings} servings</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Generate New Plan</h3>
                <p className="text-gray-600">Create a fresh meal plan with your updated preferences</p>
              </div>
              <button
                onClick={() => {
                  generateMealPlan();
                }}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Regenerate Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main App Render
  return (
    <div className="font-sans">
      {currentStep === 'onboarding' && <OnboardingWizard />}
      {currentStep === 'mealPlan' && <MealPlanGrid />}
      {currentStep === 'cart' && <ShoppingCart />}
      {currentStep === 'settings' && <Settings />}
    </div>
  );
}