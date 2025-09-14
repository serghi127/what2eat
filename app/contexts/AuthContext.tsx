'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserWithoutPassword } from '../types';

interface AuthContextType {
  user: UserWithoutPassword | null;
  login: (user: UserWithoutPassword) => void;
  logout: () => void;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithoutPassword | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is logged in (from localStorage or session)
    const savedUser = localStorage.getItem('user');
    const savedOnboarding = localStorage.getItem('hasCompletedOnboarding');
    
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    
    if (savedOnboarding) {
      setHasCompletedOnboarding(savedOnboarding === 'true');
    }
    
    setIsLoading(false);
  }, []);

  const login = async (userData: UserWithoutPassword) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Check if user has completed onboarding by looking at their profile data
    // If they have demographic info (age, gender, etc.), they've completed onboarding
    const hasDemographicInfo = userData.age !== null && userData.age !== undefined;
    
    if (hasDemographicInfo) {
      setHasCompletedOnboarding(true);
      localStorage.setItem('hasCompletedOnboarding', 'true');
    } else {
      // Check if they previously completed onboarding
      const savedOnboarding = localStorage.getItem('hasCompletedOnboarding');
      if (savedOnboarding === 'true') {
        setHasCompletedOnboarding(true);
      } else {
        setHasCompletedOnboarding(false);
      }
    }
  };

  const logout = () => {
    setUser(null);
    setHasCompletedOnboarding(false);
    localStorage.removeItem('user');
    localStorage.removeItem('hasCompletedOnboarding');
  };

  const handleSetHasCompletedOnboarding = (completed: boolean) => {
    setHasCompletedOnboarding(completed);
    localStorage.setItem('hasCompletedOnboarding', completed.toString());
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    hasCompletedOnboarding,
    setHasCompletedOnboarding: handleSetHasCompletedOnboarding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
