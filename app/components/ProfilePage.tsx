'use client';

import React, { useState } from 'react';
import { User, Camera, Settings, Bell, Globe, Palette, Shield, HelpCircle, LogOut } from 'lucide-react';
import UserProfile from './UserProfile';

interface ProfilePageProps {
  user: any;
  onUpdateUser: (user: any) => void;
  onLogout: () => void;
}

export default function ProfilePage({ user, onUpdateUser, onLogout }: ProfilePageProps) {
  const [activeSection, setActiveSection] = useState<'profile' | 'settings' | 'preferences'>('profile');
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const settingsOptions = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
      action: () => console.log('Notifications settings')
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      description: 'Control your privacy settings',
      icon: Shield,
      action: () => console.log('Privacy settings')
    },
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-gray-900">{user?.name || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{user?.email || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <p className="text-gray-900">{user?.age || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <p className="text-gray-900">{user?.gender || 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                  <p className="text-gray-900">{user?.height_cm ? `${user.height_cm} cm` : 'Not set'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <p className="text-gray-900">{user?.weight_kg ? `${user.weight_kg} kg` : 'Not set'}</p>
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Dietary Preferences</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {(user?.dietary_restrictions || []).map((restriction: string) => (
                      <span key={restriction} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {restriction}
                      </span>
                    ))}
                    {(!user?.dietary_restrictions || user.dietary_restrictions.length === 0) && (
                      <span className="text-gray-500 text-sm">None set</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <div className="flex flex-wrap gap-2">
                    {(user?.allergies || []).map((allergy: string) => (
                      <span key={allergy} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {allergy}
                      </span>
                    ))}
                    {(!user?.allergies || user.allergies.length === 0) && (
                      <span className="text-gray-500 text-sm">None set</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Cuisines</label>
                  <div className="flex flex-wrap gap-2">
                    {(user?.preferred_cuisines || []).map((cuisine: string) => (
                      <span key={cuisine} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {cuisine}
                      </span>
                    ))}
                    {(!user?.preferred_cuisines || user.preferred_cuisines.length === 0) && (
                      <span className="text-gray-500 text-sm">None set</span>
                    )}
                  </div>
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
                <UserProfile user={user} onUpdate={onUpdateUser} onClose={() => setShowProfileEditor(false)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
