import requests
from bs4 import BeautifulSoup
import time
import json
from urllib.parse import urljoin, urlparse
import re
from datetime import datetime
from collections import defaultdict

class ImprovedSmittenKitchenScraper:
    def __init__(self, debug=False, verbose=False):
        self.base_url = "https://smittenkitchen.com"
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
            print(f"[DEBUG] Initialized scraper with base_url: {self.base_url}")
            print(f"[DEBUG] User-Agent: {self.session.headers['User-Agent']}")
    
    def get_category_urls(self):
        """Get all available recipe categories from the main recipes page"""
        url = urljoin(self.base_url, "/recipes/")
        
        if self.debug:
            print(f"[DEBUG] Fetching categories from: {url}")
        
        try:
            response = self.session.get(url)
            if self.debug:
                print(f"[DEBUG] Response status: {response.status_code}")
                print(f"[DEBUG] Response headers: {dict(response.headers)}")
            
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            if self.debug:
                print(f"[DEBUG] Page title: {soup.title.string if soup.title else 'No title found'}")
                print(f"[DEBUG] Total links found: {len(soup.find_all('a', href=True))}")
            
            categories = {}
            category_links = soup.find_all('a', href=True)
            
            if self.verbose:
                print(f"[VERBOSE] Found {len(category_links)} total links")
            
            for i, link in enumerate(category_links):
                href = link.get('href')
                text = link.get_text().strip()
                
                if self.verbose and i < 50:  # Show first 50 links for debugging
                    print(f"[VERBOSE] Link {i}: href='{href}', text='{text}'")
                
                if href and '/recipes/' in href and text:
                    if self.debug:
                        print(f"[DEBUG] Checking link: href='{href}', text='{text}'")
                    # Look for pattern like "Breakfast 148" or "Vegetarian 370"
                    match = re.search(r'([A-Za-z\s/\-]+)(\d+)', text)
                    if match:
                        category_name = match.group(1).strip()
                        recipe_count = int(match.group(2))
                        if self.debug:
                            print(f"[DEBUG] Pattern match: '{category_name}' with {recipe_count} recipes")
                        # Only include categories with reasonable recipe counts (more than 1)
                        if recipe_count > 1:
                            categories[category_name] = {
                                'url': href,
                                'count': recipe_count
                            }
                        if self.debug:
                                print(f"[DEBUG] Added category: '{category_name}' with {recipe_count} recipes at {href}")
                        else:
                            if self.debug:
                                print(f"[DEBUG] Skipped category '{category_name}' with only {recipe_count} recipes")
                    else:
                        if self.debug and '/recipes/' in href:
                            print(f"[DEBUG] No pattern match for: '{text}'")
            
            if self.debug:
                print(f"[DEBUG] Total categories found: {len(categories)}")
                for name, info in categories.items():
                    print(f"[DEBUG]   - {name}: {info['count']} recipes")
            
            return categories
            
        except requests.RequestException as e:
            print(f"[ERROR] Error fetching categories: {e}")
            if self.debug:
                print(f"[DEBUG] Exception type: {type(e)}")
                print(f"[DEBUG] Exception details: {str(e)}")
            return {}
    
    def build_recipe_category_mapping(self, categories, max_recipes_per_category=20):
        """
        Build a comprehensive mapping of recipes to their categories
        This is the key to multi-preference matching!
        """
        print("Building recipe-to-category mapping...")
        
        for cat_name, cat_info in categories.items():
            print(f"Mapping recipes in: {cat_name}")
            
            # Get recipe URLs from this category
            recipe_urls = self.get_recipes_from_category_page(
                cat_info['url'], 
                max_recipes_per_category
            )
            
            # Add this category to each recipe's category set
            for recipe_url in recipe_urls:
                self.recipe_categories[recipe_url].add(cat_name.lower())
            
            # Small delay to be respectful
            time.sleep(0.5)
        
        print(f"Mapped {len(self.recipe_categories)} recipes across categories")
        return self.recipe_categories
    
    def search_recipes_by_preferences_v2(self, preferences, max_recipes=10, require_all_preferences=True):
        """
        Advanced search that finds recipes matching multiple preferences
        
        preferences = {
            'dietary_restrictions': ['vegetarian'],
            'meal_type': ['breakfast'],
            'cooking_time': ['quick']
        }
        
        require_all_preferences: If True, recipes must match ALL preferences
                               If False, recipes matching ANY preference are included
        """
        print("=== MULTI-PREFERENCE SEARCH ===")
        print(f"Looking for recipes matching: {preferences}")
        print(f"Require all preferences: {require_all_preferences}")
        
        # Get categories and build mapping if not done yet
        categories = self.get_category_urls()
        if not self.recipe_categories:
            self.build_recipe_category_mapping(categories, max_recipes_per_category=15)
        
        # Convert preferences to searchable terms
        search_terms = self._extract_search_terms(preferences)
        print(f"Search terms: {search_terms}")
        
        # Find recipes that match preferences
        matching_recipes = self._find_multi_preference_matches(
            search_terms, 
            require_all_preferences
        )
        
        print(f"Found {len(matching_recipes)} recipes matching criteria")
        
        # Scrape detailed info for top matches
        detailed_recipes = []
        for recipe_url in matching_recipes[:max_recipes]:
            print(f"Scraping details for: {recipe_url}")
            
            if recipe_url in self.recipe_cache:
                recipe_data = self.recipe_cache[recipe_url]
            else:
                recipe_data = self.scrape_single_recipe(recipe_url)
                if recipe_data:
                    self.recipe_cache[recipe_url] = recipe_data
            
            if recipe_data:
                # Add category information to recipe data
                recipe_data['matched_categories'] = list(self.recipe_categories[recipe_url])
                recipe_data['preference_score'] = self._calculate_preference_score(
                    recipe_url, search_terms
                )
                detailed_recipes.append(recipe_data)
            
            time.sleep(1)  # Be respectful
        
        # Sort by preference score (best matches first)
        detailed_recipes.sort(key=lambda x: x['preference_score'], reverse=True)
        
        return detailed_recipes
    
    def _extract_search_terms(self, preferences):
        """Convert user preferences to category search terms"""
        search_terms = []
        
        # Mapping of preference types to category keywords
        preference_mappings = {
            'dietary_restrictions': {
                'vegetarian': ['vegetarian', 'veggie'],
                'vegan': ['vegan'],
                'gluten-free': ['gluten-free', 'gf'],
                'dairy-free': ['dairy-free'],
                'low-carb': ['low-carb', 'keto']
            },
            'meal_type': {
                'breakfast': ['breakfast', 'brunch'],
                'lunch': ['lunch'],
                'dinner': ['dinner'],
                'snack': ['snack', 'appetizer'],
                'dessert': ['dessert', 'sweet']
            },
            'cooking_time': {
                'quick': ['quick', 'weeknight', 'easy'],
                'slow': ['slow', 'braiser', 'project']
            },
            'course': {
                'pasta': ['pasta'],
                'salad': ['salad'],
                'soup': ['soup'],
                'bread': ['bread'],
                'pizza': ['pizza']
            },
            'cuisine': {
                'italian': ['italian'],
                'french': ['french'],
                'asian': ['chinese', 'japanese', 'thai', 'vietnamese'],
                'mexican': ['tex-mex', 'mexican'],
                'indian': ['indian'],
                'middle eastern': ['middle eastern', 'israeli']
            },
            'ingredients': {
                'chicken': ['chicken'],
                'beef': ['beef'],
                'pork': ['pork'],
                'seafood': ['seafood'],
                'vegetables': ['vegetable'],
                'cheese': ['cheese'],
                'chocolate': ['chocolate']
            }
        }
        
        for pref_type, pref_values in preferences.items():
            if isinstance(pref_values, str):
                pref_values = [pref_values]
            
            for value in pref_values:
                value_lower = value.lower()
                
                # Get mapped terms for this preference
                if pref_type in preference_mappings:
                    mapping = preference_mappings[pref_type]
                    if value_lower in mapping:
                        search_terms.extend(mapping[value_lower])
                    else:
                        # If no specific mapping, use the value itself
                        search_terms.append(value_lower)
                else:
                    search_terms.append(value_lower)
        
        return list(set(search_terms))  # Remove duplicates
    
    def _find_multi_preference_matches(self, search_terms, require_all=True):
        """Find recipes that match multiple search terms"""
        recipe_matches = defaultdict(int)
        
        # Count how many search terms each recipe matches
        for recipe_url, categories in self.recipe_categories.items():
            categories_text = ' '.join(categories).lower()
            
            matches = 0
            for term in search_terms:
                if term in categories_text:
                    matches += 1
            
            if require_all:
                # Recipe must match ALL search terms
                if matches == len(search_terms):
                    recipe_matches[recipe_url] = matches
            else:
                # Recipe must match AT LEAST ONE search term
                if matches > 0:
                    recipe_matches[recipe_url] = matches
        
        # Sort by number of matches (best first)
        sorted_matches = sorted(
            recipe_matches.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        return [url for url, score in sorted_matches]
    
    def _calculate_preference_score(self, recipe_url, search_terms):
        """Calculate how well a recipe matches the search terms"""
        if recipe_url not in self.recipe_categories:
            return 0
        
        categories = self.recipe_categories[recipe_url]
        categories_text = ' '.join(categories).lower()
        
        score = 0
        for term in search_terms:
            if term in categories_text:
                # Exact category match gets higher score
                if any(term == cat.lower() for cat in categories):
                    score += 10
                else:
                    score += 5
        
        return score
    
    def get_recipes_from_category_page(self, category_url, max_recipes=10):
        """Get recipe URLs from a category page"""
        url = urljoin(self.base_url, category_url)
        
        if self.debug:
            print(f"[DEBUG] Fetching recipes from category: {url}")
        
        try:
            response = self.session.get(url)
            if self.debug:
                print(f"[DEBUG] Category page response status: {response.status_code}")
            
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            if self.debug:
                print(f"[DEBUG] Category page title: {soup.title.string if soup.title else 'No title found'}")
            
            recipe_urls = []
            links = soup.find_all('a', href=True)
            
            if self.debug:
                print(f"[DEBUG] Found {len(links)} total links on category page")
            
            recipe_pattern_matches = 0
            for i, link in enumerate(links):
                href = link.get('href')
                if href and re.search(r'/20\d{2}/\d{2}/', href):
                    recipe_pattern_matches += 1
                    full_url = urljoin(self.base_url, href)
                    if full_url not in recipe_urls:
                        recipe_urls.append(full_url)
                        if self.verbose:
                            print(f"[VERBOSE] Found recipe URL: {full_url}")
                        if len(recipe_urls) >= max_recipes:
                            break
            
            if self.debug:
                print(f"[DEBUG] Recipe pattern matches: {recipe_pattern_matches}")
                print(f"[DEBUG] Unique recipe URLs found: {len(recipe_urls)}")
                if self.verbose and recipe_urls:
                    print(f"[VERBOSE] First few recipe URLs:")
                    for i, recipe_url in enumerate(recipe_urls[:3]):
                        print(f"[VERBOSE]   {i+1}. {recipe_url}")
            
            return recipe_urls
            
        except requests.RequestException as e:
            print(f"[ERROR] Error fetching category page {category_url}: {e}")
            if self.debug:
                print(f"[DEBUG] Exception type: {type(e)}")
                print(f"[DEBUG] Exception details: {str(e)}")
            return []
    
    def scrape_single_recipe(self, recipe_url):
        """Scrape detailed information from a single recipe page"""
        if self.debug:
            print(f"[DEBUG] Scraping single recipe: {recipe_url}")
        
        try:
            response = self.session.get(recipe_url)
            if self.debug:
                print(f"[DEBUG] Recipe page response status: {response.status_code}")
            
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            if self.debug:
                print(f"[DEBUG] Recipe page title: {soup.title.string if soup.title else 'No title found'}")
            
            # Enhanced recipe data with category detection
            recipe_data = {
                'url': recipe_url,
                'title': self._extract_title(soup),
                'description': self._extract_description(soup),
                'metadata': self._extract_recipe_metadata(soup),
                'notes': self._extract_recipe_notes(soup),
                'ingredients': self._extract_ingredients(soup),
                'instructions': self._extract_instructions(soup),
                'detected_tags': self._detect_recipe_characteristics(soup),
                'scraped_at': datetime.now().isoformat()
            }
            
            if self.debug:
                print(f"[DEBUG] Extracted recipe data:")
                print(f"[DEBUG]   Title: {recipe_data['title']}")
                print(f"[DEBUG]   Description length: {len(recipe_data['description'])}")
                print(f"[DEBUG]   Metadata: {recipe_data['metadata']}")
                print(f"[DEBUG]   Notes length: {len(recipe_data['notes'])}")
                print(f"[DEBUG]   Ingredients count: {len(recipe_data['ingredients'])}")
                print(f"[DEBUG]   Instructions count: {len(recipe_data['instructions'])}")
                print(f"[DEBUG]   Detected tags: {recipe_data['detected_tags']}")
            
            return recipe_data
            
        except requests.RequestException as e:
            print(f"[ERROR] Error fetching recipe {recipe_url}: {e}")
            if self.debug:
                print(f"[DEBUG] Exception type: {type(e)}")
                print(f"[DEBUG] Exception details: {str(e)}")
            return None
    
    def _detect_recipe_characteristics(self, soup):
        """Detect recipe characteristics from content for better matching"""
        text_content = soup.get_text().lower()
        detected_tags = []
        
        # Dietary characteristics
        if any(term in text_content for term in ['vegetarian', 'no meat', 'meatless']):
            detected_tags.append('vegetarian')
        if any(term in text_content for term in ['vegan', 'no dairy', 'no eggs']):
            detected_tags.append('vegan')
        if any(term in text_content for term in ['gluten-free', 'gluten free', 'no gluten']):
            detected_tags.append('gluten-free')
        
        # Meal timing
        if any(term in text_content for term in ['breakfast', 'morning', 'brunch']):
            detected_tags.append('breakfast')
        if any(term in text_content for term in ['lunch', 'midday']):
            detected_tags.append('lunch')
        if any(term in text_content for term in ['dinner', 'evening', 'supper']):
            detected_tags.append('dinner')
        
        # Cooking time/difficulty
        if any(term in text_content for term in ['quick', 'easy', 'simple', '20 minutes', '30 minutes']):
            detected_tags.append('quick')
        if any(term in text_content for term in ['weekend project', 'advanced', 'time-consuming']):
            detected_tags.append('project')
        
        return detected_tags
    
    def _extract_title(self, soup):
        """Extract recipe title"""
        title_selectors = ['h1.entry-title', 'h1', '.post-title', 'title']
        
        for selector in title_selectors:
            element = soup.select_one(selector)
            if element:
                title = element.get_text().strip()
                title = re.sub(r'\s*–\s*smitten kitchen.*$', '', title, flags=re.IGNORECASE)
                return title
        return "Unknown Title"
    
    def _extract_description(self, soup):
        """Extract recipe description - everything before the recipe notes"""
        # Find the recipe notes div (this comes before ingredients)
        notes_div = soup.find('div', class_='jetpack-recipe-notes')
        
        if notes_div:
            # Get all content before the notes div
            description_parts = []
            
            # Get all elements before the notes div
            all_elements = soup.find_all()
            notes_index = -1
            
            for i, element in enumerate(all_elements):
                if element == notes_div:
                    notes_index = i
                    break
            
            if notes_index != -1:
                # Get elements before the notes div
                elements_before = all_elements[:notes_index]
                
                # Extract text from paragraphs before notes
                for element in elements_before:
                    if element.name == 'p':
                        text = element.get_text().strip()
                        if len(text) > 50:  # Substantial text
                            # Skip navigation/footer content
                            if not any(skip_word in text.lower() for skip_word in [
                                'search', 'subscribe', 'newsletter', 'follow', 'social', 'copyright', 'privacy', 'terms'
                            ]):
                                description_parts.append(text)
            
            # Join all description parts and format with line breaks
            if description_parts:
                return '\n\n'.join(description_parts)
        
        # Fallback to old method if jetpack structure not found
        paragraphs = soup.find_all('p')
        for p in paragraphs[:3]:
            text = p.get_text().strip()
            if len(text) > 50:
                return text
        return ""
    
    def _extract_recipe_metadata(self, soup):
        """Extract recipe metadata (servings, time, source)"""
        metadata = {
            'servings': None,
            'time': None,
            'source': None
        }
        
        # Look for the recipe meta div
        meta_div = soup.find('ul', class_='jetpack-recipe-meta')
        
        if meta_div:
            # Extract servings
            servings_elem = meta_div.find('li', class_='jetpack-recipe-servings')
            if servings_elem:
                servings_text = servings_elem.get_text().strip()
                # Extract number from "Servings: 4"
                servings_match = re.search(r'(\d+)', servings_text)
                if servings_match:
                    metadata['servings'] = int(servings_match.group(1))
            
            # Extract time
            time_elem = meta_div.find('li', class_='jetpack-recipe-time')
            if time_elem:
                time_text = time_elem.get_text().strip()
                # Extract time from "Time: 20 minutes"
                time_match = re.search(r'Time:\s*(.+)', time_text, re.I)
                if time_match:
                    metadata['time'] = time_match.group(1).strip()
            
            # Extract source
            source_elem = meta_div.find('li', class_='jetpack-recipe-source')
            if source_elem:
                source_text = source_elem.get_text().strip()
                # Extract source from "Source: Smitten Kitchen"
                source_match = re.search(r'Source:\s*(.+)', source_text, re.I)
                if source_match:
                    metadata['source'] = source_match.group(1).strip()
        
        return metadata
    
    def _extract_recipe_notes(self, soup):
        """Extract recipe notes from jetpack-recipe-notes"""
        notes_div = soup.find('div', class_='jetpack-recipe-notes')
        
        if notes_div:
            notes_text = notes_div.get_text().strip()
            # Format notes with line breaks for better readability
            if notes_text:
                return notes_text.replace('\n', '\n\n')
        
        return ""
    
    def _extract_ingredients(self, soup):
        """Extract ingredients list from jetpack-recipe-ingredients"""
        ingredients = []
        
        # Look for the jetpack-recipe-ingredients div
        ingredients_div = soup.find('div', class_='jetpack-recipe-ingredients')
        
        if ingredients_div:
            # Extract ingredients from the structured list
            ingredient_items = ingredients_div.find_all('li', class_=re.compile(r'ingredient', re.I))
            
            for item in ingredient_items:
                text = item.get_text().strip()
                if text and len(text) > 3:
                    ingredients.append(text)
        
        # Fallback to old method if jetpack structure not found
        if not ingredients:
            # First, try to find ingredients in structured HTML
            ingredient_divs = soup.find_all('div', class_=re.compile(r'ingredient', re.I))
            if ingredient_divs:
                for div in ingredient_divs:
                    # Look for list items within ingredient divs
                    items = div.find_all('li')
                    for item in items:
                        text = item.get_text().strip()
                        if text and len(text) > 3:
                            ingredients.append(text)
            
            # If still no ingredients found, try text-based extraction
        if not ingredients:
        text_content = soup.get_text()
        lines = text_content.split('\n')
        
        ingredient_section = False
        for line in lines:
            line = line.strip()
            
                    if any(keyword in line.lower() for keyword in ['ingredients:', 'what you need:', 'ingredient list']):
                ingredient_section = True
                continue
            
                    if any(keyword in line.lower() for keyword in ['instructions:', 'directions:', 'method:', 'how to make']):
                break
            
            if ingredient_section and line:
                        # More flexible ingredient pattern matching
                if (re.match(r'^[-•]\s*\d+.*', line) or 
                    re.match(r'^\d+.*', line) or
                            re.match(r'^([\d/\s]+\s*(cup|cups|tsp|tbsp|pound|lb|oz|grams?|kg|ml|liter)\s+)', line) or
                            re.match(r'^[A-Za-z].*', line)):  # Any line starting with a letter
                            if len(line) > 3:  # Avoid very short lines
                    ingredients.append(line)
        
        if self.debug:
            print(f"[DEBUG] Extracted {len(ingredients)} ingredients")
            if ingredients:
                print(f"[DEBUG] First ingredient: {ingredients[0]}")
        
        return ingredients
    
    def _extract_instructions(self, soup):
        """Extract cooking instructions from jetpack-recipe-directions"""
        instructions = []
        
        # Look for the jetpack-recipe-directions div
        directions_div = soup.find('div', class_='jetpack-recipe-directions')
        
        if directions_div:
            # Extract instructions from the structured directions div
            instruction_items = directions_div.find_all(['p', 'li'])
            
            for item in instruction_items:
                text = item.get_text().strip()
                if text and len(text) > 20:  # Substantial text
                    instructions.append(text)
        
        # Fallback: if no structured directions found, use the old method
        if not instructions:
            # Find the ingredients div
            ingredients_div = soup.find('div', class_='jetpack-recipe-ingredients')
            
            if ingredients_div:
                # Get all content after the ingredients div
                all_elements = soup.find_all()
                ingredients_index = -1
                
                for i, element in enumerate(all_elements):
                    if element == ingredients_div:
                        ingredients_index = i
                        break
                
                if ingredients_index != -1:
                    # Get elements after the ingredients div
                    elements_after = all_elements[ingredients_index + 1:]
                    
                    # Extract text from paragraphs after ingredients
                    for element in elements_after:
                        if element.name == 'p':
                            text = element.get_text().strip()
                            
                            # Skip very short text
                            if len(text) < 50:
                                continue
                            
                            # Skip text that looks like navigation, ads, or footer content
                            if any(skip_word in text.lower() for skip_word in [
                                'search', 'subscribe', 'newsletter', 'follow', 'social', 'copyright', 'privacy', 'terms', 
                                'advertisement', 'sponsored', 'affiliate', 'shop', 'buy now', 'click here',
                                'months ago:', 'years ago:', 'your email', 'required fields', 'will not be published',
                                'comment', 'reply', 'posted', 'says:', 'wrote:', 'thanks', 'thank you', 'deb!', 'deb,', 'hi deb', 'hey deb'
                            ]):
                                continue
                            
                            # Skip text that looks like comments or personal notes
                            if any(comment_word in text.lower() for comment_word in [
                                'i made', 'i used', 'i added', 'i think', 'i agree', 'i disagree', 'i love this', 'this was', 
                                'delicious!', 'fantastic!', 'amazing!', 'perfect!', 'great recipe', 'will definitely', 
                                'going to make', 'next time', 'made this', 'i live', 'i have', 'i am', 'i was',
                                'what would be', 'any chance', 'not me', 'silk makes', 'this looks', 'i\'m curious',
                                'i find', 'i blend', 'vitamix', 'so i can', 'it\'s amazing', 'would kill me',
                                'you can really', 'might even be', 'worth trying', 'celiac here'
                            ]):
                                continue
                            
                            # This looks like an instruction paragraph
                            instructions.append(text)
        
        # Fallback to old method if jetpack structure not found
        if not instructions:
            # First, try to find instructions in structured HTML
            instruction_divs = soup.find_all('div', class_=re.compile(r'instruction|direction|method', re.I))
            if instruction_divs:
                for div in instruction_divs:
                    # Look for paragraphs or list items within instruction divs
                    items = div.find_all(['p', 'li'])
                    for item in items:
                        text = item.get_text().strip()
                        if text and len(text) > 20:
                            instructions.append(text)
            
            # If still no instructions found, use the old approach
            if not instructions:
                # Find all paragraphs in the main content area
                paragraphs = soup.find_all('p')
                
                # Look for substantial text blocks that contain cooking verbs
                cooking_verbs = ['heat', 'mix', 'add', 'bake', 'cook', 'stir', 'combine', 'whisk', 'fold', 'pour', 'place', 'put', 'set', 'let', 'allow', 'remove', 'serve', 'bring', 'simmer', 'boil', 'sauté', 'fry', 'roast', 'grill', 'blend', 'chop', 'slice', 'dice', 'mince', 'grate', 'season', 'taste', 'adjust', 'cover', 'uncover', 'drain', 'rinse', 'pat', 'dry', 'melt', 'cool', 'warm', 'preheat', 'reduce', 'increase', 'turn', 'flip', 'toss', 'garnish', 'sprinkle', 'drizzle', 'brush', 'spread', 'layer', 'arrange', 'divide', 'transfer', 'return', 'continue', 'finish', 'complete']
                
                # Look for paragraphs that are substantial and contain cooking verbs
                for p in paragraphs:
                    text = p.get_text().strip()
                    
                    # Skip very short text or text that looks like navigation/footer
                    if len(text) < 50:
                        continue
                    
                    # Skip text that looks like navigation, ads, or footer content
                    if any(skip_word in text.lower() for skip_word in ['search', 'subscribe', 'newsletter', 'follow', 'social', 'copyright', 'privacy', 'terms', 'advertisement', 'sponsored', 'affiliate', 'shop', 'buy now', 'click here']):
                        continue
                    
                    # Skip text that's clearly not instructions
                    if any(skip_word in text.lower() for skip_word in [
                        'ingredients:', 'what you need:', 'serves', 'makes', 'prep time', 'cook time', 'total time', 'difficulty',
                        'until recently', 'i was', 'i find', 'i hope', 'i love', 'i think', 'i can', 'i have', 'i am', 'i will', 'i would', 'i should', 'i could', 'i might', 'i may', 'i must', 'i need', 'i want', 'i like', 'i prefer', 'i recommend', 'i suggest', 'i believe', 'i feel', 'i know', 'i understand', 'i realize', 'i notice', 'i see', 'i hear', 'i smell', 'i taste', 'i touch', 'i feel',
                        'months ago:', 'years ago:', 'your email', 'required fields', 'will not be published', 'made this', 'i made', 'i used', 'i added', 'i think', 'i agree', 'i disagree', 'i love this', 'this was', 'delicious!', 'fantastic!', 'amazing!', 'perfect!', 'great recipe', 'will definitely', 'going to make', 'next time', 'i will', 'i would', 'i should', 'i could', 'i might', 'i may', 'i must', 'i need', 'i want', 'i like', 'i prefer', 'i recommend', 'i suggest', 'i believe', 'i feel', 'i know', 'i understand', 'i realize', 'i notice', 'i see', 'i hear', 'i smell', 'i taste', 'i touch', 'i feel',
                        'comment', 'reply', 'posted', 'says:', 'wrote:', 'thanks', 'thank you', 'deb!', 'deb,', 'hi deb', 'hey deb'
                    ]):
                        continue
                    
                    # Skip text that looks like ingredient lists (contains measurements)
                    if re.search(r'\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|ml|liter|ounce)', text.lower()):
                        continue
                    
                    # Check if this paragraph contains cooking verbs
                    text_lower = text.lower()
                    if any(verb in text_lower for verb in cooking_verbs):
                        # Additional check: skip if it looks like a comment or personal note
                        if any(comment_word in text_lower for comment_word in [
                            'i made', 'i used', 'i added', 'i think', 'i agree', 'i disagree', 'i love this', 'this was', 'delicious!', 'fantastic!', 'amazing!', 'perfect!', 'great recipe', 'will definitely', 'going to make', 'next time', 'i will', 'i would', 'i should', 'i could', 'i might', 'i may', 'i must', 'i need', 'i want', 'i like', 'i prefer', 'i recommend', 'i suggest', 'i believe', 'i feel', 'i know', 'i understand', 'i realize', 'i notice', 'i see', 'i hear', 'i smell', 'i taste', 'i touch', 'i feel',
                            'made this', 'i made', 'i used', 'i added', 'i think', 'i agree', 'i disagree', 'i love this', 'this was', 'delicious!', 'fantastic!', 'amazing!', 'perfect!', 'great recipe', 'will definitely', 'going to make', 'next time', 'i will', 'i would', 'i should', 'i could', 'i might', 'i may', 'i must', 'i need', 'i want', 'i like', 'i prefer', 'i recommend', 'i suggest', 'i believe', 'i feel', 'i know', 'i understand', 'i realize', 'i notice', 'i see', 'i hear', 'i smell', 'i taste', 'i touch', 'i feel',
                            'comment', 'reply', 'posted', 'says:', 'wrote:', 'thanks', 'thank you', 'deb!', 'deb,', 'hi deb', 'hey deb', 'i live', 'i have', 'i am', 'i was', 'i will', 'i would', 'i should', 'i could', 'i might', 'i may', 'i must', 'i need', 'i want', 'i like', 'i prefer', 'i recommend', 'i suggest', 'i believe', 'i feel', 'i know', 'i understand', 'i realize', 'i notice', 'i see', 'i hear', 'i smell', 'i taste', 'i touch', 'i feel'
                        ]):
                            continue
                        
                        # This looks like an instruction paragraph
                        instructions.append(text)
        
        if self.debug:
            print(f"[DEBUG] Extracted {len(instructions)} instructions")
            if instructions:
                print(f"[DEBUG] First instruction: {instructions[0][:100]}...")
        
        return instructions
    
    def save_mapping_cache(self, filename="recipe_category_mapping.json"):
        """Save the recipe-category mapping for future use"""
        mapping_data = {
            'recipe_categories': {url: list(cats) for url, cats in self.recipe_categories.items()},
            'cached_at': datetime.now().isoformat()
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(mapping_data, f, indent=2, ensure_ascii=False)
        
        print(f"Recipe-category mapping saved to {filename}")
    
    def save_recipes_to_file(self, recipes, filename="scraped_recipes.json"):
        """Save scraped recipes to a JSON file"""
        recipes_data = {
            'recipes': recipes,
            'total_count': len(recipes),
            'saved_at': datetime.now().isoformat()
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(recipes_data, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(recipes)} recipes to {filename}")
    
    def save_recipe_cache(self, filename="recipe_cache.json"):
        """Save the in-memory recipe cache to a file"""
        cache_data = {
            'recipe_cache': self.recipe_cache,
            'total_recipes': len(self.recipe_cache),
            'cached_at': datetime.now().isoformat()
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(self.recipe_cache)} cached recipes to {filename}")
    
    def load_recipe_cache(self, filename="recipe_cache.json"):
        """Load previously cached recipes from a file"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                cache_data = json.load(f)
            
            self.recipe_cache = cache_data.get('recipe_cache', {})
            print(f"Loaded {len(self.recipe_cache)} cached recipes from {filename}")
            return True
            
        except FileNotFoundError:
            print(f"No cached recipes found at {filename}")
            return False
    
    def load_mapping_cache(self, filename="recipe_category_mapping.json"):
        """Load previously saved recipe-category mapping"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                mapping_data = json.load(f)
            
            self.recipe_categories = defaultdict(set)
            for url, cats in mapping_data['recipe_categories'].items():
                self.recipe_categories[url] = set(cats)
            
            print(f"Loaded mapping for {len(self.recipe_categories)} recipes from {filename}")
            return True
            
        except FileNotFoundError:
            print(f"No cached mapping found at {filename}")
            return False

# Example usage
if __name__ == "__main__":
    # Enable debugging for troubleshooting
    scraper = ImprovedSmittenKitchenScraper(debug=True, verbose=True)
    
    # Try to load cached mapping first (saves time)
    if not scraper.load_mapping_cache():
        print("Building fresh recipe-category mapping...")
        categories = scraper.get_category_urls()
        if categories:
        scraper.build_recipe_category_mapping(categories, max_recipes_per_category=10)
        scraper.save_mapping_cache()
        else:
            print("[ERROR] No categories found! Check the website structure.")
    
    print("\n" + "="*60)
    print("=== TESTING MULTI-PREFERENCE MATCHING ===")
    
    # Test 1: Vegetarian AND Breakfast (your example)
    print("\n--- Test 1: Vegetarian AND Breakfast ---")
    preferences1 = {
        'dietary_restrictions': ['vegetarian'],
        'meal_type': ['breakfast']
    }
    
    recipes1 = scraper.search_recipes_by_preferences_v2(
        preferences1, 
        max_recipes=5, 
        require_all_preferences=True
    )
    
    print(f"\nFound {len(recipes1)} vegetarian breakfast recipes:")
    for recipe in recipes1:
        print(f"  • {recipe['title']}")
        print(f"    Categories: {recipe['matched_categories']}")
        print(f"    Score: {recipe['preference_score']}")
    
    # Test 2: Quick AND Italian (must match both)
    print("\n--- Test 2: Quick AND Italian ---")
    preferences2 = {
        'cooking_time': ['quick'],
        'cuisine': ['italian']
    }
    
    recipes2 = scraper.search_recipes_by_preferences_v2(
        preferences2,
        max_recipes=5,
        require_all_preferences=True
    )
    
    print(f"\nFound {len(recipes2)} quick Italian recipes:")
    for recipe in recipes2:
        print(f"  • {recipe['title']}")
        print(f"    Categories: {recipe['matched_categories']}")
    
    # Test 3: Any pasta OR salad (match either)
    print("\n--- Test 3: Pasta OR Salad ---")
    preferences3 = {
        'course': ['pasta', 'salad']
    }
    
    recipes3 = scraper.search_recipes_by_preferences_v2(
        preferences3,
        max_recipes=5,
        require_all_preferences=False  # Match ANY preference
    )
    
    print(f"\nFound {len(recipes3)} pasta or salad recipes:")
    for recipe in recipes3:
        print(f"  • {recipe['title']}")
        print(f"    Categories: {recipe['matched_categories']}")