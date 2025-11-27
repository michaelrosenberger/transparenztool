-- Fix RLS policies for meals table to allow public read access
-- This is needed for the public /meal/today page

-- Enable RLS on meals table (if not already enabled)
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Drop existing public select policy if it exists
DROP POLICY IF EXISTS "Allow public read access to meals" ON meals;

-- Create policy to allow anyone to read meals
CREATE POLICY "Allow public read access to meals"
ON meals
FOR SELECT
TO anon, authenticated
USING (true);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'meals';
