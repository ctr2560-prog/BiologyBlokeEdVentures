import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServiceClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { animals } from "@/data/animals";

function newId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function generateClassCode(name: string): string {
  const base = name.replace(/[^A-Za-z]/g, "").slice(0, 5).toUpperCase() || "CLASS";
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base}-${suffix}`;
}

export async function POST(req: NextRequest) {
  // Validate the caller is a signed-in teacher.
  const userClient = await createSupabaseServerClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const meta = user.user_metadata as Record<string, unknown>;
  if (meta.bb_role !== "teacher" && meta.bb_role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, yearGroup, teacherId, schoolId, size } = await req.json();
  if (!name?.trim() || !teacherId) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const supabase = await createSupabaseServiceClient();
  const classId = newId("class");
  const classCode = generateClassCode(name);

  const { error: classError } = await supabase.from("classes").insert({
    id: classId,
    name: name.trim(),
    year_group: yearGroup,
    teacher_id: teacherId,
    school_id: schoolId || null,
    class_code: classCode,
  });

  if (classError) {
    return NextResponse.json({ error: classError.message }, { status: 500 });
  }

  // Create student aliases if a size was requested.
  const studentCount = Math.max(0, Math.min(42, Number(size) || 0));
  if (studentCount > 0) {
    const picked = animals
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, studentCount);

    const studentRows = picked.map((animal) => ({
      id: newId("stu"),
      name: animal.name,
      animal_id: animal.id,
      email: "",
      role: "student",
      school_id: schoolId || null,
      created_at: new Date().toISOString().slice(0, 10),
      avatar_url: "",
    }));

    const { data: created, error: stuError } = await supabase
      .from("users")
      .insert(studentRows)
      .select("id");

    if (stuError) {
      return NextResponse.json({ error: stuError.message }, { status: 500 });
    }

    const studentIds = (created ?? []).map((r) => String(r.id));
    if (studentIds.length > 0) {
      await supabase
        .from("class_students")
        .insert(studentIds.map((sid) => ({ class_id: classId, student_id: sid })));
    }
  }

  // Fetch the full class record to return.
  const { data: cls } = await supabase
    .from("classes")
    .select("*, class_students(student_id), assignment_topics(topic_id)")
    .eq("id", classId)
    .single();

  return NextResponse.json({ cls });
}
