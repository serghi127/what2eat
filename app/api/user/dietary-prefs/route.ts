import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('dietary_prefs')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching dietary preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch dietary preferences' }, { status: 500 });
    }

    return NextResponse.json({ dietaryPrefs: data });
  } catch (error) {
    console.error('Error in dietary preferences GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, restrictions, allergies, tools } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if dietary preferences already exist for this user
    const { data: existingData } = await supabase
      .from('dietary_prefs')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingData) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('dietary_prefs')
        .update({
          restrictions: restrictions || [],
          allergies: allergies || [],
          tools: tools || [],
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating dietary preferences:', error);
        return NextResponse.json({ error: 'Failed to update dietary preferences' }, { status: 500 });
      }

      return NextResponse.json({ dietaryPrefs: data });
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('dietary_prefs')
        .insert({
          id: userId,
          restrictions: restrictions || [],
          allergies: allergies || [],
          tools: tools || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating dietary preferences:', error);
        return NextResponse.json({ error: 'Failed to create dietary preferences' }, { status: 500 });
      }

      return NextResponse.json({ dietaryPrefs: data });
    }
  } catch (error) {
    console.error('Error in dietary preferences POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, restrictions, allergies, tools } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('dietary_prefs')
      .upsert({
        id: userId,
        restrictions: restrictions || [],
        allergies: allergies || [],
        tools: tools || [],
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting dietary preferences:', error);
      return NextResponse.json({ error: 'Failed to save dietary preferences' }, { status: 500 });
    }

    return NextResponse.json({ dietaryPrefs: data });
  } catch (error) {
    console.error('Error in dietary preferences PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
