import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Public endpoint - no auth required
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq("is_today", true)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error fetching today meal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ meal: data || null });
  } catch (error: any) {
    console.error("Error fetching today meal:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch today meal" 
    }, { status: 500 });
  }
}
