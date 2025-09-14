#!/usr/bin/env python3
"""
Smart Shopping Cart - Main Class

Generates intelligent shopping lists from weekly meal plans with tiered categorization.
"""

import json
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime
import os
import sys

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from .ingredient_classifier import IngredientClassifier
from .quantity_optimizer import QuantityOptimizer
from .freshness_analyzer import FreshnessAnalyzer

@dataclass
class ShoppingItem:
    """Individual shopping item with metadata"""
    name: str
    quantity: str
    unit: str
    category: str  # essential, pantry_staples, fresh_priority, shelf_stable
    importance: str  # critical, important, optional
    recipes: List[str]  # Which recipes use this ingredient
    estimated_cost: Optional[float] = None
    notes: Optional[str] = None

@dataclass
class ShoppingList:
    """Complete shopping list with categorized items"""
    essential: List[ShoppingItem]
    pantry_staples: List[ShoppingItem]
    fresh_priority: List[ShoppingItem]
    shelf_stable: List[ShoppingItem]
    total_estimated_cost: Optional[float] = None
    generated_at: str = None
    
    def __post_init__(self):
        if self.generated_at is None:
            self.generated_at = datetime.now().isoformat()

class SmartShoppingCart:
    """
    Main class for generating smart shopping lists from weekly meal plans.
    
    Features:
    - Tiered ingredient categorization
    - Quantity optimization across recipes
    - Freshness prioritization
    - Recipe-critical analysis
    - Smart recommendations
    """
    
    def __init__(self, supabase_config: Optional[Dict[str, str]] = None):
        """
        Initialize the smart shopping cart.
        
        Args:
            supabase_config: Database configuration for Supabase connection
        """
        self.supabase_config = supabase_config
        self.classifier = IngredientClassifier()
        self.optimizer = QuantityOptimizer()
        self.freshness_analyzer = FreshnessAnalyzer()
        
        # Shopping list categories
        self.categories = {
            'essential': [],
            'pantry_staples': [],
            'fresh_priority': [],
            'shelf_stable': []
        }
        
    def generate_shopping_list(self, weekly_plan: Dict[str, Any], 
                             user_preferences: Optional[Dict[str, Any]] = None) -> ShoppingList:
        """
        Generate a smart shopping list from a weekly meal plan.
        
        Args:
            weekly_plan: Weekly meal plan data (from weekly_meal_planner.py)
            user_preferences: User preferences for customization
            
        Returns:
            ShoppingList: Categorized shopping list
        """
        print("🛒 Generating smart shopping list...")
        
        # Step 1: Extract all ingredients from weekly plan
        all_ingredients = self._extract_ingredients_from_plan(weekly_plan)
        print(f"   📋 Found {len(all_ingredients)} unique ingredients")
        
        # Step 2: Classify ingredients by category and importance
        classified_ingredients = self._classify_ingredients(all_ingredients)
        print(f"   🏷️  Classified ingredients into categories")
        
        # Step 3: Optimize quantities across recipes
        optimized_ingredients = self._optimize_quantities(classified_ingredients)
        print(f"   ⚖️  Optimized quantities for overlapping ingredients")
        
        # Step 4: Apply freshness prioritization
        freshness_prioritized = self._apply_freshness_prioritization(optimized_ingredients)
        print(f"   🥬 Applied freshness prioritization")
        
        # Step 5: Generate smart recommendations
        recommendations = self._generate_recommendations(freshness_prioritized, user_preferences)
        print(f"   💡 Generated smart recommendations")
        
        # Step 6: Create final shopping list
        shopping_list = self._create_shopping_list(freshness_prioritized, recommendations)
        print(f"   ✅ Shopping list generated successfully")
        
        return shopping_list
    
    def _extract_ingredients_from_plan(self, weekly_plan: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract and normalize ingredients from weekly meal plan"""
        ingredients = []
        ingredient_map = {}  # To track quantities and recipes
        
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        meals = ['breakfast', 'lunch', 'dinner']
        
        for day in days:
            if day not in weekly_plan:
                continue
                
            daily_plan = weekly_plan[day]
            meals_data = daily_plan.get('meals', {})
            
            for meal_type in meals:
                if meal_type not in meals_data:
                    continue
                    
                meal_data = meals_data[meal_type]
                recipe_name = meal_data.get('name', 'Unknown Recipe')
                meal_ingredients = meal_data.get('ingredients', [])
                
                for ingredient in meal_ingredients:
                    # Parse ingredient string using simple parser
                    parsed = self._parse_ingredient(ingredient)
                    
                    if parsed:
                        # Use normalized name as key for better grouping
                        ingredient_key = parsed['name'].lower().strip()
                        
                        if ingredient_key in ingredient_map:
                            # Combine quantities for same ingredient
                            ingredient_map[ingredient_key]['recipes'].append(f"{day} {meal_type}: {recipe_name}")
                            # TODO: Add quantity combination logic
                        else:
                            ingredient_map[ingredient_key] = {
                                'name': parsed['name'],
                                'quantity': parsed['quantity'],
                                'unit': parsed['unit'],
                                'original_text': ingredient,
                                'recipes': [f"{day} {meal_type}: {recipe_name}"]
                            }
        
        return list(ingredient_map.values())
    
    def _parse_ingredient(self, ingredient_text: str) -> Optional[Dict[str, str]]:
        """
        Parse ingredient text to extract quantity, unit, and name.
        
        Examples:
        - "2 cups flour" -> {"quantity": "2", "unit": "cups", "name": "flour"}
        - "1/2 teaspoon salt" -> {"quantity": "1/2", "unit": "teaspoon", "name": "salt"}
        - "1 large onion" -> {"quantity": "1", "unit": "large", "name": "onion"}
        """
        if not ingredient_text or not ingredient_text.strip():
            return None
            
        # Clean up the ingredient text
        text = ingredient_text.strip()
        
        # Common patterns for quantities and units
        patterns = [
            # Fraction + unit + ingredient
            r'^(\d+/\d+)\s+(\w+)\s+(.+)$',
            # Decimal + unit + ingredient  
            r'^(\d+\.\d+)\s+(\w+)\s+(.+)$',
            # Whole number + unit + ingredient
            r'^(\d+)\s+(\w+)\s+(.+)$',
            # Just ingredient (no quantity/unit)
            r'^(.+)$'
        ]
        
        for pattern in patterns:
            match = re.match(pattern, text, re.IGNORECASE)
            if match:
                groups = match.groups()
                
                if len(groups) == 3:
                    # Has quantity, unit, and name
                    return {
                        'quantity': groups[0],
                        'unit': groups[1],
                        'name': groups[2]
                    }
                elif len(groups) == 1:
                    # Just ingredient name
                    return {
                        'quantity': '1',
                        'unit': '',
                        'name': groups[0]
                    }
        
        return None
    
    def _classify_ingredients(self, ingredients: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Classify ingredients by category and importance"""
        classified = []
        
        for ingredient in ingredients:
            classification = self.classifier.classify_ingredient(ingredient['name'])
            
            classified_ingredient = {
                **ingredient,
                'category': classification.category,
                'importance': classification.importance,
                'freshness_priority': classification.freshness_priority
            }
            
            classified.append(classified_ingredient)
        
        return classified
    
    def _optimize_quantities(self, ingredients: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Optimize quantities for overlapping ingredients"""
        return self.optimizer.optimize_quantities(ingredients)
    
    def _apply_freshness_prioritization(self, ingredients: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Apply freshness prioritization to ingredients"""
        return self.freshness_analyzer.prioritize_by_freshness(ingredients)
    
    def _generate_recommendations(self, ingredients: List[Dict[str, Any]], 
                                user_preferences: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate smart recommendations for shopping"""
        recommendations = []
        
        # TODO: Implement smart recommendations
        # - Bulk purchase suggestions
        # - Seasonal alternatives
        # - Cost-saving suggestions
        # - Substitution suggestions
        
        return recommendations
    
    def _create_shopping_list(self, ingredients: List[Dict[str, Any]], 
                            recommendations: List[Dict[str, Any]]) -> ShoppingList:
        """Create the final categorized shopping list"""
        
        # Convert to ShoppingItem objects and categorize
        essential_items = []
        pantry_staples = []
        fresh_priority = []
        shelf_stable = []
        
        for ingredient in ingredients:
            item = ShoppingItem(
                name=ingredient['name'],
                quantity=ingredient['quantity'],
                unit=ingredient['unit'],
                category=ingredient['category'],
                importance=ingredient['importance'],
                recipes=ingredient['recipes']
            )
            
            # Categorize based on classification
            if ingredient['category'] == 'essential':
                essential_items.append(item)
            elif ingredient['category'] == 'pantry_staples':
                pantry_staples.append(item)
            elif ingredient['freshness_priority'] == 'high':
                fresh_priority.append(item)
            else:
                shelf_stable.append(item)
        
        return ShoppingList(
            essential=essential_items,
            pantry_staples=pantry_staples,
            fresh_priority=fresh_priority,
            shelf_stable=shelf_stable
        )
    
    def export_to_json(self, shopping_list: ShoppingList, filename: Optional[str] = None) -> str:
        """Export shopping list to JSON format"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"shopping_list_{timestamp}.json"
        
        # Convert to dictionary for JSON serialization
        data = asdict(shopping_list)
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"📄 Shopping list exported to: {filename}")
        return filename
    
    def export_to_csv(self, shopping_list: ShoppingList, filename: Optional[str] = None) -> str:
        """Export shopping list to CSV format"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"shopping_list_{timestamp}.csv"
        
        import csv
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write header
            writer.writerow(['Category', 'Name', 'Quantity', 'Unit', 'Importance', 'Recipes', 'Notes'])
            
            # Write items by category
            for category_name, items in [
                ('Essential', shopping_list.essential),
                ('Pantry Staples', shopping_list.pantry_staples),
                ('Fresh Priority', shopping_list.fresh_priority),
                ('Shelf Stable', shopping_list.shelf_stable)
            ]:
                for item in items:
                    writer.writerow([
                        category_name,
                        item.name,
                        item.quantity,
                        item.unit,
                        item.importance,
                        '; '.join(item.recipes),
                        item.notes or ''
                    ])
        
        print(f"📊 Shopping list exported to: {filename}")
        return filename
    
    def print_shopping_list(self, shopping_list: ShoppingList):
        """Print shopping list in a readable format"""
        print("\n" + "="*80)
        print("🛒 SMART SHOPPING LIST")
        print("="*80)
        print(f"Generated: {shopping_list.generated_at}")
        
        categories = [
            ("🥩 ESSENTIAL INGREDIENTS", shopping_list.essential, "Auto-added - core ingredients for your meals"),
            ("🏠 PANTRY STAPLES", shopping_list.pantry_staples, "Optional - check if you already have these"),
            ("🥬 FRESH PRIORITY", shopping_list.fresh_priority, "Buy first - these expire quickly"),
            ("📦 SHELF STABLE", shopping_list.shelf_stable, "Can wait - long shelf life")
        ]
        
        for category_title, items, description in categories:
            if items:
                print(f"\n{category_title}")
                print(f"   {description}")
                print("   " + "-"*60)
                
                for item in items:
                    quantity_text = f"{item.quantity} {item.unit}".strip()
                    print(f"   • {item.name} ({quantity_text})")
                    print(f"     Used in: {', '.join(item.recipes[:2])}{'...' if len(item.recipes) > 2 else ''}")
                    if item.notes:
                        print(f"     Note: {item.notes}")
                    print()
        
        print("="*80)
        print("✨ Happy shopping! Remember to check your pantry for staples.")
        print("="*80)
