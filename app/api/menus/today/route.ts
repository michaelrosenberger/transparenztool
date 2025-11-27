import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Public endpoint - no auth required
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get today's menu
    const { data: menuData, error: menuError } = await supabase
      .from("meal_menus")
      .select("*")
      .eq("is_today", true)
      .maybeSingle();
    
    if (menuError && menuError.code !== 'PGRST116') {
      console.error("Error fetching today menu:", menuError);
      return NextResponse.json({ error: menuError.message }, { status: 500 });
    }

    if (!menuData) {
      return NextResponse.json({ menu: null, meals: [] });
    }

    // Get meals for this menu
    let meals = [];
    if (menuData.meal_ids && menuData.meal_ids.length > 0) {
      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select("*")
        .in("id", menuData.meal_ids);

      if (mealsError) {
        console.error("Error fetching meals:", mealsError);
      } else if (mealsData) {
        // Sort meals by the order in meal_ids
        meals = menuData.meal_ids
          .map((id: string) => mealsData.find((meal: any) => meal.id === id))
          .filter((meal: any) => meal !== undefined);
      }
    }

    return NextResponse.json({ menu: menuData, meals });
  } catch (error: any) {
    console.error("Error fetching today menu:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch today menu" 
    }, { status: 500 });
  }
}
