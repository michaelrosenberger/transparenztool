// Auth cache to prevent concurrent duplicate auth checks
let authCheckPromise: Promise<{ user: any; isAdmin: boolean }> | null = null;
let authCheckResult: { user: any; isAdmin: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds - increased to handle multiple tab opens

export async function getCachedAuthCheck(supabase: any): Promise<{ user: any; isAdmin: boolean }> {
  // Return cached result if still valid
  if (authCheckResult && Date.now() - authCheckResult.timestamp < CACHE_DURATION) {
    return { user: authCheckResult.user, isAdmin: authCheckResult.isAdmin };
  }

  // If there's already a pending auth check, wait for it
  if (authCheckPromise) {
    return authCheckPromise;
  }

  // Create new auth check promise
  authCheckPromise = (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const result = { user: null, isAdmin: false };
        authCheckResult = { ...result, timestamp: Date.now() };
        return result;
      }

      // Check admin role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      const isAdmin = !!roleData;
      const result = { user, isAdmin };
      authCheckResult = { ...result, timestamp: Date.now() };
      return result;
    } finally {
      // Clear the promise after completion
      authCheckPromise = null;
    }
  })();

  return authCheckPromise;
}

export function clearAuthCache() {
  authCheckResult = null;
  authCheckPromise = null;
}
