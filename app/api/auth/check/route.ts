import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ user: null, isAdmin: false });
    }

    // All authenticated users have admin access
    return NextResponse.json({ user, isAdmin: true });
  } catch (error: any) {
    console.error("Error in auth check:", error);
    return NextResponse.json({ 
      user: null, 
      isAdmin: false,
      error: error.message 
    }, { status: 500 });
  }
}
