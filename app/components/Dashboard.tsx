'use client';

import React, { useState } from 'react';
import MacroTracking from './MacroTracking';
import ShoppingCartComponent from './ShoppingCart';
import ShoppingCartModal from './ShoppingCartModal';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Users, ChevronLeft, ChevronRight, X, ChefHat, Clock as ClockIcon, FileText, Plus, Star, Ticket, ShoppingCart, Heart, Sparkles } from 'lucide-react';
import { CartItem, Recipe, WeeklyMealPlan } from '../types';

interface WeeklyMeal {
  id: string;
  day: string;
  meals: {
    breakfast: string;
    lunch: string;
    dinner: string;
  };
  mealIds?: {
    breakfast: number | null;
    lunch: number | null;
    dinner: number | null;
  };
}

interface Macro {
  id: string;
  name: string;
  current: number;
  goal: number;
  unit: string;
  color: string;
}

interface MealDetail {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
}

interface DashboardProps {
  onHideNavbar?: (hide: boolean) => void;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (recipe: Recipe) => void;
}

export default function Dashboard({ onHideNavbar, cart, setCart, addToCart }: DashboardProps) {
  const { user } = useAuth();
  const [macros, setMacros] = useState<Macro[]>([
    { id: 'calories', name: 'Calories', current: 1200, goal: 2000, unit: 'kcal', color: 'bg-blue-500' },
    { id: 'protein', name: 'Protein', current: 80, goal: 150, unit: 'g', color: 'bg-green-500' },
    { id: 'carbs', name: 'Carbs', current: 120, goal: 250, unit: 'g', color: 'bg-yellow-500' },
    { id: 'fat', name: 'Fat', current: 45, goal: 65, unit: 'g', color: 'bg-red-500' },
    { id: 'fiber', name: 'Fiber', current: 15, goal: 25, unit: 'g', color: 'bg-purple-500' },
    { id: 'sugar', name: 'Sugar', current: 30, goal: 50, unit: 'g', color: 'bg-pink-500' },
    { id: 'cholesterol', name: 'Cholesterol', current: 150, goal: 300, unit: 'mg', color: 'bg-orange-500' }
  ]);

  const [currentSnackIndex, setCurrentSnackIndex] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<MealDetail | null>(null);
  const [userNotes, setUserNotes] = useState<{ [key: string]: string }>({});
  const [showCart, setShowCart] = useState(false); // Show/hide cart
  const [showSmartCart, setShowSmartCart] = useState(false); // Show/hide smart shopping cart modal
  const [favoriteMeals, setFavoriteMeals] = useState<Set<string>>(new Set()); // Track favorite meals
  const [checkedMeals, setCheckedMeals] = useState<Set<string>>(new Set()); // Track checked meals
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false); // Track meal plan generation
  const [generatedMealPlan, setGeneratedMealPlan] = useState<WeeklyMealPlan | null>(null); // Store generated meal plan

  // Detailed meal information
  const mealDetails: { [key: string]: MealDetail } = {
    'oatmeal-berries': {
      id: 'oatmeal-berries',
      name: 'Oatmeal with Berries',
      description: 'A nutritious and delicious breakfast bowl packed with fiber and antioxidants.',
      prepTime: 5,
      cookTime: 10,
      servings: 1,
      calories: 320,
      ingredients: [
        '1/2 cup rolled oats',
        '1 cup almond milk',
        '1/2 cup mixed berries',
        '1 tbsp honey',
        '1 tbsp chia seeds',
        '1/4 tsp cinnamon'
      ],
      instructions: [
        'Heat almond milk in a saucepan over medium heat',
        'Add oats and stir occasionally for 5-7 minutes',
        'Remove from heat and let sit for 2 minutes',
        'Top with berries, honey, chia seeds, and cinnamon',
        'Serve warm'
      ],
      tags: ['breakfast', 'healthy', 'quick', 'vegetarian']
    },
    'grilled-chicken-salad': {
      id: 'grilled-chicken-salad',
      name: 'Grilled Chicken Salad',
      description: 'A protein-rich lunch with fresh vegetables and a light vinaigrette.',
      prepTime: 15,
      cookTime: 12,
      servings: 1,
      calories: 280,
      ingredients: [
        '4 oz chicken breast',
        '2 cups mixed greens',
        '1/2 cucumber, sliced',
        '1/4 cup cherry tomatoes',
        '1/4 avocado, sliced',
        '2 tbsp olive oil',
        '1 tbsp lemon juice',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Season chicken breast with salt and pepper',
        'Grill chicken for 6 minutes per side',
        'Let chicken rest for 5 minutes, then slice',
        'Combine greens, cucumber, tomatoes, and avocado',
        'Whisk together olive oil and lemon juice for dressing',
        'Top salad with sliced chicken and drizzle with dressing'
      ],
      tags: ['lunch', 'protein', 'low-carb', 'gluten-free']
    },
    'salmon-quinoa': {
      id: 'salmon-quinoa',
      name: 'Salmon with Quinoa',
      description: 'A heart-healthy dinner featuring omega-3 rich salmon and protein-packed quinoa.',
      prepTime: 10,
      cookTime: 20,
      servings: 1,
      calories: 450,
      ingredients: [
        '5 oz salmon fillet',
        '1/2 cup quinoa',
        '1 cup vegetable broth',
        '1/2 cup steamed broccoli',
        '1 tbsp olive oil',
        '1 clove garlic, minced',
        'Lemon wedges',
        'Fresh dill'
      ],
      instructions: [
        'Rinse quinoa and cook in vegetable broth for 15 minutes',
        'Season salmon with salt, pepper, and minced garlic',
        'Heat olive oil in a pan over medium-high heat',
        'Cook salmon for 4-5 minutes per side',
        'Steam broccoli until tender',
        'Serve salmon over quinoa with broccoli and lemon wedges',
        'Garnish with fresh dill'
      ],
      tags: ['dinner', 'protein', 'omega-3', 'gluten-free']
    },
    'avocado-toast': {
      id: 'avocado-toast',
      name: 'Avocado Toast',
      description: 'A trendy and nutritious breakfast with healthy fats and fiber.',
      prepTime: 5,
      cookTime: 3,
      servings: 1,
      calories: 320,
      ingredients: [
        '2 slices whole grain bread',
        '1 ripe avocado',
        '1 tbsp lemon juice',
        'Salt and pepper to taste',
        'Red pepper flakes',
        '2 poached eggs (optional)'
      ],
      instructions: [
        'Toast bread slices until golden',
        'Mash avocado with lemon juice, salt, and pepper',
        'Spread avocado mixture on toast',
        'Top with red pepper flakes',
        'Add poached eggs if desired',
        'Serve immediately'
      ],
      tags: ['breakfast', 'healthy', 'quick', 'vegetarian']
    },
    'lentil-soup': {
      id: 'lentil-soup',
      name: 'Lentil Soup',
      description: 'A hearty and warming soup packed with plant-based protein and fiber.',
      prepTime: 10,
      cookTime: 30,
      servings: 4,
      calories: 280,
      ingredients: [
        '1 cup red lentils',
        '1 onion, diced',
        '2 carrots, diced',
        '2 celery stalks, diced',
        '3 cloves garlic, minced',
        '4 cups vegetable broth',
        '1 can diced tomatoes',
        '1 tsp cumin',
        '1 tsp turmeric',
        '2 tbsp olive oil'
      ],
      instructions: [
        'Heat olive oil in a large pot over medium heat',
        'Add onion, carrots, and celery, cook for 5 minutes',
        'Add garlic and spices, cook for 1 minute',
        'Add lentils, broth, and tomatoes',
        'Bring to boil, then simmer for 25 minutes',
        'Season with salt and pepper',
        'Serve hot with crusty bread'
      ],
      tags: ['lunch', 'vegetarian', 'protein', 'comfort']
    },
    'grilled-fish': {
      id: 'grilled-fish',
      name: 'Grilled Fish with Vegetables',
      description: 'A light and healthy dinner with perfectly grilled fish and seasonal vegetables.',
      prepTime: 15,
      cookTime: 15,
      servings: 1,
      calories: 350,
      ingredients: [
        '6 oz white fish fillet',
        '1 cup mixed vegetables (zucchini, bell pepper, asparagus)',
        '2 tbsp olive oil',
        '1 lemon',
        'Fresh herbs (thyme, rosemary)',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Preheat grill to medium-high heat',
        'Season fish with salt, pepper, and herbs',
        'Toss vegetables with olive oil and seasonings',
        'Grill fish for 4-5 minutes per side',
        'Grill vegetables until tender and charred',
        'Serve fish with vegetables and lemon wedges'
      ],
      tags: ['dinner', 'protein', 'low-carb', 'gluten-free']
    },
    'greek-yogurt-parfait': {
      id: 'greek-yogurt-parfait',
      name: 'Greek Yogurt Parfait',
      description: 'A layered breakfast treat with protein-rich Greek yogurt and fresh fruits.',
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      calories: 250,
      ingredients: [
        '1 cup Greek yogurt',
        '1/2 cup granola',
        '1/2 cup mixed berries',
        '1 tbsp honey',
        '1 tbsp chia seeds'
      ],
      instructions: [
        'Layer half the yogurt in a glass',
        'Add half the granola and berries',
        'Repeat layers',
        'Drizzle with honey',
        'Top with chia seeds'
      ],
      tags: ['breakfast', 'healthy', 'quick', 'vegetarian']
    },
    'turkey-wrap': {
      id: 'turkey-wrap',
      name: 'Turkey Wrap',
      description: 'A protein-packed lunch wrap with lean turkey and fresh vegetables.',
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      calories: 320,
      ingredients: [
        '1 large tortilla',
        '4 oz sliced turkey',
        '2 tbsp hummus',
        '1/4 avocado, sliced',
        '1/4 cup spinach',
        '1/4 cup shredded carrots',
        '1 tbsp ranch dressing'
      ],
      instructions: [
        'Spread hummus on tortilla',
        'Layer turkey slices',
        'Add avocado, spinach, and carrots',
        'Drizzle with ranch dressing',
        'Roll tightly and slice in half'
      ],
      tags: ['lunch', 'protein', 'quick', 'portable']
    },
    'vegetable-stir-fry': {
      id: 'vegetable-stir-fry',
      name: 'Vegetable Stir-Fry',
      description: 'A colorful and nutritious dinner with fresh vegetables and aromatic spices.',
      prepTime: 15,
      cookTime: 10,
      servings: 2,
      calories: 180,
      ingredients: [
        '2 cups mixed vegetables (broccoli, bell peppers, carrots)',
        '2 tbsp sesame oil',
        '2 cloves garlic, minced',
        '1 tbsp ginger, grated',
        '3 tbsp soy sauce',
        '1 tbsp rice vinegar',
        '1 tsp cornstarch',
        '2 green onions, chopped'
      ],
      instructions: [
        'Heat sesame oil in a large pan',
        'Add garlic and ginger, cook for 1 minute',
        'Add vegetables and stir-fry for 5-7 minutes',
        'Mix soy sauce, rice vinegar, and cornstarch',
        'Add sauce to vegetables and cook for 2 minutes',
        'Garnish with green onions'
      ],
      tags: ['dinner', 'vegetarian', 'healthy', 'asian']
    },
    'smoothie-bowl': {
      id: 'smoothie-bowl',
      name: 'Smoothie Bowl',
      description: 'A thick and creamy breakfast bowl topped with fresh fruits and nuts.',
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      calories: 280,
      ingredients: [
        '1 frozen banana',
        '1/2 cup frozen berries',
        '1/2 cup almond milk',
        '1 tbsp almond butter',
        '1 tbsp chia seeds',
        'Fresh berries for topping',
        'Granola for topping'
      ],
      instructions: [
        'Blend frozen banana, berries, and almond milk',
        'Add almond butter and blend until smooth',
        'Pour into a bowl',
        'Top with fresh berries and granola',
        'Sprinkle with chia seeds'
      ],
      tags: ['breakfast', 'healthy', 'quick', 'vegetarian']
    },
    'chicken-caesar-salad': {
      id: 'chicken-caesar-salad',
      name: 'Chicken Caesar Salad',
      description: 'A classic salad with grilled chicken, crisp romaine, and creamy Caesar dressing.',
      prepTime: 15,
      cookTime: 12,
      servings: 1,
      calories: 350,
      ingredients: [
        '4 oz chicken breast',
        '3 cups romaine lettuce',
        '1/4 cup croutons',
        '2 tbsp Caesar dressing',
        '2 tbsp parmesan cheese',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Season and grill chicken breast',
        'Let chicken rest, then slice',
        'Toss lettuce with Caesar dressing',
        'Top with sliced chicken',
        'Add croutons and parmesan cheese'
      ],
      tags: ['lunch', 'protein', 'classic', 'gluten-free']
    },
    'pasta-marinara': {
      id: 'pasta-marinara',
      name: 'Pasta with Marinara',
      description: 'A simple and comforting dinner with pasta and homemade marinara sauce.',
      prepTime: 10,
      cookTime: 20,
      servings: 2,
      calories: 400,
      ingredients: [
        '8 oz pasta',
        '2 cups marinara sauce',
        '2 cloves garlic, minced',
        '2 tbsp olive oil',
        'Fresh basil leaves',
        'Parmesan cheese',
        'Salt and pepper to taste'
      ],
      instructions: [
        'Cook pasta according to package directions',
        'Heat olive oil in a pan',
        'Add garlic and cook for 1 minute',
        'Add marinara sauce and simmer',
        'Toss pasta with sauce',
        'Garnish with basil and parmesan'
      ],
      tags: ['dinner', 'vegetarian', 'comfort', 'italian']
    },
    'greek-yogurt-with-honey': {
      id: 'greek-yogurt-with-honey',
      name: 'Greek Yogurt with Honey',
      description: 'A creamy and protein-rich snack perfect for any time of day.',
      prepTime: 2,
      cookTime: 0,
      servings: 1,
      calories: 120,
      ingredients: [
        '1 cup Greek yogurt',
        '1 tbsp honey',
        '1/4 tsp vanilla extract',
        'Fresh berries (optional)',
        'Chopped nuts (optional)'
      ],
      instructions: [
        'Scoop Greek yogurt into a bowl',
        'Drizzle honey over the yogurt',
        'Add vanilla extract and stir gently',
        'Top with fresh berries and nuts if desired',
        'Serve immediately'
      ],
      tags: ['snack', 'protein', 'quick', 'healthy']
    },
    'dark-chocolate-bark': {
      id: 'dark-chocolate-bark',
      name: 'Dark Chocolate Bark',
      description: 'A rich and indulgent dessert with antioxidant benefits.',
      prepTime: 10,
      cookTime: 0,
      servings: 4,
      calories: 180,
      ingredients: [
        '4 oz dark chocolate (70% cacao)',
        '2 tbsp coconut oil',
        '1/4 cup chopped nuts',
        '2 tbsp dried fruit',
        'Sea salt flakes'
      ],
      instructions: [
        'Melt dark chocolate with coconut oil',
        'Pour onto parchment paper',
        'Sprinkle with nuts and dried fruit',
        'Add a pinch of sea salt',
        'Refrigerate for 30 minutes',
        'Break into pieces and serve'
      ],
      tags: ['dessert', 'antioxidants', 'indulgent', 'gluten-free']
    },
    'apple-slices': {
      id: 'apple-slices',
      name: 'Apple Slices',
      description: 'A simple, crunchy, and naturally sweet snack.',
      prepTime: 3,
      cookTime: 0,
      servings: 1,
      calories: 80,
      ingredients: [
        '1 medium apple',
        '1 tbsp lemon juice',
        'Cinnamon (optional)',
        'Nut butter (optional)'
      ],
      instructions: [
        'Wash and core the apple',
        'Slice into thin wedges',
        'Toss with lemon juice to prevent browning',
        'Sprinkle with cinnamon if desired',
        'Serve with nut butter for dipping'
      ],
      tags: ['snack', 'fruit', 'fiber', 'quick']
    },
    'protein-smoothie': {
      id: 'protein-smoothie',
      name: 'Protein Smoothie',
      description: 'A filling and nutritious drink packed with protein and vitamins.',
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      calories: 200,
      ingredients: [
        '1 scoop protein powder',
        '1 banana',
        '1 cup almond milk',
        '1 tbsp almond butter',
        '1 tsp chia seeds',
        'Ice cubes'
      ],
      instructions: [
        'Add all ingredients to a blender',
        'Blend on high for 30 seconds',
        'Add ice and blend until smooth',
        'Pour into a glass',
        'Serve immediately'
      ],
      tags: ['snack', 'protein', 'smoothie', 'post-workout']
    },
    'chia-pudding': {
      id: 'chia-pudding',
      name: 'Chia Pudding',
      description: 'A creamy, fiber-rich dessert that can be prepared ahead of time.',
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      calories: 150,
      ingredients: [
        '3 tbsp chia seeds',
        '1 cup almond milk',
        '1 tbsp maple syrup',
        '1/2 tsp vanilla extract',
        'Fresh berries for topping'
      ],
      instructions: [
        'Mix chia seeds with almond milk',
        'Add maple syrup and vanilla',
        'Stir well and let sit for 5 minutes',
        'Stir again and refrigerate for 2 hours',
        'Top with fresh berries before serving'
      ],
      tags: ['dessert', 'fiber', 'make-ahead', 'healthy']
    }
  };


  // Helper function to get meal detail by name
  const getMealDetail = (mealName: string): MealDetail | null => {
    const mealKey = mealName.toLowerCase().replace(/\s+/g, '-');
    return mealDetails[mealKey] || null;
  };

  // Click handler for meals
  const handleMealClick = (mealName: string, mealId?: number | null) => {
    // If we have a mealId and generated meal plan, use the actual recipe data
    if (mealId && generatedMealPlan?.recipes) {
      const recipe = generatedMealPlan.recipes[mealId.toString()];
      if (recipe) {
        // Convert recipe data to the format expected by the modal
        const mealDetail: MealDetail = {
          id: recipe.id.toString(),
          name: recipe.name,
          description: `${recipe.name} - ${recipe.source || 'Recipe'}`,
          prepTime: Math.floor(recipe.time * 0.3), // Estimate prep time as 30% of total time
          cookTime: Math.floor(recipe.time * 0.7), // Estimate cook time as 70% of total time
          servings: 4, // Default servings since Recipe doesn't have this field
          calories: recipe.calories,
          ingredients: recipe.ingredients,
          instructions: recipe.steps,
          tags: [] // Default empty tags since Recipe doesn't have this field
        };
        setSelectedMeal(mealDetail);
        onHideNavbar?.(true);
        return;
      }
    }
    
    // Fallback to hardcoded meal details for snacks/desserts
    const mealDetail = getMealDetail(mealName);
    if (mealDetail) {
      setSelectedMeal(mealDetail);
      onHideNavbar?.(true); // Hide navbar when meal is selected
    }
  };

  // Close handler for modal
  const handleCloseModal = () => {
    setSelectedMeal(null);
    onHideNavbar?.(false); // Show navbar when modal is closed
  };

  // Add to cart handler
  const handleAddToCart = (mealDetail: MealDetail) => {
    // Convert MealDetail to Recipe format
    const recipe: Recipe = {
      id: mealDetail.id,
      name: mealDetail.name,
      time: mealDetail.prepTime + mealDetail.cookTime,
      servings: mealDetail.servings,
      calories: mealDetail.calories,
      protein: 0, // Default value since MealDetail doesn't have protein
      tags: mealDetail.tags,
      ingredients: mealDetail.ingredients,
      steps: mealDetail.instructions
    };
    addToCart(recipe);
  };

  // Toggle favorite handler
  const toggleFavorite = (mealName: string) => {
    setFavoriteMeals(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(mealName)) {
        newFavorites.delete(mealName);
      } else {
        newFavorites.add(mealName);
      }
      return newFavorites;
    });
  };

  // Map user data to preferences format for meal plan generation
  const mapUserToPreferences = (user: any) => {
    return {
      user_id: user.id,
      dietary_restrictions: user.dietary_restrictions || [],
      disliked_foods: user.disliked_foods || [],
      preferred_ingredients: user.preferred_cuisines || [],
      daily_calories: user.daily_calories_goal || 2000,
      daily_protein: user.protein_goal_g || 150,
      servings_per_meal: user.meals_per_day || 1,
      kitchen_tools: ['oven', 'stovetop', 'blender'], // Default kitchen tools
      specific_cravings: ['pasta', 'pizza', 'soup', 'salad', 'stir-fry', 'sandwich', 'curry'] // Default cravings
    };
  };

  // Generate meal plan function
  const generateMealPlan = async () => {
    if (!user) {
      alert('Please log in to generate a meal plan');
      return;
    }

    setIsGeneratingMealPlan(true);
    try {
      const preferences = mapUserToPreferences(user);
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const data = await response.json();
      setGeneratedMealPlan(data.mealPlan);
      console.log('Meal plan generated successfully:', data.mealPlan);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Error generating meal plan. Please try again.');
    } finally {
      setIsGeneratingMealPlan(false);
    }
  };

  // Get today's meals from generated meal plan or use defaults
  const getTodaysMeals = () => {
    if (generatedMealPlan && generatedMealPlan.meal_ids) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const dayIndex = generatedMealPlan.days.indexOf(today);
      
      console.log('Today:', today, 'Day index:', dayIndex);
      console.log('Generated meal plan:', generatedMealPlan);
      
      if (dayIndex !== -1 && generatedMealPlan.meal_ids[dayIndex]) {
        const mealIds = generatedMealPlan.meal_ids[dayIndex];
        const meals = generatedMealPlan.meals || ['Breakfast', 'Lunch', 'Dinner'];
        
        console.log('Today\'s meal IDs:', mealIds);
        
        return mealIds.map((mealId: number, index: number) => {
          const recipe = generatedMealPlan.recipes[mealId.toString()];
          return {
            id: `${mealId}-${index}`, // Create unique key by combining mealId and index
            name: recipe?.name || `Recipe ${mealId}`, // Use actual recipe name or fallback
            image: '/api/placeholder/150/150',
            calories: recipe?.calories || 300, // Use actual recipe calories or fallback
            time: meals[index] || 'Meal'
          };
        });
      }
    }
    
    // Fallback to default meals if no generated meal plan
    return [
      {
        id: '1',
        name: 'Oatmeal with Berries',
        image: '/api/placeholder/150/150',
        calories: 350,
        time: 'Breakfast'
      },
      {
        id: '2',
        name: 'Grilled Chicken Salad',
        image: '/api/placeholder/150/150',
        calories: 450,
        time: 'Lunch'
      },
      {
        id: '3',
        name: 'Salmon with Quinoa',
        image: '/api/placeholder/150/150',
        calories: 600,
        time: 'Dinner'
      }
    ];
  };

  // Generate weekly meals from the generated meal plan or use defaults
  const getWeeklyMeals = (): WeeklyMeal[] => {
    if (generatedMealPlan && generatedMealPlan.meal_ids && generatedMealPlan.recipes) {
      return generatedMealPlan.days.map((day: string, dayIndex: number) => {
        const mealIds = generatedMealPlan.meal_ids[dayIndex];
        const mealTypes = generatedMealPlan.meals || ['Breakfast', 'Lunch', 'Dinner'];
        
        return {
          id: (dayIndex + 1).toString(),
          day: day,
          meals: {
            breakfast: mealIds[0] ? generatedMealPlan.recipes[mealIds[0].toString()]?.name || `Recipe ${mealIds[0]}` : 'No meal planned',
            lunch: mealIds[1] ? generatedMealPlan.recipes[mealIds[1].toString()]?.name || `Recipe ${mealIds[1]}` : 'No meal planned',
            dinner: mealIds[2] ? generatedMealPlan.recipes[mealIds[2].toString()]?.name || `Recipe ${mealIds[2]}` : 'No meal planned'
          },
          mealIds: {
            breakfast: mealIds[0] || null,
            lunch: mealIds[1] || null,
            dinner: mealIds[2] || null
          }
        };
      });
    }
    
    // Fallback to default meals if no generated meal plan
    return [
      {
        id: '1',
        day: 'Monday',
        meals: {
          breakfast: 'Oatmeal with berries',
          lunch: 'Grilled chicken salad',
          dinner: 'Salmon with quinoa'
        }
      },
      {
        id: '2',
        day: 'Tuesday',
        meals: {
          breakfast: 'Greek yogurt parfait',
          lunch: 'Turkey wrap',
          dinner: 'Vegetable stir-fry'
        }
      },
      {
        id: '3',
        day: 'Wednesday',
        meals: {
          breakfast: 'Avocado toast',
          lunch: 'Lentil soup',
          dinner: 'Grilled fish with vegetables'
        }
      },
      {
        id: '4',
        day: 'Thursday',
        meals: {
          breakfast: 'Smoothie bowl',
          lunch: 'Chicken Caesar salad',
          dinner: 'Pasta with marinara'
        }
      },
      {
        id: '5',
        day: 'Friday',
        meals: {
          breakfast: 'Scrambled eggs',
          lunch: 'Quinoa bowl',
          dinner: 'BBQ chicken'
        }
      },
      {
        id: '6',
        day: 'Saturday',
        meals: {
          breakfast: 'Pancakes',
          lunch: 'Burger',
          dinner: 'Pizza'
        }
      },
      {
        id: '7',
        day: 'Sunday',
        meals: {
          breakfast: 'French toast',
          lunch: 'Sandwich',
          dinner: 'Roast dinner'
        }
      }
    ];
  };

  const weeklyMeals = getWeeklyMeals();
  const todaysMeals = getTodaysMeals();

  // Toggle checkbox handler
  const toggleCheckbox = (mealId: string) => {
    setCheckedMeals(prev => {
      const newChecked = new Set(prev);
      if (newChecked.has(mealId)) {
        newChecked.delete(mealId);
      } else {
        newChecked.add(mealId);
      }
      return newChecked;
    });
  };


  // Snacks/Desserts slider data
  const snacksDesserts = [
    {
      id: '1',
      name: 'Greek Yogurt with Honey',
      image: '/api/placeholder/200/150',
      calories: 120,
      type: 'Snack'
    },
    {
      id: '2',
      name: 'Dark Chocolate Bark',
      image: '/api/placeholder/200/150',
      calories: 180,
      type: 'Dessert'
    },
    {
      id: '3',
      name: 'Apple Slices',
      image: '/api/placeholder/200/150',
      calories: 80,
      type: 'Snack'
    },
    {
      id: '4',
      name: 'Protein Smoothie',
      image: '/api/placeholder/200/150',
      calories: 200,
      type: 'Snack'
    },
    {
      id: '5',
      name: 'Chia Pudding',
      image: '/api/placeholder/200/150',
      calories: 150,
      type: 'Dessert'
    }
  ];

  const handleUpdateMacros = (updatedMacros: Macro[]) => {
    setMacros(updatedMacros);
  };

  const nextSnack = () => {
    const maxIndex = Math.ceil(snacksDesserts.length / 4) - 1;
    setCurrentSnackIndex((prev) => (prev + 1) % (maxIndex + 1));
  };

  const prevSnack = () => {
    const maxIndex = Math.ceil(snacksDesserts.length / 4) - 1;
    setCurrentSnackIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1));
  };

  // If a meal is selected, show modal overlay
  if (selectedMeal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-200 via-teal-200 to-emerald-200 pb-20">
        {/* Meal Detail Modal - Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedMeal.name}</h2>
                  <p className="text-gray-600 text-lg">{selectedMeal.description}</p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                >
                  <X size={28} />
                </button>
              </div>

              {/* Meal Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="text-center p-4 bg-sky-50 rounded-lg">
                  <ClockIcon className="mx-auto text-sky-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedMeal.prepTime} min</div>
                  <div className="text-sm text-gray-600">Prep Time</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <ChefHat className="mx-auto text-emerald-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedMeal.cookTime} min</div>
                  <div className="text-sm text-gray-600">Cook Time</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <Users className="mx-auto text-teal-600 mb-2" size={24} />
                  <div className="text-lg font-medium text-gray-900">{selectedMeal.servings}</div>
                  <div className="text-sm text-gray-600">Servings</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 rounded-lg">
                  <div className="mx-auto text-cyan-600 mb-2 font-bold text-lg">{selectedMeal.calories}</div>
                  <div className="text-sm text-gray-600">Calories</div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-8">
                {selectedMeal.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Ingredients and Instructions - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Ingredients */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText className="text-sky-600" size={20} />
                    Ingredients
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <ul className="space-y-3">
                      {selectedMeal.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-sky-600 rounded-full flex-shrink-0"></div>
                          <span className="text-gray-700">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <ChefHat className="text-emerald-600" size={20} />
                    Instructions
                  </h3>
                  <div className="max-h-96 overflow-y-auto">
                    <ol className="space-y-4">
                      {selectedMeal.instructions.map((instruction, index) => (
                        <li key={index} className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <span className="text-gray-700 leading-relaxed">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>

              {/* User Notes */}
              <div className="bg-white border rounded-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Plus className="text-emerald-600" size={20} />
                  Your Notes
                </h3>
                <textarea
                  value={userNotes[selectedMeal.id] || ''}
                  onChange={(e) => setUserNotes(prev => ({ ...prev, [selectedMeal.id]: e.target.value }))}
                  placeholder="Add your personal notes, modifications, or cooking tips here..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => handleAddToCart(selectedMeal)}
                  className="flex-1 bg-teal-600 text-white py-4 px-6 rounded-lg hover:bg-teal-700 transition-colors font-medium text-lg"
                >
                  Add to Cart
                </button>
                <button className="flex-1 bg-sky-200 text-sky-700 py-4 px-6 rounded-lg hover:bg-sky-300 transition-colors font-medium text-lg">
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-teal-200 to-emerald-200 pb-20">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
              <p className="text-gray-600">Welcome back! Here's your meal plan overview.</p>
            </div>
            
            {/* Nutrition Points, Coupons & Cart */}
            <div className="flex items-center gap-4">
              {/* Nutrition Points */}
              <div className="flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-teal-500 text-white px-4 py-2 rounded-lg">
                <Star className="w-5 h-5" />
                <div>
                  <div className="text-sm font-medium">Nutrition Points</div>
                  <div className="text-lg font-bold">1,247</div>
                </div>
              </div>
              
              {/* Coupons Icon */}
              <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
                <Ticket className="w-5 h-5" />
                <div>
                  <div className="text-sm font-medium">Coupons</div>
                  <div className="text-lg font-bold">3</div>
                </div>
              </button>

              {/* Smart Shopping Cart Button */}
              <button 
                onClick={() => setShowSmartCart(true)}
                className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                <div>
                  <div className="text-sm font-medium">Smart Cart</div>
                  <div className="text-lg font-bold">AI</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Daily Meals and Weekly Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Meals Box */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Today's Meals</h2>
                <button
                  onClick={generateMealPlan}
                  disabled={isGeneratingMealPlan}
                  className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGeneratingMealPlan ? 'Generating...' : 'Generate Meal Plan'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {todaysMeals.map((meal: any) => (
                  <div 
                    key={meal.id} 
                    className={`text-center hover:bg-gray-50 p-2 rounded-lg transition-all duration-300 relative ${
                      checkedMeals.has(meal.id) ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    <button
                      onClick={() => handleMealClick(meal.name, meal.id)}
                      className="w-full"
                    >
                      <div className="w-full h-40 bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">Meal Image</span>
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm">{meal.name}</h3>
                      <p className="text-xs text-gray-600">{meal.time}</p>
                      <p className="text-xs text-gray-500">{meal.calories} cal</p>
                    </button>
                    
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCheckbox(meal.id);
                      }}
                      className={`absolute top-3 left-3 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                        checkedMeals.has(meal.id)
                          ? 'bg-teal-500 border-teal-500 text-white'
                          : 'bg-white border-gray-300 hover:border-teal-400'
                      }`}
                    >
                      {checkedMeals.has(meal.id) && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(meal.name);
                      }}
                      className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${
                        favoriteMeals.has(meal.name)
                          ? 'bg-red-500 text-white'
                          : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
                      }`}
                    >
                      <Heart size={16} fill={favoriteMeals.has(meal.name) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Snacks/Desserts Carousel */}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800 text-sm">Snacks & Desserts Ideas</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={prevSnack}
                      className="p-1 rounded-full bg-sky-100 hover:bg-sky-200 transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={nextSnack}
                      className="p-1 rounded-full bg-sky-100 hover:bg-sky-200 transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="relative overflow-hidden">
                  <div 
                    className="flex transition-transform duration-300 ease-in-out gap-2"
                    style={{ transform: `translateX(-${currentSnackIndex * (100 / 4)}%)` }}
                  >
                    {snacksDesserts.map((item) => (
                      <div key={item.id} className="w-1/4 flex-shrink-0">
                        <div className="w-full bg-white border rounded-lg p-2 hover:shadow-md transition-shadow text-left relative">
                          <button
                            onClick={() => handleMealClick(item.name)}
                            className="w-full"
                          >
                            <div className="w-full h-16 bg-gray-200 rounded-lg mb-1 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">Image</span>
                            </div>
                            <h4 className="font-medium text-gray-900 text-xs mb-1">{item.name}</h4>
                            <p className="text-xs text-gray-600 mb-1">{item.type}</p>
                            <p className="text-xs text-gray-500">{item.calories} cal</p>
                          </button>
                          
                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(item.name);
                            }}
                            className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${
                              favoriteMeals.has(item.name)
                                ? 'bg-red-500 text-white'
                                : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Heart size={12} fill={favoriteMeals.has(item.name) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Dots indicator */}
                <div className="flex justify-center gap-1 mt-2">
                  {Array.from({ length: Math.ceil(snacksDesserts.length / 4) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSnackIndex(index)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        index === currentSnackIndex ? 'bg-teal-500' : 'bg-sky-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly Calendar - Horizontal */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-teal-600" size={20} />
                <h2 className="text-lg font-semibold text-gray-800">Weekly Meal Plan</h2>
              </div>
              
              {/* Days Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weeklyMeals.map((day) => (
                  <div key={day.id} className="text-center">
                    <div className="text-sm font-medium text-gray-800 mb-2">{day.day}</div>
                    <div className="space-y-1">
                      <div className="relative">
                        <button
                          onClick={() => handleMealClick(day.meals.breakfast, day.mealIds?.breakfast || undefined)}
                          className="w-full text-xs text-gray-600 bg-sky-50 p-2 rounded hover:bg-sky-100 transition-colors text-left"
                        >
                          <div className="font-medium">Breakfast</div>
                          <div className="truncate">{day.meals.breakfast}</div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(day.meals.breakfast);
                          }}
                          className={`absolute top-1 right-1 p-1 rounded-full transition-colors ${
                            favoriteMeals.has(day.meals.breakfast)
                              ? 'bg-red-500 text-white'
                              : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart size={10} fill={favoriteMeals.has(day.meals.breakfast) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => handleMealClick(day.meals.lunch, day.mealIds?.lunch || undefined)}
                          className="w-full text-xs text-gray-600 bg-sky-50 p-2 rounded hover:bg-sky-100 transition-colors text-left"
                        >
                          <div className="font-medium">Lunch</div>
                          <div className="truncate">{day.meals.lunch}</div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(day.meals.lunch);
                          }}
                          className={`absolute top-1 right-1 p-1 rounded-full transition-colors ${
                            favoriteMeals.has(day.meals.lunch)
                              ? 'bg-red-500 text-white'
                              : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart size={10} fill={favoriteMeals.has(day.meals.lunch) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() => handleMealClick(day.meals.dinner, day.mealIds?.dinner || undefined)}
                          className="w-full text-xs text-gray-600 bg-sky-50 p-2 rounded hover:bg-sky-100 transition-colors text-left"
                        >
                          <div className="font-medium">Dinner</div>
                          <div className="truncate">{day.meals.dinner}</div>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(day.meals.dinner);
                          }}
                          className={`absolute top-1 right-1 p-1 rounded-full transition-colors ${
                            favoriteMeals.has(day.meals.dinner)
                              ? 'bg-red-500 text-white'
                              : 'bg-white text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                        >
                          <Heart size={10} fill={favoriteMeals.has(day.meals.dinner) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Macro Tracking */}
          <div>
            <MacroTracking 
              userMacros={macros} 
              onUpdateMacros={handleUpdateMacros}
            />
          </div>
        </div>

      </div>

      {/* Cart Component - Overlay */}
      {showCart && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCart(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-shrink-0 bg-white border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowCart(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
                    <p className="text-gray-600">{cart.length} items from your meal plan</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <ShoppingCartComponent 
                cart={cart}
                setCart={setCart}
                onNavigateToMealPlan={() => setShowCart(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Smart Shopping Cart Modal */}
      <ShoppingCartModal 
        isOpen={showSmartCart}
        onClose={() => setShowSmartCart(false)}
        mealPlanData={weeklyMeals}
        userId={user?.id?.toString()}
      />
    </div>
  );
}
