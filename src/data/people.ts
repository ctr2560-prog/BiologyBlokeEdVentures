/*
 * People and organisation data. Mock arrays are emptied - all real data lives in Supabase.
 * DEMO_*_ID constants are kept as empty strings so existing imports don't break.
 */
import type { School, User, ClassGroup, Assignment } from "@/types";

export const schools: School[] = [];
export const users: User[] = [];
export const classes: ClassGroup[] = [];
export const assignments: Assignment[] = [];

export const DEMO_STUDENT_ID = "";
export const DEMO_TEACHER_ID = "";
export const DEMO_ADMIN_ID = "";
