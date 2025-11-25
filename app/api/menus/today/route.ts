import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("meal_menus")
      .select(`
        *,
        meals:meals(*)
      `)
      .eq('is_today', true)
      .single();

    if (error) {
      console.error("Error fetching today menu:", error);
      // Return empty response instead of error for public access
      return NextResponse.json({ menu: null });
    }

    return NextResponse.json({ menu: data });
  } catch (error) {
    console.error("Error in today menu API:", error);
    return NextResponse.json({ menu: null });
  }
}
