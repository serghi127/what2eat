#!/usr/bin/env python3
"""
Test script for Smart Shopping Cart

Tests the basic functionality of the smart shopping cart system.
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from smart_shopping_cart import SmartShoppingCart, IngredientClassifier, QuantityOptimizer, FreshnessAnalyzer

def test_ingredient_classifier():
    """Test the ingredient classifier"""
    print("🧪 Testing Ingredient Classifier...")
    
    classifier = IngredientClassifier()
    
    test_ingredients = [
        "chicken breast",
        "olive oil", 
        "fresh basil",
        "flour",
        "milk",
        "onion",
        "salt"
    ]
    
    for ingredient in test_ingredients:
        classification = classifier.classify_ingredient(ingredient)
        print(f"   {ingredient}: {classification.category} | {classification.importance} | {classification.freshness_priority}")
    
    print("✅ Ingredient classifier test completed\n")

def test_quantity_optimizer():
    """Test the quantity optimizer"""
    print("🧪 Testing Quantity Optimizer...")
    
    optimizer = QuantityOptimizer()
    
    # Test quantity parsing
    test_quantities = ["2", "1/2", "1.5", "2 1/2", "3/4"]
    
    for qty in test_quantities:
        parsed = optimizer._parse_quantity(qty)
        print(f"   {qty} -> {parsed}")
    
    # Test unit conversion
    converted = optimizer._convert_quantity(2, "cups", "tablespoons")
    print(f"   2 cups -> {converted} tablespoons")
    
    print("✅ Quantity optimizer test completed\n")

def test_freshness_analyzer():
    """Test the freshness analyzer"""
    print("🧪 Testing Freshness Analyzer...")
    
    analyzer = FreshnessAnalyzer()
    
    test_ingredients = [
        "milk",
        "fresh basil", 
        "onion",
        "flour",
        "ground beef"
    ]
    
    for ingredient in test_ingredients:
        freshness = analyzer.analyze_freshness(ingredient)
        print(f"   {ingredient}: {freshness.freshness_priority} priority, {freshness.shelf_life_days} days")
    
    print("✅ Freshness analyzer test completed\n")

def test_smart_shopping_cart():
    """Test the main smart shopping cart"""
    print("🧪 Testing Smart Shopping Cart...")
    
    cart = SmartShoppingCart()
    
    # Create a simple test weekly plan
    test_weekly_plan = {
        "Monday": {
            "meals": {
                "breakfast": {
                    "name": "Scrambled Eggs",
                    "ingredients": ["2 eggs", "1 tablespoon butter", "salt", "pepper"]
                },
                "lunch": {
                    "name": "Chicken Salad",
                    "ingredients": ["1 chicken breast", "1 cup lettuce", "1/2 cup tomatoes", "2 tablespoons olive oil"]
                },
                "dinner": {
                    "name": "Pasta with Marinara",
                    "ingredients": ["1 cup pasta", "1/2 cup marinara sauce", "1/4 cup parmesan cheese"]
                }
            }
        }
    }
    
    # Test ingredient extraction
    ingredients = cart._extract_ingredients_from_plan(test_weekly_plan)
    print(f"   Extracted {len(ingredients)} ingredients:")
    for ingredient in ingredients:
        print(f"     - {ingredient['name']}: {ingredient['quantity']} {ingredient['unit']}")
    
    print("✅ Smart shopping cart test completed\n")

def main():
    """Run all tests"""
    print("🚀 Starting Smart Shopping Cart Tests\n")
    
    try:
        test_ingredient_classifier()
        test_quantity_optimizer()
        test_freshness_analyzer()
        test_smart_shopping_cart()
        
        print("🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
