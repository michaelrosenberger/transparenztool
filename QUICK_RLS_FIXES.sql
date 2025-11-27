-- ============================================================================
-- QUICK RLS FIXES FOR COMMON ISSUES
-- Use these if you know the specific problem
-- ============================================================================

-- ============================================================================
-- FIX 1: Remove ALL duplicate policies
-- ============================================================================
-- Run this if DIAGNOSE script shows duplicates in Section 3
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT DISTINCT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I CASCADE', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- FIX 2: Quick fix for "meals" table not loading
-- ============================================================================
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read meals" ON meals;
CREATE POLICY "Public can read meals"
ON meals FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================================================
-- FIX 3: Quick fix for "meal_menus" table not loading
-- ============================================================================
ALTER TABLE meal_menus ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read menus" ON meal_menus;
CREATE POLICY "Public can read menus"
ON meal_menus FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================================================
-- FIX 4: Quick fix for "ingredients" table not loading
-- ============================================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read ingredients" ON ingredients;
CREATE POLICY "Public can read ingredients"
ON ingredients FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================================================
-- FIX 5: Fix storage bucket access
-- ============================================================================
-- Make sure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('meal-images', 'ingredient-images', 'farmer-images', 'business-images');

-- Drop all storage policies and recreate
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- Create fresh storage policies
CREATE POLICY "Public can read all files"
ON storage.objects FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete files"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- FIX 6: Fix user_roles table (for admin checks)
-- ============================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read roles" ON user_roles;
CREATE POLICY "Authenticated users can read roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage roles" ON user_roles;
CREATE POLICY "Authenticated users can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- FIX 7: Enable RLS on all main tables (if not already enabled)
-- ============================================================================
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Only if produzenten_profile exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'produzenten_profile') THEN
        ALTER TABLE produzenten_profile ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================================
-- FIX 8: Nuclear option - Disable RLS temporarily for testing
-- ============================================================================
-- ONLY USE THIS FOR DEBUGGING! Re-enable RLS after testing!
-- Uncomment the lines below if you want to test without RLS:

-- ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE meal_menus DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFY THE FIXES
-- ============================================================================
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
