import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import { Preferences } from '../../../types';

// Complete onboarding endpoint
export async function POST(req: NextRequest) {
  try {
    const { userId, preferences } = await req.json();

    if (!userId || !preferences) {
      return NextResponse.json(
        { error: "User ID and preferences are required" },
        { status: 400 }
      );
    }

    // Update user preferences and mark profile as completed
    await db.query(
      `UPDATE users SET 
        dietary_restrictions = ?,
        disliked_foods = ?,
        preferred_cuisines = ?,
        daily_calories_goal = ?,
        protein_goal_g = ?,
        profile_completed = 1,
        updated_at = NOW()
      WHERE id = ?`,
      [
        JSON.stringify(preferences.dietaryRestrictions),
        JSON.stringify([preferences.dislikes]), // Convert string to JSON array
        JSON.stringify(preferences.cuisine),
        preferences.caloriesGoal,
        preferences.proteinGoal,
        userId
      ]
    );

    // Get updated user data
    const [updatedUser] = await db.query(
      `SELECT id, name, email, age, gender, height_cm, weight_kg, activity_level,
              daily_calories_goal, protein_goal_g, carbs_goal_g, fat_goal_g,
              fiber_goal_g, sugar_goal_g, sodium_goal_mg, dietary_restrictions,
              allergies, disliked_foods, preferred_cuisines, meals_per_day,
              snacks_per_day, cooking_skill_level, cooking_time_preference,
              budget_preference, current_meal_plan, meal_plan_history,
              favorite_recipes, created_at, updated_at, last_login,
              profile_completed, notifications_enabled, timezone, language
       FROM users WHERE id = ?`,
      [userId]
    );

    const user = (updatedUser as any[])[0];

    return NextResponse.json({ 
      user,
      message: "Onboarding completed successfully" 
    });

  } catch (err) {
    console.error('Onboarding completion error:', err);
    return NextResponse.json(
      { 
        error: "Failed to complete onboarding",
        details: err instanceof Error ? err.message : String(err)
      },
      { status: 500 }
    );
  }
}
