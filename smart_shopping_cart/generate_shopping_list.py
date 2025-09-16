#!/usr/bin/env python3
"""
Generate Smart Shopping List from Meal Plan

This script takes a meal plan (with recipe IDs) and generates a smart shopping list
by fetching full recipe data and applying the smart shopping cart logic.
"""

import json
import sys
import os
import argparse
from typing import Dict, List, Any, Optional
from datetime import datetime
import requests
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from smart_shopping_cart import SmartShoppingCart

class MealPlanToShoppingList:
    """Convert meal plan with recipe IDs to smart shopping list"""
    
    def __init__(self):
        self.recipes_data = {}
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            print("❌ Supabase credentials not found in environment variables")
            sys.exit(1)
        
        self.load_recipes_from_supabase()
    
    def load_recipes_from_supabase(self):
        """Load all recipes from Supabase"""
        print("📖 Loading recipes from Supabase...")
        
        try:
            # Make request to Supabase to get all recipes
            headers = {
                'apikey': self.supabase_key,
                'Authorization': f'Bearer {self.supabase_key}',
                'Content-Type': 'application/json'
            }
            
            # Get all recipes from the all_recipes table
            url = f"{self.supabase_url}/rest/v1/all_recipes"
            response = requests.get(url, headers=headers)
            
            if response.status_code != 200:
                print(f"❌ Error fetching recipes from Supabase: {response.status_code}")
                print(f"Response: {response.text}")
                sys.exit(1)
            
            recipes = response.json()
            print(f"📊 Fetched {len(recipes)} recipes from Supabase")
            
            for recipe in recipes:
                recipe_id = recipe['id']
                
                # Parse ingredients - handle both JSON string and array formats
                ingredients = []
                if recipe.get('ingredients'):
                    try:
                        if isinstance(recipe['ingredients'], str):
                            if recipe['ingredients'].startswith('[') and recipe['ingredients'].endswith(']'):
                                ingredients = json.loads(recipe['ingredients'])
                            else:
                                ingredients = [recipe['ingredients']]
                        elif isinstance(recipe['ingredients'], list):
                            ingredients = recipe['ingredients']
                    except:
                        ingredients = [str(recipe['ingredients'])]
                
                # Parse steps - handle both JSON string and array formats
                steps = []
                if recipe.get('steps'):
                    try:
                        if isinstance(recipe['steps'], str):
                            if recipe['steps'].startswith('[') and recipe['steps'].endswith(']'):
                                steps = json.loads(recipe['steps'])
                            else:
                                steps = [recipe['steps']]
                        elif isinstance(recipe['steps'], list):
                            steps = recipe['steps']
                    except:
                        steps = [str(recipe['steps'])]
                
                # Parse tags - handle both JSON string and array formats
                tags = []
                if recipe.get('tags'):
                    try:
                        if isinstance(recipe['tags'], str):
                            if recipe['tags'].startswith('[') and recipe['tags'].endswith(']'):
                                tags = json.loads(recipe['tags'])
                            else:
                                tags = [recipe['tags']]
                        elif isinstance(recipe['tags'], list):
                            tags = recipe['tags']
                    except:
                        tags = [str(recipe['tags'])]
                
                self.recipes_data[recipe_id] = {
                    'id': recipe_id,
                    'name': recipe.get('name', ''),
                    'time': int(recipe.get('time', 0)),
                    'servings': int(recipe.get('servings', 1)),
                    'calories': int(recipe.get('calories', 0)),
                    'protein': int(recipe.get('protein', 0)),
                    'carbs': int(recipe.get('carbs', 0)),
                    'fat': int(recipe.get('fat', 0)),
                    'sugar': int(recipe.get('sugar', 0)),
                    'cholesterol': int(recipe.get('cholesterol', 0)),
                    'fiber': int(recipe.get('fiber', 0)),
                    'tags': tags,
                    'ingredients': ingredients,
                    'steps': steps,
                    'source': recipe.get('source', ''),
                    'credits': recipe.get('credits', '')
                }
            
            print(f"✅ Loaded {len(self.recipes_data)} recipes from Supabase")
            
        except Exception as e:
            print(f"❌ Error loading recipes from Supabase: {e}")
            sys.exit(1)
    
    def convert_meal_plan_to_full_data(self, meal_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Convert meal plan with recipe IDs to full recipe data"""
        print("🔄 Converting meal plan to full recipe data...")
        
        full_meal_plan = {}
        
        for day, day_data in meal_plan.items():
            full_meal_plan[day] = {
                'meals': {}
            }
            
            for meal_type, recipe_id in day_data.items():
                if recipe_id and recipe_id in self.recipes_data:
                    recipe = self.recipes_data[recipe_id]
                    full_meal_plan[day]['meals'][meal_type] = {
                        'id': recipe['id'],
                        'name': recipe['name'],
                        'calories': recipe['calories'],
                        'protein': recipe['protein'],
                        'time': recipe['time'],
                        'ingredients': recipe['ingredients'],
                        'steps': recipe['steps'],
                        'source': recipe['source'],
                        'credits': recipe['credits']
                    }
                    print(f"   ✅ {day} {meal_type}: {recipe['name']}")
                else:
                    print(f"   ⚠️  {day} {meal_type}: Recipe ID {recipe_id} not found")
                    full_meal_plan[day]['meals'][meal_type] = {
                        'id': recipe_id,
                        'name': f'Recipe {recipe_id} not found',
                        'calories': 0,
                        'protein': 0,
                        'time': 0,
                        'ingredients': [],
                        'steps': [],
                        'source': 'Unknown',
                        'credits': 'Unknown'
                    }
        
        return full_meal_plan
    
    def generate_shopping_list(self, meal_plan: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Generate smart shopping list from meal plan"""
        print("🛒 Generating smart shopping list...")
        
        # Convert meal plan to full data
        full_meal_plan = self.convert_meal_plan_to_full_data(meal_plan)
        
        # Initialize smart shopping cart
        cart = SmartShoppingCart()
        
        # Generate shopping list
        shopping_list = cart.generate_shopping_list(full_meal_plan)
        
        # Convert to dictionary for JSON serialization
        shopping_list_dict = {
            'essential': [
                {
                    'name': item.name,
                    'quantity': item.quantity,
                    'unit': item.unit,
                    'category': item.category,
                    'importance': item.importance,
                    'recipes': item.recipes,
                    'estimated_cost': item.estimated_cost,
                    'notes': item.notes
                }
                for item in shopping_list.essential
            ],
            'pantry_staples': [
                {
                    'name': item.name,
                    'quantity': item.quantity,
                    'unit': item.unit,
                    'category': item.category,
                    'importance': item.importance,
                    'recipes': item.recipes,
                    'estimated_cost': item.estimated_cost,
                    'notes': item.notes
                }
                for item in shopping_list.pantry_staples
            ],
            'fresh_priority': [
                {
                    'name': item.name,
                    'quantity': item.quantity,
                    'unit': item.unit,
                    'category': item.category,
                    'importance': item.importance,
                    'recipes': item.recipes,
                    'estimated_cost': item.estimated_cost,
                    'notes': item.notes
                }
                for item in shopping_list.fresh_priority
            ],
            'shelf_stable': [
                {
                    'name': item.name,
                    'quantity': item.quantity,
                    'unit': item.unit,
                    'category': item.category,
                    'importance': item.importance,
                    'recipes': item.recipes,
                    'estimated_cost': item.estimated_cost,
                    'notes': item.notes
                }
                for item in shopping_list.shelf_stable
            ],
            'total_estimated_cost': shopping_list.total_estimated_cost,
            'generated_at': shopping_list.generated_at
        }
        
        return shopping_list_dict

def main():
    """Main function with command-line argument support"""
    parser = argparse.ArgumentParser(description='Generate smart shopping list from meal plan')
    parser.add_argument('--meal-plan', required=True, help='Path to meal plan JSON file')
    parser.add_argument('--user-id', required=True, help='User ID')
    parser.add_argument('--output-format', default='json', choices=['json'], help='Output format')
    
    args = parser.parse_args()
    
    try:
        # Load meal plan
        print(f"📖 Loading meal plan from {args.meal_plan}...")
        with open(args.meal_plan, 'r') as f:
            meal_plan = json.load(f)
        
        print(f"✅ Loaded meal plan for user {args.user_id}")
        
        # Initialize converter
        converter = MealPlanToShoppingList()
        
        # Generate shopping list
        shopping_list = converter.generate_shopping_list(meal_plan, args.user_id)
        
        # Save to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"shopping_list_{timestamp}.json"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(shopping_list, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Shopping list saved to: {output_file}")
        print(f"📊 Generated shopping list with:")
        print(f"   - {len(shopping_list['essential'])} essential items")
        print(f"   - {len(shopping_list['pantry_staples'])} pantry staples")
        print(f"   - {len(shopping_list['fresh_priority'])} fresh priority items")
        print(f"   - {len(shopping_list['shelf_stable'])} shelf stable items")
        
        if shopping_list['total_estimated_cost']:
            print(f"   - Estimated total cost: ${shopping_list['total_estimated_cost']:.2f}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
