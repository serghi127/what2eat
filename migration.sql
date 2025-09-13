-- Database migration script to add password field to users table
-- Run this script to update your existing users table

-- Add password column to users table
ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT '';

-- Note: You'll need to update existing users with proper passwords
-- For existing users, you might want to:
-- 1. Set a temporary password and ask them to reset it
-- 2. Or remove existing users and have them re-register

-- Example: Update existing users with a temporary password (they'll need to reset)
-- UPDATE users SET password = '$2a$12$temp.password.hash.here' WHERE password = '';

-- After running this migration, existing users will need to reset their passwords
-- or you can remove them and have users register fresh accounts
