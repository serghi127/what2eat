"""
Smart Shopping Cart System

A tiered approach to generating shopping lists from weekly meal plans:
- Essential ingredients (auto-added)
- Pantry staples (optional toggle)
- Fresh vs shelf-stable prioritization
- Recipe-critical vs flavor enhancers
"""

__version__ = "1.0.0"
__author__ = "What2Eat Team"

from .cart import SmartShoppingCart
from .ingredient_classifier import IngredientClassifier
from .quantity_optimizer import QuantityOptimizer
from .freshness_analyzer import FreshnessAnalyzer

__all__ = [
    'SmartShoppingCart',
    'IngredientClassifier', 
    'QuantityOptimizer',
    'FreshnessAnalyzer'
]
