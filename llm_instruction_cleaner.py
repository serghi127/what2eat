#!/usr/bin/env python3
"""
LLM Instruction Cleaner - Uses LLM to extract clean cooking instructions
Removes casual blog content and comments from recipe instructions
"""

import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMInstructionCleaner:
    def __init__(self, api_key: str = None, model: str = "gpt-4o-mini"):
        """
        Initialize the LLM instruction cleaner
        
        Args:
            api_key: OpenAI API key (if None, will try to get from environment)
            model: OpenAI model to use (default: gpt-4o-mini for cost efficiency)
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model
        
        if not self.api_key:
            raise ValueError("OpenAI API key not provided. Set OPENAI_API_KEY environment variable or pass api_key parameter.")
        
        # Try to import openai
        try:
            import openai
            self.openai = openai
        except ImportError:
            raise ImportError("OpenAI library not installed. Run: pip install openai")
        
        # Set the API key
        self.openai.api_key = self.api_key
    
    def clean_instructions(self, instructions: List[str], recipe_title: str = "", verbose: bool = False) -> List[str]:
        """
        Clean recipe instructions using LLM to extract only cooking steps
        
        Args:
            instructions: List of raw instruction strings from scraping
            recipe_title: Title of the recipe for context
            verbose: If True, print detailed processing info
            
        Returns:
            List of cleaned, direct instruction strings
        """
        if not instructions:
            return []
        
        if verbose:
            print(f"🤖 Processing {len(instructions)} instructions with LLM...")
            print(f"📝 Recipe: {recipe_title}")
        
        # Join all instructions into a single text for processing
        raw_instructions_text = "\n".join([f"{i+1}. {inst}" for i, inst in enumerate(instructions)])
        
        # Create the prompt for the LLM
        prompt = self._create_cleaning_prompt(raw_instructions_text, recipe_title)
        
        try:
            # Call the LLM API
            response = self.openai.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional recipe editor who extracts clean cooking instructions from blog-style recipe content."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent results
                max_tokens=2000   # Should be enough for most recipes
            )
            
            # Extract the cleaned instructions
            cleaned_text = response.choices[0].message.content.strip()
            
            if verbose:
                print(f"✅ LLM response received ({len(cleaned_text)} characters)")
            
            # Parse the JSON response
            try:
                # Try to extract JSON from the response
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', cleaned_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                else:
                    # Look for JSON without code blocks
                    json_match = re.search(r'\{.*\}', cleaned_text, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(0)
                    else:
                        raise ValueError("No JSON found in response")
                
                result = json.loads(json_str)
                cleaned_instructions = result.get('cleaned_instructions', [])
                
                if verbose:
                    print(f"📊 LLM Analysis:")
                    print(f"  - Original instructions: {len(instructions)}")
                    print(f"  - Cleaned instructions: {len(cleaned_instructions)}")
                    print(f"  - Removed: {len(instructions) - len(cleaned_instructions)} casual comments")
                    
                    if result.get('analysis'):
                        print(f"  - LLM Analysis: {result['analysis']}")
                
                return cleaned_instructions
                
            except (json.JSONDecodeError, ValueError) as e:
                if verbose:
                    print(f"⚠️  JSON parsing failed: {e}")
                    print(f"Raw LLM response: {cleaned_text[:200]}...")
                
                # Fallback: try to extract instructions from the text directly
                return self._fallback_extract_instructions(cleaned_text, verbose)
        
        except Exception as e:
            if verbose:
                print(f"❌ LLM API call failed: {e}")
            
            # Fallback to basic cleaning
            return self._fallback_basic_cleaning(instructions, verbose)
    
    def _create_cleaning_prompt(self, raw_instructions: str, recipe_title: str) -> str:
        """Create a prompt for the LLM to clean instructions"""
        
        prompt = f"""
You are a professional recipe editor. Your task is to extract ONLY the actual cooking instructions from blog-style recipe content, removing all casual commentary, personal stories, reader comments, and non-cooking content.

RECIPE TITLE: {recipe_title}

RAW INSTRUCTIONS TO CLEAN:
{raw_instructions}

TASK:
1. Identify and extract ONLY the actual cooking steps
2. Remove all personal commentary, stories, and casual language
3. Remove reader comments, questions, and responses
4. Remove social media sharing text, links, and promotional content
5. Convert to clear, numbered cooking steps
6. Use imperative mood (e.g., "Heat oil", "Add garlic", "Cook for 5 minutes")
7. Include specific times, temperatures, and measurements when present
8. Make each step actionable and specific

