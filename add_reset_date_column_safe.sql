-- Add last_reset_date column to daily_progress table if it doesn't exist
-- This script is safe to run multiple times

DO $$ 
BEGIN
    -- Check if the column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'daily_progress' 
        AND column_name = 'last_reset_date'
    ) THEN
        ALTER TABLE daily_progress 
        ADD COLUMN last_reset_date DATE DEFAULT CURRENT_DATE;
        
        -- Update existing records to have today's date as the reset date
        UPDATE daily_progress 
        SET last_reset_date = CURRENT_DATE 
        WHERE last_reset_date IS NULL;
        
        RAISE NOTICE 'Added last_reset_date column to daily_progress table';
    ELSE
        RAISE NOTICE 'last_reset_date column already exists in daily_progress table';
    END IF;
END $$;
