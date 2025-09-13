import requests
from bs4 import BeautifulSoup
import time
import json
from urllib.parse import urljoin, urlparse
import re
from datetime import datetime
from collections import defaultdict

class AllrecipesScraper:
    def __init__(self, debug=False, verbose=False):
        self.base_url = "https://www.allrecipes.com"
        self.debug = debug
        self.verbose = verbose
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Cache for recipe metadata to avoid re-scraping
        self.recipe_cache = {}
        
        # Recipe-to-categories mapping
        self.recipe_categories = defaultdict(set)
        
        if self.debug:
            print(f"[DEBUG] Initialized Allrecipes scraper with base_url: {self.base_url}")
    
    def get_category_urls(self):
        """Get all available recipe categories from Allrecipes"""
        url = urljoin(self.base_url, "/recipes/")
        
        if self.debug:
            print(f"[DEBUG] Fetching categories from: {url}")
        
        try:
            response = self.session.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            categories = {}
            
            # Look for category links in navigation or main content
            category_links = soup.find_all('a', href=True)
            
            for link in category_links:
                href = link.get('href')
                text = link.get_text().strip()
                
                # Look for category patterns in Allrecipes
                if href and '/recipes/' in href and text:
                    # Check for category patterns like "Dinners", "Breakfast", etc.
                    if any(cat in text.lower() for cat in [
                        'dinner', 'breakfast', 'lunch', 'appetizer', 'dessert', 
                        'vegetarian', 'vegan', 'healthy', 'quick', 'easy', 'chicken',
                        'beef', 'pasta', 'salad', 'soup', 'italian', 'mexican'
                    ]):
                        categories[text] = {
                            'url': href,
                            'count': 0  # We'll estimate this later
                        }
            
            if self.debug:
                print(f"[DEBUG] Found {len(categories)} categories")
                for name, info in categories.items():
                    print(f"[DEBUG]   - {name}: {info['url']}")
            
            return categories
            
        except requests.RequestException as e:
            print(f"[ERROR] Error fetching categories: {e}")
            return {}
    
    def search_recipes_by_preferences(self, preferences, max_recipes=10):
        """Search for recipes matching user preferences"""
        print("=== ALLRECIPES SEARCH ===")
        print(f"Looking for recipes matching: {preferences}")
        
        # For now, we'll search by keywords and scrape individual recipes
        search_terms = self._extract_search_terms(preferences)
        print(f"Search terms: {search_terms}")
        
        # Search for recipes using Allrecipes search
        recipe_urls = self._search_allrecipes(search_terms, max_recipes)
        
        # Scrape detailed info for found recipes
        detailed_recipes = []
        for recipe_url in recipe_urls:
            print(f"Scraping details for: {recipe_url}")
            
            if recipe_url in self.recipe_cache:
                recipe_data = self.recipe_cache[recipe_url]
            else:
                recipe_data = self.scrape_single_recipe(recipe_url)
                if recipe_data:
                    self.recipe_cache[recipe_url] = recipe_data
            
            if recipe_data:
                detailed_recipes.append(recipe_data)
            
            time.sleep(1)  # Be respectful
        
        return detailed_recipes
    
    def _search_allrecipes(self, search_terms, max_recipes=10):
        """Search Allrecipes for recipes matching search terms"""
        recipe_urls = []
        
        for term in search_terms[:3]:  # Limit to first 3 terms
            search_url = f"{self.base_url}/search?q={term}"
            
            if self.debug:
                print(f"[DEBUG] Searching: {search_url}")
            
            try:
                response = self.session.get(search_url)
                response.raise_for_status()
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Look for recipe links in search results
                recipe_links = soup.find_all('a', href=True)
                
                for link in recipe_links:
                    href = link.get('href')
                    if href and '/recipe/' in href and href not in recipe_urls:
                        full_url = urljoin(self.base_url, href)
                        recipe_urls.append(full_url)
                        
                        if len(recipe_urls) >= max_recipes:
                            break
                
                time.sleep(0.5)  # Be respectful
                
            except requests.RequestException as e:
                print(f"[ERROR] Error searching for {term}: {e}")
        
        return recipe_urls[:max_recipes]
    
    def _extract_search_terms(self, preferences):
        """Convert user preferences to search terms"""
        search_terms = []
        
        # Mapping of preference types to search keywords
        preference_mappings = {
            'dietary_restrictions': {
                'vegetarian': ['vegetarian'],
                'vegan': ['vegan'],
                'gluten-free': ['gluten-free'],
                'dairy-free': ['dairy-free'],
                'low-carb': ['low-carb']
            },
            'meal_type': {
                'breakfast': ['breakfast'],
                'lunch': ['lunch'],
                'dinner': ['dinner'],
                'snack': ['appetizer'],
                'dessert': ['dessert']
            },
            'cooking_time': {
                'quick': ['quick', 'easy', '30-minute'],
                'slow': ['slow-cooker']
            },
            'ingredients': {
                'chicken': ['chicken'],
                'beef': ['beef'],
                'pasta': ['pasta'],
                'vegetables': ['vegetable']
            }
        }
        
        for pref_type, pref_values in preferences.items():
            if isinstance(pref_values, str):
                pref_values = [pref_values]
            
            for value in pref_values:
                value_lower = value.lower()
                
                if pref_type in preference_mappings:
                    mapping = preference_mappings[pref_type]
                    if value_lower in mapping:
                        search_terms.extend(mapping[value_lower])
                    else:
                        search_terms.append(value_lower)
                else:
                    search_terms.append(value_lower)
        
        return list(set(search_terms))  # Remove duplicates
    
    def scrape_single_recipe(self, recipe_url):
        """Scrape detailed information from a single Allrecipes recipe page"""
        if self.debug:
            print(f"[DEBUG] Scraping single recipe: {recipe_url}")
        
        try:
            response = self.session.get(recipe_url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract recipe data using Allrecipes-specific selectors
            recipe_data = {
                'url': recipe_url,
                'title': self._extract_title(soup),
                'description': self._extract_description(soup),
                'image': self._extract_recipe_image(soup),
                'metadata': self._extract_recipe_metadata(soup),
                'ingredients': self._extract_ingredients(soup),
                'instructions': self._extract_instructions(soup),
                'detected_tags': self._detect_recipe_characteristics(soup),
                'scraped_at': datetime.now().isoformat()
            }
            
            if self.debug:
                print(f"[DEBUG] Extracted recipe data:")
                print(f"[DEBUG]   Title: {recipe_data['title']}")
                print(f"[DEBUG]   Ingredients count: {len(recipe_data['ingredients'])}")
                print(f"[DEBUG]   Instructions count: {len(recipe_data['instructions'])}")
            
            return recipe_data
            
        except requests.RequestException as e:
            print(f"[ERROR] Error fetching recipe {recipe_url}: {e}")
            return None
    
    def _extract_title(self, soup):
        """Extract recipe title from Allrecipes"""
        # Allrecipes title selectors
        title_selectors = [
            'h1.headline.heading-content',
            'h1[data-testid="recipe-title"]',
            'h1',
            '.recipe-title'
        ]
        
        for selector in title_selectors:
            element = soup.select_one(selector)
            if element:
                title = element.get_text().strip()
                return title
        
        return "Unknown Title"
    
    def _extract_recipe_image(self, soup):
        """Extract recipe image from Allrecipes"""
        # Allrecipes image selectors
        image_selectors = [
            'img[data-testid="recipe-image"]',
            '.recipe-image img',
            '.hero-image img',
            'img[alt*="recipe"]'
        ]
        
        for selector in image_selectors:
            img_tag = soup.select_one(selector)
            if img_tag:
                img_src = img_tag.get('src') or img_tag.get('data-src')
                if img_src:
                    if img_src.startswith('//'):
                        img_src = 'https:' + img_src
                    elif img_src.startswith('/'):
                        img_src = self.base_url + img_src
                    return img_src
        
        return None
    
    def _extract_description(self, soup):
        """Extract recipe description from Allrecipes"""
        # Look for recipe description
        desc_selectors = [
            '.recipe-summary',
            '.recipe-description',
            '[data-testid="recipe-description"]'
        ]
        
        for selector in desc_selectors:
            element = soup.select_one(selector)
            if element:
                return element.get_text().strip()
        
        return ""
    
    def _extract_recipe_metadata(self, soup):
        """Extract recipe metadata (servings, time, etc.) from Allrecipes using JSON-LD"""
        metadata = {
            'servings': None,
            'time': None,
            'source': 'Allrecipes'
        }
        
        # First try to extract from JSON-LD structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        
        for script in json_ld_scripts:
            try:
                import json
                data = json.loads(script.string)
                
                # Handle both single objects and arrays
                recipe_data = None
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and 'recipeIngredient' in item:
                            recipe_data = item
                            break
                elif isinstance(data, dict) and 'recipeIngredient' in data:
                    recipe_data = data
                
                if recipe_data:
                    # Extract servings
                    if 'recipeYield' in recipe_data:
                        yield_value = recipe_data['recipeYield']
                        if isinstance(yield_value, (int, float)):
                            metadata['servings'] = int(yield_value)
                        elif isinstance(yield_value, str):
                            servings_match = re.search(r'(\d+)', yield_value)
                            if servings_match:
                                metadata['servings'] = int(servings_match.group(1))
                    
                    # Extract prep time
                    if 'prepTime' in recipe_data:
                        prep_time = recipe_data['prepTime']
                        if prep_time:
                            metadata['time'] = prep_time
                    
                    # Extract cook time
                    if 'cookTime' in recipe_data:
                        cook_time = recipe_data['cookTime']
                        if cook_time:
                            if metadata['time']:
                                metadata['time'] += f" + {cook_time}"
                            else:
                                metadata['time'] = cook_time
                    
                    break
                    
            except (json.JSONDecodeError, TypeError):
                continue
        
        # Fallback to HTML selectors if JSON-LD not found
        if not any(metadata.values()):
            meta_selectors = [
                '.recipe-meta-item',
                '[data-testid="recipe-meta"]',
                '.recipe-details'
            ]
            
            for selector in meta_selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text().strip().lower()
                    
                    # Extract servings
                    if 'serving' in text or 'yield' in text:
                        servings_match = re.search(r'(\d+)', text)
                        if servings_match:
                            metadata['servings'] = int(servings_match.group(1))
                    
                    # Extract time
                    elif 'minute' in text or 'hour' in text:
                        metadata['time'] = text
        
        return metadata
    
    def _extract_ingredients(self, soup):
        """Extract ingredients list from Allrecipes using JSON-LD structured data"""
        ingredients = []
        
        # First try to extract from JSON-LD structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        
        for script in json_ld_scripts:
            try:
                import json
                data = json.loads(script.string)
                
                # Handle both single objects and arrays
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and 'recipeIngredient' in item:
                            ingredients = item['recipeIngredient']
                            break
                elif isinstance(data, dict) and 'recipeIngredient' in data:
                    ingredients = data['recipeIngredient']
                    break
                    
            except (json.JSONDecodeError, TypeError):
                continue
        
        # Fallback to HTML selectors if JSON-LD not found
        if not ingredients:
            ingredient_selectors = [
                'li[class*="ingredient"]',
                '.ingredients-item-name',
                '[data-testid="ingredient-item"]',
                '.ingredient-item'
            ]
            
            for selector in ingredient_selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text().strip()
                    if text and len(text) > 3:
                        ingredients.append(text)
                
                if ingredients:  # If we found ingredients with this selector, use them
                    break
        
        return ingredients
    
    def _extract_instructions(self, soup):
        """Extract cooking instructions from Allrecipes using JSON-LD structured data"""
        instructions = []
        
        # First try to extract from JSON-LD structured data
        json_ld_scripts = soup.find_all('script', type='application/ld+json')
        
        for script in json_ld_scripts:
            try:
                import json
                data = json.loads(script.string)
                
                # Handle both single objects and arrays
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and 'recipeInstructions' in item:
                            recipe_instructions = item['recipeInstructions']
                            # Extract text from HowToStep objects
                            for step in recipe_instructions:
                                if isinstance(step, dict) and 'text' in step:
                                    instructions.append(step['text'])
                            break
                elif isinstance(data, dict) and 'recipeInstructions' in data:
                    recipe_instructions = data['recipeInstructions']
                    # Extract text from HowToStep objects
                    for step in recipe_instructions:
                        if isinstance(step, dict) and 'text' in step:
                            instructions.append(step['text'])
                    break
                    
            except (json.JSONDecodeError, TypeError):
                continue
        
        # Fallback to HTML selectors if JSON-LD not found
        if not instructions:
            instruction_selectors = [
                '.recipe-instructions .paragraph',
                '[data-testid="instruction-step"]',
                '.instruction-step',
                '.recipe-directions .paragraph'
            ]
            
            for selector in instruction_selectors:
                elements = soup.select(selector)
                for element in elements:
                    text = element.get_text().strip()
                    if text and len(text) > 20:
                        instructions.append(text)
                
                if instructions:  # If we found instructions with this selector, use them
                    break
        
        return instructions
    
    def _detect_recipe_characteristics(self, soup):
        """Detect recipe characteristics from content"""
        text_content = soup.get_text().lower()
        detected_tags = []
        
        # Dietary characteristics
        if any(term in text_content for term in ['vegetarian', 'meatless']):
            detected_tags.append('vegetarian')
        if any(term in text_content for term in ['vegan', 'no dairy']):
            detected_tags.append('vegan')
        if any(term in text_content for term in ['gluten-free', 'gluten free']):
            detected_tags.append('gluten-free')
        
        # Meal timing
        if any(term in text_content for term in ['breakfast', 'morning']):
            detected_tags.append('breakfast')
        if any(term in text_content for term in ['lunch', 'midday']):
            detected_tags.append('lunch')
        if any(term in text_content for term in ['dinner', 'evening']):
            detected_tags.append('dinner')
        
        # Cooking time/difficulty
        if any(term in text_content for term in ['quick', 'easy', '30-minute']):
            detected_tags.append('quick')
        
        return detected_tags
    
    def save_recipes_to_typescript(self, recipes, filename=None, category="dinner"):
        """Save scraped recipes to TypeScript format"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"allrecipes_{timestamp}.ts"
        
        # Convert recipes to TypeScript format
        ts_recipes = []
        recipe_id_counter = 1
        
        for recipe in recipes:
            ts_recipe = self._convert_recipe_to_typescript(recipe, recipe_id_counter)
            if ts_recipe:
                ts_recipes.append(ts_recipe)
                recipe_id_counter += 1
        
        # Generate TypeScript file content
        ts_content = self._generate_typescript_content(ts_recipes, category)
        
        # Write TypeScript file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(ts_content)
        
        print(f"✅ Saved {len(ts_recipes)} Allrecipes to TypeScript format")
        print(f"📁 Output saved to: {filename}")
        
        return filename
    
    def _convert_recipe_to_typescript(self, recipe, recipe_id):
        """Convert a single recipe to TypeScript format"""
        name = recipe.get('title', 'Unknown Recipe')
        ingredients = recipe.get('ingredients', [])
        instructions = recipe.get('instructions', [])
        metadata = recipe.get('metadata', {})
        tags = recipe.get('detected_tags', [])
        image = recipe.get('image', None)
        
        # Convert time to minutes
        time_str = metadata.get('time', '30 minutes')
        time_minutes = self._extract_time_minutes(time_str)
        
        # Get servings
        servings = metadata.get('servings', 4)
        if servings is None:
            servings = 1
        
        # Estimate macros
        macros = self._estimate_macros_fallback(ingredients, servings)
        
        # Convert tags
        website_tags = self._convert_tags(tags)
        
        # Clean ingredients and instructions
        clean_ingredients = self._clean_ingredients(ingredients)
        clean_instructions = self._clean_instructions(instructions)
        
        # Create TypeScript recipe object
        ts_recipe = {
            'id': recipe_id,
            'name': self._clean_recipe_name(name),
            'time': time_minutes,
            'servings': servings,
            'calories': macros['calories'],
            'protein': macros['protein'],
            'carbs': macros['carbs'],
            'fat': macros['fat'],
            'sugar': macros['sugar'],
            'cholesterol': macros['cholesterol'],
            'fiber': macros['fiber'],
            'tags': website_tags,
            'ingredients': clean_ingredients,
            'steps': clean_instructions,
            'image': image,
            'source': 'Allrecipes',
            'credits': f"Original recipe from Allrecipes: {recipe.get('url', '')}"
        }
        
        return ts_recipe
    
    def _extract_time_minutes(self, time_str):
        """Extract time in minutes from time string"""
        if not time_str:
            return 30
        
        numbers = re.findall(r'\d+', time_str)
        if not numbers:
            return 30
        
        total_minutes = 0
        time_lower = time_str.lower()
        
        if 'hour' in time_lower:
            hour_matches = re.findall(r'(\d+)\s*hour', time_lower)
            for hour in hour_matches:
                total_minutes += int(hour) * 60
        
        if 'minute' in time_lower:
            minute_matches = re.findall(r'(\d+)\s*minute', time_lower)
            for minute in minute_matches:
                total_minutes += int(minute)
        
        if total_minutes == 0 and numbers:
            total_minutes = int(numbers[0])
        
        return max(total_minutes, 5)
    
    def _estimate_macros_fallback(self, ingredients, servings):
        """Estimate macros from ingredients"""
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        total_sugar = 0
        total_cholesterol = 0
        total_fiber = 0
        
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower()
            
            if any(word in ingredient_lower for word in ['oil', 'butter', 'cream', 'cheese']):
                total_calories += 120
                total_fat += 12
                total_cholesterol += 15
            elif any(word in ingredient_lower for word in ['pasta', 'rice', 'bread', 'flour']):
                total_calories += 80
                total_carbs += 18
                total_fiber += 2
            elif any(word in ingredient_lower for word in ['meat', 'chicken', 'beef', 'pork', 'fish']):
                total_calories += 100
                total_protein += 20
                total_cholesterol += 25
            elif any(word in ingredient_lower for word in ['sugar', 'honey', 'syrup']):
                total_calories += 60
                total_sugar += 15
            elif any(word in ingredient_lower for word in ['vegetable', 'onion', 'garlic']):
                total_calories += 15
                total_carbs += 3
                total_fiber += 2
            else:
                total_calories += 40
                total_protein += 2
                total_carbs += 5
                total_fat += 1
                total_fiber += 1
        
        return {
            'calories': max(total_calories // servings, 100),
            'protein': max(total_protein // servings, 5),
            'carbs': max(total_carbs // servings, 5),
            'fat': max(total_fat // servings, 2),
            'sugar': max(total_sugar // servings, 0),
            'cholesterol': max(total_cholesterol // servings, 0),
            'fiber': max(total_fiber // servings, 1)
        }
    
    def _convert_tags(self, tags):
        """Convert detected tags to website tag format"""
        website_tags = []
        
        tag_mapping = {
            'vegetarian': 'vegetarian',
            'vegan': 'vegan',
            'gluten-free': 'gluten-free',
            'quick': 'quick',
            'breakfast': 'breakfast',
            'lunch': 'lunch',
            'dinner': 'dinner'
        }
        
        for tag in tags:
            tag_lower = tag.lower()
            if tag_lower in tag_mapping:
                website_tags.append(tag_mapping[tag_lower])
        
        if not website_tags:
            website_tags = ['dinner']
        
        return website_tags
    
    def _clean_ingredients(self, ingredients):
        """Clean and format ingredients"""
        clean_ingredients = []
        
        for ingredient in ingredients:
            clean_ingredient = ' '.join(ingredient.split())
            if len(clean_ingredient) > 3:
                clean_ingredients.append(clean_ingredient)
        
        return clean_ingredients[:15]
    
    def _clean_instructions(self, instructions):
        """Clean and format instructions"""
        clean_instructions = []
        
        for instruction in instructions:
            clean_instruction = ' '.join(instruction.split())
            if len(clean_instruction) > 10:
                clean_instructions.append(clean_instruction)
        
        return clean_instructions[:10]
    
    def _clean_recipe_name(self, name):
        """Clean recipe name by stripping unnecessary words and keeping core food name"""
        # Remove common prefixes and suffixes
        prefixes_to_remove = [
            'the best', 'best', 'amazing', 'incredible', 'perfect', 'ultimate',
            'easy', 'quick', 'simple', 'homemade', 'grandma\'s', 'mom\'s',
            'chef john\'s', 'chef', 'world famous', 'famous', 'classic',
            'authentic', 'traditional', 'original', 'copycat', 'restaurant style',
            'restaurant', 'gourmet', 'delicious', 'tasty', 'yummy', 'mouthwatering'
        ]
        
        suffixes_to_remove = [
            'recipe', 'in the world', 'ever', 'of all time', 'that will',
            'you\'ll love', 'you\'ll ever', 'you can make', 'from scratch',
            'at home', 'for dinner', 'for lunch', 'for breakfast', 'for dessert',
            'made easy', 'made simple', 'the easy way', 'the simple way',
            'that everyone loves', 'everyone will love', 'your family will love'
        ]
        
        # Convert to lowercase for processing
        clean_name = name.lower().strip()
        
        # Remove prefixes
        for prefix in prefixes_to_remove:
            if clean_name.startswith(prefix + ' '):
                clean_name = clean_name[len(prefix):].strip()
        
        # Remove suffixes
        for suffix in suffixes_to_remove:
            if clean_name.endswith(' ' + suffix):
                clean_name = clean_name[:-len(suffix)].strip()
        
        # Remove extra words in the middle
        words_to_remove = [
            'that', 'which', 'with', 'and', 'or', 'for', 'of', 'in', 'on', 'at',
            'by', 'from', 'to', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'cannot', 'can\'t', 'won\'t',
            'don\'t', 'doesn\'t', 'didn\'t', 'wouldn\'t', 'couldn\'t', 'shouldn\'t',
            'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his',
            'her', 'its', 'our', 'their', 'some', 'any', 'all', 'both', 'each',
            'every', 'other', 'another', 'such', 'no', 'nor', 'not', 'only',
            'but', 'also', 'very', 'really', 'quite', 'rather', 'pretty', 'so',
            'too', 'enough', 'just', 'even', 'still', 'yet', 'already', 'soon',
            'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who', 'whom'
        ]
        
        # Split into words and filter out unnecessary words
        words = clean_name.split()
        filtered_words = []
        
        for word in words:
            # Remove punctuation and check if word should be kept
            clean_word = word.strip('.,!?;:"()[]{}')
            if clean_word and clean_word not in words_to_remove:
                filtered_words.append(clean_word)
        
        # Join words and capitalize properly
        if filtered_words:
            clean_name = ' '.join(word.capitalize() for word in filtered_words)
        else:
            # Fallback to original name if all words were filtered
            clean_name = ' '.join(word.capitalize() for word in name.split())
        
        # Limit length
        if len(clean_name) > 50:
            clean_name = clean_name[:47] + "..."
        
        return clean_name
    
    def _generate_typescript_content(self, recipes, category):
        """Generate TypeScript file content"""
        ts_content = f"""// Auto-generated Allrecipes data from scraper
// Generated on: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
// Total recipes: {len(recipes)}

import {{ Recipe }} from '../types';

export const {category.upper()}_RECIPES: Recipe[] = [
"""
        
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
            ts_content += f"    cholesterol: {recipe['cholesterol']},\n"
            ts_content += f"    fiber: {recipe['fiber']},\n"
            
            tags_str = ', '.join(f'"{tag}"' for tag in recipe['tags'])
            ts_content += f"    tags: [{tags_str}],\n"
            
            ingredients_str = ',\n      '.join(f'"{ing}"' for ing in recipe['ingredients'])
            ts_content += f"    ingredients: [\n      {ingredients_str}\n    ],\n"
            
            steps_str = ',\n      '.join(f'"{step}"' for step in recipe['steps'])
            ts_content += f"    steps: [\n      {steps_str}\n    ],\n"
            
            if recipe['image']:
                ts_content += f"    image: \"{recipe['image']}\",\n"
            else:
                ts_content += f"    image: null,\n"
            
            ts_content += f"    source: \"{recipe['source']}\",\n"
            ts_content += f"    credits: \"{recipe['credits']}\"\n"
            
            if i < len(recipes) - 1:
                ts_content += "  },\n"
            else:
                ts_content += "  }\n"
        
        ts_content += "];\n"
        
        return ts_content

# Example usage
if __name__ == "__main__":
    # Enable debugging for troubleshooting
    scraper = AllrecipesScraper(debug=True, verbose=True)
    
    print("\n" + "="*60)
    print("=== TESTING ALLRECIPES SCRAPER ===")
    
    # Test 1: Search for vegetarian recipes
    print("\n--- Test 1: Vegetarian Recipes ---")
    preferences1 = {
        'dietary_restrictions': ['vegetarian']
    }
    
    recipes1 = scraper.search_recipes_by_preferences(
        preferences1, 
        max_recipes=3
    )
    
    print(f"\nFound {len(recipes1)} vegetarian recipes:")
    for recipe in recipes1:
        print(f"  • {recipe['title']}")
        print(f"    Ingredients: {len(recipe['ingredients'])}")
        print(f"    Instructions: {len(recipe['instructions'])}")
    
    # Test TypeScript output
    if recipes1:
        print(f"\nSaving {len(recipes1)} recipes to TypeScript format...")
        ts_filename = scraper.save_recipes_to_typescript(recipes1, category="vegetarian")
        print(f"✅ TypeScript file created: {ts_filename}")
    else:
        print("No recipes found to save to TypeScript format")
