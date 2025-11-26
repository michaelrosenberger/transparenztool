-- Fix RLS Policies for Meals Table
-- Run this in Supabase SQL Editor to allow admins to create/manage meals

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Admin users can insert meals" ON meals;
DROP POLICY IF EXISTS "Admin users can update meals" ON meals;
DROP POLICY IF EXISTS "Admin users can delete meals" ON meals;
DROP POLICY IF EXISTS "Meals are viewable by everyone" ON meals;

-- Policy: Anyone can view meals (for public display)
CREATE POLICY "Meals are viewable by everyone"
  ON meals FOR SELECT
  USING (true);

-- Policy: Admin users can insert meals (regardless of occupation)
CREATE POLICY "Admin users can insert meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admin users can update meals (regardless of occupation)
CREATE POLICY "Admin users can update meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admin users can delete meals (regardless of occupation)
CREATE POLICY "Admin users can delete meals"
  ON meals FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Meals are viewable by everyone" ON meals IS 
  'Public read access for displaying meals to all users';
COMMENT ON POLICY "Admin users can insert meals" ON meals IS 
  'Only admin users can create new meals, regardless of their occupation';
COMMENT ON POLICY "Admin users can update meals" ON meals IS 
  'Only admin users can update meals, regardless of their occupation';
COMMENT ON POLICY "Admin users can delete meals" ON meals IS 
  'Only admin users can delete meals, regardless of their occupation';
