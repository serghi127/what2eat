#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

interface UserData {
  name: string;
  email: string;
  password: string;
}

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample users to add (matching the actual database schema)
const usersToAdd: UserData[] = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123'
  },
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123'
  }
];

async function addUsersToSupabase(): Promise<void> {
  try {
    console.log('🔗 Connecting to Supabase...');
    
    // Test connection by checking if we can access the users table
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Failed to connect to Supabase:', testError.message);
      console.error('\nMake sure:');
      console.error('1. Your Supabase project is running');
      console.error('2. The users table exists in your database');
      console.error('3. Your environment variables are correct');
      return;
    }
    
    console.log('✅ Connected to Supabase successfully!');
    
    console.log('\n👥 Adding users to database...');
    
    for (const userData of usersToAdd) {
      try {
        const { name, email, password } = userData;
        
        // Check if user already exists
        const { data: existingUsers, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .limit(1);
        
        if (checkError) {
          console.error(`❌ Error checking user ${email}:`, checkError.message);
          continue;
        }
        
        if (existingUsers && existingUsers.length > 0) {
          console.log(`⚠️  User with email ${email} already exists, skipping...`);
          continue;
        }
        
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Insert new user (matching the actual database schema)
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
          console.error(`❌ Error adding user ${name}:`, insertError.message);
          continue;
        }
        
        console.log(`✅ Added user: ${newUser.name} (ID: ${newUser.id})`);
        
        // Create meal_table entry for this user
        const { data: mealEntry, error: mealError } = await supabase
          .from('meal_table')
          .insert([
            {
              id: newUser.id, // Use the user's UUID as the meal_table ID
              favorite_recipes: [], // Empty array initially
              weekly_plan: {}, // Empty object initially
              meal_history: null // Null initially
              // created_at and updated_at are automatically managed by Supabase
            }
          ])
          .select('id, created_at, updated_at')
          .single();
        
        if (mealError) {
          console.error(`❌ Error creating meal_table entry for ${newUser.name}:`, mealError.message);
        } else {
          console.log(`✅ Created meal_table entry for ${newUser.name} (ID: ${mealEntry.id})`);
        }
        
      } catch (error: any) {
        console.error(`❌ Error adding user ${userData.name}:`, error.message);
      }
    }
    
    // Display all users in the database
    console.log('\n📋 Current users in database:');
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email')
      .order('id', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError.message);
      return;
    }
    
    if (!allUsers || allUsers.length === 0) {
      console.log('No users found in database.');
    } else {
      allUsers.forEach((user: any) => {
        console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
    // Display meal_table entries
    console.log('\n🍽️  Current meal_table entries:');
    const { data: allMeals, error: mealFetchError } = await supabase
      .from('meal_table')
      .select('id, favorite_recipes, weekly_plan, meal_history')
      .order('id', { ascending: false });
    
    if (mealFetchError) {
      console.error('❌ Error fetching meal_table entries:', mealFetchError.message);
    } else if (!allMeals || allMeals.length === 0) {
      console.log('No meal_table entries found.');
    } else {
      allMeals.forEach((meal: any) => {
        const favoriteCount = meal.favorite_recipes ? meal.favorite_recipes.length : 0;
        const weeklyPlanDays = meal.weekly_plan ? Object.keys(meal.weekly_plan).length : 0;
        console.log(`  - User ID: ${meal.id}, Favorites: ${favoriteCount}, Weekly Plan Days: ${weeklyPlanDays}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Database error:', error.message);
    console.error('\nMake sure your Supabase project is running and environment variables are set correctly.');
    console.error('Required environment variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Run the script
addUsersToSupabase().catch(console.error);
