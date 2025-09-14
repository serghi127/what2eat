import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import bcrypt from 'bcryptjs';
import { UserRegistrationData } from '../../../types';

// Registration endpoint using Supabase
export async function POST(req: NextRequest) {
  try {
    const userData: UserRegistrationData = await req.json();
    const { name, email, password, age, gender, height_cm, weight_kg, activity_level } = userData;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing user:', checkError.message);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword
        }
      ])
      .select('id, name, email')
      .single();

    if (insertError) {
      console.error('Error creating user:', insertError.message);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Automatically create meal_table entry for the new user
    const { data: mealEntry, error: mealError } = await supabase
      .from('meal_table')
      .insert([
        {
          id: newUser.id, // Use the user's UUID as the meal_table ID
          favorite_recipes: [], // Empty array initially
          weekly_plan: {}, // Empty object initially
          meal_history: null // Null initially
        }
      ])
      .select('id')
      .single();

    if (mealError) {
      console.error('Error creating meal_table entry:', mealError.message);
      // Don't fail the registration if meal_table creation fails
      // The user can still be created successfully
    } else {
      console.log(`✅ Created meal_table entry for new user: ${newUser.name}`);
    }

    // Return user data without password
    return NextResponse.json({ 
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      },
      message: "Registration successful" 
    });

  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
