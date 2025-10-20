# Supabase Authentication Setup Guide

Your Next.js project now has complete authentication functionality with Supabase! Follow these steps to get it working.

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project (choose a name, database password, and region)
4. Wait for the project to be provisioned (~2 minutes)

### 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` `public` key)

### 3. Configure Environment Variables

1. Create a `.env.local` file in your project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the placeholder values with your actual Supabase credentials

### 4. Configure Email Authentication (Optional)

By default, Supabase requires email confirmation. To disable it for testing:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **OFF** "Confirm email"
3. Click **Save**

For production, keep email confirmation enabled!

### 5. Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## ✅ What's Been Implemented

### **Authentication Pages**
- ✅ `/login` - Login page with email/password
- ✅ `/register` - Registration page with validation
- ✅ `/auth/callback` - OAuth callback handler

### **Header Component**
- ✅ Shows **Login/Register** buttons when logged out
- ✅ Shows **user email** and **Logout** button when logged in
- ✅ Real-time auth state updates

### **Middleware Protection**
- ✅ Automatic session refresh
- ✅ Protected routes support (add routes in `middleware.ts`)
- ✅ Redirects to login for protected pages

### **Supabase Configuration**
- ✅ Client-side auth (`lib/supabase/client.ts`)
- ✅ Server-side auth (`lib/supabase/server.ts`)
- ✅ Middleware auth (`lib/supabase/middleware.ts`)

## 🔒 Adding Protected Routes

To protect a route (require login), edit `lib/supabase/middleware.ts`:

```typescript
const protectedRoutes = ["/dashboard", "/profile", "/settings"];
```

Add your protected route paths to this array.

## 📝 Database Tables (Optional)

If you want to store user profiles or additional data:

1. Go to **Table Editor** in Supabase
2. Create a new table (e.g., `profiles`)
3. Add columns as needed
4. Set up Row Level Security (RLS) policies

Example profile table:
```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
```

## 🧪 Testing Authentication

1. **Register a new account:**
   - Go to `http://localhost:3001/register`
   - Enter email and password
   - Click Register
   - Check email for confirmation (if enabled)

2. **Login:**
   - Go to `http://localhost:3001/login`
   - Enter credentials
   - Click Login

3. **Check auth state:**
   - Open burger menu
   - Should see your email and Logout button

4. **Logout:**
   - Click Logout in the menu
   - Should redirect to home

## 🎨 Customization

### Change Email Templates
1. Go to **Authentication** → **Email Templates**
2. Customize confirmation, reset password, etc.

### Add OAuth Providers
1. Go to **Authentication** → **Providers**
2. Enable Google, GitHub, etc.
3. Add provider buttons to login/register pages

### Styling
All auth pages use your existing Tailwind classes and support dark mode.

## 🐛 Troubleshooting

### "Invalid API key" error
- Check your `.env.local` file exists
- Verify the keys are correct
- Restart the dev server

### Email not sending
- Check Supabase email settings
- For testing, disable email confirmation
- Check spam folder

### Session not persisting
- Clear browser cookies
- Check middleware configuration
- Verify Supabase URL is correct

## 📚 Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Dashboard](https://app.supabase.com)

## 🎉 You're All Set!

Your authentication system is ready to use. Just add your Supabase credentials and start testing!
