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

  // 1. Look up class + verify enrollment via service-role API (bypasses RLS).
  const res = await fetch(`/api/class/${encodeURIComponent(classCode.toUpperCase())}`);
  const data = await res.json();
  if (!data) return { user: null, error: "Class not found." };

  const classId = String(data.cls.id);
  const student = (data.students as { id: string; name: string; animal_id: string }[]).find(
    (s) => s.id === studentId
  );
  if (!student) return { user: null, error: "Explorer not found in this class." };

  // 2. Create an anonymous Supabase auth session.
  const { error: anonError } = await supabase.auth.signInAnonymously();
  if (anonError) return { user: null, error: anonError.message };

  // 3. Attach student + class to the JWT so RLS policies can scope access.
  await supabase.auth.updateUser({
    data: { student_id: studentId, class_id: classId },
  });

  // 4. Refresh the session so the new user_metadata is in the JWT immediately.
  //    Without this, bb_my_class_id() returns null and RLS blocks all student reads.
  await supabase.auth.refreshSession();

  return {
    user: {
      id: student.id,
      name: student.name,
      email: "",
      role: "student",
      classIds: [classId],
      avatarUrl: "",
      createdAt: "",
      animalId: student.animal_id,
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

  const publicId = String(meta.bb_id);

  const classIds =
    meta.bb_role === "teacher"
      ? await teacherClassIds(publicId)
      : [];

  // Always read school_id from the DB so it stays accurate even if JWT metadata is stale.
  const { data: dbRow } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", publicId)
    .single();

  const schoolId = dbRow?.school_id ? String(dbRow.school_id) : undefined;

  return {
    ...userFromMeta(meta, user.email ?? "", user.created_at, classIds),
    schoolId,
  };
}
