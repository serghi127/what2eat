#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? 'Present' : 'Missing'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔗 Testing connection to users table...');
    
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email')
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error accessing users table:', usersError.message);
      return;
    }
    
    console.log('✅ Users table accessible');
    console.log(`📊 Found ${users?.length || 0} users:`);
    users?.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    
    console.log('\n🔗 Testing connection to meal_table...');
    
    // Test meal_table
    const { data: meals, error: mealsError } = await supabase
      .from('meal_table')
      .select('id, weekly_plan, updated_at')
      .limit(5);
    
    if (mealsError) {
      console.error('❌ Error accessing meal_table:', mealsError.message);
      return;
    }
    
    console.log('✅ meal_table accessible');
    console.log(`📊 Found ${meals?.length || 0} meal plans:`);
    meals?.forEach(meal => {
      const hasPlan = meal.weekly_plan && Object.keys(meal.weekly_plan).length > 0;
      console.log(`   - User ID: ${meal.id} - Has Plan: ${hasPlan ? 'Yes' : 'No'} - Updated: ${meal.updated_at}`);
    });
    
    console.log('\n🌐 Your Supabase dashboard URL:');
    console.log(`https://supabase.com/dashboard/project/${supabaseUrl.split('//')[1].split('.')[0]}`);
    
  } catch (error: any) {
    console.error('❌ Connection error:', error.message);
  }
}

testConnection().catch(console.error);
