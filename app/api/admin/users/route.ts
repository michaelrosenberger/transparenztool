import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.user_metadata?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
    }));

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
