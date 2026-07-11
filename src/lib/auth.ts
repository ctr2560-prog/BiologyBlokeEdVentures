"use client";

import { getSupabaseClient } from "./supabase/client";
import type { User } from "@/types";

// ---- Internal helpers ----

function userFromMeta(
  meta: Record<string, unknown>,
  email: string,
  createdAt: string,
  classIds: string[] = []
): User {
  return {
    id: String(meta.bb_id ?? ""),
    name: String(meta.bb_name ?? ""),
    email,
    role: (meta.bb_role as User["role"]) ?? "teacher",
    schoolId: meta.bb_school_id ? String(meta.bb_school_id) : undefined,
    classIds,
    avatarUrl: "",
    createdAt,
    animalId: undefined,
  };
}

async function teacherClassIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", userId);
  return (data ?? []).map((c: Record<string, unknown>) => String(c.id));
}

// ---- Teacher / Admin sign-in ----
//
// Profile is read from user_metadata in the JWT (set server-side by
// set-jwt-metadata.ts). This avoids querying public.users from the client,
// which previously triggered infinite RLS recursion.

export async function signInTeacher(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  if (!meta.bb_id) {
    return { user: null, error: "Account not linked to the platform." };
  }

  const classIds =
    meta.bb_role === "teacher"
      ? await teacherClassIds(String(meta.bb_id))
      : [];

  return {
    user: userFromMeta(meta, data.user.email ?? email, data.user.created_at, classIds),
    error: null,
  };
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

  const r = row as Record<string, unknown>;
  return {
    user: {
      id: String(r.id),
      name: String(r.name),
      email: "",
      role: "student",
      schoolId: r.school_id ? String(r.school_id) : undefined,
      classIds: [String(cls.id)],
      avatarUrl: String(r.avatar_url ?? ""),
      createdAt: String(r.created_at),
      animalId: r.animal_id ? String(r.animal_id) : undefined,
    },
    error: null,
  };
}

// ---- Sign out ----

export async function signOut(): Promise<void> {
  await getSupabaseClient().auth.signOut();
}

// ---- Restore session on page load ----
//
// For teachers/admins: profile comes from JWT user_metadata (no DB query).
// For students: profile comes from public.users (scoped by student_id policy).

export async function getCurrentDbUser(): Promise<User | null> {
  const supabase = getSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Students: identified by JWT user_metadata (anonymous session)
  const studentId = user.user_metadata?.student_id as string | undefined;
  if (studentId) {
    const classId = user.user_metadata?.class_id as string | undefined;
    const { data: row } = await supabase
      .from("users")
      .select("*")
      .eq("id", studentId)
      .single();
    if (!row) return null;
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id),
      name: String(r.name),
      email: "",
      role: "student",
      schoolId: r.school_id ? String(r.school_id) : undefined,
      classIds: classId ? [classId] : [],
      avatarUrl: String(r.avatar_url ?? ""),
      createdAt: String(r.created_at),
      animalId: r.animal_id ? String(r.animal_id) : undefined,
    };
  }

  // Teachers / admins: profile stored in user_metadata (set by set-jwt-metadata.ts)
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (!meta.bb_id) return null;

  const classIds =
    meta.bb_role === "teacher"
      ? await teacherClassIds(String(meta.bb_id))
      : [];

  return userFromMeta(meta, user.email ?? "", user.created_at, classIds);
}
