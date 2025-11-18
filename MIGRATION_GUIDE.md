# Migration Guide: Farmer → Produzenten

This guide outlines all changes made to rename "Farmer" to "Produzenten" throughout the application.

## Overview

The occupation value "Farmer" has been renamed to "Produzenten" across the entire codebase, including:
- TypeScript/TSX files
- Database values
- SQL functions
- Documentation

## Database Migration

### Required Steps

1. **Update the SQL function** (if not already done):
   ```sql
   -- Run CREATE_FARMERS_PROFILE_FUNCTION.sql
   -- This updates the function to filter by 'Produzenten' instead of 'Farmer'
   ```

2. **Migrate existing user data**:
   ```sql
   -- Run MIGRATE_FARMER_TO_PRODUZENTEN.sql
   -- This updates all existing users with occupation "Farmer" to "Produzenten"
   ```

3. **Verify the migration**:
   ```sql
   -- Check that all users have been updated
   SELECT 
     id,
     email,
     raw_user_meta_data->>'occupation' as occupation,
     raw_user_meta_data->>'full_name' as full_name
   FROM auth.users
   WHERE raw_user_meta_data->>'occupation' = 'Produzenten';
   
   -- This should return 0 rows
   SELECT count(*) 
   FROM auth.users 
   WHERE raw_user_meta_data->>'occupation' = 'Farmer';
   ```

## Code Changes Summary

### Files Modified

#### TypeScript/TSX Files
- ✅ `app/profile/page.tsx` - Updated occupation type and checks
- ✅ `app/admin/users/[id]/page.tsx` - Updated select dropdown value
- ✅ `app/register/page.tsx` - Updated occupation type and select value
- ✅ `app/page.tsx` - Updated redirect logic
- ✅ `app/produzenten/page.tsx` - Updated occupation check and route references
- ✅ `app/produzenten/orders/page.tsx` - Updated occupation check and route references
- ✅ `app/produzenten/orders/new/page.tsx` - Updated occupation check and route references
- ✅ `app/produzenten/orders/[id]/page.tsx` - Updated occupation check

#### API Routes
- ✅ `app/api/admin/farmers/route.ts` - Updated occupation filter

#### Middleware
- ✅ `lib/supabase/middleware.ts` - Updated protected routes from `/farmer` to `/produzenten`

#### SQL Files
- ✅ `CREATE_DEMO_USERS.sql` - Updated demo user occupation values
- ✅ `CREATE_FARMERS_PROFILE_FUNCTION.sql` - Updated SQL function filter and business_name priority
- ✅ `MIGRATE_FARMER_TO_PRODUZENTEN.sql` - New migration script

**Note:** The SQL function now prioritizes `business_name` over `full_name` when displaying Produzent names.

#### Documentation
- ✅ `README.md` - Updated user role descriptions
- ✅ `DATABASE_SETUP.md` - Updated comments and examples

### URL Routes

**IMPORTANT:** The URL has been changed from `/farmer` to `/produzenten`. All route references have been updated:
- ✅ `app/farmer/` directory renamed to `app/produzenten/`
- ✅ All internal route references updated (`/farmer` → `/produzenten`)
- ✅ Middleware updated to protect `/produzenten` route
- ✅ Navigation and redirects updated

**Note:** Consider setting up a redirect from `/farmer` to `/produzenten` for backward compatibility with existing bookmarks.

## Testing Checklist

After deployment, verify:

- [ ] New user registration with "Produzent" (Produzenten) occupation works
- [ ] Existing Produzenten users can log in and access their dashboard
- [ ] Profile page shows "Produzent" option correctly
- [ ] Admin user edit page shows "Produzent" option correctly
- [ ] Farmer list API returns Produzenten users correctly
- [ ] Demo page displays Produzenten profiles correctly
- [ ] Order creation and management works for Produzenten users
- [ ] Redirect from home page works for Produzenten users

## Rollback Plan

If issues occur, you can rollback the database changes:

```sql
-- Revert occupation values back to "Farmer"
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{occupation}',
  '"Farmer"'
)
WHERE raw_user_meta_data->>'occupation' = 'Produzenten';

-- Revert the SQL function
-- Run the old version of CREATE_FARMERS_PROFILE_FUNCTION.sql with 'Farmer'
```

Then redeploy the previous version of the code.

## Notes

- The display label has been changed from "Landwirt" to "Produzent" throughout the UI
- The internal value changed from "Farmer" to "Produzenten"
- All existing functionality should work identically after migration
- The change is backward compatible if you maintain both values temporarily
