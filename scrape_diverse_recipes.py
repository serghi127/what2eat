#!/usr/bin/env python3
"""
Improved script to scrape diverse recipes from different categories
This approach scrapes directly from category pages to get more variety
"""

import os
import sys
import time
import json
from datetime import datetime
from scraper import ImprovedSmittenKitchenScraper
from recipe_database_simple import SimpleRecipeDatabase

def scrape_diverse_recipes(num_recipes=50):
    """Scrape diverse recipes from different category pages"""
    
    print(f"🍳 Starting to scrape {num_recipes} diverse recipes from Smitten Kitchen...")
    print("=" * 60)
    
    # Initialize scraper
    scraper = ImprovedSmittenKitchenScraper(debug=False, verbose=False)
    
    # Get all available categories
    print("📂 Getting available categories...")
    categories = scraper.get_category_urls()
    
    if not categories:
        print("❌ No categories found!")
        return False
    
    print(f"Found {len(categories)} categories:")
    for name, info in list(categories.items())[:10]:  # Show first 10
        print(f"   • {name}: {info['count']} recipes")
    
    # Select diverse categories to scrape from
    target_categories = [
        'Quick', 'Weeknight Favorite', 'Vegetarian', 'Dessert', 'Soup',
        'Italian', 'French', 'Asian', 'Budget', 'Kid Favorites'
    ]
    
    all_recipe_urls = []
    
    # Collect recipe URLs from each target category
    for category_name in target_categories:
        if category_name in categories:
            print(f"\n📂 Scraping recipes from: {category_name}")
            
            # Get recipe URLs from this category
            recipe_urls = scraper.get_recipes_from_category_page(
                categories[category_name]['url'], 
                max_recipes=8  # Get 8 recipes per category
            )
            
            print(f"   Found {len(recipe_urls)} recipe URLs")
            all_recipe_urls.extend(recipe_urls)
            
            # Be respectful to the server
            time.sleep(1)
        else:
            print(f"   ⚠️  Category '{category_name}' not found")
    
    # Remove duplicates
    unique_urls = list(set(all_recipe_urls))
    print(f"\n📊 Found {len(unique_urls)} unique recipe URLs")
    
    # Limit to requested number
    if len(unique_urls) > num_recipes:
        unique_urls = unique_urls[:num_recipes]
    
    print(f"📝 Scraping details for {len(unique_urls)} recipes...")
    
    # Scrape detailed recipe information
    all_recipes = []
    for i, url in enumerate(unique_urls):
        print(f"   Scraping recipe {i+1}/{len(unique_urls)}: {url}")
        
        try:
            recipe_data = scraper.scrape_single_recipe(url)
            if recipe_data:
                all_recipes.append(recipe_data)
                print(f"   ✅ Success: {recipe_data.get('title', 'Unknown')}")
            else:
                print(f"   ❌ Failed to scrape recipe")
            
            # Be respectful to the server
            time.sleep(1)
            
        except Exception as e:
            print(f"   ❌ Error scraping recipe: {e}")
            continue
    
    print(f"\n📊 Scraping Summary:")
    print(f"   Total recipes scraped: {len(all_recipes)}")
    
    if not all_recipes:
        print("❌ No recipes were successfully scraped!")
        return False
    
    # Save to JSON file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_filename = f"diverse_recipes_{timestamp}.json"
    
    recipes_data = {
        'recipes': all_recipes,
        'total_count': len(all_recipes),
        'scraped_at': datetime.now().isoformat(),
        'source': 'smittenkitchen.com',
        'scraper_version': 'ImprovedSmittenKitchenScraper',
        'method': 'diverse_category_scraping'
    }
    
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(recipes_data, f, indent=2, ensure_ascii=False)
    
    print(f"💾 Saved {len(all_recipes)} recipes to {json_filename}")
    
    # Save to database
    print(f"\n🗄️  Adding recipes to database...")
    db = SimpleRecipeDatabase()
    
    if not db.connect():
        print("❌ Failed to connect to database")
        return False
    
    if not db.setup_database():
        print("❌ Failed to setup database")
        return False
    
    success_count = 0
    for i, recipe in enumerate(all_recipes):
        try:
            if db.insert_recipe(recipe):
                success_count += 1
                print(f"   ✅ Added recipe {i+1}/{len(all_recipes)}: {recipe.get('title', 'Unknown')}")
            else:
                print(f"   ❌ Failed to add recipe {i+1}/{len(all_recipes)}: {recipe.get('title', 'Unknown')}")
        except Exception as e:
            print(f"   ❌ Error adding recipe {i+1}: {e}")
    
    print(f"\n🎉 Successfully added {success_count}/{len(all_recipes)} recipes to database")
    
    # Get updated database stats
    print(f"\n📊 Updated Database Statistics:")
    stats = db.get_recipe_stats()
    for key, value in stats.items():
        print(f"   {key}: {value}")
    
    db.close()
    
    # Save recipe cache for future use
    scraper.save_recipe_cache()
    
    return True

def main():
    """Main function"""
    print("🍳 Smitten Kitchen Diverse Recipe Scraper")
    print("=" * 45)
    
    # Check if we want to scrape a specific number
    num_recipes = 50
    if len(sys.argv) > 1:
        try:
            num_recipes = int(sys.argv[1])
        except ValueError:
            print("❌ Invalid number of recipes. Using default: 50")
    
    print(f"Target: {num_recipes} diverse recipes")
    
    # Check if database is accessible
    db = SimpleRecipeDatabase()
    if not db.connect():
        print("❌ Cannot connect to database. Please check your database setup.")
        print("   Make sure PostgreSQL is running and your .env file is configured.")
        return
    
    db.close()
    
    # Start scraping
    success = scrape_diverse_recipes(num_recipes)
    
    if success:
        print(f"\n✅ Diverse recipe scraping completed successfully!")
        print(f"   Check the generated JSON file and your database for the new recipes.")
    else:
        print(f"\n❌ Recipe scraping failed. Check the error messages above.")

if __name__ == "__main__":
    main()
