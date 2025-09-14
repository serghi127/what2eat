#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllMealPlans() {
  try {
    console.log('🔍 Fetching all meal_table entries...');
    
    // Get all meal_table entries
    const { data, error } = await supabase
      .from('meal_table')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching meal plans:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('❌ No meal plans found');
      return;
    }
    
    console.log(`✅ Found ${data.length} meal plan(s):\n`);
    
    data.forEach((mealPlan, index) => {
      console.log(`📋 Meal Plan ${index + 1}:`);
      console.log(`   User ID: ${mealPlan.id}`);
      console.log(`   Created: ${mealPlan.created_at}`);
      console.log(`   Updated: ${mealPlan.updated_at}`);
      
      if (mealPlan.favorite_recipes && mealPlan.favorite_recipes.length > 0) {
        console.log(`   Favorite Recipes: ${mealPlan.favorite_recipes.length} recipes`);
      } else {
        console.log(`   Favorite Recipes: None`);
      }
      
      if (mealPlan.weekly_plan && Object.keys(mealPlan.weekly_plan).length > 0) {
        const totalMeals = Object.values(mealPlan.weekly_plan).reduce((total: number, day: any) => {
          return total + Object.keys(day).length;
        }, 0);
        console.log(`   Weekly Plan: ${Object.keys(mealPlan.weekly_plan).length} days, ${totalMeals} total meals`);
        
        // Show a sample of the weekly plan
        const days = Object.keys(mealPlan.weekly_plan);
        if (days.length > 0) {
          const firstDay = days[0];
          const firstDayMeals = mealPlan.weekly_plan[firstDay];
          console.log(`   Sample (${firstDay}): ${Object.keys(firstDayMeals).join(', ')}`);
        }
      } else {
        console.log(`   Weekly Plan: Empty`);
      }
      
      console.log(''); // Empty line for readability
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

listAllMealPlans().catch(console.error);
