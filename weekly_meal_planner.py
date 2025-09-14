#!/usr/bin/env python3
"""
Weekly Meal Planner
Creates personalized weekly meal plans (3 meals per day) from all_recipes.ts
with user preferences including dietary restrictions, calorie/protein goals, and more.
"""

import json
import random
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import os
import sys

# Add the current directory to Python path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from llm_recipe_generator import LLMRecipeGenerator
    from recipe_database import RecipeDatabase
except ImportError:
    print("Warning: LLM recipe generator not available. Will use fallback recipe generation.")
    LLMRecipeGenerator = None
    RecipeDatabase = None

@dataclass
class UserPreferences:
    """User preferences for meal planning"""
    dietary_restrictions: List[str] = None  # vegan, vegetarian, gluten-free, dairy-free, low-carb, halal
    disliked_foods: List[str] = None  # foods to avoid
    preferred_ingredients: List[str] = None  # chicken, beef, pork, seafood, vegetables, cheese, chocolate
    daily_calories: int = 2000  # target daily calories
    daily_protein: int = 150  # target daily protein (grams)
    servings_per_meal: int = 1  # servings per meal
    kitchen_tools: List[str] = None  # oven, air-fryer, instant-pot, grill, blender, food-processor
    specific_cravings: List[str] = None  # cravings to incorporate (1 per day)

