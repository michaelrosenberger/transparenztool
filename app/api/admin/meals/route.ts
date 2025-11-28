import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";

// Cache for meals list to prevent concurrent duplicate requests
let mealsCache: { data: any; timestamp: number } | null = null;
let mealsFetchPromise: Promise<any> | null = null;
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
      mealsCache = null;
      mealsFetchPromise = null;
    }
    
    // Check cache AFTER auth
    if (mealsCache && Date.now() - mealsCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ meals: mealsCache.data });
    }

    // If there's already a pending fetch, wait for it
    if (mealsFetchPromise) {
      const meals = await mealsFetchPromise;
      return NextResponse.json({ meals });
    }

    // Create new fetch promise
    mealsFetchPromise = (async () => {
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading meals:", error);
        mealsFetchPromise = null;
        throw error;
      }

      // Cache the result
      mealsCache = { data: data || [], timestamp: Date.now() };
      mealsFetchPromise = null;
      return data || [];
    })();

    const meals = await mealsFetchPromise;
    return NextResponse.json({ meals });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch meals" }, { status: 500 });
  }
}
