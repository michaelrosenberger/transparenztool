import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/auth/roles";

export async function GET() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIsAdmin = await isAdmin(user.id);
  if (!userIsAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json({ 
        error: "Server configuration error: Service role key not configured" 
      }, { status: 500 });
    }

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
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
