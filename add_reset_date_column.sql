-- Add last_reset_date column to daily_progress table
ALTER TABLE daily_progress 
ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Update existing records to have today's date as the reset date
UPDATE daily_progress 
SET last_reset_date = CURRENT_DATE 
WHERE last_reset_date IS NULL;
