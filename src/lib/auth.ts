"use client";

import { getSupabaseClient } from "./supabase/client";
import type { User } from "@/types";

// ---- Helpers ----

function mapUser(row: Record<string, unknown>, classIds: string[] = []): User {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email ?? ""),
    role: row.role as User["role"],
    schoolId: row.school_id ? String(row.school_id) : undefined,
    classIds,
    avatarUrl: String(row.avatar_url ?? ""),
    createdAt: String(row.created_at),
    animalId: row.animal_id ? String(row.animal_id) : undefined,
  };
}

// ---- Teacher / Admin sign-in ----

export async function signInTeacher(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };

  // Fetch their row in public.users (linked via auth_id).
  const { data: row } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", data.user.id)
    .single();

  if (!row) return { user: null, error: "Account not found in the platform." };

  // Derive classIds for teachers (classes where teacher_id = their public id).
  let classIds: string[] = [];
  if (row.role === "teacher") {
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", String(row.id));
    classIds = (classes ?? []).map((c: Record<string, unknown>) => String(c.id));
  }

  return { user: mapUser(row, classIds), error: null };
}

// ---- Student two-tap sign-in (anonymous session + JWT metadata) ----

export async function signInStudent(
  classCode: string,
  studentId: string
): Promise<{ user: User | null; error: string | null }> {
  const supabase = getSupabaseClient();

  // 1. Look up class by code.
  const { data: cls } = await supabase
    .from("classes")
    .select("id")
    .eq("class_code", classCode.toUpperCase())
    .single();

  if (!cls) return { user: null, error: "Class not found." };

  // 2. Verify the student is enrolled in this class.
  const { data: enrollment } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", String(cls.id))
    .eq("student_id", studentId)
    .single();

  if (!enrollment) return { user: null, error: "Explorer not found in this class." };

  // 3. Create an anonymous Supabase auth session.
  const { error: anonError } = await supabase.auth.signInAnonymously();
  if (anonError) return { user: null, error: anonError.message };

  // 4. Attach student + class to the JWT metadata so RLS can scope access.
  await supabase.auth.updateUser({
    data: { student_id: studentId, class_id: String(cls.id) },
  });

  // 5. Fetch and return the student's public user record.
  const { data: row } = await supabase
    .from("users")
    .select("*")
    .eq("id", studentId)
    .single();

  if (!row) return { user: null, error: "Student record not found." };

  return { user: mapUser(row, [String(cls.id)]), error: null };
}

// ---- Sign out ----

export async function signOut(): Promise<void> {
  await getSupabaseClient().auth.signOut();
}

// ---- Get currently authenticated DB user ----

export async function getCurrentDbUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Students have no email — identify them by JWT metadata.
  const studentId = user.user_metadata?.student_id as string | undefined;
  if (studentId) {
    const classId = user.user_metadata?.class_id as string | undefined;
    const { data: row } = await supabase
      .from("users")
      .select("*")
      .eq("id", studentId)
      .single();
    return row ? mapUser(row, classId ? [classId] : []) : null;
  }

  // Teachers / admins are linked by their Supabase auth UUID.
  const { data: row } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();
  if (!row) return null;

  let classIds: string[] = [];
  if (row.role === "teacher") {
    const { data: classes } = await supabase
      .from("classes")
      .select("id")
      .eq("teacher_id", String(row.id));
    classIds = (classes ?? []).map((c: Record<string, unknown>) => String(c.id));
  }

  return mapUser(row, classIds);
}
