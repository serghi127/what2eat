#!/usr/bin/env python3
"""
Script to scrape 200 random recipes from Allrecipes and compile them into all_recipes.ts
"""

from allrecipes_scraper import AllrecipesScraper
import time
import random

def scrape_200_allrecipes():
    """Scrape 200 diverse recipes from Allrecipes"""
    
    print("🍽️  Starting Allrecipes 200 Recipe Scraping")
    print("=" * 60)
    
    # Initialize scraper
    scraper = AllrecipesScraper(debug=False, verbose=False)
    
    # Define search categories for diversity
    search_categories = [
        # Main ingredients
        {'ingredients': ['chicken']},
        {'ingredients': ['beef']},
        {'ingredients': ['pork']},
        {'ingredients': ['fish']},
        {'ingredients': ['pasta']},
        {'ingredients': ['rice']},
        {'ingredients': ['vegetables']},
        {'ingredients': ['cheese']},
        
        # Dietary preferences
        {'dietary_restrictions': ['vegetarian']},
        {'dietary_restrictions': ['vegan']},
        {'dietary_restrictions': ['gluten-free']},
        
        # Meal types
        {'meal_type': ['breakfast']},
        {'meal_type': ['lunch']},
        {'meal_type': ['dinner']},
        {'meal_type': ['dessert']},
        {'meal_type': ['snack']},
        
        # Cooking styles
        {'cooking_time': ['quick']},
        {'cooking_time': ['easy']},
        
        # Cuisines
        {'cuisine': ['italian']},
        {'cuisine': ['mexican']},
        {'cuisine': ['asian']},
        {'cuisine': ['indian']},
        {'cuisine': ['chinese']},
        {'cuisine': ['french']},
        {'cuisine': ['american']},
        
        # Popular dishes
        {'dish': ['pizza']},
        {'dish': ['soup']},
        {'dish': ['salad']},
        {'dish': ['sandwich']},
        {'dish': ['burger']},
        {'dish': ['pasta']},
        {'dish': ['stir-fry']},
        {'dish': ['casserole']},
        {'dish': ['bread']},
        {'dish': ['cake']},
        {'dish': ['cookie']},
        {'dish': ['pie']},
    ]
    
    all_recipes = []
    recipes_per_category = 8  # 8 recipes per category to get ~200 total
    
    print(f"📋 Searching across {len(search_categories)} categories")
    print(f"🎯 Target: {recipes_per_category} recipes per category")
    print(f"📊 Total target: ~{len(search_categories) * recipes_per_category} recipes")
    print()
    
    for i, category in enumerate(search_categories, 1):
        print(f"🔍 Category {i}/{len(search_categories)}: {category}")
        
        try:
            # Search for recipes in this category
            recipes = scraper.search_recipes_by_preferences(
                category, 
                max_recipes=recipes_per_category
            )
            
            print(f"   ✅ Found {len(recipes)} recipes")
            
            # Add to our collection
            all_recipes.extend(recipes)
            
            # Small delay to be respectful
            time.sleep(1)
            
        except Exception as e:
            print(f"   ❌ Error in category {category}: {e}")
            continue
    
    print(f"\n📊 Total recipes collected: {len(all_recipes)}")
    
    # Remove duplicates based on URL
    seen_urls = set()
    unique_recipes = []
    
    for recipe in all_recipes:
        if recipe['url'] not in seen_urls:
            seen_urls.add(recipe['url'])
            unique_recipes.append(recipe)
    
    print(f"🔄 After removing duplicates: {len(unique_recipes)} recipes")
    
    # If we have more than 200, randomly sample 200
    if len(unique_recipes) > 200:
        print(f"🎲 Randomly sampling 200 recipes from {len(unique_recipes)}")
        unique_recipes = random.sample(unique_recipes, 200)
    
    print(f"📝 Final recipe count: {len(unique_recipes)}")
    
    # Save to TypeScript
    print(f"\n💾 Saving to TypeScript format...")
    ts_filename = scraper.save_recipes_to_typescript(
        unique_recipes, 
        filename="all_recipes.ts",
        category="all"
    )
    
    print(f"✅ Successfully created {ts_filename}")
    print(f"📊 Final statistics:")
    print(f"   - Total recipes: {len(unique_recipes)}")
    print(f"   - File: {ts_filename}")
    
    # Show some sample recipe names
    print(f"\n🍽️  Sample recipe names:")
    for i, recipe in enumerate(unique_recipes[:10], 1):
        print(f"   {i:2d}. {recipe['title']}")
    
    if len(unique_recipes) > 10:
        print(f"   ... and {len(unique_recipes) - 10} more recipes")
    
    return unique_recipes

if __name__ == "__main__":
    recipes = scrape_200_allrecipes()
