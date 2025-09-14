# Recipe Database Setup Guide

This guide will help you set up PostgreSQL with pgvector for optimal LLM recipe storage and search.

## Why PostgreSQL + pgvector?

- **Semantic Search**: Find recipes by meaning, not just keywords
- **Structured Data**: Keep your existing recipe metadata organized
- **LLM Integration**: Perfect for RAG (Retrieval-Augmented Generation)
- **Scalability**: Handles 100+ recipes easily, scales to thousands
- **Performance**: Fast vector similarity search with proper indexing

## Prerequisites

1. **PostgreSQL 12+** installed on your system
2. **Python 3.8+** with pip
3. Your existing recipe JSON files

## Installation Steps

### 1. Install PostgreSQL and pgvector

**On macOS (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql

# Install pgvector extension
brew install pgvector
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Install pgvector
sudo apt install postgresql-14-pgvector  # Adjust version as needed
```

**On Windows:**
- Download PostgreSQL from https://www.postgresql.org/download/windows/
- Install pgvector from https://github.com/pgvector/pgvector/releases

### 2. Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE what2eat;
CREATE USER recipe_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE what2eat TO recipe_user;
\q
```

### 3. Install Python Dependencies

```bash
pip install -r requirements_db.txt
```

### 4. Configure Database Connection

Edit the database configuration in `database_setup.py`:

```python
db_config = {
    'host': 'localhost',
    'port': 5432,
    'database': 'what2eat',
    'user': 'recipe_user',
    'password': 'your_secure_password'
}
```

### 5. Run Database Setup

```bash
python database_setup.py
```

This will:
- Create the recipes table with vector support
- Load your existing JSON recipe files
- Generate embeddings for semantic search
- Create performance indexes

## Usage Examples

### Basic Semantic Search

```python
from database_setup import RecipeDatabase
from llm_recipe_helper import LLMRecipeHelper

# Initialize database
db = RecipeDatabase(db_config)
db.connect()

# Find similar recipes
results = db.semantic_search("quick vegetarian pasta", limit=5)
for recipe in results:
    print(f"{recipe['title']} (similarity: {recipe['similarity_score']:.3f})")
```

### Advanced Preference Matching

```python
helper = LLMRecipeHelper(db)

preferences = {
    'dietary_restrictions': ['vegetarian', 'gluten-free'],
    'meal_type': ['breakfast'],
    'cooking_time': ['quick']
}

recipes = helper.find_recipes_by_preferences(preferences, limit=10)
```

### LLM Integration

```python
# Get recipe context for LLM
context = helper.get_recipe_context_for_llm(recipes[:3])

# Use this context with your LLM for recipe generation
prompt = f"""
Based on these recipes:
{context}

Generate a new recipe for: quick healthy dinner
"""
```

## Database Schema

The `recipes` table includes:

- **Basic Info**: `url`, `title`, `description`
- **Recipe Data**: `ingredients[]`, `instructions[]`, `metadata`
- **Categorization**: `detected_tags[]`, `categories[]`
- **Vector Embeddings**: `title_embedding`, `content_embedding`
- **Timestamps**: `scraped_at`, `created_at`, `updated_at`

## Performance Tips

1. **Indexes**: The setup script creates optimized indexes for fast searching
2. **Embedding Model**: Uses `all-MiniLM-L6-v2` (384 dimensions) - good balance of speed and quality
3. **Batch Processing**: Load recipes in batches for better performance
4. **Connection Pooling**: Use connection pooling for production applications

## Scaling Considerations

- **100-1000 recipes**: Current setup handles this easily
- **1000+ recipes**: Consider connection pooling and query optimization
- **10,000+ recipes**: May need dedicated vector database (Pinecone, Weaviate) or PostgreSQL clustering

## Troubleshooting

### Common Issues

1. **pgvector extension not found**
   ```sql
   -- Check if extension is available
   SELECT * FROM pg_available_extensions WHERE name = 'vector';
   
   -- Install if available
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **Connection refused**
   - Check PostgreSQL is running: `brew services list | grep postgresql`
   - Verify connection details in `db_config`

3. **Memory issues with embeddings**
   - Reduce batch size when loading recipes
   - Use smaller embedding model if needed

### Performance Monitoring

```sql
-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('recipes'));

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'recipes';
```

## Next Steps

1. **LLM Integration**: Connect with OpenAI, Anthropic, or local LLM
2. **Web Interface**: Build a search interface using FastAPI or Flask
3. **Recipe Generation**: Implement custom recipe creation based on preferences
4. **User Preferences**: Add user accounts and personalized recommendations

## Alternative Approaches

If PostgreSQL + pgvector doesn't fit your needs:

- **Pinecone**: Managed vector database (easier setup, more expensive)
- **Weaviate**: Open-source vector database with GraphQL
- **Chroma**: Lightweight vector database for prototyping
- **Elasticsearch**: Full-text search with vector capabilities

But for your use case (100+ recipes, LLM integration), PostgreSQL + pgvector is the sweet spot!
