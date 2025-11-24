-- Update RLS policies to use user_roles table instead of raw_user_meta_data JSON
-- Run this AFTER creating the user_roles table and migrating data

-- ============================================
-- UPDATE INGREDIENTS TABLE POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Allow admins to manage ingredients" ON public.ingredients;

-- Create new policy using user_roles table
CREATE POLICY "Allow admins to manage ingredients"
  ON public.ingredients
  FOR ALL
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

-- ============================================
-- UPDATE STORAGE POLICIES FOR INGREDIENT IMAGES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Allow admins to upload ingredient images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update ingredient images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete ingredient images" ON storage.objects;

-- Create new policies using user_roles table
CREATE POLICY "Allow admins to upload ingredient images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ingredient-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to update ingredient images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'ingredient-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Allow admins to delete ingredient images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'ingredient-images'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- VERIFY POLICIES
-- ============================================

-- List all policies that still reference user_metadata
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE (qual::text LIKE '%user_metadata%' OR with_check::text LIKE '%user_metadata%')
  AND schemaname = 'public';

-- List all policies using user_roles table
SELECT 
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE (qual::text LIKE '%user_roles%' OR with_check::text LIKE '%user_roles%')
  AND schemaname = 'public';
