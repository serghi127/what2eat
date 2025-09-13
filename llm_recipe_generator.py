#!/usr/bin/env python3
"""
LLM Recipe Generator
Integrates with the recipe database to provide intelligent recipe suggestions and generation
"""

import os
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from recipe_database import RecipeDatabase

# Load environment variables
load_dotenv()

class LLMRecipeGenerator:
    def __init__(self, db: RecipeDatabase):
        self.db = db
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
    
    def format_recipe_context(self, recipes: List[Dict[str, Any]], max_recipes: int = 3) -> str:
        """Format recipes for LLM context"""
        context_parts = []
        
        for i, recipe in enumerate(recipes[:max_recipes]):
            context_parts.append(f"Recipe {i+1}: {recipe['title']}")
            context_parts.append(f"Description: {recipe.get('description', 'No description')}")
            context_parts.append(f"Ingredients: {', '.join(recipe.get('ingredients', []))}")
            context_parts.append(f"Instructions: {'; '.join(recipe.get('instructions', []))}")
            context_parts.append(f"Tags: {', '.join(recipe.get('detected_tags', []))}")
            context_parts.append(f"Dietary: {', '.join(recipe.get('dietary_tags', []))}")
            context_parts.append(f"Cuisine: {recipe.get('cuisine_type', 'Unknown')}")
            context_parts.append(f"Meal: {recipe.get('meal_type', 'Unknown')}")
            context_parts.append("---")
        
        return "\n".join(context_parts)
    
    def find_inspiration_recipes(self, query: str, preferences: Dict[str, Any] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Find recipes that could inspire new recipe generation"""
        if preferences:
            return self.db.hybrid_search(query, preferences=preferences, limit=limit)
        else:
            return self.db.semantic_search(query, limit)
    
    def generate_recipe_suggestions(self, user_request: str, preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate recipe suggestions based on user request and preferences
        
        This is a placeholder that would integrate with your LLM API
        """
        # Find inspiration recipes
        inspiration_recipes = self.find_inspiration_recipes(user_request, preferences, limit=3)
        
        if not inspiration_recipes:
            return {
                'suggestions': [],
                'message': 'No matching recipes found in database',
                'inspiration_count': 0
            }
        
        # Format context for LLM
        context = self.format_recipe_context(inspiration_recipes)
        
        # This would be where you call your LLM API
        # For now, return structured suggestions based on the inspiration recipes
        
        suggestions = []
        for recipe in inspiration_recipes:
            suggestion = {
                'title': recipe['title'],
                'description': recipe.get('description', '')[:200] + '...' if len(recipe.get('description', '')) > 200 else recipe.get('description', ''),
                'ingredients': recipe.get('ingredients', [])[:5],  # First 5 ingredients
                'cooking_time': recipe.get('cooking_time_minutes'),
                'difficulty': recipe.get('difficulty_level'),
                'cuisine': recipe.get('cuisine_type'),
                'dietary_tags': recipe.get('dietary_tags', []),
                'similarity_score': recipe.get('similarity_score', 0),
                'source': 'database'
            }
            suggestions.append(suggestion)
        
        return {
            'suggestions': suggestions,
            'message': f'Found {len(suggestions)} recipe suggestions based on your request',
            'inspiration_count': len(inspiration_recipes),
            'context_used': context[:500] + '...' if len(context) > 500 else context
        }
    
    def generate_custom_recipe(self, requirements: str, preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Generate a completely custom recipe based on requirements
        
        This would typically call an LLM with the database context
        """
        # Find inspiration recipes
        inspiration_recipes = self.find_inspiration_recipes(requirements, preferences, limit=5)
        
        # Format context
        context = self.format_recipe_context(inspiration_recipes, max_recipes=3)
        
        # This is where you would call your LLM API
        # For now, return a structured response
        
        if not inspiration_recipes:
            return {
                'success': False,
                'message': 'No inspiration recipes found for custom generation',
                'recipe': None
            }
        
        # Check if the top recipe already perfectly matches user preferences
        best_match = inspiration_recipes[0]
        match_score = self._calculate_preference_match_score(best_match, preferences or {})
        
        # If the recipe already meets all preferences (score >= 0.9), present it unchanged
        if match_score >= 0.9:
            return self._present_exact_match_recipe(best_match, requirements, preferences)
        
        # Create a basic recipe structure (this would be LLM-generated)
        base_recipe = inspiration_recipes[0]  # Use first inspiration recipe as base
        
        # Generate detailed instructions based on inspiration recipe
        detailed_instructions = self._generate_detailed_instructions(
            base_recipe, requirements, preferences, inspiration_recipes
        )
        
        custom_recipe = {
            'title': f"Custom {base_recipe['title']} Variation",
            'description': f"A custom recipe inspired by {base_recipe['title']}, adapted for: {requirements}",
            'ingredients': base_recipe.get('ingredients', [])[:8],  # Limit ingredients
            'instructions': detailed_instructions,
            'cooking_time_minutes': base_recipe.get('cooking_time_minutes', 30),
            'difficulty_level': base_recipe.get('difficulty_level', 'medium'),
            'cuisine_type': base_recipe.get('cuisine_type'),
            'meal_type': base_recipe.get('meal_type'),
            'dietary_tags': base_recipe.get('dietary_tags', []),
            'inspiration_recipe': base_recipe['title'],
            'generated_by': 'recipe_generator',
            'requirements_met': requirements
        }
        
        return {
            'success': True,
            'message': 'Custom recipe generated successfully',
            'recipe': custom_recipe,
            'inspiration_used': len(inspiration_recipes),
            'context_used': context[:300] + '...' if len(context) > 300 else context
        }
    
    def suggest_recipe_variations(self, base_recipe: Dict[str, Any], variation_type: str = "ingredient_substitution") -> List[Dict[str, Any]]:
        """Suggest variations of an existing recipe"""
        variations = []
        
        if variation_type == "ingredient_substitution":
            # Find similar recipes with different ingredients
            similar_recipes = self.db.semantic_search(base_recipe['title'], limit=5)
            
            for recipe in similar_recipes[1:]:  # Skip the original recipe
                if recipe['title'] != base_recipe['title']:
                    variation = {
                        'type': 'ingredient_substitution',
                        'title': f"{base_recipe['title']} with {recipe['title']} twist",
                        'description': f"Try substituting some ingredients from {recipe['title']}",
                        'suggested_changes': [
                            f"Use ingredients from {recipe['title']}",
                            f"Adapt cooking method from {recipe['title']}",
                            "Adjust seasoning to taste"
                        ],
                        'inspiration_recipe': recipe['title']
                    }
                    variations.append(variation)
        
        elif variation_type == "dietary_adaptation":
            # Suggest dietary adaptations
            dietary_adaptations = {
                'vegetarian': ['Replace meat with plant-based proteins', 'Use vegetable broth instead of meat broth'],
                'vegan': ['Replace dairy with plant-based alternatives', 'Use vegan cheese or nutritional yeast'],
                'gluten-free': ['Use gluten-free pasta or bread', 'Check all ingredients for gluten'],
                'low-carb': ['Reduce or eliminate pasta/bread', 'Increase vegetables and protein']
            }
            
            for diet, adaptations in dietary_adaptations.items():
                if diet not in base_recipe.get('dietary_tags', []):
                    variation = {
                        'type': 'dietary_adaptation',
                        'title': f"{base_recipe['title']} - {diet.title()} Version",
                        'description': f"Adapted version of {base_recipe['title']} for {diet} diet",
                        'suggested_changes': adaptations,
                        'dietary_goal': diet
                    }
                    variations.append(variation)
        
        return variations
    
    def get_recipe_recommendations(self, user_preferences: Dict[str, Any], limit: int = 10) -> Dict[str, Any]:
        """Get personalized recipe recommendations"""
        # Search for recipes matching preferences
        matching_recipes = self.db.search_by_preferences(user_preferences, limit=limit)
        
        if not matching_recipes:
            return {
                'recommendations': [],
                'message': 'No recipes found matching your preferences',
                'suggestion': 'Try broadening your search criteria'
            }
        
        # Categorize recommendations
        recommendations = {
            'exact_matches': [],
            'similar_matches': [],
            'exploration_suggestions': []
        }
        
        for recipe in matching_recipes:
            # Check how well it matches preferences
            match_score = self._calculate_preference_match_score(recipe, user_preferences)
            
            if match_score >= 0.8:
                recommendations['exact_matches'].append(recipe)
            elif match_score >= 0.5:
                recommendations['similar_matches'].append(recipe)
            else:
                recommendations['exploration_suggestions'].append(recipe)
        
        return {
            'recommendations': recommendations,
            'total_found': len(matching_recipes),
            'message': f'Found {len(matching_recipes)} recipes matching your preferences'
        }
    
    def _calculate_preference_match_score(self, recipe: Dict[str, Any], preferences: Dict[str, Any]) -> float:
        """Calculate how well a recipe matches user preferences"""
        if not preferences:
            return 0.0
            
        score = 0.0
        total_checks = 0
        
        # Check dietary restrictions (most important)
        if 'dietary_restrictions' in preferences and preferences['dietary_restrictions']:
            total_checks += 1
            recipe_dietary = set(recipe.get('dietary_tags', []))
            user_dietary = set(preferences['dietary_restrictions'])
            
            # Perfect match if all user dietary requirements are met
            if user_dietary.issubset(recipe_dietary):
                score += 1.0
            # Partial match if some requirements are met
            elif user_dietary.intersection(recipe_dietary):
                intersection_size = len(user_dietary.intersection(recipe_dietary))
                total_size = len(user_dietary)
                score += intersection_size / total_size
            # No match if recipe conflicts with dietary restrictions
            else:
                score += 0.0
        
        # Check meal type
        if 'meal_type' in preferences and preferences['meal_type']:
            total_checks += 1
            # Check both meal_type field and detected_tags for meal types
            recipe_meal = recipe.get('meal_type', '').lower()
            recipe_tags = [tag.lower() for tag in recipe.get('detected_tags', [])]
            user_meals = [meal.lower() for meal in preferences['meal_type']]
            
            # Check if any user meal type is in the recipe's meal_type field or detected_tags
            meal_match = False
            for user_meal in user_meals:
                if user_meal == recipe_meal or user_meal in recipe_tags:
                    meal_match = True
                    break
            
            if meal_match:
                score += 1.0
            else:
                score += 0.0
        
        # Check cooking time
        if 'cooking_time' in preferences and preferences['cooking_time']:
            total_checks += 1
            recipe_time = recipe.get('cooking_time_minutes', 0)
            recipe_tags = [tag.lower() for tag in recipe.get('detected_tags', [])]
            
            time_match = False
            for time_pref in preferences['cooking_time']:
                time_pref_lower = time_pref.lower()
                
                # Check if recipe is tagged with the cooking time preference
                if time_pref_lower in recipe_tags:
                    time_match = True
                    break
                # Also check cooking time in minutes
                elif time_pref_lower == 'quick' and recipe_time <= 30:
                    time_match = True
                    break
                elif time_pref_lower == 'medium' and 30 < recipe_time <= 60:
                    time_match = True
                    break
                elif time_pref_lower == 'slow' and recipe_time > 60:
                    time_match = True
                    break
            
            if time_match:
                score += 1.0
            else:
                score += 0.0
        
        # Check cuisine
        if 'cuisine' in preferences and preferences['cuisine']:
            total_checks += 1
            recipe_cuisine = recipe.get('cuisine_type', '').lower()
            user_cuisines = [cuisine.lower() for cuisine in preferences['cuisine']]
            
            if recipe_cuisine in user_cuisines:
                score += 1.0
            else:
                score += 0.0
        
        # Check ingredients (if specified)
        if 'ingredients' in preferences and preferences['ingredients']:
            total_checks += 1
            recipe_ingredients = [ing.lower() for ing in recipe.get('ingredients', [])]
            user_ingredients = [ing.lower() for ing in preferences['ingredients']]
            
            # Check if any user ingredients are in the recipe
            matches = sum(1 for user_ing in user_ingredients 
                         if any(user_ing in recipe_ing for recipe_ing in recipe_ingredients))
            
            if matches > 0:
                score += matches / len(user_ingredients)
            else:
                score += 0.0
        
        # Check difficulty level
        if 'difficulty' in preferences and preferences['difficulty']:
            total_checks += 1
            recipe_difficulty = recipe.get('difficulty_level', '').lower()
            user_difficulties = [diff.lower() for diff in preferences['difficulty']]
            
            if recipe_difficulty in user_difficulties:
                score += 1.0
            else:
                score += 0.0
        
        return score / total_checks if total_checks > 0 else 0.0
    
    def _generate_detailed_instructions(self, base_recipe: Dict[str, Any], requirements: str, 
                                      preferences: Dict[str, Any] = None, 
                                      inspiration_recipes: List[Dict[str, Any]] = None) -> List[str]:
        """
        Generate detailed instructions based on inspiration recipe with custom adaptations
        """
        base_instructions = base_recipe.get('instructions', [])
        if not base_instructions:
            return [
                "1. Prepare ingredients as specified",
                "2. Follow cooking method from inspiration recipe", 
                "3. Adapt timing and techniques as needed",
                "4. Taste and adjust seasoning",
                "5. Serve and enjoy!"
            ]
        
        detailed_instructions = []
        
        # Start with inspiration recipe context
        detailed_instructions.append(f"INSPIRED BY: {base_recipe['title']}")
        detailed_instructions.append(f"ADAPTED FOR: {requirements}")
        detailed_instructions.append("")
        
        # Add original instructions with detailed steps
        detailed_instructions.append("ORIGINAL RECIPE STEPS:")
        for i, instruction in enumerate(base_instructions, 1):
            detailed_instructions.append(f"{i}. {instruction}")
        
        detailed_instructions.append("")
        detailed_instructions.append("CUSTOM ADAPTATIONS:")
        
        # Add custom adaptations based on requirements and preferences
        adaptations = self._generate_custom_adaptations(requirements, preferences, base_recipe)
        for i, adaptation in enumerate(adaptations, 1):
            detailed_instructions.append(f"{i}. {adaptation}")
        
        # Add technique notes from other inspiration recipes
        if inspiration_recipes and len(inspiration_recipes) > 1:
            detailed_instructions.append("")
            detailed_instructions.append("ADDITIONAL TECHNIQUES FROM INSPIRATION:")
            for i, recipe in enumerate(inspiration_recipes[1:3], 1):  # Use up to 2 additional recipes
                if recipe.get('instructions'):
                    # Find a unique technique or step from this recipe
                    unique_instruction = self._find_unique_technique(recipe['instructions'], base_instructions)
                    if unique_instruction:
                        detailed_instructions.append(f"• From {recipe['title']}: {unique_instruction}")
        
        detailed_instructions.append("")
        detailed_instructions.append("FINAL STEPS:")
        detailed_instructions.append("• Taste and adjust seasoning to your preference")
        detailed_instructions.append("• Serve immediately while hot")
        detailed_instructions.append("• Enjoy your custom creation!")
        
        return detailed_instructions
    
    def _generate_custom_adaptations(self, requirements: str, preferences: Dict[str, Any], 
                                   base_recipe: Dict[str, Any]) -> List[str]:
        """Generate specific adaptations based on user requirements and preferences"""
        adaptations = []
        
        # Dietary adaptations
        if preferences and 'dietary_restrictions' in preferences:
            dietary_tags = preferences['dietary_restrictions']
            if 'vegetarian' in dietary_tags and 'vegetarian' not in base_recipe.get('dietary_tags', []):
                adaptations.append("Replace any meat with plant-based protein alternatives (tofu, tempeh, beans)")
            if 'vegan' in dietary_tags and 'vegan' not in base_recipe.get('dietary_tags', []):
                adaptations.append("Replace dairy products with plant-based alternatives (coconut milk, nutritional yeast)")
            if 'gluten-free' in dietary_tags and 'gluten-free' not in base_recipe.get('dietary_tags', []):
                adaptations.append("Use gluten-free alternatives for any wheat-based ingredients")
        
        # Cooking time adaptations
        if preferences and 'cooking_time' in preferences:
            if 'quick' in preferences['cooking_time']:
                adaptations.append("Use pre-cooked or quick-cooking ingredients to reduce preparation time")
                adaptations.append("Increase heat slightly and reduce cooking time for faster results")
            elif 'slow' in preferences['cooking_time']:
                adaptations.append("Use low and slow cooking methods for deeper flavor development")
                adaptations.append("Allow extra time for marinating or slow-cooking techniques")
        
        # Ingredient-specific adaptations based on requirements
        requirements_lower = requirements.lower()
        if 'healthy' in requirements_lower:
            adaptations.append("Reduce oil and salt, increase vegetables and herbs for a healthier version")
        if 'spicy' in requirements_lower:
            adaptations.append("Add chili peppers, hot sauce, or spices to increase heat level")
        if 'mild' in requirements_lower:
            adaptations.append("Reduce or omit spicy ingredients, focus on gentle flavors")
        if 'creamy' in requirements_lower:
            adaptations.append("Add cream, coconut milk, or pureed vegetables for creaminess")
        if 'crispy' in requirements_lower:
            adaptations.append("Use high-heat cooking methods or add breadcrumbs for crispiness")
        
        # If no specific adaptations, add general customization
        if not adaptations:
            adaptations.append("Adjust seasoning and spices to match your personal taste preferences")
            adaptations.append("Modify cooking times based on your preferred texture and doneness")
        
        return adaptations
    
    def _find_unique_technique(self, other_instructions: List[str], base_instructions: List[str]) -> str:
        """Find a unique cooking technique from another recipe that's not in the base recipe"""
        base_text = ' '.join(base_instructions).lower()
        
        for instruction in other_instructions:
            instruction_lower = instruction.lower()
            # Look for specific cooking techniques
            techniques = ['sauté', 'braise', 'roast', 'grill', 'steam', 'blanch', 'deglaze', 'reduce', 'fold', 'whisk']
            for technique in techniques:
                if technique in instruction_lower and technique not in base_text:
                    return instruction
        
        # If no unique technique found, return the first instruction
        return other_instructions[0] if other_instructions else ""
    
    def _present_exact_match_recipe(self, recipe: Dict[str, Any], requirements: str, 
                                   preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Present an exact match recipe unchanged with full credit to the original
        """
        # Create a presentation that gives full credit to the original recipe
        original_recipe = {
            'title': recipe['title'],
            'description': f"Perfect match! This recipe from our database already meets your requirements: {requirements}",
            'ingredients': recipe.get('ingredients', []),
            'instructions': recipe.get('instructions', []),
            'cooking_time_minutes': recipe.get('cooking_time_minutes'),
            'difficulty_level': recipe.get('difficulty_level'),
            'cuisine_type': recipe.get('cuisine_type'),
            'meal_type': recipe.get('meal_type'),
            'dietary_tags': recipe.get('dietary_tags', []),
            'original_recipe_id': recipe.get('id'),
            'original_url': recipe.get('url'),
            'original_source': recipe.get('source', 'Recipe Database'),
            'generated_by': 'exact_match_finder',
            'requirements_met': requirements,
            'match_type': 'exact_match',
            'match_score': self._calculate_preference_match_score(recipe, preferences or {}),
            'credits': {
                'original_title': recipe['title'],
                'original_author': recipe.get('author', 'Unknown'),
                'original_source': recipe.get('source', 'Recipe Database'),
                'original_url': recipe.get('url', ''),
                'found_in_database': True,
                'no_modifications_needed': True
            }
        }
        
        return {
            'success': True,
            'message': f'Perfect match found! The recipe "{recipe["title"]}" already meets all your requirements.',
            'recipe': original_recipe,
            'inspiration_used': 1,
            'context_used': f'Exact match: {recipe["title"]}',
            'match_type': 'exact_match',
            'match_score': self._calculate_preference_match_score(recipe, preferences or {})
        }

def main():
    """Example usage of LLM Recipe Generator"""
    
    # Initialize database
    db = RecipeDatabase()
    if not db.connect():
        print("Failed to connect to database")
        return
    
    generator = LLMRecipeGenerator(db)
    
    # Example 1: Generate recipe suggestions
    print("🍳 Generating recipe suggestions...")
    suggestions = generator.generate_recipe_suggestions(
        "quick vegetarian pasta",
        preferences={'dietary_restrictions': ['vegetarian'], 'cooking_time': ['quick']}
    )
    
    print(f"Found {len(suggestions['suggestions'])} suggestions:")
    for suggestion in suggestions['suggestions']:
        print(f"📝 {suggestion['title']} (similarity: {suggestion['similarity_score']:.3f})")
    
    # Example 2: Generate custom recipe
    print("\n🍳 Generating custom recipe...")
    custom_recipe = generator.generate_custom_recipe(
        "healthy dinner with vegetables",
        preferences={'dietary_restrictions': ['vegetarian']}
    )
    
    if custom_recipe['success']:
        recipe = custom_recipe['recipe']
        print(f"📝 {recipe['title']}")
        print(f"   Description: {recipe['description']}")
        print(f"   Ingredients: {len(recipe['ingredients'])} items")
        print(f"   Cooking time: {recipe['cooking_time_minutes']} minutes")
    
    # Example 3: Get personalized recommendations
    print("\n🍳 Getting personalized recommendations...")
    preferences = {
        'dietary_restrictions': ['vegetarian'],
        'meal_type': ['dinner'],
        'cooking_time': ['quick']
    }
    
    recommendations = generator.get_recipe_recommendations(preferences, limit=5)
    print(f"Found {recommendations['total_found']} recommendations")
    
    # Example 4: Suggest recipe variations
    if suggestions['suggestions']:
        print("\n🍳 Suggesting recipe variations...")
        base_recipe = suggestions['suggestions'][0]
        variations = generator.suggest_recipe_variations(base_recipe, "dietary_adaptation")
        
        for variation in variations[:2]:  # Show first 2 variations
            print(f"📝 {variation['title']}")
            print(f"   Changes: {', '.join(variation['suggested_changes'])}")
    
    db.close()

if __name__ == "__main__":
    main()
