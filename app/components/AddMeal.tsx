'use client';

import React, { useState } from 'react';
import { Plus, Camera, Search, Clock, Users, Utensils } from 'lucide-react';

interface MealOption {
  id: string;
  name: string;
  calories: number;
  prepTime: number;
  servings: number;
  category: string;
}

export default function AddMeal() {
  const [activeTab, setActiveTab] = useState<'manual' | 'recipe' | 'scan'>('manual');
  const [mealData, setMealData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    sodium: '',
    prepTime: '',
    servings: '',
    notes: ''
  });

  const quickMealOptions: MealOption[] = [
    { id: '1', name: 'Grilled Chicken Breast', calories: 165, prepTime: 20, servings: 1, category: 'Protein' },
    { id: '2', name: 'Quinoa Bowl', calories: 220, prepTime: 15, servings: 1, category: 'Grain' },
    { id: '3', name: 'Mixed Green Salad', calories: 80, prepTime: 10, servings: 1, category: 'Vegetable' },
    { id: '4', name: 'Greek Yogurt', calories: 100, prepTime: 2, servings: 1, category: 'Dairy' },
    { id: '5', name: 'Avocado Toast', calories: 180, prepTime: 5, servings: 1, category: 'Breakfast' },
    { id: '6', name: 'Salmon Fillet', calories: 200, prepTime: 25, servings: 1, category: 'Protein' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setMealData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleQuickAdd = (meal: MealOption) => {
    setMealData({
      name: meal.name,
      calories: meal.calories.toString(),
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      sugar: '',
      sodium: '',
      prepTime: meal.prepTime.toString(),
      servings: meal.servings.toString(),
      notes: ''
    });
    setActiveTab('manual');
  };

  const handleSaveMeal = () => {
    // In a real app, this would save to the database
    console.log('Saving meal:', mealData);
    alert('Meal saved successfully!');
    
    // Reset form
    setMealData({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      fiber: '',
      sugar: '',
      sodium: '',
      prepTime: '',
      servings: '',
      notes: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-teal-200 to-emerald-200 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Add Meal</h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'manual'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('recipe')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'recipe'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              From Recipe
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'scan'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Scan Barcode
            </button>
          </div>
        </div>

        {/* Manual Entry Tab */}
        {activeTab === 'manual' && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Manual Entry</h2>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meal Name</label>
                <input
                  type="text"
                  value={mealData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Grilled Chicken with Rice"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Nutritional Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Calories</label>
                  <input
                    type="number"
                    value={mealData.calories}
                    onChange={(e) => handleInputChange('calories', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Protein (g)</label>
                  <input
                    type="number"
                    value={mealData.protein}
                    onChange={(e) => handleInputChange('protein', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    value={mealData.carbs}
                    onChange={(e) => handleInputChange('carbs', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fat (g)</label>
                  <input
                    type="number"
                    value={mealData.fat}
                    onChange={(e) => handleInputChange('fat', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiber (g)</label>
                  <input
                    type="number"
                    value={mealData.fiber}
                    onChange={(e) => handleInputChange('fiber', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sugar (g)</label>
                  <input
                    type="number"
                    value={mealData.sugar}
                    onChange={(e) => handleInputChange('sugar', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    value={mealData.prepTime}
                    onChange={(e) => handleInputChange('prepTime', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Servings</label>
                  <input
                    type="number"
                    value={mealData.servings}
                    onChange={(e) => handleInputChange('servings', e.target.value)}
                    placeholder="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={mealData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes about this meal..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleSaveMeal}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                Save Meal
              </button>
            </div>
          </div>
        )}

        {/* From Recipe Tab */}
        {activeTab === 'recipe' && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">From Recipe</h2>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search your saved recipes..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-800">Quick Add Options</h3>
                {quickMealOptions.map(meal => (
                  <div key={meal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Utensils className="text-gray-600" size={16} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{meal.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {meal.prepTime} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {meal.servings} serving
                          </span>
                          <span>{meal.calories} cal</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickAdd(meal)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scan Barcode Tab */}
        {activeTab === 'scan' && (
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Scan Barcode</h2>
            
            <div className="text-center py-12">
              <div className="mx-auto w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <Camera className="text-gray-400" size={48} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scan Product Barcode</h3>
              <p className="text-gray-600 mb-6">Point your camera at a product barcode to automatically add nutritional information</p>
              <button className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium">
                Open Camera
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
