'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Users, DollarSign } from 'lucide-react';
import { Preferences } from '../types';
import { PREFERENCE_MAPPINGS, getPreferenceOptions } from '../constants/preferences';

interface OnboardingWizardProps {
  preferences: Preferences;
  setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
  onComplete: () => void;
}

export default function OnboardingWizard({ preferences, setPreferences, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  // Update functions
  const updateArrayField = (field: keyof Preferences, item: string) => {
    setPreferences(prev => {
      const array = prev[field] as string[];
      return {
        ...prev,
        [field]: array.includes(item)
          ? array.filter(i => i !== item)
          : [...array, item]
      };
    });
  };

  const updateField = (field: keyof Preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
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
            <div 
              className="bg-green-500 h-2 rounded-full transition-all" 
              style={{width: `${(step/totalSteps) * 100}%`}}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Let's personalize your meal plan</h2>
            <p className="text-gray-600">Tell us about your dietary preferences</p>
            
            <div>
              <label className="block text-sm font-medium mb-2">Dietary Restrictions</label>
              <div className="flex flex-wrap gap-2">
                {getPreferenceOptions('dietary_restrictions').map(diet => (
                  <button
                    key={diet}
                    className={`px-4 py-2 rounded-full text-sm ${
                      preferences.dietaryRestrictions.includes(diet)
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => updateArrayField('dietaryRestrictions', diet)}
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
                onChange={(e) => updateField('dislikes', e.target.value)}
              />
            </div>
          </div>
        )}





        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Ingredients & Final Details</h2>
            <p className="text-gray-600">What ingredients do you prefer and final preferences</p>
            
            <div>
              <label className="block text-sm font-medium mb-2">Preferred Ingredients</label>
              <div className="flex flex-wrap gap-2">
                {getPreferenceOptions('ingredients').map(ingredient => (
                  <button
                    key={ingredient}
                    className={`px-4 py-2 rounded-full text-sm ${
                      preferences.ingredients.includes(ingredient)
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    onClick={() => updateArrayField('ingredients', ingredient)}
                  >
                    {ingredient}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium mb-2">Protein (g)</label>
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

            <div>
              <label className="block text-sm font-medium mb-2">Weekly Budget</label>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={preferences.budget}
                  onChange={(e) => updateField('budget', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="w-20 text-right">${preferences.budget}/week</span>
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
                  onChange={(e) => updateField('servings', parseInt(e.target.value))}
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
                    onClick={() => updateArrayField('tools', tool)}
                  >
                    {tool}
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
                onChange={(e) => updateField('specificCravings', e.target.value)}
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
            {step === totalSteps ? 'Complete Setup' : 'Next'}
            {step !== totalSteps && <ChevronRight className="w-4 h-4 ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}
