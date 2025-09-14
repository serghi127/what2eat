'use client';

import React, { useState, useEffect } from 'react';
import { UserWithoutPassword } from '../types';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDietaryPrefs } from '../hooks/useDietaryPrefs';

interface UserProfileProps {
  user: UserWithoutPassword;
  onUpdate: (updatedUser: UserWithoutPassword) => void;
}

export default function UserProfile({ user, onUpdate }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    age: user.age || undefined,
    gender: user.gender || undefined,
    height_cm: user.height_cm || undefined,
    weight_kg: user.weight_kg || undefined,
    activity_level: user.activity_level || undefined
  });
  
  const [dietaryData, setDietaryData] = useState({
    restrictions: [] as string[],
    allergies: [] as string[],
    tools: [] as string[]
  });

  const { updateProfile, loading: profileLoading } = useUserProfile();
  const { dietaryPrefs, saveDietaryPrefs, loading: dietaryLoading } = useDietaryPrefs();

  // Sync dietary preferences when they load
  useEffect(() => {
    if (dietaryPrefs) {
      setDietaryData({
        restrictions: dietaryPrefs.restrictions || [],
        allergies: dietaryPrefs.allergies || [],
        tools: dietaryPrefs.tools || []
      });
    }
  }, [dietaryPrefs]);

  const handleInputChange = (field: keyof typeof formData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDietaryChange = (field: keyof typeof dietaryData, value: string[]) => {
    setDietaryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // Update user profile
      const profileUpdate = {
        name: formData.name,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | undefined,
        height_cm: formData.height_cm ? Number(formData.height_cm) : undefined,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : undefined,
        activity_level: formData.activity_level as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' | undefined
      };

      await updateProfile(profileUpdate);

      // Update dietary preferences
      await saveDietaryPrefs({
        restrictions: dietaryData.restrictions,
        allergies: dietaryData.allergies,
        tools: dietaryData.tools
      });

      // Refresh user data
      const response = await fetch('/api/auth/profile', {
        headers: {
          'User-Id': user.id,
        },
      });
      
      if (response.ok) {
        const { user: updatedUser } = await response.json();
        onUpdate(updatedUser);
      }

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email,
      age: user.age || undefined,
      gender: user.gender || undefined,
      height_cm: user.height_cm || undefined,
      weight_kg: user.weight_kg || undefined,
      activity_level: user.activity_level || undefined
    });
    
    if (dietaryPrefs) {
      setDietaryData({
        restrictions: dietaryPrefs.restrictions || [],
        allergies: dietaryPrefs.allergies || [],
        tools: dietaryPrefs.tools || []
      });
    }
    
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-teal-200 to-emerald-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || profileLoading || dietaryLoading}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {loading || profileLoading || dietaryLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="text-gray-900 p-3 bg-white rounded-lg border">
                      {user.name || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 p-3 bg-white rounded-lg border">
                    {user.email}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => handleInputChange('age', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter your age"
                      min="1"
                      max="120"
                    />
                  ) : (
                    <p className="text-gray-900 p-3 bg-white rounded-lg border">
                      {user.age || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value || undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 p-3 bg-white rounded-lg border">
                      {user.gender || 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.height_cm || ''}
                      onChange={(e) => handleInputChange('height_cm', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter your height in cm"
                      min="100"
                      max="250"
                    />
                  ) : (
                    <p className="text-gray-900 p-3 bg-white rounded-lg border">
                      {user.height_cm ? `${user.height_cm} cm` : 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={formData.weight_kg || ''}
                      onChange={(e) => handleInputChange('weight_kg', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Enter your weight in kg"
                      min="20"
                      max="300"
                    />
                  ) : (
                    <p className="text-gray-900 p-3 bg-white rounded-lg border">
                      {user.weight_kg ? `${user.weight_kg} kg` : 'Not provided'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activity Level
                  </label>
                  {isEditing ? (
                    <select
                      value={formData.activity_level || ''}
                      onChange={(e) => handleInputChange('activity_level', e.target.value || undefined)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    >
                      <option value="">Select activity level</option>
                      <option value="sedentary">Sedentary</option>
                      <option value="lightly_active">Lightly Active</option>
                      <option value="moderately_active">Moderately Active</option>
                      <option value="very_active">Very Active</option>
                      <option value="extremely_active">Extremely Active</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 p-3 bg-white rounded-lg border">
                      {user.activity_level || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Dietary Preferences */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Dietary Preferences</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dietary Restrictions
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-carb', 'keto', 'paleo'].map((restriction) => (
                          <label key={restriction} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={dietaryData.restrictions.includes(restriction)}
                              onChange={(e) => {
                                const newRestrictions = e.target.checked
                                  ? [...dietaryData.restrictions, restriction]
                                  : dietaryData.restrictions.filter(r => r !== restriction);
                                handleDietaryChange('restrictions', newRestrictions);
                              }}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{restriction}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {dietaryData.restrictions.map((restriction) => (
                        <span key={restriction} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">
                          {restriction}
                        </span>
                      ))}
                      {dietaryData.restrictions.length === 0 && (
                        <span className="text-gray-500 text-sm">None set</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {['nuts', 'dairy', 'eggs', 'shellfish', 'soy', 'wheat', 'fish', 'sesame'].map((allergy) => (
                          <label key={allergy} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={dietaryData.allergies.includes(allergy)}
                              onChange={(e) => {
                                const newAllergies = e.target.checked
                                  ? [...dietaryData.allergies, allergy]
                                  : dietaryData.allergies.filter(a => a !== allergy);
                                handleDietaryChange('allergies', newAllergies);
                              }}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{allergy}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {dietaryData.allergies.map((allergy) => (
                        <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm capitalize">
                          {allergy}
                        </span>
                      ))}
                      {dietaryData.allergies.length === 0 && (
                        <span className="text-gray-500 text-sm">None set</span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Cooking Tools
                  </label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {['oven', 'stovetop', 'microwave', 'blender', 'food_processor', 'slow_cooker', 'air_fryer', 'grill'].map((tool) => (
                          <label key={tool} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={dietaryData.tools.includes(tool)}
                              onChange={(e) => {
                                const newTools = e.target.checked
                                  ? [...dietaryData.tools, tool]
                                  : dietaryData.tools.filter(t => t !== tool);
                                handleDietaryChange('tools', newTools);
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 capitalize">{tool.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {dietaryData.tools.map((tool) => (
                        <span key={tool} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm capitalize">
                          {tool.replace('_', ' ')}
                        </span>
                      ))}
                      {dietaryData.tools.length === 0 && (
                        <span className="text-gray-500 text-sm">None set</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}