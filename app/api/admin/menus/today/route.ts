import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";

export async function PATCH(request: Request) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All authenticated users have access

  try {
    const body = await request.json();
    const { menu_id } = body;

    if (!menu_id) {
      return NextResponse.json({ 
        error: "Menu ID is required" 
      }, { status: 400 });
    }

    // First, unset all menus as today
    const { error: unsetError } = await supabase
      .from("meal_menus")
      .update({ is_today: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    if (unsetError) {
      console.error("Error unsetting today menus:", unsetError);
      return NextResponse.json({ error: unsetError.message }, { status: 500 });
    }

    // Then set the selected menu as today
    const { data, error } = await supabase
      .from("meal_menus")
      .update({ is_today: true })
      .eq('id', menu_id)
      .select()
      .single();
    
    if (error) {
      console.error("Error setting today menu:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      menu: data 
    });
  } catch (error: any) {
    console.error("Error updating today menu:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to update today menu" 
    }, { status: 500 });
  }
}

// Get the current today menu
export async function GET() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("meal_menus")
      .select("*")
      .eq('is_today', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error("Error fetching today menu:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ menu: data || null });
  } catch (error: any) {
    console.error("Error fetching today menu:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch today menu" 
    }, { status: 500 });
  }
}
