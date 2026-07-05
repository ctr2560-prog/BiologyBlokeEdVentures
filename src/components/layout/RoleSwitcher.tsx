"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { roleHome, roleLabel } from "./navConfig";
import type { Role } from "@/types";

const roles: Role[] = ["admin", "teacher", "student"];
const roleEmoji: Record<Role, string> = { admin: "🧑‍💼", teacher: "👩‍🏫", student: "🎓" };

/**
 * Lets you preview Admin / Teacher / Student without full auth. Under Firebase
 * Auth this would be replaced by real sessions + custom claims for role.
 */
export function RoleSwitcher({ compact = false }: { compact?: boolean }) {
  const { role, loginAs } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const switchTo = (r: Role) => {
    loginAs(r);
    setOpen(false);
    router.push(roleHome[r]);
  };

  if (!role) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-2xl bg-forest-50 px-3 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-100"
      >
        <span>{roleEmoji[role]}</span>
        {!compact && <span>Viewing as {roleLabel[role]}</span>}
        <span className="ml-auto text-xs opacity-60">▼</span>
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-full min-w-44 rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-black/5">
          <p className="px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-charcoal-soft">
            Preview role
          </p>
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => switchTo(r)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-forest-50 ${
                r === role ? "font-bold text-forest-800" : "text-charcoal"
              }`}
            >
              <span>{roleEmoji[r]}</span>
              {roleLabel[r]}
              {r === role && <span className="ml-auto text-forest-600">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
