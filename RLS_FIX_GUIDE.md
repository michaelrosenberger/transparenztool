# RLS Issues Fix Guide

## Step-by-Step Process to Fix Your RLS Issues

### Step 1: Diagnose the Problem
1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open and run `DIAGNOSE_RLS_ISSUES.sql`
4. Review the output to understand what's wrong

### Step 2: Understand the Diagnosis

#### Section 1: RLS Enabled Check
- ✅ All tables should have `rls_enabled = true`
- ❌ If any table shows `false`, RLS is not enabled

#### Section 3: Duplicate Policies
- ✅ Should return 0 rows
- ❌ If it returns rows, you have duplicate policies (this causes errors!)

#### Section 5: Missing Tables
- ✅ All tables should show 'EXISTS'
- ❌ If any show 'MISSING', you need to create those tables

#### Section 8: Missing Public Access
- ✅ Should return 0 rows
- ❌ If it returns table names, those tables need public SELECT policies

### Step 3: Apply the Fix

Choose ONE of these options:

#### Option A: Full Reset (RECOMMENDED)
Run the entire `COMPREHENSIVE_RLS_FIX.sql` file. This will:
- Drop all existing policies
- Create fresh, correct policies
- Enable RLS on all tables
- Set up proper storage access

#### Option B: Quick Fixes
If you know the specific issue, use `QUICK_RLS_FIXES.sql`:
- **FIX 1**: Remove duplicate policies
- **FIX 2-4**: Fix specific table access
- **FIX 5**: Fix storage bucket access
- **FIX 6**: Fix admin role checks
- **FIX 7**: Enable RLS on all tables

### Step 4: Verify the Fix
Run `DIAGNOSE_RLS_ISSUES.sql` again and check:
- Section 3 should return 0 rows (no duplicates)
- Section 7 should show SELECT policies for public tables
- Section 8 should return 0 rows (no missing policies)

### Step 5: Test Your Application
1. Open your app in an **incognito/private window** (to test as anonymous user)
2. Navigate to `/meal/today` - should load without errors
3. Navigate to `/menus/today` - should load without errors
4. Check browser console for any RLS errors

## Common RLS Error Messages and Solutions

### Error: "new row violates row-level security policy"
**Cause**: INSERT/UPDATE policy is too restrictive
**Solution**: Run FIX 2-4 from `QUICK_RLS_FIXES.sql` for the affected table

### Error: "permission denied for table"
**Cause**: No SELECT policy for anonymous users
**Solution**: Run FIX 2-4 from `QUICK_RLS_FIXES.sql` for the affected table

### Error: "duplicate key value violates unique constraint"
**Cause**: Duplicate policies with same name
**Solution**: Run FIX 1 from `QUICK_RLS_FIXES.sql`

### Error: "could not open relation with OID"
**Cause**: Table doesn't exist or RLS is misconfigured
**Solution**: Check Section 5 of diagnostic, create missing tables

## Tables That Need Public Read Access

These tables MUST allow anonymous (public) read access:
- ✅ `meals` - for `/meal/today` and `/meal/[id]` pages
- ✅ `meal_menus` - for `/menus/today` and `/menus/[id]` pages
- ✅ `ingredients` - for displaying ingredient information
- ✅ `produzenten_profile` - for farmer profile pages

## Tables That Need Authenticated Access Only

These tables should only be accessible to logged-in users:
- 🔒 `user_roles` - for admin checks (SELECT only)

## Storage Buckets

All storage buckets should be:
- ✅ Public = true (for reading images)
- ✅ Allow anonymous SELECT
- ✅ Allow authenticated INSERT/UPDATE/DELETE

## If Nothing Works (Nuclear Option)

If you're still having issues after trying everything:

1. **Backup your data first!**
2. Run this to temporarily disable RLS for testing:
```sql
ALTER TABLE meals DISABLE ROW LEVEL SECURITY;
ALTER TABLE meal_menus DISABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients DISABLE ROW LEVEL SECURITY;
```

3. Test if your app works now
4. If it works, the problem is definitely RLS
5. Re-enable RLS and run `COMPREHENSIVE_RLS_FIX.sql`

## Need More Help?

If you're still stuck, share the output of:
1. `DIAGNOSE_RLS_ISSUES.sql` (all sections)
2. Any error messages from your browser console
3. Any error messages from Supabase logs

## Quick Reference: What Each Script Does

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `DIAGNOSE_RLS_ISSUES.sql` | Shows current RLS state | Always run this first |
| `COMPREHENSIVE_RLS_FIX.sql` | Complete RLS reset | When you want a fresh start |
| `QUICK_RLS_FIXES.sql` | Targeted fixes | When you know the specific issue |

## Pro Tips

1. **Always run diagnostics first** - Don't guess what's wrong
2. **One fix at a time** - Apply one fix, test, then move to next
3. **Check browser console** - RLS errors show up there
4. **Use incognito mode** - Tests anonymous user access
5. **Backup before major changes** - Just in case!
