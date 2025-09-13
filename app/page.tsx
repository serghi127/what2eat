// app/page.tsx or components/MealPlannerApp.tsx
'use client';

import React, { useState } from 'react';
import OnboardingWizard from './components/Onboarding';
import MealPlanGrid from './components/MealPlanGrid';
import ShoppingCartComponent from './components/ShoppingCart';
import Settings from './components/Settings';
import RecipeModal from './components/RecipeModal';
import { useMealPlan } from './hooks/useMealPlan';
import { useCart } from './hooks/useCart';
import { usePreferences } from './hooks/usePreferences';
import { Recipe } from './types';

type AppStep = 'onboarding' | 'mealPlan' | 'cart' | 'settings';

export default function MealPlannerApp() {
  const [currentStep, setCurrentStep] = useState<AppStep>('onboarding');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Custom hooks
  const { preferences, setPreferences } = usePreferences();
  const { mealPlan, generateMealPlan } = useMealPlan();
  const { cart, setCart, addToCart } = useCart();

  // Navigation handlers
  const handleOnboardingComplete = () => {
    generateMealPlan();
    setCurrentStep('mealPlan');
  };

  const handleRegeneratePlan = () => {
    generateMealPlan();
    setCurrentStep('mealPlan');
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'onboarding':
        return (
          <OnboardingWizard
            preferences={preferences}
            setPreferences={setPreferences}
            onComplete={handleOnboardingComplete}
          />
        );
      
      case 'mealPlan':
        return (
          <MealPlanGrid
            mealPlan={mealPlan}
            selectedRecipe={selectedRecipe}
            setSelectedRecipe={setSelectedRecipe}
            cart={cart}
            onAddToCart={addToCart}
            onNavigateToCart={() => setCurrentStep('cart')}
            onNavigateToSettings={() => setCurrentStep('settings')}
          />
        );
      
      case 'cart':
        return (
          <ShoppingCartComponent
            cart={cart}
            setCart={setCart}
            onNavigateToMealPlan={() => setCurrentStep('mealPlan')}
          />
        );
      
      case 'settings':
        return (
          <Settings
            preferences={preferences}
            setPreferences={setPreferences}
            onNavigateToMealPlan={() => setCurrentStep('mealPlan')}
            onRegeneratePlan={handleRegeneratePlan}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="font-sans">
      {renderCurrentStep()}
    </div>
  );
}