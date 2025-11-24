# User Roles Migration Guide

## Overview

This guide documents the migration from storing admin roles in JSON (`raw_user_meta_data`) to a proper relational `user_roles` table in the database.

## Why This Change?

### Problems with JSON Storage:
1. **Not easily queryable** - Required complex JSON extraction syntax in SQL
2. **Not indexed** - Poor performance when filtering by role
3. **Not visible in Supabase UI** - Hard to view/edit in database interface
4. **No referential integrity** - No constraints or validation
5. **Not scalable** - Difficult to add multiple roles or role hierarchies

### Benefits of Table-Based Storage:
1. ✅ **Easily queryable** - Simple SQL joins and filters
2. ✅ **Indexed** - Fast lookups and filtering
3. ✅ **Visible in Supabase** - Easy to view and edit in Table Editor
4. ✅ **Referential integrity** - Foreign key constraints ensure data consistency
5. ✅ **Scalable** - Easy to add new roles and permissions
6. ✅ **Auditable** - Track who created roles and when

## Migration Steps

### 1. Create the User Roles Table

Run the SQL script in Supabase SQL Editor:

```bash
CREATE_USER_ROLES_TABLE.sql
```

This creates:
- `user_roles` table with proper structure
- `user_role` enum type for role values
- RLS policies for security
- Helper functions `is_admin()` and `get_user_roles()`
- Indexes for performance

### 2. Migrate Existing Data

Run the migration script in Supabase SQL Editor:

```bash
MIGRATE_ADMIN_TO_USER_ROLES.sql
```

This will:
- Copy all existing `is_admin` flags from `raw_user_meta_data` to `user_roles` table
- Assign default 'user' role to users without any role
- Verify the migration with a summary report

### 3. Update RLS Policies

Run the policy update script in Supabase SQL Editor:

```bash
UPDATE_RLS_POLICIES_FOR_USER_ROLES.sql
```

This updates:
- Ingredients table policies
- Storage bucket policies for ingredient images
- Any other policies that check admin status

### 4. Deploy Code Changes

The following files have been updated to use the new `user_roles` table:

#### Backend (API Routes):
- ✅ `app/api/admin/users/route.ts` - List users with roles
- ✅ `app/api/admin/users/[id]/route.ts` - Update/delete users with role checks
- ✅ `app/api/admin/farmers/route.ts` - Farmer management with role checks

#### Frontend (Components):
- ✅ `app/components/Header.tsx` - Admin toggle using user_roles
- ✅ `app/admin/page.tsx` - Admin dashboard access control
- ✅ `app/admin/overview/page.tsx` - User management access control
- ✅ `app/admin/users/[id]/page.tsx` - User edit access control
- ✅ `app/admin/meals/page.tsx` - Meals management access control
- ✅ `app/admin/meals/[id]/page.tsx` - Meal edit access control

#### Utilities:
- ✅ `lib/auth/roles.ts` - Helper functions for role management
- ✅ `lib/hooks/useIsAdmin.ts` - React hook for checking admin status

## Database Schema

### user_roles Table

```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(user_id, role)
);
```

### user_role Enum

```sql
CREATE TYPE user_role AS ENUM ('admin', 'user');
```

## Usage Examples

### Backend (Server-Side)

```typescript
import { isAdmin, setAdminRole } from '@/lib/auth/roles';

// Check if user is admin
const userIsAdmin = await isAdmin(userId);

// Set admin role
await setAdminRole(userId, true);  // Grant admin
await setAdminRole(userId, false); // Revoke admin
```

### Frontend (Client-Side)

```typescript
import { useIsAdmin } from '@/lib/hooks/useIsAdmin';

function MyComponent() {
  const { isAdmin, loading } = useIsAdmin();
  
  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return <div>Access denied</div>;
  
  return <div>Admin content</div>;
}
```

### SQL Queries

```sql
-- Check if user is admin
SELECT public.is_admin('user-uuid-here');

-- Get all roles for a user
SELECT * FROM public.get_user_roles('user-uuid-here');

-- Get all admin users
SELECT u.email, u.id
FROM auth.users u
INNER JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

## Rollback Plan

If you need to rollback to the old JSON-based system:

1. **Don't delete the old data** - The `raw_user_meta_data` still contains the old `is_admin` flags
2. **Revert code changes** - Use git to revert the code changes
3. **Drop the table** (optional):
   ```sql
   DROP TABLE IF EXISTS public.user_roles CASCADE;
   DROP TYPE IF EXISTS user_role;
   ```

## Testing Checklist

After migration, verify:

- [ ] Admin users can access admin pages
- [ ] Non-admin users are blocked from admin pages
- [ ] Admin toggle in header works correctly
- [ ] User roles are visible in Supabase Table Editor
- [ ] Admin can grant/revoke admin roles to other users
- [ ] RLS policies correctly enforce admin-only operations
- [ ] Ingredients management requires admin role
- [ ] User management requires admin role

## Future Enhancements

With this new structure, you can easily:

1. **Add more roles**: `CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator', 'editor');`
2. **Multiple roles per user**: Users can have multiple roles simultaneously
3. **Role hierarchy**: Implement role inheritance and permissions
4. **Audit trail**: Track role changes with created_by and timestamps
5. **Time-based roles**: Add expiration dates for temporary roles

## Support

If you encounter issues:

1. Check the Supabase logs for errors
2. Verify RLS policies are correctly updated
3. Ensure the migration script completed successfully
4. Check that the `user_roles` table has data

## Notes

- The old `is_admin` field in `raw_user_meta_data` is **not deleted** for safety
- You can keep it as a backup or remove it later once you're confident
- The new system is backward compatible during the transition period
