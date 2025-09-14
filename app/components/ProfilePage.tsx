'use client';

import React, { useState, useEffect } from 'react';
import { User, Camera, Settings, Globe, Palette, HelpCircle, LogOut, Edit3, Save, X } from 'lucide-react';
import UserProfile from './UserProfile';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDietaryPrefs } from '../hooks/useDietaryPrefs';

interface ProfilePageProps {
  user: any;
  onUpdateUser: (user: any) => void;
  onLogout: () => void;
}

export default function ProfilePage({ user, onUpdateUser, onLogout }: ProfilePageProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'settings' | 'preferences'>('profile');
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  
  // Editing states
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [isEditingDietaryPrefs, setIsEditingDietaryPrefs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data for basic info
  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: user?.age || undefined,
    gender: user?.gender || undefined,
    height_cm: user?.height_cm || undefined,
    weight_kg: user?.weight_kg || undefined,
    activity_level: user?.activity_level || undefined
  });
  
  // Form data for dietary preferences
  const [dietaryData, setDietaryData] = useState({
    restrictions: [] as string[],
    allergies: [] as string[],
    tools: [] as string[]
  });

  // Hooks
  const { updateProfile, loading: profileLoading } = useUserProfile();
  const { dietaryPrefs, saveDietaryPrefs, loading: dietaryLoading } = useDietaryPrefs();

  // Sync form data with user prop when it changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        age: user.age || undefined,
        gender: user.gender || undefined,
        height_cm: user.height_cm || undefined,
        weight_kg: user.weight_kg || undefined,
        activity_level: user.activity_level || undefined
      });
    }
  }, [user]);

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

  // Handler functions
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

  const handleSaveBasicInfo = async () => {
    setLoading(true);
    setError('');

    try {
      const profileUpdate = {
        name: formData.name,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | undefined,
        height_cm: formData.height_cm ? Number(formData.height_cm) : undefined,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : undefined,
        activity_level: formData.activity_level as 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' | undefined
      };

      await updateProfile(profileUpdate);

      // Refresh user data
      const response = await fetch('/api/auth/profile', {
        headers: {
          'User-Id': user.id,
        },
      });
      
      if (response.ok) {
        const { user: updatedUser } = await response.json();
        onUpdateUser(updatedUser);
      }

      setIsEditingBasicInfo(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDietaryPrefs = async () => {
    setLoading(true);
    setError('');

    try {
      await saveDietaryPrefs({
        restrictions: dietaryData.restrictions,
        allergies: dietaryData.allergies,
        tools: dietaryData.tools
      });

      setIsEditingDietaryPrefs(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBasicInfo = () => {
    setFormData({
      name: user?.name || '',
      age: user?.age || undefined,
      gender: user?.gender || undefined,
      height_cm: user?.height_cm || undefined,
      weight_kg: user?.weight_kg || undefined,
      activity_level: user?.activity_level || undefined
    });
    setIsEditingBasicInfo(false);
    setError('');
  };

  const handleCancelDietaryPrefs = () => {
    if (dietaryPrefs) {
      setDietaryData({
        restrictions: dietaryPrefs.restrictions || [],
        allergies: dietaryPrefs.allergies || [],
        tools: dietaryPrefs.tools || []
      });
    }
    setIsEditingDietaryPrefs(false);
    setError('');
  };

  const settingsOptions = [
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize the app theme and display',
      icon: Palette,
      action: () => console.log('Appearance settings')
    },
    {
      id: 'language',
      title: 'Language & Region',
      description: 'Set your language and regional preferences',
      icon: Globe,
      action: () => console.log('Language settings')
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and contact support',
      icon: HelpCircle,
      action: () => console.log('Help & Support')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-teal-200 to-emerald-200 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile</h1>
          
          {/* Profile Picture Section */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="text-gray-400" size={32} />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-1 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">
                <Camera size={12} />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name || 'User'}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <button 
                onClick={() => setShowProfileEditor(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveSection('profile')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'profile'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile Info
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'settings'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveSection('preferences')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeSection === 'preferences'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Preferences
            </button>
          </div>
        </div>

        {/* Profile Info Section */}
        {activeSection === 'profile' && (
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                {!isEditingBasicInfo ? (
                  <button
                    onClick={() => setIsEditingBasicInfo(true)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelBasicInfo}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveBasicInfo}
                      disabled={loading || profileLoading}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading || profileLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  {isEditingBasicInfo ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user?.email || 'Not set'}</p>
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  {isEditingBasicInfo ? (
                    <input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => handleInputChange('age', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter your age"
                      min="1"
                      max="120"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.age || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  {isEditingBasicInfo ? (
                    <select
                      value={formData.gender || ''}
                      onChange={(e) => handleInputChange('gender', e.target.value || undefined)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{user?.gender || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  {isEditingBasicInfo ? (
                    <input
                      type="number"
                      value={formData.height_cm || ''}
                      onChange={(e) => handleInputChange('height_cm', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter height in cm"
                      min="100"
                      max="250"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.height_cm ? `${user.height_cm} cm` : 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  {isEditingBasicInfo ? (
                    <input
                      type="number"
                      value={formData.weight_kg || ''}
                      onChange={(e) => handleInputChange('weight_kg', e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter weight in kg"
                      min="20"
                      max="300"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.weight_kg ? `${user.weight_kg} kg` : 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Activity Level</label>
                  {isEditingBasicInfo ? (
                    <select
                      value={formData.activity_level || ''}
                      onChange={(e) => handleInputChange('activity_level', e.target.value || undefined)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Select activity level</option>
                      <option value="sedentary">Sedentary</option>
                      <option value="lightly_active">Lightly Active</option>
                      <option value="moderately_active">Moderately Active</option>
                      <option value="very_active">Very Active</option>
                      <option value="extremely_active">Extremely Active</option>
                    </select>
                  ) : (
                    <p className="text-gray-900">{user?.activity_level || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Nutritional Goals */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Nutritional Goals</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{user?.daily_calories_goal || '--'}</div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{user?.protein_goal_g || '--'}</div>
                  <div className="text-sm text-gray-600">Protein (g)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{user?.carbs_goal_g || '--'}</div>
                  <div className="text-sm text-gray-600">Carbs (g)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{user?.fat_goal_g || '--'}</div>
                  <div className="text-sm text-gray-600">Fat (g)</div>
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">47</div>
                  <div className="text-sm text-gray-600">Recipes Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">12</div>
                  <div className="text-sm text-gray-600">Weeks Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">156</div>
                  <div className="text-sm text-gray-600">Meals Logged</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="space-y-4">
            {settingsOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div key={option.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <button
                    onClick={option.action}
                    className="w-full flex items-center gap-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="text-gray-600" size={20} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-gray-900">{option.title}</h3>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                    <Settings className="text-gray-400" size={16} />
                  </button>
                </div>
              );
            })}

            {/* Logout Button */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 hover:bg-red-50 p-2 rounded-lg transition-colors text-red-600"
              >
                <div className="p-2 bg-red-100 rounded-lg">
                  <LogOut className="text-red-600" size={20} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">Sign Out</h3>
                  <p className="text-sm text-red-500">Sign out of your account</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Preferences Section */}
        {activeSection === 'preferences' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Dietary Preferences</h3>
                {!isEditingDietaryPrefs ? (
                  <button
                    onClick={() => setIsEditingDietaryPrefs(true)}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelDietaryPrefs}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDietaryPrefs}
                      disabled={loading || dietaryLoading}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={16} />
                      {loading || dietaryLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
                  {isEditingDietaryPrefs ? (
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
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">{restriction}</span>
                        </label>
                      ))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  {isEditingDietaryPrefs ? (
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Cooking Tools</label>
                  {isEditingDietaryPrefs ? (
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

            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Meal Planning Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meals per Day</label>
                  <p className="text-gray-900">{user?.meals_per_day || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Snacks per Day</label>
                  <p className="text-gray-900">{user?.snacks_per_day || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cooking Skill Level</label>
                  <p className="text-gray-900">{user?.cooking_skill_level || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Preference</label>
                  <p className="text-gray-900">{user?.budget_preference || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Editor Modal */}
        {showProfileEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
                  <button
                    onClick={() => setShowProfileEditor(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="p-4">
                <UserProfile user={user} onUpdate={onUpdateUser} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
