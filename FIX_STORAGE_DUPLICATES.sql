-- ============================================================================
-- FIX DUPLICATE STORAGE POLICIES
-- You have 12 policies when you only need 4!
-- ============================================================================

-- Step 1: Drop ALL existing storage policies
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

-- Drop any other potential storage policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

-- Step 2: Create ONLY 4 clean policies (one for each operation)

-- 1. Public can SELECT (read) all files
CREATE POLICY "storage_public_read"
ON storage.objects FOR SELECT
TO public
USING (true);

-- 2. Authenticated users can INSERT (upload) files
CREATE POLICY "storage_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Authenticated users can UPDATE files
CREATE POLICY "storage_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Authenticated users can DELETE files
CREATE POLICY "storage_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- Step 3: Verify - should show exactly 4 policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY cmd, policyname;

-- ============================================================================
-- DONE! You should now have exactly 4 storage policies
-- ============================================================================
