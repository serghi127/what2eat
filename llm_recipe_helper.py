#!/usr/bin/env python3
"""
LLM Recipe Helper - Integration between your recipe database and LLM
Provides semantic search and recipe generation capabilities
"""

import json
from typing import List, Dict, Any, Optional
from database_setup import RecipeDatabase

class LLMRecipeHelper:
    def __init__(self, db: RecipeDatabase):
        self.db = db
    
    def find_similar_recipes(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Find recipes similar to the query using semantic search"""
        return self.db.semantic_search(query, limit)
    
    def find_recipes_by_preferences(self, preferences: Dict[str, Any], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Find recipes matching specific preferences
        
        preferences = {
            'dietary_restrictions': ['vegetarian', 'gluten-free'],
            'meal_type': ['breakfast', 'lunch'],
            'cooking_time': ['quick'],
            'ingredients': ['pasta', 'cheese'],
            'cuisine': ['italian']
        }
        """
        # Convert preferences to search terms
        search_terms = []
        filters = {}
        
        if 'dietary_restrictions' in preferences:
            filters['tags'] = preferences['dietary_restrictions']
            search_terms.extend(preferences['dietary_restrictions'])
        
        if 'meal_type' in preferences:
            search_terms.extend(preferences['meal_type'])
        
        if 'cooking_time' in preferences:
            search_terms.extend(preferences['cooking_time'])
        
        if 'ingredients' in preferences:
            filters['ingredients'] = preferences['ingredients']
            search_terms.extend(preferences['ingredients'])
        
        if 'cuisine' in preferences:
            search_terms.extend(preferences['cuisine'])
        
        # Create search query
        query = ' '.join(search_terms)
        
        return self.db.hybrid_search(query, filters=filters, limit=limit)
    
    def get_recipe_context_for_llm(self, recipes: List[Dict[str, Any]], max_recipes: int = 3) -> str:
        """
        Format recipes for LLM context
        Returns a formatted string that can be used as context for recipe generation
        """
        context_parts = []
        
        for i, recipe in enumerate(recipes[:max_recipes]):
            context_parts.append(f"Recipe {i+1}: {recipe['title']}")
            context_parts.append(f"Description: {recipe.get('description', 'No description')}")
            context_parts.append(f"Ingredients: {', '.join(recipe.get('ingredients', []))}")
            context_parts.append(f"Instructions: {'; '.join(recipe.get('instructions', []))}")
            context_parts.append(f"Tags: {', '.join(recipe.get('detected_tags', []))}")
            context_parts.append("---")
        
        return "\n".join(context_parts)
    
    def suggest_recipe_variations(self, base_recipe: Dict[str, Any], variation_type: str = "ingredient_substitution") -> str:
        """
        Generate suggestions for recipe variations
        This would typically call an LLM with the recipe context
        """
        context = self.get_recipe_context_for_llm([base_recipe])
        
        prompt = f"""
        Based on this recipe, suggest {variation_type}:
        
        {context}
        
        Please provide 3-5 specific suggestions for {variation_type}.
        """
        
        # This would typically call your LLM API here
        # For now, return a placeholder
        return f"LLM suggestions for {variation_type} of {base_recipe['title']} would go here."
    
    def generate_custom_recipe(self, requirements: str, inspiration_recipes: List[Dict[str, Any]] = None) -> str:
        """
        Generate a custom recipe based on requirements and inspiration
        """
        if inspiration_recipes:
            context = self.get_recipe_context_for_llm(inspiration_recipes)
        else:
            context = "No specific inspiration recipes provided."
        
        prompt = f"""
        Create a custom recipe based on these requirements: {requirements}
        
        Use these recipes as inspiration:
        {context}
        
        IMPORTANT INSTRUCTION FORMAT:
        Please provide detailed, step-by-step instructions that:
        1. Start by repeating the key cooking steps from the inspiration recipe(s) in detail
        2. Clearly indicate where the instructions diverge to meet the custom requirements
        3. Explain the reasoning behind any modifications or substitutions
        4. Include specific timing, temperatures, and techniques from the original recipes
        5. Add notes about how the adaptations affect the final result
        
        Please provide:
        1. Recipe title
        2. Brief description explaining the inspiration and adaptations
        3. List of ingredients with measurements (note any substitutions)
        4. DETAILED step-by-step instructions following the format above
        5. Estimated cooking time and servings
        6. Notes about how this version differs from the inspiration recipe(s)
        """
        
        # This would typically call your LLM API here
        return f"Custom recipe for: {requirements} (LLM generation would go here)"

def main():
    """Example usage of LLM Recipe Helper"""
    
    # Database configuration (you'll need to set these)
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'what2eat',
        'user': 'your_username',
        'password': 'your_password'
    }
    
    # Initialize database and helper
    db = RecipeDatabase(db_config)
    if not db.connect():
        print("Failed to connect to database")
        return
    
    helper = LLMRecipeHelper(db)
    
    # Example 1: Find similar recipes
    print("🔍 Finding recipes similar to 'quick vegetarian pasta'...")
    similar_recipes = helper.find_similar_recipes("quick vegetarian pasta", limit=3)
    
    for recipe in similar_recipes:
        print(f"📝 {recipe['title']} (similarity: {recipe['similarity_score']:.3f})")
    
    # Example 2: Find recipes by preferences
    print("\n🔍 Finding vegetarian breakfast recipes...")
    preferences = {
        'dietary_restrictions': ['vegetarian'],
        'meal_type': ['breakfast'],
        'cooking_time': ['quick']
    }
    
    preference_recipes = helper.find_recipes_by_preferences(preferences, limit=3)
    
    for recipe in preference_recipes:
        print(f"📝 {recipe['title']} (similarity: {recipe['similarity_score']:.3f})")
    
    # Example 3: Get context for LLM
    if similar_recipes:
        print("\n📄 Recipe context for LLM:")
        context = helper.get_recipe_context_for_llm(similar_recipes[:2])
        print(context[:500] + "..." if len(context) > 500 else context)
    
    # Example 4: Generate custom recipe (placeholder)
    print("\n🍳 Custom recipe generation:")
    custom_recipe = helper.generate_custom_recipe(
        "healthy pasta dish with vegetables",
        similar_recipes[:2]
    )
    print(custom_recipe)
    
    db.close()

if __name__ == "__main__":
    main()
