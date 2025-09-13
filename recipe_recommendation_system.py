#!/usr/bin/env python3
"""
Recipe Recommendation System
Main system that matches preferences with existing recipes or generates new ones
"""

import json
import os
from typing import List, Dict, Any, Optional, Tuple
from recipe_database import RecipeDatabase, UserPreferences, RecipeMatcher
from llm_recipe_generator_fallback import LLMRecipeGenerator

class RecipeRecommendationSystem:
    """Main system for recipe recommendations"""
    
    def __init__(self, recipe_db_file="recipe_database.json"):
        self.recipe_db = RecipeDatabase(recipe_db_file)
        self.recipe_matcher = RecipeMatcher(self.recipe_db)
        self.llm_generator = LLMRecipeGenerator()
        self.available_recipes = self._load_available_recipes()
    
    def _load_available_recipes(self) -> List[Dict[str, Any]]:
        """Load all available recipes from various sources"""
        recipes = []
        
        # Load from existing TypeScript files (converted to JSON format)
        recipe_files = [
            "diverse_recipes_sample_20250913_152738.ts",
            "scraped_recipes_direct.ts",
            "quick_recipes_converted_20250913_145330.ts"
        ]
        
        for file_path in recipe_files:
            if os.path.exists(file_path):
                try:
                    # Convert TypeScript to JSON format for processing
                    ts_recipes = self._parse_typescript_recipes(file_path)
                    recipes.extend(ts_recipes)
                except Exception as e:
                    print(f"⚠️  Could not load recipes from {file_path}: {e}")
        
        
        print(f"📚 Loaded {len(recipes)} available recipes")
        return recipes
    
    def _parse_typescript_recipes(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse TypeScript recipe file and convert to JSON format"""
        recipes = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract recipe objects from TypeScript file
            # This is a simplified parser - in production you'd want a proper TS parser
            import re
            
            # Find recipe objects
            recipe_pattern = r'\{[^{}]*"id":\s*(\d+)[^{}]*\}'
            recipe_matches = re.findall(recipe_pattern, content, re.DOTALL)
            
            # For now, return a simplified version
            # In a real implementation, you'd parse the full TypeScript structure
            recipes.append({
                'id': 1,
                'name': 'Sample Recipe',
                'tags': ['vegetarian', 'quick'],
                'ingredients': ['sample ingredient'],
                'steps': ['sample step'],
                'source': 'typescript_file'
            })
            
        except Exception as e:
            print(f"Error parsing {file_path}: {e}")
        
        return recipes
    
    def get_recommendations(self, user_id: str, preferences: UserPreferences, max_recipes: int = 5) -> Dict[str, Any]:
        """Get recipe recommendations for a user based on their preferences"""
        
        # Save user preferences
        self.recipe_db.save_user_preferences(user_id, preferences)
        
        # Find matching recipes
        matches = self.recipe_matcher.match_preferences(preferences, self.available_recipes)
        
        recommendations = {
            'user_id': user_id,
            'preferences': preferences.__dict__,
            'existing_matches': matches[:max_recipes],
            'generated_recipe': None,
            'total_matches': len(matches),
            'recommendation_type': 'existing' if matches else 'generated'
        }
        
        # If no good matches found, generate a new recipe
        if not matches or len(matches) < 2:
            print("🔮 No good matches found, generating new recipe...")
            
            # Use best match as inspiration if available
            inspiration = matches[0] if matches else None
            
            # Generate new recipe
            generated_recipe = self.llm_generator.generate_recipe(preferences, inspiration)
            
            # Don't save generated recipe to database (user-specific)
            recommendations['generated_recipe'] = generated_recipe
            recommendations['recommendation_type'] = 'generated'
        
        return recommendations
    
    
    def get_user_preferences(self, user_id: str) -> Optional[UserPreferences]:
        """Get user's saved preferences"""
        return self.recipe_db.get_user_preferences(user_id)
    
    def get_recipe_by_id(self, recipe_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific recipe by ID"""
        for recipe in self.available_recipes:
            if recipe.get('id') == recipe_id:
                return recipe
        return None
    
    def search_recipes(self, query: str, user_preferences: Optional[UserPreferences] = None) -> List[Dict[str, Any]]:
        """Search recipes by text query"""
        results = []
        query_lower = query.lower()
        
        for recipe in self.available_recipes:
            # Search in name, ingredients, and tags
            searchable_text = f"{recipe.get('name', '')} {' '.join(recipe.get('ingredients', []))} {' '.join(recipe.get('tags', []))}".lower()
            
            if query_lower in searchable_text:
                # Calculate relevance score
                score = 0
                if query_lower in recipe.get('name', '').lower():
                    score += 10
                if query_lower in ' '.join(recipe.get('tags', [])).lower():
                    score += 5
                if query_lower in ' '.join(recipe.get('ingredients', [])).lower():
                    score += 3
                
                recipe['search_score'] = score
                results.append(recipe)
        
        # Sort by relevance score
        results.sort(key=lambda x: x.get('search_score', 0), reverse=True)
        return results

# API-like functions for frontend integration
def get_recommendations_api(user_id: str, preferences_data: Dict[str, Any]) -> Dict[str, Any]:
    """API function to get recipe recommendations"""
    system = RecipeRecommendationSystem()
    
    # Convert preferences data to UserPreferences object
    preferences = UserPreferences(**preferences_data)
    
    return system.get_recommendations(user_id, preferences)


# Example usage and testing
if __name__ == "__main__":
    # Initialize system
    system = RecipeRecommendationSystem()
    
    # Test user
    user_id = "test_user_123"
    
    # Test preferences
    preferences = UserPreferences(
        dietary_restrictions=["vegetarian", "gluten-free"],
        meal_type=["breakfast", "lunch"],
        cooking_time=["quick"],
        cuisine=["italian"],
        ingredients=["eggs", "cheese", "spinach"],
        avoid_ingredients=["meat", "fish", "nuts"]
    )
    
    print("🔍 Testing Recipe Recommendation System")
    print("=" * 50)
    
    # Get recommendations
    recommendations = system.get_recommendations(user_id, preferences, max_recipes=3)
    
    print(f"Recommendation Type: {recommendations['recommendation_type']}")
    print(f"Total Matches: {recommendations['total_matches']}")
    
    if recommendations['existing_matches']:
        print(f"\n📋 Existing Recipe Matches:")
        for i, recipe in enumerate(recommendations['existing_matches'], 1):
            print(f"  {i}. {recipe.get('name', 'Unknown')} (Score: {recipe.get('match_score', 0)})")
    
    if recommendations['generated_recipe']:
        print(f"\n🔮 Generated Recipe:")
        gen_recipe = recommendations['generated_recipe']
        print(f"  Name: {gen_recipe.get('name', 'Unknown')}")
        print(f"  Ingredients: {len(gen_recipe.get('ingredients', []))} items")
        print(f"  Steps: {len(gen_recipe.get('steps', []))} steps")
    
    
    # Test search
    print(f"\n🔍 Testing Search")
    print("-" * 20)
    
    search_results = system.search_recipes("vegetarian", preferences)
    print(f"Found {len(search_results)} recipes matching 'vegetarian'")
