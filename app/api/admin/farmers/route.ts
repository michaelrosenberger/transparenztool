import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Use server client to get authenticated user from cookies
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin using user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Create a Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all users
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter for farmers with vegetables and valid address coordinates
    const farmers = (users || [])
      .filter((user) => {
        const metadata = user.user_metadata;
        return (
          metadata?.occupation === "Produzenten" &&
          metadata?.vegetables &&
          Array.isArray(metadata.vegetables) &&
          metadata.vegetables.length > 0 &&
          metadata?.address_coordinates?.lat &&
          metadata?.address_coordinates?.lng
        );
      })
      .map((user) => {
        const metadata = user.user_metadata;
        const coords = metadata.address_coordinates;
        const address = [metadata.street, metadata.zip_code, metadata.city]
          .filter(Boolean)
          .join(", ");
        
        return {
          id: user.id,
          full_name: metadata.business_name || metadata.full_name || "Unbekannter Produzent",
          vegetables: metadata.vegetables,
          address: address,
          lat: coords.lat,
          lng: coords.lng,
        };
      });

    return NextResponse.json({ farmers });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
