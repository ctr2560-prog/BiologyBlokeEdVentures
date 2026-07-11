import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const supabase = await createSupabaseServiceClient();
    const publicUserId = randomUUID();
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // 1. Create the public.users record first (auth_id added after auth user created).
    const { error: userError } = await supabase.from("users").insert({
      id: publicUserId,
      name: cleanName,
      email: cleanEmail,
      role: "teacher",
      school_id: null,
      avatar_url: "",
    });

    if (userError) {
      if (userError.code === "23505") {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      throw userError;
    }

    // 2. Create the Supabase auth user with metadata so sign-in works immediately.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        bb_id: publicUserId,
        bb_role: "teacher",
        bb_name: cleanName,
        bb_school_id: null,
      },
      app_metadata: {
        bb_role: "teacher",
        bb_user_id: publicUserId,
        bb_school_id: null,
      },
    });

    if (authError) {
      await supabase.from("users").delete().eq("id", publicUserId);
      if (authError.message.toLowerCase().includes("already registered")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      throw authError;
    }

    // 3. Link auth_id back to the public record.
    await supabase.from("users").update({ auth_id: authData.user.id }).eq("id", publicUserId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Teacher registration error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
