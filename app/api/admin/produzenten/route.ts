import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/auth/roles";

export async function POST(request: Request) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All authenticated users have access

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

    const body = await request.json();
    const {
      email,
      password,
      full_name,
      business_name,
      business_subtext,
      business_description,
      street,
      zip_code,
      city,
      vegetables,
      business_images,
      featured_image_index,
      address_coordinates,
    } = body;

    // Validate required fields
    if (!full_name || !business_name || !street || !zip_code || !city || !vegetables || vegetables.length === 0) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 });
    }

    // Use "-" for email if not provided, generate random password if not provided
    const userEmail = email && email.trim() !== "" && email !== "-" ? email : "-";
    const userPassword = password && password.trim() !== "" ? password : Math.random().toString(36).slice(-12) + "A1!";

    // Create new user with Produzenten occupation
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password: userPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
        occupation: "Produzenten",
        business_name,
        business_subtext: business_subtext || "",
        business_description: business_description || "",
        street,
        zip_code,
        city,
        vegetables,
        business_images: business_images || [],
        featured_image_index: featured_image_index || 0,
        address_coordinates,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Add default 'user' role to user_roles table
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({ 
        user_id: newUser.user.id, 
        role: 'user',
        created_by: user.id 
      });

    if (roleError) {
      console.error("Error adding user role:", roleError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ 
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        full_name,
        business_name,
      }
    });
  } catch (error: any) {
    console.error("Error in POST /api/admin/produzenten:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to create producent" 
    }, { status: 500 });
  }
}
