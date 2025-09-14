import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

// Get user stats
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

    const { data: stats, error } = await supabase
      .from('stats')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update user stats
export async function POST(request: NextRequest) {
  try {
    const { userId, points, cartItems, cartContents } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { data: stats, error } = await supabase
      .from('stats')
      .upsert({
        id: userId,
        points: points || 0,
        cart_items: cartItems || 0,
        cart_contents: cartContents || null
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      return NextResponse.json(
        { error: 'Failed to update stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      stats,
      message: 'Stats updated successfully' 
    });

  } catch (error) {
    console.error('Update stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
