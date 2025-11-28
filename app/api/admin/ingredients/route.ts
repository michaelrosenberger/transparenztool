import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";

// Cache for ingredients list to prevent concurrent duplicate requests
let ingredientsCache: { data: any; timestamp: number } | null = null;
let ingredientsFetchPromise: Promise<any> | null = null;
const CACHE_DURATION = 60000; // 60 seconds

export async function GET(request: Request) {
  try {
    // Auth check FIRST - do this once
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All authenticated users have access
    
    // Check if force refresh is requested
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (forceRefresh) {
      ingredientsCache = null;
      ingredientsFetchPromise = null;
    }
    
    // Check cache AFTER auth
    if (ingredientsCache && Date.now() - ingredientsCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ ingredients: ingredientsCache.data });
    }

    // If there's already a pending fetch, wait for it
    if (ingredientsFetchPromise) {
      const ingredients = await ingredientsFetchPromise;
      return NextResponse.json({ ingredients });
    }

    // Create new fetch promise
    ingredientsFetchPromise = (async () => {
      const { data, error } = await supabase
        .from("ingredients")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error loading ingredients:", error);
        ingredientsFetchPromise = null;
        throw error;
      }

      // Cache the result
      ingredientsCache = { data: data || [], timestamp: Date.now() };
      ingredientsFetchPromise = null;
      return data || [];
    })();

    const ingredients = await ingredientsFetchPromise;
    return NextResponse.json({ ingredients });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ingredients" }, { status: 500 });
  }
}
