#!/usr/bin/env node

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'your_database_name',
};

async function migrateUsersTable() {
  let connection;
  
  try {
    console.log('Connecting to MySQL database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected successfully!');
    
    console.log('\n🔄 Starting database migration...');
    
    // Add new columns to users table
    const newColumns = [
      // Personal Information
      { name: 'age', type: 'INT', nullable: 'NULL', comment: 'User age' },
      { name: 'gender', type: 'ENUM("male", "female", "other", "prefer_not_to_say")', nullable: 'NULL', comment: 'User gender' },
      { name: 'height_cm', type: 'DECIMAL(5,2)', nullable: 'NULL', comment: 'Height in centimeters' },
      { name: 'weight_kg', type: 'DECIMAL(5,2)', nullable: 'NULL', comment: 'Weight in kilograms' },
      { name: 'activity_level', type: 'ENUM("sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active")', nullable: 'NULL', comment: 'Activity level' },
      
      // Nutritional Goals
      { name: 'daily_calories_goal', type: 'INT', nullable: 'NULL', comment: 'Daily calorie goal' },
      { name: 'protein_goal_g', type: 'DECIMAL(6,2)', nullable: 'NULL', comment: 'Daily protein goal in grams' },
      { name: 'carbs_goal_g', type: 'DECIMAL(6,2)', nullable: 'NULL', comment: 'Daily carbs goal in grams' },
      { name: 'fat_goal_g', type: 'DECIMAL(6,2)', nullable: 'NULL', comment: 'Daily fat goal in grams' },
      { name: 'fiber_goal_g', type: 'DECIMAL(6,2)', nullable: 'NULL', comment: 'Daily fiber goal in grams' },
      { name: 'sugar_goal_g', type: 'DECIMAL(6,2)', nullable: 'NULL', comment: 'Daily sugar goal in grams' },
      { name: 'sodium_goal_mg', type: 'DECIMAL(8,2)', nullable: 'NULL', comment: 'Daily sodium goal in milligrams' },
      
      // Dietary Preferences & Restrictions
      { name: 'dietary_restrictions', type: 'JSON', nullable: 'NULL', comment: 'Dietary restrictions (vegetarian, vegan, gluten-free, etc.)' },
      { name: 'allergies', type: 'JSON', nullable: 'NULL', comment: 'Food allergies' },
      { name: 'disliked_foods', type: 'JSON', nullable: 'NULL', comment: 'Foods user dislikes' },
      { name: 'preferred_cuisines', type: 'JSON', nullable: 'NULL', comment: 'Preferred cuisine types' },
      
      // Meal Planning Preferences
      { name: 'meals_per_day', type: 'INT', nullable: 'NULL', comment: 'Number of meals per day (default: 3)' },
      { name: 'snacks_per_day', type: 'INT', nullable: 'NULL', comment: 'Number of snacks per day (default: 2)' },
      { name: 'cooking_skill_level', type: 'ENUM("beginner", "intermediate", "advanced")', nullable: 'NULL', comment: 'Cooking skill level' },
      { name: 'cooking_time_preference', type: 'ENUM("quick", "moderate", "extensive")', nullable: 'NULL', comment: 'Preferred cooking time' },
      { name: 'budget_preference', type: 'ENUM("low", "medium", "high")', nullable: 'NULL', comment: 'Budget preference for meals' },
      
      // Weekly Meal Plan Storage
      { name: 'current_meal_plan', type: 'JSON', nullable: 'NULL', comment: 'Current weekly meal plan' },
      { name: 'meal_plan_history', type: 'JSON', nullable: 'NULL', comment: 'Historical meal plans' },
      { name: 'favorite_recipes', type: 'JSON', nullable: 'NULL', comment: 'User favorite recipes' },
      
      // Timestamps
      { name: 'created_at', type: 'TIMESTAMP', nullable: 'DEFAULT CURRENT_TIMESTAMP', comment: 'Account creation time' },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: 'DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP', comment: 'Last update time' },
      { name: 'last_login', type: 'TIMESTAMP', nullable: 'NULL', comment: 'Last login time' },
      
      // Profile Settings
      { name: 'profile_completed', type: 'BOOLEAN', nullable: 'DEFAULT FALSE', comment: 'Whether user has completed profile setup' },
      { name: 'notifications_enabled', type: 'BOOLEAN', nullable: 'DEFAULT TRUE', comment: 'Whether notifications are enabled' },
      { name: 'timezone', type: 'VARCHAR(50)', nullable: 'DEFAULT "UTC"', comment: 'User timezone' },
      { name: 'language', type: 'VARCHAR(10)', nullable: 'DEFAULT "en"', comment: 'Preferred language' }
    ];
    
    // Check which columns already exist
    console.log('Checking existing columns...');
    const [existingColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' AND TABLE_SCHEMA = DATABASE()
    `);
    
    const existingColumnNames = (existingColumns as any[]).map(col => col.COLUMN_NAME);
    console.log(`Found ${existingColumnNames.length} existing columns: ${existingColumnNames.join(', ')}`);
    
    // Add new columns
    let addedCount = 0;
    for (const column of newColumns) {
      if (!existingColumnNames.includes(column.name)) {
        try {
          const sql = `ALTER TABLE users ADD COLUMN ${column.name} ${column.type} ${column.nullable} COMMENT '${column.comment}'`;
          await connection.execute(sql);
          console.log(`✅ Added column: ${column.name}`);
          addedCount++;
        } catch (error: any) {
          console.log(`⚠️  Could not add column ${column.name}: ${error.message}`);
        }
      } else {
        console.log(`⏭️  Column ${column.name} already exists, skipping...`);
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`  - Total columns to add: ${newColumns.length}`);
    console.log(`  - Successfully added: ${addedCount}`);
    console.log(`  - Already existed: ${newColumns.length - addedCount}`);
    
    // Display updated table structure
    console.log('\n📋 Updated users table structure:');
    const [columns] = await connection.execute('DESCRIBE users');
    console.table(columns);
    
    // Show sample of current users (without sensitive data)
    console.log('\n👥 Current users (showing new columns):');
    const [users] = await connection.execute(`
      SELECT 
        id, 
        name, 
        email, 
        age, 
        gender, 
        daily_calories_goal,
        profile_completed,
        created_at
      FROM users 
      LIMIT 5
    `);
    
    if ((users as any[]).length === 0) {
      console.log('No users found in database.');
    } else {
      console.table(users);
    }
    
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

migrateUsersTable().catch(console.error);
