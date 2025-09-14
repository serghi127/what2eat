-- Create users table for storing user information
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Update meal_table to reference users table
ALTER TABLE meal_table 
ADD COLUMN IF NOT EXISTS id UUID REFERENCES users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS favorite_recipes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_table_id ON meal_table(id);

-- Create goals table for user nutritional goals
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calories INTEGER DEFAULT 2000,
  protein INTEGER DEFAULT 150,
  carbs INTEGER DEFAULT 250,
  fat INTEGER DEFAULT 65,
  fiber INTEGER DEFAULT 25,
  sugar INTEGER DEFAULT 50,
  cholesterol INTEGER DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_goals_id ON goals(id);

-- Create stats table for user statistics
CREATE TABLE IF NOT EXISTS stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  points INTEGER DEFAULT 0,
  cart_items INTEGER DEFAULT 0,
  cart_contents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stats_id ON stats(id);

-- Create daily_progress table for tracking daily nutritional progress
CREATE TABLE IF NOT EXISTS daily_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  calories INTEGER DEFAULT 0,
  protein INTEGER DEFAULT 0,
  carbs INTEGER DEFAULT 0,
  fat INTEGER DEFAULT 0,
  fiber INTEGER DEFAULT 0,
  sugar INTEGER DEFAULT 0,
  cholesterol INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_progress_id ON daily_progress(id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON daily_progress(date);

-- Create meal_history table for tracking completed meals
CREATE TABLE IF NOT EXISTS meal_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  recipe_id BIGINT NOT NULL,
  recipe_name TEXT NOT NULL,
  completed BOOLEAN DEFAULT true,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_history_date ON meal_history(date);
CREATE INDEX IF NOT EXISTS idx_meal_history_recipe_id ON meal_history(recipe_id);

-- Disable RLS for development
ALTER TABLE meal_history DISABLE ROW LEVEL SECURITY;
