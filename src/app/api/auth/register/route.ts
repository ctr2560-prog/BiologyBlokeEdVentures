import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, schoolName, schoolLocation } = await req.json();

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
    const cleanSchoolName = schoolName?.trim() ?? "";
    const cleanSchoolLocation = schoolLocation?.trim() ?? "";

    // 1. Look up or create the school record.
    let schoolId: string | null = null;
    if (cleanSchoolName) {
      const { data: existing } = await supabase
        .from("schools")
        .select("id")
        .ilike("name", cleanSchoolName)
        .maybeSingle();

      if (existing) {
        schoolId = existing.id;
      } else {
        schoolId = randomUUID();
        await supabase.from("schools").insert({
          id: schoolId,
          name: cleanSchoolName,
          location: cleanSchoolLocation,
          active: true,
          subscription_status: "trial",
          last_active: new Date().toISOString().slice(0, 10),
        });
      }
    }

    // 2. Create the public.users record.
    const { error: userError } = await supabase.from("users").insert({
      id: publicUserId,
      name: cleanName,
      email: cleanEmail,
      role: "teacher",
      school_id: schoolId,
      avatar_url: "",
    });

    if (userError) {
      if (userError.code === "23505") {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      throw userError;
    }

    // 3. Create the Supabase auth user.
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        bb_id: publicUserId,
        bb_role: "teacher",
        bb_name: cleanName,
        bb_school_id: schoolId,
        bb_school_name: cleanSchoolName,
      },
      app_metadata: {
        bb_role: "teacher",
        bb_user_id: publicUserId,
        bb_school_id: schoolId,
        bb_school_name: cleanSchoolName,
      },
    });

    if (authError) {
      await supabase.from("users").delete().eq("id", publicUserId);
      if (authError.message.toLowerCase().includes("already registered")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      throw authError;
    }

    // 4. Link auth_id back to the public record.
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
