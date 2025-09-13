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
                'image': self._extract_recipe_image(soup),
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
                print(f"[DEBUG]   Image: {recipe_data['image']}")
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
    
    def _extract_recipe_image(self, soup):
        """Extract recipe image from post-thumbnail-container div"""
        # Look for the post-thumbnail-container div
        thumbnail_div = soup.find('div', class_='post-thumbnail-container')
        
        if thumbnail_div:
            # Look for img tag within the thumbnail container
            img_tag = thumbnail_div.find('img')
            if img_tag:
                # Get the src attribute
                img_src = img_tag.get('src')
                if img_src:
                    # Convert relative URLs to absolute URLs
                    if img_src.startswith('//'):
                        img_src = 'https:' + img_src
                    elif img_src.startswith('/'):
                        img_src = self.base_url + img_src
                    return img_src
        
        return None
    
    def _extract_description(self, soup):
        """Extract recipe description - all text before the hrecipe div"""
        # Find the main recipe div
        recipe_div = soup.find('div', class_='hrecipe h-recipe jetpack-recipe')
        
        if recipe_div:
            description_parts = []
            
            # Get all elements before the recipe div
            all_elements = soup.find_all()
            recipe_index = -1
            
            for i, element in enumerate(all_elements):
                if element == recipe_div:
                    recipe_index = i
                    break
            
            if recipe_index != -1:
                # Get elements before the recipe div
                elements_before = all_elements[:recipe_index]
                
                # Track if we're in a "Previously" section to skip
                in_previously_section = False
                
                # Extract text from paragraphs before recipe
                for element in elements_before:
                    # Check if this is a "Previously" h5 tag
                    if element.name == 'h5' and 'previously' in element.get_text().lower():
                        in_previously_section = True
                        continue
                    
                    # Check if we're exiting a "Previously" section (new h5 or other major element)
                    if in_previously_section and element.name in ['h1', 'h2', 'h3', 'h4', 'h5']:
                        in_previously_section = False
                    
                    # Skip all content while in "Previously" section
                    if in_previously_section:
                        continue
                    
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
        
        # Fallback to old method if hrecipe structure not found
        paragraphs = soup.find_all('p')
        for p in paragraphs[:3]:
            text = p.get_text().strip()
            if len(text) > 50:
                return text
        return ""
    
    def _extract_recipe_metadata(self, soup):
        """Extract recipe metadata (servings, time, source) from jetpack-recipe-meta or blog post text"""
        metadata = {
            'servings': None,
            'time': None,
            'source': None
        }
        
        # Look for the recipe meta ul
        meta_ul = soup.find('ul', class_='jetpack-recipe-meta')
        
        if meta_ul:
            # Extract all metadata items
            meta_items = meta_ul.find_all('li')
            
            for item in meta_items:
                text = item.get_text().strip()
                
                # Extract servings
                if 'serving' in text.lower():
                    servings_match = re.search(r'(\d+)', text)
                    if servings_match:
                        metadata['servings'] = int(servings_match.group(1))
                
                # Extract time
                elif 'time' in text.lower():
                    time_match = re.search(r'Time:\s*(.+)', text, re.I)
                    if time_match:
                        metadata['time'] = time_match.group(1).strip()
                
                # Extract source
                elif 'source' in text.lower():
                    source_match = re.search(r'Source:\s*(.+)', text, re.I)
                    if source_match:
                        metadata['source'] = source_match.group(1).strip()
        
        # If no structured metadata found, try to extract from blog post text
        if not any(metadata.values()):
            # Get main content area
            main_content = soup.find('div', class_='entry-content') or soup.find('article') or soup.find('main')
            if main_content:
                text_content = main_content.get_text()
                lines = text_content.split('\n')
                
                for line in lines:
                    line = line.strip()
                    
                    # Look for servings information
                    if 'serves' in line.lower() or 'serving' in line.lower():
                        servings_match = re.search(r'serves?\s*(\d+)', line, re.I)
                        if servings_match:
                            metadata['servings'] = int(servings_match.group(1))
                    
                    # Look for time information
                    elif any(time_word in line.lower() for time_word in ['minutes', 'hours', 'time:', 'prep', 'cook']):
                        if re.search(r'\d+\s*(minute|hour|min|hr)', line, re.I):
                            metadata['time'] = line.strip()
                    
                    # Look for source information
                    elif 'adapted from' in line.lower() or 'source:' in line.lower():
                        metadata['source'] = line.strip()
        
        return metadata
    
    def _extract_recipe_notes(self, soup):
        """Extract recipe notes from jetpack-recipe-notes div"""
        notes_div = soup.find('div', class_='jetpack-recipe-notes')
        
        if notes_div:
            notes_text = notes_div.get_text().strip()
            # Format notes with line breaks for better readability
            if notes_text:
                return notes_text.replace('\n', '\n\n')
        
        return ""
    
    def _extract_ingredients(self, soup):
        """Extract ingredients list from jetpack-recipe-ingredients div or blog post text"""
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
            
            # If still no ingredients found, try text-based extraction from blog post
            if not ingredients:
                # Get main content area
                main_content = soup.find('div', class_='entry-content') or soup.find('article') or soup.find('main')
                if main_content:
                    text_content = main_content.get_text()
                    lines = text_content.split('\n')
                    
                    # Find recipe boundaries - look for common recipe section markers
                    recipe_start = -1
                    recipe_end = -1
                    
                    for i, line in enumerate(lines):
                        line_lower = line.strip().lower()
                        # Look for recipe start markers
                        if any(marker in line_lower for marker in ['serves', 'makes', 'ingredients:', 'directions:', 'instructions:', 'method:']):
                            recipe_start = i
                            break
                    
                    # If no clear start found, look for measurement patterns
                    if recipe_start == -1:
                        for i, line in enumerate(lines):
                            if re.search(r'\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|teaspoon|tablespoon)', line, re.I):
                                recipe_start = i
                                break
                    
                    # Look for recipe end markers
                    if recipe_start != -1:
                        for i in range(recipe_start + 1, len(lines)):
                            line_lower = lines[i].strip().lower()
                            if any(end_marker in line_lower for end_marker in ['your email', 'required fields', 'comment', 'reply', 'posted', 'says:', 'wrote:']):
                                recipe_end = i
                                break
                    
                    # Extract ingredients from recipe section
                    start_idx = max(0, recipe_start) if recipe_start != -1 else 0
                    end_idx = recipe_end if recipe_end != -1 else len(lines)
                    
                    for i in range(start_idx, end_idx):
                        line = lines[i].strip()
                        
                        # Skip empty lines and very short lines
                        if len(line) < 5:
                            continue
                        
                        # Skip blog content markers
                        if any(skip_word in line.lower() for skip_word in [
                            'years ago:', 'months ago:', 'one year ago:', 'two years ago:', 'three years ago:',
                            'eight years ago:', 'and i did', 'despite dire warnings', 'farmer\'s almanac',
                            'this summer', 'i\'ve taken', 'cookbooks down', 'left with so many',
                            'your email', 'required fields', 'will not be published', 'comment', 'reply', 'posted', 'says:', 'wrote:', 'thanks', 'thank you',
                            'i made', 'i used', 'i added', 'i think', 'i agree', 'i disagree', 'i love this', 'this was', 'delicious!', 'fantastic!', 'amazing!', 'perfect!', 'great recipe'
                        ]):
                            continue
                        
                        # Look for lines that contain measurements and food items
                        if re.search(r'\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|teaspoon|tablespoon|bundle|clove|head|piece|slice)', line, re.I):
                            # Skip if it looks like instructions (contains cooking verbs)
                            cooking_verbs = ['heat', 'mix', 'add', 'bake', 'cook', 'stir', 'combine', 'whisk', 'fold', 'pour', 'place', 'put', 'set', 'let', 'allow', 'remove', 'serve', 'bring', 'simmer', 'boil', 'sauté', 'fry', 'roast', 'grill']
                            if not any(verb in line.lower() for verb in cooking_verbs):
                                # Skip if it's clearly blog narrative
                                if not any(narrative_word in line.lower() for narrative_word in [
                                    'was grey', 'flat', 'dull', 'mushy', 'jumped from undercooked', 'compass and a jewelers loupe',
                                    'mother-in-law', 'eggplant caviar', 'shot of espresso', 'tastebuds', 'copious amounts',
                                    'hangs out in the background', 'keeping it real', 'nutty and neutral'
                                ]):
                                    ingredients.append(line)
        
        if self.debug:
            print(f"[DEBUG] Extracted {len(ingredients)} ingredients")
            if ingredients:
                print(f"[DEBUG] First ingredient: {ingredients[0]}")
        
        return ingredients
    
    def _extract_instructions(self, soup):
        """Extract cooking instructions from jetpack-recipe-directions e-instructions div or blog post text"""
        instructions = []
        
        # Look for the jetpack-recipe-directions div with e-instructions class
        directions_div = soup.find('div', class_='jetpack-recipe-directions e-instructions')
        
        if directions_div:
            # Extract instructions from the structured directions div
            instruction_items = directions_div.find_all(['p', 'li'])
            
            for item in instruction_items:
                text = item.get_text().strip()
                if text and len(text) > 20:  # Substantial text
                    instructions.append(text)
        
        # If no structured directions found, extract from blog post text
        if not instructions:
            # Get main content area
            main_content = soup.find('div', class_='entry-content') or soup.find('article') or soup.find('main')
            if main_content:
                text_content = main_content.get_text()
                lines = text_content.split('\n')
                
                # Find recipe boundaries - look for common recipe section markers
                recipe_start = -1
                recipe_end = -1
                
                for i, line in enumerate(lines):
                    line_lower = line.strip().lower()
                    # Look for recipe start markers
                    if any(marker in line_lower for marker in ['serves', 'makes', 'ingredients:', 'directions:', 'instructions:', 'method:']):
                        recipe_start = i
                        break
                
                # If no clear start found, look for measurement patterns
                if recipe_start == -1:
                    for i, line in enumerate(lines):
                        if re.search(r'\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|teaspoon|tablespoon)', line, re.I):
                            recipe_start = i
                            break
                
                # Look for recipe end markers
                if recipe_start != -1:
                    for i in range(recipe_start + 1, len(lines)):
                        line_lower = lines[i].strip().lower()
                        if any(end_marker in line_lower for end_marker in ['your email', 'required fields', 'comment', 'reply', 'posted', 'says:', 'wrote:']):
                            recipe_end = i
                            break
                
                # Extract instructions from recipe section
                start_idx = max(0, recipe_start) if recipe_start != -1 else 0
                end_idx = recipe_end if recipe_end != -1 else len(lines)
                
                # Look for instruction patterns in the text
                cooking_verbs = ['heat', 'mix', 'add', 'bake', 'cook', 'stir', 'combine', 'whisk', 'fold', 'pour', 'place', 'put', 'set', 'let', 'allow', 'remove', 'serve', 'bring', 'simmer', 'boil', 'sauté', 'fry', 'roast', 'grill', 'blend', 'chop', 'slice', 'dice', 'mince', 'grate', 'season', 'taste', 'adjust', 'cover', 'uncover', 'drain', 'rinse', 'pat', 'dry', 'melt', 'cool', 'warm', 'preheat', 'reduce', 'increase', 'turn', 'flip', 'toss', 'garnish', 'sprinkle', 'drizzle', 'brush', 'spread', 'layer', 'arrange', 'divide', 'transfer', 'return', 'continue', 'finish', 'complete']
                
                for i in range(start_idx, end_idx):
                    line = lines[i].strip()
                    
                    # Skip empty lines and very short lines
                    if len(line) < 30:
                        continue
                    
                    # Skip blog content markers
                    if any(skip_word in line.lower() for skip_word in [
                        'years ago:', 'months ago:', 'one year ago:', 'two years ago:', 'three years ago:',
                        'eight years ago:', 'and i did', 'despite dire warnings', 'farmer\'s almanac',
                        'this summer', 'i\'ve taken', 'cookbooks down', 'left with so many',
                        'your email', 'required fields', 'will not be published', 'comment', 'reply', 'posted', 'says:', 'wrote:', 'thanks', 'thank you',
                        'i made', 'i used', 'i added', 'i think', 'i agree', 'i disagree', 'i love this', 'this was', 'delicious!', 'fantastic!', 'amazing!', 'perfect!', 'great recipe',
                        'will definitely', 'going to make', 'next time', 'i will', 'i would', 'i should', 'i could', 'i might', 'i may', 'i must', 'i need', 'i want', 'i like', 'i prefer',
                        'i recommend', 'i suggest', 'i believe', 'i feel', 'i know', 'i understand', 'i realize', 'i notice', 'i see', 'i hear', 'i smell', 'i taste', 'i touch', 'i feel',
                        'search', 'subscribe', 'newsletter', 'follow', 'social', 'copyright', 'privacy', 'terms', 'advertisement', 'sponsored', 'affiliate', 'shop', 'buy now', 'click here',
                        'deb!', 'deb,', 'hi deb', 'hey deb', 'i live', 'i have', 'i am', 'i was',
                        'this thursday', 'food52 holiday market', 'signed smitten kitchen cookbooks',
                        'and for the other side of the world', 'by sunday night', 'the inspiration came from',
                        'was grey', 'flat', 'dull', 'mushy', 'jumped from undercooked', 'compass and a jewelers loupe',
                        'mother-in-law', 'eggplant caviar', 'shot of espresso', 'tastebuds', 'copious amounts',
                        'hangs out in the background', 'keeping it real', 'nutty and neutral'
                    ]):
                        continue
                    
                    # Look for lines that contain cooking verbs and look like instructions
                    if any(verb in line.lower() for verb in cooking_verbs):
                        # Skip if it looks like ingredient lists (contains measurements but no cooking verbs in context)
                        if re.search(r'\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|teaspoon|tablespoon)', line, re.I):
                            # Only include if it contains cooking verbs in the same line (indicating it's an instruction)
                            if not any(verb in line.lower() for verb in cooking_verbs):
                                continue
                            # Also skip if it looks like a pure ingredient list (no action words)
                            if not any(action_word in line.lower() for action_word in cooking_verbs):
                                continue
                        
                        # Skip if it looks like a recipe title or header
                        if any(header_word in line.lower() for header_word in [
                            'twice-baked potatoes with kale', 'adapted from', 'serves', 'ingredients:', 'directions:', 'instructions:'
                        ]):
                            continue
                        
                        # Skip if it looks like a pure ingredient line (starts with measurement and food item)
                        if re.match(r'^\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|teaspoon|tablespoon|bundle|clove|head|piece|slice)', line, re.I):
                            # Only skip if it doesn't contain cooking verbs
                            if not any(verb in line.lower() for verb in cooking_verbs):
                                continue
                        
                        # Skip if it's just a list of ingredients without cooking actions
                        if re.match(r'^[^a-z]*\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|teaspoon|tablespoon|bundle|clove|head|piece|slice)', line, re.I):
                            # Check if it contains any cooking verbs
                            if not any(verb in line.lower() for verb in cooking_verbs):
                                continue
                        
                        instructions.append(line)
        
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
    
    def save_recipes_to_typescript(self, recipes, filename=None, category="dinner"):
        """Save scraped recipes directly to TypeScript format"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"scraped_recipes_{timestamp}.ts"
        
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
        
        print(f"✅ Saved {len(ts_recipes)} recipes to TypeScript format")
        print(f"📁 Output saved to: {filename}")
        
        return filename
    
    def _convert_recipe_to_typescript(self, recipe, recipe_id):
        """Convert a single recipe from scraped format to TypeScript format"""
        
        # Extract basic info
        name = recipe.get('title', 'Unknown Recipe')
        ingredients = recipe.get('ingredients', [])
        instructions = recipe.get('instructions', [])
        metadata = recipe.get('metadata', {})
        tags = recipe.get('detected_tags', [])
        image = recipe.get('image', None)
        
        # Convert time to minutes (extract number from time string)
        time_str = metadata.get('time', '30 minutes')
        time_minutes = self._extract_time_minutes(time_str)
        
        # Get servings
        servings = metadata.get('servings', 4)
        if servings is None:
            servings = 1
        
        # Estimate macros using fallback method
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
            'source': source_info['source'],
            'credits': source_info['credits']
        }
        
        return ts_recipe
    
    def _extract_time_minutes(self, time_str):
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
    
    def _estimate_macros_fallback(self, ingredients, servings):
        """Fallback method for macro estimation"""
        
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        total_sugar = 0
        total_cholesterol = 0
        total_fiber = 0
        
        for ingredient in ingredients:
            ingredient_lower = ingredient.lower()
            
            # High calorie ingredients
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
            elif any(word in ingredient_lower for word in ['sugar', 'honey', 'syrup', 'jam']):
                total_calories += 60
                total_sugar += 15
            elif any(word in ingredient_lower for word in ['vegetable', 'onion', 'garlic', 'herb']):
                total_calories += 15
                total_carbs += 3
                total_fiber += 2
            elif any(word in ingredient_lower for word in ['fruit', 'berry', 'apple', 'banana']):
                total_calories += 30
                total_carbs += 8
                total_fiber += 3
            elif any(word in ingredient_lower for word in ['bean', 'lentil', 'chickpea', 'legume']):
                total_calories += 50
                total_protein += 8
                total_carbs += 12
                total_fiber += 6
            elif any(word in ingredient_lower for word in ['egg']):
                total_calories += 70
                total_protein += 6
                total_fat += 5
                total_cholesterol += 185
            else:
                total_calories += 40
                total_protein += 2
                total_carbs += 5
                total_fat += 1
                total_fiber += 1
        
        # Calculate per serving
        return {
            'calories': max(total_calories // servings, 100),
            'protein': max(total_protein // servings, 5),
            'carbs': max(total_carbs // servings, 5),
            'fat': max(total_fat // servings, 2),
            'sugar': max(total_sugar // servings, 0),
            'cholesterol': max(total_cholesterol // servings, 0),
            'fiber': max(total_fiber // servings, 1)
        }
    
    def _get_recipe_source(self, recipe):
        """Determine recipe source and create appropriate credits"""
        
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
    
    def _convert_tags(self, tags):
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
    
    def _clean_ingredients(self, ingredients):
        """Clean and format ingredients for website display"""
        clean_ingredients = []
        
        for ingredient in ingredients:
            # Remove extra whitespace and clean up
            clean_ingredient = ' '.join(ingredient.split())
            
            # Skip very short ingredients
            if len(clean_ingredient) > 3:
                clean_ingredients.append(clean_ingredient)
        
        return clean_ingredients[:15]  # Limit to 15 ingredients max
    
    def _clean_instructions(self, instructions):
        """Clean and format instructions for website display"""
        clean_instructions = []
        
        for instruction in instructions:
            # Remove extra whitespace and clean up
            clean_instruction = ' '.join(instruction.split())
            
            # Skip very short instructions
            if len(clean_instruction) > 10:
                clean_instructions.append(clean_instruction)
        
        return clean_instructions[:10]  # Limit to 10 steps max
    
    def _clean_recipe_name(self, name):
        """Clean recipe name for website display"""
        # Remove extra whitespace
        clean_name = ' '.join(name.split())
        
        # Capitalize first letter of each word
        clean_name = ' '.join(word.capitalize() for word in clean_name.split())
        
        # Limit length
        if len(clean_name) > 50:
            clean_name = clean_name[:47] + "..."
        
        return clean_name
    
    def _generate_typescript_content(self, recipes, category):
        """Generate TypeScript file content"""
        
        # Create TypeScript content
        ts_content = f"""// Auto-generated recipe data from scraper
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
            ts_content += f"    cholesterol: {recipe['cholesterol']},\n"
            ts_content += f"    fiber: {recipe['fiber']},\n"
            
            # Format tags array
            tags_str = ', '.join(f'"{tag}"' for tag in recipe['tags'])
            ts_content += f"    tags: [{tags_str}],\n"
            
            # Format ingredients array
            ingredients_str = ',\n      '.join(f'"{ing}"' for ing in recipe['ingredients'])
            ts_content += f"    ingredients: [\n      {ingredients_str}\n    ],\n"
            
            # Format steps array
            steps_str = ',\n      '.join(f'"{step}"' for step in recipe['steps'])
            ts_content += f"    steps: [\n      {steps_str}\n    ],\n"
            
            # Add image if available
            if recipe['image']:
                ts_content += f"    image: \"{recipe['image']}\",\n"
            else:
                ts_content += f"    image: null,\n"
            
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
    
    # Test TypeScript output
    print("\n" + "="*60)
    print("=== TESTING TYPESCRIPT OUTPUT ===")
    
    # Combine all recipes for TypeScript output
    all_recipes = recipes1 + recipes2 + recipes3
    
    if all_recipes:
        print(f"\nSaving {len(all_recipes)} recipes to TypeScript format...")
        ts_filename = scraper.save_recipes_to_typescript(all_recipes, category="dinner")
        print(f"✅ TypeScript file created: {ts_filename}")
    else:
        print("No recipes found to save to TypeScript format")