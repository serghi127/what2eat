import { NextRequest, NextResponse } from "next/server";
import db from "../../../../lib/db";
import { UserProfileUpdate } from '../../types';

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

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    // Personal Information
    if (updateData.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updateData.name);
    }
    if (updateData.age !== undefined) {
      updateFields.push('age = ?');
      updateValues.push(updateData.age);
    }
    if (updateData.gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(updateData.gender);
    }
    if (updateData.height_cm !== undefined) {
      updateFields.push('height_cm = ?');
      updateValues.push(updateData.height_cm);
    }
    if (updateData.weight_kg !== undefined) {
      updateFields.push('weight_kg = ?');
      updateValues.push(updateData.weight_kg);
    }
    if (updateData.activity_level !== undefined) {
      updateFields.push('activity_level = ?');
      updateValues.push(updateData.activity_level);
    }

    // Nutritional Goals
    if (updateData.daily_calories_goal !== undefined) {
      updateFields.push('daily_calories_goal = ?');
      updateValues.push(updateData.daily_calories_goal);
    }
    if (updateData.protein_goal_g !== undefined) {
      updateFields.push('protein_goal_g = ?');
      updateValues.push(updateData.protein_goal_g);
    }
    if (updateData.carbs_goal_g !== undefined) {
      updateFields.push('carbs_goal_g = ?');
      updateValues.push(updateData.carbs_goal_g);
    }
    if (updateData.fat_goal_g !== undefined) {
      updateFields.push('fat_goal_g = ?');
      updateValues.push(updateData.fat_goal_g);
    }
    if (updateData.fiber_goal_g !== undefined) {
      updateFields.push('fiber_goal_g = ?');
      updateValues.push(updateData.fiber_goal_g);
    }
    if (updateData.sugar_goal_g !== undefined) {
      updateFields.push('sugar_goal_g = ?');
      updateValues.push(updateData.sugar_goal_g);
    }
    if (updateData.sodium_goal_mg !== undefined) {
      updateFields.push('sodium_goal_mg = ?');
      updateValues.push(updateData.sodium_goal_mg);
    }

    // Dietary Preferences & Restrictions
    if (updateData.dietary_restrictions !== undefined) {
      updateFields.push('dietary_restrictions = ?');
      updateValues.push(JSON.stringify(updateData.dietary_restrictions));
    }
    if (updateData.allergies !== undefined) {
      updateFields.push('allergies = ?');
      updateValues.push(JSON.stringify(updateData.allergies));
    }
    if (updateData.disliked_foods !== undefined) {
      updateFields.push('disliked_foods = ?');
      updateValues.push(JSON.stringify(updateData.disliked_foods));
    }
    if (updateData.preferred_cuisines !== undefined) {
      updateFields.push('preferred_cuisines = ?');
      updateValues.push(JSON.stringify(updateData.preferred_cuisines));
    }

    // Meal Planning Preferences
    if (updateData.meals_per_day !== undefined) {
      updateFields.push('meals_per_day = ?');
      updateValues.push(updateData.meals_per_day);
    }
    if (updateData.snacks_per_day !== undefined) {
      updateFields.push('snacks_per_day = ?');
      updateValues.push(updateData.snacks_per_day);
    }
    if (updateData.cooking_skill_level !== undefined) {
      updateFields.push('cooking_skill_level = ?');
      updateValues.push(updateData.cooking_skill_level);
    }
    if (updateData.cooking_time_preference !== undefined) {
      updateFields.push('cooking_time_preference = ?');
      updateValues.push(updateData.cooking_time_preference);
    }
    if (updateData.budget_preference !== undefined) {
      updateFields.push('budget_preference = ?');
      updateValues.push(updateData.budget_preference);
    }

    // Profile Settings
    if (updateData.notifications_enabled !== undefined) {
      updateFields.push('notifications_enabled = ?');
      updateValues.push(updateData.notifications_enabled);
    }
    if (updateData.timezone !== undefined) {
      updateFields.push('timezone = ?');
      updateValues.push(updateData.timezone);
    }
    if (updateData.language !== undefined) {
      updateFields.push('language = ?');
      updateValues.push(updateData.language);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    // Execute update
    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(userId);

    await db.query(updateQuery, updateValues);

    // Return updated user data
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

    const [user] = await db.query(
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

    if ((user as any[]).length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      user: (user as any[])[0]
    });

  } catch (err) {
    console.error('Get profile error:', err);
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500 }
    );
  }
}
