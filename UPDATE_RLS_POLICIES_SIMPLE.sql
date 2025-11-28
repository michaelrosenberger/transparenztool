-- =====================================================
-- SIMPLE RLS UPDATE - USER_ROLES TABLE ONLY
-- =====================================================
-- This updates the user_roles table to allow all
-- authenticated users full access.
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

-- Verify the policies were created
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_roles'
ORDER BY policyname;
