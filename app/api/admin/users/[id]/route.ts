import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin, setAdminRole } from "@/lib/auth/roles";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const userId = id;

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

    // Get user by ID
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError) {
      return NextResponse.json({ error: getUserError.message }, { status: 500 });
    }

    if (!userData.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user role from database
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = roleData?.map(r => r.role) || [];
    const is_admin = roles.includes('admin');

    // Map to simplified format
    const u = userData.user;
    const user_response = {
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
      is_admin,
      roles,
      // Business profile fields for Produzenten
      business_name: u.user_metadata?.business_name,
      business_subtext: u.user_metadata?.business_subtext,
      business_description: u.user_metadata?.business_description,
      business_images: u.user_metadata?.business_images || [],
      featured_image_index: u.user_metadata?.featured_image_index || 0,
    };

    return NextResponse.json({ user: user_response });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user || !user.user_metadata?.is_admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const userId = id;

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

    // Handle admin role separately if provided
    if (body.is_admin !== undefined) {
      const roleResult = await setAdminRole(userId, body.is_admin);
      if (!roleResult.success) {
        return NextResponse.json({ error: roleResult.error }, { status: 500 });
      }
      delete body.is_admin; // Remove from metadata update
    }

    // Get current user to merge metadata
    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError) {
      return NextResponse.json({ error: getUserError.message }, { status: 500 });
    }

    // Merge existing metadata with new data
    const mergedMetadata = {
      ...currentUser.user.user_metadata,
      ...body.user_metadata,
    };

    // Update user metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: mergedMetadata
      }
    );
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data.user });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const userId = id;

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

    // First, check if the user to be deleted is an admin
    const targetUserIsAdmin = await isAdmin(userId);
    
    if (targetUserIsAdmin) {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    }

    // Delete the user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
