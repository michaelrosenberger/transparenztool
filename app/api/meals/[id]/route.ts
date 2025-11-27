import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Public endpoint - no auth required
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const mealId = params.id;
    
    // Get meal
    const { data: mealData, error: mealError } = await supabase
      .from("meals")
      .select("*")
      .eq("id", mealId)
      .single();
    
    if (mealError) {
      console.error("Error fetching meal:", mealError);
      return NextResponse.json({ error: mealError.message }, { status: 500 });
    }

    if (!mealData) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    return NextResponse.json({ meal: mealData });
  } catch (error: any) {
    console.error("Error fetching meal:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch meal" 
    }, { status: 500 });
  }
}
