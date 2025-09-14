// app/page.tsx
'use client';

import React from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import MainApp from './components/MainApp';

export default function MealPlannerApp() {
  return (
    <ProtectedRoute>
      <MainApp />
    </ProtectedRoute>
  );
}
