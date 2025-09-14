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

async function createMissingMealEntries() {
  try {
    console.log('🔍 Finding users without meal_table entries...');
    
    // Get all users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, email');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }
    
    // Get all existing meal_table entries
    const { data: existingMeals, error: mealsError } = await supabase
      .from('meal_table')
      .select('id');
    
    if (mealsError) {
      console.error('❌ Error fetching meal_table entries:', mealsError.message);
      return;
    }
    
    const existingMealUserIds = new Set(existingMeals?.map(meal => meal.id) || []);
    
    // Find users without meal_table entries
    const usersWithoutMeals = allUsers?.filter(user => !existingMealUserIds.has(user.id)) || [];
    
    console.log(`📊 Found ${allUsers?.length || 0} total users`);
    console.log(`📊 Found ${existingMeals?.length || 0} existing meal_table entries`);
    console.log(`📊 Found ${usersWithoutMeals.length} users without meal_table entries`);
    
    if (usersWithoutMeals.length === 0) {
      console.log('✅ All users already have meal_table entries!');
      return;
    }
    
    console.log('\n👥 Users without meal_table entries:');
    usersWithoutMeals.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    
    console.log('\n🔧 Creating meal_table entries...');
    
    // Create meal_table entries for users without them
    const entriesToCreate = usersWithoutMeals.map(user => ({
      id: user.id,
      favorite_recipes: [],
      weekly_plan: {},
      meal_history: null
    }));
    
    const { data: newEntries, error: insertError } = await supabase
      .from('meal_table')
      .insert(entriesToCreate)
      .select('id');
    
    if (insertError) {
      console.error('❌ Error creating meal_table entries:', insertError.message);
      return;
    }
    
    console.log(`✅ Successfully created ${newEntries?.length || 0} meal_table entries!`);
    
    // Show final status
    console.log('\n📋 Final status:');
    const { data: finalMeals, error: finalError } = await supabase
      .from('meal_table')
      .select('id');
    
    if (!finalError) {
      console.log(`📊 Total meal_table entries: ${finalMeals?.length || 0}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

createMissingMealEntries().catch(console.error);
