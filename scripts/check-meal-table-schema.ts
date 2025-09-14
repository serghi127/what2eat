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

async function checkMealTableSchema() {
  try {
    console.log('🔍 Checking meal_table schema...');
    
    // Try to get one row to see what columns exist
    const { data, error } = await supabase
      .from('meal_table')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing meal_table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ meal_table exists and has data');
      console.log('📋 Available columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => console.log(`  - ${col}`));
      
      console.log('\n📄 Sample meal_table data:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('✅ meal_table exists but is empty');
      
      // Try to insert a minimal row to see what columns are required
      console.log('\n🧪 Testing minimal meal_table insertion...');
      const { data: insertData, error: insertError } = await supabase
        .from('meal_table')
        .insert([{ user_id: 'test-uuid' }])
        .select('*')
        .single();
      
      if (insertError) {
        console.error('❌ Insert test failed:', insertError.message);
      } else {
        console.log('✅ Insert test successful');
        console.log('📋 Available columns:');
        const columns = Object.keys(insertData);
        columns.forEach(col => console.log(`  - ${col}`));
        
        // Clean up test row
        await supabase.from('meal_table').delete().eq('user_id', 'test-uuid');
        console.log('🧹 Cleaned up test row');
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkMealTableSchema().catch(console.error);
