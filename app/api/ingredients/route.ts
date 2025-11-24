import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all ingredients
    const { data: ingredients, error } = await supabase
      .from("ingredients")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching ingredients:", error);
      return NextResponse.json(
        { error: "Failed to fetch ingredients" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ingredients: ingredients || [] });
  } catch (error) {
    console.error("Error in ingredients API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
