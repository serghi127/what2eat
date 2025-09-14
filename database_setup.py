#!/usr/bin/env python3
"""
Database setup script for storing recipes with vector embeddings
Optimized for LLM semantic search and recipe generation
"""

import psycopg2
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any
import os
from datetime import datetime

class RecipeDatabase:
    def __init__(self, db_config: Dict[str, str]):
        """
        Initialize database connection
        
        db_config should contain:
        - host, port, database, user, password
        """
        self.db_config = db_config
        self.conn = None
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(**self.db_config)
            print("✅ Connected to PostgreSQL database")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            return False
    
    def setup_database(self):
        """Create database schema with pgvector support"""
        if not self.conn:
            print("❌ No database connection")
            return False
            
        try:
            cursor = self.conn.cursor()
            
            # Enable pgvector extension
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            print("✅ Enabled pgvector extension")
            
            # Create recipes table
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS recipes (
                id SERIAL PRIMARY KEY,
                url TEXT UNIQUE NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                ingredients TEXT[],
                instructions TEXT[],
                metadata JSONB,
                notes TEXT,
                detected_tags TEXT[],
                categories TEXT[],
                scraped_at TIMESTAMP DEFAULT NOW(),
                
                -- Vector embeddings for semantic search
                title_embedding VECTOR(384),
                content_embedding VECTOR(384),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            """
            cursor.execute(create_table_sql)
            print("✅ Created recipes table")
            
            # Create indexes for performance
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_recipes_detected_tags ON recipes USING GIN (detected_tags);",
                "CREATE INDEX IF NOT EXISTS idx_recipes_categories ON recipes USING GIN (categories);",
                "CREATE INDEX IF NOT EXISTS idx_recipes_ingredients ON recipes USING GIN (ingredients);",
                "CREATE INDEX IF NOT EXISTS idx_recipes_title_embedding ON recipes USING ivfflat (title_embedding vector_cosine_ops);",
                "CREATE INDEX IF NOT EXISTS idx_recipes_content_embedding ON recipes USING ivfflat (content_embedding vector_cosine_ops);",
                "CREATE INDEX IF NOT EXISTS idx_recipes_fulltext ON recipes USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || array_to_string(ingredients, ' ')));"
            ]
            
            for index_sql in indexes:
                cursor.execute(index_sql)
            print("✅ Created database indexes")
            
            self.conn.commit()
            return True
            
        except Exception as e:
            print(f"❌ Failed to setup database: {e}")
            self.conn.rollback()
            return False
    
    def generate_embeddings(self, text: str) -> List[float]:
        """Generate vector embedding for text"""
        if not text:
            return [0.0] * 384  # Return zero vector for empty text
            
        embedding = self.embedding_model.encode(text)
        return embedding.tolist()
    
    def prepare_recipe_content(self, recipe: Dict[str, Any]) -> str:
        """Combine recipe elements into searchable content"""
        content_parts = []
        
        if recipe.get('title'):
            content_parts.append(recipe['title'])
        
        if recipe.get('description'):
            content_parts.append(recipe['description'])
        
        if recipe.get('ingredients'):
            ingredients_text = ' '.join(recipe['ingredients'])
            content_parts.append(ingredients_text)
        
        if recipe.get('instructions'):
            instructions_text = ' '.join(recipe['instructions'])
            content_parts.append(instructions_text)
        
        return ' '.join(content_parts)
    
    def insert_recipe(self, recipe: Dict[str, Any]) -> bool:
        """Insert a single recipe with embeddings"""
        if not self.conn:
            return False
            
        try:
            cursor = self.conn.cursor()
            
            # Generate embeddings
            title_embedding = self.generate_embeddings(recipe.get('title', ''))
            content_embedding = self.generate_embeddings(self.prepare_recipe_content(recipe))
            
            # Prepare data for insertion
            insert_sql = """
            INSERT INTO recipes (
                url, title, description, ingredients, instructions, 
                metadata, notes, detected_tags, categories, scraped_at,
                title_embedding, content_embedding
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) ON CONFLICT (url) DO UPDATE SET
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                ingredients = EXCLUDED.ingredients,
                instructions = EXCLUDED.instructions,
                metadata = EXCLUDED.metadata,
                notes = EXCLUDED.notes,
                detected_tags = EXCLUDED.detected_tags,
                categories = EXCLUDED.categories,
                updated_at = NOW(),
                title_embedding = EXCLUDED.title_embedding,
                content_embedding = EXCLUDED.content_embedding;
            """
            
            cursor.execute(insert_sql, (
                recipe.get('url'),
                recipe.get('title'),
                recipe.get('description'),
                recipe.get('ingredients', []),
                recipe.get('instructions', []),
                json.dumps(recipe.get('metadata', {})),
                recipe.get('notes'),
                recipe.get('detected_tags', []),
                recipe.get('matched_categories', []),  # From your scraper
                recipe.get('scraped_at'),
                title_embedding,
                content_embedding
            ))
            
            self.conn.commit()
            return True
            
        except Exception as e:
            print(f"❌ Failed to insert recipe {recipe.get('title', 'Unknown')}: {e}")
            self.conn.rollback()
            return False
    
    def load_recipes_from_json(self, json_file: str) -> int:
        """Load recipes from JSON file and insert into database"""
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            recipes = data.get('recipes', [])
            print(f"📖 Loading {len(recipes)} recipes from {json_file}")
            
            success_count = 0
            for i, recipe in enumerate(recipes):
                if self.insert_recipe(recipe):
                    success_count += 1
                    print(f"✅ Inserted recipe {i+1}/{len(recipes)}: {recipe.get('title', 'Unknown')}")
                else:
                    print(f"❌ Failed to insert recipe {i+1}/{len(recipes)}: {recipe.get('title', 'Unknown')}")
            
            print(f"🎉 Successfully loaded {success_count}/{len(recipes)} recipes")
            return success_count
            
        except Exception as e:
            print(f"❌ Failed to load recipes from {json_file}: {e}")
            return 0
    
    def semantic_search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Perform semantic search on recipes"""
        if not self.conn:
            return []
            
        try:
            cursor = self.conn.cursor()
            
            # Generate embedding for query
            query_embedding = self.generate_embeddings(query)
            
            # Search by content similarity
            search_sql = """
            SELECT 
                id, title, description, ingredients, instructions, 
                metadata, notes, detected_tags, categories,
                1 - (content_embedding <=> %s) as similarity_score
            FROM recipes 
            ORDER BY content_embedding <=> %s
            LIMIT %s;
            """
            
            cursor.execute(search_sql, (query_embedding, query_embedding, limit))
            results = cursor.fetchall()
            
            # Convert to list of dictionaries
            recipes = []
            for row in results:
                recipe = {
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'ingredients': row[3],
                    'instructions': row[4],
                    'metadata': row[5],
                    'notes': row[6],
                    'detected_tags': row[7],
                    'categories': row[8],
                    'similarity_score': row[9]
                }
                recipes.append(recipe)
            
            return recipes
            
        except Exception as e:
            print(f"❌ Semantic search failed: {e}")
            return []
    
    def hybrid_search(self, query: str, filters: Dict[str, Any] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Perform hybrid search combining semantic and traditional filtering"""
        if not self.conn:
            return []
            
        try:
            cursor = self.conn.cursor()
            
            # Generate embedding for query
            query_embedding = self.generate_embeddings(query)
            
            # Build WHERE clause for filters
            where_conditions = []
            params = [query_embedding, query_embedding]
            
            if filters:
                if 'tags' in filters and filters['tags']:
                    where_conditions.append("detected_tags && %s")
                    params.append(filters['tags'])
                
                if 'categories' in filters and filters['categories']:
                    where_conditions.append("categories && %s")
                    params.append(filters['categories'])
                
                if 'ingredients' in filters and filters['ingredients']:
                    where_conditions.append("ingredients && %s")
                    params.append(filters['ingredients'])
            
            where_clause = ""
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            
            # Hybrid search query
            search_sql = f"""
            SELECT 
                id, title, description, ingredients, instructions, 
                metadata, notes, detected_tags, categories,
                1 - (content_embedding <=> %s) as similarity_score,
                ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || array_to_string(ingredients, ' ')), 
                       plainto_tsquery('english', %s)) as text_rank
            FROM recipes 
            {where_clause}
            ORDER BY (similarity_score * 0.7 + text_rank * 0.3) DESC
            LIMIT %s;
            """
            
            params.append(query)  # For text search
            params.append(limit)
            
            cursor.execute(search_sql, params)
            results = cursor.fetchall()
            
            # Convert to list of dictionaries
            recipes = []
            for row in results:
                recipe = {
                    'id': row[0],
                    'title': row[1],
                    'description': row[2],
                    'ingredients': row[3],
                    'instructions': row[4],
                    'metadata': row[5],
                    'notes': row[6],
                    'detected_tags': row[7],
                    'categories': row[8],
                    'similarity_score': row[9],
                    'text_rank': row[10]
                }
                recipes.append(recipe)
            
            return recipes
            
        except Exception as e:
            print(f"❌ Hybrid search failed: {e}")
            return []
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            print("🔌 Database connection closed")

def main():
    """Example usage"""
    # Database configuration
    db_config = {
        'host': 'localhost',
        'port': 5432,
        'database': 'what2eat',
        'user': 'your_username',
        'password': 'your_password'
    }
    
    # Initialize database
    db = RecipeDatabase(db_config)
    
    if not db.connect():
        return
    
    # Setup database schema
    if not db.setup_database():
        return
    
    # Load existing recipes
    json_files = [
        'quick_recipes.json',
        'complete_test_recipe.json',
        'test_recipe_with_instructions.json'
    ]
    
    for json_file in json_files:
        if os.path.exists(json_file):
            db.load_recipes_from_json(json_file)
    
    # Test semantic search
    print("\n🔍 Testing semantic search...")
    results = db.semantic_search("quick vegetarian pasta", limit=5)
    
    for recipe in results:
        print(f"📝 {recipe['title']} (similarity: {recipe['similarity_score']:.3f})")
        print(f"   Tags: {recipe['detected_tags']}")
        print()
    
    # Test hybrid search with filters
    print("\n🔍 Testing hybrid search with filters...")
    filters = {
        'tags': ['vegetarian', 'quick'],
        'categories': ['pasta']
    }
    results = db.hybrid_search("easy dinner", filters=filters, limit=3)
    
    for recipe in results:
        print(f"📝 {recipe['title']} (similarity: {recipe['similarity_score']:.3f}, text_rank: {recipe['text_rank']:.3f})")
    
    db.close()

if __name__ == "__main__":
    main()
