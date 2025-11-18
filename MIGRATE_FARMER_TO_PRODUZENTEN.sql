-- Migration Script: Update "Farmer" to "Produzenten"
-- This script updates all existing user records in the database
-- Run this in Supabase SQL Editor AFTER deploying the code changes

-- Update all users with occupation "Farmer" to "Produzenten"
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{occupation}',
  '"Produzenten"'
)
WHERE raw_user_meta_data->>'occupation' = 'Farmer';

-- Verify the changes
SELECT 
  id,
  email,
  raw_user_meta_data->>'occupation' as occupation,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE raw_user_meta_data->>'occupation' = 'Produzenten';

-- Check if any "Farmer" records remain (should return 0 rows)
SELECT 
  id,
  email,
  raw_user_meta_data->>'occupation' as occupation
FROM auth.users
WHERE raw_user_meta_data->>'occupation' = 'Farmer';
