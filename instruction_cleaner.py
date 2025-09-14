#!/usr/bin/env python3
"""
Instruction Cleaner - Removes casual blog content from recipe instructions
Makes them suitable for meal prep applications
"""

import re
from typing import List, Dict, Any

class InstructionCleaner:
    def __init__(self):
        # Patterns to identify and remove casual content
        self.casual_patterns = [
            # Personal commentary
            r'^I\s+(love|hate|think|feel|know|believe|wish|hope|want|need|like|prefer|recommend|suggest)',
            r'^My\s+(family|husband|wife|kids|children|mom|dad|grandma|grandpa)',
            r'^We\s+(love|hate|think|feel|know|believe|wish|hope|want|need|like|prefer|recommend|suggest)',
            r'^This\s+(is|was|will be|can be|should be|might be)',
            r'^That\s+(is|was|will be|can be|should be|might be)',
            
            # Reader comments and responses
            r'^Did I just',
            r'^I had to fight',
            r'^I tried this',
            r'^I made this',
            r'^I used this',
            r'^I added this',
            r'^I substituted',
            r'^I doubled this',
            r'^I halved this',
            r'^I always',
            r'^I never',
            r'^I usually',
            r'^I often',
            r'^I sometimes',
            r'^I can\'t',
            r'^I don\'t',
            r'^I won\'t',
            r'^I will',
            r'^I would',
            r'^I should',
            r'^I could',
            r'^I might',
            r'^I may',
            r'^I must',
            r'^I need',
            r'^I want',
            r'^I like',
            r'^I prefer',
            r'^I recommend',
            r'^I suggest',
            r'^I believe',
            r'^I feel',
            r'^I know',
            r'^I understand',
            r'^I realize',
            r'^I notice',
            r'^I see',
            r'^I hear',
            r'^I smell',
            r'^I taste',
            r'^I touch',
            
            # Exclamations and casual language
            r'^OMG',
            r'^Wow',
            r'^Amazing!',
            r'^Delicious!',
            r'^Fantastic!',
            r'^Perfect!',
            r'^Great recipe',
            r'^Will definitely',
            r'^Going to make',
            r'^Next time',
            r'^Made this',
            r'^This was',
            r'^This is',
            r'^This looks',
            r'^This sounds',
            r'^This recipe',
            r'^This dish',
            r'^This meal',
            r'^This food',
            r'^This version',
            r'^This method',
            r'^This technique',
            r'^This approach',
            r'^This way',
            r'^This time',
            r'^This week',
            r'^This month',
            r'^This year',
            r'^This season',
            r'^This occasion',
            r'^This event',
            r'^This party',
            r'^This dinner',
            r'^This lunch',
            r'^This breakfast',
            r'^This snack',
            r'^This dessert',
            r'^This appetizer',
            r'^This side',
            r'^This main',
            r'^This course',
            r'^This dish',
            r'^This plate',
            r'^This bowl',
            r'^This cup',
            r'^This glass',
            r'^This mug',
            r'^This spoon',
            r'^This fork',
            r'^This knife',
            r'^This plate',
            r'^This bowl',
            r'^This cup',
            r'^This glass',
            r'^This mug',
            r'^This spoon',
            r'^This fork',
            r'^This knife',
            
            # Comment responses
            r'^Comment',
            r'^Reply',
            r'^Posted',
            r'^Says:',
            r'^Wrote:',
            r'^Thanks',
            r'^Thank you',
            r'^Deb!',
            r'^Deb,',
            r'^Hi Deb',
            r'^Hey Deb',
            r'^Months ago:',
            r'^Years ago:',
            r'^Your email',
            r'^Required fields',
            r'^Will not be published',
            
            # Social media and sharing
            r'^Share this:',
            r'^Click to share',
            r'^Facebook',
            r'^Pinterest',
            r'^Bluesky',
            r'^Threads',
            r'^Email',
            r'^Related',
            r'^Confirming',
            r'^Basically',
            r'^With convection',
            r'^This sounds so good',
            r'^Do you think',
            r'^I started with',
            r'^I had to fight',
            r'^Unrelated',
            r'^I never expected',
            r'^Wonderful',
            r'^My next choice',
            r'^It will be',
            r'^This recipe has been',
            r'^Ours too',
            r'^I definitely need',
            r'^I\'m one of those',
            r'^I came here',
            r'^This time',
            r'^i only own',
            r'^Interesting',
            r'^This is a favorite',
            r'^Has anyone tried',
            r'^Just wondering',
            r'^Can confirm',
            r'^I had 1/2 head',
            r'^Looks great',
            r'^OMG I doooooooo',
            r'^My favorite',
            r'^This has been',
            r'^You could do',
            r'^While this recipe',
            r'^Who knew',
            r'^This is one of',
            r'^I\'m not sure',
            r'^I also didn\'t',
            r'^Also, we appreciated',
            r'^My family loved',
            r'^If you ever want',
            r'^Wow. Bless you',
            r'^Yes. And this way',
            r'^It\'s great to eat',
            r'^After making this',
            r'^I tried this',
            r'^Really yummy',
            r'^We make this',
            r'^Enjoyed this',
            r'^Oooh reheat',
        ]
        
        # Cooking verbs that indicate real instructions
        self.cooking_verbs = [
            'heat', 'add', 'cook', 'stir', 'mix', 'bake', 'roast', 'simmer', 'boil', 
            'sauté', 'fry', 'grill', 'blend', 'chop', 'slice', 'dice', 'mince', 'grate', 
            'season', 'taste', 'adjust', 'cover', 'uncover', 'drain', 'rinse', 'pat', 
            'dry', 'melt', 'cool', 'warm', 'preheat', 'reduce', 'increase', 'turn', 
            'flip', 'toss', 'garnish', 'sprinkle', 'drizzle', 'brush', 'spread', 
            'layer', 'arrange', 'divide', 'transfer', 'return', 'continue', 'finish', 
            'complete', 'place', 'put', 'set', 'let', 'allow', 'remove', 'serve', 
            'bring', 'pour', 'whisk', 'fold', 'combine', 'separate', 'cut', 'trim',
            'peel', 'core', 'seed', 'pit', 'stem', 'clean', 'wash', 'soak', 'marinate',
            'brine', 'cure', 'smoke', 'steam', 'braise', 'stew', 'poach', 'scramble',
            'fry', 'deep-fry', 'pan-fry', 'stir-fry', 'sweat', 'caramelize', 'brown',
            'sear', 'glaze', 'reduce', 'thicken', 'thin', 'dilute', 'concentrate',
            'emulsify', 'whip', 'beat', 'cream', 'knead', 'roll', 'press', 'mash',
            'puree', 'strain', 'sieve', 'filter', 'squeeze', 'juice', 'zest', 'grate',
            'shred', 'julienne', 'brunoise', 'chiffonade', 'bias', 'bias-cut'
        ]
        
        # Measurement patterns
        self.measurement_patterns = [
            r'\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|inch|inches|cm|mm)',
            r'\d+\s*to\s*\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|inch|inches|cm|mm)',
            r'\d+/\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|inch|inches|cm|mm)',
            r'\d+\s*-\s*\d+\s*(cup|cups|tbsp|tsp|pound|lb|oz|grams?|kg|ml|liter|ounce|inch|inches|cm|mm)',
        ]
    
    def clean_instructions(self, instructions: List[str], recipe_title: str = "", verbose: bool = False) -> List[str]:
        """
        Clean recipe instructions by removing casual blog content and comments
        
        Args:
            instructions: List of raw instruction strings
            recipe_title: Title of the recipe for context
            verbose: If True, print detailed classification info
            
        Returns:
            List of cleaned, direct instruction strings
        """
        if not instructions:
            return []
        
        cleaned_instructions = []
        casual_reasons = []
        cooking_reasons = []
        
        for i, instruction in enumerate(instructions, 1):
            # Skip empty instructions
            if not instruction or not instruction.strip():
                if verbose:
                    print(f"  {i:2d}. [SKIP] Empty instruction")
                continue
            
            instruction = instruction.strip()
            
            # Skip very short instructions (likely not real cooking steps)
            if len(instruction) < 20:
                if verbose:
                    print(f"  {i:2d}. [SKIP] Too short ({len(instruction)} chars): {instruction[:50]}...")
                continue
            
            # Check if this looks like a casual comment or personal story
            is_casual, casual_reason = self._is_casual_content_with_reason(instruction)
            if is_casual:
                casual_reasons.append((i, instruction, casual_reason))
                if verbose:
                    print(f"  {i:2d}. [CASUAL] {casual_reason}")
                    print(f"      {instruction[:100]}{'...' if len(instruction) > 100 else ''}")
                continue
            
            # Check if this looks like a real cooking instruction
            is_cooking, cooking_reason = self._is_cooking_instruction_with_reason(instruction)
            if is_cooking:
                cooking_reasons.append((i, instruction, cooking_reason))
                # Clean up the instruction
                cleaned_instruction = self._clean_instruction_text(instruction)
                if cleaned_instruction:
                    cleaned_instructions.append(cleaned_instruction)
                    if verbose:
                        print(f"  {i:2d}. [COOKING] {cooking_reason}")
                        print(f"      {cleaned_instruction[:100]}{'...' if len(cleaned_instruction) > 100 else ''}")
            else:
                if verbose:
                    print(f"  {i:2d}. [REJECT] Not cooking instruction: {cooking_reason}")
                    print(f"      {instruction[:100]}{'...' if len(instruction) > 100 else ''}")
        
        if verbose:
            print(f"\n📊 Classification Summary:")
            print(f"  - Total instructions: {len(instructions)}")
            print(f"  - Classified as casual: {len(casual_reasons)}")
            print(f"  - Classified as cooking: {len(cooking_reasons)}")
            print(f"  - Final cleaned instructions: {len(cleaned_instructions)}")
            
            if casual_reasons:
                print(f"\n🚫 Casual Content Examples:")
                for i, (orig_i, text, reason) in enumerate(casual_reasons[:5], 1):
                    print(f"  {i}. [{orig_i}] {reason}")
                    print(f"     {text[:80]}{'...' if len(text) > 80 else ''}")
            
            if cooking_reasons:
                print(f"\n✅ Cooking Instructions Examples:")
                for i, (orig_i, text, reason) in enumerate(cooking_reasons[:5], 1):
                    print(f"  {i}. [{orig_i}] {reason}")
                    print(f"     {text[:80]}{'...' if len(text) > 80 else ''}")
        
        return cleaned_instructions
    
    def _is_casual_content(self, text: str) -> bool:
        """Check if text is casual content that should be removed"""
        is_casual, _ = self._is_casual_content_with_reason(text)
        return is_casual
    
    def _is_casual_content_with_reason(self, text: str) -> tuple[bool, str]:
        """Check if text is casual content that should be removed, with reason"""
        text_lower = text.lower()
        
        # Check against casual patterns
        for pattern in self.casual_patterns:
            if re.match(pattern, text_lower):
                return True, f"Matches casual pattern: {pattern}"
        
        # Check for excessive personal pronouns at the start
        if re.match(r'^(i|my|we|our|this|that)\s+', text_lower):
            # But allow some cooking instructions that start with these words
            if not any(verb in text_lower for verb in self.cooking_verbs):
                return True, "Starts with personal pronoun but no cooking verbs"
        
        # Check for comment-like content
        comment_phrases = [
            'months ago:', 'years ago:', 'your email', 'required fields', 
            'will not be published', 'comment', 'reply', 'posted', 'says:', 
            'wrote:', 'thanks', 'thank you', 'deb!', 'deb,', 'hi deb', 'hey deb',
            'share this:', 'click to share', 'facebook', 'pinterest', 'bluesky', 
            'threads', 'email', 'related', 'confirming', 'basically'
        ]
        for phrase in comment_phrases:
            if phrase in text_lower:
                return True, f"Contains comment phrase: '{phrase}'"
        
        # Check for excessive exclamation marks (casual writing)
        if text.count('!') > 2:
            return True, f"Too many exclamation marks ({text.count('!')})"
        
        # Check for excessive question marks (likely comments/questions)
        if text.count('?') > 1:
            return True, f"Too many question marks ({text.count('?')})"
        
        # Check for casual language patterns
        casual_phrases = [
            'i definitely need', 'i started with', 'this time i\'m', 'yes, just swap',
            'this is one of my favorite', 'i\'m not sure it\'s', 'also, we appreciated',
            'if you ever want', 'wow. bless you', 'we make this almost', 'enjoyed this',
            'oooh reheat', 'i can eat an entire', 'this sounds so good', 'do you think',
            'did i just make', 'i had to fight', 'unrelated, but i love', 'i never expected',
            'my next choice would be', 'it will be', 'this recipe has been', 'ours too',
            'i definitely need', 'i\'m one of those', 'i came here hoping', 'this time',
            'i only own', 'interesting', 'this is a favorite', 'has anyone tried',
            'just wondering', 'can confirm', 'i had 1/2 head', 'looks great',
            'omg i doooooooo', 'my favorite', 'this has been', 'you could do',
            'while this recipe', 'who knew', 'this is one of', 'i\'m not sure',
            'i also didn\'t', 'also, we appreciated', 'my family loved',
            'if you ever want', 'wow. bless you', 'yes. and this way', 'it\'s great to eat',
            'after making this', 'i tried this', 'really yummy', 'we make this',
            'enjoyed this', 'oooh reheat', 'yes. i know', 'https://', 'http://'
        ]
        for phrase in casual_phrases:
            if phrase in text_lower:
                return True, f"Contains casual phrase: '{phrase}'"
        
        return False, "Not identified as casual content"
    
    def _is_cooking_instruction(self, text: str) -> bool:
        """Check if text looks like a real cooking instruction"""
        is_cooking, _ = self._is_cooking_instruction_with_reason(text)
        return is_cooking
    
    def _is_cooking_instruction_with_reason(self, text: str) -> tuple[bool, str]:
        """Check if text looks like a real cooking instruction, with reason"""
        text_lower = text.lower()
        
        # Must contain at least one cooking verb
        has_cooking_verb = any(verb in text_lower for verb in self.cooking_verbs)
        
        if not has_cooking_verb:
            return False, "No cooking verbs found"
        
        # Check for measurement patterns (good sign it's a real instruction)
        has_measurements = any(re.search(pattern, text_lower) for pattern in self.measurement_patterns)
        
        # Check for time references (good sign)
        has_time = any(time_word in text_lower for time_word in [
            'minute', 'minutes', 'hour', 'hours', 'second', 'seconds', 
            'until', 'for', 'about', 'approximately', 'roughly'
        ])
        
        # Check for temperature references (good sign)
        has_temperature = any(temp_word in text_lower for temp_word in [
            'degree', 'degrees', 'fahrenheit', 'celsius', 'hot', 'cold', 'warm', 'cool',
            'medium', 'high', 'low', 'simmer', 'boil', 'fry', 'sauté'
        ])
        
        # Check for cooking method references (good sign)
        has_cooking_method = any(method in text_lower for method in [
            'oven', 'stovetop', 'pan', 'pot', 'skillet', 'baking sheet', 'roasting pan',
            'dutch oven', 'braiser', 'saucepan', 'frying pan', 'grill', 'broiler'
        ])
        
        # Build reason string
        reasons = []
        if has_measurements:
            reasons.append("has measurements")
        if has_time:
            reasons.append("has time references")
        if has_temperature:
            reasons.append("has temperature references")
        if has_cooking_method:
            reasons.append("has cooking method references")
        
        if reasons:
            return True, f"Cooking verb + {', '.join(reasons)}"
        else:
            return False, "Has cooking verb but no other cooking indicators"
    
    def _clean_instruction_text(self, text: str) -> str:
        """Clean up a single instruction text"""
        # Remove common casual language patterns
        text = re.sub(r'^I love this recipe!', '', text)
        text = re.sub(r'^I can\'t stop\.', '', text)
        text = re.sub(r'not to be dramatic or anything, but', '', text)
        text = re.sub(r'I\'m so glad I didn\'t quit on them, though, because', '', text)
        
        # Remove parenthetical asides that are too casual
        text = re.sub(r'\([^)]*\)', '', text)
        
        # Remove excessive punctuation
        text = re.sub(r'!{2,}', '!', text)
        text = re.sub(r'\?{2,}', '?', text)
        
        # Clean up extra whitespace
        text = ' '.join(text.split())
        
        # Capitalize first letter
        if text:
            text = text[0].upper() + text[1:]
        
        return text.strip()

