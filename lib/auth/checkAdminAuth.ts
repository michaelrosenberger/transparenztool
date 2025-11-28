import { createClient } from "@/lib/supabase/client";

/**
 * Client-side helper to check authentication
 * All authenticated users have full access
 * Uses client-side session to avoid Vercel cookie issues
 */
export async function checkAdminAuth(): Promise<{ user: any; isAdmin: boolean }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // All authenticated users are admins
  return {
    user,
    isAdmin: !!user
  };
}
