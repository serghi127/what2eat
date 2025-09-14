// Frontend Components for Recipe App
// Heart button for favorites and preferences form

import React, { useState, useEffect } from 'react';

// Types
interface Recipe {
  id: number;
  name: string;
  time: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
  image: string | null;
  source: string;
  credits: string;
}

interface UserPreferences {
  dietary_restrictions: string[];
  meal_type: string[];
  cooking_time: string[];
  cuisine: string[];
  ingredients: string[];
  avoid_ingredients: string[];
}


interface PreferencesFormProps {
  userId: string;
  onSubmit: (preferences: UserPreferences) => void;
  initialPreferences?: UserPreferences;
}


// Preferences Form Component
export const PreferencesForm: React.FC<PreferencesFormProps> = ({ 
  userId, 
  onSubmit, 
  initialPreferences 
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietary_restrictions: [],
    meal_type: [],
    cooking_time: [],
    cuisine: [],
    ingredients: [],
    avoid_ingredients: [],
    ...initialPreferences
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleArrayChange = (field: keyof UserPreferences, value: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleStringArrayChange = (field: keyof UserPreferences, value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setPreferences(prev => ({
      ...prev,
      [field]: items
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/get-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          preferences,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        onSubmit(preferences);
        // Handle recommendations display
        console.log('Recommendations:', result.recommendations);
      } else {
        console.error('Failed to get recommendations:', result.error);
      }
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="preferences-form">
      <h2>Your Food Preferences</h2>
      
      {/* Dietary Restrictions */}
      <div className="form-group">
        <label>Dietary Restrictions</label>
        <div className="checkbox-group">
          {['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-carb', 'keto'].map(option => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.dietary_restrictions.includes(option)}
                onChange={(e) => handleArrayChange('dietary_restrictions', option, e.target.checked)}
              />
              <span className="checkbox-text">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Meal Type */}
      <div className="form-group">
        <label>Meal Type</label>
        <div className="checkbox-group">
          {['breakfast', 'lunch', 'dinner', 'snack', 'dessert'].map(option => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.meal_type.includes(option)}
                onChange={(e) => handleArrayChange('meal_type', option, e.target.checked)}
              />
              <span className="checkbox-text">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cooking Time */}
      <div className="form-group">
        <label>Cooking Time</label>
        <div className="checkbox-group">
          {['quick', 'moderate', 'slow', 'weekend-project'].map(option => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.cooking_time.includes(option)}
                onChange={(e) => handleArrayChange('cooking_time', option, e.target.checked)}
              />
              <span className="checkbox-text">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div className="form-group">
        <label>Cuisine</label>
        <div className="checkbox-group">
          {['italian', 'mexican', 'asian', 'indian', 'french', 'mediterranean', 'american'].map(option => (
            <label key={option} className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.cuisine.includes(option)}
                onChange={(e) => handleArrayChange('cuisine', option, e.target.checked)}
              />
              <span className="checkbox-text">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Preferred Ingredients */}
      <div className="form-group">
        <label>Preferred Ingredients (comma-separated)</label>
        <input
          type="text"
          value={preferences.ingredients.join(', ')}
          onChange={(e) => handleStringArrayChange('ingredients', e.target.value)}
          placeholder="e.g., chicken, spinach, cheese, tomatoes"
          className="text-input"
        />
      </div>

      {/* Avoid Ingredients */}
      <div className="form-group">
        <label>Ingredients to Avoid (comma-separated)</label>
        <input
          type="text"
          value={preferences.avoid_ingredients.join(', ')}
          onChange={(e) => handleStringArrayChange('avoid_ingredients', e.target.value)}
          placeholder="e.g., nuts, shellfish, mushrooms"
          className="text-input"
        />
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="submit-button"
      >
        {isSubmitting ? 'Finding Recipes...' : 'Get My Recommendations'}
      </button>
    </form>
  );
};

// Recipe Card Component
export const RecipeCard: React.FC<{
  recipe: Recipe;
}> = ({ recipe }) => {
  return (
    <div className="recipe-card">
      <div className="recipe-header">
        <h3>{recipe.name}</h3>
      </div>
      
      {recipe.image && (
        <img src={recipe.image} alt={recipe.name} className="recipe-image" />
      )}
      
      <div className="recipe-meta">
        <span className="time">⏱️ {recipe.time} min</span>
        <span className="servings">👥 {recipe.servings} servings</span>
        <span className="calories">🔥 {recipe.calories} cal</span>
      </div>
      
      <div className="recipe-tags">
        {recipe.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
      
      <div className="recipe-ingredients">
        <h4>Ingredients:</h4>
        <ul>
          {recipe.ingredients.slice(0, 5).map((ingredient, index) => (
            <li key={index}>{ingredient}</li>
          ))}
          {recipe.ingredients.length > 5 && (
            <li>...and {recipe.ingredients.length - 5} more</li>
          )}
        </ul>
      </div>
    </div>
  );
};

// CSS Styles (add to your global CSS file)
export const styles = `

.preferences-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.checkbox-label:hover {
  background-color: #f5f5f5;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 8px;
}

.text-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.submit-button {
  width: 100%;
  padding: 12px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #c0392b;
}

.submit-button:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}

.recipe-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.recipe-header h3 {
  margin: 0;
  color: #333;
}

.recipe-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 12px;
}

.recipe-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.recipe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.tag {
  background-color: #ecf0f1;
  color: #2c3e50;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.recipe-ingredients h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.recipe-ingredients ul {
  margin: 0;
  padding-left: 16px;
  font-size: 14px;
  color: #666;
}
`;
