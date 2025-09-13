# LLM Recipe Integration Testing Guide

This guide will help you test the LLM model integration for finding and generating relevant recipes based on user input.

## Overview

The system consists of:
- **Recipe Database**: Stores recipes with vector embeddings for semantic search
- **LLM Recipe Helper**: Provides semantic search and recipe context formatting
- **LLM Recipe Generator**: Generates custom recipes and suggestions based on user input

## Quick Start

### 1. Setup Environment

```bash
# Run the setup script
python setup_env.py
```

This will:
- Create a `.env` file from the template
- Check for required dependencies
- Guide you through configuration

### 2. Configure Environment Variables

Edit the `.env` file with your actual configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=what2eat
DB_USER=your_username
DB_PASSWORD=your_password

# Optional: API Keys for LLM integration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 3. Install Dependencies

```bash
pip install psycopg2-binary sentence-transformers python-dotenv numpy
```

### 4. Test the System

```bash
# Run comprehensive tests
python test_llm_integration.py

# Or run a simple example
python example_llm_usage.py
```

## Testing Scripts

### `test_llm_integration.py`
Comprehensive test suite that:
- Tests database connection
- Tests semantic search functionality
- Tests LLM helper and generator
- Provides interactive testing mode

### `example_llm_usage.py`
Simple example showing how to:
- Take user input
- Find similar recipes
- Generate custom recipes
- Save results to JSON file

## How to Test with Your Own Input

### Method 1: Interactive Mode
```bash
python test_llm_integration.py
# Choose 'y' when prompted for interactive mode
# Enter your recipe requests
```

### Method 2: Modify Example Script
Edit `example_llm_usage.py` and change the `user_input` variable:

```python
user_input = "I want a quick and healthy vegetarian pasta dish for dinner"
```

### Method 3: Create Custom Test Script
```python
from database_setup import RecipeDatabase
from llm_recipe_generator import LLMRecipeGenerator

# Your custom user input
user_input = "Your recipe request here"

# Initialize and use the system
db = RecipeDatabase(db_config)
generator = LLMRecipeGenerator(db)

# Generate recipe
result = generator.generate_custom_recipe(user_input)
```

## Expected Output

When you run the tests, you should see:

1. **Database Connection**: Confirmation of successful connection
2. **Recipe Count**: Number of recipes in your database
3. **Semantic Search Results**: Similar recipes found for your query
4. **Generated Recipe**: Custom recipe based on your input
5. **Saved File**: JSON file with the generated recipe

## Output Files

The system generates several types of output files:

### Generated Recipe Files
- `generated_recipe_YYYYMMDD_HHMMSS.json`: Contains the custom recipe
- Includes user request, generated recipe, inspiration recipes, and metadata

### Example Output Structure
```json
{
  "user_request": "quick vegetarian pasta",
  "user_preferences": {
    "dietary_restrictions": ["vegetarian"],
    "meal_type": ["dinner"],
    "cooking_time": ["quick"]
  },
  "generated_recipe": {
    "title": "Custom Recipe Title",
    "description": "Recipe description",
    "ingredients": ["ingredient1", "ingredient2"],
    "instructions": ["step1", "step2"],
    "cooking_time_minutes": 30,
    "difficulty_level": "medium",
    "cuisine_type": "italian",
    "meal_type": "dinner",
    "dietary_tags": ["vegetarian"],
    "inspiration_recipe": "Original Recipe Title"
  },
  "similar_recipes_found": [...],
  "generated_at": "2024-01-01T12:00:00"
}
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env` file
- Verify database exists and is accessible

### No Recipes Found
- Check if recipes are loaded in database
- Run database setup to load from JSON files
- Verify JSON files exist and are readable

### Import Errors
- Install missing dependencies: `pip install -r requirements.txt`
- Check Python path and virtual environment

### API Key Issues
- Current implementation uses placeholder LLM calls
- Add real API keys to `.env` for actual LLM integration
- Modify the generator classes to use real API calls

## Current Limitations

1. **Placeholder LLM Calls**: The current implementation has placeholder methods for LLM API calls
2. **No Real LLM Integration**: You need to implement actual API calls to OpenAI/Anthropic
3. **Basic Recipe Generation**: Current generation is based on database recipes, not true LLM generation

## Next Steps for Full LLM Integration

1. **Implement Real LLM Calls**: Replace placeholder methods with actual API calls
2. **Add Error Handling**: Handle API rate limits and errors
3. **Improve Prompt Engineering**: Create better prompts for recipe generation
4. **Add Caching**: Cache LLM responses to reduce API costs
5. **Add Streaming**: Stream LLM responses for better user experience

## Example User Inputs to Test

Try these example inputs:

- "I want a quick vegetarian pasta dish for dinner"
- "Healthy breakfast smoothie with fruits"
- "Easy chicken dinner for two people"
- "Dessert with chocolate and berries"
- "Spicy Asian noodles with vegetables"
- "Low-carb dinner with protein"
- "Italian pasta with fresh ingredients"
- "Quick lunch for work"

Each input will generate different results based on your recipe database content.

