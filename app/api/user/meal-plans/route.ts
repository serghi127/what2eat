import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const userEmail = authHeader.substring(7);
    
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

    // Get meal plan from meal_table
    const { data: mealTableData, error: mealTableError } = await supabase
      .from('meal_table')
      .select('weekly_plan')
      .eq('id', userData.id)
      .single();

    if (mealTableError) {
      console.error('Supabase error:', mealTableError);
      return NextResponse.json({ error: 'Failed to fetch meal plan' }, { status: 500 });
    }

    return NextResponse.json({ mealPlan: mealTableData?.weekly_plan || {} });
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const userEmail = authHeader.substring(7);
    const { dayOfWeek, mealType, recipeId } = await req.json();

    if (!dayOfWeek || !mealType || !recipeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // Get current meal plan
    const { data: currentData, error: fetchError } = await supabase
      .from('meal_table')
      .select('weekly_plan')
      .eq('id', userData.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Supabase error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current meal plan' }, { status: 500 });
    }

    // Initialize weekly plan if it doesn't exist
    let weeklyPlan = currentData?.weekly_plan || {};
    
    // Ensure the day exists in the weekly plan
    if (!weeklyPlan[dayOfWeek]) {
      weeklyPlan[dayOfWeek] = {};
    }
    
    // Set the recipe ID for the specific meal type
    weeklyPlan[dayOfWeek][mealType] = recipeId;

    // Upsert the meal plan
    const { data, error } = await supabase
      .from('meal_table')
      .upsert({
        id: userData.id,
        weekly_plan: weeklyPlan
      }, {
        onConflict: 'id'
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save meal plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, mealPlan: weeklyPlan });
  } catch (error) {
    console.error('Error saving meal plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    const userEmail = authHeader.substring(7);
    const { dayOfWeek, mealType } = await req.json();

    if (!dayOfWeek || !mealType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // Get current meal plan
    const { data: currentData, error: fetchError } = await supabase
      .from('meal_table')
      .select('weekly_plan')
      .eq('id', userData.id)
      .single();

    if (fetchError) {
      console.error('Supabase error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current meal plan' }, { status: 500 });
    }

    let weeklyPlan = currentData?.weekly_plan || {};
    
    // Remove the recipe from the specific day/meal
    if (weeklyPlan[dayOfWeek] && weeklyPlan[dayOfWeek][mealType]) {
      delete weeklyPlan[dayOfWeek][mealType];
      
      // If the day is now empty, remove it
      if (Object.keys(weeklyPlan[dayOfWeek]).length === 0) {
        delete weeklyPlan[dayOfWeek];
      }
    }

    // Update the meal plan
    const { error } = await supabase
      .from('meal_table')
      .upsert({
        id: userData.id,
        weekly_plan: weeklyPlan
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to delete meal plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
