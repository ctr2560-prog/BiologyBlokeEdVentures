"use client";
/*
 * App-wide client store.
 *
 * Supports two auth modes in parallel:
 *  - Demo mode: loginAs(role) / loginAsUser(id) — reads from the in-memory mock
 *  - Real mode: signIn(email, password) — Supabase Auth + public.users
 *
 * On mount we check for an existing Supabase session so page refreshes keep
 * the real user logged in. The `authReady` flag lets AppShell wait before
 * falling back to the demo user, avoiding a flash of the wrong account.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Role, User } from "@/types";
import { getUser } from "./dataService";
import {
  getCurrentDbUser,
  signInTeacher,
  signInStudent as signInStudentAuth,
  signOut as signOutSupabase,
} from "./auth";
import { getSupabaseClient } from "./supabase/client";
import { DEMO_ADMIN_ID, DEMO_TEACHER_ID, DEMO_STUDENT_ID } from "@/data/people";

interface AppState {
  currentUser: User | null;
  role: Role | null;
  version: number;
  /** True once the initial Supabase session check has completed. */
  authReady: boolean;
  /** Demo-mode: sets a mock user without touching Supabase. */
  loginAs: (role: Role) => void;
  /** Demo-mode: login by specific user id (student alias tap). */
  loginAsUser: (userId: string) => void;
  /** Real login: Supabase email + password. Returns error string or null, and the authenticated role. */
  signIn: (email: string, password: string) => Promise<{ error: string | null; role: Role | null }>;
  /** Real student login: anonymous Supabase session scoped to class + animal alias. */
  signInStudent: (classCode: string, studentId: string) => Promise<{ error: string | null }>;
  logout: () => void;
  bump: () => void;
}

const AppContext = createContext<AppState | null>(null);

const demoIdForRole: Record<Role, string> = {
  admin: DEMO_ADMIN_ID,
  teacher: DEMO_TEACHER_ID,
  student: DEMO_STUDENT_ID,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    // Restore a real Supabase session on page load / refresh.
    getCurrentDbUser()
      .then((user) => { if (user) setCurrentUser(user); })
      .finally(() => setAuthReady(true));

    // Keep the store in sync when auth state changes externally.
    const supabase = getSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: string) => { if (event === "SIGNED_OUT") setCurrentUser(null); }
    );
    return () => subscription.unsubscribe();
  }, []);

  // ---- Demo mode ----
  const loginAs = useCallback((role: Role) => {
    setCurrentUser(getUser(demoIdForRole[role]) ?? null);
  }, []);

  const loginAsUser = useCallback((userId: string) => {
    setCurrentUser(getUser(userId) ?? null);
  }, []);

  // ---- Real auth ----
  const signIn = useCallback(async (email: string, password: string) => {
    const { user, error } = await signInTeacher(email, password);
    if (user) setCurrentUser(user);
    return { error, role: user?.role ?? null };
  }, []);

  const signInStudent = useCallback(async (classCode: string, studentId: string) => {
    const { user, error } = await signInStudentAuth(classCode, studentId);
    if (user) setCurrentUser(user);
    return { error };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    signOutSupabase(); // fire-and-forget — clears the Supabase session cookie
  }, []);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role: currentUser?.role ?? null,
        version,
        authReady,
        loginAs,
        loginAsUser,
        signIn,
        signInStudent,
        logout,
        bump,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
