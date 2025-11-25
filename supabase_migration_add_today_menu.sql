-- Migration: Add is_today field to meal_menus table
-- Date: 2025-11-25
-- Description: Adds a boolean field to mark one menu as "today's menu"

-- Add is_today column
ALTER TABLE meal_menus 
ADD COLUMN IF NOT EXISTS is_today BOOLEAN DEFAULT false;

-- Add unique partial index to ensure only one menu can be marked as today
CREATE UNIQUE INDEX IF NOT EXISTS idx_meal_menus_is_today 
ON meal_menus(is_today) 
WHERE is_today = true;

-- Add comment
COMMENT ON COLUMN meal_menus.is_today IS 'Marks this menu as the current "today" menu (only one can be true at a time)';
