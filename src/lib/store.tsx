"use client";
/*
 * App-wide client store.
 *
 * Holds the "current user" (role switcher / demo login) and a version counter
 * that bumps whenever the mock db mutates, so lists re-render after create
 * actions. When Firebase Auth lands, `currentUser` would be hydrated from the
 * auth session instead of the demo picker, and `bump()` would be replaced by
 * Firestore's real-time listeners.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Role, User } from "@/types";
import { getUser } from "./dataService";
import { DEMO_ADMIN_ID, DEMO_TEACHER_ID, DEMO_STUDENT_ID } from "@/data/people";

interface AppState {
  currentUser: User | null;
  role: Role | null;
  version: number;
  loginAs: (role: Role) => void;
  loginAsUser: (userId: string) => void;
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
  const [version, setVersion] = useState(0);

  const loginAs = useCallback((role: Role) => {
    const user = getUser(demoIdForRole[role]) ?? null;
    setCurrentUser(user);
  }, []);

  const loginAsUser = useCallback((userId: string) => {
    setCurrentUser(getUser(userId) ?? null);
  }, []);

  const logout = useCallback(() => setCurrentUser(null), []);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        role: currentUser?.role ?? null,
        version,
        loginAs,
        loginAsUser,
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
