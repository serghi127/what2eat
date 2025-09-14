'use client';

import React, { useState } from 'react';
import BottomNavbar from './BottomNavbar';
import Dashboard from './Dashboard';
import RecipeSearch from './RecipeSearch';
import AddMeal from './AddMeal';
import NutritionConsultant from './NutritionConsultant';
import ProfilePage from './ProfilePage';
import ShoppingCartComponent from './ShoppingCart';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../hooks/useCart';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hideNavbar, setHideNavbar] = useState(false);
  const { user, logout, updateUser } = useAuth();
  const { cart, setCart, addToCart } = useCart();

  const handleUpdateUser = (updatedUser: any) => {
    updateUser(updatedUser);
    console.log('User updated:', updatedUser);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onHideNavbar={setHideNavbar} cart={cart} setCart={setCart} addToCart={addToCart} />;
      case 'recipes':
        return <RecipeSearch onAddToCart={addToCart} />;
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
        return <Dashboard onHideNavbar={setHideNavbar} cart={cart} setCart={setCart} addToCart={addToCart} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="pb-20">
        {renderActiveTab()}
      </div>

      {/* Bottom Navigation */}
      {!hideNavbar && (
        <BottomNavbar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}
