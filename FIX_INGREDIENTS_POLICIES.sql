-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins full access to ingredients" ON public.ingredients;
DROP POLICY IF EXISTS "Allow admins to upload ingredient images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update ingredient images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete ingredient images" ON storage.objects;

-- Recreate admin policy with correct JWT check
CREATE POLICY "Allow admins full access to ingredients"
    ON public.ingredients
    FOR ALL
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

-- Recreate storage policies with correct JWT check
CREATE POLICY "Allow admins to upload ingredient images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'ingredient-images'
        AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

CREATE POLICY "Allow admins to update ingredient images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'ingredient-images'
        AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

CREATE POLICY "Allow admins to delete ingredient images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'ingredient-images'
        AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );
