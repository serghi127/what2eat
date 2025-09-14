#!/usr/bin/env python3
"""
Ingredient Classifier

Classifies ingredients into categories and determines their importance level.
"""

import re
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

@dataclass
class IngredientClassification:
    """Classification result for an ingredient"""
    category: str  # essential, pantry_staples, fresh_priority, shelf_stable
    importance: str  # critical, important, optional
    freshness_priority: str  # high, medium, low
    shelf_life_days: Optional[int] = None
    substitution_suggestions: List[str] = None

class IngredientClassifier:
    """
    Classifies ingredients into smart shopping cart categories.
    
    Categories:
    - Essential: Core ingredients that make or break a dish
    - Pantry Staples: Common ingredients users likely already have
    - Fresh Priority: Ingredients that expire quickly
    - Shelf Stable: Long-lasting ingredients
    """
    
    def __init__(self):
        """Initialize the classifier with ingredient databases"""
        self._build_classification_rules()
        self._build_freshness_rules()
        self._build_importance_rules()
    
    def _build_classification_rules(self):
        """Build rules for categorizing ingredients"""
        
        # Essential ingredients - core components of dishes
        self.essential_patterns = {
            'proteins': [
                r'\b(chicken|beef|pork|fish|salmon|tuna|shrimp|eggs|tofu|beans|lentils)\b',
                r'\b(ground\s+(beef|turkey|chicken|pork))\b',
                r'\b(chicken\s+(breast|thigh|wing|drumstick))\b',
                r'\b(beef\s+(steak|roast|chuck|sirloin))\b'
            ],
            'main_vegetables': [
                r'\b(onion|garlic|tomato|potato|carrot|celery|bell\s+pepper|mushroom)\b',
                r'\b(broccoli|cauliflower|spinach|lettuce|cabbage|zucchini)\b',
                r'\b(corn|peas|green\s+beans|asparagus|eggplant)\b'
            ],
            'grains': [
                r'\b(rice|pasta|bread|flour|quinoa|barley|oats|noodles)\b',
                r'\b(spaghetti|penne|macaroni|linguine|fettuccine)\b'
            ]
        }
        
        # Pantry staples - common ingredients users likely have
        self.pantry_staples_patterns = {
            'oils_fats': [
                r'\b(olive\s+oil|vegetable\s+oil|butter|margarine|shortening)\b',
                r'\b(coconut\s+oil|sesame\s+oil|canola\s+oil)\b'
            ],
            'spices_herbs': [
                r'\b(salt|pepper|garlic\s+powder|onion\s+powder|paprika)\b',
                r'\b(oregano|basil|thyme|rosemary|parsley|cilantro)\b',
                r'\b(cumin|coriander|chili\s+powder|cayenne|red\s+pepper)\b',
                r'\b(ginger|turmeric|curry\s+powder|bay\s+leaves)\b'
            ],
            'condiments': [
                r'\b(soy\s+sauce|vinegar|ketchup|mustard|mayonnaise)\b',
                r'\b(worcestershire|hot\s+sauce|barbecue\s+sauce)\b',
                r'\b(lemon\s+juice|lime\s+juice|balsamic\s+vinegar)\b'
            ],
            'baking': [
                r'\b(sugar|brown\s+sugar|baking\s+powder|baking\s+soda)\b',
                r'\b(vanilla\s+extract|cocoa\s+powder|chocolate\s+chips)\b'
            ]
        }
        
        # Fresh ingredients - expire quickly
        self.fresh_patterns = [
            r'\b(milk|cream|yogurt|cheese|butter)\b',
            r'\b(banana|apple|orange|lemon|lime|berries)\b',
            r'\b(avocado|lettuce|spinach|herbs|cilantro|parsley)\b',
            r'\b(fresh\s+(basil|oregano|thyme|rosemary))\b'
        ]
        
        # Shelf stable ingredients - long lasting
        self.shelf_stable_patterns = [
            r'\b(canned|dried|frozen|jarred)\b',
            r'\b(pasta|rice|beans|lentils|nuts|seeds)\b',
            r'\b(flour|sugar|salt|spices|herbs\s+dried)\b',
            r'\b(oil|vinegar|soy\s+sauce|hot\s+sauce)\b'
        ]
    
    def _build_freshness_rules(self):
        """Build rules for determining freshness priority"""
        
        # High freshness priority (1-7 days)
        self.high_freshness = [
            r'\b(milk|cream|yogurt|fresh\s+cheese|cottage\s+cheese)\b',
            r'\b(banana|berries|avocado|lettuce|spinach|cilantro|parsley)\b',
            r'\b(fresh\s+(basil|oregano|thyme|rosemary|mint))\b',
            r'\b(ground\s+(beef|turkey|chicken|pork))\b'
        ]
        
        # Medium freshness priority (1-2 weeks)
        self.medium_freshness = [
            r'\b(eggs|hard\s+cheese|butter|apples|oranges|lemons|limes)\b',
            r'\b(carrots|celery|bell\s+peppers|onions|garlic)\b',
            r'\b(potatoes|sweet\s+potatoes|cabbage|broccoli|cauliflower)\b'
        ]
        
        # Low freshness priority (weeks to months)
        self.low_freshness = [
            r'\b(canned|dried|frozen|jarred|pickled)\b',
            r'\b(rice|pasta|flour|sugar|salt|spices|herbs\s+dried)\b',
            r'\b(oil|vinegar|soy\s+sauce|hot\s+sauce|ketchup|mustard)\b',
            r'\b(nuts|seeds|beans|lentils|quinoa|barley|oats)\b'
        ]
    
    def _build_importance_rules(self):
        """Build rules for determining ingredient importance"""
        
        # Critical ingredients - dish won't work without them
        self.critical_patterns = [
            r'\b(flour|eggs|yeast|baking\s+powder|baking\s+soda)\b',  # Baking essentials
            r'\b(rice|pasta|bread|tortillas)\b',  # Starch base
            r'\b(chicken|beef|pork|fish|tofu|beans)\b',  # Main protein
            r'\b(onion|garlic|tomato\s+sauce|broth|stock)\b'  # Flavor base
        ]
        
        # Important ingredients - significantly affect taste/texture
        self.important_patterns = [
            r'\b(cheese|butter|cream|milk)\b',  # Dairy
            r'\b(vegetables|herbs|spices)\b',  # Flavor enhancers
            r'\b(oil|vinegar|lemon\s+juice|lime\s+juice)\b',  # Cooking liquids
            r'\b(salt|pepper|garlic\s+powder|onion\s+powder)\b'  # Seasoning
        ]
        
        # Optional ingredients - nice to have but not essential
        self.optional_patterns = [
            r'\b(garnish|topping|garnish|sprinkle)\b',
            r'\b(optional|for\s+garnish|for\s+serving)\b',
            r'\b(extra|additional|more)\b'
        ]
    
    def classify_ingredient(self, ingredient_name: str) -> IngredientClassification:
        """
        Classify an ingredient into categories and determine importance.
        
        Args:
            ingredient_name: Name of the ingredient to classify
            
        Returns:
            IngredientClassification: Classification result
        """
        name_lower = ingredient_name.lower().strip()
        
        # Determine category
        category = self._determine_category(name_lower)
        
        # Determine importance
        importance = self._determine_importance(name_lower)
        
        # Determine freshness priority
        freshness_priority = self._determine_freshness_priority(name_lower)
        
        # Estimate shelf life
        shelf_life_days = self._estimate_shelf_life(name_lower, freshness_priority)
        
        # Get substitution suggestions
        substitution_suggestions = self._get_substitution_suggestions(name_lower)
        
        return IngredientClassification(
            category=category,
            importance=importance,
            freshness_priority=freshness_priority,
            shelf_life_days=shelf_life_days,
            substitution_suggestions=substitution_suggestions
        )
    
    def _determine_category(self, ingredient_name: str) -> str:
        """Determine the primary category for an ingredient"""
        
        # Check essential ingredients first
        for category, patterns in self.essential_patterns.items():
            for pattern in patterns:
                if re.search(pattern, ingredient_name, re.IGNORECASE):
                    return 'essential'
        
        # Check pantry staples
        for category, patterns in self.pantry_staples_patterns.items():
            for pattern in patterns:
                if re.search(pattern, ingredient_name, re.IGNORECASE):
                    return 'pantry_staples'
        
        # Check fresh ingredients
        for pattern in self.fresh_patterns:
            if re.search(pattern, ingredient_name, re.IGNORECASE):
                return 'fresh_priority'
        
        # Check shelf stable
        for pattern in self.shelf_stable_patterns:
            if re.search(pattern, ingredient_name, re.IGNORECASE):
                return 'shelf_stable'
        
        # Default to essential if no match
        return 'essential'
    
    def _determine_importance(self, ingredient_name: str) -> str:
        """Determine the importance level of an ingredient"""
        
        # Check critical patterns
        for pattern in self.critical_patterns:
            if re.search(pattern, ingredient_name, re.IGNORECASE):
                return 'critical'
        
        # Check important patterns
        for pattern in self.important_patterns:
            if re.search(pattern, ingredient_name, re.IGNORECASE):
                return 'important'
        
        # Check optional patterns
        for pattern in self.optional_patterns:
            if re.search(pattern, ingredient_name, re.IGNORECASE):
                return 'optional'
        
        # Default to important
        return 'important'
    
    def _determine_freshness_priority(self, ingredient_name: str) -> str:
        """Determine freshness priority level"""
        
        # Check high freshness
        for pattern in self.high_freshness:
            if re.search(pattern, ingredient_name, re.IGNORECASE):
                return 'high'
        
        # Check medium freshness
        for pattern in self.medium_freshness:
            if re.search(pattern, ingredient_name, re.IGNORECASE):
                return 'medium'
        
        # Check low freshness
        for pattern in self.low_freshness:
            if re.search(pattern, ingredient_name, re.IGNORECASE):
                return 'low'
        
        # Default to medium
        return 'medium'
    
    def _estimate_shelf_life(self, ingredient_name: str, freshness_priority: str) -> Optional[int]:
        """Estimate shelf life in days based on freshness priority"""
        
        shelf_life_map = {
            'high': 7,      # 1 week
            'medium': 14,   # 2 weeks  
            'low': 90       # 3 months
        }
        
        return shelf_life_map.get(freshness_priority)
    
    def _get_substitution_suggestions(self, ingredient_name: str) -> List[str]:
        """Get substitution suggestions for an ingredient"""
        
        # Common substitutions
        substitutions = {
            'butter': ['margarine', 'coconut oil', 'olive oil'],
            'milk': ['almond milk', 'soy milk', 'oat milk'],
            'eggs': ['flax eggs', 'applesauce', 'banana'],
            'flour': ['almond flour', 'coconut flour', 'gluten-free flour'],
            'sugar': ['honey', 'maple syrup', 'stevia'],
            'oil': ['butter', 'coconut oil', 'avocado oil'],
            'onion': ['shallots', 'leeks', 'onion powder'],
            'garlic': ['garlic powder', 'garlic salt'],
            'tomato': ['canned tomatoes', 'tomato paste', 'sun-dried tomatoes']
        }
        
        # Find matching substitutions
        suggestions = []
        for key, subs in substitutions.items():
            if key in ingredient_name:
                suggestions.extend(subs)
        
        return suggestions[:3]  # Return top 3 suggestions
