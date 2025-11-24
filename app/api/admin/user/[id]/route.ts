import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15
    const { id } = await params;

    // Use server client to get authenticated user from cookies
    const supabase = await createServerClient();
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !requestingUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get the requested user
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);

    if (error) {
      console.error("Error fetching user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data.user });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
