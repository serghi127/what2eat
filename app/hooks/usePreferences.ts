import { useState } from 'react';
import { Preferences } from '../types';

const defaultPreferences: Preferences = {
  dietaryRestrictions: [],
  dislikes: '',
  caloriesGoal: 2000,
  proteinGoal: 150,
  budget: 50,
  timePerDay: 30,
  servings: 2,
  tools: [],
  cravings: []
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  return {
    preferences,
    setPreferences
  };
}