import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import bcrypt from 'bcryptjs';

// Login endpoint
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user by email
    const [rows] = await db.query(
      `SELECT id, name, email, password, age, gender, height_cm, weight_kg, activity_level,
              daily_calories_goal, protein_goal_g, carbs_goal_g, fat_goal_g,
              fiber_goal_g, sugar_goal_g, sodium_goal_mg, dietary_restrictions,
              allergies, disliked_foods, preferred_cuisines, meals_per_day,
              snacks_per_day, cooking_skill_level, cooking_time_preference,
              budget_preference, current_meal_plan, meal_plan_history,
              favorite_recipes, created_at, updated_at, last_login,
              profile_completed, notifications_enabled, timezone, language
       FROM users WHERE email = ?`,
      [email]
    );

    const users = rows as any[];
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      user: userWithoutPassword,
      message: "Login successful" 
    });

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
