"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { roleHome, roleLabel } from "./navConfig";
import { UserCog, Presentation, GraduationCap, ChevronDown, Check, type LucideIcon } from "lucide-react";
import type { Role } from "@/types";

const roles: Role[] = ["admin", "teacher", "student"];
const roleIcon: Record<Role, LucideIcon> = { admin: UserCog, teacher: Presentation, student: GraduationCap };

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
        {(() => { const I = roleIcon[role]; return <I className="h-4 w-4" aria-hidden />; })()}
        {!compact && <span>Viewing as {roleLabel[role]}</span>}
        <ChevronDown className="ml-auto h-4 w-4 opacity-60" aria-hidden />
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
              {(() => { const I = roleIcon[r]; return <I className="h-4 w-4" aria-hidden />; })()}
              {roleLabel[r]}
              {r === role && <Check className="ml-auto h-4 w-4 text-forest-600" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
