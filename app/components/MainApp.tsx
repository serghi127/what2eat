'use client';

import React, { useState } from 'react';
import BottomNavbar from './BottomNavbar';
import Dashboard from './Dashboard';
import RecipeSearch from './RecipeSearch';
import AddMeal from './AddMeal';
import NutritionConsultant from './NutritionConsultant';
import ProfilePage from './ProfilePage';
import { useAuth } from '../contexts/AuthContext';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hideNavbar, setHideNavbar] = useState(false);
  const { user, logout } = useAuth();

  const handleUpdateUser = (updatedUser: any) => {
    // In a real app, this would update the user in the auth context
    console.log('User updated:', updatedUser);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onHideNavbar={setHideNavbar} />;
      case 'recipes':
        return <RecipeSearch />;
      case 'add-meal':
        return <AddMeal />;
      case 'nutrition':
        return <NutritionConsultant />;
      case 'profile':
        return (
          <ProfilePage 
            user={user} 
            onUpdateUser={handleUpdateUser}
            onLogout={logout}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pb-20">
        {renderActiveTab()}
      </div>

      {/* Bottom Navigation */}
      {!hideNavbar && <BottomNavbar activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
}
