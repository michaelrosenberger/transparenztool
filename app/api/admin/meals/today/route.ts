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

  const userIsAdmin = await isAdmin(user.id);
  if (!userIsAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { meal_id } = body;

    if (!meal_id) {
      return NextResponse.json({ 
        error: "Meal ID is required" 
      }, { status: 400 });
    }

    // First, unset all meals as today
    const { error: unsetError } = await supabase
      .from("meals")
      .update({ is_today: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    if (unsetError) {
      console.error("Error unsetting today meals:", unsetError);
      return NextResponse.json({ error: unsetError.message }, { status: 500 });
    }

    // Then set the selected meal as today
    const { data, error } = await supabase
      .from("meals")
      .update({ is_today: true })
      .eq('id', meal_id)
      .select()
      .single();
    
    if (error) {
      console.error("Error setting today meal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      meal: data 
    });
  } catch (error: any) {
    console.error("Error updating today meal:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to update today meal" 
    }, { status: 500 });
  }
}

// Get the current today meal
export async function GET() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .eq('is_today', true)
      .single();
    
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
