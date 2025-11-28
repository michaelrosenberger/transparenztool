/**
 * Client-side helper to check authentication via API
 * All authenticated users have full access
 */
export async function checkAdminAuth(): Promise<{ user: any; isAdmin: boolean }> {
  const response = await fetch('/api/auth/check');
  
  if (!response.ok) {
    throw new Error('Auth check failed');
  }

  return response.json();
}
