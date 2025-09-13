#!/usr/bin/env python3
"""
LLM Recipe Generator Fallback
Generates recipes when no existing recipes match user preferences
"""

import os
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
from recipe_database import UserPreferences

# Load environment variables from .env file
load_dotenv()

class LLMRecipeGenerator:
    """Generates recipes using LLM when no matches are found"""
    
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.use_llm = bool(self.openai_api_key)
        
        if self.use_llm:
            try:
                import openai
                self.openai = openai
                self.openai.api_key = self.openai_api_key
                print("✅ OpenAI API key found. LLM recipe generation enabled.")
            except ImportError:
                print("⚠️  OpenAI library not installed. Using fallback recipe generation.")
                self.use_llm = False
        else:
            print("⚠️  OpenAI API key not found. Using fallback recipe generation.")
    
    def generate_recipe(self, preferences: UserPreferences, inspiration_recipe: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate a recipe based on user preferences"""
        
        if self.use_llm:
            return self._generate_with_llm(preferences, inspiration_recipe)
        else:
            return self._generate_fallback(preferences, inspiration_recipe)
    
    def _generate_with_llm(self, preferences: UserPreferences, inspiration_recipe: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate recipe using OpenAI LLM"""
        
        # Build preference description
        preference_text = self._build_preference_text(preferences)
        
        # Build inspiration text if available
        inspiration_text = ""
        if inspiration_recipe:
            inspiration_text = f"""
INSPIRATION RECIPE:
Name: {inspiration_recipe.get('name', 'Unknown')}
Ingredients: {', '.join(inspiration_recipe.get('ingredients', [])[:5])}
Instructions: {inspiration_recipe.get('steps', [''])[0][:200]}...
"""
        
        prompt = f"""
You are a professional chef and recipe developer. Create a complete, original recipe that matches the user's preferences.

USER PREFERENCES:
{preference_text}

{inspiration_text}

Please create a recipe that:
1. Matches ALL the dietary restrictions and preferences
2. Is appropriate for the specified meal type(s)
3. Fits within the cooking time constraints
4. Uses preferred ingredients when possible
5. Avoids any specified ingredients
6. Is practical and achievable for home cooking

Return ONLY a JSON object with this exact format:
{{
  "name": "Recipe Name",
  "time": 30,
  "servings": 4,
  "calories": 400,
  "protein": 20,
  "carbs": 30,
  "fat": 15,
  "sugar": 5,
  "tags": ["tag1", "tag2", "tag3"],
  "ingredients": [
    "1 cup ingredient",
    "2 tbsp ingredient",
    "etc."
  ],
  "steps": [
    "Step 1: Detailed instruction",
    "Step 2: Detailed instruction",
    "etc."
  ],
  "description": "Brief description of the recipe"
}}

Make sure the recipe is creative, delicious, and perfectly matches the user's needs.
"""
        
        try:
            response = self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a professional chef who creates original, delicious recipes that perfectly match user preferences."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1500
            )
            
            # Parse the response
            response_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                recipe_data = json.loads(json_match.group(0))
                
                # Add metadata
                recipe_data['id'] = int(datetime.now().timestamp())
                recipe_data['generated_by'] = 'llm_fallback'
                recipe_data['generated_at'] = datetime.now().isoformat()
                recipe_data['image'] = None
                recipe_data['source'] = 'AI Generated'
                recipe_data['credits'] = f"Generated recipe based on your preferences"
                
                if inspiration_recipe:
                    recipe_data['inspiration_recipe'] = inspiration_recipe.get('name', 'Unknown')
                    recipe_data['original_url'] = inspiration_recipe.get('url', '')
                
                return recipe_data
            else:
                raise ValueError("No JSON found in LLM response")
                
        except Exception as e:
            print(f"⚠️  LLM recipe generation failed: {e}")
            return self._generate_fallback(preferences, inspiration_recipe)
    
    def _generate_fallback(self, preferences: UserPreferences, inspiration_recipe: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Fallback recipe generation when LLM is not available"""
        
        # Generate a simple recipe based on preferences
        meal_type = preferences.meal_type[0] if preferences.meal_type else "dinner"
        dietary_restrictions = preferences.dietary_restrictions
        
        # Base recipe templates
        templates = {
            "breakfast": {
                "name": "Custom Breakfast Bowl",
                "ingredients": ["2 eggs", "1 cup spinach", "1/2 avocado", "1 tbsp olive oil", "salt and pepper"],
                "steps": [
                    "Heat olive oil in a pan over medium heat",
                    "Add spinach and cook until wilted",
                    "Crack eggs into the pan and cook to your preference",
                    "Serve with sliced avocado and season with salt and pepper"
                ],
                "time": 15,
                "calories": 350,
                "protein": 18,
                "carbs": 8,
                "fat": 28,
                "sugar": 2
            },
            "lunch": {
                "name": "Custom Lunch Salad",
                "ingredients": ["2 cups mixed greens", "1/2 cup cherry tomatoes", "1/4 cup nuts", "2 tbsp dressing", "1/4 cup cheese"],
                "steps": [
                    "Wash and dry the mixed greens",
                    "Slice cherry tomatoes in half",
                    "Combine greens, tomatoes, and nuts in a bowl",
                    "Add dressing and toss to combine",
                    "Top with cheese and serve"
                ],
                "time": 10,
                "calories": 280,
                "protein": 12,
                "carbs": 15,
                "fat": 20,
                "sugar": 8
            },
            "dinner": {
                "name": "Custom Dinner Plate",
                "ingredients": ["1 protein source", "1 cup vegetables", "1/2 cup grains", "1 tbsp oil", "herbs and spices"],
                "steps": [
                    "Season protein with herbs and spices",
                    "Heat oil in a pan and cook protein until done",
                    "Steam or roast vegetables until tender",
                    "Cook grains according to package directions",
                    "Plate everything together and serve"
                ],
                "time": 30,
                "calories": 450,
                "protein": 25,
                "carbs": 35,
                "fat": 18,
                "sugar": 5
            }
        }
        
        # Get base template
        base_recipe = templates.get(meal_type, templates["dinner"])
        
        # Modify based on dietary restrictions
        if "vegetarian" in dietary_restrictions:
            base_recipe["name"] = f"Vegetarian {base_recipe['name']}"
            base_recipe["tags"] = ["vegetarian"]
        elif "vegan" in dietary_restrictions:
            base_recipe["name"] = f"Vegan {base_recipe['name']}"
            base_recipe["tags"] = ["vegan"]
            # Remove animal products from ingredients
            base_recipe["ingredients"] = [ing for ing in base_recipe["ingredients"] 
                                        if not any(animal in ing.lower() for animal in ["egg", "cheese", "milk", "butter"])]
        elif "gluten-free" in dietary_restrictions:
            base_recipe["name"] = f"Gluten-Free {base_recipe['name']}"
            base_recipe["tags"] = ["gluten-free"]
        
        # Add meal type and cooking time tags
        base_recipe["tags"] = base_recipe.get("tags", []) + [meal_type]
        if "quick" in preferences.cooking_time:
            base_recipe["tags"].append("quick")
        
        # Add metadata
        base_recipe["id"] = int(datetime.now().timestamp())
        base_recipe["servings"] = 2
        base_recipe["generated_by"] = "fallback_generator"
        base_recipe["generated_at"] = datetime.now().isoformat()
        base_recipe["image"] = None
        base_recipe["source"] = "AI Generated (Fallback)"
        base_recipe["credits"] = f"Generated recipe based on your preferences"
        base_recipe["description"] = f"A custom {meal_type} recipe tailored to your dietary preferences"
        
        if inspiration_recipe:
            base_recipe["inspiration_recipe"] = inspiration_recipe.get('name', 'Unknown')
            base_recipe["original_url"] = inspiration_recipe.get('url', '')
        
        return base_recipe
    
    def _build_preference_text(self, preferences: UserPreferences) -> str:
        """Build a text description of user preferences"""
        text_parts = []
        
        if preferences.dietary_restrictions:
            text_parts.append(f"Dietary Restrictions: {', '.join(preferences.dietary_restrictions)}")
        
        if preferences.meal_type:
            text_parts.append(f"Meal Type: {', '.join(preferences.meal_type)}")
        
        if preferences.cooking_time:
            text_parts.append(f"Cooking Time: {', '.join(preferences.cooking_time)}")
        
        if preferences.cuisine:
            text_parts.append(f"Cuisine: {', '.join(preferences.cuisine)}")
        
        if preferences.ingredients:
            text_parts.append(f"Preferred Ingredients: {', '.join(preferences.ingredients)}")
        
        if preferences.avoid_ingredients:
            text_parts.append(f"Avoid These Ingredients: {', '.join(preferences.avoid_ingredients)}")
        
        return "\n".join(text_parts)

# Example usage
if __name__ == "__main__":
    from recipe_database import UserPreferences
    
    # Test preferences
    preferences = UserPreferences(
        dietary_restrictions=["vegetarian", "gluten-free"],
        meal_type=["breakfast"],
        cooking_time=["quick"],
        ingredients=["eggs", "spinach"],
        avoid_ingredients=["meat", "dairy"]
    )
    
    # Generate recipe
    generator = LLMRecipeGenerator()
    recipe = generator.generate_recipe(preferences)
    
    print("Generated Recipe:")
    print(json.dumps(recipe, indent=2))
