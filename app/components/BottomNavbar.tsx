'use client';

import React from 'react';
import { Home, Search, Plus, User, Heart } from 'lucide-react';

interface BottomNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNavbar({ activeTab, onTabChange }: BottomNavbarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'recipes', label: 'Recipes', icon: Search },
    { id: 'add-meal', label: 'Add Meal', icon: Plus },
    { id: 'nutrition', label: 'Nutrition', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                isActive 
                  ? 'text-indigo-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon 
                size={20} 
                className={`mb-1 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}
              />
              <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
