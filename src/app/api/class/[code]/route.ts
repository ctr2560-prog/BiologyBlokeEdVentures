import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const supabase = await createSupabaseServiceClient();

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name, class_code, year_group")
    .eq("class_code", code.toUpperCase())
    .maybeSingle();

  if (!cls) return NextResponse.json(null);

  const { data: enrollment } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", cls.id);

  const studentIds = (enrollment ?? []).map((r) => r.student_id as string);

  const { data: students } = studentIds.length
    ? await supabase
        .from("users")
        .select("id, name, animal_id")
        .in("id", studentIds)
        .eq("role", "student")
    : { data: [] };

  return NextResponse.json({ cls, students: students ?? [] });
}
