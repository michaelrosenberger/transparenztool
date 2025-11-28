import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ user: null, isAdmin: false });
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
