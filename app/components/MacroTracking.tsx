'use client';

import React, { useState } from 'react';
import { Edit3, X, Plus } from 'lucide-react';

interface Macro {
  id: string;
  name: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
}

interface MacroTrackingProps {
  userMacros: Macro[];
  onUpdateMacros: (macros: Macro[]) => void;
}

export default function MacroTracking({ userMacros, onUpdateMacros }: MacroTrackingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [macros, setMacros] = useState<Macro[]>(userMacros);

  const defaultMacros: Macro[] = [
    { id: 'calories', name: 'Calories', current: 1200, goal: 2000, unit: 'kcal', color: 'bg-blue-500' },
    { id: 'protein', name: 'Protein', current: 80, goal: 150, unit: 'g', color: 'bg-green-500' },
    { id: 'carbs', name: 'Carbs', current: 120, goal: 250, unit: 'g', color: 'bg-yellow-500' },
    { id: 'fat', name: 'Fat', current: 45, goal: 65, unit: 'g', color: 'bg-red-500' },
    { id: 'fiber', name: 'Fiber', current: 15, goal: 25, unit: 'g', color: 'bg-purple-500' },
    { id: 'sugar', name: 'Sugar', current: 30, goal: 50, unit: 'g', color: 'bg-pink-500' },
    { id: 'cholesterol', name: 'Cholesterol', current: 150, goal: 300, unit: 'mg', color: 'bg-orange-500' }
  ];

  React.useEffect(() => {
    if (macros.length === 0) {
      setMacros(defaultMacros);
    }
  }, []);

  const handleUpdateMacros = () => {
    onUpdateMacros(macros);
    setIsEditing(false);
  };

  const addMacro = () => {
    const newMacro: Macro = {
      id: `macro-${Date.now()}`,
      name: 'New Macro',
      current: 0,
      goal: 100,
      unit: 'g',
      color: 'bg-gray-500'
    };
    setMacros([...macros, newMacro]);
  };

  const removeMacro = (id: string) => {
    setMacros(macros.filter(macro => macro.id !== id));
  };

  const updateMacro = (id: string, field: keyof Macro, value: any) => {
    setMacros(macros.map(macro => 
      macro.id === id ? { ...macro, [field]: value } : macro
    ));
  };

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (current: number, goal: number) => {
    const percentage = (current / goal) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Daily Macro Progress</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          <Edit3 size={16} />
          {isEditing ? 'Save' : 'Edit'}
        </button>
      </div>

      <div className="space-y-3">
        {macros.map((macro) => (
          <div key={macro.id} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{macro.name}</span>
                {isEditing && (
                  <button
                    onClick={() => removeMacro(macro.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {macro.current} / {macro.goal} {macro.unit}
              </div>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Current</label>
                  <input
                    type="number"
                    value={macro.current}
                    onChange={(e) => updateMacro(macro.id, 'current', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Goal</label>
                  <input
                    type="number"
                    value={macro.goal}
                    onChange={(e) => updateMacro(macro.id, 'goal', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={macro.name}
                    onChange={(e) => updateMacro(macro.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Unit</label>
                  <input
                    type="text"
                    value={macro.unit}
                    onChange={(e) => updateMacro(macro.id, 'unit', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${macro.color}`}
                    style={{ width: `${getProgressPercentage(macro.current, macro.goal)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getProgressPercentage(macro.current, macro.goal).toFixed(1)}% of goal
                </div>
              </div>
            )}
          </div>
        ))}

        {isEditing && (
          <button
            onClick={addMacro}
            className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
          >
            <Plus size={16} />
            Add Macro
          </button>
        )}

        {isEditing && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleUpdateMacros}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
