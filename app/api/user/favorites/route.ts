import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      // Fallback for demo mode
      console.log('Supabase not configured, returning empty favorites');
      return NextResponse.json({ favoriteRecipes: [] });
    }

    const { supabase } = await import("../../../../lib/supabase");
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Extract user email from auth header
    const userEmail = authHeader.replace('Bearer ', '');
    console.log('Fetching favorites for user:', userEmail);
    
    // First, get the user ID from the users table
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
    
    const { data, error } = await supabase
      .from('meal_table')
      .select('favorite_recipes')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // If no record exists, return empty array
      if (error.code === 'PGRST116') {
        console.log('No favorites record found, returning empty array');
        return NextResponse.json({ favoriteRecipes: [] });
      }
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    console.log('Favorites data:', data);
    return NextResponse.json({ 
      favoriteRecipes: data?.favorite_recipes || [] 
    });

  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      // Fallback for demo mode
      console.log('Supabase not configured, returning demo mode response');
      return NextResponse.json({ message: 'Favorites saved (demo mode)' });
    }

    const { supabase } = await import("../../../../lib/supabase");
    const { favoriteRecipes } = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const userEmail = authHeader.replace('Bearer ', '');
    console.log('Saving favorites for user:', userEmail, 'favorites:', favoriteRecipes);
    
    // First, get the user ID from the users table
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
    
    const { error } = await supabase
      .from('meal_table')
      .upsert({
        id: userId,
        favorite_recipes: favoriteRecipes,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save favorites' }, { status: 500 });
    }

    console.log('Favorites saved successfully');
    return NextResponse.json({ message: 'Favorites saved successfully' });

  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
