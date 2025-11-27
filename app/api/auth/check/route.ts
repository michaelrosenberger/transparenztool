import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Cache for auth checks
let authCache: { user: any; isAdmin: boolean; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export async function GET() {
  try {
    // Return cached result if still valid
    if (authCache && Date.now() - authCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ 
        user: authCache.user, 
        isAdmin: authCache.isAdmin 
      });
    }

    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      const result = { user: null, isAdmin: false };
      authCache = { ...result, timestamp: Date.now() };
      return NextResponse.json(result);
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
    const result = { user, isAdmin };
    authCache = { ...result, timestamp: Date.now() };
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in auth check:", error);
    return NextResponse.json({ 
      user: null, 
      isAdmin: false,
      error: error.message 
    }, { status: 500 });
  }
}
