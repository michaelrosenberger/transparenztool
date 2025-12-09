import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    return NextResponse.json({ meal: data || null }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error("Error fetching today meal:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch today meal" 
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  }
}
