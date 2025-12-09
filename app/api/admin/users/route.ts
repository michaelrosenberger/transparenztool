import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/auth/roles";

// Disable Next.js caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Cache for user list to prevent concurrent duplicate requests
let usersCache: { data: any; timestamp: number } | null = null;
let usersFetchPromise: Promise<any> | null = null;
const CACHE_DURATION = 60000; // 60 seconds - increased to handle multiple tab opens

// Export function to invalidate cache
export function invalidateUsersCache() {
  usersCache = null;
  usersFetchPromise = null;
}

export async function GET(request: Request) {
  try {
    // Check if refresh is requested via URL parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.has('refresh');

    // If force refresh is requested, invalidate cache immediately
    if (forceRefresh) {
      usersCache = null;
      usersFetchPromise = null;
    }

    // Check cache FIRST before doing any auth checks (unless force refresh is requested)
    // This prevents unnecessary database queries when data is already cached
    if (!forceRefresh && usersCache && Date.now() - usersCache.timestamp < CACHE_DURATION) {
      // Still need to verify user is authenticated for cached data
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // All authenticated users have access
      return NextResponse.json({ users: usersCache.data }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // Auth check for non-cached requests
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // All authenticated users have access

    // If there's already a pending fetch, wait for it
    if (usersFetchPromise) {
      const users = await usersFetchPromise;
      return NextResponse.json({ users }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json({ 
        error: "Server configuration error: Service role key not configured" 
      }, { status: 500 });
    }

    // Create new fetch promise
    usersFetchPromise = (async () => {
      // Create admin client with service role key
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Get all users from auth
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  
      if (error) {
        console.error("Error listing users:", error);
        usersFetchPromise = null;
        throw error;
      }

      // Get user roles from database
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const userRolesMap = new Map<string, string[]>();
      rolesData?.forEach(r => {
        if (!userRolesMap.has(r.user_id)) {
          userRolesMap.set(r.user_id, []);
        }
        userRolesMap.get(r.user_id)!.push(r.role);
      });

      // Map to simplified format
      const users = data.users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name,
        occupation: u.user_metadata?.occupation,
        last_sign_in_at: u.last_sign_in_at,
        created_at: u.created_at,
        street: u.user_metadata?.street,
        zip_code: u.user_metadata?.zip_code,
        city: u.user_metadata?.city,
        profile_image: u.user_metadata?.profile_image,
        vegetables: u.user_metadata?.vegetables || [],
        address_coordinates: u.user_metadata?.address_coordinates,
        is_admin: userRolesMap.get(u.id)?.includes('admin') || false,
        roles: userRolesMap.get(u.id) || [],
        // Business profile fields for Produzenten
        business_name: u.user_metadata?.business_name,
        business_subtext: u.user_metadata?.business_subtext,
        business_description: u.user_metadata?.business_description,
        business_images: u.user_metadata?.business_images || [],
        featured_image_index: u.user_metadata?.featured_image_index || 0,
      }));

      // Cache the result
      usersCache = { data: users, timestamp: Date.now() };
      usersFetchPromise = null;
      return users;
    })();

    const users = await usersFetchPromise;
    return NextResponse.json({ users }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      }
    });
  }
}
