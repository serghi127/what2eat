'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Download, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Leaf,
  Package,
  Star,
  Zap,
  Loader2
} from 'lucide-react';

interface ShoppingItem {
  name: string;
  quantity: string;
  unit: string;
  category: 'essential' | 'pantry_staples' | 'fresh_priority' | 'shelf_stable';
  importance: 'critical' | 'important' | 'optional';
  recipes: string[];
  estimated_cost?: number;
  notes?: string;
  shelf_life_days?: number;
  freshness_priority?: 'high' | 'medium' | 'low';
}

interface ShoppingList {
  essential: ShoppingItem[];
  pantry_staples: ShoppingItem[];
  fresh_priority: ShoppingItem[];
  shelf_stable: ShoppingItem[];
  total_estimated_cost?: number;
  generated_at: string;
}

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealPlanData?: any; // Weekly meal plan data
  userId?: string; // User ID for API calls
}

export default function ShoppingCartModal({ isOpen, onClose, mealPlanData, userId }: ShoppingCartModalProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'essential' | 'pantry_staples' | 'fresh_priority' | 'shelf_stable'>('essential');

  // Generate shopping list when modal opens
  useEffect(() => {
    if (isOpen && mealPlanData) {
      generateShoppingList();
    }
  }, [isOpen, mealPlanData]);

  const generateShoppingList = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user ID from props
      if (!userId) {
        throw new Error('User ID is required to generate shopping list');
      }
      
      const response = await fetch('/api/shopping-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate shopping list');
      }

      const data = await response.json();
      setShoppingList(data.shoppingList);
    } catch (err) {
      console.error('Shopping list generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate shopping list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'essential': return <Star className="w-4 h-4" />;
      case 'pantry_staples': return <Package className="w-4 h-4" />;
      case 'fresh_priority': return <Leaf className="w-4 h-4" />;
      case 'shelf_stable': return <Package className="w-4 h-4" />;
      default: return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'essential': return 'text-red-600 bg-red-50 border-red-200';
      case 'pantry_staples': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fresh_priority': return 'text-green-600 bg-green-50 border-green-200';
      case 'shelf_stable': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceIcon = (importance: string) => {
    switch (importance) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'important': return <Info className="w-4 h-4 text-yellow-500" />;
      case 'optional': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFreshnessColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const exportToJSON = () => {
    if (!shoppingList) return;
    
    const dataStr = JSON.stringify(shoppingList, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopping_list_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!shoppingList) return;
    
    const csvData = [];
    csvData.push(['Category', 'Name', 'Quantity', 'Unit', 'Importance', 'Recipes', 'Shelf Life (days)']);
    
    const allItems = [
      ...shoppingList.essential.map(item => ({ ...item, category: 'Essential' })),
      ...shoppingList.pantry_staples.map(item => ({ ...item, category: 'Pantry Staples' })),
      ...shoppingList.fresh_priority.map(item => ({ ...item, category: 'Fresh Priority' })),
      ...shoppingList.shelf_stable.map(item => ({ ...item, category: 'Shelf Stable' }))
    ];
    
    allItems.forEach(item => {
      csvData.push([
        item.category,
        item.name,
        item.quantity,
        item.unit,
        item.importance,
        item.recipes.join('; '),
        item.shelf_life_days?.toString() || ''
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shopping_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Smart Shopping List</h2>
                <p className="text-sm text-gray-600">AI-generated from your weekly meal plan</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={exportToJSON}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export to JSON"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={exportToCSV}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Export to CSV"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                <p className="text-gray-600">Generating your smart shopping list...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={generateShoppingList}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : shoppingList ? (
            <div className="p-6">
              {/* Category Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {[
                  { key: 'essential', label: 'Essential', count: shoppingList.essential.length },
                  { key: 'pantry_staples', label: 'Pantry', count: shoppingList.pantry_staples.length },
                  { key: 'fresh_priority', label: 'Fresh', count: shoppingList.fresh_priority.length },
                  { key: 'shelf_stable', label: 'Shelf Stable', count: shoppingList.shelf_stable.length }
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-colors ${
                      activeTab === key
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {getCategoryIcon(key)}
                    <span className="font-medium">{label}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Shopping List Items */}
              <div className="space-y-4">
                {shoppingList[activeTab].map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          {getImportanceIcon(item.importance)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="font-medium">
                            {item.quantity} {item.unit}
                          </span>
                          {item.shelf_life_days && (
                            <span className={`px-2 py-1 rounded-full text-xs ${getFreshnessColor(item.freshness_priority || 'medium')}`}>
                              <Clock className="w-3 h-3 inline mr-1" />
                              {item.shelf_life_days} days
                            </span>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Used in:</span> {item.recipes.slice(0, 2).join(', ')}
                          {item.recipes.length > 2 && ` +${item.recipes.length - 2} more`}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 rounded-full">
                          <CheckCircle className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {shoppingList[activeTab].length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No items in this category</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {shoppingList.total_estimated_cost && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Estimated Total Cost:</span>
                    <span className="text-xl font-bold text-green-600">
                      ${shoppingList.total_estimated_cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
