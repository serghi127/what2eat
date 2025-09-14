'use client';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../components/LoginPage';
import OnboardingWizard from '../components/Onboarding';
import { Preferences } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading, login, updateUser } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>({
    dietaryRestrictions: [],
    mealType: [],
    cookingTime: [],
    course: [],
    cuisine: [],
    ingredients: [],
    dislikes: '',
    caloriesGoal: 2000,
    proteinGoal: 100,
    budget: 80,
    timePerDay: 30,
    servings: 2,
    tools: [],
    specificCravings: ''
  });

  const handleOnboardingComplete = async () => {
    try {
      const response = await fetch('/api/auth/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          preferences
        }),
      });

      const data = await response.json();

      if (response.ok) {
        updateUser(data.user);
      } else {
        console.error('Failed to complete onboarding:', data.error);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={login} />;
  }

  // Check if user needs to complete onboarding
  // Only show onboarding for new users who have profile_completed: 0 (false in MySQL)
  if (user && user.profile_completed === 0) {
    return (
      <OnboardingWizard 
        preferences={preferences}
        setPreferences={setPreferences}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  return <>{children}</>;
}
