import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Cache for auth checks - per user ID to avoid conflicts
const authCache = new Map<string, { user: any; isAdmin: boolean; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ user: null, isAdmin: false });
    }

    // Check if refresh is requested via query parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Check cache for this specific user (skip if refresh requested)
    if (!forceRefresh) {
      const cached = authCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return NextResponse.json({ 
          user: cached.user, 
          isAdmin: cached.isAdmin 
        });
      }
    }

    // Check admin role from user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError) {
      console.error("Error checking admin role:", roleError);
    }

    const isAdmin = !!roleData;
    
    // Cache the result for this specific user
    authCache.set(user.id, { user, isAdmin, timestamp: Date.now() });
    
    return NextResponse.json({ user, isAdmin });
  } catch (error: any) {
    console.error("Error in auth check:", error);
    return NextResponse.json({ 
      user: null, 
      isAdmin: false,
      error: error.message 
    }, { status: 500 });
  }
}
