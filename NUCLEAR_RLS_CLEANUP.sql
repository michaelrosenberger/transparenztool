-- ============================================================================
-- NUCLEAR RLS CLEANUP - Remove ALL existing policies and start fresh
-- This will fix all the duplicate policy issues
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL POLICIES FROM ALL TABLES
-- ============================================================================

-- INGREDIENTS TABLE - Drop all 12 policies
DROP POLICY IF EXISTS "Allow admins full access to ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow admins to manage ingredients" ON ingredients;
DROP POLICY IF EXISTS "Admin users can delete ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can delete ingredients" ON ingredients;
DROP POLICY IF EXISTS "Admin users can insert ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can insert ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow authenticated users to read all ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow public read access to available ingredients" ON ingredients;
DROP POLICY IF EXISTS "Public can read ingredients" ON ingredients;
DROP POLICY IF EXISTS "Public can view ingredients" ON ingredients;
DROP POLICY IF EXISTS "Admin users can update ingredients" ON ingredients;
DROP POLICY IF EXISTS "Authenticated users can update ingredients" ON ingredients;

-- MEAL_MENUS TABLE - Drop all 10 policies
DROP POLICY IF EXISTS "Allow admin users to delete menus" ON meal_menus;
DROP POLICY IF EXISTS "Authenticated users can delete menus" ON meal_menus;
DROP POLICY IF EXISTS "Allow admin users to insert menus" ON meal_menus;
DROP POLICY IF EXISTS "Authenticated users can insert menus" ON meal_menus;
DROP POLICY IF EXISTS "Allow authenticated users to read menus" ON meal_menus;
DROP POLICY IF EXISTS "Public can read menus" ON meal_menus;
DROP POLICY IF EXISTS "Allow admin users to update menus" ON meal_menus;
DROP POLICY IF EXISTS "Authenticated users can update menus" ON meal_menus;

-- MEALS TABLE - Drop all 8 policies
DROP POLICY IF EXISTS "Admin users can delete meals" ON meals;
DROP POLICY IF EXISTS "Authenticated users can delete meals" ON meals;
DROP POLICY IF EXISTS "Admin users can insert meals" ON meals;
DROP POLICY IF EXISTS "Authenticated users can insert meals" ON meals;
DROP POLICY IF EXISTS "Meals are viewable by everyone" ON meals;
DROP POLICY IF EXISTS "Public can read meals" ON meals;
DROP POLICY IF EXISTS "Admin users can update meals" ON meals;
DROP POLICY IF EXISTS "Authenticated users can update meals" ON meals;

-- USER_ROLES TABLE - Drop all 7 policies
DROP POLICY IF EXISTS "Authenticated users can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can insert roles" ON user_roles;
DROP POLICY IF EXISTS "Allow authenticated users to read own roles" ON user_roles;
DROP POLICY IF EXISTS "Anyone can view user roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can read roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON user_roles;

-- ORDERS TABLE - Drop all 6 policies (if you use this table)
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Logistics can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Logistics can accept orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- STORAGE TABLE - Drop all 2 policies (if you use this table)
DROP POLICY IF EXISTS "Logistics can insert storage" ON storage;
DROP POLICY IF EXISTS "Logistics can view all storage" ON storage;

-- ============================================================================
-- STEP 2: CREATE CLEAN, SIMPLE POLICIES
-- ============================================================================

-- ============================================================================
-- MEALS TABLE - 4 policies
-- ============================================================================
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meals_public_select"
ON meals FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "meals_auth_insert"
ON meals FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "meals_auth_update"
ON meals FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "meals_auth_delete"
ON meals FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- MEAL_MENUS TABLE - 4 policies
-- ============================================================================
ALTER TABLE meal_menus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menus_public_select"
ON meal_menus FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "menus_auth_insert"
ON meal_menus FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "menus_auth_update"
ON meal_menus FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "menus_auth_delete"
ON meal_menus FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- INGREDIENTS TABLE - 4 policies
-- ============================================================================
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ingredients_public_select"
ON ingredients FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "ingredients_auth_insert"
ON ingredients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "ingredients_auth_update"
ON ingredients FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "ingredients_auth_delete"
ON ingredients FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- USER_ROLES TABLE - 2 policies
-- ============================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_auth_select"
ON user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "user_roles_auth_all"
ON user_roles FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================================
-- STEP 3: VERIFY - Should show exactly 14 policies total
-- ============================================================================
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('meals', 'meal_menus', 'ingredients', 'user_roles')
GROUP BY tablename
ORDER BY tablename;

-- Detailed view
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('meals', 'meal_menus', 'ingredients', 'user_roles')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- EXPECTED RESULTS:
-- meals: 4 policies
-- meal_menus: 4 policies  
-- ingredients: 4 policies
-- user_roles: 2 policies
-- TOTAL: 14 policies
-- ============================================================================
