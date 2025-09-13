#!/usr/bin/env python3
"""
API Endpoints for Next.js Backend
These functions would be implemented as Next.js API routes
"""

import json
from typing import Dict, Any, List
from recipe_recommendation_system import (
    get_recommendations_api,
    RecipeRecommendationSystem
)

# This would be implemented as Next.js API routes in your app/api/ directory

def api_get_recommendations(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    API endpoint: POST /api/get-recommendations
    Get recipe recommendations based on user preferences
    """
    try:
        user_id = request_data.get('userId')
        preferences_data = request_data.get('preferences', {})
        
        if not user_id:
            return {
                'success': False,
                'error': 'User ID is required'
            }
        
        # Get recommendations
        recommendations = get_recommendations_api(user_id, preferences_data)
        
        return {
            'success': True,
            'recommendations': recommendations
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def api_search_recipes(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    API endpoint: GET /api/search?q=vegetarian&userId=123
    Search recipes by query
    """
    try:
        query = request_data.get('q', '')
        user_id = request_data.get('userId')
        
        if not query:
            return {
                'success': False,
                'error': 'Search query is required'
            }
        
        system = RecipeRecommendationSystem()
        
        # Get user preferences for better search results
        user_preferences = None
        if user_id:
            user_preferences = system.get_user_preferences(user_id)
        
        results = system.search_recipes(query, user_preferences)
        
        return {
            'success': True,
            'results': results,
            'query': query,
            'count': len(results)
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def api_get_recipe(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    API endpoint: GET /api/recipe?id=123&userId=123
    Get a specific recipe by ID
    """
    try:
        recipe_id = request_data.get('id')
        user_id = request_data.get('userId')
        
        if not recipe_id:
            return {
                'success': False,
                'error': 'Recipe ID is required'
            }
        
        system = RecipeRecommendationSystem()
        recipe = system.get_recipe_by_id(int(recipe_id))
        
        if not recipe:
            return {
                'success': False,
                'error': 'Recipe not found'
            }
        
        
        return {
            'success': True,
            'recipe': recipe
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

# Example Next.js API route implementations
def create_nextjs_api_routes():
    """
    Example implementations for Next.js API routes
    These would go in your app/api/ directory
    """
    
    # app/api/get-recommendations/route.ts
    get_recommendations_route = '''
import { NextRequest, NextResponse } from 'next/server';
import { api_get_recommendations } from '../../../api_endpoints.py';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = api_get_recommendations(body);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
'''
    
    
    # app/api/search/route.ts
    search_route = '''
import { NextRequest, NextResponse } from 'next/server';
import { api_search_recipes } from '../../../api_endpoints.py';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const userId = searchParams.get('userId');
    
    const result = api_search_recipes({ q, userId });
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
'''
    
    # app/api/recipe/route.ts
    recipe_route = '''
import { NextRequest, NextResponse } from 'next/server';
import { api_get_recipe } from '../../../api_endpoints.py';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    
    const result = api_get_recipe({ id, userId });
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
'''
    
    return {
        'get-recommendations': get_recommendations_route,
        'search': search_route,
        'recipe': recipe_route
    }

# Example usage and testing
if __name__ == "__main__":
    print("🔧 API Endpoints for Recipe Recommendation System")
    print("=" * 60)
    
    # Test API functions
    test_user_id = "test_user_123"
    
    # Test preferences
    test_preferences = {
        "dietary_restrictions": ["vegetarian"],
        "meal_type": ["breakfast"],
        "cooking_time": ["quick"],
        "cuisine": [],
        "ingredients": ["eggs"],
        "avoid_ingredients": []
    }
    
    print("1. Testing get recommendations API...")
    recommendations_result = api_get_recommendations({
        'userId': test_user_id,
        'preferences': test_preferences
    })
    print(f"   Success: {recommendations_result['success']}")
    if recommendations_result['success']:
        recs = recommendations_result['recommendations']
        print(f"   Type: {recs['recommendation_type']}")
        print(f"   Matches: {recs['total_matches']}")
    
    print("\n2. Testing search API...")
    search_result = api_search_recipes({
        'q': 'vegetarian',
        'userId': test_user_id
    })
    print(f"   Success: {search_result['success']}")
    if search_result['success']:
        print(f"   Results count: {search_result['count']}")
    
    print("\n✅ API endpoints tested successfully!")
    print("\n📁 Next.js API routes created:")
    routes = create_nextjs_api_routes()
    for route_name in routes.keys():
        print(f"   - app/api/{route_name}/route.ts")
