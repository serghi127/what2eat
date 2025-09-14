import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

// Get user goals
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

    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      return NextResponse.json(
        { error: 'Failed to fetch goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({ goals });

  } catch (error) {
    console.error('Get goals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user goals
export async function PUT(request: NextRequest) {
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

    const { data: goals, error } = await supabase
      .from('goals')
      .upsert({
        id: userId,
        calories,
        protein: protein || null,
        carbs: carbs || null,
        fat: fat || null,
        fiber: fiber || null,
        sugar: sugar || null,
        cholesterol: cholesterol || null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to update goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      goals,
      message: 'Goals updated successfully' 
    });

  } catch (error) {
    console.error('Update goals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user goals (POST method for backward compatibility)
export async function POST(request: NextRequest) {
  return PUT(request);
}
