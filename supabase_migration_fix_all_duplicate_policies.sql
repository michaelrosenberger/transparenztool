-- Fix all duplicate RLS policies across tables
-- This removes conflicting "Authenticated users" policies
-- and keeps only role-specific policies (admin, logistics, etc.)

-- ============================================
-- TABLE: storage
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view storage" ON storage;
DROP POLICY IF EXISTS "Authenticated users can insert storage" ON storage;
DROP POLICY IF EXISTS "Authenticated users can update storage" ON storage;
DROP POLICY IF EXISTS "Authenticated users can delete storage" ON storage;

-- Recreate Logistics policies
DROP POLICY IF EXISTS "Logistics can view all storage" ON storage;
DROP POLICY IF EXISTS "Logistics can insert storage" ON storage;

CREATE POLICY "Logistics can view all storage"
  ON storage FOR SELECT
  USING (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

CREATE POLICY "Logistics can insert storage"
  ON storage FOR INSERT
  WITH CHECK (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

-- ============================================
-- TABLE: orders
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can insert orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;

-- Recreate Logistics policies
DROP POLICY IF EXISTS "Logistics can view all orders" ON orders;
DROP POLICY IF EXISTS "Logistics can accept orders" ON orders;

CREATE POLICY "Logistics can view all orders"
  ON orders FOR SELECT
  USING (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

CREATE POLICY "Logistics can accept orders"
  ON orders FOR UPDATE
  USING (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  )
  WITH CHECK (
    status = 'Accepted' OR status = 'Delivered'
  );

-- ============================================
-- TABLE: ingredients
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can insert ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can update ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can delete ingredients" ON ingredients;

-- Recreate admin policies for ingredients
DROP POLICY IF EXISTS "Public can view ingredients" ON ingredients;
DROP POLICY IF EXISTS "Admin users can view ingredients" ON ingredients;
DROP POLICY IF EXISTS "Admin users can insert ingredients" ON ingredients;
DROP POLICY IF EXISTS "Admin users can update ingredients" ON ingredients;
DROP POLICY IF EXISTS "Admin users can delete ingredients" ON ingredients;

-- Allow public read access to ingredients (needed for meal display)
CREATE POLICY "Public can view ingredients"
  ON ingredients FOR SELECT
  USING (true);

-- Only admins can modify ingredients
CREATE POLICY "Admin users can insert ingredients"
  ON ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin users can update ingredients"
  ON ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Admin users can delete ingredients"
  ON ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- TABLE: user_roles
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can delete user_roles" ON user_roles;

-- Recreate user_roles policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admin users can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admin users can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to read own roles" ON user_roles;

-- Simple policy: authenticated users can view their own roles
-- This avoids infinite recursion by not querying user_roles within the policy
CREATE POLICY "Allow authenticated users to read own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- NOTE: Admin operations on user_roles (INSERT, UPDATE, DELETE) should be done
-- via API routes using the service role key to bypass RLS.
-- This prevents infinite recursion issues when checking if a user is an admin.

-- ============================================
-- Add comments for documentation
-- ============================================
COMMENT ON POLICY "Logistics can view all storage" ON storage IS 
  'Only users with occupation=Logistik can view storage entries';
COMMENT ON POLICY "Logistics can insert storage" ON storage IS 
  'Only users with occupation=Logistik can insert storage entries';

COMMENT ON POLICY "Logistics can view all orders" ON orders IS 
  'Only users with occupation=Logistik can view orders';
COMMENT ON POLICY "Logistics can accept orders" ON orders IS 
  'Only users with occupation=Logistik can update order status';

COMMENT ON POLICY "Public can view ingredients" ON ingredients IS 
  'Public read access for displaying meals';
COMMENT ON POLICY "Admin users can insert ingredients" ON ingredients IS 
  'Only admin users can create ingredients';
COMMENT ON POLICY "Admin users can update ingredients" ON ingredients IS 
  'Only admin users can update ingredients';
COMMENT ON POLICY "Admin users can delete ingredients" ON ingredients IS 
  'Only admin users can delete ingredients';

COMMENT ON POLICY "Allow authenticated users to read own roles" ON user_roles IS 
  'Authenticated users can view their own role assignments without infinite recursion';