class Recipe:
    """Recipe data structure"""
    def __init__(self, data: Dict[str, Any]):
        self.id = data.get('id', 0)
        self.name = data.get('name', '')
        self.time = data.get('time', 0)
        self.servings = data.get('servings', 1)
        self.calories = data.get('calories', 0)
        self.protein = data.get('protein', 0)
        self.carbs = data.get('carbs', 0)
        self.fat = data.get('fat', 0)
        self.sugar = data.get('sugar', 0)
        self.cholesterol = data.get('cholesterol', 0)
        self.fiber = data.get('fiber', 0)
        self.tags = data.get('tags', [])
        self.ingredients = data.get('ingredients', [])
        self.steps = data.get('steps', [])
        self.image = data.get('image')
        self.source = data.get('source', '')
        self.credits = data.get('credits', '')
    
    def get_meal_type(self) -> str:
        """Determine meal type from tags"""
        meal_tags = ['breakfast', 'lunch', 'dinner']
        for tag in self.tags:
            if tag in meal_tags:
                return tag
        return 'dinner'  # default
    
    def is_dietary_compliant(self, restrictions: List[str]) -> bool:
        """Check if recipe meets dietary restrictions"""
        if not restrictions:
            return True
        
        recipe_tags = [tag.lower() for tag in self.tags]
        
        for restriction in restrictions:
            restriction = restriction.lower()
            if restriction == 'vegan':
                if 'vegan' not in recipe_tags and any(ing.lower() in ['meat', 'chicken', 'beef', 'pork', 'fish', 'dairy', 'milk', 'cheese', 'butter', 'eggs'] for ing in self.ingredients):
                    return False
            elif restriction == 'vegetarian':
                if 'vegetarian' not in recipe_tags and any(ing.lower() in ['meat', 'chicken', 'beef', 'pork', 'fish'] for ing in self.ingredients):
                    return False
            elif restriction == 'gluten-free':
                if 'gluten-free' not in recipe_tags and any(ing.lower() in ['flour', 'wheat', 'bread', 'pasta', 'gluten'] for ing in self.ingredients):
                    return False
            elif restriction == 'dairy-free':
                if 'dairy-free' not in recipe_tags and any(ing.lower() in ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'dairy'] for ing in self.ingredients):
                    return False
            elif restriction == 'low-carb':
                if 'low-carb' not in recipe_tags and self.carbs > 20:  # arbitrary threshold
                    return False
            elif restriction == 'halal':
                if any(ing.lower() in ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer'] for ing in self.ingredients):
                    return False
        
        return True
    
    def contains_disliked_foods(self, disliked_foods: List[str]) -> bool:
        """Check if recipe contains disliked foods"""
        if not disliked_foods:
            return False
        
        recipe_text = ' '.join(self.ingredients + [self.name]).lower()
        for food in disliked_foods:
            if food.lower() in recipe_text:
                return True
        return False
    
    def matches_preferred_ingredients(self, preferred_ingredients: List[str]) -> bool:
        """Check if recipe contains preferred ingredients"""
        if not preferred_ingredients:
            return True
        
        recipe_text = ' '.join(self.ingredients + [self.name]).lower()
        for ingredient in preferred_ingredients:
            if ingredient.lower() in recipe_text:
                return True
        return False
    
    def requires_kitchen_tools(self, available_tools: List[str]) -> bool:
        """Check if recipe can be made with available kitchen tools"""
        if not available_tools:
            return True
        
        recipe_text = ' '.join(self.steps + self.ingredients).lower()
        required_tools = []
        
        # Check for tool requirements in steps
        if 'oven' in recipe_text or 'bake' in recipe_text or 'roast' in recipe_text:
            required_tools.append('oven')
        if 'air-fryer' in recipe_text or 'air fry' in recipe_text:
            required_tools.append('air-fryer')
        if 'instant pot' in recipe_text or 'pressure cook' in recipe_text:
            required_tools.append('instant-pot')
        if 'grill' in recipe_text:
            required_tools.append('grill')
        if 'blend' in recipe_text or 'puree' in recipe_text:
            required_tools.append('blender')
        if 'process' in recipe_text or 'chop' in recipe_text:
            required_tools.append('food-processor')
        
        # Check if all required tools are available
        for tool in required_tools:
            if tool not in available_tools:
                return False
        
        return True

class WeeklyMealPlanner:
    """Main meal planning class"""
    
    def __init__(self, recipes_file: str = "all_recipes.ts"):
        self.recipes_file = recipes_file
        self.recipes = []
        self.llm_generator = None
        self.db = None
        
        # Initialize LLM generator if available
        if LLMRecipeGenerator and RecipeDatabase:
            try:
                self.db = RecipeDatabase()
                if self.db.connect():
                    self.llm_generator = LLMRecipeGenerator(self.db)
            except Exception as e:
                print(f"Warning: Could not initialize LLM generator: {e}")
        
        self.load_recipes()
    
    def load_recipes(self):
        """Load recipes from TypeScript file"""
        print("📖 Loading recipes from TypeScript file...")
        import time
        start_time = time.time()
        
        try:
            print(f"   📂 Reading file: {self.recipes_file}")
            file_start = time.time()
            with open(self.recipes_file, 'r', encoding='utf-8') as f:
                content = f.read()
            file_time = time.time() - file_start
            print(f"   ✅ File read in {file_time:.2f} seconds ({len(content)} characters)")
            
            print("   🔍 Parsing recipe data...")
            parse_start = time.time()
            # Better approach - find recipe objects by looking for the start pattern
            # Split by recipe boundaries and extract individual recipes
            recipe_starts = re.finditer(r'\{\s*"id":\s*\d+', content)
            recipes_text = []
            
            for match in recipe_starts:
                start_pos = match.start()
                # Find the matching closing brace by counting braces
                brace_count = 0
                pos = start_pos
                max_search = min(start_pos + 10000, len(content))  # Limit search to prevent infinite loops
                
                while pos < max_search:
                    if content[pos] == '{':
                        brace_count += 1
                    elif content[pos] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            # Found the matching closing brace
                            recipe_text = content[start_pos:pos+1]
                            recipes_text.append(recipe_text)
                            break
                    pos += 1
                
                # If we didn't find a closing brace, skip this recipe
                if brace_count != 0:
                    print(f"   ⚠️  Skipping malformed recipe starting at position {start_pos}")
            
            parse_time = time.time() - parse_start
            print(f"   ✅ Found {len(recipes_text)} recipe objects in {parse_time:.2f} seconds")
            
            parsed_count = 0
            recipe_start = time.time()
            for i, recipe_text in enumerate(recipes_text):
                if i % 10 == 0:  # Progress indicator every 10 recipes (more frequent)
                    elapsed = time.time() - recipe_start
                    print(f"   ⏳ Parsing recipe {i+1}/{len(recipes_text)}... (elapsed: {elapsed:.1f}s)")
                
                try:
                    # Clean up the recipe text to make it valid JSON
                    recipe_text = recipe_text.replace('true', 'true').replace('false', 'false').replace('null', 'null')
                    
                    # Extract key fields using regex
                    id_match = re.search(r'"id":\s*(\d+)', recipe_text)
                    name_match = re.search(r'"name":\s*"([^"]*)"', recipe_text)
                    time_match = re.search(r'"time":\s*(\d+)', recipe_text)
                    servings_match = re.search(r'"servings":\s*(\d+)', recipe_text)
                    calories_match = re.search(r'"calories":\s*(\d+)', recipe_text)
                    protein_match = re.search(r'"protein":\s*(\d+)', recipe_text)
                    carbs_match = re.search(r'"carbs":\s*(\d+)', recipe_text)
                    fat_match = re.search(r'"fat":\s*(\d+)', recipe_text)
                    sugar_match = re.search(r'"sugar":\s*(\d+)', recipe_text)
                    cholesterol_match = re.search(r'"cholesterol":\s*(\d+)', recipe_text)
                    fiber_match = re.search(r'"fiber":\s*(\d+)', recipe_text)
                    
                    # Extract tags
                    tags_match = re.search(r'"tags":\s*\[([^\]]*)\]', recipe_text)
                    tags = []
                    if tags_match:
                        tag_text = tags_match.group(1)
                        tags = [tag.strip().strip('"') for tag in tag_text.split(',')]
                    
                    # Extract ingredients
                    ingredients_match = re.search(r'"ingredients":\s*\[([^\]]*)\]', recipe_text)
                    ingredients = []
                    if ingredients_match:
                        ing_text = ingredients_match.group(1)
                        ingredients = [ing.strip().strip('"') for ing in ing_text.split(',')]
                    
                    # Extract steps
                    steps_match = re.search(r'"steps":\s*\[([^\]]*)\]', recipe_text)
                    steps = []
                    if steps_match:
                        step_text = steps_match.group(1)
                        steps = [step.strip().strip('"') for step in step_text.split(',')]
                    
                    if all([id_match, name_match, time_match, servings_match, calories_match, protein_match]):
                        recipe_data = {
                            'id': int(id_match.group(1)),
                            'name': name_match.group(1),
                            'time': int(time_match.group(1)),
                            'servings': int(servings_match.group(1)),
                            'calories': int(calories_match.group(1)),
                            'protein': int(protein_match.group(1)),
                            'carbs': int(carbs_match.group(1)) if carbs_match else 0,
                            'fat': int(fat_match.group(1)) if fat_match else 0,
                            'sugar': int(sugar_match.group(1)) if sugar_match else 0,
                            'cholesterol': int(cholesterol_match.group(1)) if cholesterol_match else 0,
                            'fiber': int(fiber_match.group(1)) if fiber_match else 0,
                            'tags': tags,
                            'ingredients': ingredients,
                            'steps': steps,
                            'image': None,
                            'source': 'Allrecipes',
                            'credits': 'From all_recipes.ts'
                        }
                        
                        self.recipes.append(Recipe(recipe_data))
                        parsed_count += 1
                
                except Exception as e:
                    continue  # Skip malformed recipes
            
            total_time = time.time() - start_time
            print(f"✅ Successfully loaded {len(self.recipes)} recipes from {self.recipes_file}")
            print(f"   📈 Successfully parsed {parsed_count} out of {len(recipes_text)} recipe objects")
            print(f"   ⏱️  Total loading time: {total_time:.2f} seconds")
            
        except FileNotFoundError:
            print(f"❌ Error: Could not find {self.recipes_file}")
            self.recipes = []
        except Exception as e:
            print(f"❌ Error loading recipes: {e}")
            self.recipes = []
    
    def filter_recipes(self, preferences: UserPreferences, meal_type: str = None) -> List[Recipe]:
        """Filter recipes based on user preferences"""
        import time
        print(f"   🔍 Filtering recipes for {meal_type or 'all meals'}...")
        filter_start = time.time()
        filtered = []
        
        for i, recipe in enumerate(self.recipes):
            if i % 50 == 0 and i > 0:  # Progress indicator every 50 recipes (more frequent)
                elapsed = time.time() - filter_start
                print(f"      ⏳ Checking recipe {i+1}/{len(self.recipes)}... (elapsed: {elapsed:.1f}s)")
            
            # Check dietary restrictions
            if not recipe.is_dietary_compliant(preferences.dietary_restrictions):
                continue
            
            # Check disliked foods
            if recipe.contains_disliked_foods(preferences.disliked_foods):
                continue
            
            # Check kitchen tools
            if not recipe.requires_kitchen_tools(preferences.kitchen_tools):
                continue
            
            # Check meal type if specified
            if meal_type and recipe.get_meal_type() != meal_type:
                continue
            
            # Prefer recipes with preferred ingredients
            if preferences.preferred_ingredients and not recipe.matches_preferred_ingredients(preferences.preferred_ingredients):
                continue
            
            filtered.append(recipe)
        
        filter_time = time.time() - filter_start
        print(f"   ✅ Found {len(filtered)} suitable recipes for {meal_type or 'all meals'} in {filter_time:.2f}s")
        return filtered
    
    def generate_llm_recipe(self, requirements: str, preferences: UserPreferences, meal_type: str) -> Optional[Recipe]:
        """Generate a recipe using LLM if available"""
        if not self.llm_generator:
            print(f"      ⚠️  LLM generator not available, using fallback recipe")
            return None
        
        print(f"      🤖 Generating AI recipe: {requirements}")
        try:
            # Create preferences dict for LLM
            llm_preferences = {
                'dietary_restrictions': preferences.dietary_restrictions or [],
                'meal_type': [meal_type],
                'cooking_time': ['quick', 'medium'],  # Default to reasonable cooking times
                'ingredients': preferences.preferred_ingredients or []
            }
            
            result = self.llm_generator.generate_custom_recipe(requirements, llm_preferences)
            
            if result['success'] and result['recipe']:
                recipe_data = result['recipe']
                
                # Convert LLM recipe to our Recipe format
                llm_recipe = Recipe({
                    'id': len(self.recipes) + 1000,  # Use high ID to avoid conflicts
                    'name': recipe_data['title'],
                    'time': recipe_data.get('cooking_time_minutes', 30),
                    'servings': preferences.servings_per_meal,
                    'calories': 300,  # Default estimate
                    'protein': 20,    # Default estimate
                    'carbs': 30,      # Default estimate
                    'fat': 10,        # Default estimate
                    'sugar': 5,       # Default estimate
                    'cholesterol': 0, # Default estimate
                    'fiber': 5,       # Default estimate
                    'tags': [meal_type] + (preferences.dietary_restrictions or []),
                    'ingredients': recipe_data.get('ingredients', []),
                    'steps': recipe_data.get('instructions', []),
                    'image': None,
                    'source': 'LLM Generated',
                    'credits': f"Generated by LLM for: {requirements}"
                })
                
                print(f"      ✅ Successfully generated AI recipe: {recipe_data['title']}")
                return llm_recipe
            else:
                print(f"      ⚠️  LLM generation failed: {result.get('message', 'Unknown error')}")
        
        except Exception as e:
            print(f"      ❌ Error generating LLM recipe: {e}")
        
        return None
    
    def create_weekly_plan(self, preferences: UserPreferences) -> Dict[str, Any]:
        """Create a weekly meal plan by first planning 7 meals per type, then organizing by day"""
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        meals = ['breakfast', 'lunch', 'dinner']
        
        # Step 1: Plan 7 meals for each meal type
        meal_plans = {}
        used_recipes = set()
        
        for meal_type in meals:
            print(f"\n🍽️  Planning 7 {meal_type} meals...")
            meal_plans[meal_type] = []
            
            # Filter recipes for this meal type
            available_recipes = self.filter_recipes(preferences, meal_type)
            
            # Remove already used recipes
            available_recipes = [r for r in available_recipes if r.id not in used_recipes]
            print(f"   📋 {len(available_recipes)} unique recipes available for {meal_type}")
            
            # Select up to 7 recipes from available recipes
            selected_recipes = []
            for i in range(7):
                print(f"   🎯 Selecting {meal_type} meal {i+1}/7...")
                if available_recipes:
                    selected_recipe = random.choice(available_recipes)
                    selected_recipes.append(selected_recipe)
                    used_recipes.add(selected_recipe.id)
                    available_recipes.remove(selected_recipe)
                    print(f"      ✅ Selected: {selected_recipe.name}")
                else:
                    print(f"      🤖 No more recipes available, generating AI recipe...")
                    # Generate AI recipe if no more available
                    ai_recipe = self.generate_llm_recipe(
                        f"healthy {meal_type} recipe", 
                        preferences, 
                        meal_type
                    )
                    if ai_recipe:
                        ai_recipe.id = 201  # Assign ID 201 for AI-generated recipes
                        selected_recipes.append(ai_recipe)
                        print(f"      ✅ AI recipe generated: {ai_recipe.name}")
                    else:
                        # Fallback if AI generation fails
                        fallback_recipe = Recipe({
                            'id': 201,
                            'name': f"AI-Generated {meal_type.title()}",
                            'time': 30,
                            'servings': preferences.servings_per_meal,
                            'calories': 300,
                            'protein': 20,
                            'carbs': 30,
                            'fat': 10,
                            'sugar': 5,
                            'cholesterol': 0,
                            'fiber': 5,
                            'tags': [meal_type],
                            'ingredients': ['Ingredients to be determined'],
                            'steps': ['Instructions to be generated'],
                            'image': None,
                            'source': 'AI Generated',
                            'credits': f'AI-generated {meal_type} recipe'
                        })
                        selected_recipes.append(fallback_recipe)
                        print(f"      ✅ Fallback recipe created: {fallback_recipe.name}")
            
            meal_plans[meal_type] = selected_recipes
            print(f"   ✅ Completed {meal_type}: {len(selected_recipes)} recipes selected")
        
        # Step 2: Organize meals by day, avoiding consecutive AI-generated meals
        print(f"\n📅 Organizing meals by day...")
        weekly_plan = {}
        ai_recipe_count = 0
        
        for i, day in enumerate(days):
            print(f"   📆 Setting up {day}...")
            daily_plan = {
                'meals': {},
                'total_calories': 0,
                'total_protein': 0,
                'meal_ids': []
            }
            
            for j, meal_type in enumerate(meals):
                # Get the meal for this day and meal type
                meal_recipe = meal_plans[meal_type][i]
                
                # Check if this is an AI-generated recipe
                is_ai_recipe = meal_recipe.id == 201
                
                # If this would be a consecutive AI recipe, try to swap with another meal
                if is_ai_recipe and ai_recipe_count > 0:
                    print(f"      🔄 Avoiding consecutive AI meals, attempting swap...")
                    # Try to find a non-AI recipe from other meal types for this day
                    for other_meal_type in meals:
                        if other_meal_type != meal_type:
                            other_meal_recipe = meal_plans[other_meal_type][i]
                            if other_meal_recipe.id != 201:
                                # Swap the recipes
                                meal_plans[meal_type][i] = other_meal_recipe
                                meal_plans[other_meal_type][i] = meal_recipe
                                meal_recipe = other_meal_recipe
                                is_ai_recipe = False
                                print(f"      ✅ Swapped with {other_meal_type}: {meal_recipe.name}")
                                break
                
                if is_ai_recipe:
                    ai_recipe_count += 1
                else:
                    ai_recipe_count = 0
                
                daily_plan['meals'][meal_type] = {
                    'id': meal_recipe.id,
                    'name': meal_recipe.name,
                    'calories': meal_recipe.calories,
                    'protein': meal_recipe.protein,
                    'time': meal_recipe.time,
                    'ingredients': meal_recipe.ingredients,
                    'steps': meal_recipe.steps,
                    'source': meal_recipe.source,
                    'credits': meal_recipe.credits,
                    'is_ai_generated': is_ai_recipe
                }
                daily_plan['total_calories'] += meal_recipe.calories
                daily_plan['total_protein'] += meal_recipe.protein
                daily_plan['meal_ids'].append(meal_recipe.id)
            
            weekly_plan[day] = daily_plan
            print(f"   ✅ {day} complete: {daily_plan['total_calories']} cal, {daily_plan['total_protein']}g protein")
        
        return weekly_plan, meal_plans
    
    def convert_to_database_format(self, weekly_plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert weekly plan from Recipe objects to recipe IDs for database storage
        
        Args:
            weekly_plan: Dictionary with day names as keys, containing meal data with recipe IDs
        
        Returns:
            Dictionary with capitalized day names as keys, containing recipe IDs for each meal
        """
        db_format = {}
        
        # Day name mapping (ensure proper capitalization)
        day_mapping = {
            "monday": "Monday",
            "tuesday": "Tuesday", 
            "wednesday": "Wednesday",
            "thursday": "Thursday",
            "friday": "Friday",
            "saturday": "Saturday",
            "sunday": "Sunday"
        }
        
        # Iterate through each day in the weekly plan
        for day, daily_plan in weekly_plan.items():
            # Capitalize the day name
            capitalized_day = day_mapping.get(day.lower(), day.title())
            db_format[capitalized_day] = {}
            
            # Extract meal data from the daily plan
            meals = daily_plan.get('meals', {})
            
            # Iterate through each meal type for this day
            for meal_type, meal_data in meals.items():
                if meal_data and 'id' in meal_data:
                    # Extract just the recipe ID from the meal data
                    db_format[capitalized_day][meal_type] = meal_data['id']
                else:
                    # Handle case where no recipe was found for this meal
                    db_format[capitalized_day][meal_type] = None
        
        return db_format
    
    def adjust_nutritional_targets(self, weekly_plan: Dict[str, Any], preferences: UserPreferences) -> Dict[str, Any]:
        """Adjust meals to meet calorie and protein targets"""
        for day, daily_plan in weekly_plan.items():
            current_calories = daily_plan['total_calories']
            current_protein = daily_plan['total_protein']
            
            # Check if we need to adjust (within 50-100 calorie range)
            calorie_diff = current_calories - preferences.daily_calories
            protein_diff = current_protein - preferences.daily_protein
            
            if abs(calorie_diff) > 100:  # Need significant adjustment
                # Try to find a replacement meal
                for meal_name, meal_data in daily_plan['meals'].items():
                    if meal_data['name'].startswith('Meal not found'):
                        continue
                    
                    # Find alternative recipes
                    available_recipes = self.filter_recipes(preferences, meal_name)
                    
                    for alt_recipe in available_recipes:
                        # Calculate new totals with this recipe
                        new_calories = current_calories - meal_data['calories'] + alt_recipe.calories
                        new_protein = current_protein - meal_data['protein'] + alt_recipe.protein
                        
                        # Check if this gets us closer to targets
                        new_calorie_diff = new_calories - preferences.daily_calories
                        new_protein_diff = new_protein - preferences.daily_protein
                        
                        if abs(new_calorie_diff) < abs(calorie_diff) and abs(new_protein_diff) < abs(protein_diff):
                            # Replace the meal
                            daily_plan['meals'][meal_name] = {
                                'name': alt_recipe.name,
                                'calories': alt_recipe.calories,
                                'protein': alt_recipe.protein,
                                'time': alt_recipe.time,
                                'ingredients': alt_recipe.ingredients,
                                'steps': alt_recipe.steps,
                                'source': alt_recipe.source,
                                'credits': alt_recipe.credits
                            }
                            daily_plan['total_calories'] = new_calories
                            daily_plan['total_protein'] = new_protein
                            break
        
        return weekly_plan
    
    def print_weekly_plan(self, weekly_plan: Dict[str, Any], preferences: UserPreferences):
        """Print the weekly meal plan in a readable format"""
        print("\n" + "="*80)
        print("🍽️  WEEKLY MEAL PLAN")
        print("="*80)
        
        print(f"\n📊 NUTRITIONAL TARGETS:")
        print(f"   Daily Calories: {preferences.daily_calories}")
        print(f"   Daily Protein: {preferences.daily_protein}g")
        print(f"   Servings per meal: {preferences.servings_per_meal}")
        
        if preferences.dietary_restrictions:
            print(f"\n🥗 DIETARY RESTRICTIONS: {', '.join(preferences.dietary_restrictions)}")
        
        if preferences.disliked_foods:
            print(f"🚫 DISLIKED FOODS: {', '.join(preferences.disliked_foods)}")
        
        if preferences.preferred_ingredients:
            print(f"❤️  PREFERRED INGREDIENTS: {', '.join(preferences.preferred_ingredients)}")
        
        if preferences.kitchen_tools:
            print(f"🔧 KITCHEN TOOLS: {', '.join(preferences.kitchen_tools)}")
        
        if preferences.specific_cravings:
            print(f"🍯 SPECIFIC CRAVINGS: {', '.join(preferences.specific_cravings)}")
        
        print("\n" + "="*80)
        
        for day, daily_plan in weekly_plan.items():
            print(f"\n📅 {day.upper()}")
            if daily_plan['craving']:
                print(f"   🍯 Craving: {daily_plan['craving']}")
            
            print(f"   📊 Daily Totals: {daily_plan['total_calories']} calories, {daily_plan['total_protein']}g protein")
            
            # Check if targets are met
            calorie_diff = daily_plan['total_calories'] - preferences.daily_calories
            protein_diff = daily_plan['total_protein'] - preferences.daily_protein
            
            if abs(calorie_diff) <= 100:
                print(f"   ✅ Calories: {'+' if calorie_diff >= 0 else ''}{calorie_diff} (target met)")
            else:
                print(f"   ⚠️  Calories: {'+' if calorie_diff >= 0 else ''}{calorie_diff} (target not met)")
            
            if abs(protein_diff) <= 20:
                print(f"   ✅ Protein: {'+' if protein_diff >= 0 else ''}{protein_diff}g (target met)")
            else:
                print(f"   ⚠️  Protein: {'+' if protein_diff >= 0 else ''}{protein_diff}g (target not met)")
            
            print("   " + "-"*60)
            
            for meal_name, meal_data in daily_plan['meals'].items():
                print(f"   🍽️  {meal_name.upper()}: {meal_data['name']}")
                print(f"      ⏱️  Time: {meal_data['time']} min | 🔥 {meal_data['calories']} cal | 💪 {meal_data['protein']}g protein")
                print(f"      📝 Source: {meal_data['source']}")
                
                if meal_data['ingredients']:
                    print(f"      🥘 Ingredients: {', '.join(meal_data['ingredients'][:3])}{'...' if len(meal_data['ingredients']) > 3 else ''}")
        
        print("\n" + "="*80)
        print("✨ Enjoy your personalized weekly meal plan!")
        print("="*80)
    
    def create_ts_output(self, weekly_plan: Dict[str, Any], meal_plans: Dict[str, List[Recipe]], preferences: UserPreferences) -> str:
        """Create TypeScript file with chronological meal listing"""
        print(f"\n📝 Creating TypeScript output file...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"weekly_meal_plan_{timestamp}.ts"
        
        print(f"   📂 Writing to: {filename}")
        ts_content = f"""// Weekly Meal Plan - Generated on {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
// User Preferences: {', '.join(preferences.dietary_restrictions or [])} | {preferences.daily_calories} cal/day | {preferences.daily_protein}g protein/day

export interface MealPlan {{
  id: number;
  name: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  day: string;
  calories: number;
  protein: number;
  time: number;
  ingredients: string[];
  steps: string[];
  source: string;
  credits: string;
  isAiGenerated: boolean;
}}

export const WEEKLY_MEAL_PLAN: MealPlan[] = [
"""
        
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        meals = ['breakfast', 'lunch', 'dinner']
        
        print(f"   📊 Processing {len(days) * len(meals)} meals for TypeScript output...")
        for day in days:
            for meal_type in meals:
                meal_data = weekly_plan[day]['meals'][meal_type]
                ts_content += f"""  {{
    id: {meal_data['id']},
    name: "{meal_data['name'].replace('"', '\\"')}",
    mealType: "{meal_type}",
    day: "{day}",
    calories: {meal_data['calories']},
    protein: {meal_data['protein']},
    time: {meal_data['time']},
    ingredients: {json.dumps(meal_data['ingredients'], ensure_ascii=False)},
    steps: {json.dumps(meal_data['steps'], ensure_ascii=False)},
    source: "{meal_data['source'].replace('"', '\\"')}",
    credits: "{meal_data['credits'].replace('"', '\\"')}",
    isAiGenerated: {str(meal_data['is_ai_generated']).lower()}
  }},
"""
        
        ts_content += "];\n"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(ts_content)
            print(f"   ✅ TypeScript meal plan saved to: {filename}")
            return filename
        except Exception as e:
            print(f"   ❌ Error saving TypeScript meal plan: {e}")
            return None
    
    def create_json_output(self, weekly_plan: Dict[str, Any]) -> str:
        """Create JSON file with 7x3 array of recipe IDs"""
        print(f"\n📊 Creating JSON output file...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"weekly_meal_ids_{timestamp}.json"
        
        print(f"   📂 Writing to: {filename}")
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        meals = ['breakfast', 'lunch', 'dinner']
        
        # Create 7x3 array (7 days, 3 meals per day)
        print(f"   📊 Creating 7x3 meal ID array...")
        meal_ids_array = []
        for day in days:
            day_meals = []
            for meal_type in meals:
                meal_id = weekly_plan[day]['meals'][meal_type]['id']
                day_meals.append(meal_id)
            meal_ids_array.append(day_meals)
        
        json_data = {
            'generated_at': datetime.now().isoformat(),
            'description': '7x3 array of recipe IDs (7 days, 3 meals per day)',
            'format': 'meal_ids[day][meal] where day=0-6 (Mon-Sun), meal=0-2 (breakfast-lunch-dinner)',
            'meal_ids': meal_ids_array,
            'days': days,
            'meals': meals
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False)
            print(f"   ✅ JSON meal IDs saved to: {filename}")
            return filename
        except Exception as e:
            print(f"   ❌ Error saving JSON meal IDs: {e}")
            return None
    
    def save_plan_to_file(self, weekly_plan: Dict[str, Any], preferences: UserPreferences, filename: str = None):
        """Save the meal plan to a JSON file (legacy method)"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"weekly_meal_plan_{timestamp}.json"
        
        plan_data = {
            'generated_at': datetime.now().isoformat(),
            'preferences': {
                'dietary_restrictions': preferences.dietary_restrictions,
                'disliked_foods': preferences.disliked_foods,
                'preferred_ingredients': preferences.preferred_ingredients,
                'daily_calories': preferences.daily_calories,
                'daily_protein': preferences.daily_protein,
                'servings_per_meal': preferences.servings_per_meal,
                'kitchen_tools': preferences.kitchen_tools,
                'specific_cravings': preferences.specific_cravings
            },
            'weekly_plan': weekly_plan
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(plan_data, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Meal plan saved to: {filename}")
        except Exception as e:
            print(f"Error saving meal plan: {e}")

def main():
    """Example usage of the Weekly Meal Planner"""
    import time
    import sys
    
    print("🚀 Starting Weekly Meal Planner...")
    total_start = time.time()
    
    # Initialize the meal planner
    print("🔧 Initializing meal planner...")
    init_start = time.time()
    planner = WeeklyMealPlanner()
    init_time = time.time() - init_start
    print(f"✅ Meal planner initialized in {init_time:.2f} seconds")
    
    if not planner.recipes:
        print("❌ No recipes loaded. Please check the all_recipes.ts file.")
        return
    
    # Example user preferences
    print("⚙️  Setting up user preferences...")
    preferences = UserPreferences(
        dietary_restrictions=['vegetarian'],  # vegan, vegetarian, gluten-free, dairy-free, low-carb, halal
        disliked_foods=['mushrooms', 'olives'],  # foods to avoid
        preferred_ingredients=['vegetables', 'cheese'],  # preferred ingredients (removed chicken for vegetarian)
        daily_calories=2000,  # target daily calories
        daily_protein=120,    # target daily protein (grams)
        servings_per_meal=1,  # servings per meal
        kitchen_tools=['oven', 'stovetop', 'blender'],  # available kitchen tools
        specific_cravings=['pasta', 'pizza', 'soup', 'salad', 'stir-fry', 'sandwich', 'curry']  # one per day
    )
    print("✅ User preferences configured")
    
    print("🍽️  Generating weekly meal plan...")
    print(f"📚 Using {len(planner.recipes)} available recipes")
    
    # Create the weekly plan using new approach
    plan_start = time.time()
    weekly_plan, meal_plans = planner.create_weekly_plan(preferences)
    plan_time = time.time() - plan_start
    print(f"✅ Weekly plan created in {plan_time:.2f} seconds")
    
    # Print the plan
    print("📋 Displaying meal plan...")
    planner.print_weekly_plan(weekly_plan, preferences)
    
    # Create TypeScript output
    print("📝 Creating output files...")
    ts_file = planner.create_ts_output(weekly_plan, meal_plans, preferences)
    
    # Create JSON output with meal IDs
    json_file = planner.create_json_output(weekly_plan)
    
    # Also save detailed plan to JSON (legacy)
    planner.save_plan_to_file(weekly_plan, preferences)
    
    # Close database connection if open
    if planner.db:
        planner.db.close()
    
    total_time = time.time() - total_start
    print(f"\n🎉 Meal planning completed successfully!")
    print(f"⏱️  Total execution time: {total_time:.2f} seconds")
    print(f"📁 Output files created:")
    if ts_file:
        print(f"   📄 TypeScript: {ts_file}")
    if json_file:
        print(f"   📊 JSON IDs: {json_file}")

if __name__ == "__main__":
    main()
