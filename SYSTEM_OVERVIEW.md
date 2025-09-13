# Recipe Recommendation System

## 🎯 Overview

A complete recipe recommendation system that matches user preferences with existing recipes and generates new ones using LLM when no matches are found. Includes full frontend/backend integration.

## 🏗️ System Architecture

```
Frontend (React/Next.js) ↔ API Endpoints ↔ Recipe Recommendation System
                                    ↓
Recipe Database ← LLM Generator ← Recipe Matcher
```

## 📁 Files Created

### Core System
- `recipe_database.py` - Database for user preferences only
- `llm_recipe_generator_fallback.py` - LLM recipe generation when no matches found
- `recipe_recommendation_system.py` - Main recommendation engine
- `api_endpoints.py` - API endpoints for frontend integration

### Frontend Components
- `frontend_components.tsx` - React components (PreferencesForm, RecipeCard)

### Demo & Testing
- `demo_complete_system.py` - Complete system demonstration

## 🔧 Key Features

### 1. Preference Matching
- ✅ Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- ✅ Meal type preferences (breakfast, lunch, dinner, etc.)
- ✅ Cooking time preferences (quick, moderate, slow)
- ✅ Cuisine preferences (italian, mexican, asian, etc.)
- ✅ Preferred ingredients
- ✅ Ingredients to avoid
- ✅ Scoring algorithm for recipe matching

### 2. LLM Fallback Generation
- ✅ Generates new recipes when no matches found
- ✅ Uses OpenAI GPT-4o-mini for recipe generation
- ✅ Fallback system when LLM is unavailable
- ✅ Returns generated recipes without saving (user-specific)
- ✅ Uses existing recipes as inspiration

### 3. API Endpoints
- ✅ `POST /api/get-recommendations` - Get recipe recommendations
- ✅ `GET /api/search` - Search recipes
- ✅ `GET /api/recipe` - Get specific recipe

## 🎨 Frontend Components


### PreferencesForm
```tsx
<PreferencesForm
  userId={userId}
  onSubmit={handlePreferencesSubmit}
  initialPreferences={savedPreferences}
/>
```

### RecipeCard
```tsx
<RecipeCard
  recipe={recipe}
/>
```

## 🔄 User Flow

1. **User sets preferences** - Dietary restrictions, meal types, cooking time, etc.
2. **System searches existing recipes** - Matches preferences with available recipes
3. **If matches found** - Returns existing recipes sorted by match score
4. **If no good matches** - LLM generates new recipe based on preferences
5. **Generated recipes are returned** - New recipes are provided but not saved (user-specific)
6. **Search functionality** - Users can search for specific recipes

## 📊 Data Structures

### UserPreferences
```python
@dataclass
class UserPreferences:
    dietary_restrictions: List[str]
    meal_type: List[str]
    cooking_time: List[str]
    cuisine: List[str]
    ingredients: List[str]
    avoid_ingredients: List[str]
```

### Recipe
```typescript
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
```

## 🚀 Usage Examples

### Get Recommendations
```python
system = RecipeRecommendationSystem()
preferences = UserPreferences(
    dietary_restrictions=["vegetarian"],
    meal_type=["breakfast"],
    cooking_time=["quick"]
)
recommendations = system.get_recommendations(user_id, preferences)
```

### Toggle Favorite
```python
system.add_favorite(user_id, recipe_id, recipe_name, "Love this!")
system.remove_favorite(user_id, recipe_id)
```

### API Usage
```javascript
// Get recommendations
const response = await fetch('/api/get-recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, preferences })
});

// Toggle favorite
const response = await fetch('/api/toggle-favorite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId, recipeId, recipeName })
});
```

## 🔧 Setup Requirements

### Python Dependencies
```bash
pip install openai beautifulsoup4 requests
```

### Environment Variables
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Next.js API Routes
Create the following API routes in your `app/api/` directory:
- `app/api/get-recommendations/route.ts`
- `app/api/toggle-favorite/route.ts`
- `app/api/favorites/route.ts`
- `app/api/search/route.ts`
- `app/api/recipe/route.ts`

## 📈 Benefits

1. **Personalized Recommendations** - Matches user preferences exactly
2. **Intelligent Fallback** - Generates new recipes when needed
3. **User Engagement** - Favorites system encourages interaction
4. **Scalable** - Can handle growing recipe database
5. **Flexible** - Easy to add new preference types
6. **Persistent** - User data saved across sessions

## 🎯 Next Steps

1. **Integrate with existing recipe database** - Connect with your TypeScript recipe files
2. **Add user authentication** - Implement proper user management
3. **Enhance LLM prompts** - Improve recipe generation quality
4. **Add recipe ratings** - Let users rate recipes
5. **Implement meal planning** - Plan weekly menus
6. **Add shopping lists** - Generate ingredient lists

## 🧪 Testing

Run the complete system demo:
```bash
python demo_complete_system.py
```

This will test all features including:
- Preference matching
- LLM recipe generation
- Favorites system
- API endpoints
- Search functionality

The system is ready for frontend integration! 🎉
