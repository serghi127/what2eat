import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ALL_RECIPES } from '../../../constants/index';

export async function POST(req: NextRequest) {
  try {
    const userEmail = req.headers.get('user-id');
    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 });
    }

    console.log('Generate meal plan request for user:', userEmail);

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userData.id;
    console.log('Found user ID:', userId);

    // Fetch user preferences from Supabase
    console.log('Fetching user preferences...');
    const [dietaryPrefsResult, goalsResult, userProfileResult] = await Promise.all([
      supabase.from('dietary_prefs').select('*').eq('id', userId).maybeSingle(),
      supabase.from('goals').select('*').eq('id', userId).maybeSingle(),
      supabase.from('users').select('*').eq('id', userId).single()
    ]);

    const dietaryPrefs = dietaryPrefsResult.data || {};
    const goals = goalsResult.data || {};
    const userProfile = userProfileResult.data || {};

    // Allow preferences from request body to override database preferences
    const requestBody = await req.json().catch(() => ({}));
    const requestPreferences = requestBody.preferences || {};

    console.log('User preferences:', {
      dietaryPrefs,
      goals,
      userProfile: { age: userProfile.age, gender: userProfile.gender, activity_level: userProfile.activity_level },
      requestPreferences
    });

    // Get dietary restrictions - prioritize request preferences, but fall back to database if request is empty
    const dietaryRestrictions = (requestPreferences.dietary_restrictions && requestPreferences.dietary_restrictions.length > 0) 
      ? requestPreferences.dietary_restrictions 
      : (dietaryPrefs.restrictions || []);
    console.log('Dietary restrictions:', dietaryRestrictions);

    // Filter recipes based on dietary restrictions
    let availableRecipes = ALL_RECIPES;
    
    if (dietaryRestrictions.includes('vegetarian')) {
      availableRecipes = availableRecipes.filter(recipe => {
        // Check tags first
        const hasVegetarianTag = recipe.tags.includes('vegetarian') || recipe.tags.includes('vegan');
        if (!hasVegetarianTag) return false;
        
        // Also check ingredients to catch incorrectly tagged recipes
        const ingredientsText = recipe.ingredients.join(' ').toLowerCase();
        const meatKeywords = ['beef', 'chicken', 'pork', 'turkey', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon', 'ham', 'sausage', 'meat', 'ground beef', 'chicken broth', 'beef broth', 'fish sauce', 'anchovy', 'worcestershire'];
        const hasMeat = meatKeywords.some(keyword => ingredientsText.includes(keyword));
        
        return !hasMeat;
      });
      console.log(`Filtered to ${availableRecipes.length} vegetarian recipes`);
    } else if (dietaryRestrictions.includes('vegan')) {
      availableRecipes = availableRecipes.filter(recipe => {
        // Check tags first
        const hasVeganTag = recipe.tags.includes('vegan');
        if (!hasVeganTag) return false;
        
        // Also check ingredients to catch incorrectly tagged recipes
        const ingredientsText = recipe.ingredients.join(' ').toLowerCase();
        const nonVeganKeywords = ['beef', 'chicken', 'pork', 'turkey', 'lamb', 'fish', 'salmon', 'tuna', 'shrimp', 'bacon', 'ham', 'sausage', 'meat', 'ground beef', 'chicken broth', 'beef broth', 'fish sauce', 'anchovy', 'worcestershire', 'milk', 'cheese', 'butter', 'cream', 'yogurt', 'eggs', 'honey'];
        const hasNonVegan = nonVeganKeywords.some(keyword => ingredientsText.includes(keyword));
        
        return !hasNonVegan;
      });
      console.log(`Filtered to ${availableRecipes.length} vegan recipes`);
    }

    // Generate weekly meal plan
    const weeklyPlan: Record<string, Record<string, number>> = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];

    for (const day of days) {
      weeklyPlan[day] = {};
      for (const mealType of mealTypes) {
        // Filter recipes for this meal type
        const mealRecipes = availableRecipes.filter(recipe => 
          recipe.tags.includes(mealType)
        );
        
        if (mealRecipes.length > 0) {
          // Randomly select a recipe
          const randomIndex = Math.floor(Math.random() * mealRecipes.length);
          weeklyPlan[day][mealType] = Number(mealRecipes[randomIndex].id);
        } else {
          // Fallback to any available recipe
          const randomIndex = Math.floor(Math.random() * availableRecipes.length);
          weeklyPlan[day][mealType] = Number(availableRecipes[randomIndex].id);
        }
      }
    }

    console.log('Generated meal plan:', weeklyPlan);

    // Save to Supabase
    console.log('Attempting to save meal plan for user ID:', userId);
    console.log('Meal plan data to save:', weeklyPlan);
    
    const { data, error } = await supabase
      .from('meal_table')
      .upsert({
        id: userId,
        weekly_plan: weeklyPlan
      }, {
        onConflict: 'id'
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: "Failed to save meal plan to database" }, { status: 500 });
    }

    console.log('Supabase upsert result:', data);
    console.log('Successfully saved meal plan to database');

    return NextResponse.json({ 
      success: true, 
      mealPlan: weeklyPlan,
      message: "Weekly meal plan generated and saved successfully!"
    });

  } catch (error) {
    console.error('Error generating meal plan:', error);
    return NextResponse.json({ error: "Failed to generate meal plan" }, { status: 500 });
  }
}