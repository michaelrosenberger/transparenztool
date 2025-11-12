-- Fix RLS Policies for Logistik Users
-- Run this in Supabase SQL Editor to fix the occupation check

-- Drop the old policies
DROP POLICY IF EXISTS "Logistics can view all orders" ON orders;
DROP POLICY IF EXISTS "Logistics can accept orders" ON orders;
DROP POLICY IF EXISTS "Logistics can view all storage" ON storage;
DROP POLICY IF EXISTS "Logistics can insert storage" ON storage;

-- Create new policies with correct metadata field
-- Policy: Logistics users can view all orders
CREATE POLICY "Logistics can view all orders"
  ON orders FOR SELECT
  USING (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  );

-- Policy: Logistics users can update order status to Accepted
CREATE POLICY "Logistics can accept orders"
  ON orders FOR UPDATE
  USING (
    (auth.jwt()->>'user_metadata')::jsonb->>'occupation' = 'Logistik'
  )
  WITH CHECK (
    status = 'Accepted' OR status = 'Delivered'
  );

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
