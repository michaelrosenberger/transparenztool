/**
 * Client-side helper to check admin authentication via API
 * Use this in admin pages instead of direct Supabase queries
 */
export async function checkAdminAuth(): Promise<{ user: any; isAdmin: boolean }> {
  const response = await fetch('/api/auth/check');
  
  if (!response.ok) {
    throw new Error('Auth check failed');
  }

  return response.json();
}