def main():
    """Test the instruction cleaner with sample data"""
    
    cleaner = InstructionCleaner()
    
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
        "I started with chunks but you could do wedges too. Honestly you could try this same ingredient approach (vinegar, etc.) but with the melting potatoes recipe.",
        "I had to fight off my 11, 10, and 5 year old daughters to eat the rest of this! I now have a house full of cabbage converts!",
        "Unrelated, but I love purple cabbage to make what I call \"secondary salad\" (because it's purple orange and green the secondary colors on the color wheel). I just mixed purple cabbage, shredded carrots, and something green (green onions and or herbs) and add dressing, usually some kind of garlic vinaigrette, and often cheese and nuts. It's delicious.",
        "I never expected to find te word 'worrisomely' in a recipe but it's definitely intriguing, adding a new dimension to my cooking.\nWonderful!\n;-)",
        "My next choice would be apple cider, then white wine. Rice is very mild, and red wine would stain to an ugly color",
        "It will be sweeter and less acidic but could still work!",
        "This recipe has been a staple in my house since Smitten Kitchen Keepers came out!",
        "Ours too.  I make it with half malt vinegar and half white vinegar, as a nod to my British husband.  And the crunch of Maldon salt is swoon-worthy in and of itself.",
        "I definitely need to make this! We made a corned beef dinner this spring and instead of boiling the veggies, found a recipe with veggies roasted in a horseradish butter.  And while the potatoes and carrots were delicious, the cabbage was a revelation!  Now I want to eat all the roasted cabbage :)",
        "I'm one of those just knowing it will be fantastic for me. Cabbage is worrisomely underrated. Just one question: what do you usually eat with it to make it a meal? Looking forward to making this :)",
        "I came here hoping for an answer to the same question! Anyone have any tips? Is it enough of a meal on its own or does it need something else? Looking forward to making it this week!",
        "This time I'm serving this with some leftover ham.  Will fry a slice to serve with this cabbage.",
        "i only own rimmed, too! learned a trick from America's Test Kitchen – for the delicate cookies that require a proper rimless cookie sheet, simply flip the rimmed sheet over and use the underside. i tried this with a delicate speculoos cookie recipe, and it worked beautifully.",
        "https://www.americastestkitchen.com/recipes/11199-belgian-spice-cookies-speculoos (i believe the baking sheet tip is in the video)",
        "Interesting! I've always understood that it could be both. I will try to remember to clarify. I honestly don't own any rimless baking sheets.",
        "This is a favorite in our house and my 5 year old regularly requests it.",
        "Has anyone tried this with Napa?  (I assume less cooking time, as a start.)  I love basic green cabbage and this is on the list!, but I happen to have 1/2 a large Napa in the fridge, waiting to be cooked or tossed….",
        "Just wondering if you can adapt this to include BOTH THE POTATOES, and the cabbage as well to make a wonderful serving of veggies and carbs in a happy marriage.",
        "Yes, just swap out half the cabbage for wedges or thick slices of potato.",
        "Can confirm- even my kids love this. It's incredible.",
        "I had 1/2 head of cabbage languishing so obv had to make this. I chuckled when I checked my copy of Keepers and saw the post was lifted from the book!  So so good 🤤",
        "Looks  great.  I can probably figure it out, but is there a nutritional breakdown?",
        "OMG I doooooooo have an old cabbage in my fridge! Making this tonight…",
        "My favorite cabbage-y recipe from SK remains this one: https://smittenkitchen.com/2022/02/crispy-cabbage-and-cauliflower-salad/",
        "This has been a recipe that makes me so sad to hate vinegar since the moment I first saw it.  That cabbage looks incredible!  I once accidentally ate one of my partner's salt and vinegar chips (his ended up on my sando plate, so I expected it to be a regular chip) and cried.",
        "You could do the same roasting and skip the vinegar. Roasted cabbage, kale, etc., is so very delicious. (Go with a squeeze of lemon or orange or lime if you still want a tang, or skip it, or add herbs instead.)",
        "While this recipe is great in chunks, I've done it with leaves — shorter time, crispier bits and more like chips (same way I do kale/collard chips).",
        "Who knew that a cabbage serves 2?    Around here it does now!",
        "This is one of my favorite recipes from the cookbook! I've been raving about it to everyone and so glad I can just send them this link now.",
        "I'm not sure it's the right cooking method for it. Make this salad instead!",
        "I also didn't have vegetable stock and used water, and if you do this, I recommend generously salting to taste at the end. We liked it very salty.",
        "Also, we appreciated the advice to cook until \"worrisomely charred.\" It was just right.",
        "My family loved this! Like homemade sauerkraut…yum! Can't wait to make it again!",
        "If you ever want to combine the cabbage and cauliflower on one sheet pan, don't miss this one: crispy cabbage and cauliflower salad",
        "Wow. Bless you for bringing this into my life! Who knew the sad cabbage (literally wasting away in the back of my fridge as foretold by you) would lead to the most unexpected, glorious, mid-week lunch party for one (me).",
        "Yes. And this way it doesn't taste burnt, either. It just appears very dark.",
        "It's great to eat right away. You can reheat it but it's not chips; there are crispy and soft parts.",
        "After making this twice in one week, I'm here to say: if you've ever thought \"hmmm, I wonder if I could eat a whole head of cabbage by myself\" then this is the recipe for you. Perfection.",
        "I tried this several times and the cooking time shud be 30 min",
        "Really yummy, easy, and adaptable to adding other things. I also threw in some apple, as others suggested, and some spicy chicken italian sausage. So good!",
        "We make this almost once a week. We often add Whitaker mushrooms to the sheet pan. They add a different texture and complementary flavor. We make two pans often because it tastes great cold as a slaw the next day with some grated carrots added for a touch of sweetness and for a little color.",
        "Enjoyed this. Then to reheat, I put it under the broiler so it was truly charred cabbage….then served it with an egg cooked in chile crisp.  YUM.  With some sliced farmer's mkt tomatoes on the side.  Really recommend",
        "Oooh reheat under the broiler. Great idea. I can eat an entire cabbage this way. So good. And the egg and chili crisp? A+"
    ]
    
    print("🧹 Testing instruction cleaner with detailed analysis...")
    print(f"📝 Original instructions: {len(sample_instructions)}")
    print("=" * 80)
    
    cleaned_instructions = cleaner.clean_instructions(sample_instructions, "Charred Salt and Vinegar Cabbage", verbose=True)
    
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
