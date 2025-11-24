-- Migration: Add storage_name column to meals table
-- Date: 2025-11-24
-- Description: Separates storage name from storage address for better data organization

-- Add storage_name column to meals table
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS storage_name TEXT;

-- Add comment to document the column
COMMENT ON COLUMN meals.storage_name IS 'Name of the storage location (e.g., "Hauptlager Wien")';

-- Optional: Update existing meals to extract storage name from address if needed
-- This is commented out by default - uncomment and modify if you want to migrate existing data
-- UPDATE meals 
-- SET storage_name = 'Hauptlager'
-- WHERE storage_name IS NULL;
