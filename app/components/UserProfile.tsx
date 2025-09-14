'use client';

import React, { useState } from 'react';
import { UserWithoutPassword } from '../types';

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
    email: user.email
  });

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    try {
      // Update user profile via API
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      onUpdate(updatedUser.user);
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
      email: user.email
    });
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
                  disabled={loading}
                  className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
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
              </div>
            </div>

            {/* Additional Settings */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Settings</h2>
              <p className="text-gray-600">
                For advanced settings like nutritional goals, dietary preferences, and meal planning options, 
                please use the dedicated sections in the app (Goals, Preferences, etc.).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}