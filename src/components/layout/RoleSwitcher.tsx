"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { roleHome, roleLabel } from "./navConfig";
import {
  UserCog, Presentation, GraduationCap, ChevronDown, Check,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types";

const roles: Role[] = ["admin", "teacher", "student"];
const roleIcon: Record<Role, LucideIcon> = {
  admin: UserCog,
  teacher: Presentation,
  student: GraduationCap,
};

/**
 * Admin-only portal switcher. Lets Cameron preview the teacher and student
 * portals without changing his auth session. Only renders for admin users.
 */
export function RoleSwitcher({ currentPortal }: { currentPortal: Role }) {
  const { currentUser } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (currentUser?.role !== "admin") return null;

  const switchTo = (r: Role) => {
    setOpen(false);
    router.push(roleHome[r]);
  };

  const CurrentIcon = roleIcon[currentPortal];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-2xl bg-forest-50 px-3 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-100"
      >
        <CurrentIcon className="h-4 w-4" aria-hidden />
        <span>Viewing as {roleLabel[currentPortal]}</span>
        <ChevronDown className="ml-auto h-4 w-4 opacity-60" aria-hidden />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-full min-w-44 rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-black/5">
          <p className="px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-charcoal-soft">
            Preview portal
          </p>
          {roles.map((r) => {
            const Icon = roleIcon[r];
            return (
              <button
                key={r}
                onClick={() => switchTo(r)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-forest-50 ${
                  r === currentPortal ? "font-bold text-forest-800" : "text-charcoal"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {roleLabel[r]}
                {r === currentPortal && (
                  <Check className="ml-auto h-4 w-4 text-forest-600" aria-hidden />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
