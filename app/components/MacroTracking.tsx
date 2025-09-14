'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, X, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useGoals } from '../hooks/useGoals';
import { useDailyProgress } from '../hooks/useDailyProgress';

interface Macro {
  id: string;
  name: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
}

interface MacroTrackingProps {
  userMacros?: Macro[];
  onUpdateMacros?: (macros: Macro[]) => void;
}

export default function MacroTracking({ userMacros, onUpdateMacros }: MacroTrackingProps) {
  const { user } = useAuth();
  const { goals, loading: goalsLoading, updateGoals } = useGoals(user);
  const { progress, loading: progressLoading, refreshProgress } = useDailyProgress(user?.id || null);
  const [isEditing, setIsEditing] = useState(false);
  const [macros, setMacros] = useState<Macro[]>([]);

  // Convert goals from Supabase to Macro format
  useEffect(() => {
    const macroList: Macro[] = [
      { 
        id: 'calories', 
        name: 'Calories', 
        current: progress?.calories || 0, // Use daily progress data
        goal: goals.calories, 
        unit: 'kcal', 
        color: 'bg-sky-500' 
      },
      { 
        id: 'protein', 
        name: 'Protein', 
        current: progress?.protein || 0, // Use daily progress data
        goal: goals.protein || 150, 
        unit: 'g', 
        color: 'bg-emerald-500' 
      },
      { 
        id: 'carbs', 
        name: 'Carbs', 
        current: progress?.carbs || 0, // Use daily progress data
        goal: goals.carbs || 250, 
        unit: 'g', 
        color: 'bg-teal-500' 
      },
      { 
        id: 'fat', 
        name: 'Fat', 
        current: progress?.fat || 0, // Use daily progress data
        goal: goals.fat || 65, 
        unit: 'g', 
        color: 'bg-cyan-500' 
      },
      { 
        id: 'fiber', 
        name: 'Fiber', 
        current: progress?.fiber || 0, // Use daily progress data
        goal: goals.fiber || 25, 
        unit: 'g', 
        color: 'bg-green-500' 
      },
      { 
        id: 'sugar', 
        name: 'Sugar', 
        current: progress?.sugar || 0, // Use daily progress data
        goal: goals.sugar || 50, 
        unit: 'g', 
        color: 'bg-yellow-500' 
      },
      { 
        id: 'cholesterol', 
        name: 'Cholesterol',
        current: progress?.cholesterol || 0, // Use daily progress data
        goal: goals.cholesterol || 300, 
        unit: 'mg', 
        color: 'bg-orange-500' 
      }
    ];

    // Filter out macros with no goals set
    const activeMacros = macroList.filter(macro => macro.goal > 0);
    setMacros(activeMacros);
  }, [progress, goals]); // Add progress and goals to dependency array, [goals, progress]);

  const handleUpdateMacros = async () => {
    // Update goals in Supabase
    const goalsToUpdate: any = {};
    macros.forEach(macro => {
      if (macro.id === 'calories') goalsToUpdate.calories = macro.goal;
      if (macro.id === 'protein') goalsToUpdate.protein = macro.goal;
      if (macro.id === 'carbs') goalsToUpdate.carbs = macro.goal;
      if (macro.id === 'fat') goalsToUpdate.fat = macro.goal;
      if (macro.id === 'fiber') goalsToUpdate.fiber = macro.goal;
      if (macro.id === 'sugar') goalsToUpdate.sugar = macro.goal;
      if (macro.id === 'cholesterol') goalsToUpdate.cholesterol = macro.goal;
    });

    await updateGoals(goalsToUpdate);
    
    // Also call the legacy callback if provided
    if (onUpdateMacros) {
      onUpdateMacros(macros);
    }
    
    setIsEditing(false);
  };

  const addMacro = () => {
    const newMacro: Macro = {
      id: `macro-${Date.now()}`,
      name: 'New Macro',
      current: 0,
      goal: 100,
      unit: 'g',
      color: 'bg-gray-500'
    };
    setMacros([...macros, newMacro]);
  };

  const removeMacro = (id: string) => {
    setMacros(macros.filter(macro => macro.id !== id));
  };

  const updateMacro = (id: string, field: keyof Macro, value: any) => {
    setMacros(macros.map(macro => 
      macro.id === id ? { ...macro, [field]: value } : macro
    ));
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressBarSegments = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    const segments = [];
    
    // Red segment (0-60%)
    const redWidth = Math.min(percentage, 60);
    if (redWidth > 0) {
      segments.push({
        width: redWidth,
        color: 'bg-red-400',
        className: 'rounded-l-full'
      });
    }
    
    // Yellow segment (60-90%)
    if (percentage > 60) {
      const yellowWidth = Math.min(percentage - 60, 30);
      if (yellowWidth > 0) {
        segments.push({
          width: yellowWidth,
          color: 'bg-yellow-400',
          className: redWidth === 0 ? 'rounded-l-full' : ''
        });
      }
    }
    
    // Green segment (90-100%)
    if (percentage > 90) {
      const greenWidth = Math.min(percentage - 90, 10);
      if (greenWidth > 0) {
        segments.push({
          width: greenWidth,
          color: 'bg-green-400',
          className: redWidth === 0 && percentage <= 90 ? 'rounded-l-full' : ''
        });
      }
    }
    
    // Over-goal segments (100%+)
    if (percentage > 100) {
      const overGoalTotal = Math.min(percentage - 100, 25); // Show up to 25% over goal
      
      if (overGoalTotal > 0) {
        // Green segment for moderate over-goal (100-110%)
        const greenOverGoal = Math.min(overGoalTotal, 10);
        if (greenOverGoal > 0) {
          segments.push({
            width: greenOverGoal,
            color: 'bg-green-600',
            className: ''
          });
        }
        
        // Red segment for excessive over-goal (110%+)
        if (overGoalTotal > 10) {
          const redOverGoal = overGoalTotal - 10;
          segments.push({
            width: redOverGoal,
            color: 'bg-red-600',
            className: ''
          });
        }
      }
    }
    
    return segments;
  };

  if (goalsLoading || progressLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          <span className="ml-2 text-gray-600">Loading goals...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Daily Macro Progress</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 px-3 py-1 text-sm text-teal-600 hover:text-teal-800 transition-colors"
        >
          <Edit3 size={16} />
          {isEditing ? 'Save' : 'Edit Goals'}
        </button>
      </div>
      

      <div className="space-y-3">
        {macros.map((macro) => (
          <div key={macro.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{macro.name}</span>
                {isEditing && (
                  <button
                    onClick={() => removeMacro(macro.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {macro.current} / {macro.goal} {macro.unit}
              </div>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Current</label>
                  <input
                    type="number"
                    value={macro.current}
                    readOnly
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded bg-gray-50 text-gray-600"
                  />
                  <div className="text-xs text-gray-400 mt-1">Auto-updated from meals</div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Goal</label>
                  <input
                    type="number"
                    value={macro.goal}
                    onChange={(e) => updateMacro(macro.id, 'goal', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={macro.name}
                    onChange={(e) => updateMacro(macro.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Unit</label>
                  <input
                    type="text"
                    value={macro.unit}
                    onChange={(e) => updateMacro(macro.id, 'unit', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Enhanced Progress Bar */}
                <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                  {/* Goal marker line */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-600 z-10"
                    style={{ left: '75%' }}
                  ></div>
                  
                  {/* Progress segments */}
                  <div className="flex h-full">
                    {getProgressBarSegments(macro.current, macro.goal).map((segment, index) => (
                      <div
                        key={index}
                        className={`h-full ${segment.color} ${segment.className} ${
                          index === getProgressBarSegments(macro.current, macro.goal).length - 1 ? 'rounded-r-full' : ''
                        } transition-all duration-500`}
                        style={{ width: `${segment.width}%` }}
                      ></div>
                    ))}
                  </div>
                  
                  {/* Goal text overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700 bg-white px-1 rounded">
                      {macro.goal} {macro.unit}
                    </span>
                  </div>
                </div>
                
                {/* Progress info */}
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500">
                    {macro.current} / {macro.goal} {macro.unit}
                  </div>
                  {macro.current > macro.goal && (
                    <div className="text-xs text-red-600 font-medium">
                      Over goal
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isEditing && (
          <button
            onClick={addMacro}
            className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
          >
            <Plus size={16} />
            Add Macro
          </button>
        )}

        {isEditing && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleUpdateMacros}
              className="flex-1 bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
