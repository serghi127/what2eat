from scraper import ImprovedSmittenKitchenScraper

def test_basic_scraping():
    # Enable debugging to see what's happening
    scraper = ImprovedSmittenKitchenScraper(debug=True, verbose=True)
    
    # Test getting a single recipe
    print("Testing single recipe scraping...")
    recipe_url = "https://smittenkitchen.com/2024/12/invisible-apple-cake/"
    recipe = scraper.scrape_single_recipe(recipe_url)
    
    if recipe:
        print(f"✓ Successfully scraped: {recipe['title']}")
        print(f"  Ingredients found: {len(recipe['ingredients'])}")
        print(f"  Instructions found: {len(recipe['instructions'])}")
    else:
        print("✗ Failed to scrape recipe")

def test_category_fetching():
    """Test fetching categories to see if the main issue is there"""
    print("\n" + "="*50)
    print("Testing category fetching...")
    
    scraper = ImprovedSmittenKitchenScraper(debug=True, verbose=True)
    categories = scraper.get_category_urls()
    
    if categories:
        print(f"✓ Found {len(categories)} categories")
        for name, info in list(categories.items())[:5]:  # Show first 5
            print(f"  - {name}: {info['count']} recipes")
    else:
        print("✗ No categories found - this is likely the main issue!")

def test_recipe_fetching_from_category():
    """Test fetching recipes from a specific category"""
    print("\n" + "="*50)
    print("Testing recipe fetching from category...")
    
    scraper = ImprovedSmittenKitchenScraper(debug=True, verbose=True)
    
    # First get categories
    categories = scraper.get_category_urls()
    if not categories:
        print("✗ No categories found, cannot test recipe fetching")
        return
    
    # Test with the first category
    first_category = list(categories.items())[0]
    category_name, category_info = first_category
    
    print(f"Testing with category: {category_name}")
    recipe_urls = scraper.get_recipes_from_category_page(
        category_info['url'], 
        max_recipes=5
    )
    
    if recipe_urls:
        print(f"✓ Found {len(recipe_urls)} recipe URLs")
        for i, url in enumerate(recipe_urls[:3]):
            print(f"  {i+1}. {url}")
    else:
        print("✗ No recipe URLs found in category")

if __name__ == "__main__":
    # Run all tests to debug the scraper
    test_category_fetching()
    test_recipe_fetching_from_category()
    test_basic_scraping()