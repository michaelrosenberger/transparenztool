import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const { data: menu, error } = await supabase
      .from("meal_menus")
      .select(`
        *,
        meals:meals(*)
      `)
      .eq('id', params.id)
      .single();

    if (error || !menu) {
      console.error("Error fetching menu:", error);
      return NextResponse.json({ menu: null }, { status: 404 });
    }

    return NextResponse.json({ menu });
  } catch (error) {
    console.error("Error in menu API:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
}
