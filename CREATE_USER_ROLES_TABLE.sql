-- Create user_roles table for proper role management
-- This replaces the is_admin flag in raw_user_meta_data JSON

-- Create enum for roles (extensible for future roles)
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ensure one role per user
  UNIQUE(user_id, role)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles(role);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view roles (needed for authorization checks)
CREATE POLICY "Anyone can view user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert roles
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Only admins can update roles
CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Only admins can delete roles
CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(check_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(role user_role) AS $$
BEGIN
  RETURN QUERY
  SELECT user_roles.role
  FROM public.user_roles
  WHERE user_id = check_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_roles TO authenticated;
