#!/usr/bin/env python3
"""
Check what tables exist in the Supabase database
"""

import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

def check_database_tables():
    """Check what tables exist in the database"""
    
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Supabase credentials not found")
        return
    
    headers = {
        'apikey': supabase_key,
        'Authorization': f'Bearer {supabase_key}',
        'Content-Type': 'application/json'
    }
    
    # Try to get table information
    try:
        # Check if we can access the information_schema
        url = f"{supabase_url}/rest/v1/information_schema.tables"
        response = requests.get(url, headers=headers)
        
        print(f"Information schema response: {response.status_code}")
        if response.status_code == 200:
            tables = response.json()
            print(f"Found {len(tables)} tables:")
            for table in tables:
                print(f"  - {table.get('table_name', 'unknown')}")
        else:
            print(f"Could not access information schema: {response.text}")
            
    except Exception as e:
        print(f"Error accessing information schema: {e}")
    
    # Try some common table names
    common_tables = ['recipes', 'all_recipes', 'meal_table', 'users', 'shopping_lists']
    
    for table_name in common_tables:
        try:
            url = f"{supabase_url}/rest/v1/{table_name}"
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Table '{table_name}' exists with {len(data)} records")
                if data and len(data) > 0:
                    print(f"   Sample record keys: {list(data[0].keys())}")
            else:
                print(f"❌ Table '{table_name}' not accessible: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error checking table '{table_name}': {e}")

if __name__ == "__main__":
    check_database_tables()
