-- Create a function to get all farmer profiles
-- This allows the demo page to fetch farmer information without exposing auth.users

-- Drop the existing function first to allow changing the return type
DROP FUNCTION IF EXISTS get_farmer_profiles();

CREATE OR REPLACE FUNCTION get_farmer_profiles()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  business_name text,
  business_subtext text,
  business_description text,
  profile_image text,
  business_images jsonb,
  featured_image_index integer,
  street text,
  zip_code text,
  city text,
  vegetables jsonb,
  address_coordinates jsonb
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'business_name', u.raw_user_meta_data->>'full_name', u.email) as full_name,
    u.raw_user_meta_data->>'business_name' as business_name,
    u.raw_user_meta_data->>'business_subtext' as business_subtext,
    u.raw_user_meta_data->>'business_description' as business_description,
    u.raw_user_meta_data->>'profile_image' as profile_image,
    u.raw_user_meta_data->'business_images' as business_images,
    COALESCE((u.raw_user_meta_data->>'featured_image_index')::integer, 0) as featured_image_index,
    u.raw_user_meta_data->>'street' as street,
    u.raw_user_meta_data->>'zip_code' as zip_code,
    u.raw_user_meta_data->>'city' as city,
    u.raw_user_meta_data->'vegetables' as vegetables,
    u.raw_user_meta_data->'address_coordinates' as address_coordinates
  FROM auth.users u
  WHERE u.raw_user_meta_data->>'occupation' = 'Produzenten';
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION get_farmer_profiles() TO authenticated, anon;
