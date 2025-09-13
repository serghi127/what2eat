'use client';

import React, { useState, useEffect } from 'react';
import { User, UserProfileUpdate } from '../types';

interface UserProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
}

export default function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UserProfileUpdate>({
    name: user.name || '',
    age: user.age || undefined,
    gender: user.gender || undefined,
    height_cm: user.height_cm || undefined,
    weight_kg: user.weight_kg || undefined,
    activity_level: user.activity_level || undefined,
    daily_calories_goal: user.daily_calories_goal || undefined,
    protein_goal_g: user.protein_goal_g || undefined,
    carbs_goal_g: user.carbs_goal_g || undefined,
    fat_goal_g: user.fat_goal_g || undefined,
    fiber_goal_g: user.fiber_goal_g || undefined,
    sugar_goal_g: user.sugar_goal_g || undefined,
    sodium_goal_mg: user.sodium_goal_mg || undefined,
    dietary_restrictions: user.dietary_restrictions || [],
    allergies: user.allergies || [],
    disliked_foods: user.disliked_foods || [],
    preferred_cuisines: user.preferred_cuisines || [],
    meals_per_day: user.meals_per_day || 3,
    snacks_per_day: user.snacks_per_day || 2,
    cooking_skill_level: user.cooking_skill_level || 'beginner',
    cooking_time_preference: user.cooking_time_preference || 'moderate',
    budget_preference: user.budget_preference || 'medium',
    notifications_enabled: user.notifications_enabled ?? true,
    timezone: user.timezone || 'UTC',
    language: user.language || 'en'
  });

  const handleInputChange = (field: keyof UserProfileUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: keyof UserProfileUpdate, value: string) => {
    const currentArray = formData[field] as string[] || [];
    const newArray = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user.id.toString()
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onUpdate(data.user);
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (formData.height_cm && formData.weight_kg) {
      const heightM = formData.height_cm / 100;
      return (formData.weight_kg / (heightM * heightM)).toFixed(1);
    }
    return null;
  };

  const calculateCalorieGoal = () => {
    if (formData.age && formData.height_cm && formData.weight_kg && formData.activity_level) {
      // Basic BMR calculation (Mifflin-St Jeor Equation)
      let bmr;
      if (formData.gender === 'male') {
        bmr = 10 * formData.weight_kg + 6.25 * formData.height_cm - 5 * formData.age + 5;
      } else {
        bmr = 10 * formData.weight_kg + 6.25 * formData.height_cm - 5 * formData.age - 161;
      }

      // Activity multipliers
      const activityMultipliers = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
        extremely_active: 1.9
      };

      return Math.round(bmr * activityMultipliers[formData.activity_level]);
    }
    return null;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={formData.age || ''}
              onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={formData.gender || ''}
              onChange={(e) => handleInputChange('gender', e.target.value || undefined)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.height_cm || ''}
                onChange={(e) => handleInputChange('height_cm', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight_kg || ''}
                onChange={(e) => handleInputChange('weight_kg', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          {calculateBMI() && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>BMI:</strong> {calculateBMI()}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
            <select
              value={formData.activity_level || ''}
              onChange={(e) => handleInputChange('activity_level', e.target.value || undefined)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="">Select activity level</option>
              <option value="sedentary">Sedentary (little to no exercise)</option>
              <option value="lightly_active">Lightly Active (light exercise 1-3 days/week)</option>
              <option value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</option>
              <option value="very_active">Very Active (hard exercise 6-7 days/week)</option>
              <option value="extremely_active">Extremely Active (very hard exercise, physical job)</option>
            </select>
          </div>
        </div>

        {/* Nutritional Goals */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Nutritional Goals</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Calories Goal</label>
            <input
              type="number"
              value={formData.daily_calories_goal || ''}
              onChange={(e) => handleInputChange('daily_calories_goal', e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
            {calculateCalorieGoal() && (
              <p className="text-xs text-gray-500 mt-1">
                Suggested: {calculateCalorieGoal()} calories/day
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.protein_goal_g || ''}
                onChange={(e) => handleInputChange('protein_goal_g', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.carbs_goal_g || ''}
                onChange={(e) => handleInputChange('carbs_goal_g', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fat (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.fat_goal_g || ''}
                onChange={(e) => handleInputChange('fat_goal_g', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiber (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.fiber_goal_g || ''}
                onChange={(e) => handleInputChange('fiber_goal_g', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sugar (g)</label>
              <input
                type="number"
                step="0.1"
                value={formData.sugar_goal_g || ''}
                onChange={(e) => handleInputChange('sugar_goal_g', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sodium (mg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.sodium_goal_mg || ''}
                onChange={(e) => handleInputChange('sodium_goal_mg', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Meal Planning Preferences */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Meal Planning Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meals per Day</label>
            <input
              type="number"
              min="1"
              max="6"
              value={formData.meals_per_day || 3}
              onChange={(e) => handleInputChange('meals_per_day', parseInt(e.target.value))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Snacks per Day</label>
            <input
              type="number"
              min="0"
              max="5"
              value={formData.snacks_per_day || 2}
              onChange={(e) => handleInputChange('snacks_per_day', parseInt(e.target.value))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Skill Level</label>
            <select
              value={formData.cooking_skill_level || 'beginner'}
              onChange={(e) => handleInputChange('cooking_skill_level', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Time Preference</label>
            <select
              value={formData.cooking_time_preference || 'moderate'}
              onChange={(e) => handleInputChange('cooking_time_preference', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="quick">Quick (15-30 min)</option>
              <option value="moderate">Moderate (30-60 min)</option>
              <option value="extensive">Extensive (60+ min)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget Preference</label>
            <select
              value={formData.budget_preference || 'medium'}
              onChange={(e) => handleInputChange('budget_preference', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Dietary Preferences</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary Restrictions</label>
            <input
              type="text"
              placeholder="e.g., vegetarian, vegan, gluten-free"
              value={(formData.dietary_restrictions || []).join(', ')}
              onChange={(e) => handleArrayChange('dietary_restrictions', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
            <input
              type="text"
              placeholder="e.g., nuts, dairy, shellfish"
              value={(formData.allergies || []).join(', ')}
              onChange={(e) => handleArrayChange('allergies', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Disliked Foods</label>
            <input
              type="text"
              placeholder="e.g., mushrooms, olives, spicy food"
              value={(formData.disliked_foods || []).join(', ')}
              onChange={(e) => handleArrayChange('disliked_foods', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Cuisines</label>
            <input
              type="text"
              placeholder="e.g., Italian, Asian, Mexican"
              value={(formData.preferred_cuisines || []).join(', ')}
              onChange={(e) => handleArrayChange('preferred_cuisines', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      {isEditing && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
