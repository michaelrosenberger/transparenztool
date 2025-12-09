import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth/roles";

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache for menus list to prevent concurrent duplicate requests
let menusCache: { data: any; timestamp: number } | null = null;
let menusFetchPromise: Promise<any> | null = null;
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
      menusCache = null;
      menusFetchPromise = null;
    }
    
    // Check cache AFTER auth
    if (menusCache && Date.now() - menusCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({ menus: menusCache.data }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // If there's already a pending fetch, wait for it
    if (menusFetchPromise) {
      const menus = await menusFetchPromise;
      return NextResponse.json({ menus }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // Create new fetch promise
    menusFetchPromise = (async () => {
      const { data, error } = await supabase
        .from("meal_menus")
        .select("*")
        .order("menu_date", { ascending: false });

      if (error) {
        console.error("Error loading menus:", error);
        menusFetchPromise = null;
        throw error;
      }

      // Cache the result
      menusCache = { data: data || [], timestamp: Date.now() };
      menusFetchPromise = null;
      return data || [];
    })();

    const menus = await menusFetchPromise;
    return NextResponse.json({ menus }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menus" }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  }
}
