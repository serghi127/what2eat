import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

// Helper function to calculate macro performance and award points
async function calculateAndAwardPoints(userId: string, progress: any) {
  try {
    // Get user's goals
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', userId)
      .single();

    if (goalsError || !goals) {
      console.log('No goals found for user, skipping point calculation');
      return;
    }

    // Get current stats
    const { data: stats, error: statsError } = await supabase
      .from('stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching stats:', statsError);
      return;
    }

    const currentPoints = stats?.points || 0;
    let totalPointsToAdd = 0;

    // Define macro categories and their performance thresholds
    const macroCategories = [
      { name: 'calories', current: progress.calories, goal: goals.calories },
      { name: 'protein', current: progress.protein, goal: goals.protein },
      { name: 'carbs', current: progress.carbs, goal: goals.carbs },
      { name: 'fat', current: progress.fat, goal: goals.fat },
      { name: 'fiber', current: progress.fiber, goal: goals.fiber },
      { name: 'sugar', current: progress.sugar, goal: goals.sugar },
      { name: 'cholesterol', current: progress.cholesterol, goal: goals.cholesterol }
    ];

    // Calculate points for each macro category
    macroCategories.forEach(macro => {
      if (macro.goal && macro.goal > 0) {
        const percentage = (macro.current / macro.goal) * 100;
        
        if (percentage >= 90 && percentage <= 110) {
          // Green zone (90-110%): 100 points
          totalPointsToAdd += 100;
          console.log(`${macro.name}: Green zone (${percentage.toFixed(1)}%) - +100 points`);
        } else if (percentage >= 60 && percentage < 90) {
          // Yellow zone (60-89%): 50 points
          totalPointsToAdd += 50;
          console.log(`${macro.name}: Yellow zone (${percentage.toFixed(1)}%) - +50 points`);
        } else {
          // Red zone (<60% or >110%): 0 points
          console.log(`${macro.name}: Red zone (${percentage.toFixed(1)}%) - +0 points`);
        }
      }
    });

    // Update stats with new points
    if (totalPointsToAdd > 0) {
      const newPoints = currentPoints + totalPointsToAdd;
      
      const { error: updateError } = await supabase
        .from('stats')
        .upsert({
          id: userId,
          points: newPoints,
          cart_items: stats?.cart_items || 0,
          cart_contents: stats?.cart_contents || null
        });

      if (updateError) {
        console.error('Error updating stats with points:', updateError);
      } else {
        console.log(`Awarded ${totalPointsToAdd} points! Total points: ${newPoints}`);
      }
    } else {
      console.log('No points awarded - all macros in red zone');
    }

  } catch (error) {
    console.error('Error calculating and awarding points:', error);
  }
}

// Get daily progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if we need to reset for a new day
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data: progress, error } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily progress' },
        { status: 500 }
      );
    }

    // If no progress record exists, create one
    if (!progress) {
      const { data: newProgress, error: insertError } = await supabase
        .from('daily_progress')
        .insert({
          id: userId,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          cholesterol: 0
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to create daily progress' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        progress: newProgress
      });
    }

    // Check if we need to reset for a new day
    const lastResetDate = progress.last_reset_date || progress.updated_at?.split('T')[0];
    
    console.log(`Last reset date: ${lastResetDate}, Today: ${today}`);
    
    if (lastResetDate !== today) {
      console.log(`Resetting progress for new day. Last reset: ${lastResetDate}, Today: ${today}`);
      
      // Calculate and award points based on yesterday's performance BEFORE resetting
      await calculateAndAwardPoints(userId, progress);
      
      const updateData: any = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        cholesterol: 0,
        updated_at: new Date().toISOString()
      };

      // Try to add last_reset_date if the column exists
      try {
        updateData.last_reset_date = today;
      } catch (err) {
        // Column doesn't exist, that's okay
        console.log('last_reset_date column not available, using updated_at for tracking');
      }

      try {
        const { data: resetProgress, error: resetError } = await supabase
          .from('daily_progress')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single();

        if (resetError) {
          console.error('Reset error:', resetError);
          return NextResponse.json(
            { error: 'Failed to reset daily progress' },
            { status: 500 }
          );
        }

        console.log(`Reset successful. New calories: ${resetProgress.calories}`);
        return NextResponse.json({
          progress: resetProgress
        });
      } catch (err) {
        console.error('Reset error:', err);
        return NextResponse.json(
          { error: 'Failed to reset daily progress' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      progress: progress
    });

  } catch (error) {
    console.error('Get daily progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update daily progress
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      calories, 
      protein, 
      carbs, 
      fat, 
      fiber, 
      sugar, 
      cholesterol 
    } = await request.json();

    if (!userId || calories === undefined) {
      return NextResponse.json(
        { error: 'User ID and calories are required' },
        { status: 400 }
      );
    }

    // First try to get existing record
    const { data: existingProgress, error: fetchError } = await supabase
      .from('daily_progress')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch existing progress' },
        { status: 500 }
      );
    }

    let result;
    if (existingProgress) {
      // Update existing record - SET the values (not add to them)
      const { data: progress, error } = await supabase
        .from('daily_progress')
        .update({
          calories: calories,
          protein: protein || 0,
          carbs: carbs || 0,
          fat: fat || 0,
          fiber: fiber || 0,
          sugar: sugar || 0,
          cholesterol: cholesterol || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      result = { data: progress, error };
    } else {
      // Insert new record
      const { data: progress, error } = await supabase
        .from('daily_progress')
        .insert({
          id: userId,
          calories: calories || 0,
          protein: protein || 0,
          carbs: carbs || 0,
          fat: fat || 0,
          fiber: fiber || 0,
          sugar: sugar || 0,
          cholesterol: cholesterol || 0
        })
        .select()
        .single();
      
      result = { data: progress, error };
    }

    if (result.error) {
      console.error('Supabase upsert error:', result.error);
      return NextResponse.json(
        { error: 'Failed to update daily progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      progress: result.data,
      message: 'Daily progress updated successfully' 
    });

  } catch (error) {
    console.error('Update daily progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
