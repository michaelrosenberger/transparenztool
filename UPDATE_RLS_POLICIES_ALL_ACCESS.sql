-- =====================================================
-- UPDATE RLS POLICIES - GRANT ALL ACCESS TO AUTHENTICATED USERS
-- =====================================================
-- This script updates Row Level Security policies to allow
-- ALL authenticated users to perform ALL operations.
-- No admin role checks - just authentication required.
-- =====================================================
-- 
-- IMPORTANT: Run each section individually and skip sections
-- for tables that don't exist in your database.
-- =====================================================

-- =====================================================
-- 1. USER_ROLES TABLE
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

-- Create new policies - all authenticated users have full access
CREATE POLICY "Authenticated users can view user roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 2. MEALS TABLE
-- =====================================================
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view meals" ON public.meals;
DROP POLICY IF EXISTS "Only admins can insert meals" ON public.meals;
DROP POLICY IF EXISTS "Only admins can update meals" ON public.meals;
DROP POLICY IF EXISTS "Only admins can delete meals" ON public.meals;

-- Create new policies - all authenticated users have full access
CREATE POLICY "Authenticated users can view meals"
  ON public.meals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert meals"
  ON public.meals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meals"
  ON public.meals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete meals"
  ON public.meals FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 3. MENUS TABLE
-- =====================================================
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view menus" ON public.menus;
DROP POLICY IF EXISTS "Only admins can insert menus" ON public.menus;
DROP POLICY IF EXISTS "Only admins can update menus" ON public.menus;
DROP POLICY IF EXISTS "Only admins can delete menus" ON public.menus;

-- Create new policies - all authenticated users have full access
CREATE POLICY "Authenticated users can view menus"
  ON public.menus FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert menus"
  ON public.menus FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update menus"
  ON public.menus FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete menus"
  ON public.menus FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 4. INGREDIENTS TABLE
-- =====================================================
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Only admins can insert ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Only admins can update ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Only admins can delete ingredients" ON public.ingredients;

-- Create new policies - all authenticated users have full access
CREATE POLICY "Authenticated users can view ingredients"
  ON public.ingredients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert ingredients"
  ON public.ingredients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update ingredients"
  ON public.ingredients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ingredients"
  ON public.ingredients FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 5. MEAL_VEGETABLES TABLE (if exists)
-- =====================================================
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view meal vegetables" ON public.meal_vegetables;
DROP POLICY IF EXISTS "Only admins can insert meal vegetables" ON public.meal_vegetables;
DROP POLICY IF EXISTS "Only admins can update meal vegetables" ON public.meal_vegetables;
DROP POLICY IF EXISTS "Only admins can delete meal vegetables" ON public.meal_vegetables;

-- Create new policies - all authenticated users have full access
CREATE POLICY "Authenticated users can view meal vegetables"
  ON public.meal_vegetables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert meal vegetables"
  ON public.meal_vegetables FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meal vegetables"
  ON public.meal_vegetables FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete meal vegetables"
  ON public.meal_vegetables FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 6. MENU_MEALS TABLE (if exists)
-- =====================================================
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view menu meals" ON public.menu_meals;
DROP POLICY IF EXISTS "Only admins can insert menu meals" ON public.menu_meals;
DROP POLICY IF EXISTS "Only admins can update menu meals" ON public.menu_meals;
DROP POLICY IF EXISTS "Only admins can delete menu meals" ON public.menu_meals;

-- Create new policies - all authenticated users have full access
CREATE POLICY "Authenticated users can view menu meals"
  ON public.menu_meals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert menu meals"
  ON public.menu_meals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu meals"
  ON public.menu_meals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete menu meals"
  ON public.menu_meals FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- 7. STORAGE_SETTINGS TABLE (if exists)
-- =====================================================
-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view storage settings" ON public.storage_settings;
DROP POLICY IF EXISTS "Only admins can update storage settings" ON public.storage_settings;

-- Create new policies - all authenticated users have full access
CREATE POLICY "Authenticated users can view storage settings"
  ON public.storage_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update storage settings"
  ON public.storage_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run these queries to verify the policies were created:
-- 
-- SELECT tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
