# Admin Role Management - Quick Reference

## Editing Admin Roles in Supabase

### Via Supabase Table Editor (Easiest)

1. Open Supabase Dashboard
2. Go to **Table Editor**
3. Select **`user_roles`** table
4. You can now:
   - ✅ View all user roles in a clean table format
   - ✅ Add admin role: Click "Insert row" → Select user_id → Set role to 'admin'
   - ✅ Remove admin role: Find the row → Click delete
   - ✅ Filter by role to see all admins
   - ✅ Search by user_id

### Via SQL Editor

```sql
-- Grant admin role to a user
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Revoke admin role from a user
DELETE FROM public.user_roles
WHERE user_id = 'user-uuid-here'
AND role = 'admin';

-- List all admins
SELECT u.email, u.id, ur.created_at
FROM auth.users u
INNER JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';

-- Check if specific user is admin
SELECT public.is_admin('user-uuid-here');
```

## Before vs After

### ❌ Old Way (JSON)
```json
// In raw_user_meta_data column - hard to edit
{
  "full_name": "John Doe",
  "is_admin": true,
  "occupation": "Admin"
}
```

**Problems:**
- Had to edit raw JSON
- Not visible in table view
- No validation
- Hard to query

### ✅ New Way (Table)
```
user_roles table:
┌──────────────────────────────────────┬───────┬─────────────────────┐
│ user_id                              │ role  │ created_at          │
├──────────────────────────────────────┼───────┼─────────────────────┤
│ 123e4567-e89b-12d3-a456-426614174000 │ admin │ 2024-11-24 07:00:00 │
│ 987fcdeb-51a2-43f7-9abc-123456789012 │ user  │ 2024-11-24 07:00:00 │
└──────────────────────────────────────┴───────┴─────────────────────┘
```

**Benefits:**
- ✅ Clean table view
- ✅ Easy to edit in UI
- ✅ Validated by enum
- ✅ Easy to query
- ✅ Indexed for performance

## Common Tasks

### Make a User Admin
1. Go to Supabase → Table Editor → `user_roles`
2. Click "Insert row"
3. Select the user from `user_id` dropdown
4. Set `role` to `admin`
5. Click Save

### Remove Admin Access
1. Go to Supabase → Table Editor → `user_roles`
2. Find the row where `role = 'admin'` for that user
3. Click the delete icon
4. Confirm deletion

### Find User ID by Email
```sql
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

## In-App Admin Toggle

Users can toggle their own admin status using the switch in the header (for development):

```typescript
// This is now managed through the user_roles table
// Toggle adds/removes a row in user_roles table
```

## Security Notes

- ✅ RLS policies protect the `user_roles` table
- ✅ Only admins can modify roles
- ✅ All users can read roles (needed for authorization checks)
- ✅ Deleting a user automatically deletes their roles (CASCADE)

## Troubleshooting

### User can't access admin pages
1. Check if they have admin role:
   ```sql
   SELECT * FROM public.user_roles WHERE user_id = 'their-user-id';
   ```
2. If missing, add it:
   ```sql
   INSERT INTO public.user_roles (user_id, role) VALUES ('their-user-id', 'admin');
   ```

### Admin toggle not working
1. Check browser console for errors
2. Verify RLS policies are applied
3. Check that user_roles table exists

### Can't see user_roles table
1. Make sure you ran `CREATE_USER_ROLES_TABLE.sql`
2. Check you're looking in the `public` schema
3. Refresh the Supabase dashboard
