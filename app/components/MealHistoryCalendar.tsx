import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Users, Star, X } from 'lucide-react';
import { Recipe } from '../types';
import { ALL_RECIPES } from '../constants';

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

interface MealHistoryCalendarProps {
  mealHistory: MealHistoryEntry[];
  onMealClick?: (meal: MealHistoryEntry) => void;
  onDeleteMeal?: (mealId: string) => void;
}

export default function MealHistoryCalendar({ mealHistory, onMealClick, onDeleteMeal }: MealHistoryCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Helper function to get recipe data from recipe ID
  const getRecipeFromId = (recipeId: number): Recipe | null => {
    return ALL_RECIPES.find(recipe => recipe.id === recipeId) || null;
  };
  
  // Get first day of current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  // Get first day of calendar (including previous month's days)
  const firstDayOfCalendar = new Date(firstDayOfMonth);
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfMonth.getDay());
  
  // Generate calendar days
  const calendarDays = [];
  const currentDay = new Date(firstDayOfCalendar);
  
  for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
    calendarDays.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  // Get meals for a specific date
  const getMealsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return mealHistory.filter(meal => meal.date === dateStr);
  };
  
  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };
  
  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'lunch': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dinner': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Handle day click to show popup
  const handleDayClick = (date: Date) => {
    const meals = getMealsForDate(date);
    if (meals.length > 0) {
      setSelectedDate(date);
    }
  };

  // Close popup
  const closePopup = () => {
    setSelectedDate(null);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const meals = getMealsForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={index}
                className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                  !isCurrentMonthDay ? 'bg-gray-50 text-gray-400' : 'bg-white'
                } ${isTodayDate ? 'bg-teal-50' : ''} ${meals.length > 0 ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={() => handleDayClick(date)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isTodayDate ? 'text-teal-600' : isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {date.getDate()}
                </div>
                
                {/* Meals for this day */}
                <div className="space-y-1">
                  {meals.slice(0, 3).map((meal) => (
                    <div
                      key={meal.id}
                      className={`text-xs p-1 rounded border ${getMealTypeColor(meal.meal_type)} relative group`}
                    >
                      {/* Delete button */}
                      {onDeleteMeal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteMeal(meal.id);
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                          title="Delete meal"
                        >
                          <X size={10} />
                        </button>
                      )}
                      
                      {/* Meal content */}
                      <div
                        onClick={() => onMealClick?.(meal)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <div className="truncate">
                          {meal.recipe_name}
                        </div>
                        {meal.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={10} className="text-yellow-500" fill="currentColor" />
                            <span className="text-xs">{meal.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {meals.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{meals.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
          <span>Breakfast</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
          <span>Lunch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
          <span>Dinner</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-teal-600">{mealHistory.length}</div>
          <div className="text-sm text-gray-600">Total Meals</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {mealHistory.filter(meal => meal.completed).length}
          </div>
          <div className="text-sm text-gray-600">Completed</div>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {mealHistory.filter(meal => meal.rating).length > 0 
              ? (mealHistory.reduce((sum, meal) => sum + (meal.rating || 0), 0) / mealHistory.filter(meal => meal.rating).length).toFixed(1)
              : '0'
            }
          </div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </div>
      </div>

      {/* Day Meals Popup */}
      {selectedDate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closePopup}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Popup Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Meals for {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <button
                  onClick={closePopup}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Meals List */}
              <div className="space-y-4">
                {getMealsForDate(selectedDate).map((meal) => (
                  <div
                    key={meal.id}
                    className={`p-4 rounded-lg border ${getMealTypeColor(meal.meal_type)} relative group`}
                  >
                    {/* Delete button */}
                    {onDeleteMeal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteMeal(meal.id);
                        }}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        title="Delete meal"
                      >
                        <X size={12} />
                      </button>
                    )}
                    
                    {/* Meal content */}
                    <div
                      onClick={() => onMealClick?.(meal)}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg capitalize">{meal.meal_type}</h4>
                        {meal.rating && (
                          <div className="flex items-center gap-1">
                            <Star size={16} className="text-yellow-500" fill="currentColor" />
                            <span className="text-sm">{meal.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 font-medium">{meal.recipe_name}</p>
                      {meal.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{meal.notes}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty state */}
              {getMealsForDate(selectedDate).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No meals recorded for this day</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
