import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Recipe } from '../types';

interface AddToPlanModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToPlan: (recipeId: number, selections: {day: string, mealType: string}[]) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];

export default function AddToPlanModal({ recipe, isOpen, onClose, onAddToPlan }: AddToPlanModalProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<string[]>([]);

  if (!isOpen || !recipe) return null;

  const handleDayToggle = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleMealToggle = (meal: string) => {
    setSelectedMeals(prev => 
      prev.includes(meal) 
        ? prev.filter(m => m !== meal)
        : [...prev, meal]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length > 0 && selectedMeals.length > 0 && recipe) {
      // Create all combinations of selected days and meals
      const selections: {day: string, mealType: string}[] = [];
      selectedDays.forEach(day => {
        selectedMeals.forEach(meal => {
          selections.push({ day, mealType: meal });
        });
      });
      
      onAddToPlan(Number(recipe.id), selections);
      setSelectedDays([]);
      setSelectedMeals([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDays([]);
    setSelectedMeals([]);
    onClose();
  };

  const getTotalSelections = () => {
    return selectedDays.length * selectedMeals.length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add to Meal Plan</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{recipe.name}</h3>
          <p className="text-sm text-gray-600">{recipe.time} min • {recipe.servings} servings • {recipe.calories} cal</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Days Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Days (Multiple allowed)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDayToggle(day)}
                  className={`p-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    selectedDays.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedDays.includes(day) && <Check size={16} />}
                  {day}
                </button>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedDays.join(', ')}
              </p>
            )}
          </div>

          {/* Meals Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Meal Types (Multiple allowed)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MEALS.map((meal) => (
                <button
                  key={meal}
                  type="button"
                  onClick={() => handleMealToggle(meal)}
                  className={`p-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    selectedMeals.includes(meal)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedMeals.includes(meal) && <Check size={16} />}
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </button>
              ))}
            </div>
            {selectedMeals.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Selected: {selectedMeals.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}
              </p>
            )}
          </div>

          {/* Selection Summary */}
          {getTotalSelections() > 0 && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                This will add <strong>{recipe.name}</strong> to <strong>{getTotalSelections()}</strong> meal slot{getTotalSelections() !== 1 ? 's' : ''}:
              </p>
              <div className="mt-2 text-xs text-blue-700">
                {selectedDays.map(day => 
                  selectedMeals.map(meal => 
                    <div key={`${day}-${meal}`} className="mb-1">
                      • {day} {meal.charAt(0).toUpperCase() + meal.slice(1)}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedDays.length === 0 || selectedMeals.length === 0}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add to Plan ({getTotalSelections()})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
