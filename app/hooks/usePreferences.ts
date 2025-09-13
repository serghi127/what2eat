import { useState } from 'react';
import { Preferences } from '../types';

const defaultPreferences: Preferences = {
  dietaryRestrictions: [],
  mealType: [],
  cookingTime: [],
  course: [],
  cuisine: [],
  ingredients: [],
  dislikes: '',
  caloriesGoal: 2000,
  proteinGoal: 150,
  budget: 50,
  timePerDay: 30,
  servings: 2,
  tools: [],
  specificCravings: ''
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);

  return {
    preferences,
    setPreferences
  };
}