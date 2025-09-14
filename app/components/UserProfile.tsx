'use client';

import React, { useState, useEffect } from 'react';
import { User, UserProfileUpdate } from '../types';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onClose?: () => void;
}

export default function UserProfile({ user, onUpdate, onClose }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(true); // Auto-enter edit mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculationSuccess, setCalculationSuccess] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    dietary_restrictions: false,
    allergies: false,
    disliked_foods: false,
    preferred_cuisines: false
  });
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

  const handleDropdownChange = (field: keyof UserProfileUpdate, value: string) => {
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [field]: []
      }));
    } else if (value === 'none') {
      setFormData(prev => ({
        ...prev,
        [field]: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: [value]
      }));
    }
  };

  const handleCheckboxChange = (field: keyof UserProfileUpdate, value: string, checked: boolean) => {
    const currentArray = formData[field] as string[] || [];
    let newArray: string[];
    
    if (checked) {
      // Add the value if it's not already in the array
      newArray = currentArray.includes(value) ? currentArray : [...currentArray, value];
    } else {
      // Remove the value from the array
      newArray = currentArray.filter(item => item !== value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: newArray
    }));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
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
        onClose?.(); // Close the modal after successful save
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

  // Check if we have enough data to calculate goals
  const canCalculateGoals = () => {
    return formData.age && formData.height_cm && formData.weight_kg && formData.activity_level && formData.gender;
  };

  // Calculate all nutritional goals automatically based on USDA DRI standards
  const calculateAllGoals = () => {
    if (!canCalculateGoals()) return;

    const calories = calculateCalorieGoal();
    if (!calories) return;

    console.log('Calculating goals for calories:', calories); // Debug log

    // Calculate macronutrient goals based on USDA DRI standards
    // Protein: 10-35% of calories (4 calories per gram) - using 25% for optimal health
    const proteinCalories = calories * 0.25;
    const proteinGoal = Math.round(proteinCalories / 4);

    // Carbohydrates: 45-65% of calories (4 calories per gram) - using 55% for balanced diet
    const carbCalories = calories * 0.55;
    const carbGoal = Math.round(carbCalories / 4);

    // Fat: 20-35% of calories (9 calories per gram) - using 20% for heart health
    const fatCalories = calories * 0.20;
    const fatGoal = Math.round(fatCalories / 9);

    // Fiber: Based on USDA recommendations - 14g per 1000 calories for adults
    const fiberGoal = Math.round((calories / 1000) * 14);

    // Sugar: Maximum 10% of calories (4 calories per gram) - WHO recommendation
    const sugarCalories = calories * 0.10;
    const sugarGoal = Math.round(sugarCalories / 4);

    // Sodium: 2300mg per day for adults (USDA general recommendation)
    const sodiumGoal = 2300;

    console.log('Calculated goals:', { proteinGoal, carbGoal, fatGoal, fiberGoal, sugarGoal, sodiumGoal }); // Debug log

    // Update form data with calculated values
    setFormData(prev => {
      const updated = {
        ...prev,
        daily_calories_goal: calories,
        protein_goal_g: proteinGoal,
        carbs_goal_g: carbGoal,
        fat_goal_g: fatGoal,
        fiber_goal_g: fiberGoal,
        sugar_goal_g: sugarGoal,
        sodium_goal_mg: sodiumGoal
      };
      console.log('Updated form data:', updated); // Debug log
      return updated;
    });

    // Show success feedback
    setCalculationSuccess(true);
    setTimeout(() => setCalculationSuccess(false), 3000); // Hide after 3 seconds
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onClose?.()}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
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
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-800">Nutritional Goals</h3>
            <button
              onClick={calculateAllGoals}
              disabled={!canCalculateGoals()}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              title={canCalculateGoals() ? "Calculate goals based on your personal information" : "Fill in age, gender, height, weight, and activity level to enable calculation"}
            >
              Calculate
            </button>
          </div>
          {!canCalculateGoals() && (
            <p className="text-xs text-gray-500 italic">
              Complete your personal information above to enable automatic goal calculation
            </p>
          )}
          {calculationSuccess && (
            <p className="text-xs text-green-600 font-medium">
              ✅ Goals calculated successfully based on USDA DRI standards!
            </p>
          )}
          
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Time</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Weekly Budget</label>
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
        
        <div className="space-y-4">
          {/* Dietary Restrictions */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('dietary_restrictions')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {expandedSections.dietary_restrictions ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-700">Dietary Restrictions</span>
                <span className="text-sm text-gray-500">
                  ({(formData.dietary_restrictions || []).length} selected)
                </span>
              </div>
            </button>
            {expandedSections.dietary_restrictions && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'vegetarian', label: 'Vegetarian' },
                    { value: 'vegan', label: 'Vegan' },
                    { value: 'pescatarian', label: 'Pescatarian' },
                    { value: 'gluten-free', label: 'Gluten-Free' },
                    { value: 'dairy-free', label: 'Dairy-Free' },
                    { value: 'keto', label: 'Keto' },
                    { value: 'paleo', label: 'Paleo' },
                    { value: 'low-carb', label: 'Low-Carb' },
                    { value: 'low-fat', label: 'Low-Fat' },
                    { value: 'mediterranean', label: 'Mediterranean' },
                    { value: 'halal', label: 'Halal' },
                    { value: 'kosher', label: 'Kosher' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.dietary_restrictions || []).includes(option.value)}
                        onChange={(e) => handleCheckboxChange('dietary_restrictions', option.value, e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Allergies */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('allergies')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {expandedSections.allergies ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-700">Allergies</span>
                <span className="text-sm text-gray-500">
                  ({(formData.allergies || []).length} selected)
                </span>
              </div>
            </button>
            {expandedSections.allergies && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'nuts', label: 'Tree Nuts' },
                    { value: 'peanuts', label: 'Peanuts' },
                    { value: 'dairy', label: 'Dairy/Lactose' },
                    { value: 'eggs', label: 'Eggs' },
                    { value: 'shellfish', label: 'Shellfish' },
                    { value: 'fish', label: 'Fish' },
                    { value: 'soy', label: 'Soy' },
                    { value: 'wheat', label: 'Wheat/Gluten' },
                    { value: 'sesame', label: 'Sesame' },
                    { value: 'sulfites', label: 'Sulfites' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.allergies || []).includes(option.value)}
                        onChange={(e) => handleCheckboxChange('allergies', option.value, e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Disliked Foods */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('disliked_foods')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {expandedSections.disliked_foods ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-700">Disliked Foods</span>
                <span className="text-sm text-gray-500">
                  ({(formData.disliked_foods || []).length} selected)
                </span>
              </div>
            </button>
            {expandedSections.disliked_foods && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'mushrooms', label: 'Mushrooms' },
                    { value: 'olives', label: 'Olives' },
                    { value: 'spicy', label: 'Spicy Food' },
                    { value: 'seafood', label: 'Seafood' },
                    { value: 'liver', label: 'Liver/Organ Meats' },
                    { value: 'cilantro', label: 'Cilantro' },
                    { value: 'blue-cheese', label: 'Blue Cheese' },
                    { value: 'anchovies', label: 'Anchovies' },
                    { value: 'capers', label: 'Capers' },
                    { value: 'raw-onions', label: 'Raw Onions' },
                    { value: 'bitter-greens', label: 'Bitter Greens' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.disliked_foods || []).includes(option.value)}
                        onChange={(e) => handleCheckboxChange('disliked_foods', option.value, e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preferred Cuisines */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleSection('preferred_cuisines')}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {expandedSections.preferred_cuisines ? (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                )}
                <span className="font-medium text-gray-700">Preferred Cuisines</span>
                <span className="text-sm text-gray-500">
                  ({(formData.preferred_cuisines || []).length} selected)
                </span>
              </div>
            </button>
            {expandedSections.preferred_cuisines && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { value: 'american', label: 'American' },
                    { value: 'italian', label: 'Italian' },
                    { value: 'mexican', label: 'Mexican' },
                    { value: 'chinese', label: 'Chinese' },
                    { value: 'japanese', label: 'Japanese' },
                    { value: 'thai', label: 'Thai' },
                    { value: 'indian', label: 'Indian' },
                    { value: 'mediterranean', label: 'Mediterranean' },
                    { value: 'french', label: 'French' },
                    { value: 'greek', label: 'Greek' },
                    { value: 'spanish', label: 'Spanish' },
                    { value: 'korean', label: 'Korean' },
                    { value: 'vietnamese', label: 'Vietnamese' },
                    { value: 'middle-eastern', label: 'Middle Eastern' },
                    { value: 'caribbean', label: 'Caribbean' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.preferred_cuisines || []).includes(option.value)}
                        onChange={(e) => handleCheckboxChange('preferred_cuisines', option.value, e.target.checked)}
                        disabled={!isEditing}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
