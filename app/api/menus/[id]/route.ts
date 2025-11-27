import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Public endpoint - no auth required
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const menuId = params.id;
    
    // Get menu
    const { data: menuData, error: menuError } = await supabase
      .from("meal_menus")
      .select("*")
      .eq("id", menuId)
      .single();
    
    if (menuError) {
      console.error("Error fetching menu:", menuError);
      return NextResponse.json({ error: menuError.message }, { status: 500 });
    }

    if (!menuData) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    // Get meals for this menu
    let meals = [];
    if (menuData.meal_ids && menuData.meal_ids.length > 0) {
      const { data: mealsData, error: mealsError } = await supabase
        .from("meals")
        .select("id, name, description, vegetables")
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
    console.error("Error fetching menu:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch menu" 
    }, { status: 500 });
  }
}
