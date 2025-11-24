import { createClient } from "@/lib/supabase/server";
import { createClient as createClientClient } from "@/lib/supabase/client";

/**
 * Check if a user has admin role (server-side)
 */
export async function isAdmin(userId?: string): Promise<boolean> {
  const supabase = await createClient();
  
  // If no userId provided, check current user
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
  return !!data;
}

/**
 * Check if a user has admin role (client-side)
 */
export async function isAdminClient(userId?: string): Promise<boolean> {
  const supabase = createClientClient();
  
  // If no userId provided, check current user
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
  return !!data;
}

/**
 * Get all roles for a user (server-side)
 */
export async function getUserRoles(userId?: string): Promise<string[]> {
  const supabase = await createClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map(r => r.role);
}

/**
 * Get all roles for a user (client-side)
 */
export async function getUserRolesClient(userId?: string): Promise<string[]> {
  const supabase = createClientClient();
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map(r => r.role);
}

/**
 * Set admin role for a user (requires admin privileges)
 */
export async function setAdminRole(userId: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  if (isAdmin) {
    // Add admin role
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' })
      .select()
      .single();

    if (error) {
      // Check if it's a duplicate key error (user already has admin role)
      if (error.code === '23505') {
        return { success: true }; // Already admin, that's fine
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  } else {
    // Remove admin role
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  }
}
