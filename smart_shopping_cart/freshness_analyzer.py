#!/usr/bin/env python3
"""
Freshness Analyzer

Analyzes ingredient freshness and prioritizes shopping based on shelf life.
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class FreshnessInfo:
    """Freshness information for an ingredient"""
    shelf_life_days: int
    freshness_priority: str  # high, medium, low
    storage_tips: List[str]
    warning_message: Optional[str] = None

class FreshnessAnalyzer:
    """
    Analyzes ingredient freshness and provides storage recommendations.
    
    Features:
    - Determines shelf life for ingredients
    - Prioritizes fresh ingredients in shopping lists
    - Provides storage tips
    - Warns about perishable items
    """
    
    def __init__(self):
        """Initialize the freshness analyzer"""
        self._build_freshness_database()
        self._build_storage_tips()
    
    def _build_freshness_database(self):
        """Build database of ingredient shelf life information"""
        
        # High freshness priority (1-7 days)
        self.high_freshness = {
            'shelf_life': 3,
            'ingredients': [
                r'\b(milk|cream|yogurt|fresh\s+cheese|cottage\s+cheese|ricotta)\b',
                r'\b(banana|berries|avocado|lettuce|spinach|arugula|watercress)\b',
                r'\b(fresh\s+(basil|oregano|thyme|rosemary|mint|cilantro|parsley))\b',
                r'\b(ground\s+(beef|turkey|chicken|pork|lamb))\b',
                r'\b(fresh\s+(fish|salmon|tuna|cod|shrimp|scallops))\b',
                r'\b(soft\s+cheese|brie|camembert|goat\s+cheese)\b'
            ]
        }
        
        # Medium freshness priority (1-2 weeks)
        self.medium_freshness = {
            'shelf_life': 10,
            'ingredients': [
                r'\b(eggs|hard\s+cheese|cheddar|swiss|parmesan|butter)\b',
                r'\b(apples|oranges|lemons|limes|grapefruit|pears)\b',
                r'\b(carrots|celery|bell\s+peppers|cucumber|zucchini)\b',
                r'\b(onions|garlic|ginger|potatoes|sweet\s+potatoes)\b',
                r'\b(cabbage|broccoli|cauliflower|brussels\s+sprouts)\b',
                r'\b(whole\s+(chicken|beef|pork|fish))\b',
                r'\b(bacon|sausage|deli\s+meat)\b'
            ]
        }
        
        # Low freshness priority (weeks to months)
        self.low_freshness = {
            'shelf_life': 60,
            'ingredients': [
                r'\b(canned|dried|frozen|jarred|pickled)\b',
                r'\b(rice|pasta|flour|sugar|salt|spices|herbs\s+dried)\b',
                r'\b(oil|vinegar|soy\s+sauce|hot\s+sauce|ketchup|mustard)\b',
                r'\b(nuts|seeds|beans|lentils|quinoa|barley|oats)\b',
                r'\b(honey|maple\s+syrup|molasses|jam|jelly)\b',
                r'\b(bread|tortillas|crackers|cookies)\b'
            ]
        }
    
    def _build_storage_tips(self):
        """Build storage tips for different ingredient types"""
        
        self.storage_tips = {
            'dairy': [
                'Store in refrigerator at 40°F or below',
                'Keep in original packaging when possible',
                'Use within 3-7 days of opening'
            ],
            'produce': [
                'Store in refrigerator crisper drawer',
                'Keep fruits and vegetables separate',
                'Remove any damaged or spoiled pieces'
            ],
            'herbs': [
                'Store fresh herbs in water like flowers',
                'Cover loosely with plastic bag',
                'Change water every 2-3 days'
            ],
            'meat': [
                'Store in refrigerator at 40°F or below',
                'Use within 1-2 days of purchase',
                'Freeze if not using within 2 days'
            ],
            'pantry': [
                'Store in cool, dry place',
                'Keep in airtight containers',
                'Check expiration dates regularly'
            ]
        }
    
    def prioritize_by_freshness(self, ingredients: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Prioritize ingredients by freshness and add freshness information.
        
        Args:
            ingredients: List of ingredient dictionaries
            
        Returns:
            List of ingredients with freshness information
        """
        
        prioritized_ingredients = []
        
        for ingredient in ingredients:
            # Analyze freshness
            freshness_info = self.analyze_freshness(ingredient['name'])
            
            # Add freshness information to ingredient
            enhanced_ingredient = {
                **ingredient,
                'shelf_life_days': freshness_info.shelf_life_days,
                'freshness_priority': freshness_info.freshness_priority,
                'storage_tips': freshness_info.storage_tips,
                'warning_message': freshness_info.warning_message
            }
            
            prioritized_ingredients.append(enhanced_ingredient)
        
        # Sort by freshness priority (high first, then medium, then low)
        priority_order = {'high': 0, 'medium': 1, 'low': 2}
        prioritized_ingredients.sort(key=lambda x: priority_order.get(x['freshness_priority'], 3))
        
        return prioritized_ingredients
    
    def analyze_freshness(self, ingredient_name: str) -> FreshnessInfo:
        """
        Analyze freshness for a specific ingredient.
        
        Args:
            ingredient_name: Name of the ingredient
            
        Returns:
            FreshnessInfo: Freshness analysis result
        """
        
        name_lower = ingredient_name.lower().strip()
        
        # Check high freshness ingredients
        for pattern in self.high_freshness['ingredients']:
            if re.search(pattern, name_lower, re.IGNORECASE):
                return FreshnessInfo(
                    shelf_life_days=self.high_freshness['shelf_life'],
                    freshness_priority='high',
                    storage_tips=self._get_storage_tips(name_lower),
                    warning_message="Buy last - expires quickly!"
                )
        
        # Check medium freshness ingredients
        for pattern in self.medium_freshness['ingredients']:
            if re.search(pattern, name_lower, re.IGNORECASE):
                return FreshnessInfo(
                    shelf_life_days=self.medium_freshness['shelf_life'],
                    freshness_priority='medium',
                    storage_tips=self._get_storage_tips(name_lower),
                    warning_message="Use within 1-2 weeks"
                )
        
        # Check low freshness ingredients
        for pattern in self.low_freshness['ingredients']:
            if re.search(pattern, name_lower, re.IGNORECASE):
                return FreshnessInfo(
                    shelf_life_days=self.low_freshness['shelf_life'],
                    freshness_priority='low',
                    storage_tips=self._get_storage_tips(name_lower),
                    warning_message=None
                )
        
        # Default to medium freshness
        return FreshnessInfo(
            shelf_life_days=14,
            freshness_priority='medium',
            storage_tips=self._get_storage_tips(name_lower),
            warning_message="Check expiration date"
        )
    
    def _get_storage_tips(self, ingredient_name: str) -> List[str]:
        """Get storage tips for an ingredient"""
        
        name_lower = ingredient_name.lower()
        
        # Determine ingredient category
        if any(word in name_lower for word in ['milk', 'cream', 'yogurt', 'cheese', 'butter']):
            return self.storage_tips['dairy']
        elif any(word in name_lower for word in ['apple', 'orange', 'lemon', 'carrot', 'celery', 'onion', 'garlic']):
            return self.storage_tips['produce']
        elif any(word in name_lower for word in ['basil', 'oregano', 'thyme', 'rosemary', 'cilantro', 'parsley']):
            return self.storage_tips['herbs']
        elif any(word in name_lower for word in ['chicken', 'beef', 'pork', 'fish', 'meat']):
            return self.storage_tips['meat']
        else:
            return self.storage_tips['pantry']
