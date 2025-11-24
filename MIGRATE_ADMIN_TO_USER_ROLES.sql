-- Migration script to move existing admin flags from raw_user_meta_data to user_roles table
-- Run this AFTER creating the user_roles table

-- First, ensure the user_roles table exists
-- If not, run CREATE_USER_ROLES_TABLE.sql first

-- Insert admin roles for all users who have is_admin = true in their metadata
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
  id,
  'admin'::user_role,
  NULL -- No creator for migrated data
FROM auth.users
WHERE (raw_user_meta_data->>'is_admin')::boolean = true
ON CONFLICT (user_id, role) DO NOTHING;

-- Insert default 'user' role for all users who don't have any role yet
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT 
  id,
  'user'::user_role,
  NULL
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.users.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify migration
SELECT 
  u.email,
  u.raw_user_meta_data->>'is_admin' as old_is_admin,
  ur.role as new_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.email;

-- Summary of migrated data
SELECT 
  role,
  COUNT(*) as user_count
FROM public.user_roles
GROUP BY role;
