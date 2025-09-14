import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { UserProfileUpdate } from '../../../types';

// Update user profile endpoint
export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get('user-id');
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updateData: UserProfileUpdate = await req.json();

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Return updated user data
    const { data: updatedUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch updated user" }, { status: 500 });
    }

    return NextResponse.json({ 
      user: updatedUser,
      message: "Profile updated successfully" 
    });

  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json(
      { error: "Profile update failed" },
      { status: 500 }
    );
  }
}

// Get user profile endpoint
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('user-id');
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  } catch (err) {
    console.error('Get profile error:', err);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}
