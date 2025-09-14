import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ALL_RECIPES } from '@/app/constants';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabase
      .from('meal_history')
      .select('*')
      .order('date', { ascending: false });

    // Add date filters if provided
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: mealHistory, error: mealHistoryError } = await query;

    if (mealHistoryError) {
      console.error('Supabase error:', mealHistoryError);
      return NextResponse.json({ error: 'Failed to fetch meal history' }, { status: 500 });
    }

    return NextResponse.json({ mealHistory: mealHistory || [] });
  } catch (error) {
    console.error('Error fetching meal history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { date, mealType, recipeId, recipeName, completed = true, rating, notes } = await req.json();

    if (!date || !mealType || !recipeId || !recipeName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert meal history entry (store recipe ID and name)
    const { data, error } = await supabase
      .from('meal_history')
      .insert({
        date,
        meal_type: mealType,
        recipe_id: recipeId,
        recipe_name: recipeName,
        completed,
        rating: rating || null,
        notes: notes || null
      })
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save meal history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, mealHistory: data[0] });
  } catch (error) {
    console.error('Error saving meal history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, completed, rating, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing meal history ID' }, { status: 400 });
    }

    // Update meal history entry
    const updateData: any = {};
    if (completed !== undefined) updateData.completed = completed;
    if (rating !== undefined) updateData.rating = rating;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('meal_history')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update meal history' }, { status: 500 });
    }

    return NextResponse.json({ success: true, mealHistory: data[0] });
  } catch (error) {
    console.error('Error updating meal history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id, userId } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing meal history ID' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // First, fetch the meal history entry to get recipe information
    const { data: mealEntry, error: fetchError } = await supabase
      .from('meal_history')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching meal entry:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch meal entry' }, { status: 500 });
    }

    if (!mealEntry) {
      return NextResponse.json({ error: 'Meal entry not found' }, { status: 404 });
    }

    // Check if the meal is from today
    const today = new Date().toISOString().split('T')[0];
    const isToday = mealEntry.date === today;

    if (isToday) {
      // Find the recipe in ALL_RECIPES to get nutritional values
      const recipe = ALL_RECIPES.find(r => r.id === mealEntry.recipe_id);
      
      if (recipe) {
        // Get current daily progress
        const { data: currentProgress, error: progressError } = await supabase
          .from('daily_progress')
          .select('*')
          .eq('id', userId)
          .single();

        if (!progressError && currentProgress) {
          // Calculate new values by subtracting the recipe's macros
          const newProgress = {
            calories: Math.max(0, currentProgress.calories - recipe.calories),
            protein: Math.max(0, currentProgress.protein - (recipe.protein || 0)),
            carbs: Math.max(0, currentProgress.carbs - (recipe.carbs || 0)),
            fat: Math.max(0, currentProgress.fat - (recipe.fat || 0)),
            fiber: Math.max(0, currentProgress.fiber - (recipe.fiber || 0)),
            sugar: Math.max(0, currentProgress.sugar - (recipe.sugar || 0)),
            cholesterol: Math.max(0, currentProgress.cholesterol - (recipe.cholesterol || 0))
          };

          // Update daily progress
          const { error: updateError } = await supabase
            .from('daily_progress')
            .update(newProgress)
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating daily progress:', updateError);
            // Continue with deletion even if progress update fails
          } else {
            console.log(`Subtracted ${recipe.calories} calories from daily progress`);
          }
        }
      }
    }

    // Delete meal history entry
    const { error } = await supabase
      .from('meal_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to delete meal history' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
