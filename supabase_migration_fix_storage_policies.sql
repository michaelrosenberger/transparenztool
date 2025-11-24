-- Fix duplicate RLS policies on storage table
-- This removes conflicting "Authenticated users" policies
-- and keeps only the "Logistics" policies

-- Drop the duplicate authenticated users policies
DROP POLICY IF EXISTS "Authenticated users can view storage" ON storage;
DROP POLICY IF EXISTS "Authenticated users can insert storage" ON storage;

-- Recreate the Logistics policies (to ensure they're correct)
DROP POLICY IF EXISTS "Logistics can view all storage" ON storage;
DROP POLICY IF EXISTS "Logistics can insert storage" ON storage;

-- Policy: Logistics users can view all storage entries
CREATE POLICY "Logistics can view all storage"
  ON storage FOR SELECT
  USING (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

-- Policy: Logistics users can insert storage entries
CREATE POLICY "Logistics can insert storage"
  ON storage FOR INSERT
  WITH CHECK (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

-- Add comments to document the policies
COMMENT ON POLICY "Logistics can view all storage" ON storage IS 
  'Only users with occupation=Logistik can view storage entries';
COMMENT ON POLICY "Logistics can insert storage" ON storage IS 
  'Only users with occupation=Logistik can insert storage entries';
