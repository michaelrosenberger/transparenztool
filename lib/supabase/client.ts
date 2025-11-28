import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton instance to prevent multiple client creations
let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables!");
    console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
    console.error("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Set" : "Missing");
    throw new Error(
      "Supabase environment variables are not configured. Please check your .env.local file."
    );
  }

  // Create and cache the instance
  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Reset the singleton instance (useful for logout)
export function resetClient() {
  supabaseInstance = null;
}
