#!/usr/bin/env python3
"""
JSON to TypeScript Recipe Converter
Converts scraped recipe JSON files to TypeScript format for the website
"""

import json
import os
import re
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class RecipeConverter:
    def __init__(self):
        self.recipe_id_counter = 1
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        
        if not self.openai_api_key:
            print("⚠️  OpenAI API key not found. Macro estimation will use fallback method.")
            self.use_llm = False
        else:
            try:
                import openai
                self.openai = openai
                self.openai.api_key = self.openai_api_key
                self.use_llm = True
                print("✅ OpenAI API key found. Will use LLM for macro estimation.")
            except ImportError:
                print("⚠️  OpenAI library not installed. Macro estimation will use fallback method.")
                self.use_llm = False
    
    def convert_json_to_typescript(self, input_file: str, output_file: str = None, category: str = "dinner") -> str:
        """
        Convert JSON recipe file to TypeScript format
        
        Args:
            input_file: Path to input JSON file
            output_file: Path to output TypeScript file (if None, auto-generates)
            category: Recipe category (breakfast, lunch, dinner, etc.)
            
        Returns:
            Path to the output TypeScript file
        """
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Input file not found: {input_file}")
        
        print(f"📚 Loading recipes from {input_file}...")
        
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        recipes = data.get('recipes', [])
        print(f"📝 Found {len(recipes)} recipes to convert")
        
        # Convert recipes to TypeScript format (limit to 10 for testing)
        ts_recipes = []
        test_limit = 10
        for i, recipe in enumerate(recipes[:test_limit]):
            print(f"🔧 Converting recipe {i+1}/{min(len(recipes), test_limit)}: {recipe.get('title', 'Unknown')}")
            ts_recipe = self._convert_single_recipe(recipe)
            if ts_recipe:
                ts_recipes.append(ts_recipe)
        
        # Generate output filename if not provided
        if not output_file:
            base_name = os.path.splitext(input_file)[0]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"{base_name}_converted_{timestamp}.ts"
        
        # Generate TypeScript file content
        ts_content = self._generate_typescript_content(ts_recipes, category)
        
        # Write TypeScript file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        
        print(f"✅ Converted {len(ts_recipes)} recipes to TypeScript")
        print(f"📁 Output saved to: {output_file}")
        
        return output_file
    
    def _convert_single_recipe(self, recipe: Dict[str, Any]) -> Dict[str, Any]:
        """Convert a single recipe from JSON format to TypeScript format"""
        
        # Extract basic info
        name = recipe.get('title', 'Unknown Recipe')
        ingredients = recipe.get('ingredients', [])
        instructions = recipe.get('instructions', [])
        metadata = recipe.get('metadata', {})
        tags = recipe.get('detected_tags', [])
        
        # Convert time to minutes (extract number from time string)
        time_str = metadata.get('time', '30 minutes')
        time_minutes = self._extract_time_minutes(time_str)
        
        # Get servings
        servings = metadata.get('servings', 4)
        
        # Estimate macros using LLM or fallback
        if self.use_llm:
            macros = self._estimate_macros_with_llm(ingredients, servings, name)
        else:
            macros = self._estimate_macros_fallback(ingredients, servings)
        
        # Convert tags to website format
        website_tags = self._convert_tags(tags)
        
        # Clean and format ingredients
        clean_ingredients = self._clean_ingredients(ingredients)
        
        # Clean and format instructions
        clean_instructions = self._clean_instructions(instructions)
        
        # Determine recipe source and credits
        source_info = self._get_recipe_source(recipe)
        
        # Create TypeScript recipe object
        ts_recipe = {
            'id': self.recipe_id_counter,
            'name': self._clean_recipe_name(name),
            'time': time_minutes,
            'servings': servings,
            'calories': macros['calories'],
            'protein': macros['protein'],
            'carbs': macros['carbs'],
            'fat': macros['fat'],
            'sugar': macros['sugar'],
            'tags': website_tags,
            'ingredients': clean_ingredients,
            'steps': clean_instructions,
            'source': source_info['source'],
            'credits': source_info['credits']
        }
        
        self.recipe_id_counter += 1
        return ts_recipe
    
    def _extract_time_minutes(self, time_str: str) -> int:
        """Extract time in minutes from time string"""
        if not time_str:
            return 30
        
        # Look for numbers in the time string
        numbers = re.findall(r'\d+', time_str)
        if not numbers:
            return 30
        
        # Convert to minutes
        total_minutes = 0
        time_lower = time_str.lower()
        
        if 'hour' in time_lower:
            # Find hour numbers
            hour_matches = re.findall(r'(\d+)\s*hour', time_lower)
            for hour in hour_matches:
                total_minutes += int(hour) * 60
        
        if 'minute' in time_lower:
            # Find minute numbers
            minute_matches = re.findall(r'(\d+)\s*minute', time_lower)
            for minute in minute_matches:
                total_minutes += int(minute)
        
        # If no specific time units found, assume the first number is minutes
        if total_minutes == 0 and numbers:
            total_minutes = int(numbers[0])
        
        return max(total_minutes, 5)  # Minimum 5 minutes
    
    
    def _estimate_macros_with_llm(self, ingredients: List[str], servings: int, recipe_name: str) -> Dict[str, int]:
        """Use LLM to estimate nutritional macros based on ingredients"""
        
        # Create prompt for macro estimation
        ingredients_text = "\n".join([f"- {ing}" for ing in ingredients])
        
        prompt = f"""
You are a nutrition expert. Estimate the nutritional content per serving for this recipe.

RECIPE: {recipe_name}
SERVINGS: {servings}
INGREDIENTS:
{ingredients_text}

Please provide estimates for the following macros PER SERVING:
- Calories
- Protein (grams)
- Carbohydrates (grams) 
- Fat (grams)
- Sugar (grams)

Consider typical serving sizes and cooking methods. Be realistic but not overly conservative.

Return ONLY a JSON object with this exact format:
{{
  "calories": <number>,
  "protein": <number>,
  "carbs": <number>,
  "fat": <number>,
  "sugar": <number>
}}
"""
        
        try:
            response = self.openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a nutrition expert who provides accurate macro estimates for recipes."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=200
            )
            
            # Parse the response
            response_text = response.choices[0].message.content.strip()
            
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                macros = json.loads(json_match.group(0))
                
                # Validate and ensure reasonable values
                return {
                    'calories': max(int(macros.get('calories', 300)), 100),
                    'protein': max(int(macros.get('protein', 15)), 5),
                    'carbs': max(int(macros.get('carbs', 30)), 5),
                    'fat': max(int(macros.get('fat', 10)), 2),
                    'sugar': max(int(macros.get('sugar', 8)), 0)
                }
            else:
                raise ValueError("No JSON found in LLM response")
                
        except Exception as e:
            print(f"⚠️  LLM macro estimation failed: {e}")
            return self._estimate_macros_fallback(ingredients, servings)
    
    def _estimate_macros_fallback(self, ingredients: List[str], servings: int) -> Dict[str, int]:
        """Fallback method for macro estimation when LLM is not available"""
        
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        total_sugar = 0
        
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower()
            
            # High calorie ingredients
            if any(word in ingredient_lower for word in ['oil', 'butter', 'cream', 'cheese']):
                total_calories += 120
                total_fat += 12
            elif any(word in ingredient_lower for word in ['pasta', 'rice', 'bread', 'flour']):
                total_calories += 80
                total_carbs += 18
            elif any(word in ingredient_lower for word in ['meat', 'chicken', 'beef', 'pork', 'fish']):
                total_calories += 100
                total_protein += 20
            elif any(word in ingredient_lower for word in ['sugar', 'honey', 'syrup', 'jam']):
                total_calories += 60
                total_sugar += 15
            elif any(word in ingredient_lower for word in ['vegetable', 'onion', 'garlic', 'herb']):
                total_calories += 15
                total_carbs += 3
            else:
                total_calories += 40
                total_protein += 2
                total_carbs += 5
                total_fat += 1
        
        # Calculate per serving
        return {
            'calories': max(total_calories // servings, 100),
            'protein': max(total_protein // servings, 5),
            'carbs': max(total_carbs // servings, 5),
            'fat': max(total_fat // servings, 2),
            'sugar': max(total_sugar // servings, 0)
        }
    
    def _get_recipe_source(self, recipe: Dict[str, Any]) -> Dict[str, str]:
        """Determine recipe source and create appropriate credits"""
        
        # Check if this is an LLM-generated recipe
        if recipe.get('generated_by') == 'recipe_generator':
            # This is an LLM-generated recipe
            inspiration_recipe = recipe.get('inspiration_recipe', 'Unknown Recipe')
            original_url = recipe.get('original_url', '')
            
            return {
                'source': 'LLM Generated',
                'credits': f"Inspired by: {inspiration_recipe}" + (f" ({original_url})" if original_url else "")
            }
        
        # This is a scraped recipe
        url = recipe.get('url', '')
        metadata = recipe.get('metadata', {})
        source = metadata.get('source', 'Unknown Source')
        
        # Extract domain from URL for better source identification
        if url:
            domain = url.split('/')[2] if len(url.split('/')) > 2 else url
        else:
            domain = source
        
        return {
            'source': domain,
            'credits': f"Original recipe from: {source}" + (f" ({url})" if url else "")
        }
    
    def _convert_tags(self, tags: List[str]) -> List[str]:
        """Convert detected tags to website tag format"""
        website_tags = []
        
        # Map detected tags to website tags
        tag_mapping = {
            'vegetarian': 'vegetarian',
            'vegan': 'vegan',
            'gluten-free': 'gluten-free',
            'quick': 'quick',
            'breakfast': 'breakfast',
            'lunch': 'lunch',
            'dinner': 'dinner',
            'healthy': 'healthy',
            'high-protein': 'high-protein',
            'low-carb': 'low-carb',
            'dairy-free': 'dairy-free'
        }
        
        for tag in tags:
            tag_lower = tag.lower()
            if tag_lower in tag_mapping:
                website_tags.append(tag_mapping[tag_lower])
        
        # Add default tags if none found
        if not website_tags:
            website_tags = ['dinner']
        
        return website_tags
    
    def _clean_ingredients(self, ingredients: List[str]) -> List[str]:
        """Clean and format ingredients for website display"""
        clean_ingredients = []
        
        for ingredient in ingredients:
            # Remove extra whitespace and clean up
            clean_ingredient = ' '.join(ingredient.split())
            
            # Skip very short ingredients
            if len(clean_ingredient) > 3:
                clean_ingredients.append(clean_ingredient)
        
        return clean_ingredients[:15]  # Limit to 15 ingredients max
    
    def _clean_instructions(self, instructions: List[str]) -> List[str]:
        """Clean and format instructions for website display"""
        clean_instructions = []
        
        for instruction in instructions:
            # Remove extra whitespace and clean up
            clean_instruction = ' '.join(instruction.split())
            
            # Skip very short instructions
            if len(clean_instruction) > 10:
                clean_instructions.append(clean_instruction)
        
        return clean_instructions[:10]  # Limit to 10 steps max
    
    def _clean_recipe_name(self, name: str) -> str:
        """Clean recipe name for website display"""
        # Remove extra whitespace
        clean_name = ' '.join(name.split())
        
        # Capitalize first letter of each word
        clean_name = ' '.join(word.capitalize() for word in clean_name.split())
        
        # Limit length
        if len(clean_name) > 50:
            clean_name = clean_name[:47] + "..."
        
        return clean_name
    
    def _generate_typescript_content(self, recipes: List[Dict[str, Any]], category: str) -> str:
        """Generate TypeScript file content"""
        
        # Create TypeScript content
        ts_content = f"""// Auto-generated recipe data from JSON conversion
// Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
// Total recipes: {len(recipes)}

import {{ Recipe }} from '../types';

export const {category.upper()}_RECIPES: Recipe[] = [
"""
        
        # Add each recipe
        for i, recipe in enumerate(recipes):
            ts_content += "  {\n"
            ts_content += f"    id: {recipe['id']},\n"
            ts_content += f"    name: \"{recipe['name']}\",\n"
            ts_content += f"    time: {recipe['time']},\n"
            ts_content += f"    servings: {recipe['servings']},\n"
            ts_content += f"    calories: {recipe['calories']},\n"
            ts_content += f"    protein: {recipe['protein']},\n"
            ts_content += f"    carbs: {recipe['carbs']},\n"
            ts_content += f"    fat: {recipe['fat']},\n"
            ts_content += f"    sugar: {recipe['sugar']},\n"
            
            # Format tags array
            tags_str = ', '.join(f'"{tag}"' for tag in recipe['tags'])
            ts_content += f"    tags: [{tags_str}],\n"
            
            # Format ingredients array
            ingredients_str = ',\n      '.join(f'"{ing}"' for ing in recipe['ingredients'])
            ts_content += f"    ingredients: [\n      {ingredients_str}\n    ],\n"
            
            # Format steps array
            steps_str = ',\n      '.join(f'"{step}"' for step in recipe['steps'])
            ts_content += f"    steps: [\n      {steps_str}\n    ],\n"
            
            # Add source and credits
            ts_content += f"    source: \"{recipe['source']}\",\n"
            ts_content += f"    credits: \"{recipe['credits']}\"\n"
            
            # Add comma if not last recipe
            if i < len(recipes) - 1:
                ts_content += "  },\n"
            else:
                ts_content += "  }\n"
        
        ts_content += "];\n"
        
        return ts_content

def main():
    """Main function to convert recipe files"""
    
    print("🔄 JSON to TypeScript Recipe Converter")
    print("=" * 50)
    
    # List of files to convert
    files_to_convert = [
        ("diverse_recipes_20250913_113316.json", "dinner"),
        ("quick_recipes.json", "quick"),
        ("scraped_recipes_20250913_113124.json", "dinner")
    ]
    
    converter = RecipeConverter()
    
    print("Available files to convert:")
    available_files = []
    for filename, category in files_to_convert:
        if os.path.exists(filename):
            print(f"  ✅ {filename} → {category}")
            available_files.append((filename, category))
        else:
            print(f"  ❌ {filename} (not found)")
    
    if not available_files:
        print("\n❌ No recipe files found to convert.")
        return
    
    print("\nOptions:")
    print("1. Convert all available files")
    print("2. Convert a specific file")
    
    choice = input("\nEnter your choice (1-2): ").strip()
    
    if choice == "1":
        # Convert all available files
        for filename, category in available_files:
            print(f"\n{'='*60}")
            print(f"🔄 Converting {filename} to {category} recipes...")
            try:
                output_file = converter.convert_json_to_typescript(filename, category=category)
                print(f"✅ Successfully converted {filename}")
                print(f"📁 Output saved to: {output_file}")
            except Exception as e:
                print(f"❌ Error converting {filename}: {e}")
    
    elif choice == "2":
        # Convert a specific file
        print(f"\nAvailable files:")
        for i, (filename, category) in enumerate(available_files, 1):
            print(f"  {i}. {filename} → {category}")
        
        try:
            file_choice = int(input("\nEnter file number: ")) - 1
            if 0 <= file_choice < len(available_files):
                filename, category = available_files[file_choice]
                print(f"\n🔄 Converting {filename} to {category} recipes...")
                output_file = converter.convert_json_to_typescript(filename, category=category)
                print(f"✅ Successfully converted {filename}")
                print(f"📁 Output saved to: {output_file}")
            else:
                print("❌ Invalid file number")
        except ValueError:
            print("❌ Please enter a valid number")
    
    else:
        print("❌ Invalid choice")

if __name__ == "__main__":
    main()
