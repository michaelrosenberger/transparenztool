import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { clearAuthCache } from "../check/route";

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Get user before signing out
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // Sign out from Supabase - this handles cookie clearing
    await supabase.auth.signOut();
    
    // Clear the auth cache for this user
    if (userId) {
      clearAuthCache(userId);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error during logout:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
