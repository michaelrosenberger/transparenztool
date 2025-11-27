-- Migration: Add is_today field to meals table
-- Date: 2025-11-27
-- Description: Adds a boolean field to mark one meal as "today's meal"

-- Add is_today column
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS is_today BOOLEAN DEFAULT false;

-- Add unique partial index to ensure only one meal can be marked as today
CREATE UNIQUE INDEX IF NOT EXISTS idx_meals_is_today 
ON meals(is_today) 
WHERE is_today = true;

-- Add comment
COMMENT ON COLUMN meals.is_today IS 'Marks this meal as the current "today" meal (only one can be true at a time)';
