-- ============================================================================
-- RLS DIAGNOSTIC SCRIPT
-- Run this first to see what RLS issues you have
-- ============================================================================

-- ============================================================================
-- 1. CHECK WHICH TABLES HAVE RLS ENABLED
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. LIST ALL CURRENT RLS POLICIES
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 3. CHECK FOR DUPLICATE POLICIES (COMMON ISSUE)
-- ============================================================================
SELECT 
    tablename,
    policyname,
    COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, policyname
HAVING COUNT(*) > 1
ORDER BY tablename, policyname;

-- ============================================================================
-- 4. CHECK STORAGE POLICIES
-- ============================================================================
SELECT 
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- ============================================================================
-- 5. CHECK IF TABLES EXIST
-- ============================================================================
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        ) THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM (
    VALUES 
        ('meals'),
        ('meal_menus'),
        ('ingredients'),
        ('user_roles'),
        ('produzenten_profile')
) AS expected_tables(table_name)
ORDER BY table_name;

-- ============================================================================
-- 6. CHECK FOR CONFLICTING POLICIES
-- ============================================================================
-- Policies that might conflict (same table, same command, different conditions)
SELECT 
    p1.tablename,
    p1.cmd,
    p1.policyname as policy1,
    p2.policyname as policy2,
    p1.qual as policy1_condition,
    p2.qual as policy2_condition
FROM pg_policies p1
JOIN pg_policies p2 
    ON p1.tablename = p2.tablename 
    AND p1.cmd = p2.cmd 
    AND p1.policyname < p2.policyname
WHERE p1.schemaname = 'public'
ORDER BY p1.tablename, p1.cmd;

-- ============================================================================
-- 7. TEST PUBLIC ACCESS TO KEY TABLES
-- ============================================================================
-- This shows if anonymous users can read from key tables
SELECT 
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND cmd = 'SELECT'
    AND ('anon' = ANY(roles) OR 'public' = ANY(roles))
ORDER BY tablename;

-- ============================================================================
-- 8. CHECK FOR MISSING POLICIES
-- ============================================================================
-- Tables with RLS enabled but no SELECT policy for anon/public
SELECT DISTINCT
    t.tablename
FROM pg_tables t
WHERE t.schemaname = 'public'
    AND t.rowsecurity = true
    AND NOT EXISTS (
        SELECT 1
        FROM pg_policies p
        WHERE p.schemaname = 'public'
            AND p.tablename = t.tablename
            AND p.cmd = 'SELECT'
            AND ('anon' = ANY(p.roles) OR 'public' = ANY(p.roles))
    )
ORDER BY t.tablename;

-- ============================================================================
-- INTERPRETATION GUIDE:
-- ============================================================================
-- 
-- Section 1: All your main tables should have rls_enabled = true
-- Section 2: Shows all current policies - look for duplicates or missing ones
-- Section 3: If this returns rows, you have duplicate policies (BAD!)
-- Section 4: Storage should allow public SELECT and authenticated INSERT/UPDATE/DELETE
-- Section 5: All tables should show 'EXISTS'
-- Section 6: If this returns rows, you might have conflicting policies
-- Section 7: Should show SELECT policies for meals, meal_menus, ingredients
-- Section 8: If this returns rows, those tables need public SELECT policies
-- ============================================================================
