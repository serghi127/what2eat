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

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from smart_shopping_cart import SmartShoppingCart

class MealPlanToShoppingList:
    """Convert meal plan with recipe IDs to smart shopping list"""
    
    def __init__(self):
        self.recipes_data = {}
        self.load_recipes_from_csv()
    
    def load_recipes_from_csv(self):
        """Load all recipes from the CSV file"""
        print("📖 Loading recipes from CSV...")
        
        try:
            import csv
            
            csv_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'all_recipes.csv')
            
            with open(csv_file, 'r', encoding='utf-8') as f:
                csv_reader = csv.DictReader(f)
                
                for row in csv_reader:
                    recipe_id = int(row['id'])
                    
                    # Parse ingredients from JSON string
                    ingredients = []
                    if row['ingredients']:
                        try:
                            # Handle the JSON string format in CSV
                            ingredients_str = row['ingredients']
                            if ingredients_str.startswith('[') and ingredients_str.endswith(']'):
                                # Parse as JSON array
                                ingredients = json.loads(ingredients_str)
                            else:
                                # Fallback: split by comma
                                ingredients = [ing.strip().strip('"') for ing in ingredients_str.split(',')]
                        except:
                            # If parsing fails, use the raw string
                            ingredients = [row['ingredients']]
                    
                    # Parse steps from JSON string
                    steps = []
                    if row['steps']:
                        try:
                            steps_str = row['steps']
                            if steps_str.startswith('[') and steps_str.endswith(']'):
                                steps = json.loads(steps_str)
                            else:
                                steps = [row['steps']]
                        except:
                            steps = [row['steps']]
                    
                    # Parse tags from JSON string
                    tags = []
                    if row['tags']:
                        try:
                            tags_str = row['tags']
                            if tags_str.startswith('[') and tags_str.endswith(']'):
                                tags = json.loads(tags_str)
                            else:
                                tags = [row['tags']]
                        except:
                            tags = [row['tags']]
                    
                    self.recipes_data[recipe_id] = {
                        'id': recipe_id,
                        'name': row['name'],
                        'time': int(row.get('time', 0)),
                        'servings': int(row.get('servings', 1)),
                        'calories': int(row.get('calories', 0)),
                        'protein': int(row.get('protein', 0)),
                        'carbs': int(row.get('carbs', 0)),
                        'fat': int(row.get('fat', 0)),
                        'sugar': int(row.get('sugar', 0)),
                        'cholesterol': int(row.get('cholesterol', 0)),
                        'fiber': int(row.get('fiber', 0)),
                        'tags': tags,
                        'ingredients': ingredients,
                        'steps': steps,
                        'source': row.get('source', ''),
                        'credits': row.get('credits', '')
                    }
            
            print(f"✅ Loaded {len(self.recipes_data)} recipes from CSV")
            
        except Exception as e:
            print(f"❌ Error loading recipes from CSV: {e}")
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
