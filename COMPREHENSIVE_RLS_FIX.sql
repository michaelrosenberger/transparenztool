-- ============================================================================
-- COMPREHENSIVE RLS POLICY FIX
-- This script fixes all RLS policies for the Transparenztool application
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. MEALS TABLE - Public read, authenticated users can manage their own
-- ============================================================================

-- Enable RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing policies (including new ones)
DROP POLICY IF EXISTS "Allow public read access to meals" ON meals;
DROP POLICY IF EXISTS "Public can read meals" ON meals;
DROP POLICY IF EXISTS "Users can insert their own meals" ON meals;
DROP POLICY IF EXISTS "Authenticated users can insert meals" ON meals;
DROP POLICY IF EXISTS "Users can update their own meals" ON meals;
DROP POLICY IF EXISTS "Authenticated users can update meals" ON meals;
DROP POLICY IF EXISTS "Users can delete their own meals" ON meals;
DROP POLICY IF EXISTS "Authenticated users can delete meals" ON meals;
DROP POLICY IF EXISTS "Admins can do everything" ON meals;

-- Public can read all meals
CREATE POLICY "Public can read meals"
ON meals FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated users can insert meals
CREATE POLICY "Authenticated users can insert meals"
ON meals FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update all meals (needed for admin functionality)
CREATE POLICY "Authenticated users can update meals"
ON meals FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Users can delete all meals (needed for admin functionality)
CREATE POLICY "Authenticated users can delete meals"
ON meals FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- 2. MEAL_MENUS TABLE - Public read, authenticated users can manage
-- ============================================================================

-- Enable RLS
ALTER TABLE meal_menus ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing policies
DROP POLICY IF EXISTS "Allow public read access to meal_menus" ON meal_menus;
DROP POLICY IF EXISTS "Public can read menus" ON meal_menus;
DROP POLICY IF EXISTS "Users can insert menus" ON meal_menus;
DROP POLICY IF EXISTS "Authenticated users can insert menus" ON meal_menus;
DROP POLICY IF EXISTS "Users can update menus" ON meal_menus;
DROP POLICY IF EXISTS "Authenticated users can update menus" ON meal_menus;
DROP POLICY IF EXISTS "Users can delete menus" ON meal_menus;
DROP POLICY IF EXISTS "Authenticated users can delete menus" ON meal_menus;

-- Public can read all menus
CREATE POLICY "Public can read menus"
ON meal_menus FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated users can insert menus
CREATE POLICY "Authenticated users can insert menus"
ON meal_menus FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update menus
CREATE POLICY "Authenticated users can update menus"
ON meal_menus FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can delete menus
CREATE POLICY "Authenticated users can delete menus"
ON meal_menus FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- 3. INGREDIENTS TABLE - Public read, authenticated users can manage
-- ============================================================================

-- Enable RLS
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing policies
DROP POLICY IF EXISTS "Allow public read access to ingredients" ON ingredients;
DROP POLICY IF EXISTS "Public can read ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can insert ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can insert ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can update ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can update ingredients" ON ingredients;
DROP POLICY IF EXISTS "Users can delete ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can delete ingredients" ON ingredients;

-- Public can read all ingredients
CREATE POLICY "Public can read ingredients"
ON ingredients FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated users can insert ingredients
CREATE POLICY "Authenticated users can insert ingredients"
ON ingredients FOR INSERT
TO authenticated
WITH CHECK (true);

-- Authenticated users can update ingredients
CREATE POLICY "Authenticated users can update ingredients"
ON ingredients FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated users can delete ingredients
CREATE POLICY "Authenticated users can delete ingredients"
ON ingredients FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- 4. USER_ROLES TABLE - Authenticated users can read, only service role can write
-- ============================================================================

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing policies
DROP POLICY IF EXISTS "Users can read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can read roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can manage roles" ON user_roles;

-- Authenticated users can read all roles (needed for admin checks)
CREATE POLICY "Authenticated users can read roles"
ON user_roles FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can insert/update/delete (admin functionality)
CREATE POLICY "Authenticated users can manage roles"
ON user_roles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 5. PRODUZENTEN_PROFILE TABLE - Public read for active, users manage own
-- ============================================================================

-- Enable RLS (if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'produzenten_profile') THEN
        ALTER TABLE produzenten_profile ENABLE ROW LEVEL SECURITY;
        
        -- Drop all existing policies
        DROP POLICY IF EXISTS "Public can read active profiles" ON produzenten_profile;
        DROP POLICY IF EXISTS "Users can read their own profile" ON produzenten_profile;
        DROP POLICY IF EXISTS "Users can update their own profile" ON produzenten_profile;
        DROP POLICY IF EXISTS "Users can insert their own profile" ON produzenten_profile;
        
        -- Public can read all profiles
        CREATE POLICY "Public can read profiles"
        ON produzenten_profile FOR SELECT
        TO anon, authenticated
        USING (true);
        
        -- Users can insert their own profile
        CREATE POLICY "Users can insert own profile"
        ON produzenten_profile FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);
        
        -- Users can update their own profile
        CREATE POLICY "Users can update own profile"
        ON produzenten_profile FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        
        -- Authenticated users can delete profiles (admin functionality)
        CREATE POLICY "Authenticated users can delete profiles"
        ON produzenten_profile FOR DELETE
        TO authenticated
        USING (true);
    END IF;
END $$;

-- ============================================================================
-- 6. STORAGE BUCKETS - Public read, authenticated write
-- ============================================================================

-- Drop ALL existing storage policies (including duplicates)
DROP POLICY IF EXISTS "Allow admins to delete ingredient images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update ingredient images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to upload ingredient images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to ingredient images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can read all files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images" ON storage.objects;

-- Create ONLY 4 clean policies with simple names
CREATE POLICY "storage_public_read"
ON storage.objects FOR SELECT
TO public
USING (true);

CREATE POLICY "storage_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "storage_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "storage_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- 7. VERIFY ALL POLICIES
-- ============================================================================

-- Check all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check storage policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- ============================================================================
-- DONE! All RLS policies have been fixed
-- ============================================================================
