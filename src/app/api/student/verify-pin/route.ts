import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

/*
 * Verifies a student's 4-digit PIN before the client creates their session.
 * Runs with the service role so PINs never appear in any client-readable
 * response — the class roster API deliberately excludes them.
 */
export async function POST(req: NextRequest) {
  const { classCode, studentId, pin } = await req.json().catch(() => ({}));
  if (!classCode || !studentId || !pin) {
    return NextResponse.json({ ok: false, error: "Missing details" }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();

  const { data: cls } = await supabase
    .from("classes")
    .select("id")
    .eq("class_code", String(classCode).toUpperCase())
    .maybeSingle();
  if (!cls) return NextResponse.json({ ok: false, error: "Class not found" }, { status: 404 });

  const { data: enrollment } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", cls.id)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!enrollment) {
    return NextResponse.json({ ok: false, error: "Not in this class" }, { status: 403 });
  }

  const { data: student } = await supabase
    .from("users")
    .select("pin")
    .eq("id", studentId)
    .eq("role", "student")
    .maybeSingle();

  if (!student || !student.pin || student.pin !== String(pin).trim()) {
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
