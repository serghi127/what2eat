#!/usr/bin/env python3
"""
Quantity Optimizer

Optimizes ingredient quantities across multiple recipes to avoid waste and reduce costs.
"""

import re
import math
from typing import List, Dict, Any, Optional, Tuple
from fractions import Fraction
from dataclasses import dataclass

@dataclass
class OptimizedIngredient:
    """Optimized ingredient with combined quantities"""
    name: str
    total_quantity: float
    unit: str
    original_ingredients: List[Dict[str, Any]]
    optimization_notes: List[str]

class QuantityOptimizer:
    """
    Optimizes ingredient quantities across multiple recipes.
    
    Features:
    - Combines quantities for same ingredients
    - Converts between compatible units
    - Suggests bulk purchase quantities
    - Identifies potential waste
    """
    
    def __init__(self):
        """Initialize the quantity optimizer"""
        self._build_unit_conversion_table()
        self._build_standard_units()
    
    def _build_unit_conversion_table(self):
        """Build conversion table for common units"""
        
        # Volume conversions (to cups)
        self.volume_conversions = {
            'cup': 1.0,
            'cups': 1.0,
            'c': 1.0,
            'tablespoon': 1/16,
            'tablespoons': 1/16,
            'tbsp': 1/16,
            'tsp': 1/48,
            'teaspoon': 1/48,
            'teaspoons': 1/48,
            'pint': 2.0,
            'pints': 2.0,
            'pt': 2.0,
            'quart': 4.0,
            'quarts': 4.0,
            'qt': 4.0,
            'gallon': 16.0,
            'gallons': 16.0,
            'gal': 16.0,
            'fluid ounce': 1/8,
            'fluid ounces': 1/8,
            'fl oz': 1/8,
            'ml': 1/236.588,
            'milliliter': 1/236.588,
            'milliliters': 1/236.588,
            'liter': 4.227,
            'liters': 4.227,
            'l': 4.227
        }
        
        # Weight conversions (to pounds)
        self.weight_conversions = {
            'pound': 1.0,
            'pounds': 1.0,
            'lb': 1.0,
            'lbs': 1.0,
            'ounce': 1/16,
            'ounces': 1/16,
            'oz': 1/16,
            'gram': 1/453.592,
            'grams': 1/453.592,
            'g': 1/453.592,
            'kilogram': 2.205,
            'kilograms': 2.205,
            'kg': 2.205
        }
        
        # Count-based units (no conversion needed)
        self.count_units = {
            'piece', 'pieces', 'item', 'items', 'whole', 'each', 'ea',
            'clove', 'cloves', 'head', 'heads', 'bunch', 'bunches',
            'can', 'cans', 'jar', 'jars', 'bottle', 'bottles',
            'package', 'packages', 'pkg', 'bag', 'bags', 'slice', 'slices'
        }
    
    def _build_standard_units(self):
        """Build standard unit categories"""
        
        self.volume_units = set(self.volume_conversions.keys())
        self.weight_units = set(self.weight_conversions.keys())
        self.all_units = self.volume_units | self.weight_units | self.count_units
    
    def optimize_quantities(self, ingredients: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Optimize quantities across all ingredients.
        
        Args:
            ingredients: List of ingredient dictionaries
            
        Returns:
            List of optimized ingredients
        """
        print("   ⚖️  Optimizing quantities...")
        
        # Group ingredients by name
        ingredient_groups = self._group_ingredients_by_name(ingredients)
        
        optimized_ingredients = []
        
        for ingredient_name, ingredient_list in ingredient_groups.items():
            if len(ingredient_list) == 1:
                # Single ingredient, no optimization needed
                optimized_ingredients.append(ingredient_list[0])
            else:
                # Multiple instances, optimize
                optimized = self._optimize_ingredient_group(ingredient_name, ingredient_list)
                optimized_ingredients.append(optimized)
        
        return optimized_ingredients
    
    def _group_ingredients_by_name(self, ingredients: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """Group ingredients by normalized name"""
        
        groups = {}
        
        for ingredient in ingredients:
            # Normalize ingredient name for grouping
            normalized_name = self._normalize_ingredient_name(ingredient['name'])
            
            if normalized_name not in groups:
                groups[normalized_name] = []
            
            groups[normalized_name].append(ingredient)
        
        return groups
    
    def _normalize_ingredient_name(self, name: str) -> str:
        """
        Normalize ingredient name for grouping.
        
        Examples:
        - "olive oil" and "extra virgin olive oil" -> "olive oil"
        - "onion" and "yellow onion" -> "onion"
        - "flour" and "all-purpose flour" -> "flour"
        """
        name_lower = name.lower().strip()
        
        # Remove common qualifiers
        qualifiers_to_remove = [
            'extra virgin', 'virgin', 'pure', 'organic', 'fresh', 'dried',
            'ground', 'chopped', 'diced', 'sliced', 'minced', 'grated',
            'yellow', 'white', 'red', 'green', 'brown', 'black',
            'all-purpose', 'bread', 'cake', 'pastry', 'self-rising',
            'unsalted', 'salted', 'sweet', 'unsweetened',
            'low-fat', 'fat-free', 'reduced-fat', 'whole', 'skim',
            'large', 'medium', 'small', 'jumbo', 'baby'
        ]
        
        for qualifier in qualifiers_to_remove:
            name_lower = name_lower.replace(qualifier, '').strip()
        
        # Remove extra spaces
        name_lower = re.sub(r'\s+', ' ', name_lower).strip()
        
        return name_lower
    
    def _optimize_ingredient_group(self, ingredient_name: str, 
                                 ingredient_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Optimize a group of ingredients with the same name.
        
        Args:
            ingredient_name: Normalized ingredient name
            ingredient_list: List of ingredient instances
            
        Returns:
            Optimized ingredient dictionary
        """
        
        # Try to combine quantities
        combined_quantity, unit, notes = self._combine_quantities(ingredient_list)
        
        # Combine all recipe references
        all_recipes = []
        for ingredient in ingredient_list:
            all_recipes.extend(ingredient['recipes'])
        
        # Create optimized ingredient
        optimized = {
            'name': ingredient_name,
            'quantity': str(combined_quantity),
            'unit': unit,
            'original_text': f"{combined_quantity} {unit} {ingredient_name}",
            'recipes': all_recipes,
            'category': ingredient_list[0]['category'],
            'importance': ingredient_list[0]['importance'],
            'freshness_priority': ingredient_list[0]['freshness_priority'],
            'optimization_notes': notes
        }
        
        return optimized
    
    def _combine_quantities(self, ingredient_list: List[Dict[str, Any]]) -> Tuple[float, str, List[str]]:
        """
        Combine quantities for the same ingredient.
        
        Args:
            ingredient_list: List of ingredient instances
            
        Returns:
            Tuple of (combined_quantity, unit, notes)
        """
        
        notes = []
        quantities = []
        
        # Parse all quantities and units
        for ingredient in ingredient_list:
            quantity = self._parse_quantity(ingredient['quantity'])
            unit = ingredient['unit'].lower().strip()
            
            if quantity is not None:
                quantities.append((quantity, unit, ingredient))
            else:
                notes.append(f"Could not parse quantity: {ingredient['quantity']}")
        
        if not quantities:
            # Fallback to first ingredient
            first_ingredient = ingredient_list[0]
            return 1.0, first_ingredient['unit'], notes
        
        # Try to convert all to the same unit
        converted_quantities = []
        target_unit = quantities[0][1]  # Use first unit as target
        
        for quantity, unit, ingredient in quantities:
            converted = self._convert_quantity(quantity, unit, target_unit)
            if converted is not None:
                converted_quantities.append(converted)
            else:
                # Can't convert, keep original
                converted_quantities.append(quantity)
                notes.append(f"Could not convert {quantity} {unit} to {target_unit}")
        
        # Sum all quantities
        total_quantity = sum(converted_quantities)
        
        # Round to reasonable precision
        if total_quantity >= 1:
            total_quantity = round(total_quantity, 2)
        else:
            total_quantity = round(total_quantity, 3)
        
        # Suggest bulk purchase if quantity is large
        if total_quantity > 5 and target_unit in ['cup', 'cups', 'pound', 'pounds']:
            notes.append(f"Consider bulk purchase - total needed: {total_quantity} {target_unit}")
        
        return total_quantity, target_unit, notes
    
    def _parse_quantity(self, quantity_str: str) -> Optional[float]:
        """
        Parse quantity string to float.
        
        Examples:
        - "2" -> 2.0
        - "1/2" -> 0.5
        - "1.5" -> 1.5
        - "2 1/2" -> 2.5
        """
        if not quantity_str:
            return None
        
        quantity_str = quantity_str.strip()
        
        try:
            # Handle fractions
            if '/' in quantity_str:
                # Handle mixed numbers like "2 1/2"
                if ' ' in quantity_str:
                    parts = quantity_str.split(' ')
                    if len(parts) == 2:
                        whole_part = float(parts[0])
                        fraction_part = float(Fraction(parts[1]))
                        return whole_part + fraction_part
                else:
                    # Simple fraction like "1/2"
                    return float(Fraction(quantity_str))
            else:
                # Regular number
                return float(quantity_str)
        
        except (ValueError, ZeroDivisionError):
            return None
    
    def _convert_quantity(self, quantity: float, from_unit: str, to_unit: str) -> Optional[float]:
        """
        Convert quantity from one unit to another.
        
        Args:
            quantity: Quantity to convert
            from_unit: Source unit
            to_unit: Target unit
            
        Returns:
            Converted quantity or None if conversion not possible
        """
        
        # Same unit
        if from_unit == to_unit:
            return quantity
        
        # Both are volume units
        if from_unit in self.volume_units and to_unit in self.volume_units:
            from_cups = quantity * self.volume_conversions[from_unit]
            return from_cups / self.volume_conversions[to_unit]
        
        # Both are weight units
        if from_unit in self.weight_units and to_unit in self.weight_units:
            from_pounds = quantity * self.weight_conversions[from_unit]
            return from_pounds / self.weight_conversions[to_unit]
        
        # Both are count units
        if from_unit in self.count_units and to_unit in self.count_units:
            return quantity  # No conversion needed for count units
        
        # Can't convert between different unit types
        return None
