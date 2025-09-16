#!/usr/bin/env python3
"""
Test script to verify Supabase connection and recipe data access
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

def test_supabase_connection():
    """Test connection to Supabase and fetch recipe data"""
    
    # Get environment variables
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Key: {supabase_key[:20]}..." if supabase_key else "No key found")
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found in environment variables")
        return False
    
    try:
        # Make request to Supabase to get all recipes
        headers = {
            'apikey': supabase_key,
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }
        
        # Get all recipes from the all_recipes table
        url = f"{supabase_url}/rest/v1/all_recipes"
        print(f"Making request to: {url}")
        
        response = requests.get(url, headers=headers)
        
        print(f"Response status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"❌ Error fetching recipes from Supabase: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        recipes = response.json()
        print(f"✅ Successfully fetched {len(recipes)} recipes from Supabase")
        
        # Show first recipe as example
        if recipes:
            first_recipe = recipes[0]
            print(f"\nFirst recipe example:")
            print(f"  ID: {first_recipe.get('id')}")
            print(f"  Name: {first_recipe.get('name')}")
            print(f"  Ingredients: {first_recipe.get('ingredients')}")
            print(f"  Steps: {first_recipe.get('steps')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to Supabase: {e}")
        return False

if __name__ == "__main__":
    test_supabase_connection()