OUTPUT FORMAT:
Return a JSON object with this structure:
{{
  "cleaned_instructions": [
    "Step 1: [clean cooking instruction]",
    "Step 2: [clean cooking instruction]",
    ...
  ],
  "analysis": "Brief explanation of what was removed and why"
}}

EXAMPLES:

Input: "I love this recipe! Heat the pan over medium-high and add olive oil, heating it too. Add salami to olive oil and heat, stirring, until it begins to crisp. Use a slotted spoon to remove it from the pan and drain it on a paper towel. I made this last week and it was amazing!"

Output:
{{
  "cleaned_instructions": [
    "Heat olive oil in a pan over medium-high heat",
    "Add salami and cook, stirring, until crispy, about 2-3 minutes",
    "Remove salami with a slotted spoon and drain on paper towels"
  ],
  "analysis": "Removed personal commentary ('I love this recipe!', 'I made this last week and it was amazing!') and kept only the cooking steps"
}}

Input: "Share this: Click to share on Facebook. Did I just make half this recipe and eat it by myself? Yes, yes I did. 🥹"

Output:
{{
  "cleaned_instructions": [],
  "analysis": "This is entirely social media sharing and personal commentary with no cooking instructions"
}}

IMPORTANT:
- Only include actual cooking steps
- Remove ALL personal commentary and stories
- Remove ALL reader comments and responses
- Remove ALL social media sharing content
- Make instructions clear and actionable
- Return ONLY the JSON object, no other text
"""
        
        return prompt
    
    def _fallback_extract_instructions(self, text: str, verbose: bool = False) -> List[str]:
        """Fallback method to extract instructions from LLM text response"""
        if verbose:
            print("🔄 Using fallback instruction extraction...")
        
        # Look for numbered steps
        steps = []
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            # Look for patterns like "1. ", "Step 1:", etc.
            if re.match(r'^\d+\.?\s+', line) or re.match(r'^Step\s+\d+:', line, re.IGNORECASE):
                # Clean up the step
                step = re.sub(r'^\d+\.?\s*', '', line)
                step = re.sub(r'^Step\s+\d+:\s*', '', step, flags=re.IGNORECASE)
                if step and len(step) > 10:  # Reasonable length
                    steps.append(step)
        
        return steps
    
    def _fallback_basic_cleaning(self, instructions: List[str], verbose: bool = False) -> List[str]:
        """Fallback method for basic instruction cleaning when LLM fails"""
        if verbose:
            print("🔄 Using fallback basic cleaning...")
        
        # Simple fallback: keep instructions that look like cooking steps
        cooking_verbs = ['heat', 'add', 'cook', 'stir', 'mix', 'bake', 'roast', 'simmer', 'boil', 'sauté', 'fry', 'grill']
        
        cleaned = []
        for instruction in instructions:
            if len(instruction) > 20:  # Reasonable length
                instruction_lower = instruction.lower()
                if any(verb in instruction_lower for verb in cooking_verbs):
                    # Skip obvious casual content
                    if not any(phrase in instruction_lower for phrase in [
                        'i love', 'i made', 'i think', 'i feel', 'i know', 'i believe',
                        'share this', 'click to share', 'facebook', 'pinterest',
                        'comment', 'reply', 'posted', 'says:', 'wrote:', 'thanks'
                    ]):
                        cleaned.append(instruction)
        
        return cleaned
    
    def clean_recipe_file(self, input_file: str, output_file: str = None, verbose: bool = False) -> str:
        """
        Clean instructions in a recipe file
        
        Args:
            input_file: Path to input recipe JSON file
            output_file: Path to output file (if None, auto-generates)
            verbose: If True, print detailed processing info
            
        Returns:
            Path to the output file
        """
        if not os.path.exists(input_file):
            raise FileNotFoundError(f"Input file not found: {input_file}")
        
        if verbose:
            print(f"📚 Loading recipes from {input_file}...")
        
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        recipes = data.get('recipes', [])
        if verbose:
            print(f"📝 Found {len(recipes)} recipes to process")
        
        processed_recipes = []
        
        for i, recipe in enumerate(recipes, 1):
            if verbose:
                print(f"\n🔧 Processing recipe {i}/{len(recipes)}: {recipe.get('title', 'Unknown')}")
            
            original_instructions = recipe.get('instructions', [])
            
            if original_instructions:
                # Clean the instructions using LLM
                cleaned_instructions = self.clean_instructions(
                    original_instructions, 
                    recipe.get('title', ''),
                    verbose=verbose
                )
                
                # Update the recipe
                recipe['instructions'] = cleaned_instructions
                recipe['raw_instructions'] = original_instructions  # Keep original for reference
                recipe['instructions_cleaned_with_llm'] = True
                recipe['cleaned_at'] = __import__('datetime').datetime.now().isoformat()
                
                if verbose:
                    print(f"  ✅ {len(original_instructions)} → {len(cleaned_instructions)} instructions")
            else:
                if verbose:
                    print(f"  ⚠️  No instructions found")
                recipe['instructions_cleaned_with_llm'] = False
            
            processed_recipes.append(recipe)
        
        # Generate output filename if not provided
        if not output_file:
            base_name = os.path.splitext(input_file)[0]
            timestamp = __import__('datetime').datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"{base_name}_llm_cleaned_{timestamp}.json"
        
        # Save processed recipes
        output_data = {
            'recipes': processed_recipes,
            'total_count': len(processed_recipes),
            'instructions_cleaned_with_llm': True,
            'cleaned_at': __import__('datetime').datetime.now().isoformat(),
            'original_file': input_file,
            'llm_model_used': self.model
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        if verbose:
            print(f"\n💾 Saved {len(processed_recipes)} processed recipes to {output_file}")
        
        return output_file

def main():
    """Test the LLM instruction cleaner"""
    
    # Check if API key is available
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OpenAI API key not found. Please set OPENAI_API_KEY environment variable.")
        return
    
    print("🤖 Testing LLM Instruction Cleaner...")
    
    # Initialize cleaner
    cleaner = LLMInstructionCleaner(model="gpt-4o-mini")  # Use cheaper model for testing
    
    # Sample instructions from your scraped data
    sample_instructions = [
        "On a rimmed 9-by-13-inch baking sheet, toss the cabbage with the olive oil, salt, and pepper to coat evenly, but leaving any chunks intact-that is, there's no need to separate the leafy layers. Dot the butter over the top — it will melt in the oven. Roast for 15 minutes, until the cabbage is black in spots.",
        "Use a spatula to turn the cabbage over and scatter the garlic cloves in the pan.",
        "Return to the oven and roast for another 15 minutes, until the cabbage looks worrisomely charred (but it will be perfect, I promise). Pour the broth and vinegar carefully into the pan, and return it to the oven a final time, to roast for yet another 15 minutes, or until the garlic cloves are tender and the liquids have been reduced to a thin (or nonexistent) puddle. Finish with a sprinkling of sea salt, and good luck not eating the crunchy bits right from the pan.",
        "Share this:\nClick to share on Facebook (Opens in new window)\nFacebook\n\nClick to share on Pinterest (Opens in new window)\nPinterest\n\nClick to share on Bluesky (Opens in new window)\nBluesky\n\nClick to share on Threads (Opens in new window)\nThreads\n\nClick to email a link to a friend (Opens in new window)\nEmail\n\n\nRelated",
        "Confirming\nBasically 475° for 30 minutes?\nBefore the broth & vinegar?",
        "Yes. I know sometimes people skip the first flip at 15 minutes if you're looking to reduce steps.",
        "With convection, it might even out or close. Just keep an eye on it and use these photos (charred! almost dangerously so!) as guidance.",
        "This sounds so good! Do you think if I didn't want to use vegetable broth I should just use water?",
        "Did I just make half this recipe and eat it by myself? Yes, yes I did. 🥹",
        "I started with chunks but you could do wedges too. Honestly you could try this same ingredient approach (vinegar, etc.) but with the melting potatoes recipe."
    ]
    
    print(f"📝 Testing with {len(sample_instructions)} sample instructions...")
    print("=" * 80)
    
    # Clean the instructions
    cleaned_instructions = cleaner.clean_instructions(
        sample_instructions, 
        "Charred Salt and Vinegar Cabbage",
        verbose=True
    )
    
    print("=" * 80)
    print(f"\n📋 Final Clean Instructions:")
    for i, instruction in enumerate(cleaned_instructions, 1):
        print(f"  {i}. {instruction}")
    
    print(f"\n📊 Final Summary:")
    print(f"  - Original: {len(sample_instructions)} instructions")
    print(f"  - Cleaned: {len(cleaned_instructions)} instructions")
    print(f"  - Removed: {len(sample_instructions) - len(cleaned_instructions)} casual comments")

if __name__ == "__main__":
    main()
