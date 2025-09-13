// components/Settings.tsx
'use client';

import React from 'react';
import { ChevronLeft, Users } from 'lucide-react';
import { Preferences } from '../types';

interface SettingsProps {
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
  onNavigateToMealPlan: () => void;
  onRegeneratePlan: () => void;
}

export default function Settings({ 
  preferences, 
  setPreferences, 
  onNavigateToMealPlan, 
  onRegeneratePlan 
}: SettingsProps) {
  const updateField = (field: keyof Preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleRegeneratePlan = () => {
    onRegeneratePlan();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onNavigateToMealPlan}
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
                  onChange={(e) => updateField('caloriesGoal', parseInt(e.target.value))}
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
                  onChange={(e) => updateField('proteinGoal', parseInt(e.target.value))}
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
                  onChange={(e) => updateField('servings', parseInt(e.target.value))}
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
              onClick={handleRegeneratePlan}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Regenerate Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}