import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { isAdmin } from "@/lib/auth/roles";

export async function PATCH(request: Request) {
  const supabase = await createClient();

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // All authenticated users have access

  try {
    const body = await request.json();
    const { default_storage_name, default_storage_address } = body;

    if (!default_storage_name || !default_storage_address) {
      return NextResponse.json({ 
        error: "Bitte füllen Sie beide Felder aus" 
      }, { status: 400 });
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

    // Get current user to merge metadata
    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (getUserError) {
      return NextResponse.json({ error: getUserError.message }, { status: 500 });
    }

    // Merge existing metadata with new storage settings
    const mergedMetadata = {
      ...currentUser.user.user_metadata,
      default_storage_name: default_storage_name.trim(),
      default_storage_address: default_storage_address.trim(),
    };

    // Update user metadata
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: mergedMetadata
      }
    );
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      user: data.user 
    });
  } catch (error: any) {
    console.error("Error updating storage settings:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to update storage settings" 
    }, { status: 500 });
  }
}
