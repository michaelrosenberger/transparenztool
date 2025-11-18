-- Demo Users for Transparenztool
-- This script creates demo farmer and logistic users with valid Austrian addresses

-- IMPORTANT: Run this in Supabase SQL Editor
-- These users will need to confirm their email or you can manually verify them in the Supabase Auth dashboard

-- Demo Farmer 1: Vienna
-- Email: farmer1@demo.com
-- Password: demo123456
-- Location: Vienna, Austria
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'farmer1@demo.com',
  crypt('demo123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{
    "full_name": "Hans Müller",
    "occupation": "Produzenten",
    "street": "Schönbrunner Straße 123",
    "zip_code": "1050",
    "city": "Wien",
    "address_coordinates": {
      "lat": 48.1867,
      "lng": 16.3738
    },
    "vegetables": ["Tomatoes", "Carrots", "Potatoes", "Salad", "Cucumbers"]
  }',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Demo Farmer 2: Graz
-- Email: farmer2@demo.com
-- Password: demo123456
-- Location: Graz, Austria
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'farmer2@demo.com',
  crypt('demo123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{
    "full_name": "Maria Schmidt",
    "occupation": "Produzenten",
    "street": "Herrengasse 45",
    "zip_code": "8010",
    "city": "Graz",
    "address_coordinates": {
      "lat": 47.0707,
      "lng": 15.4395
    },
    "vegetables": ["Peppers", "Onions", "Cabbage", "Broccoli", "Cauliflower"]
  }',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Demo Farmer 3: Salzburg
-- Email: farmer3@demo.com
-- Password: demo123456
-- Location: Salzburg, Austria
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'farmer3@demo.com',
  crypt('demo123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{
    "full_name": "Josef Weber",
    "occupation": "Produzenten",
    "street": "Getreidegasse 28",
    "zip_code": "5020",
    "city": "Salzburg",
    "address_coordinates": {
      "lat": 47.8095,
      "lng": 13.0550
    },
    "vegetables": ["Tomatoes", "Peppers", "Cucumbers", "Salad", "Carrots"]
  }',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Demo Logistic User: Linz
-- Email: logistik@demo.com
-- Password: demo123456
-- Location: Linz, Austria
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'logistik@demo.com',
  crypt('demo123456', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{
    "full_name": "Thomas Bauer",
    "occupation": "Logistik",
    "street": "Hauptplatz 15",
    "zip_code": "4020",
    "city": "Linz",
    "address_coordinates": {
      "lat": 48.3069,
      "lng": 14.2858
    }
  }',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create identities for each user (required for email/password auth)
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  id::text,
  NOW(),
  NOW(),
  NOW()
FROM auth.users 
WHERE email IN ('farmer1@demo.com', 'farmer2@demo.com', 'farmer3@demo.com', 'logistik@demo.com')
AND NOT EXISTS (
  SELECT 1 FROM auth.identities WHERE user_id = auth.users.id
);

-- Summary
-- ========================================
-- Demo Farmers:
-- 1. Hans Müller (farmer1@demo.com) - Vienna
--    Address: Schönbrunner Straße 123, 1050 Wien
--    Vegetables: Tomatoes, Carrots, Potatoes, Salad, Cucumbers
--
-- 2. Maria Schmidt (farmer2@demo.com) - Graz
--    Address: Herrengasse 45, 8010 Graz
--    Vegetables: Peppers, Onions, Cabbage, Broccoli, Cauliflower
--
-- 3. Josef Weber (farmer3@demo.com) - Salzburg
--    Address: Getreidegasse 28, 5020 Salzburg
--    Vegetables: Tomatoes, Peppers, Cucumbers, Salad, Carrots
--
-- Demo Logistic:
-- 4. Thomas Bauer (logistik@demo.com) - Linz
--    Address: Hauptplatz 15, 4020 Linz
--
-- All passwords: demo123456
-- ========================================
