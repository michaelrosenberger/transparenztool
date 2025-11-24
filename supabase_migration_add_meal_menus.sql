-- Migration: Add meal_menus table
-- Date: 2025-11-24
-- Description: Creates table for managing daily meal menus with multiple meals

-- Create meal_menus table
CREATE TABLE IF NOT EXISTS meal_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_date DATE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  meal_ids TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster date queries
CREATE INDEX IF NOT EXISTS idx_meal_menus_menu_date ON meal_menus(menu_date);

-- Add index for created_by
CREATE INDEX IF NOT EXISTS idx_meal_menus_created_by ON meal_menus(created_by);

-- Add RLS policies
ALTER TABLE meal_menus ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read menus" ON meal_menus;
DROP POLICY IF EXISTS "Allow admin users to insert menus" ON meal_menus;
DROP POLICY IF EXISTS "Allow admin users to update menus" ON meal_menus;
DROP POLICY IF EXISTS "Allow admin users to delete menus" ON meal_menus;

-- Allow authenticated users to read all menus
CREATE POLICY "Allow authenticated users to read menus"
  ON meal_menus
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow admin users to insert menus
CREATE POLICY "Allow admin users to insert menus"
  ON meal_menus
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow admin users to update menus
CREATE POLICY "Allow admin users to update menus"
  ON meal_menus
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow admin users to delete menus
CREATE POLICY "Allow admin users to delete menus"
  ON meal_menus
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add comment to document the table
COMMENT ON TABLE meal_menus IS 'Daily meal menus containing multiple meals';
COMMENT ON COLUMN meal_menus.menu_date IS 'Date for which this menu is valid';
COMMENT ON COLUMN meal_menus.title IS 'Menu title (e.g., "Wochenmenü")';
COMMENT ON COLUMN meal_menus.subtitle IS 'Optional subtitle (e.g., "Frische Herbstgerichte")';
COMMENT ON COLUMN meal_menus.meal_ids IS 'Array of meal IDs included in this menu';
