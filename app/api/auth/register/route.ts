import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import bcrypt from 'bcryptjs';
import { UserRegistrationData } from '../../../types';

// Registration endpoint
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
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    const users = existingUsers as any[];
    
    if (users.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user with extended fields
    const [result] = await db.query(
      `INSERT INTO users (
        name, email, password, age, gender, height_cm, weight_kg, activity_level,
        meals_per_day, snacks_per_day, cooking_skill_level, cooking_time_preference,
        budget_preference, notifications_enabled, timezone, language, profile_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, email, hashedPassword, age || null, gender || null, 
        height_cm || null, weight_kg || null, activity_level || null,
        3, // Default meals per day
        2, // Default snacks per day
        'beginner', // Default cooking skill
        'moderate', // Default cooking time preference
        'medium', // Default budget preference
        true, // Default notifications enabled
        'UTC', // Default timezone
        'en', // Default language
        false // Profile not completed yet - needs onboarding
      ]
    );

    const insertedId = (result as any).insertId;

    // Return user data without password
    const [newUser] = await db.query(
      `SELECT id, name, email, age, gender, height_cm, weight_kg, activity_level,
              daily_calories_goal, protein_goal_g, carbs_goal_g, fat_goal_g,
              fiber_goal_g, sugar_goal_g, sodium_goal_mg, dietary_restrictions,
              allergies, disliked_foods, preferred_cuisines, meals_per_day,
              snacks_per_day, cooking_skill_level, cooking_time_preference,
              budget_preference, current_meal_plan, meal_plan_history,
              favorite_recipes, created_at, updated_at, last_login,
              profile_completed, notifications_enabled, timezone, language
       FROM users WHERE id = ?`,
      [insertedId]
    );

    const user = (newUser as any[])[0];

    return NextResponse.json({ 
      user,
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
